// Datos estructurados del blog, coherentes con la home: la empresa es el mismo
// ProfessionalService (@id .../#empresa), publisher de los artículos. Sin ratings ni reseñas.
import type { Locale } from '../../config/pages';
import { site } from '../../config/site';

const json = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

const publisher = (root: string, logoUrl: string) => ({
  '@type': 'ProfessionalService',
  '@id': `${root}#empresa`,
  name: site.name,
  legalName: site.legalName,
  url: root,
  logo: { '@type': 'ImageObject', url: logoUrl },
});

const breadcrumb = (id: string, items: { name: string; url: string }[]) => ({
  '@type': 'BreadcrumbList',
  '@id': id,
  itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url })),
});

export function blogIndexSchema(o: {
  lang: Locale;
  pageUrl: string;
  homeUrl: string;
  name: string;
  description: string;
  homeName: string;
  logoUrl: string;
  posts: { url: string; name: string }[];
}) {
  const root = new URL('/', o.pageUrl).href;
  return json({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `${o.pageUrl}#blog`,
        url: o.pageUrl,
        name: o.name,
        description: o.description,
        inLanguage: o.lang,
        isPartOf: { '@id': `${root}#web` },
        publisher: { '@id': `${root}#empresa` },
        breadcrumb: { '@id': `${o.pageUrl}#breadcrumb` },
        ...(o.posts.length ? { mainEntity: { '@id': `${o.pageUrl}#articles` } } : {}),
      },
      ...(o.posts.length
        ? [
            {
              '@type': 'ItemList',
              '@id': `${o.pageUrl}#articles`,
              itemListElement: o.posts.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: p.url, name: p.name })),
            },
          ]
        : []),
      publisher(root, o.logoUrl),
      breadcrumb(`${o.pageUrl}#breadcrumb`, [
        { name: o.homeName, url: o.homeUrl },
        { name: 'Blog', url: o.pageUrl },
      ]),
    ],
  });
}

export function blogPostSchema(o: {
  lang: Locale;
  pageUrl: string;
  homeUrl: string;
  blogUrl: string;
  homeName: string;
  title: string;
  description: string;
  imageUrl: string;
  logoUrl: string;
  published: Date;
  modified: Date;
  author: { name: string; jobTitle?: string; url?: string } | null;
  faq?: { q: string; a: string }[];
}) {
  const root = new URL('/', o.pageUrl).href;
  return json({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${o.pageUrl}#article`,
        headline: o.title,
        description: o.description,
        image: o.imageUrl,
        datePublished: o.published.toISOString(),
        dateModified: o.modified.toISOString(),
        inLanguage: o.lang,
        mainEntityOfPage: { '@type': 'WebPage', '@id': o.pageUrl },
        isPartOf: { '@id': `${o.blogUrl}#blog` },
        // Sin persona configurada firma la organización (no se inventan autores).
        author: o.author
          ? { '@type': 'Person', name: o.author.name, ...(o.author.jobTitle ? { jobTitle: o.author.jobTitle } : {}), ...(o.author.url ? { url: o.author.url } : {}) }
          : { '@id': `${root}#empresa` },
        publisher: { '@id': `${root}#empresa` },
      },
      publisher(root, o.logoUrl),
      breadcrumb(`${o.pageUrl}#breadcrumb`, [
        { name: o.homeName, url: o.homeUrl },
        { name: 'Blog', url: o.blogUrl },
        { name: o.title, url: o.pageUrl },
      ]),
      // FAQPage: las mismas preguntas y respuestas que se ven en la página, palabra por palabra.
      ...(o.faq?.length
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${o.pageUrl}#faq`,
              inLanguage: o.lang,
              mainEntity: o.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
            },
          ]
        : []),
    ],
  });
}
