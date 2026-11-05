import type { Locale } from '../../config/pages';
import { addressComplete, hasHours, openingHours, phone, site } from '../../config/site';

// Datos estructurados de la página de contacto: un único @graph con ContactPage,
// ProfessionalService (mismo @id que en la home) y BreadcrumbList.
// - address solo con dirección completa y confirmada (hoy no: código postal sin verificar).
// - openingHoursSpecification solo si hay horario en src/config/site.ts.
// - Sin ratings ni reseñas.
export function contactSchema(opts: {
  lang: Locale;
  pageUrl: string;
  homeUrl: string;
  title: string;
  description: string;
  logoUrl: string;
  breadcrumb: [string, string];
}) {
  const { lang, pageUrl, homeUrl, title, description, logoUrl, breadcrumb } = opts;
  const root = new URL('/', pageUrl).href;
  const business: Record<string, unknown> = {
    '@type': 'ProfessionalService',
    '@id': `${root}#empresa`,
    name: site.name,
    legalName: site.legalName,
    url: root,
    logo: logoUrl,
    image: logoUrl,
    telephone: phone.e164,
    email: site.email,
    areaServed: [
      { '@type': 'City', name: 'Girona' },
      { '@type': 'AdministrativeArea', name: 'Catalunya' },
      { '@type': 'Country', name: lang === 'ca' ? 'Espanya' : 'España' },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: phone.e164,
      email: site.email,
      availableLanguage: ['ca', 'es'],
    },
  };
  if (addressComplete) {
    business.address = {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.street[lang]}, ${site.address.floor[lang]}`,
      postalCode: site.address.postalCode,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      addressCountry: 'ES',
    };
  }
  if (hasHours) {
    business.openingHoursSpecification = openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    }));
  }

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        '@id': `${pageUrl}#pagina`,
        url: pageUrl,
        name: title,
        description,
        inLanguage: lang,
        isPartOf: { '@id': `${root}#web` },
        about: { '@id': `${root}#empresa` },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
      },
      business,
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: breadcrumb[0], item: homeUrl },
          { '@type': 'ListItem', position: 2, name: breadcrumb[1], item: pageUrl },
        ],
      },
    ],
  }).replace(/</g, '\\u003c');
}
