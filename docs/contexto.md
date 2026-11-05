# Contexto del proyecto — Logik Solutions

Oct 15, 2026 · @Eliana · Uso interno

## Resumen y objetivo

Rehacer desde cero la web de Logik Solutions: hoy es una landing en WordPress y pasará a ser una web en código propio (HTML, CSS y JS), bilingüe con catalán por defecto y castellano como segundo idioma. La web actual se desactivará y la nueva ocupará su lugar en el hosting que se confirme (Hostinger o cdmon).

El objetivo de negocio es captar clientes por el canal digital: primero de forma orgánica (SEO, SEO local y visibilidad en asistentes de IA) y, cuando el proyecto esté terminado, también con publicidad. La acción que debe hacer el visitante es enviar el formulario o llamar.

## El cliente y sus servicios

Logik Solutions (LOGIK SOLUTIONS, S.L.) es una consultoría energética con base en Girona. Datos de contacto: 665 05 25 16 (un único número, para llamar y para WhatsApp; el 872 22 00 43 de la web antigua ya no se usa) e info@logiksolutions.es.

**Datos fiscales:** LOGIK SOLUTIONS, S.L., NIF B02961043, Carrer Creu, 43, 3r 1a, Girona. Código postal: 17002 (confirmado por Eliana el 3/11/2026; antes figuraba 17000 por error). Planta y puerta confirmadas: 3r 1a.

Servicios:

- **Consultoría y asesoramiento energético personalizado:** compara ofertas de muchas comercializadoras para buscar el mejor precio para cada cliente.
- **Gestiones:** cambios de titularidad, subidas y bajadas de potencia y altas nuevas, con trato directo con los administradores de cada compañía para que sean más rápidas.
- **Seguimiento:** contratación anual con seguimiento mensual y anual. La fecha de renovación se agenda en el mes 11. Si hay una incidencia, la resuelven ellos como parte del servicio.
- **Fotovoltaica:** instalaciones para pymes y hogares, con ingenieros y especialistas en instalación.

## Público, zona y diferenciadores

**Cliente ideal, por orden de prioridad:** empresas (grandes y pequeñas), comunidades y, por último, hogares.

**Zona:** capta sobre todo clientes locales de Girona y toda Cataluña, pero también trabaja a nivel de toda España.

**Diferenciadores que cuenta el cliente:**

- Servicio presencial, con visitas en localidades cercanas a Girona.
- Cartera de más de 2.000 clientes y más de 10 años de experiencia en el sector.
- Trato cercano y precios honestos.
- No cobra al cliente por sus servicios: paga la compañía comercializadora.
- Incidencias, renovaciones y seguimiento incluidos en la contratación anual.
- Trato directo con los administradores de cada compañía.
- Empresas importantes con las que trabaja: se mostrarán en la home.

Confirmado por Eliana: la cifra de más de 2.000 clientes, los más de 10 años de experiencia, el permiso para mostrar los logos de las empresas y el modelo de cobro (el servicio no tiene coste para el cliente porque paga la comercializadora, igual que en Optienergy).

## Marca y dirección de diseño

Se conservan los colores del logo de Logik Solutions: un verde azulado muy oscuro y un naranja intenso. La paleta de la web se construye a partir de ellos, para que todo concuerde y haya armonía visual.

| Tono | Código | Uso |
| --- | --- | --- |
| Teal profundo (logo) | `#01323A` | Texto, cabecera, bandas oscuras, botón secundario |
| Naranja Logik (logo) | `#FD6200` | Botón principal, acentos, cifras grandes, iconos |
| Naranja oscuro | `#C24B00` | Enlaces y texto naranja sobre fondo claro |
| Teal medio | `#0B4A54` | Hover de botones, degradados, fondos oscuros secundarios |
| Teal suave | `#E4EEEF` | Fondos de sección alternos y bordes |
| Naranja suave | `#FFEDE0` | Etiquetas y avisos (sustituye al amarillo) |
| Crema | `#FBF7F0` | Fondo general |
| Blanco | `#FFFFFF` | Tarjetas y formularios |
| Texto secundario | `#4A666C` | Subtítulos y textos de apoyo |

**Reglas de contraste** (WCAG, medidas con la fórmula oficial de luminancia):

- El naranja `#FD6200` sobre crema o blanco solo llega a 2,8:1 y 3:1: no se usa para texto sobre fondo claro. Para texto naranja se usa `#C24B00` (4,57:1 sobre crema).
- El texto del botón naranja va en teal `#01323A` (4,56:1), no en blanco (3:1).
- El naranja sobre teal profundo da 4,56:1: sirve para cifras grandes y títulos sobre bandas oscuras.
- El amarillo del borrador no pertenece a la paleta del logo y se elimina.

**Logo y favicons:** ya existen (símbolo L con rayo, logotipo "Logik Solutions" y favicons en varios tamaños) y están en la carpeta de imágenes del proyecto. Claude Code no debe crearlos, convertirlos ni sustituirlos: se usan tal cual y se enlazan desde el layout. Si falta algún formato, se avisa en vez de generarlo.

**Tipografía (elegida):** Sora para títulos y DM Sans para el texto. Alojadas en la propia web, en formato WOFF2 con el subconjunto latino que incluye los acentos del catalán, con `font-display: swap` y solo los pesos necesarios, para cuidar la velocidad en móvil.

Lo demás se renueva: layout y estilo general.

Estilo buscado: dinámico, futurista y moderno, con un enfoque algo comercial sin ser agresivo, intuitivo, y lejos de la típica consultoría sosa, estática y con párrafos largos.

Webs de referencia del cliente para layout y diseño:

- [Linkener](https://linkener.com/): la estructura que más le gusta a Eliana; moderna y con mucho contenido de conversión.
- [Wasabi Energía](https://wasabienergia.es/): calculadora, pasos claros y tono directo.
- [Trébol Energía](https://trebolenergia.es/): segmentación por perfil.
- [MIAF](https://www.miaf.es/): formulario con factura y prueba social.
- [Green Consultoría](https://greenconsultoria.com/)
- [Barney & Co](https://www.barneyandco.es/)

## Alcance contratado y especificaciones técnicas

Todo el trabajo debe cubrir lo incluido en el presupuesto aceptado. La entrega inicial son 10 páginas por idioma (20 en total), con 2 revisiones gratuitas después de crear el proyecto completo.

**Incluido en el proyecto:**

- Identidad visual: nuevo logo, tipografía, paleta y guía básica de marca.
- Diseño UX/UI de escritorio y móvil.
- Código propio, responsive, con sistema bilingüe (catalán/castellano) y etiquetas hreflang.
- Contenido SEO potente: estudio de palabras clave, textos, titles y meta descripciones.
- Optimización técnica: imágenes comprimidas (WebP), velocidad, datos estructurados, sitemap, robots.txt y archivo llms.txt.
- SEO local y visibilidad en asistentes de IA (LLMs).
- Tracking: Google Analytics 4 (G-QCSEZ3YWK2), Google Tag Manager (GTM-5LSF5885), Search Console y banner de cookies. GA4 se configura dentro de GTM, no con gtag directo. GTM solo se carga tras aceptar las cookies de análisis (banner con Aceptar, Rechazar y Configurar del mismo peso) y no se carga en el entorno de pruebas salvo con PUBLIC\_GTM\_TEST=true. Eventos por dataLayer: generate\_lead, click\_call, click\_whatsapp, cta\_click (con el parámetro section) y hero\_form\_start. Al empezar con publicidad habrá que pasar a Consent Mode v2.
- Blog preparado para publicar artículos.

**Mantenimiento mensual:**

- Gestión anual de los dominios.
- Seguimiento mensual del tracking.
- Revisión mensual de Search Console: páginas rotas o sin indexar.
- 2 artículos al mes para el blog, con optimización SEO.

**Especificaciones técnicas:**

- Programación en HTML, CSS y JavaScript, más las librerías o frameworks que Claude Code necesite para el mejor rendimiento posible.
- Formulario de contacto (plataforma de recepción por decidir; el destino se lee de la variable PUBLIC\_FORM\_ENDPOINT), teléfono y WhatsApp con el mismo número (665 05 25 16), definido en una sola constante (src/config/site.ts).
- Hosting y dominio por confirmar (se habló de Hostinger y de cdmon); se decide cuando la web esté lista.
- Catalán como idioma por defecto, castellano como secundario. Arquitectura elegida: framework estático Astro con enrutado por idioma (catalán en la raíz, castellano en /es/). La salida es HTML estático que se sube al hosting (el contenido de la carpeta dist, a la raíz del servidor).

## Reglas de trabajo

**No canibalizar con Optienergy.** Optienergy es otra marca de Eliana, con materiales en catalán. Según su web, además de grandes clientes industriales atiende pymes, comunidades y autoconsumo, así que hay solape de temas. Reparto acordado el 2 de noviembre de 2026, por público y zona.

- Se pueden usar las conversaciones de Optienergy para aprender sobre el sector, nunca para copiar textos, estructuras ni enfoques.
- Antes de proponer una página o un artículo, comprobar que no repite el tema, el enfoque ni las palabras clave de Optienergy (el estudio de palabras clave recoge qué posiciona hoy optienergy.es).
- Logik Solutions habla a empresas (las pymes son la prioridad), comunidades y hogares de Girona y Cataluña, con trato cercano y presencial. Voz, diseño y ejemplos propios.
- Optienergy se queda con la auditoría energética, las tarifas 3.0TD y los comparadores de luz y gas para empresas. Logik mantiene "comparar tarifas luz" para hogares.
- Eliana mantiene "Girona" en el inicio de Optienergy. Por tanto las dos webs pueden competir por las búsquedas de Girona (Semrush (datos de finales de septiembre de 2026) situaba a Optienergy en la posición 21 en "asesoria energetica girona"). Se vigila en Search Console y Semrush, y Logik refuerza lo local: ficha de Google Business Profile, páginas de zona y visitas presenciales.
- Puede haber temas parecidos, porque el sector es el mismo, pero el proyecto debe ser original.

**Afirmaciones.** Texto preciso y defendible, sin promesas que no se puedan demostrar (por ejemplo, "el mejor precio garantizado"). Las cifras de ahorro son siempre estimaciones orientativas.

**Normativa.** Aviso legal, política de privacidad y política de cookies, con consentimiento antes de activar el tracking. Si se pide una factura, tener en cuenta que contiene datos personales.

**Idiomas.** Escribir cada página en catalán y en castellano de forma natural, no como traducción literal.

## Propuesta de las 10 páginas por idioma

La estructura se organiza por tipo de cliente y por servicio, para que cada página pueda posicionar una búsqueda distinta y el visitante llegue rápido a lo suyo. Los nombres y las palabras clave son una propuesta: hay que validarlos con el estudio de palabras clave en catalán y castellano.

| Nº | Página (catalán) | Castellano | Función |
| --- | --- | --- | --- |
| 1 | Inici | Inicio | Presenta la marca, muestra cifras y logos de empresas, y lleva a formulario o llamada |
| 2 | Empreses i pimes | Empresas y pymes | Consultoría energética para negocios; es el cliente prioritario |
| 3 | Comunitats de veïns | Comunidades de vecinos | Ahorro y gestión para comunidades y administradores de fincas |
| 4 | Llars | Hogares | Luz y gas para particulares, en lenguaje claro |
| 5 | Autoconsum fotovoltaic | Autoconsumo fotovoltaico | Instalaciones para pymes y hogares, con ingenieros y especialistas |
| 6 | Gestió i tràmits | Gestiones y trámites | Cambios de titularidad, potencia y altas nuevas |
| 7 | Com treballem | Cómo trabajamos | El año con Logik: alta, seguimiento mensual y renovación en el mes 11 |
| 8 | Nosaltres | Nosotros | Trato presencial, experiencia, equipo y empresas con las que trabaja |
| 9 | Blog | Blog | Índice de artículos; 2 nuevos al mes con el mantenimiento |
| 10 | Contacte | Contacto | Formulario, teléfono, WhatsApp y mapa de Girona |

Las páginas legales (aviso legal, privacidad y cookies) son obligatorias, no entran en estas 10 y están incluidas en el precio. Para redactarlas hacen falta los datos fiscales de Logik (razón social, NIF, domicilio y datos de contacto).

## Estructura de la home (opción A, elegida)

Flujo de conversión completo, inspirado en Linkener y tomando ideas de Wasabi, Trébol y MIAF. Un solo objetivo: formulario o llamada.

1. **Cabecera fija** con navbar grande y paneles desplegables (Per a qui: Empreses i pimes, Comunitats de veïns, Llars; Serveis: Autoconsum fotovoltaic, Gestió i tràmits; enlaces directos a Com treballem, Nosaltres, Blog y Contacte), teléfono, selector de idioma y botón "Demana el teu estudi".
2. **Hero:** promesa clara con la palabra clave principal y Girona, un botón al formulario y otro de llamar o WhatsApp.
3. **Franja de logos de clientes** (carrusel), justo debajo del hero.
4. **Cuatro tarjetas por perfil:** Empresas y pymes, Comunidades, Hogares y Fotovoltaica.
5. **Pre-estudio por pasos (calculadora profesional) que termina pidiendo nombre, apellidos, correo y teléfono sin salir de la sección. No muestra ahorros: solo el gasto anual aproximado (importe mensual × 12)**.
6. **Cómo trabajamos:** línea del tiempo animada (alta, seguimiento mensual, renovación en el mes 11).
7. **Tabla "Por tu cuenta / Con Logik"**, sin nombrar competidores.
8. **Contadores animados** (clientes y años de experiencia), solo con cifras confirmadas.
9. **Gestiones** y esquema animado del autoconsumo.
10. **Testimonios o casos reales** de pymes de la zona.
11. **Tres artículos del blog.**
12. **FAQ** de 6 a 8 preguntas, con datos estructurados.
13. **Cierre con formulario corto:** nombre, teléfono, email, factura opcional y consentimiento.
14. **Pie:** dirección, mapa de Girona y páginas legales. En móvil, barra fija de llamar y WhatsApp.

**Reglas para esta home**

- No usar urgencia artificial (avisos con fecha límite) ni ventanas al salir de la página.
- **Sin coste para el cliente:** se puede decir "sense cost per a tu" porque paga la comercializadora. Siempre con el motivo visible ("ens remunera la comercialitzadora") y con una pregunta en la FAQ, "Com cobreu?". Solo para consultoría y gestiones: las instalaciones fotovoltaicas sí tienen coste, así que ahí no se usa "gratuito".
- Ninguna cifra de ahorro sin la etiqueta "estimación orientativa". Ningún "ROI en X meses" ni "sin inversión".
- Los logos de clientes solo con permiso y con los archivos originales, mostrados en un solo tono para que no desordenen el diseño.
- Los efectos y animaciones concretos que gusten de Linkener se definen cuando Eliana los indique.

## Ideas y funcionalidades propuestas

Ideas para que la web sea dinámica y se distinga de una consultoría convencional. Hay que validarlas con el cliente y con el presupuesto.

- **Pre-estudio por pasos (sustituye a la mini calculadora): el visitante responde unas preguntas sobre su suministro y deja sus datos de contacto** para recibir el estudio. Por ahora no muestra ahorros calculados, porque no se puede defender un porcentaje inventado. El cálculo, si se incluye, lo define Eliana con Logik más adelante, siempre como estimación orientativa.
- **Línea del tiempo del año con Logik:** animación que muestra el alta, el seguimiento mensual y la renovación en el mes 11. Hace tangible lo que otras consultoras no explican.
- **Contadores animados:** más de 2.000 clientes y más de 10 años de experiencia, siempre que el cliente pueda respaldarlos.
- **Carrusel de empresas colaboradoras** en la home, con permiso para usar sus logos.
- **Esquema animado del autoconsumo:** sol, placas, casa y excedentes, para explicar la fotovoltaica de un vistazo.
- **Subir la factura:** formulario para enviar la factura y recibir una comparativa. El adjunto de factura queda preparado pero desactivado (variable PUBLIC\_FORM\_ATTACHMENTS) hasta elegir plataforma; el plan gratuito de Formspree no admite archivos. Con el adjunto desactivado se pide la factura por WhatsApp. Añadir el consentimiento de privacidad.
- **Botones fijos de llamar y WhatsApp** en móvil.
- **SEO local:** datos estructurados de negocio local, ficha de Google Business Profile coherente con la web y, más adelante, páginas por comarca con contenido propio (no copiado entre ellas).
- **LLMs:** archivo llms.txt, preguntas frecuentes con datos estructurados y una descripción de la empresa clara y consistente en toda la web.

## Mobile-first: regla prioritaria

El diseño y el código se hacen primero para móvil y después se amplían a tablet y escritorio. Esta regla manda sobre cualquier otra decisión de diseño: si algo luce bien en escritorio pero estorba en móvil, se cambia.

- **Orden de trabajo:** se diseña y se programa desde 360 px de ancho. El CSS parte de la versión móvil y añade `min-width` para pantallas más grandes. Eliana lo revisa en móvil real y en 360, 390, 768 y 1280 px. Claude Code no hace capturas de pantalla ni usa navegadores automatizados para comprobar el diseño, ni las pide ni las entrega.
- **Sin scroll horizontal** en ninguna página. Las tablas se convierten en tarjetas y los carruseles se mueven con el dedo.
- **Primera pantalla:** el titular, la propuesta de valor y el botón principal (formulario) se ven sin hacer scroll en un móvil de 360 × 640 px.
- **Llamar y WhatsApp:** barra fija inferior en móvil, sin tapar el contenido ni el banner de cookies.
- **Toques:** botones y enlaces de al menos 44 px de alto, con espacio entre ellos. Texto del cuerpo de al menos 16 px.
- **Formularios:** una columna, tipo de teclado correcto (`tel`, `email`), `autocomplete`, campos de al menos 16 px (para que el móvil no haga zoom) y el botón de envío siempre visible.
- **Pre-estudio y subida de factura:** pensadas para el pulgar, por pasos y en una sola columna.
- **Rendimiento en móvil:** los objetivos son LCP de 2,5 s o menos, INP de 200 ms o menos y CLS de 0,1 o menos (valores "buenos" de los [Core Web Vitals](https://web.dev/articles/defining-core-web-vitals-thresholds)), medidos con perfil móvil. Imágenes WebP con `srcset`, JavaScript mínimo y tipografías alojadas en la propia web.
- **Animaciones:** ligeras en móvil y desactivadas con `prefers-reduced-motion`. Nada de efectos que dependan del cursor (hover).
- **Antes de publicar:** revisar en un móvil real, no solo en el emulador del navegador, y pasar Lighthouse en modo móvil.

## Rol del asistente: CRO, UX/UI, SEO y desarrollo web

Claude actúa como experto en CRO (optimización de la conversión), UX/UI, SEO, marketing digital y desarrollo web. Antes de proponer páginas, textos, formularios o cambios de diseño, busca información actual y fiable en internet (guías oficiales de Google, estudios de usabilidad y conversión, documentación técnica), la contrasta y cita las fuentes.

Principios de CRO para esta web:

- Cada página tiene un único objetivo: que el visitante envíe el formulario o llame. La llamada a la acción principal se ve sin hacer scroll y se repite de forma natural.
- La propuesta de valor se entiende en los primeros segundos: qué hace Logik, para quién y qué hacer ahora.
- Formulario corto, con aviso de privacidad, errores claros y mensaje de confirmación. Botones fijos de llamar y WhatsApp en móvil.
- Prueba social defendible: cifras confirmadas por el cliente, logos con permiso y reseñas reales.
- Menos fricción: poco texto, jerarquía visual clara, botones con verbo y velocidad de carga.
- Medición: eventos en GA4 mediante GTM (envío del formulario, clic en llamar y en WhatsApp), siempre después del consentimiento de cookies. Los tests A/B solo cuando haya tráfico suficiente.

## Calidad técnica: indexación y enlaces

Objetivo: que ninguna página importante quede sin indexar y que no haya enlaces rotos. Reglas, que se comprueban antes de cada publicación:

- Sin `noindex` accidental y sin reglas en robots.txt que bloqueen páginas ni recursos (CSS, JS, imágenes).
- Cada página tiene URL canónica, title y meta descripción únicos, un solo H1, está enlazada desde otra página (sin páginas huérfanas) y aparece en sitemap.xml.
- El texto principal está en el HTML, sin depender de JavaScript para mostrarse.
- Códigos de estado correctos: 200 en las páginas, 301 en las redirecciones desde la web WordPress, página 404 propia y sin cadenas de redirecciones.
- Rastreo automático de enlaces internos y externos: cero enlaces rotos antes de publicar. Imágenes con texto alternativo y dimensiones declaradas.
- Después de publicar, revisar en Search Console el sitemap y las páginas no indexadas (forma parte del mantenimiento mensual).
- Antes de desactivar WordPress, listar todas sus URLs actuales para preparar las redirecciones.

## Multiidioma: catalán y castellano

- Cada página tiene una URL propia por idioma. El idioma no cambia con JavaScript ni con parámetros.
- Etiquetas hreflang recíprocas entre cada pareja catalán/castellano, con auto-referencia, `x-default` y URLs absolutas. Cada versión tiene su canonical apuntando a sí misma.
- Atributo `lang` correcto en cada página (`ca` y `es`) y sitemap con las versiones alternativas.
- Selector de idioma con enlaces normales a la página equivalente. No redirigir de forma automática según la IP o el idioma del navegador.
- Slug, title, meta descripción y textos propios de cada idioma, escritos de forma natural y no como traducción literal.

## Publicación sin sorpresas: que el servidor se vea igual que el local

- Probar siempre desde un servidor local, nunca abriendo el archivo con doble clic, y con rutas absolutas desde la raíz (`/assets/css/main.css`).
- Nombres de archivo en minúsculas, sin espacios ni acentos: los servidores Linux distinguen mayúsculas y minúsculas, y el ordenador local normalmente no.
- En todas las páginas: `<!doctype html>`, `<meta charset="utf-8">` y `<meta name="viewport" content="width=device-width, initial-scale=1">`. Tipografías alojadas en la propia web, con fuente de respaldo.
- Publicar primero en un entorno de pruebas (subdominio en el hosting, con `noindex` y protegido), revisarlo en un móvil real y solo después pasar a producción. Al lanzar, comprobar que el `noindex` de pruebas no se ha copiado a producción.
- Versionar los archivos CSS y JS y vaciar la caché del hosting y del navegador al subir cambios.

## Pendientes por decidir

- [x] Colores: paleta basada en los tonos del logo (`#01323A` y `#FD6200`), con derivados para texto, fondos y estados.
- [x] Logo actual: recibido (símbolo, logotipo y favicons, ya en la carpeta de imágenes).
- [x] Tipografía: Sora (títulos) y DM Sans (texto).
- [x] Estudio de palabras clave en catalán y castellano.
- [x] Estructura de la home: opción A (flujo de conversión completo).
- [x] Modelo de cobro: sin coste para el cliente, paga la comercializadora (confirmado por Eliana).
- [x] Cifras confirmadas: más de 2.000 clientes y más de 10 años de experiencia.
- [x] Páginas legales: incluidas en el precio.
- [x] WhatsApp: 665 05 25 16.
- [x] Permiso para usar los logos de los clientes: aprobado. Los 13 logos ya están en la carpeta de imágenes (son recortes de baja calidad; mejor sustituirlos por originales cuando se consigan).
- [x] Datos fiscales de Logik recibidos. Código postal 17002 confirmado por Eliana; planta y puerta (3r 1a) confirmadas.
- [ ] Plataforma del formulario: por decidir (el plan gratuito de Formspree no admite archivos adjuntos; Eliana está comparando opciones y enviará el destino). GTM ya está configurado por Eliana: etiqueta de Google (G-QCSEZ3YWK2), cinco activadores de evento personalizado y cinco etiquetas de evento. Falta la vista previa con la web en pruebas, marcar generate\_lead como evento clave en GA4 y publicar la versión.
- [ ] Estructura final de las 10 páginas, con las palabras clave del estudio.
- [ ] Animaciones y efectos concretos de Linkener que gusten: Eliana los indicará.
- [ ] Publicación (cdmon y hosting): se habla cuando la web esté lista para subir.
- [ ] Fecha de desactivación de la web de WordPress y plan de redirecciones.

* [ ] Arquitectura del código multiidioma: decidido, framework estático (Astro).
* [ ] Crear el entorno de pruebas (staging) en el hosting que se confirme.
* [ ] Configurar CLAUDE.md, skills y hooks del repositorio.

## Decisiones del 2 y 3 de noviembre de 2026

Estas decisiones sustituyen a cualquier texto anterior que las contradiga.

- **Revisión visual:** la hace Eliana. Claude Code no hace capturas de pantalla ni usa navegadores automatizados para comprobar el diseño.
- **Teléfono:** un único número, 665 05 25 16, para llamar y para WhatsApp, en una sola constante (`src/config/site.ts`). El 872 22 00 43 no se usa.
- **Idioma:** sin redirección automática según el idioma del navegador (Google no la sigue y muchos catalanes usan el navegador en castellano). Solo el selector CA | ES visible, que enlaza a la página equivalente. Sin aviso de sugerencia de idioma por ahora.
- **Carpeta dist:** es la salida de `npm run build`; su contenido es lo que se sube a la raíz del servidor. No se edita a mano. En local se usa `npm run dev` o `npm run preview`, nunca abriendo el archivo con doble clic.
- **Navbar grande** (estilo Linkener, mobile-first): paneles desplegables "Per a qui" (Empreses i pimes, Comunitats de veïns, Llars) y "Serveis" (Autoconsum fotovoltaic, Gestió i tràmits) con tarjeta destacada "Demana el teu estudi"; enlaces directos a Com treballem, Nosaltres, Blog y Contacte; teléfono, selector de idioma y botón principal. Los chevrons de los desplegables se ven siempre, en todos los anchos. En móvil, panel a pantalla completa con acordeones.
- **Páginas y slugs provisionales** (se confirman con el estudio de palabras clave al redactar cada página; definidos en `src/config/pages.ts`): /empreses-i-pimes/ ↔ /es/empresas-y-pymes/ · /comunitats-de-veins/ ↔ /es/comunidades-de-vecinos/ · /llars/ ↔ /es/hogares/ · /autoconsum-fotovoltaic/ ↔ /es/autoconsumo-fotovoltaico/ · /gestio-i-tramits/ ↔ /es/gestion-y-tramites/ · /com-treballem/ ↔ /es/como-trabajamos/ · /nosaltres/ ↔ /es/nosotros/ · /blog/ ↔ /es/blog/ · /contacte/ ↔ /es/contacto/. Mientras no tengan contenido son borradores con `noindex`, fuera del sitemap; ninguno puede llegar a producción vacío ni con `noindex`.
- **Logos de clientes:** PNG con fondo transparente en `images/clients/` (13 logos, recortes de baja calidad; sustituir por originales cuando haya). En la web, un solo tono con el color real al pasar el cursor.
- **Pre-estudio (calculadora profesional):** cinco pasos (perfil, suministro, importe mensual y potencia, resumen con gasto anual y lista "què revisarem en el teu cas", datos de contacto). Sin ahorros calculados; interruptor `ESTIMATE_ENABLED = false` hasta que Logik aporte una fórmula validada. Campos de contacto obligatorios: nombre, apellidos, correo y teléfono, con consentimiento. Eventos: calc\_start, calc\_step y generate\_lead con form="calculadora". Campos internos para Logik y la publicidad: franja de importe y UTM/gclid leídos de la URL, sin cookies.
- **Formulario final y adjunto:** diseño de dos columnas, perfil con chips, destino en `PUBLIC_FORM_ENDPOINT`. Adjunto de factura opcional, desactivado por defecto (`PUBLIC_FORM_ATTACHMENTS`); mientras tanto, la factura se pide por WhatsApp. El plan gratuito de Formspree no admite archivos; alternativas con adjuntos gratis: Forminit/Getform y Basin (límites bajos). La factura contiene datos personales: hay que reflejarlo en la política de privacidad.
- **Enlaces:** sin subrayado en navegación, menú, pie, tarjetas, botones y enlaces con flecha (se distinguen por color y movimiento, con subrayado animado al pasar el cursor); subrayado fino solo en enlaces dentro de texto corrido. Foco visible siempre. Regla definida en un solo lugar de los estilos globales.
- **Movimiento:** aparición al hacer scroll con retardo escalonado, hovers con elevación, solo transform y opacity, sin librerías de animación, todo con respaldo para `prefers-reduced-motion` y contenido visible si falla el JS.
- **Rediseño de secciones de la home** (textos en el doc "Textos de la home", sección de actualización del 3 de noviembre): bento interactivo de perfiles con H2 de palabra clave, carril de 12 meses animado, comparativa con columna "Amb Logik" destacada, tarjeta izquierda de gestiones con mini interfaz de estados, FAQ en acordeón con 10 preguntas y pie reorganizado. La tarjeta derecha de autoconsumo (esquema del sol y las placas) no se toca. El hero gana fondo animado, chips flotantes y el gráfico del rayo.
- **Pendiente de validar con Logik:** las listas de "què mirem" de las tarjetas de perfil y las dos preguntas nuevas del FAQ (factura de la luz y potencia adecuada).
- **Pendiente de Eliana:** elegir la plataforma del formulario, conseguir los logos originales, decidir la dirección del diseño (opción A, B o C propuesta para dar más riqueza visual a la home) y revisar los textos nuevos.

* **Hero (3 de noviembre de 2026):** versión ligera y mensaje definitivo. Etiqueta "Consultoria energètica a Girona i a tot Espanya"; titular "Venim a veure't i revisem la teva factura."; botón "Revisa la meva factura". El alcance es Girona (visitas presenciales en localidades cercanas) y toda España. La meta descripción y el JSON-LD (areaServed) incluyen España. Los textos exactos están en el doc "Textos de la home". Pendiente: guía de mensaje y tono y cuestionario para Logik, para redactar el resto de la web con copy propio.
