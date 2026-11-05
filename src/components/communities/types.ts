// Textos de Comunitats de veïns / Comunidades de vecinos. Cada idioma los escribe por separado en
// src/pages/comunitats-de-veins.astro y src/pages/es/comunidades-de-vecinos.astro;
// communities-page.astro solo pinta. El teléfono sale de src/config/site.ts.
// Lo que depende de COMUNITATS_FV (src/config/comunitats.ts) lo resuelve la página: aquí `solar`
// es opcional y, si no llega, ese bloque no se pinta.

export type CommunityBillIcon = 'building' | 'lift' | 'search';

export interface CommunitiesContent {
  hero: {
    tag: string;
    title: string;
    lead: string;
    /** Con la flecha final " →". */
    cta: string;
    note: string;
    /** "Truca al" + teléfono. */
    call: string;
  };
  stats: { value: string; label: string }[];
  persona: {
    eyebrow: string;
    title: string;
    text: string;
    /** Nombre accesible del grupo de chips. */
    label: string;
    admin: string;
    resident: string;
    hint: string;
  };
  hub: {
    eyebrow: string;
    title: string;
    text: string;
    /** Rótulos del esquema decorativo (aria-hidden). */
    nodes: { admin: string; residents: string; logik: string; companies: string };
    chips: [string, string, string];
  };
  bill: {
    eyebrow: string;
    title: string;
    items: { icon: CommunityBillIcon; title: string; text: string }[];
  };
  fit: {
    eyebrow: string;
    title: string;
    /** Nombre accesible del grupo de casillas. */
    label: string;
    items: string[];
    help: string;
    yes: string;
    cta: string;
  };
  services: {
    title: string;
    items: { title: string; text: string; link?: string; page?: 'gestio' | 'comTreballem' }[];
  };
  blogTitle: string;
  /** Solo con COMUNITATS_FV = true. */
  solar?: { title: string; text: string; link: string };
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  admin: {
    /** id del bloque (destino del chip "Soc administrador de finques"). */
    id: string;
    title: string;
    text: string;
    cta: string;
    call: string;
  };
  study: {
    title: string;
    lead: string;
    callLead: string;
    other: string;
  };
  serviceType: string;
  audience: { communities: string; administrators: string };
  breadcrumbHome: string;
}
