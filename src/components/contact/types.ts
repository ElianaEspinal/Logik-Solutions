// Textos de la página de contacto. Cada idioma los escribe en su propio archivo
// (src/pages/contacte.astro y src/pages/es/contacto.astro).
import type { Channel, Need, Profile } from '../../lib/contact';

type Option = { label: string; desc?: string };

export type ContactContent = {
  eyebrow: string;
  title: string;
  lead: string;
  quick: { call: string; whatsapp: string };
  panel: {
    title: string;
    phone: string;
    whatsapp: string;
    whatsappValue: string;
    email: string;
    address: string;
    directions: string;
    hours: string;
    visits: string;
  };
  form: {
    step: string;
    steps: [string, string];
    profile: { legend: string; options: Record<Profile, Option> };
    need: { legend: string; options: Record<Need, Option> };
    locality: { label: string; placeholder: string; optional: string };
    next: string;
    back: string;
    name: string;
    email: string;
    phone: string;
    phoneOptional: string;
    phoneHint: string;
    channel: { legend: string; options: Record<Channel, string> };
    message: string;
    messageOptional: string;
    attach: { label: string; hint: string; privacy: string };
    attachOff: string;
    consent: string;
    consentLink: string;
    submit: string;
    sending: string;
    cost: string;
    noEndpoint: string;
    errors: Record<
      'perfil' | 'necessitat' | 'nom' | 'emailEmpty' | 'emailInvalid' | 'phoneEmpty' | 'phoneInvalid' | 'file' | 'consent',
      string
    >;
    error: string;
    success: { title: string; text: string; urgent: string; call: string; whatsapp: string };
    /** "per telèfon", "per WhatsApp", "per correu electrònic". */
    channelsText: Record<Channel, string>;
  };
  next: { title: string; steps: [string, string, string] };
  map: { title: string; load: string; note: string; frameTitle: string; directions: string };
  breadcrumbHome: string;
};
