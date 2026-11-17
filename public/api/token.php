<?php
declare(strict_types=1);

// Entrega el sello antispam {ts, nonce, firma} (capa 3.2). El formulario lo pide por POST en la
// primera interacción (focusin). POST y no GET: en un GET a la misma web el navegador no envía
// la cabecera Origin. Explicación: docs/formulario.md.

define('LOGIK_FORM', true);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/textos.php';
require __DIR__ . '/lib/almacen.php';
require __DIR__ . '/lib/antispam.php';

const LF_LIMITE_TOKEN_HORA = 30;

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    lf_responder(405, ['ok' => false, 'codigo' => 'metodo', 'mensaje' => lf_texto(lf_idioma_peticion(), 'metodo')]);
}

$config = lf_config();
$idioma = lf_idioma_peticion();

// Origen no permitido: se entrega un sello con firma falsa. El envío posterior se tratará como
// spam (200 falso), así el bot no sabe en qué paso ha fallado.
if (!lf_origen_valido($config)) {
    lf_log('token_origen');
    lf_responder(200, ['ts' => time(), 'nonce' => bin2hex(random_bytes(16)), 'firma' => bin2hex(random_bytes(32))]);
}

$ip = 't-' . lf_ip_hash($config);
$usados = lf_seguro(static fn (): int => lf_contar($config, $ip), 0, 'token_contar');
if ($usados >= LF_LIMITE_TOKEN_HORA) {
    lf_log('token_limite');
    lf_responder(429, ['ok' => false, 'codigo' => 'limite', 'mensaje' => lf_texto($idioma, 'limite')]);
}
lf_seguro(static function () use ($config, $ip): void {
    lf_anotar($config, $ip);
}, null, 'token_anotar');

lf_responder(200, lf_sello_nuevo($config));
