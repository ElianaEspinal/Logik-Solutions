<?php
declare(strict_types=1);
defined('LOGIK_FORM') || exit;

// Arranque común de token.php y enviar.php: errores al log (nunca en pantalla), cabeceras de
// respuesta JSON, carga y comprobación de config.php y registro de motivos sin datos personales.
// Explicación completa: docs/formulario.md.

ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

/** Envía la respuesta JSON con las cabeceras obligatorias y termina. */
function lf_responder(int $estado, array $datos): never
{
    if (!headers_sent()) {
        http_response_code($estado);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: no-store');
        header_remove('X-Powered-By');
    }
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Registra un evento (bloqueo, descarte, fallo) con fecha y código. Nunca datos personales ni IP. */
function lf_log(string $codigo, string $detalle = ''): void
{
    $linea = '[logik-form] ' . gmdate('Y-m-d\TH:i:s\Z') . ' ' . $codigo;
    if ($detalle !== '') {
        $linea .= ' ' . preg_replace('/[^A-Za-z0-9 ._:\/=-]/', '', $detalle);
    }
    error_log($linea);
}

/**
 * Lee config.php. Si falta o está incompleto, se registra y se responde 502 (el visitante ve el
 * teléfono y el correo): nunca se pierde el aviso de que algo va mal.
 */
function lf_config(): array
{
    if (!is_file(__DIR__ . '/../config.php')) {
        lf_log('config_ausente');
        lf_responder(502, ['ok' => false, 'codigo' => 'config', 'mensaje' => lf_texto(lf_idioma_peticion(), 'fallo_envio')]);
    }
    $c = require __DIR__ . '/../config.php';
    $obligatorios = ['modo', 'host', 'puerto', 'cifrado', 'usuario', 'contrasena', 'from', 'nombre_remitente', 'to',
        'dominios_permitidos', 'clave_secreta', 'max_archivos', 'max_por_archivo', 'max_total', 'limite_ip_hora', 'limite_global_hora'];
    $faltan = is_array($c) ? array_diff($obligatorios, array_keys($c)) : $obligatorios;
    $clave = is_array($c) ? (string) ($c['clave_secreta'] ?? '') : '';
    if ($faltan || !in_array($c['modo'], ['test', 'smtp'], true) || strlen($clave) < 32 || !is_array($c['dominios_permitidos'])) {
        lf_log('config_invalida', implode(',', $faltan));
        lf_responder(502, ['ok' => false, 'codigo' => 'config', 'mensaje' => lf_texto(lf_idioma_peticion(), 'fallo_envio')]);
    }
    return $c;
}

/** Idioma de la petición: solo "ca" o "es" (por defecto, catalán). */
function lf_idioma_peticion(): string
{
    $i = $_POST['idioma'] ?? '';
    return $i === 'es' ? 'es' : 'ca';
}

/** IP del visitante como HMAC con la clave secreta (nunca se guarda en claro). */
function lf_ip_hash(array $config): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    return hash_hmac('sha256', 'ip|' . $ip, (string) $config['clave_secreta']);
}

/**
 * Comprueba el origen (capa 3.1): cabecera Origin o, si no hay, Referer. Debe ser https y de un
 * dominio de config. localhost (http o https) solo en modo "test".
 */
function lf_origen_valido(array $config): bool
{
    $origen = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origen === '' || $origen === 'null') {
        $origen = (string) ($_SERVER['HTTP_REFERER'] ?? '');
    }
    if ($origen === '') {
        return false;
    }
    $partes = parse_url($origen);
    if (!is_array($partes) || !isset($partes['scheme'], $partes['host'])) {
        return false;
    }
    $esquema = strtolower($partes['scheme']);
    $host = strtolower($partes['host']);
    if ($config['modo'] === 'test' && in_array($host, ['localhost', '127.0.0.1', '[::1]', '::1'], true)) {
        return $esquema === 'http' || $esquema === 'https';
    }
    if ($esquema !== 'https') {
        return false;
    }
    foreach ($config['dominios_permitidos'] as $dominio) {
        if ($host === strtolower((string) $dominio)) {
            return true;
        }
    }
    return false;
}
