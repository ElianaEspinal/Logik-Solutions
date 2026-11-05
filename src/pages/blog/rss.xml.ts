// RSS del blog (ca): solo artículos publicados (nunca borradores).
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { blogText } from '../../config/blog';
import { pages } from '../../config/pages';
import { getPublishedPosts, postPath } from '../../lib/blog';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPublishedPosts('ca');
  return rss({
    title: blogText.ca.rssTitle,
    description: blogText.ca.metaDescription,
    site: new URL(pages.blog.ca, site).href,
    customData: '<language>ca</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: postPath(post),
    })),
  });
};
