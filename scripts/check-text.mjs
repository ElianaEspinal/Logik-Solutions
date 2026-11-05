// Comprobación tipográfica de los textos (sin navegador). Uso: npm run check:text
// (también corre al final de npm run build). Documentado en docs/check-text.md.
//
// ERROR (exit 1): apóstrofo curvo (U+2019) en src/, public/ o en los textos generados de dist/
//   (HTML, incluidos metas, alt, aria-label y JSON-LD; XML, TXT, JSON y webmanifest).
//   La regla es usar siempre el apóstrofo recto ('). En código que deba reconocer el curvo
//   (p. ej. una expresión regular), escríbelo como \u2019.
// [[PENDENT / [[PENDIENTE (datos sin confirmar, src/config/legal.ts) en el HTML de dist/: ERROR (exit 1) en el
//   build de producción, con la lista de páginas y datos; AVISO en el de staging. El entorno sale de
//   SITE_ENV o, si no está, del propio dist/ (scripts/lib/build-env.mjs).
// AVISO: artículos del blog con la marca "PENDIENTE DE VERIFICACIÓN" (frontmatter o cuerpo).
// AVISO (sin error): "l.l" o "l•l" entre letras en el texto visible de dist/ y en los artículos
//   .md/.mdx, donde debería ir la ela geminada con punto volado "l·l" (U+00B7).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { buildEnv } from './lib/build-env.mjs';

const CURLY = '\u2019';
const DIST = process.env.CHECK_DIST ?? 'dist';
const SOURCE_DIRS = ['src', 'public'];
const SOURCE_EXT = new Set(['.astro', '.ts', '.mjs', '.js', '.md', '.mdx', '.css', '.json', '.txt', '.yml', '.yaml', '.svg', '.html', '.xml']);
const DIST_EXT = new Set(['.html', '.xml', '.txt', '.json', '.webmanifest']);
// Ela geminada mal escrita: letra + l + (punto o viñeta) + l + letra. Ej.: "col.lecció", "instal•lació".
const BAD_GEMINATE = /[a-zà-ÿ]l[.•]l[a-zà-ÿ]/giu;

const PENDING = '[[PENDIENTE';
const VERIFY = /PENDIENTE DE VERIFICACI[OÓ]N/i;
const errors = [];
const pendingErrors = [];
const verifyWarnings = [];
const warnings = [];
const rel = (f) => relative('.', f).split(sep).join('/');

const walk = (dir, exts, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, exts, out);
    else if (exts.has(extname(name).toLowerCase())) out.push(full);
  }
  return out;
};

/** Líneas (1-based) con el apóstrofo curvo y un fragmento de contexto. */
const findCurly = (file, text) => {
  text.split(/\r?\n/).forEach((line, i) => {
    let at = line.indexOf(CURLY);
    while (at !== -1) {
      errors.push(`${rel(file)}:${i + 1}  …${line.slice(Math.max(0, at - 30), at + 30).trim()}…`);
      at = line.indexOf(CURLY, at + 1);
    }
  });
};

const findGeminate = (file, text) => {
  for (const m of text.matchAll(BAD_GEMINATE)) {
    const s = text.slice(Math.max(0, m.index - 25), m.index + 30).replace(/\s+/g, ' ');
    warnings.push(`${rel(file)}  "${m[0]}" (¿l·l?)  …${s}…`);
  }
};

/** Texto visible de un HTML: sin scripts, estilos, comentarios ni etiquetas; con alt/title/aria-label/content. */
const visibleText = (html) => {
  const attrs = [...html.matchAll(/\s(?:alt|title|aria-label|content)="([^"]*)"/g)].map((m) => m[1]);
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  return `${body}\n${attrs.join('\n')}`;
};

// --- Fuentes ---
const sources = SOURCE_DIRS.flatMap((d) => walk(d, SOURCE_EXT));
for (const file of sources) {
  const text = readFileSync(file, 'utf8');
  findCurly(file, text);
  if (/\.mdx?$/.test(file)) findGeminate(file, text.replace(/^---[\s\S]*?---/, (fm) => fm)); // frontmatter incluido
}

// --- Textos generados ---
const generated = walk(DIST, DIST_EXT);
if (!generated.length) console.log(`check-text: aviso, ${DIST}/ no existe o está vacío (ejecuta npm run build)`);
const ENV = existsSync(join(DIST, 'index.html')) ? buildEnv(DIST).env : process.env.SITE_ENV === 'staging' ? 'staging' : 'production';
for (const file of generated) {
  const text = readFileSync(file, 'utf8');
  findCurly(file, text);
  // Marcadores en catalán ([[PENDENT: …]]) y en castellano ([[PENDIENTE: …]]).
  if (file.endsWith('.html') && /\[\[(PENDENT|PENDIENTE):/.test(text)) {
    const marks = [...new Set(text.match(/\[\[(?:PENDENT|PENDIENTE):[^\]]*\]\]/g) ?? [PENDING])];
    pendingErrors.push(`${rel(file)}  ${marks.length} dato(s): ${marks.join(' · ').replace(/&#39;/g, "'")}`);
  }
  if (file.endsWith('.html')) findGeminate(file, visibleText(text));
  else if (file.endsWith('.txt')) findGeminate(file, text);
}

// Artículos con verificaciones pendientes (solo aviso: no bloquean el build).
for (const file of sources.filter((f) => /[\\/]content[\\/]blog[\\/].*\.mdx?$/.test(f))) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const hits = lines.flatMap((l, i) => (VERIFY.test(l) ? [i + 1] : []));
  if (hits.length) verifyWarnings.push(`${rel(file)}  "PENDIENTE DE VERIFICACIÓN" en la(s) línea(s) ${hits.join(', ')}`);
}

console.log(`check-text (${ENV}): ${sources.length} archivos de src/ y public/, ${generated.length} generados en ${DIST}/`);
if (verifyWarnings.length) {
  console.log(`\nAvisos: artículos con datos pendientes de verificación (${verifyWarnings.length}):`);
  for (const w of verifyWarnings) console.log(`  aviso  ${w}`);
}
if (warnings.length) {
  console.log(`\nAvisos: posible ela geminada sin punto volado (${warnings.length}):`);
  for (const w of [...new Set(warnings)]) console.log(`  aviso  ${w}`);
}
if (errors.length) {
  console.log(`\nErrores: apóstrofo curvo (\u2019), usa el recto (') (${errors.length}):`);
  for (const e of errors) console.log(`  ERROR  ${e}`);
}
const pendingFails = ENV === 'production' && pendingErrors.length > 0;
if (pendingErrors.length) {
  const label = pendingFails ? 'Errores (producción)' : 'Avisos (staging: no bloquea)';
  console.log(`\n${label}: páginas con datos ${PENDING}: ...]] sin completar (${pendingErrors.length}). Se rellenan en src/config/legal.ts:`);
  for (const e of pendingErrors) console.log(`  ${pendingFails ? 'ERROR' : 'aviso'}  ${e}`);
}
if (errors.length || pendingFails) process.exit(1);
console.log(`\nOK: sin apóstrofos curvos (todo con ')${pendingErrors.length ? '' : ' y sin datos [[PENDIENTE'}.`);
