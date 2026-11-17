# Logik Solutions — web

Web estática bilingüe (catalán en `/`, castellano en `/es/`) hecha con Astro. El formulario envía a un sistema propio en PHP incluido en la propia web.

## Comandos

- `npm run dev`: servidor local (sin PHP: el formulario no envía en dev).
- `npm run build`: genera `dist/` y pasa las comprobaciones (build, seguridad, textos). Necesita PHP para `php -l` (`php` en el PATH, `C:\php\php.exe` o `PHP_BIN`).
- `npm run build:staging`: lo mismo para el entorno de pruebas.
- `npm run check:links`: enlaces internos y SEO sobre `dist/`.
- `npm run preview`: sirve `dist/` (solo estático, sin PHP).

## Publicar

Se sube el contenido de `dist/` a la carpeta pública del hosting (cdmon: `web/`), incluidos los archivos ocultos (`.htaccess`, `api/.htaccess` y `.user.ini`). La primera vez hay que crear a mano `web/api/config.php`. Los pasos están en docs/despliegue.md.

## Formulario

- Cómo funciona, capas de seguridad y configuración: docs/formulario.md.
- Prueba real con SMTP desde local: docs/prueba-real.md.
- Instrucciones para el dueño de la web: docs/instrucciones-cliente.md.

`public/api/config.php` contiene credenciales: está en `.gitignore`, el build lo quita de `dist/` y `check:security` falla si aparece.

## Más documentación

- docs/contexto.md: contexto del proyecto.
- docs/seguridad.md: seguridad.
- docs/tracking.md: analítica.
- docs/despliegue.md: entornos y despliegue.
