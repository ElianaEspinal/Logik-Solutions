// Destino de los formularios: un solo sitio para leer PUBLIC_FORM_ENDPOINT y
// PUBLIC_FORM_ATTACHMENTS (astro.config.mjs / .env). Lo usa la página de contacto;
// el pre-estudi y el formulario de cierre de la home leen la misma variable.
import { PUBLIC_FORM_ATTACHMENTS, PUBLIC_FORM_ENDPOINT } from 'astro:env/server';

const raw = PUBLIC_FORM_ENDPOINT.trim();

/** URL https completa del servicio (Formspree, Basin…). Vacío si falta o no es válida. */
export const formEndpoint = /^https:\/\/\S+$/.test(raw) ? raw : '';
export const formEnabled = formEndpoint !== '';
/** Adjuntar factura: solo si el servicio elegido admite archivos. */
export const formAttachments = PUBLIC_FORM_ATTACHMENTS;
