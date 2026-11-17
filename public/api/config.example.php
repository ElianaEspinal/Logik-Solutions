<?php
declare(strict_types=1);
defined('LOGIK_FORM') || exit;

// Plantilla de configuración del formulario. NO lleva credenciales reales.
// En el servidor: copia este archivo como config.php en la misma carpeta (web/api/) y rellena
// la contraseña y una clave secreta nueva. config.php nunca va al repositorio ni a dist/.
// Explicación de cada campo: docs/formulario.md.

return [
    // "smtp" en el servidor. "test" solo en local: no envía nada y guarda el correo como .eml.
    'modo' => 'smtp',

    // Servidor de correo (buzón exclusivo de la web).
    'host' => 'smtp.logiksolutions.es',
    'puerto' => 587,            // 587 con STARTTLS ("tls") o 465 con SSL/TLS ("ssl")
    'cifrado' => 'tls',         // obligatorio: "tls" o "ssl"
    'usuario' => 'web@logiksolutions.es',
    'contrasena' => 'ESCRIBE-AQUI-LA-CONTRASENA-DEL-BUZON-WEB',

    // Remitente y destinatario. El correo del cliente va solo en Reply-To.
    'from' => 'web@logiksolutions.es',
    'nombre_remitente' => 'Web Logik Solutions',
    'to' => 'info@logiksolutions.es',

    // Dominios desde los que se aceptan envíos (https). localhost solo se acepta en modo "test".
    'dominios_permitidos' => ['logiksolutions.es', 'www.logiksolutions.es'],

    // Clave secreta: 64 caracteres hexadecimales. Genera una nueva para cada servidor con:
    //   php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
    'clave_secreta' => 'GENERA-UNA-CLAVE-NUEVA-DE-64-CARACTERES-HEXADECIMALES-AQUI-000000',

    // Adjuntos
    'max_archivos' => 5,
    'max_por_archivo' => 20 * 1024 * 1024,   // 20 MB
    'max_total' => 20 * 1024 * 1024,         // 20 MB

    // Límites de envíos correctos por hora
    'limite_ip_hora' => 5,
    'limite_global_hora' => 40,

    // Solo modo "test": carpeta donde se guardan los .eml (vacío = carpeta temporal del sistema).
    'carpeta_test' => '',

    // Solo modo "test": "con_adjuntos" simula que el servidor de correo rechaza los mensajes con
    // adjuntos, para probar el reintento sin adjuntos. Vacío = sin simulación. En modo "smtp" no tiene efecto.
    'simular_fallo' => '',
];
