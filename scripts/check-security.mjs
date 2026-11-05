// Comprobaciones de seguridad sobre dist/ (sin navegador). Uso: npm run check:security
// (también al final de npm run build). Documentado en docs/seguridad.md.
//
// Falla (exit 1) si:
//   - dist/ contiene .map, .env, .git, docs/, node_modules/, manifiestos de dependencias o copias
//     (.bak, .old, .orig, .swp, .zip, .tar, .gz…); los únicos archivos ocultos admitidos son los
//     .htaccess y /.well-known/;
//   - una regla de bloqueo del .htaccess afecta a un archivo de dist/ (robots.txt, sitemap,
//     llms.txt, favicons, /.well-known/ o cualquier recurso de las páginas);
//   - hay recursos http:// o scripts/estilos de otros dominios en el HTML, o dominios externos en
//     el JavaScript que no sean Google Tag Manager;
//   - un enlace target="_blank" no lleva rel="noopener";
//   - producción: X-Robots-Tag en el .htaccess, noindex fuera de la lista blanca
//     (src/config/indexing.ts, mismo criterio que check:seo) o faltan las cabeceras de seguridad;
//   - un formulario no usa POST, envía a una URL que no es https, no tiene honeypot (_gotcha) o no
//     tiene la casilla de privacidad obligatoria y desmarcada;
//   - aparece un patrón de secreto (claves de API, tokens, claves privadas) en dist/ o en src/;
//   - falta /.well-known/security.txt o ha caducado.
// Avisa (sin fallar) de los formularios sin destino (PUBLIC_FORM_ENDPOINT vacío).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { NOINDEX_ALLOWLIST } from '../src/config/indexing.ts';
import { isBlockedPath } from '../src/config/server.mjs';
import { buildEnv } from './lib/build-env.mjs';

const DIST = process.env.CHECK_DIST ?? 'dist';
if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`check-security: no existe ${DIST}/index.html. Ejecuta antes npm run build.`);
  process.exit(1);
}
const { env: ENV } = buildEnv(DIST);
const ALLOWED_SCRIPT_HOSTS = new Set(['www.googletagmanager.com']);
const SECRET = /(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk_(live|test)_[0-9A-Za-z]{16,}|ghp_[0-9A-Za-z]{36}|github_pat_[0-9A-Za-z_]{40,}|xox[baprs]-[0-9A-Za-z-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api[_-]?key|secret|token|password|passwd)["']?\s*[:=]\s*["'][^"'\s]{8,})/i;

const errors = [];
const warnings = [];
const err = (w, m) => errors.push(`${w}: ${m}`);
const warn = (w, m) => warnings.push(`${w}: ${m}`);

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
};
const rel = (f) => relative(DIST, f).split(sep).join('/');
const files = walk(DIST);

// --- 1. Archivos que no deben estar en dist/ y reglas de bloqueo ---------------------------------
const FORBIDDEN = /(^|\/)(\.git|\.env[^/]*|docs|node_modules)(\/|$)|\.(map|bak|old|orig|swp|tmp|log|sql|zip|tar|gz|tgz|7z|rar)$|~$|(^|\/)(package(-lock)?\.json)$/i;
for (const f of files) {
  const p = rel(f);
  if (FORBIDDEN.test(p)) err(p, 'archivo que no debe publicarse');
  const hidden = /(^|\/)\./.test(p);
  if (hidden && !/(^|\/)\.htaccess$/.test(p) && !p.startsWith('.well-known/')) err(p, 'archivo oculto no permitido');
  // Todo lo que hay en dist/ se publica para servirse: ninguna regla del .htaccess puede bloquearlo.
  if (!/(^|\/)\.htaccess$/.test(p) && isBlockedPath(p)) err(p, 'lo bloquearía una regla del .htaccess (src/config/server.mjs)');
}
for (const must of ['robots.txt', 'sitemap.xml', 'llms.txt', '.well-known/security.txt']) {
  if (!existsSync(join(DIST, must))) err(must, 'no existe');
  else if (isBlockedPath(must)) err(must, 'lo bloquearía una regla del .htaccess');
}

// --- 2. HTML: recursos, enlaces, indexación y formularios ----------------------------------------
const allow = new Set(NOINDEX_ALLOWLIST);
for (const f of files.filter((x) => x.endsWith('.html'))) {
  const html = readFileSync(f, 'utf8');
  const path = '/' + rel(f).replace(/(^|\/)index\.html$/, '$1');

  for (const m of html.matchAll(/<(script|link|img|source|iframe|video|audio|form)\b[^>]*>/gi)) {
    const tag = m[0];
    for (const [, attr, url] of tag.matchAll(/\s(src|href|srcset|action)="([^"]*)"/gi)) {
      if (/^http:\/\//i.test(url)) err(path, `recurso http:// (contenido mixto): ${url}`);
      if (m[1].toLowerCase() === 'script' && attr === 'src' && /^https?:\/\//i.test(url)) {
        const host = new URL(url).host;
        if (!ALLOWED_SCRIPT_HOSTS.has(host)) err(path, `script de un dominio no permitido: ${url}`);
      }
      if (m[1].toLowerCase() === 'link' && /rel="(stylesheet|preload|modulepreload|icon)"/i.test(tag) && /^https?:\/\//i.test(url))
        err(path, `recurso cargado desde otro dominio: ${url}`);
    }
  }
  if (/url\(\s*['"]?http:\/\//i.test(html)) err(path, 'url(http://…) en estilos');

  for (const [a] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
    if (!/\srel="[^"]*\bnoopener\b/i.test(a)) err(path, `target="_blank" sin rel="noopener": ${a.slice(0, 120)}`);
  }

  if (ENV === 'production') {
    const robots = html.match(/<meta[^>]*name="robots"[^>]*content="([^"]*)"/i)?.[1] ?? '';
    if (/noindex/i.test(robots) && !allow.has(path)) err(path, `noindex fuera de la lista blanca (${robots})`);
  }

  for (const [form] of html.matchAll(/<form\b[\s\S]*?<\/form>/gi)) {
    const open = form.match(/<form\b[^>]*>/i)[0];
    const where = `${path} ${open.match(/class="([^"]*)"/)?.[1] ?? 'form'}`;
    if (!/\smethod="post"/i.test(open)) err(where, 'el formulario no usa method="POST"');
    const action = open.match(/\saction="([^"]*)"/i)?.[1];
    if (action === undefined) warn(where, 'sin destino (PUBLIC_FORM_ENDPOINT vacío): se ve pero no envía');
    else if (!/^https:\/\//i.test(action)) err(where, `envía a una URL que no es https: ${action}`);
    const honeypot = form.match(/<input\b[^>]*name="_gotcha"[^>]*>/i)?.[0];
    if (!honeypot) err(where, 'sin honeypot (_gotcha)');
    else if (!/tabindex="-1"/.test(honeypot) || !/autocomplete="off"/.test(honeypot)) err(where, 'honeypot sin tabindex="-1" o autocomplete="off"');
    const consent = form.match(/<input\b[^>]*name="consentiment"[^>]*>/i)?.[0];
    if (!consent) err(where, 'sin casilla de privacidad');
    else if (!/\srequired\b/.test(consent) || /\schecked\b/.test(consent)) err(where, 'la casilla de privacidad debe ser obligatoria y estar desmarcada');
  }
}

// --- 3. JavaScript: dominios externos ------------------------------------------------------------
for (const f of files.filter((x) => x.endsWith('.js'))) {
  for (const [url] of readFileSync(f, 'utf8').matchAll(/https?:\/\/[a-z0-9.-]+/gi)) {
    if (!ALLOWED_SCRIPT_HOSTS.has(new URL(url).host)) err(rel(f), `dominio externo en el JavaScript: ${url}`);
  }
}

// --- 4. .htaccess --------------------------------------------------------------------------------
const ht = existsSync(join(DIST, '.htaccess')) ? readFileSync(join(DIST, '.htaccess'), 'utf8') : '';
if (!ht) err('.htaccess', 'no existe');
else {
  for (const h of ['X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'X-Frame-Options', 'Strict-Transport-Security', 'Content-Security-Policy-Report-Only'])
    if (!new RegExp(`Header always set ${h} `).test(ht)) err('.htaccess', `falta la cabecera ${h}`);
  if (!/frame-ancestors 'self'/.test(ht)) err('.htaccess', "la CSP no incluye frame-ancestors 'self'");
  if (/script-src[^;"]*'unsafe-inline'/.test(ht)) err('.htaccess', "la CSP permite 'unsafe-inline' en scripts");
  if (!/^Options -Indexes/m.test(ht)) err('.htaccess', 'falta Options -Indexes');
  if (!/^ErrorDocument 404 \/404\.html/m.test(ht)) err('.htaccess', 'falta ErrorDocument 404');
  if (ENV === 'production' && /X-Robots-Tag/i.test(ht)) err('.htaccess', 'X-Robots-Tag en producción');
  if (ENV === 'staging' && !/X-Robots-Tag "noindex, nofollow"/.test(ht)) err('.htaccess', 'staging sin X-Robots-Tag noindex');
}

// --- 5. Secretos ---------------------------------------------------------------------------------
const TEXT = /\.(html|js|mjs|ts|astro|css|json|txt|xml|md|mdx|ya?ml|env|htaccess)$/i;
for (const f of [...files, ...walk('src')].filter((x) => TEXT.test(x) || /(^|[\\/])\.[a-z]/i.test(x))) {
  const text = readFileSync(f, 'utf8');
  const m = text.match(SECRET);
  if (m) err(relative('.', f).split(sep).join('/'), `posible secreto: ${m[0].slice(0, 40)}…`);
}

// --- 6. security.txt ------------------------------------------------------------------------------
const sec = existsSync(join(DIST, '.well-known/security.txt')) ? readFileSync(join(DIST, '.well-known/security.txt'), 'utf8') : '';
if (sec) {
  if (!/^Contact: mailto:/m.test(sec)) err('.well-known/security.txt', 'falta Contact');
  const exp = sec.match(/^Expires: (\S+)/m)?.[1];
  if (!exp || !(Date.parse(exp) > Date.now())) err('.well-known/security.txt', `Expires ausente o caducado (${exp ?? '—'})`);
  else if (Date.parse(exp) - Date.now() < 30 * 864e5) warn('.well-known/security.txt', `caduca pronto (${exp}): renuévalo`);
}

// --- Resultado -----------------------------------------------------------------------------------
console.log(`check-security (${ENV}): ${files.length} archivos en ${DIST}/`);
for (const w of [...new Set(warnings)]) console.log(`  aviso  ${w}`);
for (const e of errors) console.log(`  ERROR  ${e}`);
if (errors.length) {
  console.log(`\n${errors.length} error(es).`);
  process.exit(1);
}
console.log('OK: sin archivos sensibles, recursos externos no permitidos, enlaces inseguros, secretos ni fallos de cabeceras o formularios.');
