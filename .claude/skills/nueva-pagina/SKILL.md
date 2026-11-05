---
name: nueva-pagina
description: Crea una página nueva de la web en catalán y castellano. Úsala cuando pida añadir, crear o planificar una página.
---

1. Confirma el objetivo de la página (formulario o llamada) y la palabra clave principal en catalán y castellano.
2. Comprueba que el tema no repite el de Optienergy.
3. Escribe la versión catalana y la castellana por separado, de forma natural.
4. Diseña primero la versión móvil (360 px) con CSS mobile-first y amplía con min-width. No hagas capturas ni uses navegadores automatizados: Eliana revisa lo visual por su cuenta.
5. Crea `src/pages/<slug-ca>.astro` y `src/pages/es/<slug-es>.astro` con title, meta descripción, canonical, hreflang y datos estructurados.
6. En `src/config/pages.ts` (listado único de páginas) quita `draft: true` de su entrada (o añádela si no existe); así deja de ser un borrador "en preparació" (que solo existe en staging) y entra en el sitemap. No hay noindex por página: la indexación depende del entorno. Enlázala desde otra página indexable.
7. No crees favicons ni logos: ya están en images. Usa los existentes.
8. Ejecuta `npm run check` y corrige lo que falle.
9. Resume en tres líneas qué has creado.
