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

## Al pasar a producción

1. `npm run build` sin errores (sin `[[PENDIENTE`), `npm run check:links` sin errores.
2. Subir el contenido de `dist/` a la raíz del dominio, incluidos los `.htaccess` (son archivos ocultos).
3. Comprobar en el navegador: `http://`, `www.` y una URL sin barra final redirigen con una sola 301; `/no-existe/` responde 404; ninguna página lleva `X-Robots-Tag`.
4. Enviar `https://logiksolutions.es/sitemap.xml` en Search Console y revisar "Páginas" a los pocos días.
