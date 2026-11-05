// Datos del menú principal (cabecera y panel móvil) en catalán y castellano.
// Único sitio para cambiar textos, orden o destinos del menú.
import type { Locale, PageKey } from './pages';

type T = Record<Locale, string>;

export type NavIcon = 'empresa' | 'comunitat' | 'llar' | 'solar' | 'tramits';

export type NavItem = { page: PageKey; icon: NavIcon; title: T; text: T };
export type NavGroup = { id: string; label: T; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    id: 'per-a-qui',
    label: { ca: 'Per a qui', es: 'Para quién' },
    items: [
      {
        page: 'empreses',
        icon: 'empresa',
        title: { ca: 'Empreses i pimes', es: 'Empresas y pymes' },
        text: { ca: 'Tarifes ajustades al teu horari i a la teva potència', es: 'Tarifas ajustadas a tu horario y a tu potencia' },
      },
      {
        page: 'comunitats',
        icon: 'comunitat',
        title: { ca: 'Comunitats de veïns', es: 'Comunidades de vecinos' },
        text: { ca: "Zones comunes coordinades amb l'administrador", es: 'Zonas comunes coordinadas con el administrador' },
      },
      {
        page: 'llars',
        icon: 'llar',
        title: { ca: 'Llars', es: 'Hogares' },
        text: { ca: 'Llum i gas explicats amb paraules senzilles', es: 'Luz y gas explicados con palabras sencillas' },
      },
    ],
  },
  {
    id: 'serveis',
    label: { ca: 'Serveis', es: 'Servicios' },
    items: [
      {
        page: 'autoconsum',
        icon: 'solar',
        title: { ca: 'Autoconsum fotovoltaic', es: 'Autoconsumo fotovoltaico' },
        text: { ca: "Estudi del teu consum, amb enginyers i instal·ladors", es: 'Estudio de tu consumo, con ingenieros e instaladores' },
      },
      {
        page: 'gestio',
        icon: 'tramits',
        title: { ca: 'Gestió i tràmits', es: 'Gestión y trámites' },
        text: { ca: 'Titularitat, potència i altes noves', es: 'Titularidad, potencia y altas nuevas' },
      },
    ],
  },
];

export const navLinks: { page: PageKey; label: T }[] = [
  { page: 'comTreballem', label: { ca: 'Com treballem', es: 'Cómo trabajamos' } },
  { page: 'nosaltres', label: { ca: 'Nosaltres', es: 'Nosotros' } },
  { page: 'blog', label: { ca: 'Blog', es: 'Blog' } },
  { page: 'contacte', label: { ca: 'Contacte', es: 'Contacto' } },
];

export const navText = {
  label: { ca: 'Menú principal', es: 'Menú principal' },
  open: { ca: 'Obrir el menú', es: 'Abrir el menú' },
  close: { ca: 'Tanca el menú', es: 'Cierra el menú' },
  call: { ca: "Truca'ns al", es: 'Llámanos al' },
  cta: { ca: 'Demana el teu estudi', es: 'Pide tu estudio' },
  featuredTitle: { ca: 'Demana el teu estudi', es: 'Pide tu estudio' },
  featuredText: {
    ca: 'Revisem la teva factura. Sense cost per a tu: ens remunera la comercialitzadora.',
    es: 'Revisamos tu factura. Sin coste para ti: nos remunera la comercializadora.',
  },
  /** Solo en Autoconsum fotovoltaic: sin "sense cost" (la instalación tiene coste). */
  featuredTextSolar: { ca: 'Revisem la teva factura.', es: 'Revisamos tu factura.' },
  featuredCall: { ca: 'o truca al', es: 'o llama al' },
} satisfies Record<string, T>;
