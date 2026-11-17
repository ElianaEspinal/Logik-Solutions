<?php
declare(strict_types=1);
defined('LOGIK_FORM') || exit;

// Almacén temporal (capas 3.2 y 3.4): nonces usados y contadores de envíos.
// - Vive en una subcarpeta de sys_get_temp_dir() con permisos 0700, fuera de la carpeta web.
// - Solo guarda marcas de tiempo, hashes HMAC de IP y nonces aleatorios: ningún dato personal.
// - Limpieza automática de todo lo que tenga más de 2 horas.
// - Si falla (no se puede escribir), NO bloquea: lanza LfAlmacenError, el llamante lo registra
//   y sigue con el resto de capas (un contacto legítimo perdido es peor que un límite desactivado).

const LF_VENTANA = 3600;       // límites por hora
const LF_RETENCION = 7200;     // limpieza: registros de más de 2 horas

final class LfAlmacenError extends RuntimeException
{
}

function lf_almacen_dir(array $config): string
{
    $sub = 'logik-form-' . substr(hash_hmac('sha256', 'carpeta', (string) $config['clave_secreta']), 0, 16);
    $dir = rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . $sub;
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        throw new LfAlmacenError('mkdir');
    }
    @chmod($dir, 0700);
    if (!is_writable($dir)) {
        throw new LfAlmacenError('no_escribible');
    }
    return $dir;
}

/**
 * Abre un registro (lista de marcas de tiempo) con bloqueo exclusivo, lo pasa por $fn y lo guarda.
 * $fn recibe las marcas de las últimas 2 horas y devuelve [nuevas_marcas, resultado].
 */
function lf_registro(array $config, string $nombre, callable $fn): mixed
{
    $ruta = lf_almacen_dir($config) . DIRECTORY_SEPARATOR . $nombre . '.json';
    $f = @fopen($ruta, 'c+');
    if ($f === false) {
        throw new LfAlmacenError('fopen');
    }
    try {
        if (!flock($f, LOCK_EX)) {
            throw new LfAlmacenError('flock');
        }
        $contenido = stream_get_contents($f);
        $marcas = json_decode($contenido === false || $contenido === '' ? '[]' : $contenido, true);
        $limite = time() - LF_RETENCION;
        $marcas = array_values(array_filter(is_array($marcas) ? $marcas : [], static fn ($t): bool => is_int($t) && $t > $limite));
        [$nuevas, $resultado] = $fn($marcas);
        ftruncate($f, 0);
        rewind($f);
        if (fwrite($f, json_encode(array_values($nuevas))) === false) {
            throw new LfAlmacenError('fwrite');
        }
        fflush($f);
        flock($f, LOCK_UN);
        return $resultado;
    } finally {
        fclose($f);
    }
}

/** Cuántos registros hay en la última hora. */
function lf_contar(array $config, string $nombre): int
{
    return lf_registro($config, $nombre, static function (array $marcas): array {
        $desde = time() - LF_VENTANA;
        return [$marcas, count(array_filter($marcas, static fn (int $t): bool => $t > $desde))];
    });
}

/** Añade un registro con la hora actual. */
function lf_anotar(array $config, string $nombre): void
{
    lf_registro($config, $nombre, static function (array $marcas): array {
        $marcas[] = time();
        return [$marcas, null];
    });
}

/** Nonce ya usado (solo se marca cuando el correo se ha enviado bien). */
function lf_nonce_usado(array $config, string $nonce): bool
{
    return is_file(lf_almacen_dir($config) . DIRECTORY_SEPARATOR . 'n-' . $nonce);
}

function lf_marcar_nonce(array $config, string $nonce): void
{
    if (@file_put_contents(lf_almacen_dir($config) . DIRECTORY_SEPARATOR . 'n-' . $nonce, '', LOCK_EX) === false) {
        throw new LfAlmacenError('nonce');
    }
}

/** Borra nonces y registros sin actividad en las últimas 2 horas. Se ejecuta de vez en cuando. */
function lf_limpiar(array $config): void
{
    $dir = lf_almacen_dir($config);
    $limite = time() - LF_RETENCION;
    foreach (scandir($dir) ?: [] as $nombre) {
        if ($nombre === '.' || $nombre === '..') {
            continue;
        }
        $ruta = $dir . DIRECTORY_SEPARATOR . $nombre;
        $mtime = @filemtime($ruta);
        if (is_file($ruta) && $mtime !== false && $mtime < $limite) {
            @unlink($ruta);
        }
    }
}

/** Ejecuta una operación del almacén; si falla, la registra y devuelve $porDefecto (no bloquea). */
function lf_seguro(callable $fn, mixed $porDefecto, string $que): mixed
{
    try {
        return $fn();
    } catch (Throwable $e) {
        lf_log('almacen_error', $que . ' ' . $e->getMessage());
        return $porDefecto;
    }
}
