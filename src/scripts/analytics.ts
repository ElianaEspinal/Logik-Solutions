// Eventos de GA4 vía dataLayer de GTM. Solo se envían con consentimiento de
// análisis y con GTM cargado (en staging, solo con PUBLIC_GTM_TEST=true). Sin consentimiento no se
// guarda nada en cola: el evento se pierde a propósito.
//
// Eventos:
//   generate_lead    formulario enviado con éxito      { form_location }
//   click_call       clic en un enlace tel:            { link_location, location }
//   click_whatsapp   clic en un enlace de WhatsApp     { link_location, location }
//   click_email      clic en un enlace mailto:         { link_location, location }
//   click_directions clic en "Com arribar" (a[data-directions]) { link_location, location }
//   contact_form_start / contact_step / generate_lead (form="contacte"): src/scripts/contact-form.ts
//   Lista completa y parámetros: docs/tracking.md
//   cta_click        clic en un botón o enlace de CTA  { section, cta_text }
//   hero_form_start  (sin uso desde el 3/11/2026: el hero ya no tiene formulario; su botón lanza
//                    cta_click con section=hero y el enlace de llamada, click_call)
//   calc_start       primera interacción con el paso 1 del pre-estudi       { form_location }
//   calc_step        paso del pre-estudi completado (1 a 5, una vez cada uno) { step, form_location }
//                    (los dos en src/scripts/pre-study.ts; generate_lead añade form y perfil)
//
// La sección sale del atributo data-section más cercano. En la home: hero, logos,
// tarjetas, calculadora (pre-estudi), linea-tiempo, comparativa, cifras, gestions, autoconsum, blog, faq, cierre;
// en todas: header (barra), footer, barra-movil y borrador. Un data-cta con valor la
// sustituye: "header" (botón de la cabecera) y "header_menu" (enlaces y botón del menú).

import { hasAnalyticsConsent, isGtmLoaded } from './consent';

type Params = Record<string, string | number | undefined>;

const canTrack = () => hasAnalyticsConsent() && isGtmLoaded();

export function track(event: string, params: Params = {}) {
  if (!canTrack()) return;
  window.dataLayer!.push({ event, ...params });
}

/** Envía el evento y después ejecuta `next` (p. ej. una redirección), sin esperar más de 1,5 s. */
export function trackThen(event: string, params: Params, next: () => void) {
  if (!canTrack()) return next();
  let done = false;
  const go = () => {
    if (!done) {
      done = true;
      next();
    }
  };
  window.dataLayer!.push({ event, ...params, eventCallback: go, eventTimeout: 1500 });
  setTimeout(go, 1600);
}

export const sectionOf = (el: Element) => el.closest<HTMLElement>('[data-section]')?.dataset.section ?? 'page';

/** Evento de un enlace de contacto: tel:, WhatsApp, mailto: o "Com arribar" (data-directions). */
const linkEvent = (link: HTMLAnchorElement) => {
  const href = link.getAttribute('href') ?? '';
  if (href.startsWith('tel:')) return 'click_call';
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) return 'click_whatsapp';
  if (href.startsWith('mailto:')) return 'click_email';
  if (link.hasAttribute('data-directions')) return 'click_directions';
  return null;
};

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const link = target?.closest<HTMLAnchorElement>('a[href]');
  if (link) {
    const name = linkEvent(link);
    if (name) {
      // link_location: parámetro ya configurado en GTM; location: el mismo valor (p. ej. "contacte").
      const where = sectionOf(link);
      track(name, { link_location: where, location: where });
      // Un enlace de contacto con data-cta (botones rápidos del contacto) también cuenta como CTA.
      if (!link.dataset.cta) return;
    }
  }
  // CTA: botones .btn y enlaces marcados con data-cta (no los envíos de formulario).
  const cta = target?.closest<HTMLElement>('a.btn, a[data-cta], button.btn[data-cta]');
  if (cta) {
    track('cta_click', {
      section: cta.dataset.cta || sectionOf(cta),
      cta_text: cta.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100),
    });
  }
});
