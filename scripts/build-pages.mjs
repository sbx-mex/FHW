import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "dist", "client");
const output = path.join(root, "docs");
const workerUrl = pathToFileURL(path.join(root, "dist", "server", "index.js"));
workerUrl.searchParams.set("pages", String(Date.now()));

const { default: worker } = await import(workerUrl.href);
const response = await worker.fetch(
  new Request("http://localhost/", { headers: { accept: "text/html" } }),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);
if (!response.ok) throw new Error(`No se pudo renderizar la portada: HTTP ${response.status}`);

let html = await response.text();
html = html
  .replaceAll('="/assets/', '="./assets/')
  .replaceAll('="/manifest.webmanifest', '="./manifest.webmanifest')
  .replaceAll('content="/assets/', 'content="./assets/');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(client, output, { recursive: true });
await rm(path.join(output, ".vite"), { recursive: true, force: true });
await rm(path.join(output, ".assetsignore"), { force: true });
await rm(path.join(output, "_headers"), { force: true });
await writeFile(path.join(output, "index.html"), html);
await writeFile(path.join(output, ".nojekyll"), "");
console.log(`GitHub Pages listo: ${path.relative(root, output)}/index.html`);
