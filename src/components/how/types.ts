// Textos de la página Com treballem / Cómo trabajamos. Cada idioma los escribe por separado en
// src/pages/com-treballem.astro y src/pages/es/como-trabajamos.astro; how-page.astro solo pinta.
// El teléfono no va aquí: sale de src/config/site.ts.

export type Who = 'tu' | 'logik';
export type RouteIcon = 'chat' | 'invoice' | 'compare' | 'decide' | 'stamp' | 'calendar' | 'bell';
export type SolarIcon = 'consumption' | 'install' | 'surplus';
export type ScenarioIcon = 'incident' | 'renewal' | 'change' | 'location' | 'privacy';

export interface HowContent {
  hero: {
    tag: string;
    title: string;
    lead: string;
    /** Con la flecha final " →". */
    cta: string;
    /** "Truca al" + teléfono. */
    call: string;
  };
  route: {
    eyebrow: string;
    title: string;
    lead: string;
    /** Etiqueta de quién hace cada paso. */
    who: Record<Who, string>;
    steps: { who: Who; icon: RouteIcon; title: string; text: string }[];
  };
  start: {
    title: string;
    /** Contiene la frase de la política de privacidad (form.consentLink), que se enlaza. */
    text: string;
    note: string;
    cta: string;
  };
  solar: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: { icon: SolarIcon; title: string; text: string }[];
    callout: string;
    link: string;
  };
  scenarios: {
    eyebrow: string;
    title: string;
    /** Etiqueta accesible de la lista de pestañas. */
    label: string;
    items: { icon: ScenarioIcon; chip: string; q: string; a: string }[];
  };
  closing: { title: string; text: string; cta: string; call: string };
  breadcrumbHome: string;
}
