// Configuración del pre-estudi / preestudio de la home (src/components/home/PreStudy.astro).
//
// REGLA: aquí NO se calcula ningún ahorro. Lo único que calcula el asistente es el
// gasto anual aproximado (importe mensual × 12), rotulado como "càlcul simple".

/**
 * Interruptor de la estimación. Debe seguir en false hasta que Logik aporte una
 * fórmula validada y defendible. Con false no se renderiza nada relacionado con
 * una estimación (ni HTML ni textos) y el script no la calcula.
 */
export const ESTIMATE_ENABLED = false;

/** Datos del asistente que recibiría la fórmula. */
export interface EstimateInput {
  profile: 'empresa' | 'comunitat' | 'llar';
  supply: 'llum' | 'gas' | 'llum-gas';
  /** Importe mensual en euros, tal como lo escribe el visitante. */
  monthly: number;
  power: 'fins-15' | 'mes-15' | 'no-ho-se';
  solar: boolean;
}

/** Resultado: siempre un rango anual en euros, nunca una cifra única ni un porcentaje. */
export interface EstimateRange {
  min: number;
  max: number;
}

/**
 * PUNTO DE EXTENSIÓN. El día que Logik aporte una fórmula validada:
 *  1. Implementarla aquí (sin inventar porcentajes) y devolver { min, max } en €/año,
 *     o null cuando no haya datos suficientes.
 *  2. Poner ESTIMATE_ENABLED = true.
 *  3. Añadir en PreStudy.astro el bloque del resumen, que debe mostrar el rango con la
 *     etiqueta visible "estimació orientativa" / "estimación orientativa" y su fuente.
 *  4. Revisar los textos con Eliana antes de publicar (CLAUDE.md: nada de promesas).
 */
export function estimateRange(_input: EstimateInput): EstimateRange | null {
  return null;
}

/** Deslizador del importe mensual (€/mes). El campo numérico admite importes mayores. */
export const AMOUNT = { min: 0, max: 5000, step: 10, maxTyped: 1_000_000 } as const;

/** Franjas internas para que Logik priorice (no se muestran). */
export const AMOUNT_BANDS = [
  { value: '<150', below: 150 },
  { value: '150-500', below: 500 },
  { value: '500-2000', below: 2000.01 },
  { value: '>2000', below: Infinity },
] as const;

/** Tiempos de interacción (ms). */
export const AUTO_ADVANCE_MS = 250;
export const TRANSITION_MS = 200;
export const COUNTER_MS = 800;

/** Parámetros de campaña que se leen de la URL (sin cookies ni localStorage). */
export const TRACKING_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'gclid'] as const;
