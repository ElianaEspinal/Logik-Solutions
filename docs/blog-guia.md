# Guía para publicar artículos del blog

Nov 3, 2026 · Uso interno

Los artículos se añaden sin tocar código: un archivo Markdown por artículo e idioma. La web genera sola la tarjeta en el índice, la página del artículo, el sitemap, el RSS, `llms.txt`, el hreflang y los datos estructurados.

## 1. Dónde va cada archivo

| Qué | Ruta |
| --- | --- |
| Artículo en catalán | `src/content/blog/ca/<nombre>.md` |
| Artículo en castellano | `src/content/blog/es/<nombre>.md` |
| Portada (opcional) | Junto al artículo, p. ej. `src/content/blog/ca/factura-llum.webp` |
| Imágenes del cuerpo | Junto al artículo, enlazadas con ruta relativa: `![Texto alternativo](./grafico.webp)` |

Nombres de archivo en minúsculas, sin espacios ni acentos. Solo `.md` (el soporte de `.mdx` se quitó el 5/11/2026 porque no se usaba; si algún día hace falta un componente dentro de un artículo, habría que volver a instalar `@astrojs/mdx`).

**Portada:** el original (PNG o JPG, nombre en minúsculas) va en `src/assets/blog/`. El build genera WebP de 480, 768 y 1200 px (calidad 78) y la imagen para compartir (og:image y twitter:image) recortada a 1200 × 630 en JPG. `coverPosition` ajusta el encuadre si el recorte tapa algo ("50% 20%"). Si un artículo no tiene portada, la web genera una de marca (degradado teal con el icono de la categoría y el rayo).

## 2. Frontmatter (ejemplo completo)

```md
---
title: 'Com llegir la factura de la llum pas a pas'
description: "Què és el terme de potència, què és el terme d'energia i on mirar-ho a la factura. Explicat amb paraules senzilles."
slug: com-llegir-la-factura-de-la-llum
pubDate: 2026-12-01
updatedDate: 2026-12-15        # opcional: solo si se actualiza
category: factura              # factura | gestions | autoconsum | comunitats | empreses
tags: ['factura', 'potència']  # opcional
cover: '../../../assets/blog/factura-llum.png'   # opcional (original en src/assets/blog/)
coverAlt: 'Factura de la llum amb el terme de potència marcat'  # obligatorio si hay portada
coverPosition: '50% 30%'       # opcional: encuadre del recorte
author: marta                  # opcional: clave de AUTHORS en src/config/blog.ts
translationKey: llegir-factura # el mismo valor en la versión castellana
draft: true                    # true mientras se escribe
faq:                           # opcional: preguntas frecuentes (se muestran y van en el JSON-LD)
  - q: 'Què és el terme de potència?'
    a: 'És el que pagues per tenir contractada una potència, la facis servir o no.'
---

Entradilla o primer párrafo. El texto empieza en H2: el H1 es el `title`.

## Primer apartado

Texto con un [enlace interno](/empreses-i-pimes/).

> [!NOTA]
> Un recuadro destacado de nota.

> [!ATENCIO]
> Un recuadro de aviso. (En castellano: `[!ATENCION]`.)
```

Notas:

- **slug:** propio de cada idioma, en minúsculas, sin acentos y con guiones. Si no se pone, se usa el nombre del archivo. No puede ser `pagina` ni `rss`.
- **Autor:** si no se indica, firma "Equip de Logik Solutions" / "Equipo de Logik Solutions" (la organización; en el JSON-LD el autor es la empresa). Las personas se añaden en `AUTHORS` (`src/config/blog.ts`) solo cuando Logik confirme nombre, cargo y una frase; no se inventan.
- **Tiempo de lectura y fechas:** se calculan solos (palabras ÷ 200). Si `updatedDate` es el mismo día que `pubDate`, solo se muestra "Actualitzat el…".
- **H1 distinto del title (opcional):** `h1: '…'`. El `title` sigue siendo el de la pestaña y el de Google; el H1, las migas y el `headline` del JSON-LD usan `h1`.
- **Índice de contenidos:** sale de los H2. Usa títulos de H2 cortos y descriptivos.
- **Tablas:** Markdown normal. Las de 2 o 3 columnas caben en móvil; las de 4 o más hacen scroll dentro de su caja (la página nunca).
- **Respuesta rápida:** si el primer párrafo empieza por `**Resposta ràpida:**` / `**Respuesta rápida:**`, se muestra en una caja destacada.
- **Listas numeradas:** se muestran como pasos (número en círculo).
- **Enlaces:** los externos abren en pestaña nueva. Los internos tienen que ser rutas de `src/config/pages.ts` (o del blog) del mismo idioma: si no, el build falla con un mensaje que dice qué enlace revisar.
- **CTA a mitad de artículo:** aparece solo si el artículo pasa de 1.200 palabras. El CTA final sale siempre.
- **CTA final propio (opcional):** en lugar del genérico, con su título, el texto del botón (siempre va al pre-estudi) y el `section` de `cta_click`:

  ```md
  cta:
    title: "Vols que ens n'ocupem nosaltres?"
    button: 'Comença el pre-estudi'
    section: blog_potencia_cierre
  ```
  O, en lugar del botón, el pre-estudi embebido (el mismo de las páginas de servicio), con el título del bloque, la `pagina_origen` del envío y, debajo, el teléfono ("Prefereixes trucar?"), que es el que lanza `cta_click` con `section`:

  ```md
  cta:
    title: "Vols que ens n'ocupem nosaltres?"
    section: blog_titular_cierre
    study: true
    origin: blog_titular
  ```
- **Aviso final:** si el último párrafo empieza por "Aquest article és informatiu" / "Este artículo es informativo", se muestra en texto pequeño (16 px, gris), separado por una línea.
- **Visual propio (opcional):** `diagram: periodes-24h` inserta el esquema de 24 horas de los periodos de potencia justo después de la primera tabla, sin tocar el texto. Los visuales disponibles están en `DIAGRAMS` (`src/lib/markdown/rehype-blog.mjs`).
- **Preguntas frecuentes:** van en el frontmatter (`faq`), no en el cuerpo. Se muestran en acordeón (la primera abierta, una abierta a la vez) y van palabra por palabra al JSON-LD.

## 3. Enlazar las dos versiones

Pon el mismo `translationKey` en el artículo catalán y en el castellano. Con eso se generan el hreflang recíproco y el enlace del selector CA | ES. Si un artículo existe en un solo idioma, no pongas `translationKey` (o deja la clave sin pareja): el selector lleva al índice del blog del otro idioma y no se genera ningún hreflang hacia una URL que no existe.

## 4. De borrador a publicado

1. Mientras se escribe: `draft: true`. Es solo un estado de trabajo: se ve con `npm run dev` (en `http://localhost:4321/blog/<slug>/`), sin ninguna etiqueta visible, y ningún build lo genera: ni producción, ni staging, ni sitemap, RSS o `llms.txt`.
   Si un dato está pendiente de comprobar, márcalo con un comentario `# PENDIENTE DE VERIFICACIÓN ...` en el frontmatter: el build lo muestra como aviso sin fallar.
2. Para publicar: cambia a `draft: false` (o borra la línea) en las dos versiones y ejecuta `npm run check`.
3. Con el primer artículo publicado en un idioma, el índice del blog de ese idioma pasa solo de "noindex, follow" a indexable y entra en el sitemap.

## 5. Lista de comprobación antes de publicar

- [ ] Palabra clave principal y secundaria elegidas (en catalán y en castellano, por separado).
- [ ] No repite el tema, el enfoque ni las palabras clave de Optienergy (consulta el estudio de palabras clave).
- [ ] `title` de 60 caracteres o menos (se le añade " | Logik Solutions": el build avisa si el total pasa de 60).
- [ ] `description` de 155 caracteres o menos (el build avisa si se pasa).
- [ ] Un solo H1 (el `title`); el texto empieza en H2.
- [ ] Al menos 2 enlaces internos (una página de servicio y la de contacto o el pre-estudi).
- [ ] Texto alternativo en todas las imágenes, y portada con `coverAlt`.
- [ ] Sin afirmaciones que no se puedan demostrar: nada de "garantizado", ni plazos, ni porcentajes inventados.
- [ ] Cualquier cifra de ahorro lleva la etiqueta "estimación orientativa" / "estimació orientativa".
- [ ] Las dos versiones escritas de forma natural, no como traducción literal, y con el mismo `translationKey`.
- [ ] `npm run check` sin errores ni avisos del blog.
