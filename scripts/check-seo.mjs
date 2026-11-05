// Auditoría SEO técnica de dist/ (sin navegador). Uso: npm run check:seo (también lo lanza
// npm run check:links). Documentado en docs/check-seo.md.
//
// Entorno y dominio: SITE_ENV / SITE_URL o, si no están, lo que dice el propio dist/
// (scripts/lib/build-env.mjs). Lista blanca de noindex: src/config/indexing.ts.
//
// Producción, falla (exit 1) si:
//   - hay noindex fuera de la lista blanca, o robots.txt contiene "Disallow: /";
//   - una URL del sitemap tiene noindex, no existe (redirigiría) o no tiene contenido propio
//     (canonical hacia otra URL o meta refresh);
//   - una página indexable no está en el sitemap, o es huérfana (no se llega a ella desde la portada);
// En los dos entornos, falla si:
//   - el canonical no apunta a la propia URL (mismo dominio y misma barra final);
//   - el hreflang no es recíproco, falta x-default o apunta a una URL que no existe;
//   - <html lang> no corresponde a la ruta, o no hay exactamente un H1;
//   - title o meta description vacíos, duplicados o largos (title > 60, description > 160);
//   - un JSON-LD no es JSON válido, o su FAQPage no coincide palabra por palabra con lo visible;
//   - una imagen no tiene atributo alt (las decorativas, alt="") o no tiene width y height;
//   - un enlace interno está roto, no lleva barra final o tiene mayúsculas.
// Staging, además: todas las páginas deben llevar noindex (y robots.txt sin "Disallow: /").
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { NOINDEX_ALLOWLIST } from '../src/config/indexing.ts';
import { buildEnv } from './lib/build-env.mjs';

const DIST = process.env.CHECK_DIST ?? 'dist';
if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`check-seo: no existe ${DIST}/index.html. Ejecuta antes npm run build.`);
  process.exit(1);
}
const { site: SITE, env: ENV } = buildEnv(DIST);
const TITLE_MAX = 60;
const DESC_MAX = 160;
const allow = new Set(NOINDEX_ALLOWLIST);

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
};
const pathOf = (file) => '/' + relative(DIST, file).split(sep).join('/').replace(/(^|\/)index\.html$/, '$1');
const isError = (p) => p.endsWith('404.html');
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1];
const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
const norm = (s) => decode(s).replace(/\s+/g, ' ').trim();
const visible = (html) =>
  norm(
    html
      .replace(/<head[\s\S]*?<\/head>/i, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<template[\s\S]*?<\/template>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  );

// --- Lectura de páginas ------------------------------------------------------------
const pages = new Map();
for (const file of walk(DIST)) {
  const html = readFileSync(file, 'utf8');
  const path = pathOf(file);
  const metaContent = (name) => attr(html.match(new RegExp(`<meta[^>]*name="${name}"[^>]*>`, 'i'))?.[0] ?? '', 'content');
  pages.set(path, {
    path,
    html,
    lang: attr(html.match(/<html[^>]*>/i)?.[0] ?? '', 'lang'),
    robots: metaContent('robots') ?? '',
    canonicals: [...html.matchAll(/<link[^>]*rel="canonical"[^>]*>/gi)].map((m) => attr(m[0], 'href')),
    alternates: Object.fromEntries(
      [...html.matchAll(/<link[^>]*rel="alternate"[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"[^>]*>/gi)].map((m) => [m[1], m[2]]),
    ),
    title: norm(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? ''),
    description: norm(metaContent('description') ?? ''),
    refresh: /<meta[^>]*http-equiv="refresh"/i.test(html),
    links: new Set(),
  });
}
const noindex = (p) => /noindex|none/i.test(p.robots);

// --- robots.txt --------------------------------------------------------------------
const robotsTxt = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : null;
if (robotsTxt === null) err('robots.txt', 'no existe');
else {
  if (/^Disallow:\s*\/\s*$/im.test(robotsTxt)) err('robots.txt', 'contiene "Disallow: /"');
  if (ENV === 'production') {
    if (!/^User-agent:\s*\*/im.test(robotsTxt) || !/^Allow:\s*\/\s*$/im.test(robotsTxt)) err('robots.txt', 'debe tener "User-agent: *" y "Allow: /"');
    if (!robotsTxt.includes(`Sitemap: ${SITE}/sitemap.xml`)) err('robots.txt', `falta "Sitemap: ${SITE}/sitemap.xml"`);
  }
}

// --- Por página -------------------------------------------------------------------
const seen = { title: new Map(), description: new Map() };
for (const page of pages.values()) {
  const { path, html } = page;

  // Indexación según el entorno.
  if (ENV === 'staging' && !noindex(page)) err(path, 'staging: falta noindex');
  if (ENV === 'production' && noindex(page) && !allow.has(path)) err(path, `noindex fuera de la lista blanca (${page.robots})`);
  if (ENV === 'production' && allow.has(path) && !noindex(page)) err(path, 'está en la lista blanca pero no lleva noindex');

  // Idioma y H1.
  const expectedLang = path.startsWith('/es/') ? 'es' : 'ca';
  if (page.lang !== expectedLang) err(path, `<html lang="${page.lang ?? ''}">, se esperaba "${expectedLang}"`);
  const h1 = (html.match(/<h1[\s>]/gi) ?? []).length;
  if (h1 !== 1) err(path, `${h1} H1 (debe haber exactamente uno)`);

  // Title y meta description.
  for (const [field, max] of [['title', TITLE_MAX], ['description', DESC_MAX]]) {
    const value = page[field];
    if (!value) err(path, `${field} vacío`);
    else if ([...value].length > max) err(path, `${field} de ${[...value].length} caracteres (máx. ${max}): "${value}"`);
    if (!isError(path) && value) {
      const other = seen[field].get(value);
      if (other) err(path, `${field} duplicado con ${other}`);
      else seen[field].set(value, path);
    }
  }

  // Canonical.
  if (!isError(path)) {
    if (page.canonicals.length !== 1) err(path, `${page.canonicals.length} canonical (debe haber uno)`);
    const c = page.canonicals[0];
    if (c && c !== SITE + path) {
      if (!c.startsWith(SITE)) err(path, `canonical con otro dominio: ${c}`);
      else if (c.replace(/\/$/, '') === (SITE + path).replace(/\/$/, '')) err(path, `canonical con barra final distinta: ${c}`);
      else err(path, `canonical no apunta a sí misma: ${c}`);
    }
  }

  // JSON-LD y FAQ visible.
  // Al quitar etiquetas queda un espacio antes de la puntuación ("<a>…</a>."): se compara sin él.
  const loose = (s) => norm(s).replace(/\s+([.,;:!?)»])/g, '$1');
  const text = loose(visible(html));
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    let data;
    try {
      data = JSON.parse(json);
    } catch (e) {
      err(path, `JSON-LD no válido: ${e.message}`);
      continue;
    }
    for (const node of data['@graph'] ?? [data]) {
      if (node['@type'] !== 'FAQPage') continue;
      for (const q of node.mainEntity ?? []) {
        if (!text.includes(loose(q.name ?? ''))) err(path, `FAQ: la pregunta del JSON-LD no está tal cual en la página: "${q.name}"`);
        const a = loose(q.acceptedAnswer?.text ?? '');
        if (!text.includes(a)) err(path, `FAQ: la respuesta del JSON-LD no está tal cual en la página: "${a.slice(0, 80)}…"`);
      }
    }
  }

  // Imágenes.
  for (const [img] of html.matchAll(/<img\b[^>]*>/gi)) {
    // `alt` sin valor equivale a alt="" (Astro lo escribe así en las imágenes decorativas).
    if (!/\salt(=|\s|\/?>)/i.test(img)) err(path, `<img> sin atributo alt (decorativas: alt=""): ${img.slice(0, 120)}`);
    if (!/^\d+$/.test(attr(img, 'width') ?? '') || !/^\d+$/.test(attr(img, 'height') ?? ''))
      err(path, `<img> sin width y height: ${img.slice(0, 120)}`);
  }

  // Enlaces internos.
  for (const [a] of html.matchAll(/<a\b[^>]*>/gi)) {
    let href = attr(a, 'href');
    if (!href) continue;
    href = decode(href);
    if (href.startsWith(SITE)) href = href.slice(SITE.length) || '/';
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const target = href.split(/[?#]/)[0];
    if (/\.[a-z0-9]+$/i.test(target) && !target.endsWith('.html')) {
      if (!existsSync(join(DIST, target))) err(path, `enlace a un archivo inexistente: ${href}`);
      continue;
    }
    if (/[A-Z]/.test(target)) err(path, `enlace interno con mayúsculas: ${href}`);
    if (!target.endsWith('/') && !target.endsWith('.html')) err(path, `enlace interno sin barra final: ${href}`);
    else if (!pages.has(target)) err(path, `enlace interno roto: ${href}`);
    else page.links.add(target);
  }
}

// --- hreflang ---------------------------------------------------------------------
for (const page of pages.values()) {
  if (isError(page.path)) continue;
  const alts = page.alternates;
  const langs = Object.keys(alts);
  if (!langs.length) {
    err(page.path, 'sin hreflang');
    continue;
  }
  if (!alts['x-default']) err(page.path, 'hreflang sin x-default');
  if (alts[page.lang] !== SITE + page.path) err(page.path, `hreflang sin auto-referencia (${alts[page.lang] ?? '—'})`);
  for (const [l, href] of Object.entries(alts)) {
    const target = href.startsWith(SITE) ? href.slice(SITE.length) : null;
    const other = target && pages.get(target);
    if (!other) {
      err(page.path, `hreflang "${l}" apunta a una URL que no existe en el build: ${href}`);
      continue;
    }
    if (l === 'x-default') continue;
    if (JSON.stringify(other.alternates) !== JSON.stringify(alts)) err(page.path, `hreflang no recíproco con ${target}`);
  }
}

// --- Sitemap y huérfanas (producción) ------------------------------------------------
if (ENV === 'production') {
  const sitemapFile = join(DIST, 'sitemap.xml');
  const xml = existsSync(sitemapFile) ? readFileSync(sitemapFile, 'utf8') : '';
  if (!xml) err('sitemap.xml', 'no existe');
  const inSitemap = new Set();
  for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const path = loc.startsWith(SITE) ? loc.slice(SITE.length) : null;
    if (!path) {
      err('sitemap.xml', `URL de otro dominio: ${loc}`);
      continue;
    }
    inSitemap.add(path);
    const page = pages.get(path);
    if (!page) err('sitemap.xml', `URL sin página propia en el build (redirigiría o daría 404): ${loc}`);
    else if (noindex(page)) err('sitemap.xml', `URL con noindex: ${loc}`);
    else if (page.refresh) err('sitemap.xml', `URL que redirige (meta refresh): ${loc}`);
    else if (page.canonicals[0] !== loc) err('sitemap.xml', `URL sin contenido propio (canonical a ${page.canonicals[0]}): ${loc}`);
  }
  const indexable = [...pages.values()].filter((p) => !noindex(p) && !isError(p.path));
  for (const p of indexable) if (!inSitemap.has(p.path)) err(p.path, 'indexable pero fuera del sitemap');

  const reached = new Set(['/', '/es/'].filter((p) => pages.has(p)));
  const queue = [...reached];
  while (queue.length) {
    for (const to of pages.get(queue.shift()).links) {
      if (!reached.has(to)) {
        reached.add(to);
        queue.push(to);
      }
    }
  }
  for (const p of indexable) if (!reached.has(p.path)) err(p.path, 'página huérfana: no se llega a ella con enlaces desde la portada');
}

// --- Resultado --------------------------------------------------------------------
console.log(`check-seo (${ENV}, ${SITE}): ${pages.size} páginas HTML`);
for (const w of warnings) console.log(`  aviso  ${w}`);
for (const e of errors) console.log(`  ERROR  ${e}`);
if (errors.length) {
  console.log(`\n${errors.length} error(es).`);
  process.exit(1);
}
console.log('OK: indexación, canonical, hreflang, sitemap, encabezados, metadatos, JSON-LD, imágenes y enlaces.');
