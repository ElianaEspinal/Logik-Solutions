// Verificación de dist/ tras la build. Falla (exit 1) ante errores de
// indexación, hreflang, sitemap, enlaces o recursos rotos y páginas huérfanas.
// Uso: node scripts/check-build.mjs   (SITE_ENV=staging para builds de pruebas)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultLocale, locales, pages as sitePages } from '../src/config/pages.ts';
import { NOINDEX_ALLOWLIST } from '../src/config/indexing.ts';
import { buildEnv } from './lib/build-env.mjs';

// CHECK_DIST: comprobar otra carpeta de salida (pruebas); por defecto dist/.
const dist = process.env.CHECK_DIST ? join(process.env.CHECK_DIST, sep) : fileURLToPath(new URL('../dist/', import.meta.url));
if (!existsSync(dist)) {
  console.error('No existe dist/. Ejecuta antes astro build.');
  process.exit(1);
}
// Dominio y entorno: SITE_URL / SITE_ENV o, si no están, lo que dice el propio dist/.
const { site: SITE, env } = buildEnv(dist);
const gtmTest = env === 'staging' && process.env.PUBLIC_GTM_TEST === 'true';

const errors = [];
const warnings = [];
const error = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
  );

// dist/foo/index.html -> /foo/ ; dist/404.html -> /404.html
const urlPathOf = (file) => '/' + relative(dist, file).split(sep).join('/').replace(/(^|\/)index\.html$/, '$1');
const fileExists = (pathname) =>
  existsSync(join(dist, decodeURI(pathname), pathname.endsWith('/') ? 'index.html' : ''));

const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? [];
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1];
const has = (tag, name) => new RegExp(`\\s${name}(=|\\s|/?>)`, 'i').test(tag);

// Clasifica una URL de href/src: 'skip' (externa, ancla, mailto, tel, data…),
// 'relative' (prohibida: las rutas van desde la raíz) o la ruta interna sin query ni hash.
const SITE_NO_SCHEME = SITE.replace(/^https:/, '');
const classify = (url) => {
  url = url.trim();
  if (url.startsWith(SITE)) url = url.slice(SITE.length) || '/';
  else if (url.startsWith(SITE_NO_SCHEME)) url = url.slice(SITE_NO_SCHEME.length) || '/';
  if (!url || url.startsWith('#') || url.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(url)) return 'skip';
  if (!url.startsWith('/')) return 'relative';
  return url.split(/[?#]/)[0];
};
const isPagePath = (pathname) => pathname.endsWith('/') || pathname.endsWith('.html');

const isErrorPage = (path) => path.endsWith('/404.html');
const allRoutes = Object.values(sitePages);
const draftPaths = new Set(allRoutes.filter((r) => r.draft).flatMap((r) => locales.map((l) => r[l])));
const routePaths = new Set(allRoutes.flatMap((r) => locales.map((l) => r[l])));
// --- Blog ------------------------------------------------------------------
// Artículos generados: dist/blog/<slug>/ y dist/es/blog/<slug>/ (sin /pagina/).
const BLOG = Object.fromEntries(locales.map((l) => [l, sitePages.blog[l]]));
const blogLangOf = (path) => (path.startsWith(BLOG.es) ? 'es' : path.startsWith(BLOG.ca) ? 'ca' : null);
const isBlogPost = (path) => {
  const l = blogLangOf(path);
  if (!l) return false;
  const rest = path.slice(BLOG[l].length);
  return /^[a-z0-9-]+\/$/.test(rest) && rest !== 'pagina/';
};
const htmlPaths = existsSync(dist) ? walk(dist).filter((f) => f.endsWith('.html')).map(urlPathOf) : [];
const blogPosts = Object.fromEntries(locales.map((l) => [l, htmlPaths.filter((p) => isBlogPost(p) && blogLangOf(p) === l)]));
// Regla única (src/lib/blog.ts, blogIndexIndexable): el índice de un idioma se indexa solo si tiene artículos.
const emptyBlogIndexes = locales.filter((l) => blogPosts[l].length === 0).map((l) => BLOG[l]);

// noindex esperado en producción: lista blanca (src/config/indexing.ts) e índice del blog sin artículos.
// Los borradores (draft: true) solo se construyen en staging.
const expectedNoindex = new Set([...emptyBlogIndexes, ...NOINDEX_ALLOWLIST, ...draftPaths]);

// --- Páginas -------------------------------------------------------------
const pages = new Map();
for (const file of walk(dist).filter((f) => f.endsWith('.html'))) {
  const path = urlPathOf(file);
  const html = readFileSync(file, 'utf8');
  const metas = tags(html, 'meta');
  const links = tags(html, 'link');
  const page = {
    lang: attr(tags(html, 'html')[0] ?? '', 'lang'),
    canonicals: links.filter((l) => attr(l, 'rel') === 'canonical').length,
    canonical: attr(links.find((l) => attr(l, 'rel') === 'canonical') ?? '', 'href'),
    alternates: links
      .filter((l) => attr(l, 'rel') === 'alternate' && attr(l, 'hreflang'))
      .map((l) => `${attr(l, 'hreflang')} ${attr(l, 'href')}`)
      .sort(),
    noindex: metas.some(
      (m) => /^(robots|googlebot)$/i.test(attr(m, 'name') ?? '') && /noindex|none/i.test(attr(m, 'content') ?? ''),
    ),
    linksTo: new Set(),
  };
  pages.set(path, page);

  if (!/^<!doctype html>/i.test(html.trimStart())) error(path, 'falta <!doctype html>');
  if (!metas.some((m) => /charset="?utf-8/i.test(m))) error(path, 'falta <meta charset="utf-8">');
  if (!metas.some((m) => attr(m, 'name') === 'viewport' && attr(m, 'content')?.includes('width=device-width')))
    error(path, 'falta meta viewport');
  const expectedLang = path.startsWith('/es/') ? 'es' : 'ca';
  if (page.lang !== expectedLang) error(path, `lang="${page.lang}", se esperaba "${expectedLang}"`);

  const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)].map((m) => m[1].trim());
  if (titles.length !== 1 || !titles[0]) error(path, `debe tener un único <title> no vacío (${titles.length})`);
  const descriptions = metas.filter((m) => attr(m, 'name') === 'description').map((m) => attr(m, 'content')?.trim());
  if (descriptions.length !== 1 || !descriptions[0]) error(path, 'debe tener una única meta description no vacía');
  page.title = titles[0];
  page.description = descriptions[0];
  page.robots = metas.find((m) => /^robots$/i.test(attr(m, 'name') ?? '')) && attr(metas.find((m) => /^robots$/i.test(attr(m, 'name') ?? '')), 'content');
  // Límites de title y meta description en todas las páginas (avisos, no errores).
  if (!isErrorPage(path) && !draftPaths.has(path)) {
    if ([...(page.title ?? '')].length > 60) warn(path, `title de ${[...page.title].length} caracteres (máx. 60): ${page.title}`);
    if ([...(page.description ?? '')].length > 155) warn(path, `meta description de ${[...page.description].length} caracteres (máx. 155)`);
  }
  // Borradores del blog: imposibles en producción.
  if (env === 'production' && (/\sdata-post-draft\b/.test(html) || /\((no publicar)\)/i.test(page.title ?? '')))
    error(path, 'artículo o tarjeta en borrador (draft: true) en un build de producción');
  if (env === 'production' && /\bTODO\b/.test(`${page.title} ${page.description}`))
    warn(path, 'title/description provisional (TODO)');

  const h1 = tags(html, 'h1').length;
  if (h1 !== 1) error(path, `debe tener un único <h1> (${h1})`);
  // Jerarquía: el primer encabezado es el h1 y nunca se salta un nivel al bajar (h2 -> h4).
  const levels = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  if (levels.length && levels[0] !== 1) error(path, `el primer encabezado es h${levels[0]}, no h1`);
  levels.forEach((lvl, i) => {
    if (i && lvl > levels[i - 1] + 1) error(path, `salto de encabezado h${levels[i - 1]} -> h${lvl}`);
  });

  // JSON-LD: JSON válido, con @context, y sin valoraciones ni reseñas.
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(json);
      if (!data['@context']) error(path, 'JSON-LD sin @context');
      if (/"(aggregateRating|review)"/.test(json)) error(path, 'JSON-LD con aggregateRating/review: solo con reseñas reales');
      page.schemaTypes = [...(page.schemaTypes ?? []), ...(data['@graph'] ?? [data]).map((n) => n['@type'])];
    } catch (e) {
      error(path, `JSON-LD no válido: ${e.message}`);
    }
  }

  if (draftPaths.has(path) && !/\sdata-draft\b/.test(html)) error(path, 'es borrador en pages.ts pero no usa la plantilla de borrador');

  // Marcadores de pruebas: nunca en producción.
  if (env === 'production' && /\sdata-staging-only\b/.test(html)) error(path, 'marcador de staging (data-staging-only) en producción');

  for (const img of tags(html, 'img')) {
    if (!has(img, 'alt')) error(path, `<img> sin alt: ${img}`);
    for (const a of ['width', 'height'])
      if (!/^\d+$/.test(attr(img, a) ?? '')) error(path, `<img> sin ${a} numérico: ${img}`);
  }

  for (const a of tags(html, 'a')) {
    const href = attr(a, 'href');
    if (href === undefined) continue;
    const pathname = classify(href);
    if (pathname === 'skip') continue;
    if (pathname === 'relative') error(path, `enlace relativo (usa rutas desde la raíz): ${href}`);
    else if (!/\.[a-z0-9]+$/i.test(pathname) && !pathname.endsWith('/'))
      error(path, `enlace sin barra final (provoca redirección): ${href}`);
    else if (!fileExists(pathname)) error(path, `enlace interno roto: ${href}`);
    else if (isPagePath(pathname)) page.linksTo.add(pathname);
  }

  // Recursos: CSS, JS, imágenes, iconos, tipografías precargadas, manifest…
  const resources = [
    ...['img', 'script', 'source', 'video', 'audio', 'iframe'].flatMap((t) =>
      tags(html, t).flatMap((tag) => [
        attr(tag, 'src'),
        ...(attr(tag, 'srcset') ?? '').split(',').map((c) => c.trim().split(/\s+/)[0]),
      ]),
    ),
    ...links.filter((l) => !['canonical', 'alternate'].includes(attr(l, 'rel') ?? '')).map((l) => attr(l, 'href')),
  ].filter(Boolean);
  for (const src of new Set(resources)) {
    const pathname = classify(src);
    if (pathname === 'skip') continue;
    if (pathname === 'relative') error(path, `recurso con ruta relativa (usa rutas desde la raíz): ${src}`);
    else if (!fileExists(pathname)) error(path, `recurso inexistente: ${src}`);
  }

  for (const form of tags(html, 'form')) {
    if (has(form, 'data-contact-form') && attr(form, 'data-enabled') !== 'true')
      warn(path, 'formulario sin PUBLIC_FORM_ENDPOINT: se ve pero no envía');
  }
  // Consent Mode v2: valores por defecto "denied" en el <head>, antes de cualquier otro script.
  const consentDefault = html.match(/<script[^>]*\sdata-consent-default[^>]*>([\s\S]*?)<\/script>/i);
  if (!isErrorPage(path) || consentDefault) {
    const keys = ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage'];
    if (!consentDefault) error(path, 'falta el script de Consent Mode v2 con los valores por defecto (data-consent-default)');
    else {
      if (!keys.every((k) => new RegExp(`${k}:'denied'`).test(consentDefault[1])) || /granted/.test(consentDefault[1]))
        error(path, 'Consent Mode v2: los valores por defecto deben ser "denied" en ad_storage, ad_user_data, ad_personalization y analytics_storage');
      if (html.indexOf('<script') !== consentDefault.index)
        error(path, 'Consent Mode v2: el script de valores por defecto debe ir antes que cualquier otro script');
    }
  }
  // Consentimiento: nada de analítica ni contenido externo en el HTML estático
  // (aparte del script de valores por defecto, que no carga nada).
  if (/googletagmanager\.com|google-analytics\.com|gtag\(/i.test(consentDefault ? html.replace(consentDefault[0], '') : html))
    error(path, 'carga GTM/GA en el HTML estático: solo se inyecta tras aceptar las cookies');
  for (const iframe of tags(html, 'iframe')) {
    if (/^(https?:)?\/\//.test(attr(iframe, 'src') ?? '')) error(path, `iframe externo sin consentimiento (usa ConsentEmbed): ${iframe}`);
  }
  const gtmId = html.match(/\sdata-gtm-id="([^"]*)"/)?.[1];
  if (env === 'staging' && gtmId !== undefined && !gtmTest)
    error(path, 'staging no debe llevar el ID de GTM (salvo PUBLIC_GTM_TEST=true)');
  if (gtmTest && !/^GTM-[A-Z0-9]+$/.test(gtmId ?? '') && !isErrorPage(path))
    error(path, 'PUBLIC_GTM_TEST=true pero falta el ID de GTM (PUBLIC_GTM_ID)');
  if (env === 'production' && !isErrorPage(path)) {
    if (!html.includes('data-cookie-banner')) error(path, 'falta el banner de cookies');
    else if (!/^GTM-[A-Z0-9]+$/.test(gtmId ?? '')) warn(path, 'sin ID de GTM: define PUBLIC_GTM_ID en .env');
  }

  const placeholders = (html.match(/\sdata-placeholder\b/g) ?? []).length;
  if (env === 'production' && placeholders) {
    warn(path, `${placeholders} contenido(s) provisional(es) (data-placeholder), p. ej. páginas legales en esqueleto`);
  }
}

// --- Indexación, canonical y hreflang ------------------------------------
const seen = { title: new Map(), description: new Map() };
for (const [path, page] of pages) {
  if (env === 'staging' && !page.noindex) error(path, 'en staging todas las páginas deben llevar noindex');
  if (env === 'production' && page.noindex !== expectedNoindex.has(path))
    error(path, page.noindex ? 'noindex fuera de la lista blanca (src/config/indexing.ts) en producción' : 'falta noindex');
  if (env === 'production' && draftPaths.has(path)) error(path, 'borrador (draft: true) construido en producción');

  if (isErrorPage(path)) continue;

  for (const field of ['title', 'description']) {
    const other = seen[field].get(page[field]);
    if (other) error(path, `${field} duplicado con ${other}`);
    else seen[field].set(page[field], path);
  }

  if (page.canonicals !== 1) error(path, `debe tener un único canonical (${page.canonicals})`);
  if (page.canonical !== SITE + path) error(path, `canonical "${page.canonical}", se esperaba "${SITE + path}"`);
  // Las páginas de src/config/pages.ts existen en ambos idiomas: hreflang obligatorio.
  if (page.alternates.length === 0) {
    if (routePaths.has(path) || isBlogPost(path)) error(path, 'falta hreflang');
    continue;
  }

  const map = Object.fromEntries(page.alternates.map((a) => a.split(' ')));
  // Blog (artículos y páginas 2+): puede existir en un solo idioma. Entonces solo auto-referencia
  // y x-default a esa misma versión: nunca hreflang hacia una URL inexistente.
  const partialOk = !routePaths.has(path) && blogLangOf(path) !== null;
  const present = locales.filter((l) => map[l]);
  const required = partialOk && present.length < locales.length ? [page.lang, 'x-default'] : [...locales, 'x-default'];
  for (const l of required) if (!map[l]) error(path, `hreflang sin "${l}"`);
  const xDefault = map[defaultLocale] ?? map[present[0]];
  if (map['x-default'] && map['x-default'] !== xDefault)
    error(path, `x-default debe apuntar a ${xDefault}: ${map['x-default']}`);
  if (map[page.lang] !== page.canonical) error(path, 'hreflang sin auto-referencia a su canonical');
  for (const l of present) {
    const target = map[l]?.startsWith(SITE) ? map[l].slice(SITE.length) : undefined;
    const other = target && pages.get(target);
    if (!other) error(path, `hreflang "${l}" apunta a una página inexistente o no absoluta: ${map[l]}`);
    else if (other.alternates.join('|') !== page.alternates.join('|'))
      error(path, `hreflang no recíproco con ${target}`);
  }
}

for (const route of allRoutes) {
  if (route.draft && env === 'production') continue; // borradores: no se construyen en producción
  for (const l of locales) if (!pages.has(route[l])) error(route[l], 'está en src/config/pages.ts pero no se ha generado');
}
for (const l of locales) {
  const types = pages.get(sitePages.home[l])?.schemaTypes ?? [];
  for (const type of ['ProfessionalService', 'WebSite', 'FAQPage'])
    if (!types.includes(type)) error(sitePages.home[l], `falta ${type} en el JSON-LD`);
}
// Borradores: en producción no se construyen; si alguna página los enlaza, sale como enlace roto.
if (draftPaths.size) {
  warn('BORRADORES', `${draftPaths.size} página(s) con draft: true en pages.ts (solo en staging): ${[...draftPaths].join(' ')}`);
}

// --- Páginas huérfanas ---------------------------------------------------
// Toda página indexable debe recibir un enlace <a> de otra página indexable y
// ser alcanzable navegando desde las portadas solo por páginas indexables.
const indexable = (p) => pages.has(p) && !isErrorPage(p) && !expectedNoindex.has(p);
const inbound = new Map();
for (const [from, page] of pages) {
  if (!indexable(from)) continue;
  for (const to of page.linksTo) if (to !== from) inbound.set(to, (inbound.get(to) ?? 0) + 1);
}
const reached = new Set(locales.map((l) => sitePages.home[l]).filter(indexable));
const queue = [...reached];
while (queue.length) {
  for (const to of pages.get(queue.shift()).linksTo) {
    if (!reached.has(to) && indexable(to)) {
      reached.add(to);
      queue.push(to);
    }
  }
}
for (const path of pages.keys()) {
  if (!indexable(path)) continue;
  if (!inbound.get(path)) error(path, 'página huérfana: ninguna otra página indexable la enlaza');
  else if (!reached.has(path)) error(path, 'página huérfana: no se llega a ella navegando desde la portada');
}

// --- Sitemap -------------------------------------------------------------
const sitemapFile = join(dist, 'sitemap.xml');
if (!existsSync(sitemapFile)) error('sitemap.xml', 'no existe');
else {
  const xml = readFileSync(sitemapFile, 'utf8');
  const inSitemap = new Set();
  for (const [, block] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '';
    const path = loc.startsWith(SITE) ? loc.slice(SITE.length) : loc;
    inSitemap.add(path);
    const page = pages.get(path);
    if (!page) {
      error('sitemap.xml', `URL inexistente: ${loc}`);
      continue;
    }
    if (page.noindex && env === 'production') error('sitemap.xml', `incluye una página con noindex: ${loc}`);
    const alternates = [...block.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g)]
      .map((m) => `${m[1]} ${m[2]}`)
      .sort();
    if (alternates.join('|') !== page.alternates.join('|'))
      error('sitemap.xml', `alternativas de ${loc} distintas a las del <head>`);
  }
  // En staging se publican borradores que no van al sitemap: solo se comprueba en producción.
  for (const path of env === 'production' ? pages.keys() : []) {
    if (!isErrorPage(path) && !expectedNoindex.has(path) && !inSitemap.has(path))
      error('sitemap.xml', `falta ${path}`);
  }
}

// --- Blog: índice, RSS y llms.txt ------------------------------------------
for (const l of locales) {
  const index = pages.get(BLOG[l]);
  const n = blogPosts[l].length;
  if (index && env === 'production') {
    if (n === 0 && index.robots !== 'noindex, follow') error(BLOG[l], `sin artículos debe llevar "noindex, follow" (tiene "${index.robots}")`);
    if (n > 0 && index.noindex) error(BLOG[l], 'tiene artículos publicados: debe indexarse');
  }
  for (const post of blogPosts[l]) {
    if (index && !index.linksTo.has(post) && !htmlPaths.some((p) => p.startsWith(`${BLOG[l]}pagina/`) && pages.get(p)?.linksTo.has(post)))
      error(post, 'el índice del blog no enlaza este artículo');
  }
  const rssFile = join(dist, ...BLOG[l].split('/').filter(Boolean), 'rss.xml');
  if (!existsSync(rssFile)) error(`${BLOG[l]}rss.xml`, 'no existe');
  else {
    const rss = readFileSync(rssFile, 'utf8');
    const links = [...rss.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)].map((m) => m[1].replace(SITE, ''));
    if (links.length !== n) error(`${BLOG[l]}rss.xml`, `${links.length} artículos en el RSS, ${n} publicados`);
    for (const link of links) if (!blogPosts[l].includes(link)) error(`${BLOG[l]}rss.xml`, `enlace a un artículo que no existe: ${link}`);
  }
}
const llmsFile = join(dist, 'llms.txt');
if (!existsSync(llmsFile)) error('llms.txt', 'no existe');
else {
  const llms = readFileSync(llmsFile, 'utf8');
  for (const post of locales.flatMap((l) => blogPosts[l])) if (!llms.includes(SITE + post)) error('llms.txt', `falta el artículo ${post}`);
  for (const path of expectedNoindex) if (llms.includes(`(${SITE}${path})`)) error('llms.txt', `incluye una página noindex: ${path}`);
  if (env === 'production' && /no publicar/i.test(llms)) error('llms.txt', 'incluye un borrador');
}

// --- robots.txt y .htaccess ----------------------------------------------
const robotsFile = join(dist, 'robots.txt');
if (!existsSync(robotsFile)) error('robots.txt', 'no existe');
else {
  const robots = readFileSync(robotsFile, 'utf8');
  if (env === 'production') {
    if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) error('robots.txt', 'no declara el sitemap');
    if (/^Disallow:\s*\S/im.test(robots)) error('robots.txt', 'contiene reglas Disallow en producción');
  } else {
    // Staging: sin Disallow (Google debe poder leer el noindex) y sin línea Sitemap.
    if (/^Disallow:\s*\/\s*$/im.test(robots)) error('robots.txt', 'staging no debe llevar Disallow: / (impediría leer el noindex)');
    if (/^Sitemap:/im.test(robots)) error('robots.txt', 'staging no debe declarar el sitemap');
  }
}
for (const f of ['.htaccess', 'es/.htaccess', '_astro/.htaccess']) if (!existsSync(join(dist, f))) error(f, 'no está en dist/');
if (env === 'staging' && existsSync(join(dist, '.htaccess'))) {
  const ht = readFileSync(join(dist, '.htaccess'), 'utf8');
  if (!/Header always set X-Robots-Tag "noindex, nofollow"/.test(ht)) error('.htaccess', 'staging debe enviar X-Robots-Tag: noindex, nofollow');
  warn('.htaccess', 'staging: recuerda la contraseña HTTP en el panel de Hostinger y revisa que siga activa tras subir dist/ (docs/seguridad.md)');
}
// noindex por cabecera HTTP: no se ve en el HTML pero desindexa igual.
if (env === 'production') {
  for (const file of walk(dist).filter((f) => f.endsWith('.htaccess'))) {
    if (/X-Robots-Tag[^\n]*(noindex|none)/i.test(readFileSync(file, 'utf8')))
      error(relative(dist, file), 'envía X-Robots-Tag noindex en producción');
  }
}

// --- Resultado -----------------------------------------------------------
console.log(`\ncheck-build (${env}${gtmTest ? ' + GTM de prueba' : ''}): ${pages.size} páginas HTML`);
for (const w of warnings) console.warn(`  aviso  ${w}`);
for (const e of errors) console.error(`  ERROR  ${e}`);
if (errors.length) {
  console.error(`\n${errors.length} error(es).`);
  process.exit(1);
}
console.log(`OK${warnings.length ? ` (${warnings.length} avisos)` : ''}\n`);
