// Zona de adjuntos (src/components/file-drop.astro): elegir o arrastrar varias facturas, ver la
// lista con nombre y tamaño, quitar una a una. La comparten los tres formularios.
// Límites (los mismos que el servidor, public/api/config.php): 5 archivos, 20 MB por archivo y
// 20 MB en total; PDF o foto (JPG, PNG, WEBP). Las fotos se comprimen al enviar (form-send.ts),
// por eso aquí se admite una foto más pesada y el tamaño final se vuelve a comprobar al enviar.

export const MAX_FILES = 5;
export const MAX_FILE = 20 * 1024 * 1024;
export const MAX_TOTAL = 20 * 1024 * 1024;
/** Foto antes de comprimir: por encima de esto, el móvil puede quedarse sin memoria. */
const MAX_PHOTO_RAW = 30 * 1024 * 1024;

const EXT = /\.(pdf|jpe?g|png|webp)$/i;
const isPhoto = (f: File) => /\.(jpe?g|png|webp)$/i.test(f.name);

export type FileError = 'type' | 'count' | 'size' | 'total';

const errors: Record<'ca' | 'es', Record<FileError, string>> = {
  ca: {
    type: "Aquest format no s'admet: només PDF o foto (JPG, PNG o WEBP).",
    count: 'Pots adjuntar 5 arxius com a màxim.',
    size: "Aquest arxiu supera el límit de 20 MB. Pots enviar el formulari sense ell i fer-nos arribar la factura amb una foto o per correu a info@logiksolutions.es.",
    total: 'Entre tots, els arxius poden pesar 20 MB com a màxim. Si pesen més, envia-la a info@logiksolutions.es.',
  },
  es: {
    type: 'Este formato no se admite: solo PDF o foto (JPG, PNG o WEBP).',
    count: 'Puedes adjuntar 5 archivos como máximo.',
    size: 'Este archivo supera el límite de 20 MB. Puedes enviar el formulario sin él y hacernos llegar la factura con una foto o por correo a info@logiksolutions.es.',
    total: 'Entre todos, los archivos pueden pesar 20 MB como máximo. Si pesan más, envíala a info@logiksolutions.es.',
  },
};

export const fileErrorText = (code: FileError) => errors[document.documentElement.lang === 'es' ? 'es' : 'ca'][code];

export const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;

/** Comprueba la lista final (después de comprimir las fotos). */
export function filesError(files: File[]): FileError | null {
  if (files.length > MAX_FILES) return 'count';
  if (files.some((f) => !EXT.test(f.name))) return 'type';
  if (files.some((f) => f.size > MAX_FILE)) return 'size';
  if (files.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL) return 'total';
  return null;
}

/**
 * Conecta una zona [data-drop]. `onChange` recibe la lista actual y el último error (o null).
 * Devuelve el acceso a la lista y una función para mostrar un error desde fuera.
 */
export function initFileDrop(drop: HTMLElement, onChange: (files: File[], error: FileError | null) => void = () => {}) {
  const input = drop.querySelector<HTMLInputElement>('input[type="file"]')!;
  const list = drop.querySelector<HTMLElement>('[data-drop-files]')!;
  const error = drop.querySelector<HTMLElement>('[data-error-for="factura"]')!;
  const removeLabel = drop.dataset.removeLabel ?? 'Treure';
  let files: File[] = [];

  const showError = (code: FileError | null) => {
    error.textContent = code ? fileErrorText(code) : '';
    error.hidden = !code;
    if (code) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };

  const render = () => {
    list.replaceChildren(
      ...files.map((file, i) => {
        const li = document.createElement('li');
        li.className = 'drop__file';
        const name = document.createElement('span');
        name.className = 'drop__name';
        name.textContent = `${file.name} · ${formatSize(file.size)}`;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'drop__remove';
        remove.textContent = removeLabel;
        remove.setAttribute('aria-label', `${removeLabel}: ${file.name}`);
        remove.addEventListener('click', () => {
          files.splice(i, 1);
          showError(null);
          render();
          input.focus();
        });
        li.append(name, remove);
        return li;
      }),
    );
    list.hidden = files.length === 0;
    drop.classList.toggle('has-file', files.length > 0);
    drop.classList.toggle('is-full', files.length >= MAX_FILES);
  };

  const add = (incoming: FileList | File[]) => {
    let code: FileError | null = null;
    for (const file of incoming) {
      if (!EXT.test(file.name)) code = 'type';
      else if (files.length >= MAX_FILES) code = 'count';
      else if (isPhoto(file) ? file.size > MAX_PHOTO_RAW : file.size > MAX_FILE) code = 'size';
      else if (!isPhoto(file) && files.reduce((s, f) => s + (isPhoto(f) ? 0 : f.size), 0) + file.size > MAX_TOTAL) code = 'total';
      else files.push(file);
    }
    input.value = ''; // permite volver a elegir el mismo archivo
    showError(code);
    render();
    onChange([...files], code);
  };

  input.addEventListener('change', () => input.files && add(input.files));
  for (const type of ['dragenter', 'dragover']) {
    drop.addEventListener(type, (e) => {
      e.preventDefault();
      drop.classList.add('is-over');
    });
  }
  for (const type of ['dragleave', 'drop']) drop.addEventListener(type, () => drop.classList.remove('is-over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    const dropped = (e as DragEvent).dataTransfer?.files;
    if (dropped?.length) add(dropped);
  });

  return {
    input,
    files: () => [...files],
    showError,
  };
}
