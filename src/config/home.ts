// Anclas de la home y destino del botón principal del hero. Único sitio para cambiarlos.
import { pages, type Locale } from './pages';

/** Sección del pre-estudi (src/components/home/pre-study.astro). */
export const PRE_STUDY_ID = { ca: 'pre-estudi', es: 'preestudio' } as const satisfies Record<Locale, string>;

/** false -> la home no muestra el pre-estudi y el hero lleva al formulario de cierre. */
export const PRE_STUDY_ENABLED = true;

/** Formulario de cierre "Parlem?". */
export const CLOSING_FORM_ID = 'formulari';

/** Destino del botón principal del hero: el pre-estudi si existe; si no, el formulario de cierre. */
export const heroTarget = (lang: Locale) => `#${PRE_STUDY_ENABLED ? PRE_STUDY_ID[lang] : CLOSING_FORM_ID}`;

/** El mismo destino desde cualquier otra página (blog, Nosaltres…): /#pre-estudi o /es/#preestudio. */
export const heroCtaHref = (lang: Locale) => `${pages.home[lang]}${heroTarget(lang)}`;
