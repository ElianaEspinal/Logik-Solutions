<?php
declare(strict_types=1);
defined('LOGIK_FORM') || exit;

// Validación de los datos (apartado 4). Lista cerrada de campos por formulario: todo lo demás se
// ignora. Las opciones de los campos de selección salen de opciones.php, que genera el build con
// los mismos textos de la web (src/config/form-options.mjs), así nunca se desincronizan.
// Los errores de aquí son de una persona (422), no spam.

/** Campos de texto comunes a todos los formularios (además de los de cada formulario). */
const LF_CAMPOS_COMUNES = ['origen', 'idioma', 'pagina', 'consentiment', 'utm_source', 'utm_medium', 'utm_campaign', 'gclid'];

/**
 * Campos de cada formulario. Tipos: nombre, email, telefono, texto (con máximo), mensaje,
 * opcion (lista cerrada de opciones.php), importe. 'req' => obligatorio.
 */
const LF_FORMULARIOS = [
    'contacte' => [
        'perfil' => ['tipo' => 'opcion', 'req' => true],
        'necessitat' => ['tipo' => 'opcion', 'req' => true],
        'localitat' => ['tipo' => 'texto', 'max' => 80],
        'nom' => ['tipo' => 'nombre', 'req' => true],
        'email' => ['tipo' => 'email', 'req' => true],
        // Obligatorio salvo si prefiere que le contacten por correo (preferencia_contacte = correu).
        'telefon' => ['tipo' => 'telefono', 'req' => true],
        'preferencia_contacte' => ['tipo' => 'opcion'],
        'missatge' => ['tipo' => 'mensaje'],
    ],
    'home-cierre' => [
        'perfil' => ['tipo' => 'opcion', 'req' => true],
        'nom' => ['tipo' => 'nombre', 'req' => true],
        'telefon' => ['tipo' => 'telefono', 'req' => true],
        'email' => ['tipo' => 'email'],
    ],
    'calculadora' => [
        'perfil' => ['tipo' => 'opcion', 'req' => true],
        'subministrament' => ['tipo' => 'opcion', 'req' => true],
        'activitat' => ['tipo' => 'opcion'],
        'import_mensual' => ['tipo' => 'importe', 'req' => true],
        'potencia' => ['tipo' => 'opcion'],
        'interes_solar' => ['tipo' => 'opcion'],
        'franja_import' => ['tipo' => 'opcion'],
        'tramit_interes' => ['tipo' => 'opcion'],
        'nom' => ['tipo' => 'nombre', 'req' => true],
        'cognoms' => ['tipo' => 'nombre', 'req' => true],
        'email' => ['tipo' => 'email', 'req' => true],
        'telefon' => ['tipo' => 'telefono', 'req' => true],
    ],
];

/** Campos que son "mensaje" (texto libre largo) y "nombre" para las reglas antispam 3.5. */
const LF_CAMPOS_MENSAJE = ['missatge'];
const LF_CAMPOS_NOMBRE = ['nom', 'cognoms'];

/** Nombre del formulario recibido, o '' si no es uno de los conocidos. */
function lf_formulario(): string
{
    $f = $_POST['origen'] ?? '';
    return is_string($f) && isset(LF_FORMULARIOS[$f]) ? $f : '';
}

/** Valores de texto recibidos de la lista cerrada (sin ningún otro campo). */
function lf_campos_recibidos(string $formulario): array
{
    $nombres = array_merge(LF_CAMPOS_COMUNES, array_keys(LF_FORMULARIOS[$formulario] ?? []));
    $campos = [];
    foreach ($nombres as $n) {
        if (isset($_POST[$n]) && is_string($_POST[$n])) {
            $campos[$n] = $_POST[$n];
        }
    }
    return $campos;
}

/** Una línea: sin caracteres de control ni saltos de línea (van a cabeceras o a una sola línea). */
function lf_linea(string $v): string
{
    $v = preg_replace('/[\p{Cc}\p{Zl}\p{Zp}\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2066}-\x{2069}]+/u', ' ', $v) ?? '';
    return trim(preg_replace('/ {2,}/', ' ', $v) ?? '');
}

/** Texto largo: conserva los saltos de línea, quita el resto de caracteres de control. */
function lf_parrafo(string $v): string
{
    $v = str_replace(["\r\n", "\r"], "\n", $v);
    $v = preg_replace('/[^\P{Cc}\n]|[\x{202A}-\x{202E}\x{2066}-\x{2069}]/u', '', $v) ?? '';
    return trim($v);
}

/** Teléfono: 9 a 15 dígitos tras quitar espacios, puntos, guiones, paréntesis y un "+" inicial. */
function lf_telefono_valido(string $v): bool
{
    $s = preg_replace('/[\s.\-()]/u', '', $v) ?? '';
    if (str_starts_with($s, '+')) {
        $s = substr($s, 1);
    }
    return (bool) preg_match('/^\d{9,15}$/', $s);
}

/** Importe mensual escrito a mano ("1.250,50", "95.5", "120"). Devuelve el número o null. */
function lf_importe(string $v): ?float
{
    $s = preg_replace('/[€\s]/u', '', $v) ?? '';
    if ($s === '') {
        return null;
    }
    if (str_contains($s, ',')) {
        $s = str_replace(['.', ','], ['', '.'], $s);
    } elseif (preg_match('/^\d{1,3}(\.\d{3})+$/', $s)) {
        $s = str_replace('.', '', $s);
    }
    if (!preg_match('/^\d+(\.\d+)?$/', $s)) {
        return null;
    }
    $n = (float) $s;
    return $n > 0 && $n <= 1000000 ? $n : null;
}

/**
 * Valida el formulario. Devuelve [datos, errores]: datos limpios (nombre => valor) y errores por
 * campo (nombre => mensaje en el idioma del formulario).
 */
function lf_validar(string $formulario, array $campos, array $opciones, string $idioma): array
{
    $datos = [];
    $errores = [];
    $t = static fn (string $k): string => lf_texto($idioma, $k);

    if ($formulario === '') {
        return [[], ['origen' => $t('errores')]];
    }
    $datos['origen'] = $formulario;
    $datos['idioma'] = $idioma;

    $pagina = lf_linea($campos['pagina'] ?? '');
    if ($pagina !== '' && (strlen($pagina) > 200 || !preg_match('#^/[a-z0-9/_-]*$#', $pagina))) {
        $errores['pagina'] = $t('pagina');
    }
    $datos['pagina'] = $pagina;

    foreach (['utm_source', 'utm_medium', 'utm_campaign', 'gclid'] as $n) {
        $v = mb_substr(preg_replace('/[^\w.\-~:|\/ ]/u', '', lf_linea($campos[$n] ?? '')) ?? '', 0, 150);
        if ($v !== '') {
            $datos[$n] = $v;
        }
    }

    $correoPreferido = $formulario === 'contacte' && ($campos['preferencia_contacte'] ?? '') === 'correu';

    foreach (LF_FORMULARIOS[$formulario] as $n => $regla) {
        $crudo = $campos[$n] ?? '';
        $req = !empty($regla['req']) && !($n === 'telefon' && $correoPreferido);
        $v = $regla['tipo'] === 'mensaje' ? lf_parrafo($crudo) : lf_linea($crudo);

        if ($v === '') {
            if ($req) {
                $errores[$n] = match ($regla['tipo']) {
                    'nombre' => $t($n === 'cognoms' ? 'cognoms' : 'nom'),
                    'email' => $t('email_obligatorio'),
                    'telefono' => $t('telefon_obligatorio'),
                    'opcion' => $t('opcion'),
                    'importe' => $t('import_mensual'),
                    default => $t('campo_obligatorio'),
                };
            }
            continue;
        }

        switch ($regla['tipo']) {
            case 'nombre':
                $len = mb_strlen($v);
                if ($len < 2 || $len > 80) {
                    $errores[$n] = $t($n === 'cognoms' ? 'cognoms' : 'nom');
                }
                break;
            case 'email':
                if (strlen($v) > 254 || filter_var($v, FILTER_VALIDATE_EMAIL) === false) {
                    $errores[$n] = $t('email');
                }
                break;
            case 'telefono':
                if (!lf_telefono_valido($v)) {
                    $errores[$n] = $t('telefon');
                }
                break;
            case 'texto':
                if (mb_strlen($v) > ($regla['max'] ?? 80)) {
                    $errores[$n] = $t($n);
                }
                break;
            case 'mensaje':
                if (mb_strlen($v) > 2000) {
                    $errores[$n] = $t('missatge');
                }
                break;
            case 'opcion':
                $lista = $opciones[$formulario][$n] ?? [];
                if (!array_key_exists($v, $lista)) {
                    $errores[$n] = $t('opcion');
                } else {
                    $v = (string) $lista[$v];
                }
                break;
            case 'importe':
                $num = lf_importe($v);
                if ($num === null) {
                    $errores[$n] = $t('import_mensual');
                } else {
                    $v = number_format($num, $num == floor($num) ? 0 : 2, ',', '.') . ' €/mes';
                }
                break;
        }
        $datos[$n] = $v;
    }

    if (($campos['consentiment'] ?? '') !== 'acceptat') {
        $errores['consentiment'] = $t('consentiment');
    }

    return [$datos, $errores];
}
