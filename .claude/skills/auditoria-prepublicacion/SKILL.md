---
name: auditoria-prepublicacion
description: Revisa la web antes de publicar. Solo se ejecuta cuando la invoco con /auditoria-prepublicacion.
disable-model-invocation: true
---

1. Ejecuta `npm run check` y resume los fallos.
2. Revisa en `dist/`: noindex, robots.txt, sitemap, canonical, hreflang recíproco, páginas huérfanas y 404 propia.
   - **Borradores (bloquea publicar):** una página con `draft: true` en `src/config/pages.ts` solo existe en staging; en producción no se construye, así que cualquier enlace a ella sale como roto. `npm run check` lo avisa con la línea `BORRADORES`. Antes de subir, cada página del menú debe tener su contenido real y no estar en borrador.
   - **Indexación:** en producción, ningún noindex fuera de `src/config/indexing.ts` (`npm run check:seo`).
   - Las legales no pueden ir en esqueleto (aviso `data-placeholder`).
3. Revisa CRO en cada página: un objetivo, botón visible sin scroll, formulario corto, teléfono y WhatsApp visibles en móvil y eventos GA4 definidos.
4. Revisa rendimiento (imágenes WebP, tamaños, JS innecesario) y accesibilidad básica.
5. Revisa en el código (HTML y CSS, sin capturas ni navegadores automatizados) la versión móvil: CSS mobile-first con min-width, nada que provoque scroll horizontal, botones de al menos 44 px, texto e inputs de 16 px, barra de llamar/WhatsApp y formularios en una columna. Eliana revisa lo visual por su cuenta.
   - Rendimiento: Lighthouse en modo móvil solo para las cifras (LCP, INP/TBT, CLS y puntuaciones), sin capturas ni informes con imágenes.
6. Lista los problemas por prioridad (bloquea publicar / mejorable) y propón la corrección. No toques nada hasta que lo confirme.
