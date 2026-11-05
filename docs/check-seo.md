# Auditoría SEO técnica: `npm run check:seo`

Nov 5, 2026 · Claude Code para @Eliana

Script: `scripts/check-seo.mjs`. Analiza el HTML de `dist/` sin navegador. Se lanza solo o al final de `npm run check:links`. Hay que ejecutarlo después de un build.

El entorno y el dominio salen de `SITE_ENV` / `SITE_URL` o, si no están definidos, del propio `dist/` (franja de pruebas y canonical de la portada): `scripts/lib/build-env.mjs`.

## Falla (exit 1)

Solo en producción:

- noindex fuera de la lista blanca (`src/config/indexing.ts`: hoy, las dos 404);
- robots.txt sin `User-agent: *`, `Allow: /` o la línea `Sitemap`;
- URL del sitemap con noindex, sin página propia en el build (redirigiría o daría 404), con meta refresh o con canonical hacia otra URL;
- página indexable fuera del sitemap, o huérfana (no se llega a ella con enlaces desde `/` o `/es/`).

En los dos entornos:

- robots.txt con `Disallow: /`;
- en staging, una página sin noindex;
- canonical que no apunta a la propia URL (otro dominio, otra ruta o barra final distinta);
- hreflang sin auto-referencia, sin x-default, no recíproco o hacia una URL que no existe;
- `<html lang>` que no corresponde a la ruta (`ca` en la raíz, `es` en `/es/`), o un número de H1 distinto de uno;
- title o meta description vacíos, duplicados o largos (title de más de 60 caracteres, description de más de 160);
- JSON-LD que no es JSON válido, o FAQPage cuyas preguntas y respuestas no están palabra por palabra en la página;
- imagen sin atributo alt (las decorativas, con `alt=""`) o sin width y height;
- enlace interno roto, sin barra final o con mayúsculas.

## Relación con los otros comprobadores

- `check-build` (corre en cada build) cubre doctype, recursos, consentimiento, RSS, llms.txt y avisa de titles largos.
- `check-links` cubre anclas, parámetros de URL, idioma de los enlaces y páginas vigiladas.
- `check-text` cubre tipografía y los `[[PENDIENTE` (falla en producción).
