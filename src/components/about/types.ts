// Textos de la página Nosaltres / Nosotros. Cada idioma en su archivo
// (src/pages/nosaltres.astro y src/pages/es/nosotros.astro), escritos por separado.
export type AboutContent = {
  hero: { tag: string; title: string; lead: string; cta: string; call: string };
  stats: { value: string; label: string }[];
  why: { title: string; text: string };
  founder: { label: string; text: string; call: string };
  how: { title: string; items: { title: string; text: string }[] };
  services: { title: string; solarNote: string };
  where: { title: string; text: string; rings: [string, string, string] };
  logosTitle: string;
  faq: { title: string; items: { q: string; a: string }[] };
  closing: { title: string; text: string; cta: string; call: string };
  breadcrumbHome: string;
};
