// Listado único de páginas: slugs por idioma, nombre de cada página y estado.
// Hreflang, selector de idioma, menú, pie, sitemap, borradores y
// scripts/check-build.mjs leen de aquí. Los slugs son provisionales: para
// cambiar uno basta con cambiarlo aquí (los borradores se generan solos).
//
// draft: true  -> página "en preparació": solo en staging (src/pages/[...draft].astro, con noindex
//                 y fuera del sitemap). En producción no se construye.
//                 Al terminarla: crea su archivo propio en src/pages y quita draft.
// Sin noindex por página: la indexación depende del entorno (src/config/indexing.ts).

export const locales = ['ca', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ca';

export type PageEntry = Record<Locale, string> & {
  name: Record<Locale, string>;
  draft?: boolean;
};

export const pages = {
  home: { ca: '/', es: '/es/', name: { ca: 'Inici', es: 'Inicio' } },
  // Terminada: src/pages/empreses-i-pimes.astro y src/pages/es/empresas-y-pymes.astro.
  empreses: {
    ca: '/empreses-i-pimes/',
    es: '/es/empresas-y-pymes/',
    name: { ca: 'Empreses i pimes', es: 'Empresas y pymes' },
  },
  // Terminada: src/pages/comunitats-de-veins.astro y src/pages/es/comunidades-de-vecinos.astro.
  comunitats: {
    ca: '/comunitats-de-veins/',
    es: '/es/comunidades-de-vecinos/',
    name: { ca: 'Comunitats de veïns', es: 'Comunidades de vecinos' },
  },
  // Terminada: src/pages/llars.astro y src/pages/es/hogares.astro.
  llars: { ca: '/llars/', es: '/es/hogares/', name: { ca: 'Llars', es: 'Hogares' } },
  // Terminada: src/pages/autoconsum-fotovoltaic.astro y src/pages/es/autoconsumo-fotovoltaico.astro.
  autoconsum: {
    ca: '/autoconsum-fotovoltaic/',
    es: '/es/autoconsumo-fotovoltaico/',
    name: { ca: 'Autoconsum fotovoltaic', es: 'Autoconsumo fotovoltaico' },
  },
  // Terminada: src/pages/gestio-i-tramits.astro y src/pages/es/gestion-y-tramites.astro.
  gestio: {
    ca: '/gestio-i-tramits/',
    es: '/es/gestion-y-tramites/',
    name: { ca: 'Gestió i tràmits', es: 'Gestión y trámites' },
  },
  // Terminada: src/pages/com-treballem.astro y src/pages/es/como-trabajamos.astro.
  comTreballem: {
    ca: '/com-treballem/',
    es: '/es/como-trabajamos/',
    name: { ca: 'Com treballem', es: 'Cómo trabajamos' },
  },
  // Terminada: src/pages/nosaltres.astro y src/pages/es/nosotros.astro.
  nosaltres: { ca: '/nosaltres/', es: '/es/nosotros/', name: { ca: 'Nosaltres', es: 'Nosotros' } },
  // Índice real (src/pages/blog/index.astro). Se indexa solo con artículos publicados en ese idioma:
  // regla única en blogIndexIndexable() de src/lib/blog.ts.
  blog: { ca: '/blog/', es: '/es/blog/', name: { ca: 'Blog', es: 'Blog' } },
  // Terminada: src/pages/contacte.astro y src/pages/es/contacto.astro.
  contacte: { ca: '/contacte/', es: '/es/contacto/', name: { ca: 'Contacte', es: 'Contacto' } },
  // Legales: src/pages/avis-legal.astro, politica-de-privacitat.astro y politica-de-cookies.astro (y /es/).
  // Con datos [[PENDIENTE (src/config/legal.ts), el build de producción falla (check-text).
  avisLegal: {
    ca: '/avis-legal/',
    es: '/es/aviso-legal/',
    name: { ca: 'Avís legal', es: 'Aviso legal' },
  },
  privacitat: {
    ca: '/politica-de-privacitat/',
    es: '/es/politica-de-privacidad/',
    name: { ca: 'Política de privacitat', es: 'Política de privacidad' },
  },
  cookies: {
    ca: '/politica-de-cookies/',
    es: '/es/politica-de-cookies/',
    name: { ca: 'Política de cookies', es: 'Política de cookies' },
  },
} satisfies Record<string, PageEntry>;

export type PageKey = keyof typeof pages;

export const pageKeys = Object.keys(pages) as PageKey[];
export const draftKeys = pageKeys.filter((k) => (pages[k] as PageEntry).draft);
export const isDraft = (key: PageKey) => !!(pages[key] as PageEntry).draft;
export const href = (key: PageKey, lang: Locale) => pages[key][lang];
