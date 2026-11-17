// Opciones válidas de los campos de selección de cada formulario, sacadas de los mismos textos que
// muestra la web. El build las escribe en dist/api/lib/opciones.php (astro.config.mjs), que es la
// lista cerrada con la que valida el servidor (public/api/lib/validacion.php). Así la web y el
// servidor nunca se desincronizan: si cambia un texto de una opción, cambia en los dos sitios.
//
// Formato: formulario -> campo -> { valor que envía el formulario: texto que verá Logik en el correo }.
import { AMOUNT_BANDS } from './calculator';
import { TRAMIT_KEYS } from '../components/gestions/types';
import { preStudyTexts } from '../components/home/pre-study-texts';
import { ui } from '../i18n/ui';
import { CHANNEL_LABELS, CHANNELS, NEEDS, PROFILES, SUBJECT_LABELS } from '../lib/contact';

type Options = Record<string, Record<string, Record<string, string>>>;

const same = (values: string[]) => Object.fromEntries(values.map((v) => [v, v]));
const both = <T>(pick: (lang: 'ca' | 'es') => T[]) => [...new Set([...pick('ca'), ...pick('es')])];

export function formOptions(): Options {
  const ps = preStudyTexts;
  return {
    contacte: {
      perfil: Object.fromEntries(PROFILES.map((k) => [k, SUBJECT_LABELS.perfil[k]])),
      necessitat: Object.fromEntries(NEEDS.map((k) => [k, SUBJECT_LABELS.necessitat[k]])),
      preferencia_contacte: Object.fromEntries(CHANNELS.map((k) => [k, CHANNEL_LABELS[k]])),
    },
    'home-cierre': {
      perfil: same(both((l) => (['empresa', 'comunitat', 'llar'] as const).map((p) => ui[l][`form.profile.${p}`]))),
    },
    calculadora: {
      perfil: same(both((l) => Object.values(ps[l].profile.options).map((o) => o.label))),
      subministrament: same(both((l) => Object.values(ps[l].supply.options).map((o) => o.label))),
      activitat: same(both((l) => [...ps[l].supply.activity.options])),
      potencia: same(both((l) => Object.values(ps[l].amount.power.options))),
      interes_solar: same(both((l) => [ps[l].summary.yes, ps[l].summary.no])),
      franja_import: same(AMOUNT_BANDS.map((b) => b.value)),
      // Campo oculto que añade la página Gestió i tràmits (src/components/gestions/gestions-page.astro).
      tramit_interes: same([...TRAMIT_KEYS]),
    },
  };
}

const phpString = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** Contenido de dist/api/lib/opciones.php (con la guarda de los archivos incluidos). */
export function opcionesPhp(): string {
  const lines = [
    '<?php',
    'declare(strict_types=1);',
    "defined('LOGIK_FORM') || exit;",
    '',
    '// GENERADO POR EL BUILD (src/config/form-options.ts). No editar a mano: se sobrescribe.',
    '// Opciones válidas de cada campo de selección: valor enviado => texto para el correo.',
    '',
    'return [',
  ];
  for (const [form, fields] of Object.entries(formOptions())) {
    lines.push(`    ${phpString(form)} => [`);
    for (const [field, values] of Object.entries(fields)) {
      lines.push(`        ${phpString(field)} => [`);
      for (const [value, label] of Object.entries(values)) lines.push(`            ${phpString(value)} => ${phpString(label)},`);
      lines.push('        ],');
    }
    lines.push('    ],');
  }
  lines.push('];', '');
  return lines.join('\n');
}
