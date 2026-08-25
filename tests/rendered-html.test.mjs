import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir, stat } from "node:fs/promises";

test("renders FHW metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(html, /FHW · Cada Taza Cuenta/);
  assert.match(html, /manifest\.webmanifest/);
  assert.doesNotMatch(html, /Starter Project|codex-preview/);
});

test("publishes a relative GitHub Pages entry", async () => {
  const html = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
  assert.match(html, /FHW · Cada Taza Cuenta/);
  assert.doesNotMatch(html, /="\/assets\//);
  assert.match(html, /="\.\/assets\//);
});

test("keeps the interactive dashboard lightweight", async () => {
  const assets = new URL("../docs/assets/", import.meta.url);
  const files = (await readdir(assets)).filter((name) => /^dashboard-.*\.js$/.test(name));
  assert.equal(files.length, 1);
  const info = await stat(new URL(files[0], assets));
  assert.ok(info.size < 40 * 1024, `dashboard bundle is ${info.size} bytes`);
});
