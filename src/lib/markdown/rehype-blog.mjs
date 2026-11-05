// Plugin rehype para los artículos del blog (src/content/blog/{ca,es}/). Sin dependencias.
// 1. Ids estables en h2/h3: minúsculas, sin acentos ni signos ("Què és la potència?" -> "que-es-la-potencia").
// 2. Tablas dentro de una caja con scroll horizontal propio (la página nunca desborda).
// 3. Callouts: una cita que empieza por [!NOTA] / [!NOTE] o [!ATENCIO] / [!ATENCION] / [!WARNING]
//    se convierte en <aside class="callout"> con icono y etiqueta en el idioma del artículo.
// 4. Imágenes del cuerpo con loading="lazy" y decoding="async".
// 5. Artículos de más de N palabras: un CTA discreto, una sola vez, antes del h2 más cercano a la mitad.
// 6. Primer párrafo que empieza por "**Resposta ràpida:**" / "**Respuesta rápida:**": caja destacada.
// 7. Listas numeradas del cuerpo con estilo de pasos (clase "steps").
// 8. Enlaces: los externos abren en pestaña nueva (rel="noopener"); los internos tienen que ser una
//    ruta de src/config/pages.ts (o del blog) del mismo idioma: si no, el build falla.
// 9. Visuales por frontmatter (diagram: periodes-24h): se insertan después de la primera tabla sin
//    tocar el texto del artículo.
// 10. Último párrafo "Aquest article és informatiu…" / "Este artículo es informativo…": aviso en texto pequeño.
// Las opciones (textos, rutas y destino del CTA) vienen de src/config/blog.ts (markdownOptions).

const text = (node) =>
  node.type === 'text' ? node.value : (node.children ?? []).map(text).join('');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Esquema de 24 horas de los dos periodos de potencia (hasta 15 kW). Barras en SVG y textos en HTML
 * (siempre de 16 px o más). Decorativo para el lector de pantalla salvo su aria-label, que lo resume.
 * La animación (segmentos de izquierda a derecha) la activa src/scripts/blog.ts; sin JS o con
 * movimiento reducido se ve completo.
 */
function periodsDiagram(t) {
  const row = (label, segments) => `
    <div class="periods__row">
      <p class="periods__label">${esc(label)}</p>
      <div class="periods__bar">
        <svg viewBox="0 0 24 1" preserveAspectRatio="none" aria-hidden="true" focusable="false">${segments
          .map((s, i) => `<rect class="periods__seg periods__seg--${s.kind}" x="${s.from}" y="0" width="${s.to - s.from}" height="1" style="--d:${i}"></rect>`)
          .join('')}</svg>${segments
          .map(
            (s, i) =>
              `<span class="periods__tag periods__tag--${s.kind}" style="left:${(s.from / 24) * 100}%;width:${((s.to - s.from) / 24) * 100}%;--d:${i}">${esc(s.kind === 'valley' ? t.periodsValley : t.periodsPeak)}</span>`,
          )
          .join('')}
      </div>
    </div>`;
  return `<figure class="periods" role="img" aria-label="${esc(t.periodsAria)}" data-periods>${row(t.periodsWorkdays, [
    { kind: 'valley', from: 0, to: 8 },
    { kind: 'peak', from: 8, to: 24 },
  ])}${row(t.periodsWeekend, [{ kind: 'valley', from: 0, to: 24 }])}
    <div class="periods__axis" aria-hidden="true"><span style="left:0%">0 h</span><span style="left:33.333%">8 h</span><span style="left:100%">24 h</span></div>
    <ul class="periods__legend" aria-hidden="true">
      <li><span class="periods__swatch periods__swatch--valley"></span>${esc(t.periodsValley)}</li>
      <li><span class="periods__swatch periods__swatch--peak"></span>${esc(t.periodsPeak)}</li>
    </ul>
  </figure>`;
}
const DIAGRAMS = { 'periodes-24h': periodsDiagram };

const words = (s) => (s.match(/[\p{L}\p{N}]+(?:['\u2019-][\p{L}\p{N}]+)*/gu) ?? []).length;

export const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/·/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'seccio';

const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
const svg = (paths) =>
  el(
    'svg',
    { ariaHidden: 'true', width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
    paths.map((d) => (d.startsWith('c:') ? el('circle', { cx: 12, cy: 12, r: d.slice(2) }) : el('path', { d }))),
  );

const ICONS = {
  note: ['c:9', 'M12 11v5', 'M12 8h.01'],
  warning: ['M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z', 'M12 9v4', 'M12 17h.01'],
};
const CALLOUT = /^\s*\[!(NOTA|NOTE|ATENCIO|ATENCIÓ|ATENCION|ATENCIÓN|WARNING)\]\s*/i;

function langOf(file) {
  const path = String(file?.path ?? file?.history?.[0] ?? '').replace(/\\/g, '/');
  const m = path.match(/\/content\/blog\/(ca|es)\//);
  return m ? m[1] : null;
}

/** @param {{ midCtaMinWords: number, text: Record<string, Record<string, string>> }} options */
export default function rehypeBlog(options) {
  return (tree, file) => {
    const lang = langOf(file);
    if (!lang) return; // solo artículos del blog
    const t = options.text[lang];
    const used = new Map();
    const frontmatter = file?.data?.astro?.frontmatter ?? {};
    const where = String(file?.path ?? file?.history?.[0] ?? '').replace(/\\/g, '/').split('/src/').pop();

    // 6. Respuesta rápida: el primer párrafo, si empieza por la etiqueta en negrita.
    const first = tree.children.find((c) => c.type === 'element');
    const lead = first?.tagName === 'p' && first.children?.[0];
    if (lead?.type === 'element' && lead.tagName === 'strong' && text(lead).trim() === `${t.quickAnswer}:`) {
      tree.children[tree.children.indexOf(first)] = el('aside', { className: ['quick-answer'] }, [first]);
    }

    // 10. Aviso final: el último párrafo, si empieza por "Aquest article és informatiu" / "Este artículo es informativo".
    const last = [...tree.children].reverse().find((c) => c.type === 'element');
    if (last?.tagName === 'p' && text(last).startsWith(t.disclaimer)) {
      last.properties.className = [...(last.properties.className ?? []), 'post-disclaimer'];
    }

    // 8. Enlaces.
    const checkLinks = (node) => {
      if (node.type !== 'element') return;
      if (node.tagName === 'a' && typeof node.properties?.href === 'string') {
        const href = node.properties.href;
        if (/^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?logiksolutions\.es(\/|$)/i.test(href)) {
          node.properties.target = '_blank';
          const rel = new Set([...(node.properties.rel ?? []), 'noopener']);
          node.properties.rel = [...rel];
        } else if (href.startsWith('/') && !href.startsWith('//')) {
          const path = href.split(/[?#]/)[0];
          const ok = options.internalPaths[lang].includes(path) || path.startsWith(options.blogPath[lang]);
          if (!ok) {
            throw new Error(
              `[blog] ${where}: enlace interno "${href}" no está en src/config/pages.ts para "${lang}" (usa el slug de pages.ts del mismo idioma).`,
            );
          }
        }
      }
      (node.children ?? []).forEach(checkLinks);
    };
    tree.children.forEach(checkLinks);

    const walk = (parent) => {
      const children = parent.children ?? [];
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.type !== 'element') continue;

        if (node.tagName === 'h2' || node.tagName === 'h3') {
          const base = slugify(text(node));
          const n = used.get(base) ?? 0;
          used.set(base, n + 1);
          node.properties.id = n ? `${base}-${n + 1}` : base;
        }

        if (node.tagName === 'table') {
          children[i] = el('div', { className: ['table-wrap'], role: 'region', tabIndex: 0, ariaLabel: t.table }, [node]);
          // 9. Visual del frontmatter justo después de la primera tabla (una sola vez).
          const diagram = DIAGRAMS[frontmatter.diagram];
          if (diagram && !used.has('#diagram')) {
            used.set('#diagram', 1);
            children.splice(i + 1, 0, { type: 'raw', value: diagram(t) });
            i++;
          }
          continue;
        }

        // 7. Listas numeradas del cuerpo: pasos.
        if (node.tagName === 'ol' && parent === tree) {
          node.properties.className = [...(node.properties.className ?? []), 'steps'];
        }

        if (node.tagName === 'img') {
          node.properties.loading ??= 'lazy';
          node.properties.decoding ??= 'async';
        }

        if (node.tagName === 'blockquote') {
          const first = node.children.find((c) => c.type === 'element' && c.tagName === 'p');
          const head = first?.children?.[0];
          const match = head?.type === 'text' && head.value.match(CALLOUT);
          if (match) {
            const kind = /^(NOTA|NOTE)$/i.test(match[1]) ? 'note' : 'warning';
            head.value = head.value.replace(CALLOUT, '');
            children[i] = el('aside', { className: ['callout', `callout--${kind}`] }, [
              el('p', { className: ['callout__label'] }, [svg(ICONS[kind]), { type: 'text', value: kind === 'note' ? t.note : t.warning }]),
              ...node.children,
            ]);
            continue;
          }
        }
        walk(node);
      }
    };
    walk(tree);

    // CTA a mitad de artículo (una sola vez, solo en artículos largos).
    const total = words(text(tree));
    if (total <= options.midCtaMinWords) return;
    let count = 0;
    let best = null;
    for (const [i, node] of tree.children.entries()) {
      if (node.type === 'element' && node.tagName === 'h2' && count > 0) {
        const distance = Math.abs(count - total / 2);
        if (!best || distance < best.distance) best = { i, distance };
      }
      count += words(text(node));
    }
    if (!best) return;
    tree.children.splice(
      best.i,
      0,
      el('aside', { className: ['mid-cta'], dataSection: 'blog' }, [
        el('p', { className: ['mid-cta__text'] }, [{ type: 'text', value: t.midText }]),
        el('p', { className: ['mid-cta__actions'] }, [
          el('a', { className: ['mid-cta__link'], href: t.midHref, dataCta: 'blog_post' }, [
            { type: 'text', value: `${t.midLink} ` },
            el('span', { ariaHidden: 'true' }, [{ type: 'text', value: '→' }]),
          ]),
          el('a', { className: ['mid-cta__call'], href: t.phoneTel }, [{ type: 'text', value: `${t.callLabel} ${t.phoneDisplay}` }]),
        ]),
      ]),
    );
  };
}
