// Revelado al hacer scroll y animaciones decorativas de la home (estilos en src/styles/motion.css).
// - Solo se oculta lo que está por debajo de la pantalla al cargar: lo visible nunca parpadea.
// - Sin IntersectionObserver o con movimiento reducido no se oculta ni se anima nada.
// - Al acabar la animación se quita .is-in, para que los hovers (transform) funcionen.
//   .is-revealed se queda: sirve para animaciones internas (p. ej. el check de la comparativa).

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initReveal() {
  if (reduceMotion() || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);
        el.classList.remove('reveal-pending');
        el.classList.add('is-in', 'is-revealed');
        const done = (e: AnimationEvent) => {
          if (e.target !== el) return; // las animaciones de los hijos no cuentan
          el.classList.remove('is-in');
          el.removeEventListener('animationend', done);
        };
        el.addEventListener('animationend', done);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  // Tras el primer pintado: una sola lectura de posiciones.
  requestAnimationFrame(() => {
    const limit = window.innerHeight;
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      if (el.getBoundingClientRect().top < limit) return; // ya visible: sin animación
      el.classList.add('reveal-pending');
      observer.observe(el);
    });
  });
}

/** [data-anim]: los bucles decorativos solo corren mientras el bloque está en pantalla. */
export function initDecor() {
  // Idempotente: varios componentes pueden llamarlo (home, banda de logos…); cada bloque se observa una vez.
  const els = [...document.querySelectorAll<HTMLElement>('[data-anim]:not([data-decor])')];
  els.forEach((el) => el.setAttribute('data-decor', ''));
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-playing'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) entry.target.classList.toggle('is-playing', entry.isIntersecting);
  });
  els.forEach((el) => observer.observe(el));
}
