// JSON-LD de Nosaltres / Nosotros en un único @graph: AboutPage, Person (Lluís Soldevila),
// la empresa (mismo @id que en la home: ORG_ID), FAQPage (las 4 preguntas visibles, palabra
// por palabra) y BreadcrumbList. Sin image ni sameAs del fundador (no existen), sin ratings.
import type { Locale } from '../../config/pages';
import { FOUNDER_ID, ORG_ID, founder, site } from '../../config/site';

export function aboutSchema(o: {
  lang: Locale;
  pageUrl: string;
  homeUrl: string;
  title: string;
  description: string;
  logoUrl: string;
  homeName: string;
  pageName: string;
  faq: { q: string; a: string }[];
}) {
  const root = new URL('/', o.pageUrl).href;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': `${o.pageUrl}#pagina`,
        url: o.pageUrl,
        name: o.title,
        description: o.description,
        inLanguage: o.lang,
        isPartOf: { '@id': `${root}#web` },
        about: { '@id': ORG_ID },
        mainEntity: { '@id': ORG_ID },
        breadcrumb: { '@id': `${o.pageUrl}#breadcrumb` },
      },
      {
        '@type': 'Person',
        '@id': FOUNDER_ID,
        name: founder.name,
        jobTitle: founder.jobTitle[o.lang],
        worksFor: { '@id': ORG_ID },
      },
      {
        '@type': 'ProfessionalService',
        '@id': ORG_ID,
        name: site.name,
        legalName: site.legalName,
        url: root,
        logo: o.logoUrl,
        founder: { '@id': FOUNDER_ID },
      },
      {
        '@type': 'FAQPage',
        '@id': `${o.pageUrl}#faq`,
        inLanguage: o.lang,
        mainEntity: o.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${o.pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: o.homeName, item: o.homeUrl },
          { '@type': 'ListItem', position: 2, name: o.pageName, item: o.pageUrl },
        ],
      },
    ],
  }).replace(/</g, '\\u003c');
}
