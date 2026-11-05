/**
 * JSON-LD seguro para insertar en <script type="application/ld+json">: escapa "<", ">" y "&" como
 * \u003c, \u003e y \u0026. El JSON es equivalente (JSON.parse devuelve lo mismo), pero ningún texto
 * puede cerrar la etiqueta <script> ni abrir otra.
 */
export const safeJsonLd = (json: string) =>
  json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
