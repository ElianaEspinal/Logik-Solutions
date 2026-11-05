import { defaultLocale, locales, type Locale } from '../config/pages';

export type Alternates = Partial<Record<Locale, string>>;

export function absoluteUrl(path: string, site: URL | undefined): string {
  if (!site) throw new Error('Falta `site` en astro.config.mjs');
  return new URL(path, site).href;
}

// Enlaces hreflang compartidos por el <head> y el sitemap. Solo apuntan a URLs que existen.
// - En todos los idiomas: uno por idioma y x-default al idioma por defecto.
// - En un solo idioma (artículo del blog sin traducción): auto-referencia y x-default a esa misma versión.
export function getHreflangLinks(alternates: Alternates, site: URL | undefined) {
  const available = locales.filter((l) => alternates[l]);
  if (!available.length) return [];
  const fallback = alternates[defaultLocale] ? defaultLocale : available[0];
  return [
    ...available.map((l) => ({ hreflang: l, href: absoluteUrl(alternates[l]!, site) })),
    { hreflang: 'x-default', href: absoluteUrl(alternates[fallback]!, site) },
  ];
}
