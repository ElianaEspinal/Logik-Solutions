import type { APIRoute } from 'astro';
import { SITE_ENV } from 'astro:env/server';
import { absoluteUrl } from '../i18n/utils';

// Nunca "Disallow: /": si una URL con noindex está bloqueada, Google no puede leer la etiqueta.
// - Producción: todo rastreable y con la línea Sitemap.
// - Staging: también sin Disallow. Lo protegen la contraseña HTTP, el <meta robots> noindex de
//   cada página y la cabecera X-Robots-Tag (dist/.htaccess). Sin línea Sitemap: el sitemap de
//   pruebas no se envía a Search Console. check-build y check-seo lo comprueban.
export const GET: APIRoute = ({ site }) => {
  const body =
    SITE_ENV === 'staging'
      ? 'User-agent: *\nAllow: /\n'
      : `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap.xml', site)}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
