// Textos de Gestió i tràmits / Gestión y trámites. Cada idioma los escribe por separado en
// src/pages/gestio-i-tramits.astro y src/pages/es/gestion-y-tramites.astro; gestions-page.astro
// solo pinta. El teléfono sale de src/config/site.ts.
// Enfoque confirmado: las gestiones van incluidas en el servicio anual; no se piden ni se
// contratan por separado (nada de "Demana la teva gestió").

/** También es el valor de tramit_select y del campo oculto tramit_interes del pre-estudi. */
export type TramitKey = 'titularitat' | 'potencia' | 'alta' | 'incidencies';

export interface GestionsContent {
  hero: {
    tag: string;
    title: string;
    lead: string;
    /** Con la flecha final " →". */
    cta: string;
    note: string;
    /** "Truca al" + teléfono. */
    call: string;
    /** Rótulos del esquema decorativo (aria-hidden): tú, Logik, compañía. */
    nodes: [string, string, string];
  };
  stats: { value: string; label: string }[];
  tramits: {
    eyebrow: string;
    title: string;
    intro: string;
    /** Nombre accesible de la lista de pestañas. */
    label: string;
    items: { key: TramitKey; title: string; text: string }[];
    included: string;
    cta: string;
  };
  service: {
    eyebrow: string;
    title: string;
    items: { icon: 'gestions' | 'incidencies' | 'seguiment'; title: string; text: string }[];
    link: string;
  };
  audience: {
    title: string;
    items: { page: 'llars' | 'empreses' | 'comunitats'; title: string; text: string; link: string }[];
  };
  blogTitle: string;
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] };
  study: {
    title: string;
    lead: string;
    callLead: string;
  };
  serviceType: string;
  serviceAudience: [string, string, string];
  breadcrumbHome: string;
}
