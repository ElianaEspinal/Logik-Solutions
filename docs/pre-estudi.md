# Pre-estudi / preestudio de la home

Nov 3, 2026 · Claude Code para @Eliana

Asistente por pasos que sustituye a la antigua mini calculadora. Es la principal herramienta de captación de la home. Va entre las tarjetas por perfil y «El teu any amb nosaltres», en `/#pre-estudi` (catalán) y `/es/#preestudio` (castellano).

## Archivos

| Archivo | Qué contiene |
| --- | --- |
| `src/components/home/pre-study.astro` | Marcado y estilos de la sección |
| `src/scripts/pre-study.ts` | Comportamiento del asistente (pasos, validación, envío y eventos) |
| `src/lib/pre-study.ts` | Lógica pura: lectura del importe, gasto anual, franjas, lista «Què revisarem» |
| `src/config/calculator.ts` | `ESTIMATE_ENABLED = false`, punto de extensión de la estimación, límites del deslizador y tiempos |
| `src/components/file-drop.astro` y `src/scripts/file-drop.ts` | Zona de adjuntar factura, la misma que en el formulario de cierre |
| `src/pages/index.astro` y `src/pages/es/index.astro` | Textos de cada idioma (`preStudy`). Los marcados `[Claude]` están pendientes de revisión |

## Reglas

- No se calcula ni se muestra ningún ahorro. Lo único que se calcula es el gasto anual aproximado: importe mensual × 12, rotulado como «càlcul simple».
- `ESTIMATE_ENABLED` se queda en `false` hasta que Logik aporte una fórmula validada. El procedimiento para activarla está en el comentario de `estimateRange()` (siempre como rango y con la etiqueta «estimació orientativa»).
- Hasta el último paso no se envía nada. El progreso vive solo en memoria: sin cookies ni localStorage.

## Datos que se envían (para la política de privacidad)

Se envían a `PUBLIC_FORM_ENDPOINT`, el mismo destino que el formulario de cierre. Si hay factura, el envío va en multipart; si no, como formulario normal.

| Campo | Contenido |
| --- | --- |
| `origen` | `calculadora` |
| `idioma` | `ca` o `es` |
| `perfil`, `subministrament`, `activitat`, `potencia` | Las respuestas, con el texto visible en el idioma del visitante (`activitat` va vacía si no se indica) |
| `import_mensual` | Importe mensual en euros, con punto decimal (por ejemplo `95.5`) |
| `interes_solar` | «Sí, m'interessa» / «Sí, me interesa» o «No» |
| `nom`, `cognoms`, `email`, `telefon` | Datos de contacto |
| `consentiment` | `acceptat` |
| `factura` | Solo con `PUBLIC_FORM_ATTACHMENTS=true` y si el visitante la adjunta (PDF o imagen, máx. 10 MB) |
| `franja_import` | **Interno, no visible.** `<150`, `150-500`, `500-2000` o `>2000` (€/mes), para que Logik priorice |
| `utm_source`, `utm_medium`, `utm_campaign`, `gclid` | **Internos, no visibles.** Se leen de la URL de la página en el momento del envío (vacíos si no hay). No se guardan en cookies ni en localStorage |
| `_subject`, `_gotcha` | Asunto del correo y campo antispam (vacío) |

**Pendiente para la política de privacidad:** mencionar que el pre-estudi recoge el importe aproximado de la factura, el perfil y el suministro, la franja de importe calculada y los parámetros de campaña de la URL (`utm_*` y `gclid`), y para qué se usan (preparar el estudio, priorizar las solicitudes y medir las campañas).

## Eventos (dataLayer, solo tras el consentimiento de análisis)

| Evento | Cuándo | Parámetros |
| --- | --- | --- |
| `calc_start` | Primera interacción con el paso 1 (toque, tecla o selección), una vez por visita a la página | `form_location: calculadora` |
| `calc_step` | Al completar un paso con datos válidos. Cada paso se envía una sola vez por visita, aunque el visitante vuelva atrás. El 5 es el intento de envío con datos válidos | `step` (1 a 5), `form_location: calculadora` |
| `generate_lead` | Solo cuando el envío es correcto | `form: calculadora`, `form_location: calculadora`, `perfil` (`empresa`, `comunitat` o `llar`) |
| `click_whatsapp` / `click_call` | Clic en WhatsApp o en el teléfono de la pantalla de éxito (los lanza el listener global) | `link_location: calculadora` |

**En GTM:** dos activadores de «Evento personalizado» (`calc_start`, `calc_step`) con su etiqueta de evento GA4, la variable de capa de datos `step` y, en la etiqueta de `generate_lead`, los parámetros `form` y `perfil`. En GA4, registrar `step`, `form` y `perfil` como dimensiones personalizadas de evento. El embudo de abandono por paso sale de `calc_start` → `calc_step` (1…5) → `generate_lead`.

## Mensajes de validación

| Campo | Català | Castellano |
| --- | --- | --- |
| Perfil | Tria per a qui és el pre-estudi. | Elige para quién es el preestudio. |
| Suministro | Tria què vols revisar. | Elige qué quieres revisar. |
| Importe vacío | Escriu un import aproximat. | Escribe un importe aproximado. |
| Importe no válido o 0 | Escriu un import més gran que 0, només amb xifres. | Escribe un importe mayor que 0, solo con cifras. |
| Importe mayor de 1.000.000 € | Revisa l'import: sembla massa alt. | Revisa el importe: parece demasiado alto. |
| Nombre | Escriu el teu nom. | Escribe tu nombre. |
| Apellidos | Escriu els teus cognoms. | Escribe tus apellidos. |
| Correo vacío | Escriu el teu correu electrònic. | Escribe tu correo electrónico. |
| Correo no válido | Revisa el correu: sembla que no és correcte. | Revisa el correo: parece que no es correcto. |
| Teléfono | Escriu un telèfon de 9 xifres com a mínim. | Escribe un teléfono de al menos 9 cifras. |
| Consentimiento | Has d'acceptar la política de privacitat per continuar. | Tienes que aceptar la política de privacidad para continuar. |
| Factura | El fitxer ha de ser PDF, JPG o PNG i ocupar 10 MB com a màxim. | El archivo debe ser PDF, JPG o PNG y ocupar 10 MB como máximo. |
