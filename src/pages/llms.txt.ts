// /llms.txt (formato llmstxt.org), generado en cada build: descripción de la empresa,
// páginas indexables y una sección "Blog" por idioma con los artículos publicados
// (título, URL y description). Nunca incluye borradores (solo existen en staging) ni páginas de la lista blanca de noindex.
import type { APIRoute } from 'astro';
import { locales, pages, type Locale, type PageEntry, type PageKey } from '../config/pages';
import { phone, site } from '../config/site';
import { absoluteUrl } from '../i18n/utils';
import { blogIndexIndexable, getPublishedPosts, postLang, postPath } from '../lib/blog';

/** Descripción opcional de cada página en llms.txt ("- [Nombre](url): descripción"). */
const descriptions: Partial<Record<PageKey, Record<Locale, string>>> = {
  empreses: {
    ca: "Consultoria energètica per a pimes i empreses a Girona i a tot Espanya: revisem la factura de llum i gas del negoci, comparem ofertes de diverses comercialitzadores, fem els tràmits i el seguiment tot l'any, amb avís de renovació al mes 11. Sense cost per a l'empresa en consultoria i gestions: ens remunera la comercialitzadora.",
    es: 'Consultoría energética para pymes y empresas en Girona y toda España: revisamos la factura de luz y gas del negocio, comparamos ofertas de varias comercializadoras, hacemos los trámites y el seguimiento todo el año, con aviso de renovación en el mes 11. Sin coste para la empresa en consultoría y gestiones: nos remunera la comercializadora.',
  },
  // Sin placas solares mientras COMUNITATS_FV = false (src/config/comunitats.ts).
  comunitats: {
    ca: "Consultoria energètica per a comunitats de veïns a Girona: un sol interlocutor per a l'administrador de finques i els veïns. Revisem els subministraments de les zones comunes (ascensors, enllumenat), comparem ofertes de diverses comercialitzadores, fem els tràmits i el seguiment mensual i anual, amb avís de renovació al mes 11. Sense cost per a la comunitat en consultoria i gestions: ens remunera la comercialitzadora.",
    es: 'Consultoría energética para comunidades de vecinos en Girona: un solo interlocutor para el administrador de fincas y los vecinos. Revisamos los suministros de las zonas comunes (ascensores, alumbrado), comparamos ofertas de varias comercializadoras, hacemos los trámites y el seguimiento mensual y anual, con aviso de renovación en el mes 11. Sin coste para la comunidad en consultoría y gestiones: nos remunera la comercializadora.',
  },
  // Sin "sense cost": la instalación tiene coste. Instalaciones solo en Girona y localidades cercanas.
  autoconsum: {
    ca: "Plaques solars a Girona per a llars, comunitats de veïns i pimes. Primer estudiem el consum i expliquem si l'autoconsum fotovoltaic té sentit abans de parlar d'instal·lar; la instal·lació la fan enginyers i especialistes en instal·lació i té un cost. També expliquem què passa amb els excedents. Base a Girona, amb visites presencials a localitats properes.",
    es: 'Placas solares en Girona para hogares, comunidades de vecinos y pymes. Primero estudiamos el consumo y explicamos si el autoconsumo fotovoltaico tiene sentido antes de hablar de instalar; la instalación la hacen ingenieros y especialistas en instalación y tiene un coste. También explicamos qué pasa con los excedentes. Base en Girona, con visitas presenciales en localidades cercanas.',
  },
  llars: {
    ca: "Assessor energètic per a particulars i llars a Girona i a tot Espanya: t'expliquem la factura de la llum i del gas amb paraules senzilles (potència, energia i impostos i altres conceptes), comparem les tarifes de diverses comercialitzadores, fem els tràmits (titularitat, potència i altes) i el seguiment mensual i anual, amb avís de renovació al mes 11. Sense cost per a tu en consultoria i gestions: ens remunera la comercialitzadora.",
    es: 'Asesor energético para particulares y hogares en Girona y toda España: te explicamos la factura de la luz y del gas con palabras sencillas (potencia, energía e impuestos y otros conceptos), comparamos las tarifas de varias comercializadoras, hacemos los trámites (titularidad, potencia y altas) y el seguimiento mensual y anual, con aviso de renovación en el mes 11. Sin coste para ti en consultoría y gestiones: nos remunera la comercializadora.',
  },
  // Incluidas en el servicio anual (no se contratan sueltas). Zona confirmada: Girona y alrededores.
  gestio: {
    ca: "Canvis de titularitat de la llum, pujades i baixades de potència i altes noves per a llars, negocis i comunitats de veïns, amb tracte directe amb les companyies. No són un servei independent: van incloses al servei anual de Logik Solutions durant tot l'any, juntament amb la resolució d'incidències i el seguiment mensual i anual (renovació agendada al mes 11). Base a Girona, amb visites presencials a localitats properes.",
    es: 'Cambios de titularidad de la luz, subidas y bajadas de potencia y altas nuevas para hogares, negocios y comunidades de vecinos, con trato directo con las compañías. No son un servicio independiente: van incluidas en el servicio anual de Logik Solutions durante todo el año, junto con la resolución de incidencias y el seguimiento mensual y anual (renovación agendada en el mes 11). Base en Girona, con visitas presenciales en localidades cercanas.',
  },
};

const heading: Record<Locale, { pages: string; blog: string }> = {
  ca: { pages: 'Pàgines (català)', blog: 'Blog (català)' },
  es: { pages: 'Páginas (castellano)', blog: 'Blog (castellano)' },
};

export const GET: APIRoute = async ({ site: base }) => {
  const url = (path: string) => absoluteUrl(path, base);
  const posts = await getPublishedPosts();
  const lines: string[] = [
    `# ${site.name}`,
    '',
    `> ${site.name} (${site.legalName}) és una consultoria energètica amb base a Girona per a empreses, comunitats de veïns i llars: revisa factures de llum i gas, compara ofertes de diverses comercialitzadores, fa les gestions (titularitat, potència, altes) i el seguiment durant l'any, i estudia instal·lacions d'autoconsum fotovoltaic. Treballa a Girona, a Catalunya i a tota Espanya. / Consultoría energética con base en Girona para empresas, comunidades de vecinos y hogares.`,
    '',
    `Contacte / Contacto: ${phone.display} (telèfon i WhatsApp) · ${site.email}`,
    '',
  ];

  for (const lang of locales) {
    lines.push(`## ${heading[lang].pages}`, '');
    for (const [key, route] of Object.entries(pages) as [PageKey, PageEntry][]) {
      if (route.draft) continue;
      if (route === pages.blog && !(await blogIndexIndexable(lang))) continue;
      const desc = descriptions[key]?.[lang];
      lines.push(`- [${route.name[lang]}](${url(route[lang])})${desc ? `: ${desc}` : ''}`);
    }
    lines.push('');
  }

  for (const lang of locales) {
    const list = posts.filter((p) => postLang(p) === lang);
    if (!list.length) continue;
    lines.push(`## ${heading[lang].blog}`, '');
    for (const post of list) lines.push(`- [${post.data.title}](${url(postPath(post))}): ${post.data.description}`);
    lines.push('');
  }

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
