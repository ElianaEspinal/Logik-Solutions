// Envío común de los formularios (contacto, cierre de la home y pre-estudi) a /api/enviar.php.
// Servidor y capas de seguridad: public/api/ y docs/formulario.md.
//
// - Sello antispam: se pide a /api/token.php (POST) en la PRIMERA interacción con el formulario
//   (focusin), nunca al cargar la página. Si al enviar aún no lo hay, se pide en ese momento.
// - El servidor trata como spam un envío a menos de 3 s del sello: aquí se espera lo necesario
//   (3,5 s desde que llegó el sello) antes de enviar, para no perder nunca a una persona rápida.
// - 409 sello_caducado (página abierta más de 2 h): se pide un sello nuevo, se esperan 3,5 s y se
//   reintenta UNA vez de forma automática, sin tocar lo que ha escrito la persona.
// - Fotos: se comprimen con canvas (lado mayor 2.000 px, calidad 0,8). Si falla, va el original.
// Nunca se envían datos personales a la analítica ni a la consola.

export const TOKEN_URL = '/api/token.php';
export const SEND_URL = '/api/enviar.php';
const WAIT_MS = 3_500;

type Seal = { ts: string; nonce: string; firma: string; at: number };

export type Discarded = { nombre: string; motivo: string };
export type SendResult =
  | { kind: 'ok'; discarded: Discarded[]; notSent: string[] }
  | { kind: 'invalid'; errors: Record<string, string> }
  | { kind: 'limit' }
  | { kind: 'tooLarge' }
  | { kind: 'failed' };

const seals = new WeakMap<HTMLFormElement, Promise<Seal | null>>();
const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, Math.max(0, ms)));
const lang = (form: HTMLFormElement) => ((form.elements.namedItem('idioma') as HTMLInputElement | null)?.value === 'es' ? 'es' : 'ca');

async function requestSeal(form: HTMLFormElement): Promise<Seal | null> {
  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      body: new URLSearchParams({ idioma: lang(form) }),
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, unknown>;
    if (typeof data.nonce !== 'string' || typeof data.firma !== 'string' || data.ts === undefined) return null;
    return { ts: String(data.ts), nonce: data.nonce, firma: data.firma, at: Date.now() };
  } catch {
    return null;
  }
}

/** Pide el sello en la primera interacción con el formulario (una sola vez). */
export function armSeal(form: HTMLFormElement) {
  form.addEventListener('focusin', () => {
    if (!seals.has(form)) seals.set(form, requestSeal(form));
  });
}

async function currentSeal(form: HTMLFormElement, fresh = false): Promise<Seal | null> {
  let pending = fresh ? undefined : seals.get(form);
  if (!pending) {
    pending = requestSeal(form);
    seals.set(form, pending);
  }
  const seal = await pending;
  if (!seal) seals.delete(form); // el próximo intento lo vuelve a pedir
  return seal;
}

/** Envía el FormData (con el sello) y traduce la respuesta del servidor. */
export async function submitForm(form: HTMLFormElement, data: FormData): Promise<SendResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const seal = await currentSeal(form, attempt > 0);
    if (!seal) return { kind: 'failed' };
    await sleep(seal.at + WAIT_MS - Date.now());
    data.set('ts', seal.ts);
    data.set('nonce', seal.nonce);
    data.set('firma', seal.firma);

    let response: Response;
    try {
      response = await fetch(SEND_URL, { method: 'POST', body: data, headers: { Accept: 'application/json' }, credentials: 'same-origin' });
    } catch {
      return { kind: 'failed' };
    }
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (response.status === 409 && body.codigo === 'sello_caducado') continue; // sello nuevo y un reintento
    if (response.ok && body.ok === true) {
      seals.delete(form); // el sello ya se ha usado
      const discarded = Array.isArray(body.descartados) ? (body.descartados as Discarded[]) : [];
      // El correo salió sin los adjuntos (reintento del servidor tras un fallo con adjuntos).
      const notSent = Array.isArray(body.adjuntos_no_enviados) ? body.adjuntos_no_enviados.map(String) : [];
      return { kind: 'ok', discarded, notSent };
    }
    if (response.status === 422) {
      const errors = body.errores && typeof body.errores === 'object' ? (body.errores as Record<string, string>) : {};
      return { kind: 'invalid', errors };
    }
    if (response.status === 429) return { kind: 'limit' };
    if (response.status === 413) return { kind: 'tooLarge' };
    return { kind: 'failed' };
  }
  return { kind: 'failed' };
}

// --- Fotos ---------------------------------------------------------------------------------------

const MAX_SIDE = 2000;
const QUALITY = 0.8;

/** Comprime una foto con canvas (JPEG, lado mayor 2.000 px). Los PDF no se tocan. Si falla, el original. */
export async function compressImage(file: File): Promise<File> {
  if (!/\.(jpe?g|png|webp)$/i.test(file.name)) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#fff'; // sin transparencias en JPEG
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    return file;
  }
}

/** Añade los archivos (fotos comprimidas) al FormData como factura[]. */
export async function appendFiles(data: FormData, files: File[]): Promise<File[]> {
  data.delete('factura[]');
  data.delete('factura');
  const ready = await Promise.all(files.map(compressImage));
  for (const file of ready) data.append('factura[]', file, file.name);
  return ready;
}
