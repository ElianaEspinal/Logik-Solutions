// Comprobaciones y mensajes del navegador, comunes a todos los formularios (contacto, cierre y
// pre-estudi). La seguridad de verdad está en el servidor (public/api/, docs/formulario.md):
// aquí solo se avisa a la persona ANTES de enviar de lo que el servidor descartaría en silencio
// como spam (enlaces, etiquetas, alfabeto), para no perder nunca un contacto legítimo.
// También el enfriamiento de 30 s tras un error y los mensajes de cada respuesta del servidor.
// No guarda nada en el navegador (ni cookies ni localStorage).

import type { Discarded, SendResult } from './form-send';

const COOLDOWN_MS = 30_000;
let lastSentAt = 0;

export const PHONE = '665 05 25 16';
export const PHONE_TEL = 'tel:+34665052516';
export const EMAIL = 'info@logiksolutions.es';

type Lang = 'ca' | 'es';
export type GuardReason = 'cooldown' | 'links' | 'urlField' | 'tags' | 'alphabet';

const messages: Record<Lang, Record<GuardReason | 'failed' | 'limit' | 'tooLarge' | 'invalid' | 'discarded' | 'notSent', string>> = {
  ca: {
    cooldown: 'Ja hem rebut un enviament fa un moment. Espera uns segons abans de tornar-ho a provar.',
    links: "El missatge pot tenir un enllaç com a màxim.",
    urlField: "Treu l'adreça web dels camps de nom, telèfon, correu o localitat.",
    tags: "Treu els símbols < > i [ ] del text.",
    alphabet: 'Escriu el text amb lletres de l\'alfabet llatí.',
    failed: `No hem pogut enviar el formulari. Truca'ns al ${PHONE} o escriu-nos a ${EMAIL}.`,
    limit: `Hem rebut massa enviaments des d'aquesta connexió. Truca'ns al ${PHONE} i t'atendrem de seguida.`,
    tooLarge: `Els arxius pesen massa. Treu-los, envia el formulari i fes-nos arribar la factura a ${EMAIL}.`,
    invalid: 'Revisa els camps marcats.',
    discarded: `Hem rebut la teva sol·licitud, però no hem pogut adjuntar {llista}. Envia'ns la factura a ${EMAIL}.`,
    notSent: `Hem rebut les teves dades, però no hem pogut adjuntar les factures. Envia-les a ${EMAIL} o amb una foto per WhatsApp.`,
  },
  es: {
    cooldown: 'Acabamos de recibir un envío. Espera unos segundos antes de volver a intentarlo.',
    links: 'El mensaje puede tener un enlace como máximo.',
    urlField: 'Quita la dirección web de los campos de nombre, teléfono, correo o localidad.',
    tags: 'Quita los símbolos < > y [ ] del texto.',
    alphabet: 'Escribe el texto con letras del alfabeto latino.',
    failed: `No hemos podido enviar el formulario. Llámanos al ${PHONE} o escríbenos a ${EMAIL}.`,
    limit: `Hemos recibido demasiados envíos desde esta conexión. Llámanos al ${PHONE} y te atenderemos enseguida.`,
    tooLarge: `Los archivos pesan demasiado. Quítalos, envía el formulario y haznos llegar la factura a ${EMAIL}.`,
    invalid: 'Revisa los campos marcados.',
    discarded: `Hemos recibido tu solicitud, pero no hemos podido adjuntar {llista}. Envíanos la factura a ${EMAIL}.`,
    notSent: `Hemos recibido tus datos, pero no hemos podido adjuntar las facturas. Envíalas a ${EMAIL} o con una foto por WhatsApp.`,
  },
};

export const pageLang = (): Lang => (document.documentElement.lang === 'es' ? 'es' : 'ca');

// Mismas reglas que public/api/lib/antispam.php (capa 3.5).
const URL_RE = /(?:https?:\/\/\S+|www\.\S+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}\/\S*)/giu;
const TAG_RE = /<a[\s>]|<script|\[url|\[link/iu;
const MESSAGE_FIELDS = ['missatge'];
const NAME_FIELDS = ['nom', 'cognoms'];
const SKIP = new Set(['website', 'ts', 'nonce', 'firma', 'utm_source', 'utm_medium', 'utm_campaign', 'gclid']);

const nonLatinRatio = (text: string) => {
  const letters = text.match(/\p{L}/gu)?.length ?? 0;
  if (!letters) return 0;
  return (letters - (text.match(/\p{Script=Latin}/gu)?.length ?? 0)) / letters;
};

/** Comprueba el enfriamiento y el contenido. Devuelve [motivo, campo] o null si se puede enviar. */
export function guardCheck(form: HTMLFormElement): [GuardReason, string | null] | null {
  if (Date.now() - lastSentAt < COOLDOWN_MS) return ['cooldown', null];
  for (const el of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[type="text"], input[type="email"], input[type="tel"], textarea')) {
    const name = el.name;
    const value = el.value;
    if (!name || SKIP.has(name) || !value) continue;
    if (TAG_RE.test(value)) return ['tags', name];
    const urls = value.match(URL_RE)?.length ?? 0;
    if (MESSAGE_FIELDS.includes(name) ? urls >= 2 : urls > 0) return [MESSAGE_FIELDS.includes(name) ? 'links' : 'urlField', name];
    if ((MESSAGE_FIELDS.includes(name) || NAME_FIELDS.includes(name)) && nonLatinRatio(value) > 0.4) return ['alphabet', name];
  }
  return null;
}

/** Texto en el que el teléfono y el correo pasan a ser enlaces (sin innerHTML). */
export function renderText(box: HTMLElement, text: string) {
  box.replaceChildren();
  const p = document.createElement('p');
  for (const part of text.split(new RegExp(`(${PHONE}|${EMAIL.replace('.', '\\.')})`))) {
    if (part === PHONE || part === EMAIL) {
      const a = document.createElement('a');
      a.href = part === PHONE ? PHONE_TEL : `mailto:${EMAIL}`;
      a.textContent = part;
      p.append(a);
    } else if (part) p.append(part);
  }
  box.append(p);
}

/** Muestra el motivo en un aviso propio del formulario (lo crea junto al botón la primera vez). */
export function showGuardMessage(form: HTMLFormElement, reason: GuardReason, anchor?: Element | null) {
  let box = form.querySelector<HTMLElement>('[data-guard-msg]');
  if (!box) {
    box = document.createElement('p');
    box.className = 'field__error form-guard';
    box.setAttribute('role', 'alert');
    box.dataset.guardMsg = '';
    const where = anchor ?? form.querySelector('[type="submit"]');
    where?.parentElement ? where.parentElement.insertBefore(box, where) : form.append(box);
  }
  box.textContent = messages[pageLang()][reason];
  box.hidden = false;
}

export function hideGuardMessage(form: HTMLFormElement) {
  const box = form.querySelector<HTMLElement>('[data-guard-msg]');
  if (box) box.hidden = true;
}

/** Mensaje para una respuesta que no es de éxito. */
export function resultMessage(result: Exclude<SendResult, { kind: 'ok' }>): string {
  return messages[pageLang()][result.kind];
}

/** Aviso de éxito con adjuntos descartados (vacío si no hubo). */
export function discardedMessage(discarded: Discarded[], notSent: string[] = []): string {
  // El correo salió sin ningún adjunto (reintento del servidor): un solo aviso con todas las facturas.
  if (notSent.length) return messages[pageLang()].notSent;
  if (!discarded.length) return '';
  const list = discarded.map((d) => `${d.nombre} (${d.motivo})`).join(', ');
  return messages[pageLang()].discarded.replace('{llista}', list);
}

/** Marca un envío fallido y mantiene el botón desactivado hasta que acabe el enfriamiento. */
export function markSent(button?: HTMLButtonElement | null) {
  lastSentAt = Date.now();
  if (!button) return;
  button.disabled = true;
  window.setTimeout(() => {
    button.disabled = false;
  }, COOLDOWN_MS);
}
