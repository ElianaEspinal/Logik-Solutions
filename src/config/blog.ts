// Configuración del blog: categorías, autores, límites y textos de interfaz (ca/es).
// Lo usan el esquema de la colección (src/content.config.ts), el índice, la plantilla
// de artículo, el plugin de Markdown (src/lib/markdown/rehype-blog.mjs), RSS y llms.txt.
// Guía para publicar: docs/blog-guia.md.
import { heroCtaHref } from './home';
import { pages, type Locale } from './pages';
import { phone } from './site';

type T = Record<Locale, string>;

/** Categorías fijas (solo se muestran como etiqueta: no hay páginas de categoría). */
export const CATEGORIES = {
  factura: { ca: 'Factura i potència', es: 'Factura y potencia' },
  gestions: { ca: 'Gestions i tràmits', es: 'Gestiones y trámites' },
  autoconsum: { ca: 'Autoconsum', es: 'Autoconsumo' },
  comunitats: { ca: 'Comunitats', es: 'Comunidades' },
  empreses: { ca: 'Empreses', es: 'Empresas' },
} as const satisfies Record<string, T>;

export type CategoryKey = keyof typeof CATEGORIES;
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as [CategoryKey, ...CategoryKey[]];

/** Iconos de línea (24 px) de cada categoría: tarjetas y portada generada. */
export const CATEGORY_ICONS: Record<CategoryKey, string> = {
  factura: '<path d="M6 2h9l4 4v16l-3-2-2 2-2-2-2 2-2-2-2 2Z"/><path d="M9 9h6M9 13h6"/>',
  gestions: '<path d="M8 3h8l4 4v14H4V3h4"/><path d="m8 14 2.5 2.5L16 11"/>',
  autoconsum: '<path d="M3 20l3-9h12l3 9Z"/><path d="M9 11l-1 9M15 11l1 9M4.5 15.5h15M12 2v3M18 4l-2 2M6 4l2 2"/>',
  comunitats: '<path d="M3 21h18M4 21V8l5-3 5 3v13M14 21V11h6v10"/><path d="M7 11h1M7 15h1M10 11h1M10 15h1"/>',
  empreses: '<path d="M3 21h18M5 21V6l7-3v18M12 9h7v12"/><path d="M8 9h1M8 13h1M8 17h1M15 13h1M15 17h1"/>',
};

/**
 * Autores (personas reales). VACÍO: no se inventan personas. Para añadir uno:
 *   marta: { name: 'Marta …', role: { ca: '…', es: '…' }, bio: { ca: '…', es: '…' }, url: 'https://…' }
 * y en el artículo `author: marta`. Sin autor, firma la organización Logik Solutions.
 */
export type Author = { name: string; role: T; bio: T; url?: string };
export const AUTHORS: Record<string, Author> = {};
/** Clave de AUTHORS que firma los artículos sin `author`. null = Logik Solutions. */
export const DEFAULT_AUTHOR: string | null = null;

export const POSTS_PER_PAGE = 9;
/** Filtro por categoría (chips) solo a partir de este número de artículos. */
export const FILTER_MIN_POSTS = 6;
/** CTA discreto a mitad de artículo solo en artículos más largos. */
export const MID_CTA_MIN_WORDS = 1200;
export const WORDS_PER_MINUTE = 200;
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/** Destino del botón "Revisa la meva factura": el mismo que el botón del hero (src/config/home.ts). */
export const blogCtaHref = heroCtaHref;

export const blogText = {
  ca: {
    eyebrow: 'Blog',
    title: "Blog d'energia per a empreses, comunitats i llars",
    lead: "Guies clares sobre la factura de la llum i el gas, la potència, els tràmits i l'autoconsum.",
    metaTitle: "Blog d'energia i factura de la llum | Logik Solutions",
    metaDescription:
      "Guies i consells clars sobre la factura de la llum i el gas, la potència, els tràmits i l'autoconsum, de la mà de Logik Solutions, a Girona.",
    readMore: "Llegir l'article",
    readingTime: '{n} min de lectura',
    filterLabel: 'Filtra per categoria', // [Claude]
    filterAll: 'Tots', // [Claude]
    pageLabel: 'Pàgina {n}', // [Claude]
    prev: '← Anteriors', // [Claude]
    next: 'Següents →', // [Claude]
    pagination: 'Paginació del blog', // [Claude]
    ctaTitle: 'Vols que revisem la teva factura?',
    ctaText: "Explica'ns el teu cas i et diem què mirem.",
    ctaButton: 'Revisa la meva factura',
    ctaCall: 'Truca al',
    emptyTitle: 'Preparem els primers articles.',
    emptyText:
      'Aviat hi trobaràs guies sobre la factura de la llum i el gas, la potència i els tràmits. Mentrestant, et revisem la teva factura.',
    breadcrumb: 'Ruta de navegació', // [Claude]
    home: 'Inici',
    by: 'Per', // [Claude]
    published: 'Publicat el', // [Claude]
    updated: 'Actualitzat el',
    toc: 'En aquest article',
    faqTitle: 'Preguntes freqüents', // [Claude]
    postCtaTitle: 'Vols que ho revisem amb la teva factura?',
    midCtaText: 'Vols que ho mirem amb la teva factura?', // [Claude]
    midCtaLink: 'Revisa la meva factura', // [Claude]
    authorTitle: 'Qui escriu', // [Claude]
    orgBio: "Consultoria energètica a Girona. Revisem factures de llum i gas i fem el seguiment tot l'any per a empreses, comunitats i llars.", // [Claude]
    orgLink: 'Coneix-nos', // [Claude]
    related: 'Segueix llegint',
    back: '← Tots els articles',
    note: 'Nota',
    warning: 'Atenció',
    tableLabel: 'Taula', // [Claude]
    rssTitle: 'Blog de Logik Solutions', // [Claude]
    // Firma de los artículos sin autor personal (la organización, no una persona).
    orgByline: 'Equip de Logik Solutions',
    // Primer párrafo que empieza por "**Resposta ràpida:**" -> caja destacada.
    quickAnswer: 'Resposta ràpida',
    // Último párrafo que empieza así -> aviso final en texto pequeño.
    disclaimer: 'Aquest article és informatiu',
    // Teléfono bajo el pre-estudi embebido (CTA de cierre con study: true).
    studyCall: 'Prefereixes trucar?',
    // Esquema de 24 hores (diagram: periodes-24h).
    periodsAria: 'En dies feiners, vall de 0 a 8 h i punta-pla de 8 a 24 h; en caps de setmana i festius nacionals, tot el dia en vall.',
    periodsWorkdays: 'Dies feiners',
    periodsWeekend: 'Caps de setmana i festius',
    periodsValley: 'Vall',
    periodsPeak: 'Punta-pla',
  },
  es: {
    eyebrow: 'Blog',
    title: 'Blog de energía para empresas, comunidades y hogares',
    lead: 'Guías claras sobre la factura de la luz y el gas, la potencia, los trámites y el autoconsumo.',
    metaTitle: 'Blog de energía y factura de la luz | Logik Solutions',
    metaDescription:
      'Guías y consejos claros sobre la factura de la luz y el gas, la potencia, los trámites y el autoconsumo, de la mano de Logik Solutions, en Girona.',
    readMore: 'Leer el artículo',
    readingTime: '{n} min de lectura',
    filterLabel: 'Filtra por categoría', // [Claude]
    filterAll: 'Todos', // [Claude]
    pageLabel: 'Página {n}', // [Claude]
    prev: '← Anteriores', // [Claude]
    next: 'Siguientes →', // [Claude]
    pagination: 'Paginación del blog', // [Claude]
    ctaTitle: '¿Quieres que revisemos tu factura?',
    ctaText: 'Cuéntanos tu caso y te decimos qué miramos.',
    ctaButton: 'Revisa mi factura',
    ctaCall: 'Llama al',
    emptyTitle: 'Preparamos los primeros artículos.',
    emptyText:
      'Pronto encontrarás guías sobre la factura de la luz y el gas, la potencia y los trámites. Mientras tanto, te revisamos tu factura.',
    breadcrumb: 'Ruta de navegación', // [Claude]
    home: 'Inicio',
    by: 'Por', // [Claude]
    published: 'Publicado el', // [Claude]
    updated: 'Actualizado el',
    toc: 'En este artículo',
    faqTitle: 'Preguntas frecuentes', // [Claude]
    postCtaTitle: '¿Quieres que lo revisemos con tu factura?',
    midCtaText: '¿Quieres que lo miremos con tu factura?', // [Claude]
    midCtaLink: 'Revisa mi factura', // [Claude]
    authorTitle: 'Quién escribe', // [Claude]
    orgBio: 'Consultoría energética en Girona. Revisamos facturas de luz y gas y hacemos el seguimiento todo el año para empresas, comunidades y hogares.', // [Claude]
    orgLink: 'Conócenos', // [Claude]
    related: 'Sigue leyendo',
    back: '← Todos los artículos',
    note: 'Nota',
    warning: 'Atención',
    tableLabel: 'Tabla', // [Claude]
    rssTitle: 'Blog de Logik Solutions', // [Claude]
    orgByline: 'Equipo de Logik Solutions',
    quickAnswer: 'Respuesta rápida',
    disclaimer: 'Este artículo es informativo',
    studyCall: '¿Prefieres llamar?',
    periodsAria: 'En días laborables, valle de 0 a 8 h y punta-llano de 8 a 24 h; en fines de semana y festivos nacionales, todo el día en valle.',
    periodsWorkdays: 'Días laborables',
    periodsWeekend: 'Fines de semana y festivos',
    periodsValley: 'Valle',
    periodsPeak: 'Punta-llano',
  },
} as const satisfies Record<Locale, Record<string, string>>;

/** Opciones del plugin de Markdown (callouts, tablas, CTA a mitad de artículo, enlaces, visuales). */
export const markdownOptions = {
  midCtaMinWords: MID_CTA_MIN_WORDS,
  // Rutas internas válidas por idioma (las de src/config/pages.ts): un enlace interno del cuerpo
  // que no esté aquí (o en el blog de su idioma) rompe el build. Así ningún artículo enlaza a un
  // slug antiguo ni a la versión del otro idioma.
  internalPaths: Object.fromEntries(
    (['ca', 'es'] as const).map((l) => [l, Object.values(pages).map((p) => p[l])]),
  ) as Record<Locale, string[]>,
  blogPath: { ca: pages.blog.ca, es: pages.blog.es } as Record<Locale, string>,
  text: Object.fromEntries(
    (['ca', 'es'] as const).map((l) => [
      l,
      {
        note: blogText[l].note,
        warning: blogText[l].warning,
        table: blogText[l].tableLabel,
        midText: blogText[l].midCtaText,
        midLink: blogText[l].midCtaLink,
        midHref: blogCtaHref(l),
        callLabel: blogText[l].ctaCall,
        phoneDisplay: phone.display,
        phoneTel: phone.tel,
        quickAnswer: blogText[l].quickAnswer,
        disclaimer: blogText[l].disclaimer,
        periodsAria: blogText[l].periodsAria,
        periodsWorkdays: blogText[l].periodsWorkdays,
        periodsWeekend: blogText[l].periodsWeekend,
        periodsValley: blogText[l].periodsValley,
        periodsPeak: blogText[l].periodsPeak,
      },
    ]),
  ),
};
