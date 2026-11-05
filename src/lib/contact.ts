// Lógica pura del formulario de contacto (sin DOM): la usa src/scripts/contact-form.ts
// y se puede probar en Node. Valores estables y en minúsculas, iguales en ca y es.

export const PROFILES = ['empresa', 'comunitat', 'administrador', 'llar'] as const;
export const NEEDS = ['factura', 'gestions', 'plaques', 'altra'] as const;
export const CHANNELS = ['trucada', 'whatsapp', 'correu'] as const;

export type Profile = (typeof PROFILES)[number];
export type Need = (typeof NEEDS)[number];
export type Channel = (typeof CHANNELS)[number];

/** Canal por defecto del control segmentado. */
export const DEFAULT_CHANNEL: Channel = 'trucada';

/** Campos de cada paso, en el orden en que se muestran (el primero con error recibe el foco). */
export const STEP_FIELDS = {
  1: ['perfil', 'necessitat'],
  2: ['nom', 'email', 'telefon', 'factura', 'consentiment'],
} as const;

export type Field = (typeof STEP_FIELDS)[1][number] | (typeof STEP_FIELDS)[2][number];

export type ErrorCode =
  | 'perfil'
  | 'necessitat'
  | 'nom'
  | 'emailEmpty'
  | 'emailInvalid'
  | 'phoneEmpty'
  | 'phoneInvalid'
  | 'file'
  | 'consent';

export type Values = {
  perfil: string;
  necessitat: string;
  nom: string;
  email: string;
  telefon: string;
  preferencia_contacte: string;
  consentiment: boolean;
  /** false si hay un adjunto que no es PDF/imagen o pasa de 10 MB. */
  fileOk: boolean;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** El teléfono es obligatorio si prefiere trucada o WhatsApp; con correo, opcional. */
export const phoneRequired = (channel: string) => channel !== 'correu';

/** 9 cifras como mínimo y solo caracteres de teléfono (+, espacios, guiones, paréntesis, puntos). */
export const phoneValid = (raw: string) => /^[+\d\s().-]+$/.test(raw.trim()) && raw.replace(/\D/g, '').length >= 9;

/**
 * "Sense cost per a tu": solo si se ha elegido una necesidad y no es plaques solars
 * (la fotovoltaica sí tiene coste: nunca se dice "sense cost" ahí).
 */
export const showCostNote = (need: string | null | undefined) => !!need && need !== 'plaques';

export function fieldError(field: Field, v: Values): ErrorCode | null {
  switch (field) {
    case 'perfil':
      return (PROFILES as readonly string[]).includes(v.perfil) ? null : 'perfil';
    case 'necessitat':
      return (NEEDS as readonly string[]).includes(v.necessitat) ? null : 'necessitat';
    case 'nom':
      return v.nom.trim().length >= 2 ? null : 'nom';
    case 'email':
      if (!v.email.trim()) return 'emailEmpty';
      return EMAIL.test(v.email.trim()) ? null : 'emailInvalid';
    case 'telefon': {
      const tel = v.telefon.trim();
      if (!tel) return phoneRequired(v.preferencia_contacte) ? 'phoneEmpty' : null;
      return phoneValid(tel) ? null : 'phoneInvalid';
    }
    case 'factura':
      return v.fileOk ? null : 'file';
    case 'consentiment':
      return v.consentiment ? null : 'consent';
  }
}

/** Errores de un paso, en orden. Vacío = paso correcto. */
export function stepErrors(step: 1 | 2, v: Values): [Field, ErrorCode][] {
  return STEP_FIELDS[step]
    .map((f) => [f, fieldError(f, v)] as [Field, ErrorCode | null])
    .filter((e): e is [Field, ErrorCode] => e[1] !== null);
}

/** Etiquetas en catalán para el asunto del correo que recibe Logik (igual en las dos versiones). */
export const SUBJECT_LABELS = {
  perfil: { empresa: 'Empresa o negoci', comunitat: 'Comunitat de veïns', administrador: 'Administrador de finques', llar: 'Llar' },
  necessitat: { factura: 'Revisar factura', gestions: 'Gestions', plaques: 'Plaques solars', altra: 'Una altra consulta' },
} as const;

/** "Nova consulta web — Comunitat de veïns — Revisar factura". */
export function subjectOf(perfil: string, necessitat: string) {
  const p = SUBJECT_LABELS.perfil[perfil as Profile] ?? '-';
  const n = SUBJECT_LABELS.necessitat[necessitat as Need] ?? '-';
  return `Nova consulta web — ${p} — ${n}`;
}

/** Primer nombre para el mensaje de éxito ("Gràcies, Marta."). */
export const firstName = (nom: string) => nom.trim().split(/\s+/)[0] ?? '';
