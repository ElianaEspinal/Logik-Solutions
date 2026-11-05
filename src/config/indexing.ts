// Indexación: depende del ENTORNO (SITE_ENV), no de cada página.
// - staging: todas las páginas con noindex, nofollow (+ cabecera X-Robots-Tag y contraseña HTTP).
// - production: todas indexables, salvo esta lista blanca. Las páginas de la lista llevan noindex
//   y no entran en el sitemap. check-build y check-seo fallan ante cualquier otro noindex.
// Sin extensión de Astro: lo leen también los scripts de comprobación con Node.

export const NOINDEX_ALLOWLIST: readonly string[] = [
  // Página de error (Apache la sirve con estado 404 vía ErrorDocument).
  '/404.html',
  '/es/404.html',
  // Páginas de "gràcies / gracias" tras enviar un formulario: no existen (el éxito se muestra en la
  // misma página). Si se crean, añadirlas aquí.
];
