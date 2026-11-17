<?php
declare(strict_types=1);
defined('LOGIK_FORM') || exit;

// Capas antispam 3.2 (sello firmado) y 3.5 (contenido). El origen (3.1) está en bootstrap.php,
// el honeypot (3.3) y los límites (3.4) en enviar.php. Cada bloqueo tiene un código estable que
// se registra en el log y está explicado en docs/formulario.md.

const LF_SELLO_MIN = 3;        // segundos mínimos entre el sello y el envío
const LF_SELLO_MAX = 7200;     // 2 horas: después, 409 sello_caducado

/** Crea un sello {ts, nonce, firma}. */
function lf_sello_nuevo(array $config): array
{
    $ts = time();
    $nonce = bin2hex(random_bytes(16));
    return ['ts' => $ts, 'nonce' => $nonce, 'firma' => lf_firma($config, $ts, $nonce)];
}

function lf_firma(array $config, int $ts, string $nonce): string
{
    return hash_hmac('sha256', $ts . '|' . $nonce, (string) $config['clave_secreta']);
}

/**
 * Comprueba el sello recibido. Devuelve:
 * - null si es válido;
 * - 'caducado' si tiene más de 2 horas (409, no es spam);
 * - un código de spam en otro caso.
 * El nonce usado se comprueba aparte (lf_nonce_usado), porque depende del almacén.
 */
function lf_sello_comprobar(array $config, mixed $ts, mixed $nonce, mixed $firma): ?string
{
    if (!is_string($ts) || !is_string($nonce) || !is_string($firma)) {
        return 'sello_ausente';
    }
    if (!preg_match('/^\d{1,12}$/', $ts) || !preg_match('/^[a-f0-9]{32}$/', $nonce) || !preg_match('/^[a-f0-9]{64}$/', $firma)) {
        return 'sello_invalido';
    }
    if (!hash_equals(lf_firma($config, (int) $ts, $nonce), $firma)) {
        return 'firma_invalida';
    }
    $edad = time() - (int) $ts;
    if ($edad < LF_SELLO_MIN) {
        return 'demasiado_rapido';
    }
    if ($edad > LF_SELLO_MAX) {
        return 'caducado';
    }
    return null;
}

// --- 3.5 Contenido --------------------------------------------------------------------------

/** URL: http(s)://…, www.… o dominio con TLD seguido de ruta (ej.: ejemplo.com/oferta). */
const LF_URL = '~(?:https?://\S+|www\.\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/\S*)~iu';

/** Etiquetas HTML o BBCode: "<a" seguido de espacio o ">", "<script", "[url", "[link". */
const LF_ETIQUETA = '~<a[\s>]|<script|\[url|\[link~iu';

function lf_contar_urls(string $texto): int
{
    return (int) preg_match_all(LF_URL, $texto);
}

/** Proporción de letras fuera del alfabeto latino (0 si no hay letras). */
function lf_proporcion_no_latina(string $texto): float
{
    $letras = (int) preg_match_all('/\p{L}/u', $texto);
    if ($letras === 0) {
        return 0.0;
    }
    $latinas = (int) preg_match_all('/\p{Latin}/u', $texto);
    return ($letras - $latinas) / $letras;
}

/**
 * Aplica las reglas de contenido a los campos de texto recibidos ($campos: nombre => valor).
 * Devuelve el código de spam o null. $mensaje y $nombres indican qué campos tienen reglas propias.
 */
function lf_contenido_spam(array $campos, array $mensaje, array $nombres): ?string
{
    foreach ($campos as $nombre => $valor) {
        if (!is_string($valor)) {
            continue;
        }
        if (!mb_check_encoding($valor, 'UTF-8')) {
            return 'utf8_invalido';
        }
        if (preg_match(LF_ETIQUETA, $valor)) {
            return 'etiqueta_html';
        }
        $esMensaje = in_array($nombre, $mensaje, true);
        $urls = lf_contar_urls($valor);
        if (!$esMensaje && $urls > 0) {
            return 'url_en_campo';
        }
        if ($esMensaje && $urls >= 2) {
            return 'urls_mensaje';
        }
        if (($esMensaje || in_array($nombre, $nombres, true)) && lf_proporcion_no_latina($valor) > 0.40) {
            return 'alfabeto';
        }
    }
    return null;
}
