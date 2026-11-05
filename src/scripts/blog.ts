// Interacciones del blog (todo funciona sin JS: tarjetas, enlaces e índice de contenidos son HTML).
// - blog_card_click { slug, position, lang } al hacer clic en una tarjeta (índice y "Segueix llegint").
// - Filtro por categoría con chips (solo si el índice lo muestra: 6 artículos o más).
// - Índice de contenidos lateral: resalta la sección activa (aria-current="location").
import { track } from './analytics';
import { initReveal } from './motion';

initReveal();

document.addEventListener('click', (event) => {
  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-card-link]');
  if (!link) return;
  const { slug, position, lang } = link.dataset;
  track('blog_card_click', { slug, position: Number(position), lang });
});

// --- Filtro por categoría ----------------------------------------------------------
document.querySelectorAll<HTMLElement>('[data-blog-filter]').forEach((filter) => {
  const cards = [...document.querySelectorAll<HTMLElement>('[data-blog-grid] > [data-category]')];
  const live = filter.querySelector<HTMLElement>('[data-filter-live]');
  const chips = [...filter.querySelectorAll<HTMLButtonElement>('button[data-filter]')];
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const value = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      let shown = 0;
      for (const card of cards) {
        const match = value === 'all' || card.dataset.category === value;
        card.hidden = !match;
        if (match) shown++;
      }
      if (live) live.textContent = `${chip.textContent?.trim()}: ${shown}`;
    });
  }
});

// --- Esquema de 24 h (diagram: periodes-24h): segmentos de izquierda a derecha al entrar ---
// Solo se oculta (is-pending) si está por debajo de la pantalla al cargar, con JS, con
// IntersectionObserver y con movimiento permitido. En cualquier otro caso se ve completo.
const periods = [...document.querySelectorAll<HTMLElement>('[data-periods]')];
if (
  periods.length &&
  'IntersectionObserver' in window &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        observer.unobserve(e.target);
        e.target.classList.remove('is-pending');
      }
    },
    { rootMargin: '0px 0px -15% 0px' },
  );
  requestAnimationFrame(() => {
    for (const el of periods) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.85) continue;
      el.classList.add('is-pending');
      observer.observe(el);
    }
  });
}

// --- Índice de contenidos: sección activa ---------------------------------------------
const toc = document.querySelector<HTMLElement>('[data-toc-desktop]');
if (toc && 'IntersectionObserver' in window) {
  const links = new Map(
    [...toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].map((a) => [decodeURIComponent(a.hash.slice(1)), a]),
  );
  const headings = [...links.keys()].map((id) => document.getElementById(id)).filter((h): h is HTMLElement => !!h);
  const visible = new Set<string>();
  const setActive = (id: string) =>
    links.forEach((a, key) => (key === id ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target.id);
        else visible.delete(e.target.id);
      }
      // La primera sección visible; si no hay ninguna, la última que quedó por encima.
      const current =
        headings.find((h) => visible.has(h.id)) ??
        [...headings].reverse().find((h) => h.getBoundingClientRect().top < window.innerHeight * 0.3);
      if (current) setActive(current.id);
    },
    { rootMargin: '-15% 0px -70% 0px' },
  );
  headings.forEach((h) => observer.observe(h));
}
