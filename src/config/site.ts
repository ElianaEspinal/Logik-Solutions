// Datos de la empresa: única fuente para cabecera, menú, pie, barra móvil,
// formularios, páginas legales y datos estructurados.

/** Teléfono único: el mismo número sirve para llamar y para WhatsApp. */
export const phone = {
  display: '665 05 25 16',
  tel: 'tel:+34665052516',
  whatsapp: 'https://wa.me/34665052516',
  e164: '+34665052516',
} as const;

export const site = {
  name: 'Logik Solutions',
  legalName: 'LOGIK SOLUTIONS, S.L.',
  nif: 'B02961043',
  email: 'info@logiksolutions.es',
  address: {
    street: { ca: 'Carrer Creu, 43', es: 'Calle Creu, 43' },
    floor: { ca: '3r 1a', es: '3.º 1.ª' },
    // Corregido y confirmado por Eliana el 3/11/2026 (antes figuraba 17000 por error).
    postalCode: '17002',
    postalCodeVerified: true,
    locality: 'Girona',
    region: 'Catalunya',
  },
} as const;

// Dominio del entorno (SITE_URL, que Astro expone como `site`): nunca escrito a mano.
// (Al cargar astro.config.mjs aún no existe: ahí no se usan estos @id.)
const SITE_ROOT = import.meta.env.SITE ? new URL('/', import.meta.env.SITE).href : '/';
/** @id de la empresa en el JSON-LD (ProfessionalService), compartido por todas las páginas. */
export const ORG_ID = `${SITE_ROOT}#empresa`;
/** @id del fundador (Person) en el JSON-LD. */
export const FOUNDER_ID = `${SITE_ROOT}#lluis-soldevila`;

/**
 * Fundador y director (confirmado por Eliana). Sin biografía, estudios ni año de fundación:
 * no están confirmados.
 * photo: nombre de un archivo en src/assets/images/ (p. ej. 'lluis-soldevila.jpg').
 * Vacío: la página Nosaltres muestra la tarjeta de marca, sin foto.
 * Con valor: se muestra la foto (WebP, con width/height) en lugar de la tarjeta.
 */
export const founder = {
  name: 'Lluís Soldevila',
  role: { ca: 'Fundador i director de Logik Solutions', es: 'Fundador y director de Logik Solutions' },
  jobTitle: { ca: 'Fundador i director', es: 'Fundador y director' },
  photo: '',
  photoAlt: 'Lluís Soldevila, fundador y director de Logik Solutions',
} as const;

/**
 * Dirección visible (NAP), tal como figura en docs/home-textos.md (sin código postal).
 * Si la calle se vaciara, solo se muestra la localidad: nunca se inventa una calle.
 */
export const addressLine = (lang: 'ca' | 'es') =>
  site.address.street[lang]
    ? `${site.address.street[lang]}, ${site.address.floor[lang]}, ${site.address.locality}`
    : site.address.locality;

/**
 * Dirección completa y confirmada (calle, número, código postal y localidad).
 * Solo entonces va la PostalAddress en el JSON-LD de la página de contacto.
 * Código postal 17002 confirmado por Eliana el 3/11/2026.
 */
export const addressComplete =
  !!site.address.street.ca && !!site.address.postalCode && site.address.postalCodeVerified;

/** Búsqueda para Google Maps (mapa y "Com arribar"): sin calle, centrado en Girona. */
export const mapQuery = site.address.street.ca
  ? `${site.address.street.ca}, ${site.address.locality}`
  : `${site.address.locality}, ${site.address.region}`;

export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;
export const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

/**
 * Horario de atención. PENDIENTE: Logik no lo ha facilitado.
 * Mientras esté vacío no se muestra en la web ni va en el JSON-LD.
 * Ejemplo: [{ days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '14:00' }]
 * y en `hoursLabel` el texto visible: { ca: 'De dilluns a divendres, de 9 a 14 h', es: 'De lunes a viernes, de 9 a 14 h' }.
 */
export type OpeningHours = {
  days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
  opens: string;
  closes: string;
};
export const openingHours: OpeningHours[] = [];
export const hoursLabel: Record<'ca' | 'es', string> = { ca: '', es: '' };
export const hasHours = openingHours.length > 0 && !!hoursLabel.ca && !!hoursLabel.es;
