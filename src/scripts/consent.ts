// Consentimiento de cookies. Nada de analítica, publicidad ni contenido externo se carga
// hasta que el visitante lo acepta. La elección se guarda en localStorage
// (técnico, no requiere consentimiento) y se vuelve a pedir a los 12 meses.
//
// Google Consent Mode v2: los valores por defecto ("denied" en todo) se fijan con un script en
// línea en el <head> de BaseLayout, antes de cualquier otro script. Aquí solo se envía el
// "consent update" justo antes de cargar GTM y cada vez que cambia la elección.

export type Consent = { analytics: boolean; external: boolean; ads: boolean };
type Stored = Consent & { v: 1; date: string };

const KEY = 'logik_consent';
/** Banner cerrado sin elegir: no se activa nada y no vuelve a salir durante la visita (pestaña). */
const CLOSED_KEY = 'logik_consent_closed';
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 12 meses
const listeners = new Set<(c: Consent) => void>();

export const NO_CONSENT: Consent = { analytics: false, external: false, ads: false };

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Stored;
    if (stored.v !== 1 || Date.now() - Date.parse(stored.date) > MAX_AGE_MS) return null;
    return { analytics: !!stored.analytics, external: !!stored.external, ads: !!stored.ads };
  } catch {
    return null;
  }
}

export function saveConsent(consent: Consent) {
  const previous = readConsent();
  try {
    const stored: Stored = { v: 1, date: new Date().toISOString(), ...consent };
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // Sin almacenamiento (modo privado estricto): la elección vale solo para esta página.
  }
  current = consent;
  // Si retira la analítica o la publicidad después de haberlas aceptado: informa a Google,
  // borra las cookies de GA y recarga para que GTM deje de estar en la página.
  if ((previous?.analytics && !consent.analytics) || (previous?.ads && !consent.ads)) {
    if (gtmLoaded) updateGoogleConsent(consent);
    removeGaCookies();
    window.location.reload();
    return;
  }
  listeners.forEach((fn) => fn(consent));
}

/** El visitante cerró el banner sin elegir: equivale a no consentir (no se guarda ninguna elección). */
export function dismissWithoutChoice() {
  try {
    sessionStorage.setItem(CLOSED_KEY, '1');
  } catch {
    // Sin almacenamiento: el banner volverá a salir en la siguiente página.
  }
}

export function wasDismissed() {
  try {
    return sessionStorage.getItem(CLOSED_KEY) === '1';
  } catch {
    return false;
  }
}

let current: Consent | null = readConsent();

export const hasAnalyticsConsent = () => current?.analytics === true;
export const hasExternalConsent = () => current?.external === true;

export function onConsent(fn: (c: Consent) => void) {
  listeners.add(fn);
  if (current) fn(current);
}

function removeGaCookies() {
  const host = window.location.hostname;
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
  for (const name of document.cookie.split(';').map((c) => c.split('=')[0].trim())) {
    if (!/^_ga(_|$)|^_gid$|^_gat/.test(name)) continue;
    for (const d of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
    }
  }
}

// --- Google Consent Mode v2 y Google Tag Manager -----------------------------

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/** Equivalente a gtag(): GTM solo reconoce los comandos de consentimiento como objeto `arguments`. */
function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

const state = (on: boolean) => (on ? 'granted' : 'denied');

function updateGoogleConsent(consent: Consent) {
  gtag('consent', 'update', {
    analytics_storage: state(consent.analytics),
    ad_storage: state(consent.ads),
    ad_user_data: state(consent.ads),
    ad_personalization: state(consent.ads),
  });
}

/** GTM hace falta para la analítica y, si algún día se activa, para la publicidad. */
export const needsGtm = (consent: Consent) => consent.analytics || consent.ads;

let gtmLoaded = false;

/** Cargador estándar de GTM. Sin versión <noscript>: no respeta el consentimiento. */
export function loadGtm(id: string, consent: Consent) {
  if (gtmLoaded || !needsGtm(consent) || !/^GTM-[A-Z0-9]+$/.test(id)) return;
  gtmLoaded = true;
  // Primero el "consent update" (sobre los valores "denied" del <head>), después GTM.
  updateGoogleConsent(consent);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
  document.head.append(script);
}

/**
 * Conecta GTM con el consentimiento: solo se carga si se acepta una categoría que lo necesite.
 * Sin ID (staging sin PUBLIC_GTM_TEST) no se carga nunca.
 */
export function initGtm(id: string | undefined) {
  onConsent((consent) => {
    if (!id) return;
    if (gtmLoaded) updateGoogleConsent(consent);
    else loadGtm(id, consent);
  });
}

export const isGtmLoaded = () => gtmLoaded;
