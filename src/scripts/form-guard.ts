// Capas antispam en el navegador, comunes a todos los formularios (contacto, cierre y pre-estudi).
// Complementan al honeypot `_gotcha` (capa 1, que filtra Formspree) y a la validación nativa
// (required, type, maxlength, pattern). Sin JavaScript el formulario envía igual (POST nativo).
//
// Capa 2: tiempo mínimo. Un envío a menos de 3 s de cargar la página se rechaza con un mensaje neutro.
// Capa 3: más de 2 enlaces en los campos de texto libre (textarea) se rechaza.
// Capa 4: tras un envío, el botón queda desactivado 30 s (también si el envío falla).
//
// No guarda nada en el navegador (ni cookies ni localStorage): el enfriamiento dura lo que la página.

const MIN_MS = 3_000;
const COOLDOWN_MS = 30_000;
const MAX_LINKS = 2;

const loadedAt = Date.now();
let lastSentAt = 0;

export type GuardReason = 'tooFast' | 'cooldown' | 'links';

const messages: Record<'ca' | 'es', Record<GuardReason, string>> = {
  ca: {
    tooFast: 'Espera uns segons i torna-ho a provar.',
    cooldown: 'Ja hem rebut un enviament fa un moment. Espera uns segons abans de tornar-ho a provar.',
    links: 'El missatge no pot tenir més de 2 enllaços.',
  },
  es: {
    tooFast: 'Espera unos segundos y vuelve a intentarlo.',
    cooldown: 'Acabamos de recibir un envío. Espera unos segundos antes de volver a intentarlo.',
    links: 'El mensaje no puede tener más de 2 enlaces.',
  },
};

const lang = (): 'ca' | 'es' => (document.documentElement.lang === 'es' ? 'es' : 'ca');

/** Comprueba las capas 2 a 4. null = se puede enviar. */
export function guardCheck(form: HTMLFormElement): GuardReason | null {
  const now = Date.now();
  if (now - lastSentAt < COOLDOWN_MS) return 'cooldown';
  if (now - loadedAt < MIN_MS) return 'tooFast';
  const free = [...form.querySelectorAll('textarea')].map((t) => t.value).join(' ');
  if ((free.match(/https?:\/\/|www\./gi) ?? []).length > MAX_LINKS) return 'links';
  return null;
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
  box.textContent = messages[lang()][reason];
  box.hidden = false;
}

export function hideGuardMessage(form: HTMLFormElement) {
  const box = form.querySelector<HTMLElement>('[data-guard-msg]');
  if (box) box.hidden = true;
}

/** Marca un envío (con éxito o no) y mantiene el botón desactivado hasta que acabe el enfriamiento. */
export function markSent(button?: HTMLButtonElement | null) {
  lastSentAt = Date.now();
  if (!button) return;
  button.disabled = true;
  window.setTimeout(() => {
    button.disabled = false;
  }, COOLDOWN_MS);
}
