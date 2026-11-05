// Auditoría de enlaces de dist/ (sin navegador: analiza el HTML). Uso: npm run check:links
// (o CHECK_DIST=otra/carpeta node scripts/check-links.mjs). Documentado en docs/check-links.md.
//
// Termina con error (exit 1) si encuentra:
//   - un enlace interno roto (no existe el archivo ni la carpeta con index.html);
//   - un ancla (#id) que no existe en la página de destino;
//   - una página sin canonical propio, o con hreflang no recíproco o hacia una página inexistente;
//   - una página indexable fuera del sitemap, o una página noindex dentro del sitemap.
// Avisa (sin error) de los enlaces a borradores ("en preparació") y a páginas noindex a propósito
// (legales en borrador, índice del blog sin artículos), y lista los enlaces entrantes de las
// páginas vigiladas (WATCH).
// También es error:
//   - un parámetro de URL desconocido en un enlace interno, o un ?perfil= que no existe como
//     opción (input name="perfil") en la página de destino (p. ej. /contacte/?perfil=administrador);
//   - un enlace desde una página en un idioma a una página del otro idioma, salvo el selector
//     CA | ES (enlaces con hreflang);
//   - una página vigilada que recibe enlaces de menos de 2 páginas o que no recibe enlace desde la
//     home de su idioma.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { buildEnv } from './lib/build-env.mjs';

const DIST = process.env.CHECK_DIST ?? 'dist';
// Dominio del build (SITE_URL o el canonical de la portada de dist/): nunca escrito a mano.
const { site: SITE, env: ENV } = buildEnv(DIST);
const WATCH = ['/empreses-i-pimes/', '/es/empresas-y-pymes/', '/comunitats-de-veins/', '/es/comunidades-de-vecinos/', '/llars/', '/es/hogares/', '/autoconsum-fotovoltaic/', '/es/autoconsumo-fotovoltaico/', '/gestio-i-tramits/', '/es/gestion-y-tramites/'];
/** Parámetros de URL admitidos en enlaces internos y cómo validarlos contra la página de destino. */
const PARAMS = {
  // Debe existir <input name="perfil" value="…"> en la página de destino (formulario de contacto).
  perfil: (value, target) => !!target && new RegExp(`<input[^>]*name="perfil"[^>]*value="${value.replace(/[^\w-]/g, '')}"`).test(target.html),
};
const langOfPath = (path) => (path === '/es/' || path.startsWith('/es/') ? 'es' : 'ca');

const errors = [];
/** Avisos agrupados: motivo -> destino -> páginas que lo enlazan. */
const warnings = new Map();
const err = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, reason, target) => {
  const byTarget = warnings.get(reason) ?? new Map();
  byTarget.set(target, (byTarget.get(target) ?? new Set()).add(page));
  warnings.set(reason, byTarget);
};

// --- Páginas de dist ----------------------------------------------------------------
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.html')) files.push(full);
  }
};
walk(DIST);

/** dist/foo/index.html -> /foo/ ; dist/404.html -> /404.html */
const toPath = (file) => {
  const rel = '/' + relative(DIST, file).split(sep).join('/');
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
};

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find((v) => v !== undefined);
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

const pages = new Map();
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const path = toPath(file);
  const robots = attr(html.match(/<meta\s+name="robots"[^>]*>/i)?.[0] ?? '', 'content') ?? '';
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const body = html.replace(/<script[\s\S]*?<\/script>/g, '');
  // hreflang en el <a>: enlace del selector de idioma (puede ir al otro idioma).
  const links = [...body.matchAll(/<a\s[^>]*>/gi)]
    .map((m) => ({ href: attr(m[0], 'href'), switcher: attr(m[0], 'hreflang') !== undefined }))
    .filter((l) => l.href !== undefined)
    .map((l) => ({ ...l, href: decode(l.href) }));
  const canonical = attr(html.match(/<link\s+rel="canonical"[^>]*>/i)?.[0] ?? '', 'href');
  const alternates = [...html.matchAll(/<link\s+rel="alternate"[^>]*hreflang[^>]*>/gi)].map((m) => ({
    lang: attr(m[0], 'hreflang'),
    href: attr(m[0], 'href'),
  }));
  const lang = attr(html.match(/<html[^>]*>/i)?.[0] ?? '', 'lang');
  pages.set(path, {
    path,
    html,
    lang,
    ids,
    links,
    canonical,
    alternates,
    noindex: /noindex/i.test(robots),
    noindexFollow: /noindex,\s*follow/i.test(robots),
    draft: /\sdata-draft\b/.test(html),
    error: path === '/404.html' || path === '/es/404.html',
  });
}

const sitemapFile = join(DIST, 'sitemap.xml');
const sitemap = existsSync(sitemapFile)
  ? new Set([...readFileSync(sitemapFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname))
  : null;
if (!sitemap) err('sitemap.xml', 'no existe en dist/');

// --- Resolución de enlaces internos -----------------------------------------------------
/** 'skip' (externo, mailto, tel…), o { path, hash } de un enlace interno. */
function resolve(href, from) {
  if (/^(mailto:|tel:|javascript:|data:)/i.test(href)) return 'skip';
  let url;
  try {
    url = new URL(href, `${SITE}${from}`);
  } catch {
    return { bad: true };
  }
  if (url.origin !== SITE) return 'skip';
  return { path: decodeURIComponent(url.pathname), hash: decodeURIComponent(url.hash.slice(1)), params: url.searchParams };
}

function targetExists(path) {
  if (pages.has(path)) return true;
  const full = join(DIST, path);
  if (!existsSync(full)) return false;
  return statSync(full).isFile() || existsSync(join(full, 'index.html'));
}

const incoming = new Map(WATCH.map((w) => [w, new Map()]));

for (const page of pages.values()) {
  for (const { href, switcher } of page.links) {
    if (href === '#' || href === '') {
      err(page.path, `enlace vacío o a "#": href="${href}"`);
      continue;
    }
    const r = resolve(href, page.path);
    if (r === 'skip') continue;
    if (r.bad) {
      err(page.path, `href no válido: ${href}`);
      continue;
    }
    if (!targetExists(r.path)) {
      err(page.path, `enlace roto: ${href}`);
      continue;
    }
    const target = pages.get(r.path);
    if (r.hash) {
      const ids = target?.ids ?? new Set();
      if (!ids.has(r.hash)) err(page.path, `ancla inexistente: ${href} (no hay id="${r.hash}" en ${r.path})`);
    }
    for (const [name, value] of r.params) {
      const check = PARAMS[name];
      if (!check) err(page.path, `parámetro de URL desconocido en ${href} (admitidos: ${Object.keys(PARAMS).join(', ')})`);
      else if (!check(value, target)) err(page.path, `parámetro no válido: ${href} (${r.path} no tiene la opción ${name}="${value}")`);
    }
    if (target && !page.error && !switcher && langOfPath(r.path) !== langOfPath(page.path))
      err(page.path, `enlace al otro idioma fuera del selector: ${href}`);
    if (target && !page.error) {
      if (target.draft) warn(page.path, 'borrador ("en preparació", noindex): bloquea publicar', r.path);
      else if (target.noindex && !target.error && ENV === 'production')
        warn(page.path, target.noindexFollow ? 'noindex, follow a propósito (índice del blog sin artículos)' : 'noindex a propósito', r.path);
    }
    if (incoming.has(r.path) && r.path !== page.path) {
      const from = incoming.get(r.path);
      from.set(page.path, (from.get(page.path) ?? 0) + 1);
    }
  }
}

// --- Canonical, hreflang y sitemap ------------------------------------------------------
for (const page of pages.values()) {
  if (page.error) continue;
  const self = `${SITE}${page.path}`;
  // Staging: todo lleva noindex por entorno; se comprueba el canonical igualmente y no el sitemap.
  if (ENV === 'staging') {
    if (!page.path.endsWith('404.html') && page.canonical !== self) err(page.path, `canonical "${page.canonical ?? '—'}" no apunta a sí misma (${self})`);
  } else if (!page.noindex) {
    if (page.canonical !== self) err(page.path, `canonical "${page.canonical ?? '—'}" no apunta a sí misma (${self})`);
    if (sitemap && !sitemap.has(page.path)) err(page.path, 'indexable pero fuera del sitemap');
  } else if (sitemap?.has(page.path)) {
    err(page.path, 'noindex pero dentro del sitemap');
  }
  for (const alt of page.alternates) {
    if (!alt.href?.startsWith(SITE)) {
      err(page.path, `hreflang ${alt.lang} sin URL absoluta: ${alt.href}`);
      continue;
    }
    const altPath = new URL(alt.href).pathname;
    if (alt.lang === 'x-default') continue;
    const other = pages.get(altPath);
    if (!other) {
      err(page.path, `hreflang ${alt.lang} apunta a una página inexistente: ${altPath}`);
      continue;
    }
    if (altPath === page.path) {
      if (alt.lang !== page.lang) err(page.path, `auto-referencia hreflang="${alt.lang}" en una página lang="${page.lang}"`);
      continue;
    }
    const back = other.alternates.some((a) => a.lang === page.lang && a.href === self);
    if (!back) err(page.path, `hreflang no recíproco: ${altPath} no enlaza de vuelta con hreflang="${page.lang}"`);
  }
  if (page.alternates.length && !page.alternates.some((a) => a.href === self)) err(page.path, 'hreflang sin auto-referencia');
}

// --- Informe ----------------------------------------------------------------------------
console.log(`check-links: ${pages.size} páginas HTML en ${DIST}/`);
for (const [path, from] of incoming) {
  const total = [...from.values()].reduce((a, b) => a + b, 0);
  console.log(`\nEnlaces entrantes a ${path}: ${total} desde ${from.size} páginas`);
  for (const [src, n] of [...from].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`  ${src}  (${n})`);
  if (!pages.has(path)) err(path, 'la página vigilada no existe en dist/');
  else if (from.size < 2) err(path, 'página casi huérfana: recibe enlaces de menos de 2 páginas');
  else if (!from.has(langOfPath(path) === 'es' ? '/es/' : '/')) err(path, 'no recibe ningún enlace desde la home de su idioma');
}
const uniq = (list) => [...new Set(list)];
if (warnings.size) {
  console.log('\nAvisos (páginas enlazadas que no son indexables; no son errores):');
  for (const [reason, byTarget] of warnings) {
    console.log(`  ${reason}:`);
    for (const [target, from] of [...byTarget].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`    ${target}  <- ${from.size} páginas`);
  }
}
if (errors.length) {
  console.log(`\nErrores (${uniq(errors).length}):`);
  for (const e of uniq(errors)) console.log(`  ERROR  ${e}`);
  process.exit(1);
}
console.log('\nOK: sin enlaces rotos, anclas, canonical, hreflang ni sitemap con errores.');
