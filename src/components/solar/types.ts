// Textos de Autoconsum fotovoltaic / Autoconsumo fotovoltaico. Cada idioma los escribe por separado
// en src/pages/autoconsum-fotovoltaic.astro y src/pages/es/autoconsumo-fotovoltaico.astro;
// solar-page.astro solo pinta. El teléfono sale de src/config/site.ts.
// En esta página nunca se dice "sense cost" ni "gratis": la instalación tiene coste.
import type { PageKey } from '../../config/pages';
import type { ProfileKey } from '../../lib/pre-study';

/** Valor del parámetro `persona` de persona_select. */
export type SolarPersona = 'llar' | 'comunitat' | 'pime';
export type ConsumShape = 'dia' | 'vespre' | 'mixt' | 'nose';

export interface SolarContent {
  hero: {
    tag: string;
    title: string;
    lead: string;
    /** Con la flecha final " →". */
    cta: string;
    note: string;
    /** "Truca al" + teléfono. */
    call: string;
    /** Visual del hero: aria-label del contenedor y las cuatro etiquetas (decorativas). */
    visual: { label: string; tags: { sun: string; panels: string; home: string; surplus: string } };
  };
  stats: { value: string; label: string }[];
  who: {
    eyebrow: string;
    title: string;
    /** Botón pequeño de cada tarjeta que lleva al pre-estudi con el perfil marcado. */
    start: string;
    items: { persona: SolarPersona; profile: ProfileKey; page: PageKey; title: string; text: string; link: string }[];
  };
  path: {
    eyebrow: string;
    title: string;
    items: { title: string; text: string }[];
  };
  consum: {
    eyebrow: string;
    title: string;
    intro: string;
    /** Nombre accesible del grupo de opciones. */
    label: string;
    /** Nombre accesible del gráfico (lo describe sin cifras). */
    chartLabel: string;
    items: { shape: ConsumShape; q: string; a: string }[];
    cta: string;
  };
  trust: {
    title: string;
    items: { title: string; text: string }[];
  };
  blogTitle: string;
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  study: {
    title: string;
    lead: string;
    /** Sustituye la frase de la cabecera del pre-estudi (sin "sense cost"). */
    note: string;
    /** Sustituyen los tres puntos de la columna izquierda del pre-estudi. */
    points: string[];
    callLead: string;
    other: string;
  };
  serviceType: string;
  audience: string[];
  breadcrumbHome: string;
}
