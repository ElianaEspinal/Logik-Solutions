// JSON-LD de Com treballem / Cómo trabajamos en un único @graph: WebPage, BreadcrumbList
// (Inici › Com treballem) y FAQPage con los cinco escenarios (pregunta completa y respuesta,
// palabra por palabra iguales a las visibles). Sin HowTo, sin valoraciones ni reseñas.
import type { Locale } from '../../config/pages';
import { ORG_ID } from '../../config/site';

export function howSchema(o: {
  lang: Locale;
  pageUrl: string;
  homeUrl: string;
  title: string;
  description: string;
  homeName: string;
  pageName: string;
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
        about: { '@id': ORG_ID },
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
        '@type': 'FAQPage',
        '@id': `${o.pageUrl}#faq`,
        inLanguage: o.lang,
        mainEntity: o.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  }).replace(/</g, '\\u003c');
}
