<?php
declare(strict_types=1);
defined('LOGIK_FORM') || exit;

// Textos de las respuestas (idioma del formulario) y del correo que recibe Logik.
// El teléfono y el correo son los de src/config/site.ts.

const LF_TELEFONO = '665 05 25 16';
const LF_EMAIL_CONTACTO = 'info@logiksolutions.es';

const LF_TEXTOS = [
    'ca' => [
        'fallo_envio' => "No hem pogut enviar el formulari. Truca'ns al 665 05 25 16 o escriu-nos a info@logiksolutions.es.",
        'limite' => "Hem rebut massa enviaments des de la teva connexió. Truca'ns al 665 05 25 16 i t'atendrem de seguida.",
        'demasiado_grande' => 'Els arxius pesen massa (màxim 20 MB en total). Envia el formulari sense la factura i fes-nos-la arribar a info@logiksolutions.es.',
        'metodo' => 'Mètode no permès.',
        'sello_caducado' => "La pàgina portava massa temps oberta. Torna-ho a provar.",
        'errores' => 'Revisa els camps marcats.',
        // Errores por campo (422)
        'campo_obligatorio' => 'Aquest camp és obligatori.',
        'nom' => 'Escriu el teu nom (entre 2 i 80 caràcters).',
        'cognoms' => 'Escriu els teus cognoms (entre 2 i 80 caràcters).',
        'email' => 'Revisa el correu: sembla que no és correcte.',
        'email_obligatorio' => 'Escriu el teu correu.',
        'telefon' => 'Escriu un telèfon de 9 a 15 xifres.',
        'telefon_obligatorio' => 'Escriu el teu telèfon.',
        'missatge' => 'El missatge pot tenir 2.000 caràcters com a màxim.',
        'localitat' => 'La localitat pot tenir 80 caràcters com a màxim.',
        'opcion' => 'Tria una de les opcions.',
        'import_mensual' => 'Escriu un import mensual vàlid.',
        'consentiment' => "Has d'acceptar la política de privacitat.",
        'pagina' => 'Pàgina d\'origen no vàlida.',
        // Correo
        'asunto' => 'Nou pre-estudi web: ',
        'titulo' => 'Nou pre-estudi des de la web',
        'formulario' => 'Formulari',
        'idioma' => 'Idioma',
        'pagina_origen' => "Pàgina d'origen",
        'fecha' => 'Data i hora',
        'privacidad' => 'Política de privacitat acceptada: sí',
        'adjuntos' => 'Factures adjuntes',
        'ninguno' => 'Cap',
        'descartados' => 'Arxius descartats (no s\'han adjuntat)',
        'aviso_descartados' => 'Demana al client que els enviï a info@logiksolutions.es si els necessites.',
        'aviso_no_enviados' => "ATENCIÓ: les factures adjuntes no s'han pogut enviar (possible límit de mida del correu). Demana-les al client:",
        'si' => 'Sí',
        'no' => 'No',
    ],
    'es' => [
        'fallo_envio' => 'No hemos podido enviar el formulario. Llámanos al 665 05 25 16 o escríbenos a info@logiksolutions.es.',
        'limite' => 'Hemos recibido demasiados envíos desde tu conexión. Llámanos al 665 05 25 16 y te atenderemos enseguida.',
        'demasiado_grande' => 'Los archivos pesan demasiado (máximo 20 MB en total). Envía el formulario sin la factura y háznosla llegar a info@logiksolutions.es.',
        'metodo' => 'Método no permitido.',
        'sello_caducado' => 'La página llevaba demasiado tiempo abierta. Vuelve a intentarlo.',
        'errores' => 'Revisa los campos marcados.',
        'campo_obligatorio' => 'Este campo es obligatorio.',
        'nom' => 'Escribe tu nombre (entre 2 y 80 caracteres).',
        'cognoms' => 'Escribe tus apellidos (entre 2 y 80 caracteres).',
        'email' => 'Revisa el correo: parece que no es correcto.',
        'email_obligatorio' => 'Escribe tu correo.',
        'telefon' => 'Escribe un teléfono de 9 a 15 cifras.',
        'telefon_obligatorio' => 'Escribe tu teléfono.',
        'missatge' => 'El mensaje puede tener 2.000 caracteres como máximo.',
        'localitat' => 'La localidad puede tener 80 caracteres como máximo.',
        'opcion' => 'Elige una de las opciones.',
        'import_mensual' => 'Escribe un importe mensual válido.',
        'consentiment' => 'Tienes que aceptar la política de privacidad.',
        'pagina' => 'Página de origen no válida.',
        'asunto' => 'Nuevo pre-estudio web: ',
        'titulo' => 'Nuevo pre-estudio desde la web',
        'formulario' => 'Formulario',
        'idioma' => 'Idioma',
        'pagina_origen' => 'Página de origen',
        'fecha' => 'Fecha y hora',
        'privacidad' => 'Política de privacidad aceptada: sí',
        'adjuntos' => 'Facturas adjuntas',
        'ninguno' => 'Ninguno',
        'descartados' => 'Archivos descartados (no se han adjuntado)',
        'aviso_descartados' => 'Pide al cliente que los envíe a info@logiksolutions.es si los necesitas.',
        'aviso_no_enviados' => 'ATENCIÓN: las facturas adjuntas no se han podido enviar (posible límite de tamaño del correo). Pídeselas al cliente:',
        'si' => 'Sí',
        'no' => 'No',
    ],
];

/** Motivos de descarte de adjuntos: código => texto claro por idioma. */
const LF_MOTIVOS = [
    'ca' => [
        'subida' => "no s'ha pogut rebre bé",
        'vacio' => 'és buit',
        'tamano' => 'pesa més de 20 MB',
        'total' => 'se supera el màxim de 20 MB en total',
        'cantidad' => 'només s\'admeten 5 arxius',
        'tipo' => 'format no admès (només PDF, JPG, PNG o WEBP)',
        'extension' => "l'extensió no correspon al contingut",
        'imagen' => "la imatge no s'ha pogut llegir",
        'imagen_pequena' => 'la imatge és massa petita',
        'imagen_memoria' => 'la imatge és massa gran per processar-la',
        'imagen_regenerar' => "la imatge no s'ha pogut processar",
        'pdf_formato' => 'el PDF no és vàlid',
        'pdf_contenido' => 'el PDF conté elements actius (scripts, accions o arxius incrustats)',
        'pdf_cifrado' => 'el PDF està protegit o xifrat',
        'pdf_inspeccion' => "el PDF no s'ha pogut revisar del tot",
    ],
    'es' => [
        'subida' => 'no se ha podido recibir bien',
        'vacio' => 'está vacío',
        'tamano' => 'pesa más de 20 MB',
        'total' => 'se supera el máximo de 20 MB en total',
        'cantidad' => 'solo se admiten 5 archivos',
        'tipo' => 'formato no admitido (solo PDF, JPG, PNG o WEBP)',
        'extension' => 'la extensión no corresponde al contenido',
        'imagen' => 'la imagen no se ha podido leer',
        'imagen_pequena' => 'la imagen es demasiado pequeña',
        'imagen_memoria' => 'la imagen es demasiado grande para procesarla',
        'imagen_regenerar' => 'la imagen no se ha podido procesar',
        'pdf_formato' => 'el PDF no es válido',
        'pdf_contenido' => 'el PDF contiene elementos activos (scripts, acciones o archivos incrustados)',
        'pdf_cifrado' => 'el PDF está protegido o cifrado',
        'pdf_inspeccion' => 'el PDF no se ha podido revisar del todo',
    ],
];

function lf_texto(string $idioma, string $clave): string
{
    return LF_TEXTOS[$idioma][$clave] ?? LF_TEXTOS['ca'][$clave] ?? $clave;
}

function lf_motivo(string $idioma, string $codigo): string
{
    return LF_MOTIVOS[$idioma][$codigo] ?? $codigo;
}
