import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { AUTHORS, CATEGORY_KEYS } from './config/blog';

// Un archivo por artículo e idioma: src/content/blog/{ca|es}/<archivo>.md.
// El id es "ca/<archivo>" (el idioma sale de la carpeta); la URL usa `slug` (o el nombre del archivo).
// Guía y ejemplo completo: docs/blog-guia.md.
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug: minúsculas, sin acentos ni espacios, palabras separadas por guiones');

const blog = defineCollection({
  loader: glob({
    pattern: '{ca,es}/*.md',
    base: './src/content/blog',
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''),
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        // H1 visible si ha de ser distinto del title (meta). Sin h1, el H1 es el title.
        h1: z.string().min(1).optional(),
        // Meta description: 155 caracteres como máximo (el build avisa si se pasa).
        description: z.string().min(1),
        slug: slug.refine((s) => s !== 'pagina' && s !== 'rss', 'slug reservado (pagina, rss)').optional(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        category: z.enum(CATEGORY_KEYS),
        tags: z.array(z.string().min(1)).optional(),
        // Portada opcional: original (PNG/JPG) en src/assets/blog/; el build genera WebP 480/768/1200
        // y la imagen para compartir 1200 × 630. Sin portada se muestra la de marca (degradado).
        cover: image().optional(),
        coverAlt: z.string().min(1).optional(),
        // Encuadre del recorte (object-position), p. ej. '50% 20%'. Por defecto, centrado.
        coverPosition: z.string().regex(/^\d{1,3}% \d{1,3}%$/,'coverPosition: "X% Y%"').optional(),
        // Clave de src/config/blog.ts (AUTHORS). Sin autor firma Logik Solutions.
        author: z
          .string()
          .refine((key) => key in AUTHORS, { message: 'author: no existe en AUTHORS (src/config/blog.ts)' })
          .optional(),
        // Mismo valor en el artículo catalán y en su versión castellana.
        translationKey: z.string().regex(/^[a-z0-9-]+$/).optional(),
        draft: z.boolean().default(false),
        faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).optional(),
        // CTA de cierre propio del artículo (sustituye al genérico). section: valor de cta_click.
        // - Con button: bloque con botón al pre-estudi de la home.
        // - Con study: true: el pre-estudi embebido en el artículo (mismo componente que las páginas
        //   de servicio), con su título = title y pagina_origen = origin; cta_click va en el teléfono.
        cta: z
          .object({
            title: z.string().min(1),
            button: z.string().min(1).optional(),
            section: z.string().regex(/^[a-z0-9_]+$/),
            study: z.boolean().default(false),
            origin: z.string().regex(/^[a-z0-9_]+$/).optional(),
          })
          .refine((c) => (c.study ? !!c.origin : !!c.button), {
            message: 'cta: con study: true hace falta origin; sin study, button',
          })
          .optional(),
        // Visual propio insertado en el cuerpo por src/lib/markdown/rehype-blog.mjs (después de la
        // primera tabla). El texto del artículo no cambia.
        diagram: z.enum(['periodes-24h']).optional(),
      })
      .refine((d) => !d.cover || !!d.coverAlt, { message: 'coverAlt es obligatorio si hay portada', path: ['coverAlt'] }),
});

export const collections = { blog };
