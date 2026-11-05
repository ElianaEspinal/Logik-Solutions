import { getCollection, type CollectionEntry } from 'astro:content';
import { AUTHORS, DEFAULT_AUTHOR, POSTS_PER_PAGE, WORDS_PER_MINUTE, type Author } from '../config/blog';
import { locales, pages, type Locale } from '../config/pages';
import type { Alternates } from '../i18n/utils';

export type Post = CollectionEntry<'blog'>;

// Borradores (draft: true): SOLO en `npm run dev`. Nunca en ningún build (producción ni staging),
// así que tampoco en el índice, el sitemap, el RSS ni llms.txt. check-build lo vuelve a comprobar.
const showDrafts = import.meta.env.DEV;

export function postLang(post: Post): Locale {
  const lang = post.id.split('/')[0];
  if (!locales.includes(lang as Locale)) throw new Error(`Idioma desconocido en ${post.id}`);
  return lang as Locale;
}

/** Slug de la URL: el del frontmatter o, si no hay, el nombre del archivo. */
export function postSlug(post: Post): string {
  return post.data.slug ?? post.id.split('/').slice(1).join('/');
}

export function postPath(post: Post): string {
  return `${pages.blog[postLang(post)]}${postSlug(post)}/`;
}

// Mientras no haya ningún archivo no se consulta la colección (Astro avisaría de que está vacía).
const hasPostFiles = Object.keys(import.meta.glob('../content/blog/{ca,es}/*.md')).length > 0;

async function load(includeDrafts: boolean): Promise<Post[]> {
  if (!hasPostFiles) return [];
  const posts = await getCollection('blog', (p) => includeDrafts || !p.data.draft);
  // Slugs únicos por idioma (dos archivos con el mismo slug romperían la build en silencio).
  const seen = new Set<string>();
  for (const p of posts) {
    const key = postPath(p);
    if (seen.has(key)) throw new Error(`Slug repetido en el blog: ${key} (${p.id})`);
    seen.add(key);
  }
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Artículos que se muestran (con borradores en desarrollo), del más reciente al más antiguo. */
export async function getPosts(lang?: Locale): Promise<Post[]> {
  return (await load(showDrafts)).filter((p) => !lang || postLang(p) === lang);
}

/** Artículos publicados (nunca borradores, tampoco en desarrollo). */
export async function getPublishedPosts(lang?: Locale): Promise<Post[]> {
  return (await load(false)).filter((p) => !lang || postLang(p) === lang);
}

/**
 * Regla única de indexación del índice del blog (página 1): se indexa y entra en el sitemap
 * solo si hay al menos un artículo publicado en ese idioma. Con 0: "noindex, follow".
 * La usan src/components/blog/blog-index.astro y src/pages/sitemap.xml.ts; check-build la comprueba.
 */
export async function blogIndexIndexable(lang: Locale): Promise<boolean> {
  return (await getPublishedPosts(lang)).length > 0;
}

export const pageCount = (n: number) => Math.max(1, Math.ceil(n / POSTS_PER_PAGE));
export const pagePath = (lang: Locale, page: number) => (page <= 1 ? pages.blog[lang] : `${pages.blog[lang]}pagina/${page}/`);

export function getPostAlternates(post: Post, all: Post[]): Alternates {
  const alternates: Alternates = { [postLang(post)]: postPath(post) };
  const key = post.data.translationKey;
  if (!key) return alternates;
  for (const other of all) {
    if (other === post || other.data.translationKey !== key) continue;
    const lang = postLang(other);
    if (lang === postLang(post) || alternates[lang]) {
      throw new Error(`translationKey "${key}" repetido en ${other.id}`);
    }
    // Un borrador no puede ser la alternativa de un artículo publicado.
    if (other.data.draft && !post.data.draft) continue;
    alternates[lang] = postPath(other);
  }
  return alternates;
}

/** Palabras del cuerpo (sin sintaxis de Markdown) y tiempo de lectura: palabras ÷ 200, mínimo 1 min. */
export function wordCount(post: Post): number {
  const body = (post.body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`|~-]/g, ' ');
  return (body.match(/[\p{L}\p{N}]+(?:['\u2019][\p{L}\p{N}]+)*/gu) ?? []).length;
}

export const readingMinutes = (post: Post) => Math.max(1, Math.round(wordCount(post) / WORDS_PER_MINUTE));

/** Persona configurada (AUTHORS) o null: entonces firma la organización Logik Solutions. */
export function postAuthor(post: Post): (Author & { key: string }) | null {
  const key = post.data.author ?? DEFAULT_AUTHOR;
  return key && AUTHORS[key] ? { key, ...AUTHORS[key] } : null;
}

/** "Segueix llegint": hasta 2, primero de la misma categoría y luego los más recientes del mismo idioma. */
export function relatedPosts(post: Post, all: Post[], max = 2): Post[] {
  const lang = postLang(post);
  const others = all.filter((p) => p !== post && postLang(p) === lang && (!p.data.draft || post.data.draft));
  const same = others.filter((p) => p.data.category === post.data.category);
  const rest = others.filter((p) => p.data.category !== post.data.category);
  return [...same, ...rest].slice(0, max);
}

/** "3 de novembre de 2026" / "3 de noviembre de 2026". (El ICU catalán pone "del" ante el año: se normaliza a "de".) */
export const formatDate = (date: Date, lang: Locale) =>
  new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(date)
    .replace(/ del (\d{4})$/, ' de $1');

export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
