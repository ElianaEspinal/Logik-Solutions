// RSS del blog (es): solo artículos publicados (nunca borradores).
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { blogText } from '../../../config/blog';
import { pages } from '../../../config/pages';
import { getPublishedPosts, postPath } from '../../../lib/blog';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPublishedPosts('es');
  return rss({
    title: blogText.es.rssTitle,
    description: blogText.es.metaDescription,
    site: new URL(pages.blog.es, site).href,
    customData: '<language>es</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: postPath(post),
    })),
  });
};
