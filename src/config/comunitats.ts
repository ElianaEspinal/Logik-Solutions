// Interruptor de contenido de la página Comunitats de veïns / Comunidades de vecinos.
//
// COMUNITATS_FV: ¿Logik instala fotovoltaica en comunidades de vecinos?
//   false (hoy: NO confirmado) -> la página no muestra el bloque "I si la comunitat vol plaques
//          solars?", ni la pregunta solar del FAQ (ni en el JSON-LD), ni la casilla solar del
//          pre-estudi; title, H1, metas y JSON-LD no mencionan placas solares.
//   true   -> se muestran esos elementos y se usan las variantes de title, H1 y meta "amb FV".
// Para activarlo: cambiar a true, `npm run check` y revisar los textos marcados en
// src/pages/comunitats-de-veins.astro y src/pages/es/comunidades-de-vecinos.astro.
export const COMUNITATS_FV: boolean = false;
