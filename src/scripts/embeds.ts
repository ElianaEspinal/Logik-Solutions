// Contenido externo (mapas, vídeos): el <iframe> solo se crea con el
// consentimiento de "contingut extern". Hasta entonces se ve un aviso con un
// botón que da ese consentimiento y carga el contenido.

import { NO_CONSENT, hasExternalConsent, onConsent, readConsent, saveConsent } from './consent';

const embeds = () => document.querySelectorAll<HTMLElement>('[data-consent-embed]');

function load(embed: HTMLElement) {
  if (embed.querySelector('iframe')) return;
  const { src, title } = embed.dataset;
  if (!src || !/^https:\/\//.test(src)) return;
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = title ?? '';
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.allowFullscreen = true;
  embed.querySelector('[data-embed-placeholder]')?.remove();
  embed.append(iframe);
}

embeds().forEach((embed) => {
  embed.querySelector('[data-embed-load]')?.addEventListener('click', () => {
    saveConsent({ ...(readConsent() ?? NO_CONSENT), external: true });
    if (hasExternalConsent()) embeds().forEach(load);
  });
});

onConsent((consent) => {
  if (consent.external) embeds().forEach(load);
});
