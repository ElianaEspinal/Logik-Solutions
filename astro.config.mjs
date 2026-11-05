// @ts-check
import { readdir, readFile, rename, rmdir, writeFile } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { defineConfig, envField } from 'astro/config';
import rehypeBlog from './src/lib/markdown/rehype-blog.mjs';
import { markdownOptions } from './src/config/blog.ts';
import { buildCsp, htaccess, htaccessAssets, inlineScriptHashes, stripHtmlComments } from './src/config/server.mjs';

// --- Entorno -------------------------------------------------------------------
// SITE_ENV: production | staging. La indexación depende del entorno, no de cada página.
// SITE_URL: dominio del entorno (sin barra final). Todo lo absoluto (canonical, hreflang,
// og:url, sitemap, robots.txt, JSON-LD) sale de aquí a través de `site`.
// Por defecto production: olvidar la variable nunca desindexa producción.
const fileEnv = loadEnv('production', process.cwd(), '');
const SITE_ENV = process.env.SITE_ENV || fileEnv.SITE_ENV || 'production';
if (SITE_ENV !== 'production' && SITE_ENV !== 'staging') throw new Error(`SITE_ENV debe ser production o staging (es "${SITE_ENV}")`);
/** Único lugar con el dominio de producción escrito. */
const PRODUCTION_URL = 'https://logiksolutions.es';
const SITE_URL = (process.env.SITE_URL || fileEnv.SITE_URL || PRODUCTION_URL).replace(/\/+$/, '');
if (!/^https:\/\/[a-z0-9.-]+$/.test(SITE_URL)) throw new Error(`SITE_URL debe ser https://dominio, sin ruta (es "${SITE_URL}")`);
if (SITE_ENV === 'staging' && SITE_URL === PRODUCTION_URL) {
  console.warn('[logik] SITE_ENV=staging sin SITE_URL propio: canonicals y sitemap apuntarán al dominio de producción. Define SITE_URL con el subdominio de pruebas.');
}
// Lo leen los scripts de comprobación del mismo proceso (no se exponen al navegador).
process.env.SITE_ENV = SITE_ENV;
process.env.SITE_URL = SITE_URL;

/**
 * Astro solo genera como archivo plano el 404 de la raíz; con build.format
 * 'directory' el castellano saldría en /es/404/index.html. Lo movemos a
 * /es/404.html para que lo use el ErrorDocument de public/es/.htaccess.
 * @returns {import('astro').AstroIntegration}
 */
const localized404 = () => ({
  name: 'localized-404',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      await rename(new URL('es/404/index.html', dir), new URL('es/404.html', dir));
      await rmdir(new URL('es/404/', dir));
    },
  },
});

/** Origen del servicio de formularios (PUBLIC_FORM_ENDPOINT) para la CSP; Formspree por defecto. */
const formOrigin = (() => {
  try {
    return new URL(process.env.PUBLIC_FORM_ENDPOINT || fileEnv.PUBLIC_FORM_ENDPOINT || 'https://formspree.io').origin;
  } catch {
    return 'https://formspree.io';
  }
})();

/**
 * Al terminar el build (src/config/server.mjs; docs/despliegue.md y docs/seguridad.md):
 * 1) quita los comentarios HTML de dist/ (notas internas de desarrollo);
 * 2) calcula los hashes SHA-256 de los scripts en línea para la CSP;
 * 3) escribe dist/.htaccess según el entorno (https y dominio únicos, cabeceras de seguridad,
 *    CSP en modo informe, bloqueo de archivos, X-Robots-Tag solo en staging, compresión y caché).
 * @returns {import('astro').AstroIntegration}
 */
const serverConfig = () => ({
  name: 'server-config',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const scriptHashes = new Set();
      const files = (await readdir(dir, { recursive: true })).filter((f) => f.endsWith('.html'));
      for (const file of files) {
        const url = new URL(file.replace(/\\/g, '/'), dir);
        const html = stripHtmlComments(await readFile(url, 'utf8'));
        await writeFile(url, html);
        for (const h of inlineScriptHashes(html)) scriptHashes.add(h);
      }
      const csp = buildCsp({ scriptHashes, formOrigin });
      await writeFile(new URL('.htaccess', dir), htaccess({ env: SITE_ENV, siteUrl: SITE_URL, csp }));
      await writeFile(new URL('_astro/.htaccess', dir), htaccessAssets());
    },
  },
});

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  // Scripts propios siempre como archivo en /_astro/ (no incrustados en el HTML): la CSP solo
  // necesita los hashes de los dos scripts is:inline del <head> (docs/seguridad.md).
  vite: { build: { assetsInlineLimit: 0 } },
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [localized404(), serverConfig()],
  // Artículos del blog: ids estables, tablas con scroll propio, callouts y CTA a mitad (src/lib/markdown/rehype-blog.mjs).
  // smartypants: false -> Astro no convierte el apóstrofo recto en curvo (regla: siempre ', ver docs/check-text.md).
  markdown: { smartypants: false, rehypePlugins: [[rehypeBlog, markdownOptions]] },
  i18n: {
    locales: ['ca', 'es'],
    defaultLocale: 'ca',
    routing: { prefixDefaultLocale: false, redirectToDefaultLocale: false },
  },
  env: {
    schema: {
      // production | staging. Staging: noindex en todas las páginas, sin GTM y avisos visibles.
      SITE_ENV: envField.enum({
        context: 'server',
        access: 'public',
        values: ['production', 'staging'],
        default: 'production',
      }),
      // Dominio del entorno. Astro lo usa como `site`; aquí solo se declara para validarlo.
      SITE_URL: envField.string({ context: 'server', access: 'public', optional: true }),
      // Destino del formulario (URL completa del servicio elegido: Formspree, Basin, propio…).
      // Vacío: el formulario se ve pero no envía (aviso solo en staging).
      PUBLIC_FORM_ENDPOINT: envField.string({ context: 'server', access: 'public', default: '' }),
      // Adjuntar factura (multipart). Solo true si el servicio elegido admite archivos.
      PUBLIC_FORM_ATTACHMENTS: envField.boolean({ context: 'server', access: 'public', default: false }),
      // Contenedor de Google Tag Manager. GA4 se configura dentro de GTM (sin gtag directo).
      // Solo se carga en producción y tras aceptar las cookies de análisis.
      PUBLIC_GTM_ID: envField.string({ context: 'server', access: 'public', default: '' }),
      // Solo para staging y solo bajo petición: activa GTM (tras el consentimiento)
      // para usar la vista previa de GTM. No tiene efecto en producción.
      PUBLIC_GTM_TEST: envField.boolean({ context: 'server', access: 'public', default: false }),
    },
  },
});
