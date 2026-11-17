// Asistente del pre-estudi (src/components/home/pre-study.astro).
// - Una pregunta por pantalla; el progreso vive solo en memoria (sin cookies ni storage).
// - Nada se envía antes del último paso.
// - Con puntero o táctil, las opciones únicas avanzan solas tras AUTO_ADVANCE_MS;
//   con teclado nunca: se usa "Continua".
// - Eventos (solo con consentimiento, vía analytics.ts): calc_start, calc_step, generate_lead.
import { AUTO_ADVANCE_MS, COUNTER_MS, ESTIMATE_ENABLED, TRANSITION_MS, estimateRange } from '../config/calculator';
import {
  amountError,
  annualOf,
  bandOf,
  fill,
  formatNumber,
  parseAmount,
  progressOf,
  readTracking,
  reviewKeys,
  sliderValue,
  type PowerKey,
  type ProfileKey,
  type SupplyKey,
} from '../lib/pre-study';
import { track, trackThen } from './analytics';
import { discardedMessage, guardCheck, hideGuardMessage, markSent, renderText, resultMessage, showGuardMessage } from './form-guard';
import { fileErrorText, filesError, initFileDrop } from './file-drop';
import { appendFiles, armSeal, submitForm } from './form-send';
import { nameValid, phoneValid } from '../lib/contact';

interface I18n {
  step: string;
  next: string;
  submit: string;
  sending: string;
  sliderValue: string;
  monthly: string;
  yes: string;
  no: string;
  errors: Record<
    | 'profile'
    | 'supply'
    | 'amountEmpty'
    | 'amountInvalid'
    | 'amountTooHigh'
    | 'firstName'
    | 'lastName'
    | 'emailEmpty'
    | 'emailInvalid'
    | 'phone'
    | 'consent',
    string
  >;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function initPreStudy(root: HTMLElement) {
  const found = root.querySelector<HTMLFormElement>('[data-ps-form]');
  if (!found || root.dataset.ready) return;
  const form: HTMLFormElement = found;
  root.dataset.ready = 'true';

  const i18n = JSON.parse(root.dataset.i18n ?? '{}') as I18n;
  const total = Number(root.dataset.total) || 5;
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const steps = [...root.querySelectorAll<HTMLElement>('[data-step]')];
  const success = $('[data-success]');
  const stepLabel = $('[data-step-label]');
  const progress = $('[data-progress]');
  const live = $('[data-live]');
  const back = $<HTMLButtonElement>('[data-back]');
  const next = $<HTMLButtonElement>('[data-next]');
  const nextLabel = $('[data-next-label]');
  const amount = $<HTMLInputElement>('[data-amount]');
  const range = $<HTMLInputElement>('[data-range]');
  const annualLive = $('[data-annual-live]');
  const activity = $('[data-activity]');
  // Puede no existir (PreStudy con solar={false}): entonces cuenta como "no" y no se envía.
  const solarInput = root.querySelector<HTMLInputElement>('[data-solar]');
  const solar = { get checked() { return !!solarInput?.checked; } };
  const trust = $('[data-trust]');
  const sendError = $('[data-send-error]');
  const dropEl = root.querySelector<HTMLElement>('[data-drop]');
  const drop = dropEl ? initFileDrop(dropEl) : null;
  const successNote = $('[data-success-note]');

  form.noValidate = true; // validamos nosotros, con mensajes en línea
  next.disabled = false; // sin JS queda desactivado (no hay sello)
  armSeal(form); // sello antispam en la primera interacción (src/scripts/form-send.ts)

  let current = 1;
  const tried = new Set<number>(); // pasos en los que ya se intentó avanzar
  let started = false;
  const reported = new Set<number>();
  let autoTimer = 0;
  let pointerAt = 0;
  let sending = false;
  let counterFrame = 0;

  // --- Utilidades de lectura ---------------------------------------------------
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | RadioNodeList | null;
  const text = (name: string) => ((field(name) as HTMLInputElement | null)?.value ?? '').trim();
  const checked = (name: string) => form.querySelector<HTMLInputElement>(`[name="${name}"]:checked`);
  const code = <T extends string>(name: string) => checked(name)?.dataset.code as T | undefined;
  const monthly = () => parseAmount(amount.value);

  // --- Errores en línea asociados al campo -----------------------------------
  const errorEl = (name: string) => form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
  const describedTarget = (name: string): HTMLElement | null => {
    const input = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
    if (!input) return null;
    return input.type === 'radio' ? input.closest('fieldset') : input;
  };
  function setError(name: string, message: string | null) {
    const error = errorEl(name);
    const target = describedTarget(name);
    if (!error || !target) return;
    if (message) error.textContent = message;
    error.hidden = !message;
    const ids = (target.getAttribute('aria-describedby') ?? '').split(' ').filter((x) => x && x !== error.id);
    if (message) ids.push(error.id);
    if (ids.length) target.setAttribute('aria-describedby', ids.join(' '));
    else target.removeAttribute('aria-describedby');
    if (target.tagName === 'FIELDSET') target.classList.toggle('is-invalid', !!message);
    else if (message) target.setAttribute('aria-invalid', 'true');
    else target.removeAttribute('aria-invalid');
  }

  const rules: Record<string, () => string | null> = {
    perfil: () => (checked('perfil') ? null : i18n.errors.profile),
    subministrament: () => (checked('subministrament') ? null : i18n.errors.supply),
    import_mensual: () => {
      const e = amountError(amount.value);
      return e === 'empty' ? i18n.errors.amountEmpty : e === 'invalid' ? i18n.errors.amountInvalid : e === 'tooHigh' ? i18n.errors.amountTooHigh : null;
    },
    nom: () => (nameValid(text('nom')) ? null : i18n.errors.firstName),
    cognoms: () => (nameValid(text('cognoms')) ? null : i18n.errors.lastName),
    email: () =>
      !text('email') ? i18n.errors.emailEmpty : text('email').length <= 254 && EMAIL.test(text('email')) ? null : i18n.errors.emailInvalid,
    telefon: () => (phoneValid(text('telefon')) ? null : i18n.errors.phone),
    consentiment: () => ((field('consentiment') as HTMLInputElement).checked ? null : i18n.errors.consent),
  };
  const fieldsOf: Record<number, string[]> = {
    1: ['perfil'],
    2: ['subministrament'],
    3: ['import_mensual'],
    4: [],
    5: ['nom', 'cognoms', 'email', 'telefon', 'consentiment'],
  };

  function validate(name: string) {
    const message = rules[name]?.() ?? null;
    setError(name, message);
    return message;
  }

  /** Valida el paso; devuelve el primer campo con error (o null). */
  function validateStep(n: number) {
    let first: string | null = null;
    for (const name of fieldsOf[n]) if (validate(name) && !first) first = name;
    return first;
  }

  // --- Navegación --------------------------------------------------------------
  /**
   * Cambia el contenido del escenario animando su altura medida: de la altura actual a la
   * del contenido nuevo. Sin alturas fijas: al acabar se quita el height en línea.
   * Los cambios ocurren justo tras un clic o una tecla (no cuentan como CLS).
   */
  const stage = $('.ps-stage');
  let resizeEnd = 0;
  function animateHeight(change: () => void) {
    if (reduceMotion()) return change();
    const from = stage.getBoundingClientRect().height;
    change();
    const to = stage.getBoundingClientRect().height;
    if (Math.abs(to - from) < 2) return;
    clearTimeout(resizeEnd);
    stage.classList.remove('is-resizing');
    stage.style.height = `${from}px`;
    void stage.offsetHeight;
    stage.classList.add('is-resizing');
    stage.style.height = `${to}px`;
    resizeEnd = window.setTimeout(() => {
      stage.classList.remove('is-resizing');
      stage.style.removeProperty('height');
    }, TRANSITION_MS + 60);
  }

  function render(n: number, direction: 1 | -1, focus: boolean) {
    if (focus) return animateHeight(() => renderStep(n, direction, focus));
    renderStep(n, direction, focus);
  }

  function renderStep(n: number, direction: 1 | -1, focus: boolean) {
    clearTimeout(autoTimer);
    current = n;
    steps.forEach((step) => {
      const active = Number(step.dataset.step) === n;
      step.toggleAttribute('data-active', active);
      step.inert = !active;
      step.classList.remove('is-entering', 'is-entering-back');
      if (active && focus && !reduceMotion()) {
        void step.offsetWidth; // reinicia la animación
        step.classList.add(direction === 1 ? 'is-entering' : 'is-entering-back');
        setTimeout(() => step.classList.remove('is-entering', 'is-entering-back'), TRANSITION_MS + 50);
      }
    });

    const label = fill(i18n.step, { n, total });
    stepLabel.textContent = label;
    progress.style.setProperty('--p', String(progressOf(n, total) / 100));
    back.classList.toggle('is-hidden', n === 1);
    back.disabled = n === 1;
    const last = n === total;
    nextLabel.textContent = last ? i18n.submit : i18n.next;

    if (n === 4) fillSummary();
    if (!focus) return;
    live.textContent = label;
    const title = steps[n - 1].querySelector<HTMLElement>('.ps-step__title');
    if (title) bringIntoView(title);
    title?.focus({ preventScroll: true });
  }

  /** Lleva el título del paso nuevo a la vista si quedó bajo la cabecera o en la mitad inferior. */
  function bringIntoView(title: HTMLElement) {
    const top = title.getBoundingClientRect().top;
    const header = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 80;
    if (top < header || top > window.innerHeight * 0.55) {
      title.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
  }

  function goNext() {
    tried.add(current);
    const invalid = validateStep(current);
    if (invalid) {
      const input = form.querySelector<HTMLElement>(`[name="${invalid}"]`);
      live.textContent = errorEl(invalid)?.textContent ?? '';
      input?.focus();
      return;
    }
    if (!reported.has(current)) {
      reported.add(current);
      track('calc_step', { step: current, form_location: 'calculadora' });
    }
    if (current < total) render(current + 1, 1, true);
    else send();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!sending) goNext();
  });
  back.addEventListener('click', () => current > 1 && render(current - 1, -1, true));

  // --- calc_start: primera interacción con el paso 1 ------------------------
  const markStart = () => {
    if (started) return;
    started = true;
    track('calc_start', { form_location: 'calculadora' });
  };
  // Con el perfil ya resuelto (data-preset), el asistente arranca en el paso 2: calc_start se
  // lanza con la primera interacción de ese paso.
  const startStep = root.dataset.preset ? 2 : 1;
  for (const type of ['pointerdown', 'keydown', 'change']) steps[startStep - 1].addEventListener(type, markStart);

  // --- Auto-avance solo con puntero o táctil --------------------------------
  root.addEventListener('pointerdown', (e) => {
    pointerAt = (e.target as Element).closest('.ps-option') ? performance.now() : 0;
  });
  root.addEventListener('keydown', () => (pointerAt = 0));

  form.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.name === 'perfil') activity.hidden = input.dataset.code !== 'empresa';
    if (rules[input.name] && (tried.has(current) || !errorEl(input.name)?.hidden)) validate(input.name);

    const byPointer = pointerAt && performance.now() - pointerAt < 1500;
    // Paso 2 de una empresa: no avanza solo, porque queda el desplegable opcional de actividad.
    const waitsForActivity = input.name === 'subministrament' && code<ProfileKey>('perfil') === 'empresa';
    if (input.matches('[data-auto]') && byPointer && !waitsForActivity) {
      const from = current;
      clearTimeout(autoTimer);
      autoTimer = window.setTimeout(() => current === from && goNext(), AUTO_ADVANCE_MS);
    }
  });

  // --- Validación en línea ----------------------------------------------------
  form.addEventListener('focusout', (e) => {
    const input = e.target as HTMLInputElement;
    if ((e as FocusEvent).relatedTarget === next) return; // lo valida el envío
    if (!input.name || !rules[input.name] || input.type === 'radio') return;
    if (input === amount && amount.value.trim() && !amountError(amount.value)) amount.value = formatNumber(monthly());
    if (tried.has(current) || input.value.trim()) validate(input.name);
  });
  form.addEventListener('input', (e) => {
    const name = (e.target as HTMLInputElement).name;
    if (name && !errorEl(name)?.hidden) validate(name);
  });

  // --- Importe: campo y deslizador sincronizados, medidor en vivo ------------
  const paintRange = () => {
    const pct = ((Number(range.value) - Number(range.min)) / (Number(range.max) - Number(range.min))) * 100;
    range.style.setProperty('--fill', `${pct}%`);
    range.setAttribute('aria-valuetext', fill(i18n.sliderValue, { x: formatNumber(Number(range.value)) }));
  };
  const paintAnnual = () => {
    annualLive.textContent = amountError(amount.value) ? '—' : formatNumber(annualOf(monthly()));
  };
  amount.addEventListener('input', () => {
    const n = monthly();
    if (Number.isFinite(n)) range.value = String(sliderValue(n));
    paintRange();
    paintAnnual();
  });
  range.addEventListener('input', () => {
    amount.value = formatNumber(Number(range.value));
    paintRange();
    paintAnnual();
    if (!errorEl('import_mensual')?.hidden || tried.has(3)) validate('import_mensual');
  });

  // --- Resumen (paso 4) -------------------------------------------------------
  const setSum = (key: string, value: string) => {
    const dd = root.querySelector<HTMLElement>(`[data-sum="${key}"]`);
    if (dd) dd.textContent = value;
  };
  function fillSummary() {
    const m = monthly();
    setSum('perfil', checked('perfil')?.value ?? '');
    setSum('subministrament', checked('subministrament')?.value ?? '');
    const act = text('activitat');
    setSum('activitat', act);
    root.querySelector<HTMLElement>('[data-sum-row="activitat"]')!.hidden = !act;
    setSum('import', fill(i18n.monthly, { x: formatNumber(m) }));
    setSum('potencia', checked('potencia')?.value ?? '');
    if (solarInput) setSum('solar', solar.checked ? i18n.yes : i18n.no);

    const keys = reviewKeys({ profile: code<ProfileKey>('perfil'), power: code<PowerKey>('potencia'), solar: solar.checked });
    root.querySelectorAll<HTMLElement>('[data-review]').forEach((li) => (li.hidden = !keys.includes(li.dataset.review as never)));

    // Punto de extensión: con ESTIMATE_ENABLED = false no se calcula ni se muestra nada.
    if (ESTIMATE_ENABLED) {
      estimateRange({
        profile: code<ProfileKey>('perfil')!,
        supply: code<SupplyKey>('subministrament')!,
        monthly: m,
        power: code<PowerKey>('potencia') ?? 'no-ho-se',
        solar: solar.checked,
      });
    }

    countTo($('[data-annual]'), annualOf(m));
  }

  /** Contador animado del gasto anual (estático con movimiento reducido). */
  function countTo(el: HTMLElement, to: number) {
    cancelAnimationFrame(counterFrame);
    const final = `${formatNumber(to)} €`;
    if (reduceMotion()) {
      el.textContent = final;
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / COUNTER_MS, 1);
      el.textContent = p < 1 ? `${formatNumber(Math.round(to * (1 - Math.pow(1 - p, 3))))} €` : final;
      if (p < 1) counterFrame = requestAnimationFrame(step);
    };
    counterFrame = requestAnimationFrame(step);
  }

  // --- Envío ------------------------------------------------------------------
  function stopSending() {
    sending = false;
    next.disabled = false;
    next.removeAttribute('aria-busy');
    nextLabel.textContent = i18n.submit;
  }

  function showSendError(message: string) {
    stopSending();
    trust.classList.add('is-hidden');
    renderText(sendError, message);
    sendError.hidden = false;
    live.textContent = message;
  }

  async function send() {
    if (sending) return;
    // Enlaces, etiquetas, alfabeto y enfriamiento: avisa antes de que el servidor lo descarte.
    const blocked = guardCheck(form);
    if (blocked) {
      showGuardMessage(form, blocked[0], next);
      if (blocked[1]) form.querySelector<HTMLElement>(`[name="${blocked[1]}"]`)?.focus();
      return;
    }
    hideGuardMessage(form);
    sending = true;
    sendError.hidden = true;
    trust.classList.remove('is-hidden');
    next.disabled = true;
    next.setAttribute('aria-busy', 'true');
    nextLabel.textContent = i18n.sending;
    live.textContent = i18n.sending;

    const m = monthly();
    $<HTMLInputElement>('[data-band]').value = bandOf(m);
    const tracking = readTracking(window.location.search);
    root.querySelectorAll<HTMLInputElement>('[data-track]').forEach((input) => {
      input.value = tracking[input.dataset.track as keyof typeof tracking] ?? '';
    });

    const data = new FormData(form);
    data.set('import_mensual', String(Math.round(m * 100) / 100));
    if (solarInput) data.set('interes_solar', solar.checked ? i18n.yes : i18n.no);
    const files = await appendFiles(data, drop?.files() ?? []);
    const fileProblem = filesError(files);
    if (fileProblem) {
      stopSending();
      drop?.showError(fileProblem);
      live.textContent = fileErrorText(fileProblem);
      drop?.input.focus();
      return;
    }

    const result = await submitForm(form, data);
    if (result.kind === 'ok') {
      const profile = code<ProfileKey>('perfil') ?? '';
      trackThen('generate_lead', { form: 'calculadora', form_location: 'calculadora', perfil: profile }, () =>
        showSuccess(discardedMessage(result.discarded, result.notSent)),
      );
    } else if (result.kind === 'invalid') {
      // 422: errores por campo del servidor. Lleva al paso del primer campo con error.
      stopSending();
      trust.classList.add('is-hidden');
      let first: string | null = null;
      for (const [name, message] of Object.entries(result.errors)) {
        if (!errorEl(name)) continue;
        setError(name, message);
        first ??= name;
      }
      if (!first) return showSendError(resultMessage(result));
      const stepOf = Number(Object.entries(fieldsOf).find(([, names]) => names.includes(first!))?.[0] ?? total);
      if (stepOf !== current) render(stepOf, -1, true);
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      live.textContent = errorEl(first)?.textContent ?? '';
    } else {
      showSendError(resultMessage(result));
      if (result.kind !== 'tooLarge') markSent(next); // enfriamiento de 30 s tras un fallo
    }
  }

  function showSuccess(note: string) {
    $('[data-success-name]').textContent = text('nom');
    if (note) renderText(successNote, note);
    successNote.hidden = !note;
    // La pantalla de éxito llega tras la respuesta del servidor (no tras un clic): conserva al
    // menos la altura del formulario para que nada de debajo se mueva (sin CLS).
    success.style.minHeight = `${form.getBoundingClientRect().height}px`;
    form.removeAttribute('data-active');
    form.inert = true;
    success.inert = false;
    success.setAttribute('data-active', '');
    bringIntoView($('[data-success-title]'));
    $('[data-success-title]').focus({ preventScroll: true });
  }

  // --- Estado inicial ----------------------------------------------------------
  activity.hidden = code<ProfileKey>('perfil') !== 'empresa';
  if (amount.value) amount.dispatchEvent(new Event('input'));
  paintRange();
  render(startStep, 1, false);
}
