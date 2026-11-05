// JSON-LD de Gestió i tràmits / Gestión y trámites en un único @graph: WebPage, BreadcrumbList
// (Inici › Gestió i tràmits), Service (proveedor: la empresa de la home por @id; zona: Girona;
// público: hogares, pymes y comunidades; sin precios ni offers) y FAQPage (las preguntas
// visibles, palabra por palabra). Sin valoraciones ni reseñas.
import type { Locale } from '../../config/pages';
import { ORG_ID } from '../../config/site';

export function gestionsSchema(o: {
  lang: Locale;
  pageUrl: string;
  homeUrl: string;
  title: string;
  description: string;
  homeName: string;
  pageName: string;
  serviceType: string;
  audience: string[];
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
        // Solo Girona: las gestiones en otras zonas no están confirmadas.
        areaServed: { '@type': 'City', name: 'Girona' },
        audience: o.audience.map((audienceType) => ({ '@type': 'Audience', audienceType })),
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
