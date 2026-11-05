// Entorno y dominio de un build ya generado, para los scripts de comprobación.
// - Dominio: SITE_URL si está definido; si no, el origen del canonical de la portada de dist/.
// - Entorno: SITE_ENV si está definido; si no, staging cuando la portada lleva la franja de pruebas.
// Así ningún script tiene el dominio escrito a mano.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function buildEnv(dist) {
  const home = join(dist, 'index.html');
  const html = existsSync(home) ? readFileSync(home, 'utf8') : '';
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const site = (process.env.SITE_URL || (canonical ? new URL(canonical).origin : '')).replace(/\/+$/, '');
  const env = process.env.SITE_ENV || (/\sdata-staging-only\b/.test(html) ? 'staging' : 'production');
  if (!site) throw new Error(`No se puede saber el dominio: falta ${home} con canonical (o define SITE_URL).`);
  return { site, env: env === 'staging' ? 'staging' : 'production' };
}
