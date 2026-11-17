// Formulario de contacto en dos pasos (src/components/contact/contact-form.astro).
// Sin JS: los dos pasos se ven seguidos, el botón está desactivado y un <noscript> da el teléfono.
// Con JS: dos pasos con foco y aviso aria-live, validación al salir de cada campo, sello
// antispam y envío a /api/enviar.php (src/scripts/form-send.ts) con estados de éxito y error.
//
// Eventos (solo con consentimiento de análisis; ver docs/tracking.md):
//   contact_form_start  primera interacción con el formulario      { form, form_location }
//   contact_step        paso completado (1 y 2, una vez cada uno)  { step, form, form_location }
//   generate_lead       el servidor responde ok                     { form, form_location, perfil, necessitat }
// Nunca se envían datos personales (nombre, correo, teléfono) a la analítica.

import { track, trackThen } from './analytics';
import { discardedMessage, guardCheck, hideGuardMessage, markSent, renderText, resultMessage, showGuardMessage } from './form-guard';
import { fileErrorText, filesError, initFileDrop } from './file-drop';
import { appendFiles, armSeal, submitForm } from './form-send';
import { readTracking, fill } from '../lib/pre-study';
import { STEP_FIELDS, fieldError, firstName, phoneRequired, showCostNote, stepErrors, type Field, type Values } from '../lib/contact';

type I18n = {
  step: string;
  titles: [string, string];
  sending: string;
  errors: Record<string, string>;
  channels: Record<string, string>;
};

const FORM = 'contacte';
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initContactForm(root: HTMLElement) {
  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const form = $<HTMLFormElement>('[data-cf-form]');
  const i18n = JSON.parse(root.dataset.i18n ?? '{}') as I18n;
  const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')];
  const stepLabel = $('[data-step-label]');
  const progress = $('[data-progress]');
  const live = $('[data-live]');
  const next = $<HTMLButtonElement>('[data-next]');
  const back = $<HTMLButtonElement>('[data-back]');
  const submit = $<HTMLButtonElement>('[data-submit]');
  const submitLabel = $('[data-submit-label]');
  const sendError = $('[data-send-error]');
  const success = $('[data-success]');
  const cost = $('[data-cost]');
  const phone = $<HTMLInputElement>('[name="telefon"]');
  const phoneOptional = $('[data-phone-optional]');
  const dropEl = form.querySelector<HTMLElement>('[data-drop]');

  form.noValidate = true; // con JS validamos nosotros, con mensajes junto a cada campo
  let step: 1 | 2 = 1;
  let sending = false;
  let started = false;
  const tried = new Set<number>(); // pasos en los que ya se pulsó Continuar / Enviar
  const done = new Set<number>(); // contact_step ya enviado
  const touched = new Set<string>();

  // --- Lectura de valores ------------------------------------------------------
  const text = (name: string) => ((form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? '').trim();
  const radio = (name: string) => form.querySelector<HTMLInputElement>(`[name="${name}"]:checked`)?.value ?? '';
  const drop = dropEl
    ? initFileDrop(dropEl, (files, code) => {
        if (code === null && files.length) live.textContent = files.map((f) => f.name).join(', ');
      })
    : null;
  const values = (): Values => ({
    perfil: radio('perfil'),
    necessitat: radio('necessitat'),
    nom: text('nom'),
    email: text('email'),
    telefon: text('telefon'),
    preferencia_contacte: radio('preferencia_contacte'),
    consentiment: (form.elements.namedItem('consentiment') as HTMLInputElement).checked,
  });

  // --- Errores accesibles ------------------------------------------------------
  const errorEl = (field: string) => form.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
  const controls = (field: string) => [...form.querySelectorAll<HTMLInputElement>(`[name="${field}"]`)];

  function setError(field: Field, code: string | null) {
    const error = errorEl(field);
    if (!error) return;
    error.textContent = code ? (i18n.errors[code] ?? '') : '';
    error.hidden = !code;
    const group = form.querySelector<HTMLElement>(`[data-group="${field}"]`);
    if (group) {
      // Grupo de opciones: el fieldset ya está descrito por el mensaje (aria-describedby fijo).
      group.classList.toggle('is-invalid', !!code);
      if (code) group.setAttribute('aria-invalid', 'true');
      else group.removeAttribute('aria-invalid');
      return;
    }
    for (const input of controls(field)) {
      const ids = (input.getAttribute('aria-describedby') ?? '').split(' ').filter((x) => x && x !== error.id);
      if (code) {
        input.setAttribute('aria-invalid', 'true');
        ids.unshift(error.id);
      } else input.removeAttribute('aria-invalid');
      if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
      else input.removeAttribute('aria-describedby');
    }
  }

  const validateField = (field: Field) => {
    const code = fieldError(field, values());
    setError(field, code);
    return code;
  };

  /** Valida un paso entero; devuelve el primer campo con error (o null). */
  function validateStep(n: 1 | 2): Field | null {
    const errors = stepErrors(n, values());
    const bad = new Map(errors);
    for (const field of STEP_FIELDS[n] as readonly Field[]) setError(field, bad.get(field) ?? null);
    return errors[0]?.[0] ?? null;
  }

  function focusField(field: Field) {
    const target =
      form.querySelector<HTMLInputElement>(`[name="${field}"]:checked`) ??
      form.querySelector<HTMLInputElement>(`[name="${field}"]:not([type="hidden"])`);
    target?.focus();
    live.textContent = errorEl(field)?.textContent ?? '';
  }

  // --- Pasos -------------------------------------------------------------------
  function go(n: 1 | 2, opts: { focus?: boolean } = {}) {
    const forward = n > step;
    step = n;
    steps.forEach((el) => {
      const active = Number(el.dataset.step) === n;
      el.hidden = !active;
      el.classList.remove('is-entering', 'is-entering-back');
      if (active && opts.focus) {
        void el.offsetWidth; // reinicia la animación de entrada
        el.classList.add(forward ? 'is-entering' : 'is-entering-back');
      }
    });
    const label = fill(i18n.step, { n, total: 2 });
    stepLabel.textContent = label;
    progress.style.setProperty('--p', String(n / 2));
    root.dataset.step = String(n);
    if (!opts.focus) return;
    live.textContent = `${label}: ${i18n.titles[n - 1]}`;
    const title = steps[n - 1].querySelector<HTMLElement>('[data-step-title]');
    title?.focus({ preventScroll: true });
    // Que se vea el principio de la tarjeta si ha quedado por encima de la pantalla.
    const top = root.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.6) {
      root.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
  }

  const once = (n: number) => {
    if (done.has(n)) return;
    done.add(n);
    track('contact_step', { step: n, form: FORM, form_location: FORM });
  };

  function continueFromStep1() {
    tried.add(1);
    const first = validateStep(1);
    if (first) return focusField(first);
    once(1);
    go(2, { focus: true });
  }

  // --- Estados que dependen de lo elegido -----------------------------------------
  function syncChoices() {
    const v = values();
    next.classList.toggle('is-ready', !!v.perfil && !!v.necessitat);
    const showCost = showCostNote(v.necessitat);
    cost.hidden = !showCost;
    const required = phoneRequired(v.preferencia_contacte);
    phone.required = required;
    phone.setAttribute('aria-required', String(required));
    phoneOptional.hidden = required;
  }

  // --- Listeners -----------------------------------------------------------------
  const start = () => {
    if (started) return;
    started = true;
    track('contact_form_start', { form: FORM, form_location: FORM });
  };
  form.addEventListener('focusin', start);
  form.addEventListener('pointerdown', start);

  form.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    syncChoices();
    if (input.name === 'preferencia_contacte' && (touched.has('telefon') || tried.has(2))) validateField('telefon');
    else if (input.type === 'radio' || input.type === 'checkbox') {
      if (tried.has(step) || errorEl(input.name)?.hidden === false) validateField(input.name as Field);
    }
  });

  // Validación al salir del campo (solo si se ha escrito algo o ya se intentó continuar).
  form.addEventListener('focusout', (e) => {
    const input = e.target as HTMLInputElement;
    const name = input.name as Field;
    if (!name || input.type === 'radio' || input.type === 'checkbox' || input.type === 'file' || !errorEl(name)) return;
    // Si el foco va a un botón del formulario, valida ese botón (evita mover el botón bajo el cursor).
    const to = (e as FocusEvent).relatedTarget as HTMLElement | null;
    if (to && (to === submit || to === next)) return;
    if (input.value.trim()) touched.add(name);
    if (touched.has(name) || tried.has(step)) validateField(name);
  });

  // Mientras escribe, un error visible desaparece en cuanto el valor es correcto.
  form.addEventListener('input', (e) => {
    const name = (e.target as HTMLInputElement).name as Field;
    const error = name && errorEl(name);
    if (error && !error.hidden && !fieldError(name, values())) setError(name, null);
  });

  next.addEventListener('click', continueFromStep1);
  back.addEventListener('click', () => go(1, { focus: true }));

  // --- Envío -----------------------------------------------------------------------
  function setSending(on: boolean) {
    sending = on;
    submit.disabled = on; // deshabilitado solo mientras envía
    if (on) submit.setAttribute('aria-busy', 'true');
    else submit.removeAttribute('aria-busy');
    submitLabel.textContent = on ? i18n.sending : (submit.dataset.label ?? '');
    if (on) live.textContent = i18n.sending;
  }

  function showSendError(text: string) {
    setSending(false);
    renderText(sendError, text);
    sendError.hidden = false;
    live.textContent = text;
  }

  /** 422: errores por campo del servidor, junto a cada campo; foco en el primero. */
  function showServerErrors(errors: Record<string, string>) {
    setSending(false);
    let first: Field | null = null;
    for (const [field, message] of Object.entries(errors)) {
      const error = errorEl(field);
      if (!error) continue;
      error.textContent = message;
      error.hidden = false;
      for (const input of controls(field)) input.setAttribute('aria-invalid', 'true');
      first ??= field as Field;
    }
    if (!first) return showSendError(resultMessage({ kind: 'invalid', errors }));
    if ((STEP_FIELDS[1] as readonly string[]).includes(first)) go(1, { focus: true });
    focusField(first);
  }

  function showSuccess(note: string) {
    const v = values();
    $('[data-success-name]').textContent = firstName(v.nom);
    $('[data-success-channel]').textContent = i18n.channels[v.preferencia_contacte] ?? i18n.channels.trucada;
    const noteEl = $('[data-success-note]');
    if (note) renderText(noteEl, note);
    noteEl.hidden = !note;
    form.hidden = true;
    $('[data-progress-wrap]').hidden = true;
    success.hidden = false;
    $('[data-success-title]').focus({ preventScroll: true });
    root.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return; // sin doble envío
    // Intro en el paso 1 = Continuar.
    if (step === 1) return continueFromStep1();

    sendError.hidden = true;
    tried.add(2);
    const first1 = validateStep(1);
    if (first1) {
      go(1, { focus: true });
      return focusField(first1);
    }
    const first2 = validateStep(2);
    if (first2) return focusField(first2);
    once(2);

    // Enlaces, etiquetas, alfabeto y enfriamiento: avisa antes de que el servidor lo descarte.
    const blocked = guardCheck(form);
    if (blocked) {
      const [reason, field] = blocked;
      showGuardMessage(form, reason, submit);
      if (field) form.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
      return;
    }
    hideGuardMessage(form);

    setSending(true);
    const v = values();
    const data = new FormData(form);
    const tracking = readTracking(window.location.search);
    for (const [key, value] of Object.entries(tracking)) data.set(key, value);
    const files = await appendFiles(data, drop?.files() ?? []);
    const fileProblem = filesError(files);
    if (fileProblem) {
      setSending(false);
      drop?.showError(fileProblem);
      live.textContent = fileErrorText(fileProblem);
      drop?.input.focus();
      return;
    }

    const result = await submitForm(form, data);
    if (result.kind === 'ok') {
      trackThen('generate_lead', { form: FORM, form_location: FORM, perfil: v.perfil, necessitat: v.necessitat }, () =>
        showSuccess(discardedMessage(result.discarded, result.notSent)),
      );
    } else if (result.kind === 'invalid') {
      showServerErrors(result.errors);
    } else {
      showSendError(resultMessage(result));
      if (result.kind !== 'tooLarge') markSent(submit); // enfriamiento de 30 s tras un fallo
    }
  });

  // --- Estado inicial (respeta lo que el navegador haya recordado) ---------------------
  // ?perfil=administrador (p. ej. desde Comunitats de veïns) preselecciona ese perfil del paso 1
  // si existe y no hay otro ya marcado. Sin parámetro, o con un valor desconocido, no cambia nada.
  const presetProfile = new URLSearchParams(window.location.search).get('perfil');
  if (presetProfile && !radio('perfil')) {
    const option = controls('perfil').find((input) => input.value === presetProfile);
    if (option) option.checked = true;
  }
  root.classList.add('is-enhanced');
  armSeal(form);
  submit.disabled = false; // sin JS queda desactivado (no hay sello)
  syncChoices();
  go(1);
}
