// Configuración del servidor (Hostinger: Apache / LiteSpeed). La usa astro.config.mjs al terminar
// cada build: limpia los comentarios HTML de dist/, calcula los hashes de los scripts en línea y
// escribe dist/.htaccess y dist/_astro/.htaccess según SITE_ENV.
// No edites esos archivos en dist/ ni subas a producción el .htaccess de staging.
// Explicación: docs/despliegue.md (entornos) y docs/seguridad.md (cabeceras, CSP, bloqueos).
import { createHash } from 'node:crypto';

const escapeHost = (host) => host.replace(/\./g, '\\.');

// --- Archivos que nunca se sirven -----------------------------------------------------------
// Mismo criterio en Apache (reglas de abajo) y en JavaScript (scripts/check-security.mjs).
// Excepciones obligatorias: /.well-known/, robots.txt, sitemap*.xml, llms.txt, favicons, manifest y
// cualquier recurso de las páginas. check-security comprueba que ninguna regla las afecta.
export const BLOCK_RULES = [
  { why: 'archivo o carpeta oculta (.git, .env…), salvo /.well-known/', js: /(^|\/)\.(?!well-known(\/|$))/, apache: '(^|/)\\.(?!well-known(/|$))' },
  { why: 'carpetas de trabajo', js: /^(docs|node_modules|src|scripts)(\/|$)/, apache: '^(docs|node_modules|src|scripts)(/|$)' },
  {
    why: 'mapas de código, Markdown, registros, volcados y copias',
    js: /\.(map|md|mdx|log|sql|bak|old|orig|swp|tmp|zip|tar|gz|tgz|7z|rar)$/i,
    apache: '\\.(map|md|mdx|log|sql|bak|old|orig|swp|tmp|zip|tar|gz|tgz|7z|rar)$',
  },
  { why: 'manifiestos de dependencias', js: /(^|\/)(package(-lock)?\.json|composer\.(json|lock))$/i, apache: '(^|/)(package(-lock)?\\.json|composer\\.(json|lock))$' },
];
export const isBlockedPath = (relPath) => BLOCK_RULES.some((r) => r.js.test(relPath.replace(/^\/+/, '')));

// --- Comentarios HTML -----------------------------------------------------------------------
/** Quita los comentarios HTML (notas internas de desarrollo) sin tocar <script>, <style>, <pre> ni <textarea>. */
export function stripHtmlComments(html) {
  let out = '';
  let i = 0;
  const raw = /<(script|style|pre|textarea)\b/gi;
  while (i < html.length) {
    const c = html.indexOf('<!--', i);
    raw.lastIndex = i;
    const r = raw.exec(html);
    if (c === -1 && !r) break;
    if (r && (c === -1 || r.index < c)) {
      const close = html.toLowerCase().indexOf(`</${r[1].toLowerCase()}`, r.index);
      const end = close === -1 ? html.length : close;
      out += html.slice(i, end);
      i = end;
      continue;
    }
    out += html.slice(i, c);
    const endC = html.indexOf('-->', c + 4);
    i = endC === -1 ? html.length : endC + 3;
  }
  return out + html.slice(i);
}

// --- CSP -------------------------------------------------------------------------------------
/** Hashes SHA-256 de los scripts en línea ejecutables (no los JSON-LD) de un HTML. */
export function inlineScriptHashes(html) {
  const hashes = new Set();
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    if (/\ssrc=/i.test(attrs) || /type="application\/ld\+json"/i.test(attrs) || !m[2]) continue;
    hashes.add(`'sha256-${createHash('sha256').update(m[2], 'utf8').digest('base64')}'`);
  }
  return hashes;
}

const GTM = 'https://www.googletagmanager.com';
const GA = ['https://*.google-analytics.com', 'https://*.analytics.google.com'];

/**
 * Política construida con lo que la web carga de verdad:
 * - scripts propios (/_astro/) y los en línea por hash; GTM solo tras el consentimiento;
 * - estilos propios y en línea (atributos style y <style> de Astro): 'unsafe-inline' solo en style-src;
 * - GA4 envía a *.google-analytics.com / *.analytics.google.com (connect-src e img-src);
 * - formulario: POST y fetch al servicio de PUBLIC_FORM_ENDPOINT (Formspree por defecto);
 * - mapa de Google Maps embebido (pie y contacto), solo tras el consentimiento: frame-src.
 */
export function buildCsp({ scriptHashes, formOrigin }) {
  const form = formOrigin ? ` ${formOrigin}` : '';
  return [
    "default-src 'self'",
    `script-src 'self' ${[...scriptHashes].sort().join(' ')} ${GTM}`.replace(/\s+/g, ' ').trim(),
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: ${GTM} ${GA.join(' ')}`,
    "font-src 'self'",
    `connect-src 'self'${form} ${GTM} ${GA.join(' ')}`,
    'frame-src https://www.google.com',
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    `form-action 'self'${form}`,
    "frame-ancestors 'self'",
  ].join('; ');
}

// --- .htaccess -------------------------------------------------------------------------------
/**
 * @param {{ env: 'production' | 'staging', siteUrl: string, csp: string }} o
 */
export function htaccess({ env, siteUrl, csp }) {
  const host = new URL(siteUrl).host;
  const staging = env === 'staging';
  // Staging: se redirige al host de la propia petición, para no mandar nunca a producción
  // (por ejemplo, si el build de pruebas se hizo sin SITE_URL propio).
  const target = staging ? '%{HTTP_HOST}' : host;
  const lines = [
    `# Generado por el build (src/config/server.mjs). Entorno: ${env}. Dominio: ${siteUrl}`,
    '# No editar a mano: se sobrescribe en cada build.',
    '',
    '# Sin listado de directorios.',
    'Options -Indexes',
    '',
    'ErrorDocument 404 /404.html',
    '',
    '<IfModule mod_rewrite.c>',
    '  RewriteEngine On',
    '',
    '  # Archivos que nunca se sirven (responden 404). Nunca afectan a /.well-known/, robots.txt,',
    '  # sitemap.xml, llms.txt, favicons ni a los recursos de las páginas (lo comprueba check-security).',
    ...BLOCK_RULES.flatMap((r) => [`  # ${r.why}`, `  RewriteRule ${r.apache} - [NC,R=404,L]`]),
    '',
    '  # Una sola versión de cada URL, siempre con una única redirección 301:',
    '  # 1) Carpeta sin barra final (/llars) -> https://dominio/llars/',
    '  RewriteCond %{REQUEST_FILENAME} -d',
    '  RewriteCond %{REQUEST_URI} !/$',
    `  RewriteRule ^ https://${target}%{REQUEST_URI}/ [R=301,L]`,
  ];
  if (!staging) {
    lines.push(
      '  # 2) Otro host (www., IP, alias) -> dominio sin www',
      `  RewriteCond %{HTTP_HOST} !^${escapeHost(host)}$ [NC]`,
      `  RewriteRule ^ https://${host}%{REQUEST_URI} [R=301,L]`,
    );
  }
  lines.push(
    '  # 3) http -> https (también detrás de proxy)',
    '  RewriteCond %{HTTPS} !=on',
    '  RewriteCond %{HTTP:X-Forwarded-Proto} !=https',
    `  RewriteRule ^ https://${target}%{REQUEST_URI} [R=301,L]`,
    '</IfModule>',
    '',
    '# Cabeceras de seguridad en todas las respuestas.',
    '<IfModule mod_headers.c>',
    '  Header always set X-Content-Type-Options "nosniff"',
    '  Header always set Referrer-Policy "strict-origin-when-cross-origin"',
    '  Header always set X-Frame-Options "SAMEORIGIN"',
    '  # Funciones del navegador que la web no usa.',
    '  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=(), display-capture=(), browsing-topics=()"',
    '  # HSTS: empieza con 5 minutos, sin includeSubDomains ni preload. Cuando https funcione bien en',
    '  # todo el dominio durante unas semanas, subir por pasos (1 semana -> 1 mes -> 1 año: 604800,',
    '  # 2592000, 31536000). includeSubDomains solo si TODOS los subdominios tienen https; preload,',
    '  # nunca sin decidirlo antes (es difícil de deshacer). Ver docs/seguridad.md.',
    '  Header always set Strict-Transport-Security "max-age=300"',
    '  # CSP en modo SOLO INFORME: no bloquea nada, solo avisa en la consola del navegador.',
    '  # Para pasarla a obligatoria, ver docs/seguridad.md.',
    `  Header always set Content-Security-Policy-Report-Only "${csp}"`,
  );
  if (staging) {
    lines.push('  # Pruebas: fuera de Google aunque el entorno se filtre (además del <meta robots> de cada página).');
    lines.push('  Header always set X-Robots-Tag "noindex, nofollow"');
  }
  lines.push('</IfModule>', '');
  if (staging) {
    lines.push('# La contraseña HTTP de pruebas se configura en el panel de Hostinger (docs/seguridad.md).', '');
  }

  lines.push(
    '# Compresión (LiteSpeed comprime por su cuenta; esto cubre Apache).',
    '<IfModule mod_deflate.c>',
    '  AddOutputFilterByType DEFLATE text/html text/plain text/css text/xml application/xml application/javascript text/javascript application/json image/svg+xml',
    '</IfModule>',
    '',
    '# Caché: HTML, sitemap, robots y llms.txt se revalidan siempre; tipografías 30 días.',
    '# Los archivos de /_astro/ llevan hash en el nombre: caché de un año (ver _astro/.htaccess).',
    '<IfModule mod_headers.c>',
    '  <FilesMatch "\\.(html|xml|txt)$">',
    '    Header set Cache-Control "no-cache"',
    '  </FilesMatch>',
    '  <FilesMatch "\\.woff2$">',
    '    Header set Cache-Control "public, max-age=2592000"',
    '  </FilesMatch>',
    '</IfModule>',
    '',
  );
  return lines.join('\n');
}

/** /_astro/: nombres con hash, nunca cambian de contenido. */
export function htaccessAssets() {
  return [
    '# Generado por el build (src/config/server.mjs). Archivos con hash: caché de un año.',
    '<IfModule mod_headers.c>',
    '  Header set Cache-Control "public, max-age=31536000, immutable"',
    '</IfModule>',
    '',
  ].join('\n');
}
