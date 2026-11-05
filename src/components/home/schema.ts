import type { Locale } from '../../config/pages';
import { FOUNDER_ID, founder, phone, site } from '../../config/site';
import type { HomeContent } from './types';

// Datos estructurados de la home (docs/home-textos.md, "Notas para Claude Code"):
// ProfessionalService, WebSite y FAQPage con las mismas 10 preguntas visibles (texto idéntico).
// Sin aggregateRating ni reseñas mientras no haya reseñas reales publicadas.
// Código postal 17002, confirmado por Eliana el 3/11/2026 (src/config/site.ts).
export function homeSchema(content: HomeContent, lang: Locale, pageUrl: string, description: string, logoUrl: string) {
  const root = new URL('/', pageUrl).href;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfessionalService',
        '@id': `${root}#empresa`,
        name: site.name,
        legalName: site.legalName,
        taxID: site.nif,
        url: root,
        logo: logoUrl,
        image: logoUrl,
        description,
        telephone: phone.e164,
        email: site.email,
        // Fundador: mismo @id que el Person de la página Nosaltres.
        founder: { '@type': 'Person', '@id': FOUNDER_ID, name: founder.name },
        address: {
          '@type': 'PostalAddress',
          streetAddress: `${site.address.street[lang]}, ${site.address.floor[lang]}`,
          postalCode: site.address.postalCode,
          addressLocality: site.address.locality,
          addressRegion: site.address.region,
          addressCountry: 'ES',
        },
        areaServed: [
          { '@type': 'City', name: 'Girona' },
          { '@type': 'AdministrativeArea', name: lang === 'ca' ? 'Catalunya' : 'Cataluña' },
          { '@type': 'Country', name: lang === 'ca' ? 'Espanya' : 'España' },
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          telephone: phone.e164,
          availableLanguage: ['ca', 'es'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${root}#web`,
        url: root,
        name: site.name,
        inLanguage: lang,
        publisher: { '@id': `${root}#empresa` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        url: pageUrl,
        inLanguage: lang,
        mainEntity: content.faq.items.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  }).replace(/</g, '\\u003c');
}
