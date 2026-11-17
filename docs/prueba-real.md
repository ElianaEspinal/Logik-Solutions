# Prueba real con SMTP desde local

Nov 16, 2026 · Claude Code para @Eliana

Sirve para comprobar, antes de subir nada, que el correo sale de verdad por `smtp.logiksolutions.es` con el buzón `web@` y llega con las facturas adjuntas. Las credenciales las escribes tú a mano y **nunca** se guardan en el repositorio, en `docs/` ni en ningún informe.

Necesitas PHP 8.x con `fileinfo`, `gd`, `openssl` y `mbstring` (en este equipo: `C:\php\php.exe`) y la contraseña del buzón `web@logiksolutions.es`.

## 1. Preparar la configuración

1. Compila la web: `npm run build`.
2. Copia `public/api/config.example.php` como `dist/api/config.php`. Esta copia nunca se sube: el siguiente build la borra y `check:security` falla si la encuentra.
3. Edita `dist/api/config.php`:
   - `'modo' => 'smtp'`.
   - `'contrasena' => '...'`: la contraseña de `web@`, escrita a mano.
   - `'to' => 'tu-correo@ejemplo.com'`: tu correo como destinatario temporal, para no llenar `info@` de pruebas.
   - `'clave_secreta'`: una clave nueva, generada con `C:\php\php.exe -r "echo bin2hex(random_bytes(32)), PHP_EOL;"`.
   - Deja `host`, `puerto` (587) y `cifrado` (`tls`) como están.

## 2. Levantar el servidor local

En PowerShell, desde la carpeta del proyecto:

```powershell
C:\php\php.exe -d upload_max_filesize=20M -d post_max_size=24M -d max_file_uploads=6 -d display_errors=0 -d log_errors=1 -d error_log=php-prueba.log -S 127.0.0.1:8099 -t dist
```

Los `-d` sustituyen a `.user.ini`, que el servidor de PHP para pruebas no lee.

## 3. Enviar una prueba

En modo `smtp` solo se aceptan envíos con origen `https://logiksolutions.es`: `localhost` solo vale en modo test. Por eso la prueba se hace con curl, indicando ese origen, y no desde el navegador. Abre una segunda ventana de PowerShell:

```powershell
$r = curl.exe -s -X POST -H "Origin: https://logiksolutions.es" -d "idioma=ca" http://127.0.0.1:8099/api/token.php | ConvertFrom-Json
Start-Sleep -Seconds 4
curl.exe -s -H "Origin: https://logiksolutions.es" `
  -F "ts=$($r.ts)" -F "nonce=$($r.nonce)" -F "firma=$($r.firma)" `
  -F "origen=contacte" -F "idioma=ca" -F "pagina=/contacte/" -F "perfil=empresa" -F "necessitat=factura" `
  -F "nom=Prova Real" -F "email=tu-correo@ejemplo.com" -F "telefon=665052516" -F "preferencia_contacte=correu" `
  -F "consentiment=acceptat" -F "website=" `
  -F "factura[]=@C:\ruta\a\una-factura.pdf" `
  http://127.0.0.1:8099/api/enviar.php
```

Cambia `C:\ruta\a\una-factura.pdf` por un PDF real. Para probar una foto, añade otra línea `-F "factura[]=@C:\ruta\foto.jpg"`.

## 4. Qué comprobar

- La respuesta es `{"ok":true}`. Si es 502, mira `php-prueba.log` (líneas `[logik-form] … smtp_fallo`).
  - **Si el error habla del certificado (`certificate verify failed`, `peer name`), para y avísame.** No se desactiva la verificación TLS en ningún caso.
- En tu correo llega "Nou pre-estudi web: Prova Real":
  - De "Web Logik Solutions" `<web@logiksolutions.es>`.
  - Al responder, el destinatario es el correo del formulario.
  - El PDF llega como `factura-1.pdf` y se abre.
  - La foto llega como `factura-2.jpg` y se ve bien orientada.
  - Fecha y hora de Madrid, y "Política de privacitat acceptada: sí".
- Mira también la carpeta de spam. Si cae ahí, revisa SPF, DKIM y DMARC del dominio.
- Prueba también el puerto 465: `'puerto' => 465` y `'cifrado' => 'ssl'`. Usa el que funcione; si funcionan los dos, deja el 587.

## 5. Al terminar

1. Para el servidor (Ctrl+C).
2. **Borra `dist/api/config.php`** (o ejecuta `npm run build`, que lo borra).
3. Borra `php-prueba.log`.
4. No copies la contraseña en ningún otro sitio.

## Prueba en el navegador (modo test)

Sirve para probar los formularios en tu navegador, en local, sin enviar ningún correo. En modo `test` el servidor hace todo el recorrido (sello, antispam, validación, adjuntos y correo), pero en lugar de enviar el correo lo guarda como archivo `.eml`. En este modo se aceptan envíos desde `localhost`. No hace falta ninguna contraseña.

### 1. Compilar y copiar la configuración de prueba

En PowerShell, desde la carpeta del proyecto:

```powershell
npm run build
Copy-Item public\api\config.php dist\api\config.php
```

`public/api/config.php` ya está en modo `test` y sin credenciales. Comprueba que lleva `'modo' => 'test'`. El build borra `dist/api/config.php`, así que repite la copia después de cada `npm run build`.

### 2. Levantar el servidor local con PHP

```powershell
C:\php\php.exe -d upload_max_filesize=20M -d post_max_size=24M -d max_file_uploads=6 -d display_errors=0 -d log_errors=1 -d error_log=php-prueba.log -S localhost:8099 -t dist
```

Deja esta ventana abierta mientras pruebas. `npm run dev` y `npm run preview` no sirven: no ejecutan PHP, así que el formulario no podría enviar.

### 3. Abrir la web

Abre en el navegador **http://localhost:8099/** (usa `localhost`, tal cual). Hay formularios en:

- http://localhost:8099/: pre-estudi y formulario final ("Parlem?").
- http://localhost:8099/contacte/ y http://localhost:8099/es/contacto/: formulario de contacto.
- http://localhost:8099/empreses-i-pimes/ (y el resto de páginas de servicio): pre-estudi.

Rellena el formulario como lo haría un cliente. Adjunta facturas en PDF o fotos y envía.

### 4. Dónde se guardan los correos

Cada envío correcto crea un archivo `.eml` en:

```
C:\Users\user\AppData\Local\Temp\logik-form-test
```

Puedes abrirla con `explorer $env:TEMP\logik-form-test`. Los `.eml` se abren con Outlook, Thunderbird o el visor de correo de Windows: verás el remitente, el asunto, el cuerpo y las facturas adjuntas (`factura-1.pdf`, `factura-2.jpg`, etc.).

Si un envío da "éxito" pero no aparece ningún `.eml`, el servidor lo ha tratado como spam. Mira el motivo en `php-prueba.log` (líneas `[logik-form] … spam <código>`; los códigos están en docs/formulario.md).

### 5. Cosas que conviene saber

- **El sello se pide al tocar el formulario por primera vez.** Si envías muy rápido, el navegador espera unos segundos antes de enviar: es normal.
- **Límite de 5 envíos por hora.** Después, el formulario muestra el aviso con el teléfono. Para seguir probando, para el servidor y borra las carpetas `logik-form-*` de `C:\Users\user\AppData\Local\Temp` **salvo** `logik-form-test`, que es la de los `.eml`. Después vuelve a levantar el servidor.
- Para probar los mensajes de error, puedes:
  - poner un teléfono de menos de 9 cifras (lo marca el navegador);
  - adjuntar un archivo de Word (se rechaza al elegirlo);
  - adjuntar un PDF con contraseña (llega el correo con el aviso "Arxius descartats").
- No sirve para probar los 403 de `/api/` ni `.user.ini`: el servidor de pruebas de PHP no lee `.htaccess` ni `.user.ini`. Eso se comprueba en cdmon (docs/despliegue.md).

### 6. Al terminar

1. Para el servidor (Ctrl+C).
2. Ejecuta `npm run build` (borra `dist/api/config.php`) o borra ese archivo a mano.
3. Borra `php-prueba.log` y, si quieres, la carpeta `logik-form-test`.
