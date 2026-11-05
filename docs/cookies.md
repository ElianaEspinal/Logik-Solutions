# Cookies y almacenamiento de la web — Logik Solutions

Base para redactar la política de cookies (catalán y castellano). Actualizar esta
lista cada vez que se añada una etiqueta en GTM o un contenido externo.

## Cómo funciona el consentimiento

- Banner propio (`src/components/CookieBanner.astro`), bilingüe, con `role="dialog"` y tres botones con las mismas clases: «Acceptar-ho tot» / «Rebutjar-ho tot» / «Configurar» («Aceptar todo» / «Rechazar todo» / «Configurar»).
- «Configurar»: técnicas siempre activas, sin interruptor; analítica y contenido externo (mapa) con interruptor, apagados por defecto. Categoría de publicidad preparada tras `ADS_CONSENT` en `src/config/legal.ts` (desactivada).
- Cerrar el banner (✕ o Escape) sin elegir equivale a no consentir: no se guarda ninguna elección, no se carga nada y el banner no vuelve a salir durante la visita (`logik_consent_closed` en sessionStorage). Seguir navegando o hacer scroll no cuenta.
- Hasta que el visitante acepta no se carga Google Tag Manager ni ningún script de analítica ni contenido externo. Sin la versión `<noscript>` de GTM. Google Consent Mode v2 con todo en «denied» por defecto (detalle en docs/tracking.md).
- La elección se guarda 12 meses; después se vuelve a pedir.
- Se puede cambiar en cualquier momento con «Configurar cookies», en el pie de todas las páginas y en la política de cookies. Si se retira el consentimiento de análisis, se borran las cookies `_ga*` y se recarga la página sin GTM.
- En el entorno de pruebas (`SITE_ENV=staging`) no se carga GTM aunque se acepte. Excepción a petición: `npm run build:staging:gtm` (`PUBLIC_GTM_TEST=true`) lo activa, siempre tras aceptar, para usar la vista previa de GTM.

## Listado

| Nombre | Tipo | Proveedor | Finalidad | Duración | Categoría |
| --- | --- | --- | --- | --- | --- |
| `logik_consent` | localStorage (no es cookie) | Logik Solutions (propia) | Guardar la elección sobre las cookies | 12 meses | Técnica, necesaria (no requiere consentimiento) |
| `logik_consent_closed` | sessionStorage (no es cookie) | Logik Solutions (propia) | Recordar que se cerró el banner sin elegir (no activa nada) | Hasta cerrar la pestaña | Técnica, necesaria |
| `_ga` | Cookie | Google (Google Analytics 4, vía GTM) | Distinguir usuarios de forma anónima para las estadísticas | 2 años | Análisis (requiere consentimiento) |
| `_ga_QCSEZ3YWK2` | Cookie | Google (Google Analytics 4, vía GTM) | Mantener el estado de la sesión en la propiedad G-QCSEZ3YWK2 | 2 años | Análisis (requiere consentimiento) |

Las duraciones de `_ga` y `_ga_<ID>` son las predeterminadas de GA4; si se cambian en la configuración de GTM/GA4, actualizar la tabla.
Fuente: Google, «Google Analytics cookie usage on websites»: https://developers.google.com/tag-platform/security/concepts/cookies

Google Tag Manager por sí mismo no instala cookies.

## Contenido externo

Mapas y vídeos se insertan con el componente `ConsentEmbed`, que solo los carga con el consentimiento de «Contingut extern / Contenido externo».

- **Mapa de Google Maps en el pie de todas las páginas y en Contacte** (iframe de google.com/maps). Solo se carga si el visitante acepta el contenido externo o pulsa «Carregar el contingut». Pendiente: listar aquí las cookies que instala Google Maps al cargarse (según la documentación de Google o la revisión manual de Eliana con el mapa cargado) y recogerlas en la política de cookies.

## Eventos que se envían a GA4 (solo con consentimiento)

| Evento | Cuándo | Parámetros |
| --- | --- | --- |
| `generate_lead` | Formulario enviado con éxito (se muestra el mensaje de éxito en la misma página) | `form_location` (cierre o calculadora); en el pre-estudi, además `form` (calculadora) y `perfil` (empresa, comunitat o llar) |
| `click_call` | Clic en un enlace `tel:` | `link_location` (mismos nombres de sección que `section`) |
| `click_whatsapp` | Clic en un enlace de WhatsApp | `link_location` |
| `cta_click` | Clic en un botón o enlace de llamada a la acción | `section` (en la home: hero, logos, tarjetas, calculadora, linea-tiempo, comparativa, cifras, gestions, autoconsum, testimonios, blog, faq, cierre; en todas: header, footer, barra-movil), `cta_text` |
| `hero_form_start` | **Ya no se lanza** (3 de noviembre de 2026): el hero no tiene formulario. Su botón principal («Revisa la meva factura →» / «Revisa mi factura →») lanza `cta_click` con `section: hero` y lleva al pre-estudi; el enlace de llamada lanza `click_call`. La etiqueta de GTM puede pausarse | — |
| `calc_start` | Primera interacción con el paso 1 del pre-estudi de la home (una vez por visita a la página) | `form_location` (calculadora) |
| `calc_step` | Paso del pre-estudi completado con datos válidos (cada paso se envía una sola vez por visita) | `step` (1 a 5; el 5 es el intento de envío con datos válidos), `form_location` (calculadora) |

En GTM hay que crear un activador de «Evento personalizado» por cada evento y una etiqueta de evento GA4 que lo envíe a G-QCSEZ3YWK2 con sus parámetros. Marcar `generate_lead` como evento clave en GA4.

Para el pre-estudi (detalle en docs/pre-estudi.md): crear los activadores `calc_start` y `calc_step`, sus etiquetas de evento GA4 con los parámetros `step` y `form_location`, y añadir `form` y `perfil` a la etiqueta de `generate_lead`. En GA4, registrar `step`, `form` y `perfil` como dimensiones personalizadas (ámbito de evento) para poder ver el embudo por paso y por perfil.
