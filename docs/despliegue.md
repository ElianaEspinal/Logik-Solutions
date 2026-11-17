# Despliegue: entornos, indexación y servidor

Nov 5, 2026 · Claude Code para @Eliana

La indexación depende del **entorno**, no de cada página. Dos variables lo deciden todo:

| Variable | Valores | Para qué |
| --- | --- | --- |
| `SITE_ENV` | `production` (por defecto) o `staging` | noindex, cabeceras, robots.txt, GTM, avisos visibles de pruebas |
| `SITE_URL` | `https://dominio` sin barra final | canonical, hreflang, og:url, sitemap, robots.txt y @id del JSON-LD. Vacío = `https://logiksolutions.es` |

El dominio de producción solo está escrito en `astro.config.mjs` (`PRODUCTION_URL`). Ninguna ruta lleva el dominio a mano.

## Comandos

- Producción: `npm run build` (fija `SITE_ENV=production`). **Falla a propósito** mientras quede un `[[PENDIENTE: ...]]` en alguna página (hoy, las legales: ver `src/config/legal.ts`).
- Pruebas: `SITE_URL=https://<subdominio-de-pruebas> npm run build:staging`. En PowerShell: `$env:SITE_URL='https://<subdominio>'; npm run build:staging`. O ponlo en `.env` solo mientras preparas staging. Sin `SITE_URL`, el build avisa y los canonicals de pruebas apuntan a producción (las redirecciones del `.htaccess` de staging usan siempre el host de la propia petición, así que nunca mandan a producción).
- Después de cada build: `npm run check:links` (enlaces + `check:seo`).

## Qué genera cada entorno

| | staging | production |
| --- | --- | --- |
| `<meta name="robots">` | `noindex, nofollow` en todas | Solo en la lista blanca de `src/config/indexing.ts` (404) |
| Cabecera `X-Robots-Tag` | `noindex, nofollow` (`dist/.htaccess`) | Ninguna |
| robots.txt | `User-agent: *` + `Allow: /`, **sin** `Disallow: /` y sin línea Sitemap | `User-agent: *`, `Allow: /` y `Sitemap: <SITE_URL>/sitemap.xml` |
| Sitemap | Se genera, pero **no se envía** a Search Console | Se envía a Search Console |
| GTM | No se carga (salvo `npm run build:staging:gtm`) | Tras aceptar las cookies |
| Borradores de página (`draft: true`) | Se construyen con noindex | No se construyen |

Por qué staging no lleva `Disallow: /`: con la contraseña no hace falta, y si el entorno se filtrara, un Disallow impediría a Google leer el noindex y la URL podría indexarse sin contenido.

## .htaccess (Hostinger)

Lo genera el build en `dist/.htaccess` y `dist/_astro/.htaccess` según el entorno (`src/config/server.mjs`). `dist/es/.htaccess` (404 en castellano) viene de `public/es/`. **No subas a producción un `dist/` construido para staging**: lleva la cabecera noindex.

Reglas, siempre con una sola redirección 301:

1. Carpeta sin barra final (`/llars`) a `https://dominio/llars/`.
2. Solo producción: cualquier otro host (`www.`, alias) a `https://logiksolutions.es`.
3. `http` a `https` (también detrás del proxy de Hostinger, con `X-Forwarded-Proto`).

Además: cabeceras de seguridad, CSP en modo informe y bloqueo de archivos sensibles (docs/seguridad.md), `ErrorDocument 404` (la 404 responde con estado 404, no 200), compresión (`mod_deflate`; LiteSpeed comprime por su cuenta) y caché: HTML, XML y TXT con `no-cache`, tipografías 30 días y `/_astro/` (archivos con hash) un año `immutable`.

No hay redirecciones desde las URLs de la web WordPress antigua: **pendiente** listar sus URLs y preparar el mapa antes de desactivarla.

## Contraseña HTTP del entorno de pruebas

Se configura en el panel de Hostinger, no en el código: hPanel → Avanzado → Directorios protegidos con contraseña → carpeta del subdominio de pruebas. Después de cada subida de `dist/`, comprueba que sigue pidiendo la contraseña (el `.htaccess` del build puede sobrescribir el que escribe hPanel). Cabeceras, CSP y bloqueos: docs/seguridad.md.

## Formulario PHP (cdmon)

El formulario envía a `/api/enviar.php`, un sistema propio en PHP (docs/formulario.md). El build copia `public/api/` y `public/.user.ini` a `dist/` y genera `dist/api/lib/opciones.php`. **`config.php` no está en `dist/`** (lleva credenciales): se crea a mano en el servidor, una sola vez.

Pasos en el servidor (carpeta pública `web/`), la primera vez y cada vez que cambie de servidor:

1. Sube el contenido de `dist/`, incluidos los archivos ocultos (`.htaccess`, `api/.htaccess` y `.user.ini`).
2. **Crea `web/api/config.php`** copiando `web/api/config.example.php`. Rellena:
   - `'modo' => 'smtp'`;
   - la contraseña del buzón `web@logiksolutions.es`;
   - una **clave secreta nueva**, generada con `php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"`. No reutilices la de local ni la de otro entorno.

   En staging, añade su dominio a `dominios_permitidos`.
3. **Verifica `.user.ini`:**
   - Crea temporalmente un PHP con `<?php echo ini_get('upload_max_filesize'), ' ', ini_get('post_max_size'), ' ', ini_get('max_file_uploads'), ' ', ini_get('display_errors');` y ábrelo en el navegador. Debe dar `20M 24M 6` y `display_errors` vacío o `0`. **Bórralo después.**
   - Si no da esos valores, configúralos en el panel de cdmon (PHP): puede que allí no se lea `.user.ini`.
4. **Verifica PHP y GD** en el panel de cdmon o con un PHP temporal (bórralo después):
   - PHP 8.1 a 8.4;
   - extensiones `fileinfo`, `gd` (con JPEG, PNG y WEBP), `openssl`, `mbstring` y `zlib` (`exif` es opcional, para enderezar fotos).
5. **Comprueba los 403 de `/api/`** con el navegador o con `curl -I`:
   - `/api/config.php`, `/api/config.example.php`, `/api/lib/`, `/api/lib/correo.php` y `/api/lib/phpmailer/LICENSE` → **403**.
   - `/.user.ini` → 404 (lo bloquea el `.htaccess` raíz).
   - `/api/enviar.php` con GET → 405 (JSON).
   - `/api/token.php` con GET → 405 (JSON).
6. **Comprueba la IP real:**
   - Si cdmon pone un proxy delante, `REMOTE_ADDR` sería la del proxy y el límite de 5 envíos por IP afectaría a todos los visitantes a la vez.
   - Con el PHP temporal, compara `$_SERVER['REMOTE_ADDR']` con tu IP pública. Si no coinciden, para y avisa antes de publicar.
7. Haz un envío real desde la web con una factura PDF y una foto, y comprueba que llega a `info@` (docs/prueba-real.md, punto 4).
8. Revisa en el log de errores de PHP de cdmon que no haya líneas `[logik-form] config_` ni `almacen_error`.

Al subir cambios más adelante, `config.php` no se toca: no está en `dist/`, así que la subida no lo pisa. **No borres la carpeta `web/api/` entera al subir.**

## Al pasar a producción

1. `npm run build` sin errores (sin `[[PENDIENTE`), `npm run check:links` sin errores.
2. Subir el contenido de `dist/` a la raíz del dominio, incluidos los `.htaccess` y `.user.ini` (son archivos ocultos). La primera vez, seguir los pasos de "Formulario PHP (cdmon)".
3. Comprobar en el navegador: `http://`, `www.` y una URL sin barra final redirigen con una sola 301; `/no-existe/` responde 404; ninguna página lleva `X-Robots-Tag`.
4. Enviar `https://logiksolutions.es/sitemap.xml` en Search Console y revisar "Páginas" a los pocos días.
