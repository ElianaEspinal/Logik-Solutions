// Textos de Empreses i pimes / Empresas y pymes. Cada idioma los escribe por separado en
// src/pages/empreses-i-pimes.astro y src/pages/es/empresas-y-pymes.astro; business-page.astro
// solo pinta. El teléfono sale de src/config/site.ts.

export type SectorKey = 'hostaleria' | 'comerc' | 'tallers' | 'cliniques' | 'altres';
export type BillIcon = 'gauge' | 'clock' | 'calendar';
export type StepIcon = 'invoice' | 'compare' | 'stamp' | 'bell';

export interface BusinessContent {
  hero: {
    tag: string;
    title: string;
    lead: string;
    /** Con la flecha final " →". */
    cta: string;
    note: string;
    /** "Truca al" + teléfono. */
    call: string;
    /** Rótulos del esquema decorativo de la factura. */
    blocks: [string, string, string];
  };
  stats: { value: string; label: string }[];
  sectors: {
    eyebrow: string;
    title: string;
    text: string;
    /** activity: opción del desplegable de actividad del pre-estudi que se preselecciona (o null). */
    items: { key: SectorKey; label: string; activity: string | null }[];
    hint: string;
  };
  bill: {
    eyebrow: string;
    title: string;
    intro: string;
    lookLabel: string;
    items: { icon: BillIcon; title: string; text: string; look: string; source?: { label: string; href: string } }[];
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
    items: { title: string; text: string; link: string; page: 'comTreballem' | 'gestio' | 'autoconsum' }[];
  };
  steps: { title: string; items: { icon: StepIcon; title: string }[]; cta: string };
  logosTitle: string;
  blogTitle: string;
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  study: {
    title: string;
    lead: string;
    callLead: string;
    other: string;
  };
  serviceType: string;
  breadcrumbHome: string;
}
