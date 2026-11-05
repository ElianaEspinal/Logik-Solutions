// JSON-LD de Comunitats de veïns / Comunidades de vecinos en un único @graph: WebPage,
// BreadcrumbList (Inici › Comunitats de veïns), Service (proveedor: la empresa de la home por @id;
// público: comunidades de vecinos y administradores de fincas; sin precios ni offers) y FAQPage
// (las preguntas visibles, palabra por palabra). Sin valoraciones ni reseñas.
import type { Locale } from '../../config/pages';
import { ORG_ID } from '../../config/site';

export function communitiesSchema(o: {
  lang: Locale;
  pageUrl: string;
  homeUrl: string;
  title: string;
  description: string;
  homeName: string;
  pageName: string;
  serviceType: string;
  audience: { communities: string; administrators: string };
  faq: { q: string; a: string }[];
}) {
  const root = new URL('/', o.pageUrl).href;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${o.pageUrl}#pagina`,
        url: o.pageUrl,
        name: o.title,
        description: o.description,
        inLanguage: o.lang,
        isPartOf: { '@id': `${root}#web` },
        about: { '@id': `${o.pageUrl}#servei` },
        breadcrumb: { '@id': `${o.pageUrl}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${o.pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: o.homeName, item: o.homeUrl },
          { '@type': 'ListItem', position: 2, name: o.pageName, item: o.pageUrl },
        ],
      },
      {
        '@type': 'Service',
        '@id': `${o.pageUrl}#servei`,
        serviceType: o.serviceType,
        name: o.serviceType,
        description: o.description,
        url: o.pageUrl,
        provider: { '@id': ORG_ID },
        areaServed: [
          { '@type': 'City', name: 'Girona' },
          { '@type': 'AdministrativeArea', name: o.lang === 'ca' ? 'Catalunya' : 'Cataluña' },
          { '@type': 'Country', name: o.lang === 'ca' ? 'Espanya' : 'España' },
        ],
        audience: [
          { '@type': 'Audience', audienceType: o.audience.communities },
          { '@type': 'Audience', audienceType: o.audience.administrators },
        ],
        inLanguage: o.lang,
      },
      {
        '@type': 'FAQPage',
        '@id': `${o.pageUrl}#faq`,
        inLanguage: o.lang,
        mainEntity: o.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  }).replace(/</g, '\\u003c');
}
