// Comportamiento de la zona de adjunto (src/components/file-drop.astro):
// elegir o arrastrar, mostrar nombre y tamaño, quitar. Lo usa el pre-estudi.

export const MAX_FILE = 10 * 1024 * 1024;

export const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;

export const isValidFile = (file?: File | null) =>
  !file || (file.size <= MAX_FILE && (file.type === 'application/pdf' || file.type.startsWith('image/')));

/** Conecta una zona [data-drop]. `onChange` recibe el archivo actual (o null) tras cada cambio. */
export function initFileDrop(drop: HTMLElement, onChange: (file: File | null) => void) {
  const input = drop.querySelector<HTMLInputElement>('input[type="file"]')!;
  const box = drop.querySelector<HTMLElement>('[data-drop-file]')!;
  const name = drop.querySelector<HTMLElement>('[data-drop-name]')!;

  const show = () => {
    const file = input.files?.[0] ?? null;
    box.hidden = !file;
    drop.classList.toggle('has-file', !!file);
    name.textContent = file ? `${file.name} · ${formatSize(file.size)}` : '';
    onChange(file);
  };

  input.addEventListener('change', show);
  drop.querySelector('[data-drop-remove]')?.addEventListener('click', () => {
    input.value = '';
    show();
    input.focus();
  });
  for (const type of ['dragenter', 'dragover']) {
    drop.addEventListener(type, (e) => {
      e.preventDefault();
      drop.classList.add('is-over');
    });
  }
  for (const type of ['dragleave', 'drop']) drop.addEventListener(type, () => drop.classList.remove('is-over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = (e as DragEvent).dataTransfer?.files;
    if (!files?.length) return;
    const dt = new DataTransfer();
    dt.items.add(files[0]);
    input.files = dt.files;
    show();
  });

  return { input, current: () => input.files?.[0] ?? null };
}
