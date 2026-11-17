<?php
declare(strict_types=1);
defined('LOGIK_FORM') || exit;

// Correo (apartado 6): PHPMailer por SMTP autenticado, cifrado obligatorio y verificación del
// certificado activa (nunca se tocan las SMTPOptions). Nunca mail().
// Modo "test": no envía nada; guarda el .eml en una carpeta temporal fuera de la web.

use PHPMailer\PHPMailer\Exception as PHPMailerException;
use PHPMailer\PHPMailer\PHPMailer;

require __DIR__ . '/phpmailer/Exception.php';
require __DIR__ . '/phpmailer/PHPMailer.php';
require __DIR__ . '/phpmailer/SMTP.php';

/** Etiquetas de los campos en el correo, por idioma. */
const LF_ETIQUETAS = [
    'ca' => [
        'perfil' => 'Perfil', 'necessitat' => 'Necessitat', 'localitat' => 'Localitat', 'nom' => 'Nom',
        'cognoms' => 'Cognoms', 'email' => 'Correu', 'telefon' => 'Telèfon', 'preferencia_contacte' => 'Prefereix que el contactem per',
        'missatge' => 'Missatge', 'subministrament' => 'Subministrament', 'activitat' => 'Activitat',
        'import_mensual' => 'Import mensual', 'potencia' => 'Potència', 'interes_solar' => 'Interès en plaques solars',
        'franja_import' => 'Franja interna', 'tramit_interes' => "Tràmit d'interès", 'utm_source' => 'utm_source', 'utm_medium' => 'utm_medium',
        'utm_campaign' => 'utm_campaign', 'gclid' => 'gclid',
    ],
    'es' => [
        'perfil' => 'Perfil', 'necessitat' => 'Necesidad', 'localitat' => 'Localidad', 'nom' => 'Nombre',
        'cognoms' => 'Apellidos', 'email' => 'Correo', 'telefon' => 'Teléfono', 'preferencia_contacte' => 'Prefiere que le contactemos por',
        'missatge' => 'Mensaje', 'subministrament' => 'Suministro', 'activitat' => 'Actividad',
        'import_mensual' => 'Importe mensual', 'potencia' => 'Potencia', 'interes_solar' => 'Interés en placas solares',
        'franja_import' => 'Franja interna', 'tramit_interes' => 'Trámite de interés', 'utm_source' => 'utm_source', 'utm_medium' => 'utm_medium',
        'utm_campaign' => 'utm_campaign', 'gclid' => 'gclid',
    ],
];

const LF_NOMBRES_FORMULARIO = [
    'ca' => ['contacte' => 'Contacte', 'home-cierre' => "Inici (formulari final)", 'calculadora' => 'Pre-estudi per passos'],
    'es' => ['contacte' => 'Contacto', 'home-cierre' => 'Inicio (formulario final)', 'calculadora' => 'Pre-estudio por pasos'],
];

/** Escapa para HTML. Las URLs del mensaje quedan como texto (no se convierten en enlaces). */
function lf_h(string $v): string
{
    return htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
}

/** Para cabeceras: sin caracteres de control ni saltos de línea, y con longitud máxima. */
function lf_cabecera(string $v, int $max): string
{
    return mb_substr(lf_linea($v), 0, $max);
}

/**
 * Envía el correo. Si falla y llevaba adjuntos, reintenta UNA vez el mismo correo sin adjuntos y con
 * un aviso destacado (posible límite de tamaño del correo). Devuelve:
 * - 'ok': enviado con todo;
 * - 'sin_adjuntos': enviado en el reintento, sin los adjuntos;
 * - 'fallo': no se ha podido enviar.
 */
function lf_enviar_correo(array $config, array $datos, array $adjuntos): string
{
    if (lf_correo_intento($config, $datos, $adjuntos)) {
        return 'ok';
    }
    if ($adjuntos['incluidos'] === []) {
        return 'fallo';
    }
    lf_log('smtp_reintento_sin_adjuntos', (string) count($adjuntos['incluidos']));
    $sin = $adjuntos;
    $sin['no_enviados'] = array_map(static fn (array $a): string => $a['original'], $adjuntos['incluidos']);
    $sin['incluidos'] = [];
    if (lf_correo_intento($config, $datos, $sin)) {
        lf_log('enviado_sin_adjuntos', (string) count($sin['no_enviados']));
        return 'sin_adjuntos';
    }
    lf_log('smtp_fallo_sin_adjuntos');
    return 'fallo';
}

/**
 * Construye el correo y lo envía (smtp) o lo guarda como .eml (test).
 * Devuelve true si ha ido bien. Nunca lanza: los fallos se registran sin datos personales.
 */
function lf_correo_intento(array $config, array $datos, array $adjuntos): bool
{
    $idioma = $datos['idioma'];
    $t = static fn (string $k): string => lf_texto($idioma, $k);
    $nombreCompleto = trim(($datos['nom'] ?? '') . ' ' . ($datos['cognoms'] ?? ''));

    $mail = new PHPMailer(true);
    try {
        $mail->CharSet = PHPMailer::CHARSET_UTF8;
        $mail->Encoding = PHPMailer::ENCODING_BASE64;
        $mail->XMailer = ' '; // sin cabecera X-Mailer
        // Siempre SMTP (también en modo test: así el .eml lleva To y Subject como el correo real).
        $mail->isSMTP();
        $mail->SMTPDebug = 0;
        $mail->Debugoutput = static function (): void {
        };

        $mail->setFrom((string) $config['from'], lf_cabecera((string) $config['nombre_remitente'], 80), false);
        $mail->addAddress((string) $config['to']);
        if (($datos['email'] ?? '') !== '') {
            // El correo del cliente solo va en Reply-To, nunca en From.
            $mail->addReplyTo(lf_cabecera($datos['email'], 254), lf_cabecera($nombreCompleto, 80));
        }
        $mail->Subject = $t('asunto') . lf_cabecera($nombreCompleto, 80);

        [$html, $texto] = lf_cuerpo($datos, $adjuntos, $idioma);
        $mail->isHTML(true);
        $mail->Body = $html;
        $mail->AltBody = $texto;

        foreach ($adjuntos['incluidos'] as $a) {
            $mail->addAttachment($a['ruta'], $a['nombre'], PHPMailer::ENCODING_BASE64, $a['mime'], 'attachment');
        }

        if ($config['modo'] === 'test') {
            return lf_guardar_eml($config, $mail);
        }

        $cifrado = (string) $config['cifrado'];
        if (!in_array($cifrado, ['tls', 'ssl'], true)) {
            lf_log('smtp_config', 'cifrado');
            return false;
        }
        $mail->Host = (string) $config['host'];
        $mail->Port = (int) $config['puerto'];
        $mail->SMTPSecure = $cifrado === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->SMTPAutoTLS = true;
        $mail->SMTPAuth = true;
        $mail->Username = (string) $config['usuario'];
        $mail->Password = (string) $config['contrasena'];
        $mail->Timeout = 15;
        $mail->SMTPKeepAlive = false;
        // SMTPOptions no se toca: verify_peer y verify_peer_name siguen activos (por defecto).
        $mail->send();
        return true;
    } catch (PHPMailerException $e) {
        // El mensaje de PHPMailer no lleva datos del formulario; se recorta por si acaso.
        lf_log('smtp_fallo', substr(preg_replace('/\S+@\S+/', '[correo]', $e->getMessage()) ?? '', 0, 160));
        return false;
    } catch (Throwable $e) {
        lf_log('correo_error', get_class($e));
        return false;
    }
}

/** Modo test: guarda el mensaje MIME en una carpeta temporal fuera de dist/ y de public/. */
function lf_guardar_eml(array $config, PHPMailer $mail): bool
{
    // Solo pruebas locales: simula que el servidor de correo rechaza los mensajes con adjuntos
    // (por ejemplo, por tamaño), para probar el reintento sin adjuntos. En modo smtp no existe.
    if (($config['simular_fallo'] ?? '') === 'con_adjuntos' && $mail->attachmentExists()) {
        lf_log('test_fallo_simulado');
        return false;
    }
    if (!$mail->preSend()) {
        return false;
    }
    $dir = (string) ($config['carpeta_test'] ?? '');
    if ($dir === '') {
        $dir = rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'logik-form-test';
    }
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        lf_log('test_carpeta');
        return false;
    }
    $archivo = $dir . DIRECTORY_SEPARATOR . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.eml';
    return @file_put_contents($archivo, $mail->getSentMIMEMessage()) !== false;
}

/** Cuerpo en HTML sencillo y en texto plano, con todo el contenido escapado. */
function lf_cuerpo(array $datos, array $adjuntos, string $idioma): array
{
    $t = static fn (string $k): string => lf_texto($idioma, $k);
    $etq = LF_ETIQUETAS[$idioma];
    $fecha = (new DateTimeImmutable('now', new DateTimeZone('Europe/Madrid')))->format('d/m/Y H:i');

    $filas = [[$t('formulario'), LF_NOMBRES_FORMULARIO[$idioma][$datos['origen']] ?? $datos['origen']]];
    foreach ($etq as $campo => $etiqueta) {
        if (isset($datos[$campo]) && $datos[$campo] !== '') {
            $filas[] = [$etiqueta, $datos[$campo]];
        }
    }
    $filas[] = [$t('idioma'), $idioma === 'es' ? 'Castellano' : 'Català'];
    if (($datos['pagina'] ?? '') !== '') {
        $filas[] = [$t('pagina_origen'), $datos['pagina']];
    }
    $filas[] = [$t('fecha'), $fecha . ' (Europe/Madrid)'];

    $incl = array_map(static fn (array $a): string => $a['nombre'], $adjuntos['incluidos']);
    $desc = array_map(static fn (array $d): string => $d['nombre'] . ': ' . lf_motivo($idioma, $d['codigo']), $adjuntos['descartados']);

    $noEnviados = $adjuntos['no_enviados'] ?? [];

    // HTML
    $h = '<!doctype html><html><body style="font-family:Arial,sans-serif;color:#01323A;">';
    $h .= '<h1 style="font-size:20px;">' . lf_h($t('titulo')) . '</h1>';
    if ($noEnviados) {
        $h .= '<div style="margin:0 0 16px;padding:12px 16px;border-left:4px solid #C24B00;background:#FFEDE0;">'
            . '<p style="margin:0 0 8px;"><strong>' . lf_h($t('aviso_no_enviados')) . '</strong></p><ul style="margin:0;">';
        foreach ($noEnviados as $n) {
            $h .= '<li>' . lf_h($n) . '</li>';
        }
        $h .= '</ul></div>';
    }
    $h .= '<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;">';
    foreach ($filas as [$k, $v]) {
        $h .= '<tr><th align="left" valign="top" style="border-bottom:1px solid #E4EEEF;">' . lf_h($k) . '</th>'
            . '<td style="border-bottom:1px solid #E4EEEF;">' . nl2br(lf_h($v), false) . '</td></tr>';
    }
    $h .= '</table>';
    $h .= '<p><strong>' . lf_h($t('privacidad')) . '</strong></p>';
    $h .= '<p><strong>' . lf_h($t('adjuntos')) . ':</strong> ' . lf_h($incl ? implode(', ', $incl) : $t('ninguno')) . '</p>';
    if ($desc) {
        $h .= '<p><strong>' . lf_h($t('descartados')) . ':</strong></p><ul>';
        foreach ($desc as $d) {
            $h .= '<li>' . lf_h($d) . '</li>';
        }
        $h .= '</ul><p>' . lf_h($t('aviso_descartados')) . '</p>';
    }
    $h .= '</body></html>';

    // Texto plano
    $x = $t('titulo') . "\n\n";
    if ($noEnviados) {
        $x .= '*** ' . $t('aviso_no_enviados') . " ***\n- " . implode("\n- ", $noEnviados) . "\n\n";
    }
    foreach ($filas as [$k, $v]) {
        $x .= $k . ': ' . (str_contains($v, "\n") ? "\n" . $v : $v) . "\n";
    }
    $x .= "\n" . $t('privacidad') . "\n";
    $x .= $t('adjuntos') . ': ' . ($incl ? implode(', ', $incl) : $t('ninguno')) . "\n";
    if ($desc) {
        $x .= "\n" . $t('descartados') . ":\n- " . implode("\n- ", $desc) . "\n" . $t('aviso_descartados') . "\n";
    }
    return [$h, $x];
}
