// Textos de la home (fuente: docs/home-textos.md). Cada idioma los escribe por
// separado en su página (src/pages/index.astro y src/pages/es/index.astro);
// HomePage solo pinta. El teléfono no va aquí: sale de src/config/site.ts.

import type { PowerKey, ProfileKey, ReviewKey, SupplyKey } from '../../lib/pre-study';

export type NeedKey = 'empreses' | 'comunitats' | 'llars' | 'autoconsum';

/**
 * Pre-estudi / preestudio (src/components/home/pre-study.astro).
 * Placeholders: {n} {total} (paso), {x} (importe formateado), {nom} (nombre).
 * Sin ninguna cadena de ahorro: ver src/config/calculator.ts.
 */
export interface PreStudyContent {
  tag: string;
  title: string;
  lead: string;
  note: string;
  points: string[];
  /** Franja de prueba social completa (columna izquierda). */
  proof: string;
  /** Franja corta junto al botón final. */
  proofShort: string;
  /** Nota de coste junto al botón final (solo consultoría y gestiones). */
  costNote: string;
  noscript: string;
  controls: { step: string; next: string; back: string; submit: string; sending: string };
  profile: { title: string; options: Record<ProfileKey, { label: string; desc: string }> };
  supply: {
    title: string;
    options: Record<SupplyKey, { label: string; desc: string }>;
    activity: { label: string; none: string; options: string[] };
  };
  amount: {
    title: string;
    help: string;
    label: string;
    slider: string;
    /** aria-valuetext del deslizador: "{x} € al mes". */
    sliderValue: string;
    annual: string;
    simple: string;
    power: { legend: string; options: Record<PowerKey, string> };
    solar: string;
  };
  summary: {
    title: string;
    rows: { profile: string; supply: string; activity: string; amount: string; power: string; solar: string };
    /** "{x} €/mes". */
    monthly: string;
    yes: string;
    no: string;
    /** "Amb aquest import, la teva despesa és d'uns {x} € a l'any." */
    annual: string;
    simple: string;
    reviewTitle: string;
    review: Record<ReviewKey, string>;
    outro: string;
  };
  contact: { title: string; firstName: string; lastName: string; email: string; phone: string; phoneNote: string };
  success: { title: string; text: string; nextTitle: string; next: string[]; whatsapp: string; call: string };
  errors: {
    profile: string;
    supply: string;
    amountEmpty: string;
    amountInvalid: string;
    amountTooHigh: string;
    firstName: string;
    lastName: string;
    emailEmpty: string;
    emailInvalid: string;
    phone: string;
    consent: string;
    file: string;
  };
}

/** Texto con título corto y explicación. */
export type TitledText = { title: string; text: string };

export interface HomeContent {
  hero: {
    /** Etiqueta dentro del H1 (lleva la palabra clave). */
    tag: string;
    title: string;
    /** Palabra del titular subrayada con el trazo naranja (debe aparecer tal cual en title). */
    titleMark: string;
    lead: string;
    /** Texto del botón, con la flecha final " →". */
    cta: string;
    ctaNote: string;
    /** "Truca al" + teléfono (de src/config/site.ts). */
    call: string;
  };
  logos: { title: string };
  needs: {
    eyebrow: string;
    title: string;
    intro: string;
    /** Botón y título de la lista desplegable ("Què mirem"). */
    lookLabel: string;
    items: Record<NeedKey, TitledText & { look: string[]; link: string }>;
  };
  preStudy: PreStudyContent;
  stats: { items: { value: string; label: string }[]; note: string };
  year: {
    eyebrow: string;
    title: string;
    intro: string;
    /** "Mes {n}" */
    month: string;
    /** "Mesos 2 a 10" */
    middle: string;
    first: TitledText[];
    follow: TitledText;
    renew: TitledText;
    /** Bandera del mes 11. */
    flag: string;
    link: string;
  };
  compare: {
    eyebrow: string;
    title: string;
    topic: string;
    self: string;
    logik: string;
    rows: { topic: string; self: string; logik: string }[];
    close: string;
  };
  gestions: { title: string; text: string; rows: string[]; states: string[]; link: string };
  solar: { title: string; text: string; diagram: { sun: string; panels: string; home: string; surplus: string }; link: string };
  blog: { title: string; link: string };
  faq: {
    eyebrow: string;
    title: string;
    intro: string;
    cardTitle: string;
    /** "{phone}" se sustituye por el teléfono de src/config/site.ts. */
    cardText: string;
    items: { q: string; a: string }[];
  };
  closing: { title: string; text: string; points: string[] };
}
