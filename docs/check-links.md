# Comprobación de enlaces: `npm run check:links`

Nov 3, 2026 · Claude Code para @Eliana

Recorre `dist/` sin navegador (analiza el HTML) después de `npm run build`. Script: `scripts/check-links.mjs`. Para otra carpeta: `CHECK_DIST=otra/carpeta npm run check:links`.

## Qué comprueba (termina con error si falla algo)

- Que cada `href` interno existe como archivo o como carpeta con `index.html`. Los `href` vacíos o a `#` también son error.
- Que las anclas existen en la página de destino, por ejemplo `#pre-estudi` y `#preestudio`.
- Que cada página indexable tiene canonical propio y está en `sitemap.xml`, y que ninguna página `noindex` está en el sitemap.
- Que el hreflang es recíproco, con auto-referencia y URL absolutas, y que apunta a páginas que existen.
- Que las páginas vigiladas (hoy Empreses i pimes y Comunitats de veïns, en los dos idiomas) existen, reciben enlaces de al menos 2 páginas y reciben enlace desde la home de su idioma. Lista cuántos enlaces entrantes reciben y desde dónde.
- Que los parámetros de URL de los enlaces internos son conocidos y válidos. Hoy solo se admite `perfil`, y su valor tiene que existir como opción del formulario de la página de destino. Por ejemplo, `/contacte/?perfil=administrador` es válido porque el formulario de contacto tiene la opción `administrador`.
- Que ninguna página enlaza a una página del otro idioma, salvo el selector CA | ES (enlaces con `hreflang`).

Nov 4, 2026: se añadieron Comunitats de veïns a las páginas vigiladas y las comprobaciones de parámetros y de idioma.

## Qué solo avisa (no es error)

- Enlaces a borradores ("en preparació"). Bloquean la publicación, como dice la skill `auditoria-prepublicacion`, pero son esperables mientras la página no esté terminada.
- Enlaces a páginas `noindex` a propósito: las legales en esqueleto y el índice del blog sin artículos (`noindex, follow`).

## Cómo vigilar otra página

Añadir su ruta a `WATCH` en `scripts/check-links.mjs`.

## check:seo

`npm run check:links` lanza también `scripts/check-seo.mjs` (auditoría SEO técnica: indexación por entorno, canonical, hreflang, sitemap, H1, metadatos, JSON-LD, imágenes y enlaces). Detalle en docs/check-seo.md.
