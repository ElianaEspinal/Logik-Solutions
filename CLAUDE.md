# Logik Solutions — web bilingüe (ca/es)

@docs/contexto.md

## Qué es
Web estática de una consultoría energética de Girona, hecha con Astro. Catalán por defecto en la raíz (/), castellano en /es/. Se publica en Hostinger subiendo el contenido de `dist/`.

## Comandos
- `npm run dev`: servidor local
- `npm run build`: genera `dist/`
- `npm run preview`: sirve `dist/` tal como se verá en el servidor
- `npm run check`: build + comprobaciones sobre `dist/`

## Estructura prevista
- `src/pages/`: páginas en catalán. `src/pages/es/`: páginas en castellano.
- `src/config/pages.ts`: listado único de páginas y slugs ca/es (de ahí salen hreflang, selector de idioma, menú, pie, sitemap y borradores). `src/config/nav.ts`: menú. `src/config/site.ts`: datos de la empresa y teléfono único.
- `src/i18n/`: textos de interfaz por idioma.
- `src/layouts/BaseLayout.astro`: único layout. Todo el <head> vive aquí; no duplicarlo en las páginas.
- `src/content/blog/ca/` y `src/content/blog/es/`: artículos en Markdown.
- `public/`: robots.txt, llms.txt, favicon y tipografías.

## Reglas de código
- **Prioritario.** Mobile-first ante todo. Diseña y programa desde 360 px y amplía con min-width. Sin scroll horizontal. Titular y botón principal visibles sin scroll en 360x640. Barra fija de llamar y WhatsApp en móvil. Botones de al menos 44 px de alto y texto de al menos 16 px. Formularios en una columna, con inputmode, autocomplete y campos de 16 px. Animaciones ligeras y desactivadas con prefers-reduced-motion; nada que dependa de hover. Objetivos móviles: LCP 2,5 s o menos, INP 200 ms o menos, CLS 0,1 o menos.
- Rutas absolutas desde la raíz (/assets/...). Archivos en minúsculas, sin espacios ni acentos.
- `noindex` solo si `SITE_ENV=staging` (todas las páginas). En producción, solo la lista blanca de `src/config/indexing.ts` (404). El dominio sale de `SITE_URL` (docs/despliegue.md).
- Imágenes con el componente de imágenes de Astro (WebP), con alt, ancho y alto.
- JavaScript solo para interacciones (calculadora, animaciones, menú). El texto principal va en el HTML.
- Accesible (contraste, foco visible, etiquetas en formularios) y responsive mobile-first.
- Logo y favicons: ya existen en la carpeta de imágenes del proyecto (búscala, se llama images). No los crees, conviertas, redimensiones ni sustituyas. Úsalos tal cual, enlazados desde el <head> del layout con rutas absolutas desde la raíz. Si falta algún formato (por ejemplo apple-touch-icon), avísame en vez de generarlo. Excepción autorizada: `logo-web.webp` es una copia ligera de `logo.png` (WebP sin pérdida, 640 px de ancho, mismo dibujo, colores y margen) para la cabecera; no la regeneres ni la modifiques.

## Reglas de contenido
- Catalán y castellano escritos por separado, naturales; slug, title y meta propios en cada idioma.
- Nada de promesas no demostrables; los ahorros son "estimación orientativa".
- Usa siempre el apóstrofo recto (') en todos los textos, también en atributos alt, metas y datos estructurados, y respeta el punto volado de l·l (U+00B7). Lo comprueba `npm run check:text` (corre también en `npm run build`): falla si encuentra el apóstrofo curvo y avisa de "l.l" o "l•l".
- No canibalizar con Optienergy: antes de crear una página o artículo, comprobar tema, enfoque y palabras clave.

## Revisión visual
- No hagas capturas de pantalla ni uses navegadores automatizados para comprobar el diseño, ni las entregues. Eliana revisa lo visual por su cuenta.

## Antes de dar algo por terminado
- Ejecutar `npm run check` y corregir lo que falle (build, enlaces internos, hreflang, canonicals, noindex, sitemap y datos estructurados).
- Decisiones de marca o estructura: proponer 2-3 opciones con recomendación y esperar mi elección.
