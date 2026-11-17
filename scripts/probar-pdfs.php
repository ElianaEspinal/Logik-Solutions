<?php
declare(strict_types=1);

// Pasa el inspector de PDF real del formulario (public/api/lib/adjuntos.php, el mismo código que
// usa el servidor) por todos los PDF de una carpeta. No imprime contenido de los PDF: solo nombre
// del archivo, resultado y código del motivo. Explicación de los códigos: docs/formulario.md.
//
// Uso:  C:\php\php.exe scripts/probar-pdfs.php C:\ruta\a\la\carpeta

if (PHP_SAPI !== 'cli') {
    exit;
}
$carpeta = $argv[1] ?? '';
if ($carpeta === '' || !is_dir($carpeta)) {
    fwrite(STDERR, "Uso: php scripts/probar-pdfs.php <carpeta con PDF>\n");
    exit(2);
}

define('LOGIK_FORM', true);
require __DIR__ . '/../public/api/lib/bootstrap.php';
require __DIR__ . '/../public/api/lib/textos.php';
require __DIR__ . '/../public/api/lib/adjuntos.php';
ini_set('log_errors', '0'); // el registro [logik-form] no hace falta aquí

$archivos = array_values(array_filter(
    scandir($carpeta) ?: [],
    static fn (string $f): bool => is_file($carpeta . DIRECTORY_SEPARATOR . $f) && strtolower(pathinfo($f, PATHINFO_EXTENSION)) === 'pdf',
));
$aceptados = 0;
$descartados = 0;
$ancho = max([20, ...array_map('mb_strlen', $archivos)]);

printf("%-{$ancho}s  %-11s  %s\n", 'Archivo', 'Resultado', 'Motivo');
printf("%s\n", str_repeat('-', $ancho + 30));
foreach ($archivos as $f) {
    $codigo = lf_pdf_inspeccionar($carpeta . DIRECTORY_SEPARATOR . $f);
    if ($codigo === null) {
        $aceptados++;
    } else {
        $descartados++;
    }
    $relleno = $ancho - mb_strlen($f) + strlen($f);
    printf("%-{$relleno}s  %-11s  %s\n", $f, $codigo === null ? 'aceptado' : 'descartado', $codigo ?? '-');
}
printf("\nAceptados: %d  Descartados: %d  Total: %d\n", $aceptados, $descartados, count($archivos));
