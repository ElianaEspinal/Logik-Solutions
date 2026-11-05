// Logos de clientes (permiso confirmado por Eliana).
// Fuente preferida: src/assets/images/clients/<archivo>.png (PNG con fondo transparente).
// Mientras esa carpeta no exista se usan los recortes actuales de src/assets/images/
// (fondo blanco, baja resolución). Basta con copiar los PNG transparentes en clients/
// con el mismo nombre: no hay que tocar código. Los PNG no se modifican; Astro genera
// AVIF/WebP con transparencia en el build.
import type { ImageMetadata } from 'astro';

type Mod = { default: ImageMetadata };
const transparent = import.meta.glob<Mod>('../assets/images/clients/*.png', { eager: true });
const legacy = import.meta.glob<Mod>(
  '../assets/images/{tastum-grup,hospital-veterinari-costa-brava,cannelonia,nord-1904,cideko,tonys-figueres,l-alqueria,la-maglia,muy-mucho,resguard-dels-vents,tallers-llom,wellness-place,vilanova}.png',
  { eager: true },
);

const list: [file: string, name: string][] = [
  ['tastum-grup', 'Tastum Grup'],
  ['hospital-veterinari-costa-brava', 'Hospital Veterinari Costa Brava'],
  ['cannelonia', 'Cannelonia'],
  ['nord-1904', 'Nord 1901'], // el archivo se llama nord-1904, pero el logo pone «Nord 1901»
  ['cideko', 'Cideko'],
  ['tonys-figueres', "Tony's Figueres"],
  ['l-alqueria', "L'Alqueria"],
  ['la-maglia', 'La Maglia'],
  ['muy-mucho', 'Muy Mucho'],
  ['resguard-dels-vents', 'Resguard dels Vents'],
  ['tallers-llom', 'Tallers Llom'],
  ['wellness-place', 'Wellness Place'],
  ['vilanova', 'Vilanova'],
];

export type Client = { name: string; logo: ImageMetadata; transparent: boolean };

export const clients: Client[] = list.flatMap(([file, name]) => {
  const t = transparent[`../assets/images/clients/${file}.png`];
  const l = legacy[`../assets/images/${file}.png`];
  const mod = t ?? l;
  return mod ? [{ name, logo: mod.default, transparent: !!t }] : [];
});

/** Altura de pantalla uniforme (ancho automático), sin superar nunca el tamaño natural. */
export function logoSize(logo: ImageMetadata, height: number, maxWidth = 168) {
  const scale = Math.min(height / logo.height, maxWidth / logo.width, 1);
  return { width: Math.round(logo.width * scale), height: Math.round(logo.height * scale) };
}
