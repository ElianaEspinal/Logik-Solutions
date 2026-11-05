// Lógica pura del pre-estudi (sin DOM): la usa el script de PreStudy.astro y se puede
// probar en Node. Aquí no hay ningún cálculo de ahorro: solo aritmética sobre el
// importe que escribe el visitante.
import { AMOUNT, AMOUNT_BANDS, TRACKING_PARAMS } from '../config/calculator';

export type ProfileKey = 'empresa' | 'comunitat' | 'llar';
export type SupplyKey = 'llum' | 'gas' | 'llum-gas';
export type PowerKey = 'fins-15' | 'mes-15' | 'no-ho-se';
export type ReviewKey = 'contracte' | 'ofertes' | 'potencia' | 'zones-comunes' | 'solar';

/**
 * Lee un importe escrito a mano en formato catalán/castellano.
 * "1.250" -> 1250 · "1.250,50" -> 1250.5 · "95,5" -> 95.5 · "95.5" -> 95.5 · "120 €" -> 120.
 * Devuelve NaN si no es un número.
 */
export function parseAmount(raw: string): number {
  let s = raw.replace(/[€\s ]/g, '');
  if (!s) return NaN;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ''); // punto de miles
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}

/** 1250 -> "1.250" · 95.5 -> "95,50" (con decimales solo si los hay). Igual en todos los navegadores. */
export function formatNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const [int, dec] = rounded.toFixed(2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec === '00' ? grouped : `${grouped},${dec}`;
}

export type AmountError = 'empty' | 'invalid' | 'tooHigh' | null;

export function amountError(raw: string): AmountError {
  if (!raw.trim()) return 'empty';
  const n = parseAmount(raw);
  if (!Number.isFinite(n) || n <= 0) return 'invalid';
  if (n > AMOUNT.maxTyped) return 'tooHigh';
  return null;
}

/** Gasto anual aproximado: importe mensual × 12, redondeado al euro ("càlcul simple"). */
export const annualOf = (monthly: number) => Math.round(monthly * 12);

export function bandOf(monthly: number): string {
  return AMOUNT_BANDS.find((b) => monthly < b.below)!.value;
}

/** Valor del deslizador para un importe (acotado y en pasos de AMOUNT.step). */
export function sliderValue(monthly: number): number {
  if (!Number.isFinite(monthly)) return AMOUNT.min;
  const clamped = Math.min(Math.max(monthly, AMOUNT.min), AMOUNT.max);
  return Math.round(clamped / AMOUNT.step) * AMOUNT.step;
}

/** "Què revisarem en el teu cas": lista compuesta según las respuestas. */
export function reviewKeys(a: { profile?: ProfileKey; power?: PowerKey; solar?: boolean }): ReviewKey[] {
  const keys: ReviewKey[] = ['contracte', 'ofertes'];
  if (a.profile === 'empresa' || a.power === 'mes-15') keys.push('potencia');
  if (a.profile === 'comunitat') keys.push('zones-comunes');
  if (a.solar) keys.push('solar');
  return keys;
}

/** utm_* y gclid de la URL actual (solo lectura; no se guardan en ningún sitio). */
export function readTracking(search: string): Record<(typeof TRACKING_PARAMS)[number], string> {
  const params = new URLSearchParams(search);
  return Object.fromEntries(
    TRACKING_PARAMS.map((key) => [key, (params.get(key) ?? '').replace(/[^\w.\-~:|/ ]/g, '').slice(0, 150)]),
  ) as Record<(typeof TRACKING_PARAMS)[number], string>;
}

/** "Pas {n} de {total}" -> "Pas 2 de 5". */
export const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));

/** Progreso inicial dotado: el paso 1 ya marca el 20 % y el último deja margen hasta el éxito (100 %). */
export const progressOf = (step: number, total: number) => (step > total ? 100 : 20 + ((step - 1) * 80) / total);
