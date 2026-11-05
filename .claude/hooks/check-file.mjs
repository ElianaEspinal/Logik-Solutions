import { readFileSync } from "node:fs";
const input = JSON.parse(readFileSync(0, "utf8"));
const file = input.tool_input?.file_path ?? "";
if (!/\.(astro|html|md|mdx)$/.test(file)) process.exit(0);

const problems = [];
const name = file.split(/[\\/]/).pop();
if (/[A-Z\s]/.test(name)) problems.push("El nombre del archivo debe ir en minúsculas y sin espacios.");
const text = readFileSync(file, "utf8");
if (/noindex/i.test(text)) problems.push("Contiene 'noindex': confirma que es intencionado (solo en pruebas).");
if (/href=["'](?!https?:|\/|#|mailto:|tel:)/i.test(text)) problems.push("Hay enlaces relativos: usa rutas absolutas desde la raíz.");

if (problems.length) { console.error(problems.join("\n")); process.exit(2); }
