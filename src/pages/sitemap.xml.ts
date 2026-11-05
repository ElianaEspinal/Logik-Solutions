import type { APIRoute } from 'astro';
import { locales, pages, type PageEntry } from '../config/pages';
import { absoluteUrl, getHreflangLinks, type Alternates } from '../i18n/utils';
import { blogIndexIndexable, getPostAlternates, getPublishedPosts, pageCount, pagePath, postLang, postPath } from '../lib/blog';

type Entry = { path: string; alternates: Alternates; lastmod?: Date };

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const entries: Entry[] = [];

  for (const route of Object.values(pages) as PageEntry[]) {
    if (route.draft) continue; // borradores: solo existen en staging, nunca en el sitemap
    for (const lang of locales) {
      // Índice del blog: solo con artículos publicados en ese idioma (regla única de src/lib/blog.ts).
      if (route === pages.blog && !(await blogIndexIndexable(lang))) continue;
      entries.push({ path: route[lang], alternates: route });
    }
  }

  // Páginas 2, 3… del índice del blog (solo existen con más de 9 artículos).
  const posts = await getPublishedPosts();
  const totals = Object.fromEntries(locales.map((l) => [l, pageCount(posts.filter((p) => postLang(p) === l).length)]));
  for (const lang of locales) {
    for (let n = 2; n <= totals[lang]; n++) {
      const alternates: Alternates = Object.fromEntries(locales.filter((l) => n <= totals[l]).map((l) => [l, pagePath(l, n)]));
      entries.push({ path: pagePath(lang, n), alternates });
    }
  }

  for (const post of posts) {
    entries.push({
      path: postPath(post),
      alternates: getPostAlternates(post, posts),
      lastmod: post.data.updatedDate ?? post.data.pubDate,
    });
  }

  const urls = entries.map(({ path, alternates, lastmod }) => {
    const lines = [`<loc>${escapeXml(absoluteUrl(path, site))}</loc>`];
    if (lastmod) lines.push(`<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>`);
    for (const link of getHreflangLinks(alternates, site)) {
      lines.push(`<xhtml:link rel="alternate" hreflang="${link.hreflang}" href="${escapeXml(link.href)}"/>`);
    }
    return `<url>${lines.join('')}</url>`;
  });

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.join('\n') +
    '\n</urlset>\n';

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
