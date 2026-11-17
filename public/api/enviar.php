<?php
declare(strict_types=1);

// Recibe los formularios de la web y los envía por correo a Logik (docs/formulario.md).
// Orden: método -> tamaño -> origen -> sello -> honeypot -> límites -> contenido -> validación
// -> adjuntos -> correo. El spam recibe un 200 {ok:true} falso: no se envía nada.

define('LOGIK_FORM', true);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/textos.php';
require __DIR__ . '/lib/almacen.php';
require __DIR__ . '/lib/antispam.php';
require __DIR__ . '/lib/validacion.php';
require __DIR__ . '/lib/adjuntos.php';
require __DIR__ . '/lib/correo.php';

/** Respuesta de spam: 200 {ok:true} falso, sin enviar nada. Solo se registra el código. */
function lf_spam(string $codigo): never
{
    lf_log('spam', $codigo);
    lf_responder(200, ['ok' => true]);
}

// --- Método y tamaño ------------------------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    lf_responder(405, ['ok' => false, 'codigo' => 'metodo', 'mensaje' => lf_texto(lf_idioma_peticion(), 'metodo')]);
}

$longitud = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
$maxPost = (static function (): int {
    $v = trim((string) ini_get('post_max_size'));
    $n = (int) $v;
    return match (strtolower(substr($v, -1))) {
        'g' => $n * 1024 * 1024 * 1024,
        'm' => $n * 1024 * 1024,
        'k' => $n * 1024,
        default => $n,
    };
})();
if (($maxPost > 0 && $longitud > $maxPost) || ($longitud > 0 && $_POST === [] && $_FILES === [])) {
    lf_log('demasiado_grande');
    // Sin $_POST no se sabe el idioma: mensaje en los dos.
    lf_responder(413, ['ok' => false, 'codigo' => 'demasiado_grande',
        'mensaje' => lf_texto('ca', 'demasiado_grande') . ' / ' . lf_texto('es', 'demasiado_grande')]);
}

$config = lf_config();
$idioma = lf_idioma_peticion();
lf_seguro(static function () use ($config): void {
    lf_limpiar($config);
}, null, 'limpiar');

// --- 3.1 Origen -----------------------------------------------------------------------------
if (!lf_origen_valido($config)) {
    lf_spam('origen');
}

// --- 3.2 Sello firmado y de un solo uso ------------------------------------------------------
$sello = lf_sello_comprobar($config, $_POST['ts'] ?? null, $_POST['nonce'] ?? null, $_POST['firma'] ?? null);
if ($sello === 'caducado') {
    lf_log('sello_caducado');
    lf_responder(409, ['ok' => false, 'codigo' => 'sello_caducado', 'mensaje' => lf_texto($idioma, 'sello_caducado')]);
}
if ($sello !== null) {
    lf_spam($sello);
}
$nonce = (string) $_POST['nonce'];
if (lf_seguro(static fn (): bool => lf_nonce_usado($config, $nonce), false, 'nonce_leer')) {
    lf_spam('nonce_usado');
}

// --- 3.3 Honeypot ---------------------------------------------------------------------------
if (isset($_POST['website']) && (!is_string($_POST['website']) || trim($_POST['website']) !== '')) {
    lf_spam('honeypot');
}

// --- 3.4 Límites (cuentan solo los correos enviados) ------------------------------------------
$claveIp = 'e-' . lf_ip_hash($config);
if (lf_seguro(static fn (): int => lf_contar($config, $claveIp), 0, 'limite_ip') >= (int) $config['limite_ip_hora']) {
    lf_log('limite_ip');
    lf_responder(429, ['ok' => false, 'codigo' => 'limite', 'mensaje' => lf_texto($idioma, 'limite')]);
}
if (lf_seguro(static fn (): int => lf_contar($config, 'global'), 0, 'limite_global') >= (int) $config['limite_global_hora']) {
    lf_log('limite_global');
    lf_responder(429, ['ok' => false, 'codigo' => 'limite', 'mensaje' => lf_texto($idioma, 'limite')]);
}

// --- 3.5 Contenido --------------------------------------------------------------------------
$formulario = lf_formulario();
$campos = lf_campos_recibidos($formulario);
$spam = lf_contenido_spam($campos, LF_CAMPOS_MENSAJE, LF_CAMPOS_NOMBRE);
if ($spam !== null) {
    lf_spam($spam);
}

// --- 4. Validación (errores de persona: 422) --------------------------------------------------
$opciones = require __DIR__ . '/lib/opciones.php';
[$datos, $errores] = lf_validar($formulario, $campos, is_array($opciones) ? $opciones : [], $idioma);
if ($errores) {
    lf_responder(422, ['ok' => false, 'codigo' => 'validacion', 'mensaje' => lf_texto($idioma, 'errores'), 'errores' => $errores]);
}

// --- 5 y 6. Adjuntos y correo -----------------------------------------------------------------
$adjuntos = ['incluidos' => [], 'descartados' => [], 'temporales' => []];
$enviado = 'fallo'; // 'ok', 'sin_adjuntos' (reintento sin adjuntos) o 'fallo'
try {
    $adjuntos = lf_procesar_adjuntos($config);
    $enviado = lf_enviar_correo($config, $datos, $adjuntos);
} catch (Throwable $e) {
    lf_log('error_interno', get_class($e));
} finally {
    foreach ($adjuntos['temporales'] as $tmp) {
        if (is_file($tmp)) {
            @unlink($tmp);
        }
    }
}

if ($enviado === 'fallo') {
    // El nonce NO se marca: el visitante puede reintentar con el mismo sello.
    lf_responder(502, ['ok' => false, 'codigo' => 'fallo_envio', 'mensaje' => lf_texto($idioma, 'fallo_envio')]);
}

lf_seguro(static function () use ($config, $nonce): void {
    lf_marcar_nonce($config, $nonce);
}, null, 'marcar_nonce');
lf_seguro(static function () use ($config, $claveIp): void {
    lf_anotar($config, $claveIp);
}, null, 'anotar_ip');
lf_seguro(static function () use ($config): void {
    lf_anotar($config, 'global');
}, null, 'anotar_global');

$respuesta = ['ok' => true];
if ($enviado === 'sin_adjuntos') {
    // Los datos han llegado, pero el correo solo salió sin los adjuntos (posible límite de tamaño).
    $respuesta['adjuntos_no_enviados'] = array_map(static fn (array $a): string => $a['original'], $adjuntos['incluidos']);
}
if ($adjuntos['descartados']) {
    $respuesta['descartados'] = array_map(static fn (array $d): array => [
        'nombre' => $d['nombre'],
        'codigo' => $d['codigo'],
        'motivo' => lf_motivo($idioma, $d['codigo']),
    ], $adjuntos['descartados']);
}
lf_responder(200, $respuesta);
