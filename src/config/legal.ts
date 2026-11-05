// Datos legales de Logik Solutions: única fuente para el avís legal, la política de privacitat,
// la política de cookies y la primera capa de información de los formularios.
//
// Lo que no está confirmado lleva un marcador en el idioma de cada página (función `pending`):
// [[PENDENT: ...]] en catalán y [[PENDIENTE: ...]] en castellano. Nunca se mezclan idiomas.
// - Build de producción: check-text FALLA si queda algún marcador en el HTML (dice qué páginas
//   y qué datos). Build de staging: solo avisa.
// - Las páginas legales son indexables como el resto: no hay noindex por página.
//

/** Marcadores que busca check-text (catalán y castellano). */
export const PENDING_MARKS = ['[[PENDENT', '[[PENDIENTE'] as const;
export const pending = (ca: string, es: string) => ({ ca: `[[PENDENT: ${ca}]]`, es: `[[PENDIENTE: ${es}]]` });

/** Fecha de la última revisión del texto (se muestra en las tres páginas). */
export const legalUpdated = { iso: '2026-11-05', ca: '5 de novembre de 2026', es: '5 de noviembre de 2026' };

export const legal = {
  // Confirmados.
  holder: 'LOGIK SOLUTIONS, S.L.',
  tradeName: 'Logik Solutions',
  email: 'info@logiksolutions.es',
  location: 'Girona',
  domain: 'logiksolutions.es',

  // Confirmados por Eliana el 5/11/2026.
  cif: 'B02961043',
  // Sin calle ni número a propósito: no completar.
  address: 'Girona, 17002',
  // Teléfono oficial, el mismo de la web.
  phone: '665 05 25 16',
  // Solo el registro, sin tomo, folio, hoja ni inscripción (decisión de Eliana, 5/11/2026).
  registry: { ca: 'Registre Mercantil de Girona', es: 'Registro Mercantil de Girona' },
  // Plazos de conservación y encargados del tratamiento: redactados directamente en la política
  // de privacidad (5/11/2026). Analítica: 14 meses, que debe coincidir con la retención de GA4.
} as const;

/**
 * Apartado de la política de privacitat sobre la factura adjunta en el formulario.
 * Activarlo a la vez que PUBLIC_FORM_ATTACHMENTS=true (subida de factura en el formulario).
 */
export const INVOICE_UPLOAD = false;

/**
 * Categoría "Publicitat / Publicidad" en el banner y en la política de cookies.
 * Desactivada: no hay publicidad. Al empezar con campañas, activarla, añadir las cookies reales
 * a la tabla de la política y revisar las etiquetas de GTM.
 */
export const ADS_CONSENT = false;

/**
 * Captcha en los formularios (capa 7 antispam). DESACTIVADO: los captchas habituales (reCAPTCHA,
 * hCaptcha, Turnstile) cargan scripts y, a veces, cookies de terceros. Antes de activarlo:
 * elegir proveedor, cargarlo solo tras el consentimiento (categoría de contenido externo),
 * añadirlo a la CSP (script-src y frame-src), a la tabla de la política de cookies y a la
 * política de privacidad, y activarlo también en el panel de Formspree. Hoy no hay código que lo
 * cargue: esta bandera solo deja constancia de la decisión. Ver docs/seguridad.md.
 */
export const CAPTCHA_ENABLED = false;

/** Políticas de terceros (comprobadas el 5/11/2026: responden 200). */
export const thirdPartyPolicies = {
  google: 'https://policies.google.com/privacy',
  googleCookies: 'https://policies.google.com/technologies/cookies',
  googleAnalyticsOptOut: 'https://tools.google.com/dlpage/gaoptout',
  formspree: 'https://formspree.io/legal/privacy-policy/',
  hostinger: 'https://www.hostinger.com/legal/privacy-policy',
  whatsapp: 'https://www.whatsapp.com/legal/privacy-policy-eea',
  aepd: 'https://www.aepd.es/',
} as const;
