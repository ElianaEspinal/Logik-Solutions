<?php
declare(strict_types=1);
defined('LOGIK_FORM') || exit;

// Adjuntos (apartado 5). Regla general: un archivo que no pasa un control se DESCARTA y el
// formulario se envía igualmente sin él. Ante la duda, se descarta el archivo.
// - Nunca se guarda nada en carpetas accesibles por web: solo el temporal de PHP y archivos
//   regenerados en sys_get_temp_dir(), que se borran siempre (finally).
// - Nunca se usa el nombre original ni el tipo que envía el navegador.

/** Tipos admitidos (detectados con finfo sobre el contenido) => extensiones válidas. */
const LF_TIPOS = [
    'application/pdf' => ['pdf'],
    'image/jpeg' => ['jpg', 'jpeg'],
    'image/png' => ['png'],
    'image/webp' => ['webp'],
];

/** Nombres PDF que descartan el archivo (comparación exacta tras decodificar #xx). */
const LF_PDF_PROHIBIDOS = ['JavaScript', 'JS', 'Launch', 'EmbeddedFile', 'EmbeddedFiles', 'RichMedia', 'XFA',
    'SubmitForm', 'ImportData', 'GoToE', 'GoToR', 'AA', 'Encrypt'];

const LF_PDF_MAX_DESCOMPRIMIDO = 50 * 1024 * 1024;
const LF_PDF_MAX_SEGUNDOS = 5.0;

/** Nombre original saneado (solo para mostrarlo en el aviso de descartados). */
function lf_nombre_saneado(string $nombre): string
{
    $nombre = basename(str_replace('\\', '/', $nombre));
    $nombre = preg_replace('/[^A-Za-z0-9 ._-]/', '_', $nombre) ?? '';
    $nombre = trim(substr($nombre, 0, 60));
    return $nombre === '' ? 'arxiu' : $nombre;
}

/** Lista de archivos recibidos en "factura" o "factura[]", en orden. */
function lf_archivos_recibidos(): array
{
    $f = $_FILES['factura'] ?? null;
    if (!is_array($f) || !isset($f['name'], $f['tmp_name'], $f['error'], $f['size'])) {
        return [];
    }
    if (!is_array($f['name'])) {
        return [['name' => (string) $f['name'], 'tmp_name' => (string) $f['tmp_name'], 'error' => (int) $f['error'], 'size' => (int) $f['size']]];
    }
    $lista = [];
    foreach (array_keys($f['name']) as $i) {
        if (is_array($f['name'][$i])) {
            continue; // estructuras anidadas (factura[a][b]): no las genera el formulario
        }
        $lista[] = ['name' => (string) $f['name'][$i], 'tmp_name' => (string) ($f['tmp_name'][$i] ?? ''),
            'error' => (int) ($f['error'][$i] ?? UPLOAD_ERR_NO_FILE), 'size' => (int) ($f['size'][$i] ?? 0)];
    }
    return $lista;
}

/** memory_limit en bytes (PHP_INT_MAX si no hay límite). */
function lf_memoria_limite(): int
{
    $v = trim((string) ini_get('memory_limit'));
    if ($v === '' || $v === '-1') {
        return PHP_INT_MAX;
    }
    $n = (int) $v;
    return match (strtolower(substr($v, -1))) {
        'g' => $n * 1024 * 1024 * 1024,
        'm' => $n * 1024 * 1024,
        'k' => $n * 1024,
        default => $n,
    };
}

/**
 * Procesa los adjuntos. Devuelve:
 * - incluidos: [['ruta' => temporal, 'nombre' => factura-N.ext, 'mime' => tipo]]
 * - descartados: [['nombre' => saneado, 'codigo' => motivo]]
 * - temporales: rutas creadas aquí, que el llamante borra siempre (finally).
 */
function lf_procesar_adjuntos(array $config): array
{
    $incluidos = [];
    $descartados = [];
    $temporales = [];
    $total = 0;
    $n = 0;
    $max = (int) $config['max_archivos'];
    $maxArchivo = (int) $config['max_por_archivo'];
    $maxTotal = (int) $config['max_total'];

    foreach (lf_archivos_recibidos() as $i => $a) {
        if ($a['error'] === UPLOAD_ERR_NO_FILE && $a['name'] === '') {
            continue; // campo vacío
        }
        $nombre = lf_nombre_saneado($a['name']);
        $descartar = static function (string $codigo) use (&$descartados, $nombre): void {
            $descartados[] = ['nombre' => $nombre, 'codigo' => $codigo];
            lf_log('adjunto_descartado', $codigo);
        };

        if ($i >= $max) {
            $descartar('cantidad');
            continue;
        }
        if (in_array($a['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
            $descartar('tamano');
            continue;
        }
        if ($a['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($a['tmp_name'])) {
            $descartar('subida');
            continue;
        }
        $tamano = (int) filesize($a['tmp_name']);
        if ($tamano <= 0) {
            $descartar('vacio');
            continue;
        }
        if ($tamano > $maxArchivo) {
            $descartar('tamano');
            continue;
        }

        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($a['tmp_name']);
        if (!is_string($mime) || !isset(LF_TIPOS[$mime])) {
            $descartar('tipo');
            continue;
        }
        $ext = strtolower(pathinfo($a['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, LF_TIPOS[$mime], true)) {
            $descartar('extension');
            continue;
        }

        if ($mime === 'application/pdf') {
            $codigo = lf_pdf_inspeccionar($a['tmp_name']);
            if ($codigo !== null) {
                $descartar($codigo);
                continue;
            }
            $ruta = $a['tmp_name'];
            $extFinal = 'pdf';
            $mimeFinal = 'application/pdf';
        } else {
            $salida = @tempnam(sys_get_temp_dir(), 'lfi');
            if ($salida === false) {
                lf_log('imagen_temporal_fallo');
                $descartar('imagen_regenerar');
                continue;
            }
            $temporales[] = $salida;
            $codigo = lf_imagen_regenerar($a['tmp_name'], $mime, $salida);
            // La original se elimina siempre: solo se adjunta la regenerada.
            @unlink($a['tmp_name']);
            if ($codigo !== null) {
                $descartar($codigo);
                continue;
            }
            $ruta = $salida;
            $extFinal = $mime === 'image/png' ? 'png' : 'jpg';
            $mimeFinal = $mime === 'image/png' ? 'image/png' : 'image/jpeg';
        }

        $final = (int) filesize($ruta);
        if ($final > $maxArchivo) {
            $descartar('tamano');
            continue;
        }
        if ($total + $final > $maxTotal) {
            $descartar('total');
            continue;
        }
        $total += $final;
        $n++;
        $incluidos[] = ['ruta' => $ruta, 'original' => $nombre, 'nombre' => 'factura-' . $n . '.' . $extFinal, 'mime' => $mimeFinal];
    }

    return ['incluidos' => $incluidos, 'descartados' => $descartados, 'temporales' => $temporales];
}

// --- Imágenes -------------------------------------------------------------------------------

/**
 * Regenera la imagen con GD en $salida (JPG y WEBP -> JPEG calidad 85; PNG -> PNG).
 * Devuelve null si ha ido bien o el código de descarte.
 */
function lf_imagen_regenerar(string $origen, string $mime, string $salida): ?string
{
    $info = @getimagesize($origen);
    if (!is_array($info) || ($info['mime'] ?? '') !== $mime) {
        return 'imagen';
    }
    [$ancho, $alto] = $info;
    if ($ancho < 50 || $alto < 50) {
        return 'imagen_pequena';
    }
    if ($ancho * $alto * 5 > 0.6 * lf_memoria_limite()) {
        return 'imagen_memoria';
    }
    $cargar = ['image/jpeg' => 'imagecreatefromjpeg', 'image/png' => 'imagecreatefrompng', 'image/webp' => 'imagecreatefromwebp'][$mime];
    if (!function_exists($cargar) || !function_exists('imagejpeg') || !function_exists('imagepng')) {
        lf_log('gd_no_disponible', $mime);
        return 'imagen_regenerar';
    }

    $img = false;
    $lienzo = false;
    try {
        $img = @$cargar($origen);
        if ($img === false) {
            return 'imagen_regenerar';
        }
        if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
            $exif = @exif_read_data($origen);
            $orientacion = is_array($exif) ? (int) ($exif['Orientation'] ?? 1) : 1;
            $img = lf_orientar($img, $orientacion);
        }

        if ($mime === 'image/png') {
            imagealphablending($img, false);
            imagesavealpha($img, true);
            $ok = imagepng($img, $salida, 6);
        } else {
            // JPEG sin transparencia: se pinta sobre fondo blanco (WEBP con canal alfa).
            $w = imagesx($img);
            $h = imagesy($img);
            $lienzo = imagecreatetruecolor($w, $h);
            if ($lienzo === false) {
                return 'imagen_regenerar';
            }
            imagefill($lienzo, 0, 0, (int) imagecolorallocate($lienzo, 255, 255, 255));
            imagecopy($lienzo, $img, 0, 0, 0, 0, $w, $h);
            $ok = imagejpeg($lienzo, $salida, 85);
        }
        if (!$ok || !is_file($salida) || filesize($salida) === 0) {
            return 'imagen_regenerar';
        }
        return null;
    } catch (Throwable $e) {
        lf_log('imagen_error', get_class($e));
        return 'imagen_regenerar';
    } finally {
        if ($img instanceof GdImage) {
            imagedestroy($img);
        }
        if ($lienzo instanceof GdImage) {
            imagedestroy($lienzo);
        }
    }
}

/** Aplica la orientación EXIF (1 a 8). */
function lf_orientar(GdImage $img, int $o): GdImage
{
    $rotar = [3 => 180, 4 => 180, 5 => 270, 6 => 270, 7 => 90, 8 => 90][$o] ?? 0;
    if ($rotar !== 0) {
        $r = imagerotate($img, $rotar, 0);
        if ($r !== false) {
            imagedestroy($img);
            $img = $r;
        }
    }
    if (in_array($o, [2, 4, 5, 7], true)) {
        imageflip($img, IMG_FLIP_HORIZONTAL);
    }
    return $img;
}

// --- PDF ------------------------------------------------------------------------------------

/** Decodifica las secuencias #xx de un nombre PDF. */
function lf_pdf_nombre(string $n): string
{
    return preg_replace_callback('/#([0-9A-Fa-f]{2})/', static fn (array $m): string => chr((int) hexdec($m[1])), $n) ?? $n;
}

/**
 * Busca nombres prohibidos en un fragmento. Solo cuenta un nombre si le sigue un delimitador o
 * espacio (nombre completo). Devuelve 'Encrypt', otro nombre prohibido o null.
 */
function lf_pdf_buscar(string $texto): ?string
{
    if (!preg_match_all('~/([^\x00\x09\x0A\x0C\x0D\x20/\[\]()<>{}%]+)(?=[\x00\x09\x0A\x0C\x0D\x20/\[\]()<>{}%])~', $texto, $m)) {
        return null;
    }
    $encontrado = null;
    foreach ($m[1] as $crudo) {
        $nombre = lf_pdf_nombre($crudo);
        if ($nombre === 'Encrypt') {
            return 'Encrypt';
        }
        if ($encontrado === null && in_array($nombre, LF_PDF_PROHIBIDOS, true)) {
            $encontrado = $nombre;
        }
    }
    return $encontrado;
}

/** Filtros de un diccionario de flujo: lista de nombres, o null si es una referencia indirecta. */
function lf_pdf_filtros(string $dic): ?array
{
    if (!preg_match('~/Filter\s*(\[[^\]]*\]|/[^\s/\[\]()<>{}%]+|\d+\s+\d+\s+R)~', $dic, $m)) {
        return [];
    }
    if (preg_match('~^\d+\s+\d+\s+R$~', $m[1])) {
        return null;
    }
    preg_match_all('~/([^\s/\[\]()<>{}%]+)~', $m[1], $nombres);
    return array_map('lf_pdf_nombre', $nombres[1]);
}

/** El diccionario del flujo es un object stream (/Type /ObjStm). Un /Type indirecto cuenta como tal (ante la duda). */
function lf_pdf_es_objstm(string $dic): bool
{
    if (!preg_match_all('~/Type\s*(/[^\s/\[\]()<>{}%]+|\d+\s+\d+\s+R)~', $dic, $m)) {
        return false;
    }
    foreach ($m[1] as $valor) {
        if ($valor[0] !== '/' || lf_pdf_nombre(substr($valor, 1)) === 'ObjStm') {
            return true;
        }
    }
    return false;
}

/**
 * Inspecciona un PDF. Devuelve null si se puede adjuntar o el código de descarte:
 * pdf_formato, pdf_cifrado, pdf_contenido o pdf_inspeccion.
 */
function lf_pdf_inspeccionar(string $ruta): ?string
{
    $pdf = @file_get_contents($ruta);
    if (!is_string($pdf) || !str_starts_with($pdf, '%PDF-') || !str_contains($pdf, '%%EOF')) {
        return 'pdf_formato';
    }
    $inicio = microtime(true);
    $descomprimido = 0;
    $esqueleto = '';   // el PDF sin los datos de los flujos
    $pos = 0;
    $hallado = null;

    // Recorre los flujos: "stream" + salto de línea ... "endstream".
    while (preg_match('~(?<!end)stream\r?\n~', $pdf, $m, PREG_OFFSET_CAPTURE, $pos)) {
        $kw = $m[0][1];
        $datosIni = $kw + strlen($m[0][0]);
        $fin = strpos($pdf, 'endstream', $datosIni);
        if ($fin === false) {
            return 'pdf_formato';
        }
        $esqueleto .= substr($pdf, $pos, $datosIni - $pos);
        // Diccionario del flujo: desde el último "obj" anterior (máximo 4 KB hacia atrás).
        $base = max(0, $kw - 4096);
        $ventana = substr($pdf, $base, $kw - $base);
        $obj = strrpos($ventana, 'obj');
        $dic = $obj === false ? $ventana : substr($ventana, $obj);
        $datos = substr($pdf, $datosIni, $fin - $datosIni);
        $pos = $fin;

        // Regla: los nombres peligrosos solo pueden estar en los objetos fuera de flujos (el
        // esqueleto, que se revisa entero) y dentro de los flujos /Type /ObjStm. Un ObjStm que no se
        // puede revisar descarta el PDF; cualquier otro flujo que no se puede revisar se omite.
        $objStm = lf_pdf_es_objstm($dic);
        $filtros = lf_pdf_filtros($dic);
        $primero = $filtros[0] ?? '';
        $hallado = null;
        if ($filtros === []) {
            $hallado = lf_pdf_buscar($datos . ' ');
        } elseif ($filtros !== null && ($primero === 'FlateDecode' || $primero === 'Fl')
            && ($objStm || microtime(true) - $inicio <= LF_PDF_MAX_SEGUNDOS)) {
            $r = lf_pdf_inflar($datos, $descomprimido, $inicio);
            if (is_string($r) && str_starts_with($r, '!')) {
                // Fallo al descomprimir o límites superados.
                if ($objStm) {
                    return 'pdf_inspeccion';
                }
            } else {
                $hallado = $r;
            }
        } elseif ($objStm) {
            // ObjStm con /Filter indirecto, Flate detrás de otro filtro u otro filtro no soportado.
            return 'pdf_inspeccion';
        }
        // Resto de flujos con un filtro que no se revisa (ASCII85, LZW, DCT, Flate tras otro
        // filtro…): contenido de página, fuentes, imágenes, metadatos o XRef. Se omiten.
        if ($hallado !== null) {
            return $hallado === 'Encrypt' ? 'pdf_cifrado' : 'pdf_contenido';
        }
    }
    $esqueleto .= substr($pdf, $pos) . ' ';
    $hallado = lf_pdf_buscar($esqueleto);
    if ($hallado !== null) {
        return $hallado === 'Encrypt' ? 'pdf_cifrado' : 'pdf_contenido';
    }
    return null;
}

/**
 * Descomprime un flujo FlateDecode por partes y busca nombres prohibidos en el resultado.
 * Respeta los límites globales (50 MB descomprimidos y 5 s por archivo).
 * Devuelve el nombre prohibido hallado, null si está limpio o "!motivo" si no se puede revisar.
 */
function lf_pdf_inflar(string $datos, int &$descomprimido, float $inicio): ?string
{
    foreach ([ZLIB_ENCODING_DEFLATE, ZLIB_ENCODING_RAW] as $codificacion) {
        $ctx = @inflate_init($codificacion);
        if ($ctx === false) {
            return '!zlib';
        }
        $cola = '';
        $error = false;
        $hallado = null;
        $parcial = 0;
        for ($i = 0, $len = strlen($datos); $i < $len; $i += 8192) {
            $salida = @inflate_add($ctx, substr($datos, $i, 8192), ZLIB_SYNC_FLUSH);
            if ($salida === false) {
                $error = true;
                break;
            }
            $parcial += strlen($salida);
            if ($descomprimido + $parcial > LF_PDF_MAX_DESCOMPRIMIDO) {
                return '!limite';
            }
            if (microtime(true) - $inicio > LF_PDF_MAX_SEGUNDOS) {
                return '!tiempo';
            }
            $trozo = $cola . $salida;
            $hallado = lf_pdf_buscar($trozo);
            if ($hallado === 'Encrypt') {
                break;
            }
            if ($hallado !== null) {
                break;
            }
            $cola = substr($trozo, -128);
            if (inflate_get_status($ctx) === ZLIB_STREAM_END) {
                break;
            }
        }
        if ($error && $parcial === 0 && $codificacion === ZLIB_ENCODING_DEFLATE) {
            continue; // prueba sin cabecera zlib
        }
        if ($error) {
            return '!datos';
        }
        $descomprimido += $parcial;
        if ($hallado === null) {
            $hallado = lf_pdf_buscar($cola . ' ');
        }
        return $hallado;
    }
    return '!datos';
}
