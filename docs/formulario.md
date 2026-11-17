# Formulario: envío propio en PHP

Nov 16, 2026 · Claude Code para @Eliana

Los tres formularios de la web (contacto, cierre de la home y pre-estudi, en catalán y castellano) envían a un sistema propio en PHP alojado en la misma web. El visitante rellena el formulario y adjunta sus facturas, y todo llega por correo a `info@logiksolutions.es`, con los archivos adjuntos y descargables. No hay servicios externos, captchas, base de datos ni copia de los datos en el servidor. Está pensado para funcionar años sin mantenimiento.

## Cómo funciona

1. Al tocar el formulario por primera vez (`focusin`), el navegador pide un **sello** a `/api/token.php` (POST).
2. Al enviar, el navegador valida los datos, comprime las fotos y espera, si hace falta, a que hayan pasado 3,5 s desde el sello. Después envía todo por `fetch` a `/api/enviar.php`.
3. `enviar.php` aplica las capas de seguridad en este orden: método, tamaño, origen, sello, honeypot, límites, contenido, validación, adjuntos y correo.
4. Si todo va bien, manda un correo con PHPMailer por SMTP autenticado desde `web@logiksolutions.es` a `info@logiksolutions.es`, con `Reply-To` al correo del cliente. Al visitante no se le envía nada.
5. El navegador muestra el resultado. El evento `generate_lead` solo se lanza cuando el servidor responde `ok`.

Sin JavaScript no se puede enviar: el botón está desactivado y un aviso `<noscript>` da el teléfono 665 05 25 16 y el correo `info@logiksolutions.es`.

## Archivos

| Archivo | Para qué |
| --- | --- |
| `public/api/token.php` | Entrega el sello `{ts, nonce, firma}`. Comprueba el origen y tiene un límite de 30 sellos por IP y hora. |
| `public/api/enviar.php` | Recibe el formulario y aplica todas las capas. |
| `public/api/lib/bootstrap.php` | Respuestas JSON, registro de motivos, carga de `config.php` y comprobación del origen. |
| `public/api/lib/antispam.php` | Sello firmado y reglas de contenido. |
| `public/api/lib/almacen.php` | Contadores de envíos y nonces usados, en una carpeta temporal del sistema. |
| `public/api/lib/validacion.php` | Lista cerrada de campos por formulario y sus reglas. |
| `public/api/lib/adjuntos.php` | Controles de archivos, regeneración de imágenes e inspección de PDF. |
| `public/api/lib/correo.php` | Construcción del correo y envío por SMTP (o `.eml` en modo test). |
| `public/api/lib/textos.php` | Mensajes de respuesta y del correo en catalán y castellano. |
| `public/api/lib/phpmailer/` | PHPMailer 7.2.0 (`PHPMailer.php`, `SMTP.php`, `Exception.php` y la licencia LGPL 2.1), sin Composer. |
| `dist/api/lib/opciones.php` | **Lo genera el build** (`src/config/form-options.ts`) con las opciones válidas de cada desplegable y botón, sacadas de los mismos textos de la web. |
| `public/api/config.example.php` | Plantilla de configuración, sin credenciales. Va al repositorio. |
| `public/api/config.php` | Configuración real. **Nunca** va al repositorio (`.gitignore`) ni a `dist/`: el build lo borra de `dist/` si se cuela y `check:security` falla si lo encuentra. En el servidor se crea a mano. |
| `public/api/.htaccess` | Solo deja pedir `token.php` y `enviar.php`. Todo lo demás responde 403. |
| `public/.user.ini` | Límites de PHP: `upload_max_filesize=20M`, `post_max_size=24M`, `max_file_uploads=6` y errores fuera de pantalla. |
| Frontend | `src/scripts/form-send.ts` (sello, envío, reintento y compresión), `form-guard.ts` (avisos y mensajes), `file-drop.ts` y `src/components/file-drop.astro` (adjuntos). |

## Capas de seguridad

**Acceso directo.** Hay dos defensas: el `.htaccess` de `/api/` devuelve 403 a todo lo que no sea `token.php` o `enviar.php`, y cada PHP incluido empieza con la guarda `defined('LOGIK_FORM') || exit;`, así que, si se abre directamente, termina sin imprimir nada. El `.htaccess` raíz bloquea además `.user.ini` y los archivos ocultos. Los archivos de PHPMailer no llevan la guarda para no modificar la librería: abiertos directamente solo declaran clases y no imprimen nada.

**PHP.** Todos los archivos usan `declare(strict_types=1)` y funcionan con PHP 8.1 a 8.4. `display_errors` está siempre a 0 y los errores van al log. No se usan `eval`, `exec`, `system`, `shell_exec`, `passthru`, `proc_open`, `popen`, `mail()` ni `include`/`require` con rutas variables. `check:security` comprueba todo esto en cada build.

**Respuestas.** Siempre en JSON, con `Content-Type: application/json; charset=utf-8`, `X-Content-Type-Options: nosniff` y `Cache-Control: no-store`.

| Situación | Respuesta |
| --- | --- |
| Envío correcto | 200 `{ok:true}`. Si se descartó algún adjunto, añade `descartados` con el nombre saneado, el código y el motivo. |
| Datos mal rellenados | 422 con `errores` por campo, en el idioma del formulario. |
| Spam | 200 `{ok:true}` **falso**: no se envía nada y solo se registra el código. |
| Sello caducado (más de 2 horas) | 409 `{codigo:"sello_caducado"}`. El navegador pide un sello nuevo, espera 3,5 s y reintenta una vez solo. |
| Límite superado | 429, con el teléfono. |
| Petición demasiado grande | 413. |
| Fallo del correo | 502, con el teléfono y el correo. |
| Método distinto de POST | 405. |

### Antispam (invisible para el visitante)

| Capa | Regla | Código en el log |
| --- | --- | --- |
| 3.1 Origen | La cabecera `Origin` (o `Referer` si no hay `Origin`) debe ser https y de un dominio de `dominios_permitidos`. `localhost` solo en modo test. | `spam origen` (y `token_origen` en `token.php`, que entrega un sello falso) |
| 3.2 Sello | Falta el sello o tiene un formato incorrecto | `spam sello_ausente` / `spam sello_invalido` |
| | La firma HMAC-SHA256 de `ts` y `nonce` no coincide (`hash_equals`) | `spam firma_invalida` |
| | Han pasado menos de 3 s entre el sello y el envío | `spam demasiado_rapido` |
| | Han pasado más de 2 horas (no es spam: respuesta 409) | `sello_caducado` |
| | El nonce ya se usó. Solo se marca como usado cuando el correo sale bien, así que un reintento tras un fallo de SMTP funciona. | `spam nonce_usado` |
| 3.3 Honeypot | Llega relleno el campo `website`, que está oculto fuera de pantalla con `aria-hidden`, `tabindex="-1"` y `autocomplete="off"` | `spam honeypot` |
| 3.4 Límites | 5 correos enviados por IP y hora, y 40 en total por hora. Solo cuentan los envíos correctos: un 422 o un fallo de SMTP no gastan cupo. | `limite_ip` / `limite_global` (respuesta 429) |
| 3.5 Contenido | Una URL (`http`, `https`, `www.` o un dominio con ruta) en cualquier campo que no sea el mensaje | `spam url_en_campo` |
| | Dos o más URLs en el mensaje | `spam urls_mensaje` |
| | `<a` seguido de espacio o `>`, `<script`, `[url` o `[link` | `spam etiqueta_html` |
| | Más del 40 % de las letras del mensaje, del nombre o de los apellidos fuera del alfabeto latino | `spam alfabeto` |
| | Texto que no es UTF-8 válido | `spam utf8_invalido` |

Antes de enviar, el navegador avisa a la persona de las reglas de contenido (enlaces, símbolos `< >`, alfabeto) para que un contacto legítimo no se pierda en silencio.

**Almacenamiento temporal (3.4 y nonces).** Vive en una subcarpeta de `sys_get_temp_dir()` con permisos 0700, fuera de la web. Solo guarda marcas de tiempo, hashes HMAC de la IP (nunca la IP en claro) y nonces aleatorios. Lo que tiene más de 2 horas se borra solo. **Si el almacén falla, no se bloquea el formulario:** se registra `almacen_error` y se sigue con el resto de capas.

**Log.** Cada bloqueo o descarte se registra con `error_log`: fecha y código, sin datos personales ni IP. Las líneas empiezan por `[logik-form]`.

### Validación (422)

Hay una lista cerrada de campos por formulario (`LF_FORMULARIOS` en `validacion.php`) y cualquier otro campo se ignora.

- Nombre y apellidos: de 2 a 80 caracteres.
- Email: `filter_var` y 254 caracteres como máximo.
- Teléfono: de 9 a 15 dígitos tras quitar espacios, puntos, guiones, paréntesis y un `+` inicial. En el formulario de contacto es opcional si la persona prefiere que la contacten por correo.
- Mensaje: 2.000 caracteres como máximo. Localidad: 80.
- Desplegables y botones: solo los valores de `opciones.php`.
- Idioma: solo `ca` o `es`. Página de origen: una ruta que cumpla `^/[a-z0-9/_-]*$`, de 200 caracteres como máximo.
- Casilla de privacidad: obligatoria, comprobada en el servidor.

En lo que va a cabeceras del correo (nombre, email y asunto) se eliminan los caracteres de control y los saltos de línea.

### Adjuntos

Un adjunto que no pasa un control **se descarta y el formulario se envía igualmente sin él**. El correo y la respuesta dicen qué archivo se descartó y por qué. Ante la duda, se descarta el archivo.

| Código | Motivo |
| --- | --- |
| `cantidad` | A partir del sexto archivo (máximo 5) |
| `tamano` | Más de 20 MB |
| `total` | Se pasaría de 20 MB en total |
| `subida` | Error de subida o `is_uploaded_file` falso |
| `vacio` | Archivo de 0 bytes |
| `tipo` | El tipo real (finfo sobre el contenido) no es PDF, JPEG, PNG ni WEBP. Así caen ejecutables, comprimidos, scripts, HTML, SVG, HEIC y todos los formatos de Office. |
| `extension` | La extensión del nombre no corresponde al tipo detectado |
| `imagen` | `getimagesize` no la reconoce o no coincide con el tipo |
| `imagen_pequena` | Un lado de menos de 50 px |
| `imagen_memoria` | Ancho × alto × 5 bytes supera el 60 % de `memory_limit` |
| `imagen_regenerar` | GD no está o la imagen no se ha podido regenerar (también se registra `gd_no_disponible`) |
| `pdf_formato` | No empieza por `%PDF-` en el byte 0 o no contiene `%%EOF` |
| `pdf_contenido` | Contiene `/JavaScript`, `/JS`, `/Launch`, `/EmbeddedFile`, `/EmbeddedFiles`, `/RichMedia`, `/XFA`, `/SubmitForm`, `/ImportData`, `/GoToE`, `/GoToR` o `/AA` |
| `pdf_cifrado` | Contiene `/Encrypt`: protegido o cifrado, no se puede revisar |
| `pdf_inspeccion` | Hay un object stream (`/Type /ObjStm`) que no se puede revisar: filtro no soportado (ASCII85, ASCIIHex, LZW, RunLength, Flate detrás de otro filtro o `/Filter` indirecto), fallo al descomprimir, más de 50 MB descomprimidos o más de 5 s. Los demás flujos que no se pueden revisar no descartan el PDF (ver abajo). |

- **Nombres:** el nombre original nunca se usa. Los adjuntos se llaman `factura-1.pdf`, `factura-2.jpg`, etc. Para el aviso de descartados, el nombre original se sanea a `[A-Za-z0-9 ._-]` y 60 caracteres.
- **Imágenes:** se **regeneran** con GD. Se aplica la orientación EXIF y se guarda una imagen nueva: JPG y WEBP como JPEG de calidad 85, PNG como PNG. Solo se adjunta la regenerada (cualquier código añadido al final del archivo desaparece) y la original se elimina. Los temporales se borran siempre, también si hay error.
- **PDF:** los nombres se comparan completos y después de decodificar las secuencias `#xx` (`/J#61vaScript` cuenta como `/JavaScript`). `/OpenAction` y los enlaces `/URI` están permitidos. En el servidor no hay antivirus ni se llama a ninguno.
- **Dónde se buscan los nombres peligrosos (regla del 16/11/2026).** En un PDF, las acciones, los scripts y los archivos incrustados solo pueden declararse en dos sitios: en los objetos que están fuera de los flujos y dentro de los object streams (`/Type /ObjStm`). Por eso:
  - **Objetos fuera de flujos** (el PDF sin los datos de los flujos, incluidos los diccionarios de todos los flujos): se revisan siempre, enteros.
  - **Object streams (`/Type /ObjStm`):** se descomprimen y se revisan. Si no se pueden revisar (filtro no soportado, fallo al descomprimir, límites de 50 MB o 5 s superados), el PDF se descarta con `pdf_inspeccion`. Un `/Type` indirecto se trata como un ObjStm, por si acaso.
  - **Resto de flujos** (contenido de página, fuentes, imágenes, metadatos, XRef, perfiles de color): si no tienen filtro o están en `FlateDecode` y se pueden descomprimir, se revisan igual que antes. Si llevan un filtro que no se puede revisar (por ejemplo, ASCII85 o LZW, o Flate detrás de otro filtro), un Flate corrupto o se han superado los límites, se omiten y el PDF **no** se descarta por eso. Así se aceptan facturas reales generadas con ASCII85 + Flate.
- **Probar PDF reales sin abrirlos:** `C:\php\php.exe scripts/probar-pdfs.php <carpeta>` pasa el inspector real (el mismo código de `public/api/lib/adjuntos.php`) por todos los PDF de la carpeta. Imprime solo el nombre del archivo, si se acepta o se descarta y el código del motivo, y al final el total. No muestra nada del contenido.

En el navegador, antes de enviar, se comprueban el número, el tamaño y el tipo de los archivos. Las fotos se comprimen con canvas (lado mayor de 2.000 px, calidad 0,8) y, si falla la compresión, se envía la original. Los PDF no se tocan. Si un archivo pasa de 20 MB, el navegador lo rechaza con un aviso: se puede enviar el formulario sin él y hacer llegar la factura con una foto o por correo a info@logiksolutions.es.

### Correo

- PHPMailer por SMTP autenticado, con cifrado obligatorio (`tls` = STARTTLS en el 587, `ssl` en el 465) y **verificación del certificado activa**: `SMTPOptions` nunca se toca. Timeout de 15 s, UTF-8, sin depuración y sin cabecera `X-Mailer`.
- `From`: `web@logiksolutions.es`, "Web Logik Solutions". `To`: el de `config.php`. `Reply-To`: el correo del cliente, que nunca va en `From`.
- Asunto: "Nou pre-estudi web: [nombre]" o "Nuevo pre-estudio web: [nombre]", según el idioma, con el nombre saneado y 80 caracteres como máximo.
- Cuerpo en HTML sencillo y en texto plano, todo escapado: datos, formulario, idioma, página de origen, fecha y hora (Europe/Madrid), "Política de privacidad aceptada: sí", adjuntos incluidos y descartados con su motivo. Las URLs del mensaje no se convierten en enlaces.
- **Respaldo sin adjuntos (16/11/2026).** Si el envío falla y el correo llevaba adjuntos (por ejemplo, porque el servidor de correo rechaza mensajes tan grandes), se reintenta **una vez** el mismo correo sin adjuntos. Ese correo lleva arriba un aviso destacado: los adjuntos no se pudieron enviar (posible límite de tamaño del correo), hay que pedírselos al cliente, y la lista de nombres saneados. Si sale bien, la respuesta es 200 `{ok:true, adjuntos_no_enviados:[...]}`, el nonce se marca como usado y el envío cuenta en los límites. El navegador dice, en el idioma de la página, que los datos se han recibido pero las facturas no, y pide enviarlas a info@logiksolutions.es. En el log: `smtp_fallo`, `smtp_reintento_sin_adjuntos` y `enviado_sin_adjuntos` (o `smtp_fallo_sin_adjuntos`, si el reintento también falla).
- Si falla del todo (también el reintento, o no llevaba adjuntos): 502, `smtp_fallo` en el log (sin datos personales) y el nonce no se marca, así que el visitante puede reintentar.
- No se guarda ningún dato personal en el servidor.

## config.php: qué se puede cambiar

Es un archivo PHP que devuelve una lista de valores y no imprime nada. En el servidor está en `web/api/config.php`. Para editarlo, usa el administrador de archivos de cdmon o FTP, cambia solo el texto entre comillas o el número, y guarda.

| Campo | Qué es |
| --- | --- |
| `modo` | `"smtp"` en el servidor. `"test"` solo en local: no envía nada y guarda el correo como `.eml`. |
| `host`, `puerto`, `cifrado` | Servidor de correo: `smtp.logiksolutions.es`, 587 y `"tls"`, o bien 465 y `"ssl"`. |
| `usuario`, `contrasena` | Buzón exclusivo de la web, `web@logiksolutions.es`, y su contraseña. Nunca se usa la de `info@`. |
| `from`, `nombre_remitente` | Remitente: `web@logiksolutions.es` y "Web Logik Solutions". |
| `to` | **Destinatario.** Para cambiarlo, escribe el correo nuevo entre las comillas. |
| `dominios_permitidos` | Dominios desde los que se aceptan envíos. Si se añade el dominio de pruebas, va aquí. |
| `clave_secreta` | Firma los sellos y los hashes de IP. 64 caracteres hexadecimales. |
| `max_archivos`, `max_por_archivo`, `max_total` | 5 archivos, 20 MB por archivo y 20 MB en total. Si se suben, hay que subir también los de `.user.ini` y los del navegador (`src/scripts/file-drop.ts`). |
| `limite_ip_hora`, `limite_global_hora` | 5 y 40 envíos correctos por hora. |
| `carpeta_test` | Solo en modo test: carpeta de los `.eml`. Vacío significa la carpeta temporal del sistema. |
| `simular_fallo` | Solo en modo test: `"con_adjuntos"` simula que el servidor de correo rechaza los mensajes con adjuntos, para probar el respaldo sin adjuntos. En el servidor, déjalo vacío; en modo `smtp` no tiene efecto. |

- **Cambiar la contraseña** (por ejemplo, si se cambia en cdmon): sustituye el valor de `contrasena` y guarda. Después, haz un envío de prueba.
- **Generar una clave secreta nueva** (por ejemplo, si se ha filtrado): en un ordenador con PHP, ejecuta `php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"` y pega el resultado en `clave_secreta`. Los sellos de las páginas abiertas en ese momento dejan de valer: esos visitantes reciben un 200 falso. Hazlo a una hora tranquila.

## Si dejan de llegar correos

1. **Haz un envío de prueba** desde la web y mira la carpeta de spam de `info@`.
2. **Mira el mensaje que ve el visitante:**
   - Error con el teléfono (502): falla el SMTP. Ve al paso 3.
   - Mensaje de éxito sin correo: o es spam falso (revisa el log, paso 4) o el correo ha llegado a spam.
3. **SMTP:**
   - ¿Ha cambiado la contraseña de `web@`? Actualiza `config.php`.
   - ¿Existe todavía el buzón `web@`?
   - ¿Es correcto el certificado de `smtp.logiksolutions.es`? **Nunca** se desactiva la verificación: si el certificado falla, hay que arreglarlo en cdmon.
   - ¿Siguen bien SPF, DKIM y DMARC?
4. **Log de errores de PHP** (panel de cdmon): busca las líneas `[logik-form]`.
   - `smtp_fallo`: el correo no ha salido. El texto que sigue dice por qué.
   - `enviado_sin_adjuntos`: el correo salió en el reintento, sin las facturas. Si se repite a menudo, el servidor de correo está rechazando mensajes grandes: revisa el tamaño máximo de mensaje del buzón en cdmon.
   - `config_ausente` o `config_invalida`: falta `config.php` o le falta un campo.
   - `spam <código>`: un envío bloqueado. Si aparece `spam origen` con envíos reales, el dominio no está en `dominios_permitidos`.
   - `limite_ip` o `limite_global`: se han alcanzado los límites.
   - `almacen_error`: la carpeta temporal no se puede escribir. El formulario sigue funcionando, pero sin límites.
5. **Comprueba en el servidor** que `/api/config.php` responde 403 y que `/.user.ini` no se puede descargar (docs/despliegue.md).

## Pruebas

- Pruebas locales: se hicieron con `php -S` sobre `dist/` y curl, con `config.php` en modo test (apartado 10 del encargo). Los resultados están en el informe de la tarea.
- Inspector de PDF con facturas reales: `C:\php\php.exe scripts/probar-pdfs.php C:\carpeta\con\facturas` (ver Adjuntos).
- Prueba real con SMTP: docs/prueba-real.md.
- Instrucciones para el dueño: docs/instrucciones-cliente.md.
