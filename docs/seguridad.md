# Seguridad de la web

Nov 5, 2026 · Claude Code para @Eliana

Todo lo que se puede hacer desde el código está hecho y se comprueba en cada build con `npm run check:security`. Lo que depende de cuentas, paneles o DNS está al final, como lista de tareas manuales: **no está hecho**.

## Qué se ha hecho en el código

**Servidor (`dist/.htaccess`, generado en cada build por `src/config/server.mjs` según `SITE_ENV`)**

- **URLs únicas:** https obligatorio y un solo dominio, con una sola 301 (detalle en docs/despliegue.md).
- **Cabeceras de seguridad en todas las respuestas:**
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: SAMEORIGIN`
  - `Permissions-Policy`: desactiva cámara, micrófono, geolocalización, pagos, USB, serie, Bluetooth, HID, MIDI, sensores, captura de pantalla y temas publicitarios
  - `Strict-Transport-Security: max-age=300`
- **CSP en modo solo informe** (`Content-Security-Policy-Report-Only`), sin endpoint de informes.
- **Bloqueo con respuesta 404 de lo que no debe servirse:**
  - archivos y carpetas ocultos (salvo `/.well-known/`);
  - `docs/`, `node_modules/`, `src/` y `scripts/`;
  - `*.map`, `*.md`, `*.log`, `*.sql`, copias (`.bak`, `.old`, `.orig`, `.swp`, `.tmp`) y comprimidos;
  - `package.json` y `package-lock.json`.
- **Directorios:** `Options -Indexes`, sin listado.
- **404:** `ErrorDocument 404` con la página propia (estado 404). En castellano, `public/es/.htaccess`.
- **Staging:** `X-Robots-Tag: noindex, nofollow`. **Producción:** sin `X-Robots-Tag`.
- **Rastreadores:** no se bloquea ni limita a Googlebot ni a ningún rastreador.
- **Excepciones que ninguna regla toca:** `/.well-known/`, `robots.txt`, `sitemap.xml`, `llms.txt`, favicons y todos los archivos de `dist/`. `check:security` lo comprueba archivo por archivo con las mismas reglas.

**Build**

- **Sin source maps ni archivos sueltos** en `dist/`; lo comprueba `check:security`.
- **Sin comentarios HTML:** se quitan del HTML publicado (eran notas internas de desarrollo).
- **Scripts en archivos:** los scripts propios van en archivos de `/_astro/`. En el HTML solo quedan dos scripts en línea, los del `<head>` (valores por defecto de Consent Mode y la marca `.js`), autorizados en la CSP por su hash SHA-256 calculado en cada build.

**Código**

- **JSON-LD seguro:** se inserta con `safeJsonLd()` (`src/lib/json-ld.ts`), que escapa `<`, `>` y `&`.
- **`set:html`:** solo se usa con iconos SVG escritos en el código y con el JSON-LD escapado.
- **Sin APIs peligrosas:** no hay `innerHTML`, `eval` ni `document.write`.
- **Parámetros de la URL:** `?perfil=` solo selecciona una opción existente; los UTM y `gclid` van a campos ocultos con `.value`. Nada de la URL se pinta como HTML.
- **Datos personales:** nunca viajan en la URL (formularios por POST) ni en la consola. Los eventos de analítica solo llevan códigos (perfil, sección, paso), nunca nombre, correo, teléfono ni mensaje.
- **Consentimiento:** se guarda en `localStorage` (`logik_consent`) y solo contiene la decisión, la fecha y la versión.
- **Enlaces externos con `target="_blank"`:** llevan `rel="noopener noreferrer"`. Las fuentes de los artículos del blog llevan `rel="noopener"`.
- **Terceros:** nada se carga desde fuera del dominio salvo Google Tag Manager (y GA4 a través de él), solo tras el consentimiento, y el mapa de Google, solo tras el consentimiento o el clic.

**Formularios (contacto, cierre de la home y pre-estudi, en catalán y castellano)**

| Capa | Qué hay |
| --- | --- |
| 1. Honeypot | `_gotcha` (el campo que filtra Formspree), fuera de pantalla con CSS, `tabindex="-1"`, `autocomplete="off"` y `aria-hidden="true"`. |
| 2. Tiempo mínimo | Un envío a menos de 3 s de cargar la página se rechaza con un mensaje neutro (`src/scripts/form-guard.ts`). |
| 3. Validación | `required`, `type="email"`/`"tel"`, `pattern` del teléfono, `maxlength` en todos los campos de texto. Con JS, mensajes propios junto a cada campo. Más de 2 enlaces en el mensaje se rechaza. Sin listas de palabras prohibidas. |
| 4. Control de envío | Botón desactivado mientras envía y 30 s después de cada envío (también si falla). Sin guardar nada en el navegador: dura lo que la página. |
| 5. Envío | POST a la URL https de `PUBLIC_FORM_ENDPOINT`. Sin JS, el formulario envía igual (POST nativo). Con JS, `fetch` con `Accept: application/json` y mensajes de éxito y error en el idioma de la página, sin detalles técnicos. |
| 6. Privacidad | Casilla obligatoria y desmarcada, con la primera capa de información. |
| 7. Captcha | Desactivado (`CAPTCHA_ENABLED = false` en `src/config/legal.ts`). No hay código que lo cargue. |
| 8. Filtro de Optienergy | No aplicado: el encargo no traía su descripción ni su código. |

**Otros**

- `/.well-known/security.txt`: contacto, caducidad y idiomas. No está en el sitemap. **Renovar `Expires` antes del 5/11/2027.**
- `npm run check:security`: se lanza en `npm run build` y se puede lanzar suelto tras cualquier build.

## Pasar la CSP de informe a obligatoria

1. Publica en staging con `npm run build:staging:gtm` (GTM activo tras el consentimiento).
2. Navega por todas las plantillas (home, servicio, contacto, blog, artículo, legal, 404) con la consola del navegador abierta. Hazlo dos veces: **aceptando** las cookies y **rechazándolas**. Carga el mapa y envía un formulario de prueba.
3. Anota cada aviso `[Report Only] Refused to…`. Si alguno es legítimo (por ejemplo, una etiqueta nueva de GTM), añade su dominio a `buildCsp()` en `src/config/server.mjs`.
4. Con cero avisos legítimos, cambia en `src/config/server.mjs` `Content-Security-Policy-Report-Only` por `Content-Security-Policy`, vuelve a probar en staging y solo entonces publica en producción.
5. Ojo con GTM: las etiquetas de HTML personalizado o las variables JavaScript personalizadas pueden necesitar `'unsafe-eval'` o scripts en línea. Mejor no usarlas; si hacen falta, documéntalo aquí.

## Subir HSTS

Hoy: `max-age=300` (5 minutos), sin `includeSubDomains` ni `preload`. Con https funcionando bien en todo el dominio, sube por pasos en `src/config/server.mjs`, dejando pasar unas semanas entre uno y otro: `604800` (1 semana), `2592000` (1 mes), `31536000` (1 año). `includeSubDomains` solo cuando **todos** los subdominios (correo web, staging…) tengan https. `preload`, solo con una decisión expresa: es muy difícil de deshacer.

## Tareas manuales (no hechas)

- [ ] Verificación en dos pasos en Hostinger.
- [ ] Verificación en dos pasos en la cuenta de Google (GTM, GA4, Search Console, Business Profile).
- [ ] Verificación en dos pasos en Formspree.
- [ ] Verificación en dos pasos en GitHub (si se sube el repositorio).
- [ ] Verificación en dos pasos en el registrador del dominio (Hostinger o cdmon).
- [ ] Bloqueo de transferencia del dominio (registrar lock) en el registrador.
- [ ] SPF del dominio de correo (registro TXT con los servidores que envían correo de @logiksolutions.es).
- [ ] DKIM activado en el proveedor de correo y publicado en DNS.
- [ ] DMARC: empezar con `p=none` y un correo de informes; subir a `quarantine` cuando SPF y DKIM pasen.
- [ ] Formspree: restringir el formulario al dominio (`logiksolutions.es` y el de staging).
- [ ] Formspree: confirmar que el honeypot `_gotcha` y el filtro de spam están activos.
- [ ] Formspree: revisar el acuerdo de tratamiento de datos.
- [ ] Contraseña HTTP del entorno de pruebas: hPanel → Avanzado → Directorios protegidos con contraseña → carpeta del subdominio de staging → usuario y contraseña.
- [ ] Comprobar que la contraseña sigue activa después de cada subida de `dist/` (el `.htaccess` del build puede sobrescribir el que escribe hPanel).
- [ ] Copias de seguridad automáticas en Hostinger activadas y una restauración de prueba hecha.
- [ ] GTM: revisar los usuarios con acceso al contenedor, quitar a quien no deba estar y dejar la publicación solo a una o dos personas.
- [ ] Limpieza de WordPress: tras la migración, borrar la instalación antigua (archivos, base de datos, usuarios de administración y plugins) y no dejar copias en el servidor.
- [ ] Renovar `/.well-known/security.txt` (Expires) antes del 5/11/2027.
- [ ] Si el repositorio se sube a GitHub: añadir `.github/dependabot.yml` (propuesta abajo).

## Propuesta de `.github/dependabot.yml` (no creado: el repositorio no tiene remoto)

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: monthly
    open-pull-requests-limit: 5
    groups:
      astro:
        patterns: ['astro', '@astrojs/*']
```
