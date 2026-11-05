# Tracking: eventos del dataLayer (GTM → GA4)

Nov 3, 2026 · Uso interno

Todos los eventos se envían con `window.dataLayer.push({ event, ...parámetros })` **solo** si el visitante ha aceptado las cookies de análisis y GTM está cargado (en staging, solo con `PUBLIC_GTM_TEST=true`). Sin consentimiento no se guarda nada en cola. Nunca se envían datos personales (nombre, correo, teléfono ni texto del mensaje).

Código: `src/scripts/analytics.ts` (clics) y `src/scripts/contact-form.ts` (formulario de contacto).

## Consentimiento y Google Consent Mode v2 (5 de noviembre de 2026)

- En el `<head>` de todas las páginas, antes de cualquier otro script, va `gtag('consent', 'default', …)` con `analytics_storage`, `ad_storage`, `ad_user_data` y `ad_personalization` en `denied` (script con `data-consent-default` en `src/layouts/BaseLayout.astro`). No carga nada: solo prepara el `dataLayer`.
- GTM solo se inyecta si la persona acepta una categoría que lo necesita (analítica; publicidad cuando exista). Justo antes se envía `gtag('consent', 'update', …)` con `analytics_storage: granted` y lo publicitario en `denied` (lógica en `src/scripts/consent.ts`, `initGtm`).
- Rechazar, cerrar el banner sin elegir, seguir navegando o aceptar solo el contenido externo (mapa) no carga GTM ni envía ningún evento.
- Todos los eventos de esta lista pasan por `track()` / `trackThen()` de `src/scripts/analytics.ts`, que exige consentimiento de analítica y GTM cargado. No hay ningún `dataLayer.push` de eventos fuera de ese archivo.
- En GTM: con Consent Mode v2, revisar que la etiqueta de Google (G-QCSEZ3YWK2) y las de evento tengan la comprobación de consentimiento integrada (`analytics_storage`). Si se activa la publicidad, añadir `ad_storage`, `ad_user_data` y `ad_personalization`.

## Eventos ya configurados en GTM

| Evento | Cuándo | Parámetros |
| --- | --- | --- |
| `generate_lead` | Envío correcto de un formulario | `form` (`contacte`, `calculadora`), `form_location`; en contacto también `perfil` y `necessitat` |
| `click_call` | Clic en un enlace `tel:` | `link_location` (sección), `location` (el mismo valor) |
| `click_whatsapp` | Clic en un enlace de WhatsApp | `link_location`, `location` |
| `cta_click` | Clic en un botón o enlace de CTA | `section`, `cta_text` |
| `hero_form_start` | Sin uso desde el 3/11/2026 (el hero ya no tiene formulario) | `form_location` |

`calc_start` y `calc_step` (pre-estudi de la home) están descritos en `src/scripts/analytics.ts`.

## Eventos nuevos de la página de contacto (configurar en GTM)

Para cada uno: activador de evento personalizado con el nombre exacto, variables de capa de datos para los parámetros y etiqueta de evento de GA4.

| Evento | Cuándo | Parámetros |
| --- | --- | --- |
| `contact_form_start` | Primera interacción con el formulario de contacto (foco o toque), una vez por visita a la página | `form` = `contacte`, `form_location` = `contacte` |
| `contact_step` | Paso completado: `1` al pulsar "Continua" con el paso 1 correcto; `2` al pulsar "Envia la consulta" con el paso 2 correcto (antes de enviar). Una vez cada paso | `step` (1 o 2), `form`, `form_location` |
| `click_email` | Clic en un enlace `mailto:` (contacto y pie de todas las páginas) | `link_location`, `location` |
| `click_directions` | Clic en "Com arribar" / "Cómo llegar" (Google Maps) | `link_location`, `location` |

### Valores en la página de contacto

- `location` / `link_location`: `contacte` en todo el contenido de la página; `footer` y `header` en el pie y la cabecera.
- `cta_click` con `section` = `contacte_hero`: botones rápidos "Truca" y "WhatsApp" de móvil, arriba de la página. Estos botones lanzan además `click_call` o `click_whatsapp` con `location` = `contacte`.
- `generate_lead`: `form` = `contacte`, `form_location` = `contacte`, `perfil` (`empresa`, `comunitat`, `administrador`, `llar`) y `necessitat` (`factura`, `gestions`, `plaques`, `altra`).

### Por qué dos parámetros de ubicación

`link_location` es el parámetro que ya usan las etiquetas de `click_call` y `click_whatsapp` en GTM. Se añadió `location` con el mismo valor, tal como se pidió para la página de contacto, sin romper lo configurado. Basta con usar uno de los dos en GA4.

## Blog (configurar en GTM)

| Evento | Cuándo | Parámetros |
| --- | --- | --- |
| `blog_card_click` (nuevo) | Clic en una tarjeta de artículo del índice del blog o de "Segueix llegint" / "Sigue leyendo" | `slug` (slug del artículo), `position` (1, 2, 3… en la lista), `lang` (`ca` o `es`) |
| `cta_click` | Botón "Revisa la meva factura" del cierre del índice y del final de cada artículo, y enlace del CTA a mitad de artículo (solo en artículos de más de 1.200 palabras) | `section` = `blog_index` o `blog_post`, `cta_text` |
| `click_call` | Enlace "Truca al 665 05 25 16" de esos bloques | `location` = `blog` (y `link_location` = `blog`) |

El código está en `src/scripts/blog.ts` (`blog_card_click`) y en `src/scripts/analytics.ts` (`cta_click` y `click_call`, a partir de `data-cta` y `data-section="blog"`).

### CTA de cierre propio de un artículo (sin eventos nuevos)

Un artículo puede llevar su propio bloque de cierre (frontmatter `cta`, ver `docs/blog-guia.md`). Usa el mismo `cta_click` con su propio `section`:

| Artículo | Botón | Parámetros |
| --- | --- | --- |
| "Quina potència de llum contractar" / "Qué potencia de luz contratar" (borrador) | "Comença el pre-estudi →" / "Empieza el pre-estudio →" (lleva al pre-estudi de la home) | `cta_click` con `section` = `blog_potencia_cierre`; el enlace de teléfono del mismo bloque lanza `click_call` con `location` = `blog` |
| "Autoconsum col·lectiu en una comunitat de veïns" / "Autoconsumo colectivo en una comunidad de vecinos" (borrador) | Pre-estudi embebido "Vols valorar-ho amb la teva comunitat?" / "¿Quieres valorarlo con tu comunidad?" y, debajo, el teléfono 665 05 25 16 | El enlace de teléfono lanza `cta_click` con `section` = `blog_colectivo_cierre` y `click_call` con `location` = `blog`; el pre-estudi lanza `calc_start`, `calc_step` y `generate_lead` (`form` = `calculadora`) y el envío lleva `pagina_origen` = `blog_colectivo` |
| "Com canviar el titular de la llum" / "Cómo cambiar el titular de la luz" (borrador) | Pre-estudi embebido "Vols que ens n'ocupem nosaltres?" / "¿Quieres que nos ocupemos nosotros?" y, debajo, "Prefereixes trucar? 665 05 25 16" / "¿Prefieres llamar? 665 05 25 16" | El enlace de teléfono lanza `cta_click` con `section` = `blog_titular_cierre` y `click_call` con `location` = `blog`; el pre-estudi lanza `calc_start`, `calc_step` y `generate_lead` (`form` = `calculadora`) y el envío lleva `pagina_origen` = `blog_titular` |

No hace falta configurar nada nuevo en GTM: `cta_click` ya existe. En GA4 se distingue por el valor de `section`.

## Nosaltres / Nosotros (sin eventos nuevos)

| Evento | Cuándo | Parámetros |
| --- | --- | --- |
| `cta_click` | Botón "Parla amb nosaltres" del hero (lleva a contacto) | `section` = `nosaltres_hero` |
| `cta_click` | Botón "Revisa la meva factura" del cierre | `section` = `nosaltres_cta` |
| `click_call` | Cualquier enlace "Truca al 665 05 25 16" de la página (hero, Lluís Soldevila y cierre) | `location` = `nosaltres` (y `link_location` = `nosaltres`) |

## Com treballem / Cómo trabajamos (sin eventos nuevos)

| Evento | Cuándo | Parámetros |
| --- | --- | --- |
| `cta_click` | Botón "Revisa la meva factura →" / "Revisa mi factura →" del hero (lleva al pre-estudi de la home) | `section` = `com_treballem_hero` |
| `cta_click` | Botón "Començar el pre-estudi →" / "Empezar el pre-estudio →" de la tarjeta "Per començar" | `section` = `com_treballem_inici` |
| `cta_click` | Botón "Revisa la meva factura →" / "Revisa mi factura →" del cierre | `section` = `com_treballem_cierre` |
| `click_call` | Enlaces "Truca al 665 05 25 16" / "Llama al 665 05 25 16" (hero y cierre) | `location` = `com_treballem` (y `link_location` = `com_treballem`) |

## Empreses i pimes / Empresas y pymes (un evento nuevo: `sector_select`)

| Evento | Cuándo | Parámetros |
| --- | --- | --- |
| `sector_select` | **Nuevo.** Clic en un chip de tipo de negocio ("Hostaleria i restauració", "Comerç", "Tallers", "Clíniques", "Altres negocis"). Lleva al pre-estudi y, si hay coincidencia, preselecciona la actividad | `sector` = `hostaleria` · `comerc` · `tallers` · `cliniques` · `altres`; `location` = `empreses` |
| `cta_click` | Botón "Revisa la factura del meu negoci →" del hero | `section` = `empreses_hero` |
| `cta_click` | Botón del bloque "Et reconeixes…?" | `section` = `empreses_reconeix` |
| `cta_click` | Botón "Veure com treballem →" | `section` = `empreses_com_treballem` |
| `cta_click` + `click_call` | Enlace "Prefereixes trucar? 665 05 25 16" bajo el pre-estudi | `section` = `empreses_cierre`; `location` = `empreses` |
| `click_call` | Cualquier otro enlace de teléfono de la página | `location` = `empreses` (y `link_location`) |
| `blog_card_click` | Tarjeta de "Per aprofundir" (solo si hay artículos publicados) | `slug`, `position`, `lang`, `location` = `empreses` |
| `calc_start`, `calc_step`, `generate_lead` | Pre-estudi de la página (perfil "empresa" ya resuelto: arranca en el paso 2, así que el primer `calc_step` es el 2) | Los de siempre (`form` = `calculadora`); el envío lleva además `pagina_origen` = `empreses` |

**En GTM:** crear el activador de evento personalizado `sector_select` y su etiqueta GA4 con el parámetro `sector` (y `location`); registrar `sector` como dimensión personalizada de evento en GA4.

## Comunitats de veïns / Comunidades de vecinos (un evento nuevo: `persona_select`)

| Evento | Cuándo | Parámetros |
| --- | --- | --- |
| `persona_select` | **Nuevo.** Clic en uno de los dos chips de "Pensat per a comunitats i administradors de finques". "Soc administrador de finques" lleva al bloque "Ets administrador de finques?"; "Soc president o veí", al pre-estudi | `persona` = `administrador` o `president_vei`; `location` = `comunitats` |
| `cta_click` | Botón "Revisa la factura de la meva comunitat →" del hero | `section` = `comunitats_hero` |
| `cta_click` | Botón del bloque "Et reconeixes…?" (aparece al marcar una casilla) | `section` = `comunitats_reconeix` |
| `cta_click` | Botón "Parla amb nosaltres →" del bloque para administradores (lleva a `/contacte/?perfil=administrador`, con el perfil ya elegido) | `section` = `comunitats_admin` |
| `cta_click` + `click_call` | Enlace "Prefereixes trucar? 665 05 25 16" bajo el pre-estudi | `section` = `comunitats_cierre`; `location` = `comunitats` |
| `click_call` | Cualquier otro enlace de teléfono de la página (hero y bloque de administradores) | `location` = `comunitats` (y `link_location`) |
| `blog_card_click` | Tarjeta de "Per aprofundir" (solo si hay artículos publicados de las categorías Comunitats o Factura i potència) | `slug`, `position`, `lang`, `location` = `comunitats` |
| `calc_start`, `calc_step`, `generate_lead` | Pre-estudi de la página (perfil "comunitat" ya resuelto: arranca en el paso 2) | Los de siempre (`form` = `calculadora`, `perfil` = `comunitat`); el envío lleva además `pagina_origen` = `comunitats` |

Si el administrador envía después el formulario de contacto, `generate_lead` llega con `form` = `contacte` y `perfil` = `administrador`.

**En GTM:** crear el activador de evento personalizado `persona_select` y su etiqueta GA4 con los parámetros `persona` y `location`; registrar `persona` como dimensión personalizada de evento en GA4.

## Llars / Hogares (dos eventos nuevos: `factura_hotspot_click` y `preocupacio_select`)

| Evento | Cuándo | Parámetros |
| --- | --- | --- |
| `factura_hotspot_click` | **Nuevo.** Clic (o flechas del teclado) en uno de los tres puntos de la factura interactiva de "Entendre la factura de la llum" | `bloc` = `potencia` · `energia` · `impostos`; `location` = `llars` |
| `preocupacio_select` | **Nuevo.** Elegir una frase del bloque "Què et preocupa…?" (no se envía con la primera, que sale preseleccionada) | `opcio` = `1` a `5` (1 no entenc la factura · 2 tarifa i horaris · 3 titularitat o potència · 4 plaques solars · 5 que algú se n'ocupi); `location` = `llars` |
| `cta_click` | Botón "Revisa la meva factura →" del hero | `section` = `llars_hero` |
| `cta_click` | Botón "Revisa la meva factura →" bajo la factura interactiva | `section` = `llars_factura` |
| `cta_click` | Botón o enlace de cada respuesta de "Què et preocupa…?" | `section` = `llars_preocupacio` |
| `cta_click` + `click_call` | Enlace "Prefereixes trucar? 665 05 25 16" bajo el pre-estudi | `section` = `llars_cierre`; `location` = `llars` |
| `click_call` | Enlace "Truca al 665 05 25 16" del hero | `location` = `llars` (y `link_location`) |
| `blog_card_click` | Tarjeta de "Per aprofundir" (solo si hay artículos publicados de Factura i potència, Gestions o Autoconsum) | `slug`, `position`, `lang`, `location` = `llars` |
| `calc_start`, `calc_step`, `generate_lead` | Pre-estudi de la página (perfil "llar" ya resuelto: arranca en el paso 2) | Los de siempre (`form` = `calculadora`, `perfil` = `llar`); el envío lleva además `pagina_origen` = `llars` |

**En GTM:** crear los activadores de evento personalizado `factura_hotspot_click` y `preocupacio_select` y sus etiquetas GA4 con los parámetros `bloc` y `opcio` (y `location`); registrar `bloc` y `opcio` como dimensiones personalizadas de evento en GA4.

## Autoconsum fotovoltaic / Autoconsumo fotovoltaico (un evento nuevo: `consum_select`; nuevos valores de `persona_select`)

| Evento | Cuándo | Parámetros |
| --- | --- | --- |
| `consum_select` | **Nuevo.** Elegir una opción de "Quan consumeixes, importa" (no se envía con la primera, que sale preseleccionada) | `opcio` = `1` a `4` (1 sobretot de dia · 2 sobretot al vespre · 3 una mica de cada · 4 no ho sé); `location` = `autoconsum` |
| `persona_select` | El mismo evento de Comunitats, con **valores nuevos**: botón "Començar el pre-estudi" de las tarjetas de "Per a qui" (lleva al pre-estudi con el perfil marcado) | `persona` = `llar` · `comunitat` · `pime`; `location` = `autoconsum` |
| `cta_click` | Botón "Estudia el meu consum →" del hero | `section` = `autoconsum_hero` |
| `cta_click` | Botón "Estudia el meu consum →" de "Quan consumeixes, importa" | `section` = `autoconsum_consum` |
| `cta_click` + `click_call` | Enlace "Prefereixes trucar? 665 05 25 16" bajo el pre-estudi | `section` = `autoconsum_cierre`; `location` = `autoconsum` |
| `click_call` | Enlace "Truca al 665 05 25 16" del hero | `location` = `autoconsum` (y `link_location`) |
| `blog_card_click` | Tarjeta de "Per aprofundir" (solo si hay artículos publicados de Autoconsum o Factura i potència) | `slug`, `position`, `lang`, `location` = `autoconsum` |
| `calc_start`, `calc_step`, `generate_lead` | Pre-estudi solar de la página (casilla de plaques solars ya marcada; el perfil se elige en el paso 1) | Los de siempre (`form` = `calculadora`); el envío lleva además `pagina_origen` = `autoconsum` e `interes_solar` |

**En GTM:** crear el activador de evento personalizado `consum_select` y su etiqueta GA4 con los parámetros `opcio` y `location`. `persona_select` ya existe: solo hay que tener en cuenta los valores nuevos en los informes.

## Gestió i tràmits / Gestión y trámites (un evento nuevo: `tramit_select`)

| Evento | Cuándo | Parámetros |
| --- | --- | --- |
| `tramit_select` | **Nuevo.** Elegir una pestaña de "Què gestionem per tu" (clic o flechas del teclado). No se envía con la primera, que sale seleccionada | `tramit` = `titularitat` · `potencia` · `alta` · `incidencies`; `location` = `gestions` |
| `cta_click` | Botón "Comença el pre-estudi →" del hero | `section` = `gestions_hero` |
| `cta_click` | Botón "Vull-ho inclòs →" de cada pestaña (lleva al pre-estudi) | `section` = `gestions_tramit` |
| `cta_click` + `click_call` | Enlace "Prefereixes trucar? 665 05 25 16" bajo el pre-estudi | `section` = `gestions_cierre`; `location` = `gestions` |
| `click_call` | Enlace "Truca al 665 05 25 16" del hero | `location` = `gestions` (y `link_location`) |
| `blog_card_click` | Tarjeta de "Per aprofundir" (solo si hay artículos publicados de Gestions o Factura i potència) | `slug`, `position`, `lang`, `location` = `gestions` |
| `calc_start`, `calc_step`, `generate_lead` | Pre-estudi de la página (perfil elegible: arranca en el paso 1) | Los de siempre (`form` = `calculadora`); el envío lleva además `pagina_origen` = `gestions` y, si el visitante eligió una pestaña o pulsó su botón, el campo `tramit_interes` (mismos valores que `tramit`). `tramit_interes` llega solo al destino del formulario, no a GA4 |

**En GTM:** crear el activador de evento personalizado `tramit_select` y su etiqueta GA4 con los parámetros `tramit` y `location`; registrar `tramit` como dimensión personalizada de evento en GA4.

## Pendiente en GTM y GA4

- Crear activadores y etiquetas para `contact_form_start`, `contact_step`, `click_email`, `click_directions` y `blog_card_click`.
- Registrar como dimensiones personalizadas (ámbito de evento) los parámetros que se quieran ver en informes: `form`, `step`, `perfil`, `necessitat`, `location`, `slug`, `position`, `lang`.
- Marcar `generate_lead` como evento clave en GA4 (ya estaba pendiente).
- Probar con la vista previa de GTM en staging (`npm run build:staging:gtm`).
