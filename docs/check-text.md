# Comprobación tipográfica: `npm run check:text`

Nov 4, 2026 · Claude Code para @Eliana

Script: `scripts/check-text.mjs`. Corre solo al final de `npm run build` (y de los builds de pruebas), y también se puede lanzar suelto con `npm run check:text` después de un build.

## Qué hace fallar el build

- Cualquier apóstrofo curvo (U+2019) en `src/`, `public/` o en los textos generados de `dist/`: HTML (texto, `alt`, `title`, `aria-label`, metas, og:* y JSON-LD), sitemap, `robots.txt`, `llms.txt` y JSON.
- La regla es usar siempre el recto ('). Si un código tiene que reconocer el curvo (por ejemplo, el contador de palabras del blog), se escribe como `\u2019`.
- Si un texto con apóstrofo va entre comillas simples en el código, se cambian a dobles: `"Truca'ns al"`.

- Build de producción: cualquier marcador `[[PENDENT: ...]]` (catalán) o `[[PENDIENTE: ...]]` (castellano) en el HTML de `dist/`. Sale la lista de páginas y de datos que faltan. Los marcadores salen de `src/config/legal.ts` (datos legales sin confirmar). En el build de staging solo es un aviso.

También avisa (sin fallar) de los artículos del blog con la marca `PENDIENTE DE VERIFICACIÓN` en su frontmatter o cuerpo.

## Qué solo avisa

- "l.l" o "l•l" entre letras (por ejemplo "col.lecció") en el texto visible de `dist/` y en los artículos `.md`/`.mdx`. En catalán debería ir la ela geminada con punto volado: "l·l" (U+00B7).

## Blog

La opción `smartypants` de Markdown está desactivada en `astro.config.mjs` para que Astro no convierta el apóstrofo recto de los artículos en curvo al generar la web.
