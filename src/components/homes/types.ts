// Textos de Llars / Hogares. Cada idioma los escribe por separado en src/pages/llars.astro y
// src/pages/es/hogares.astro; homes-page.astro solo pinta. El teléfono sale de src/config/site.ts.
import type { PageKey } from '../../config/pages';

/** Bloque de la factura: también es el valor del parámetro `bloc` de factura_hotspot_click. */
export type BillBlock = 'potencia' | 'energia' | 'impostos';

export interface HomesContent {
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
  bill: {
    eyebrow: string;
    title: string;
    intro: string;
    /** Nombre accesible del grupo de puntos de la factura. */
    label: string;
    items: { key: BillBlock; title: string; text: string }[];
    close: string;
    cta: string;
  };
  power: {
    eyebrow: string;
    title: string;
    text: string;
    link: string;
    /** Rótulos de las tres zonas del medidor (decorativo). */
    zones: [string, string, string];
  };
  chat: {
    eyebrow: string;
    title: string;
    intro: string;
    /** Nombre accesible del grupo de frases. */
    label: string;
    /** Nombre accesible de la respuesta ("Resposta de Logik Solutions"). */
    answerLabel: string;
    items: {
      q: string;
      a: string;
      /** Botón al pre-estudi (study) o enlace a una página. */
      action: { kind: 'study'; label: string } | { kind: 'page'; label: string; page: PageKey };
    }[];
  };
  blogTitle: string;
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  study: {
    title: string;
    lead: string;
    callLead: string;
    other: string;
  };
  serviceType: string;
  audience: string;
  breadcrumbHome: string;
}
