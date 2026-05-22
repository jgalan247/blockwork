/*
 * bundle.js — turns the project + component modules + generated block code into
 * ONE self-contained classic <script>. No build tool required.
 *
 * Why a bundler at all? The live preview runs in an iframe sandboxed to
 * `allow-scripts` (an opaque origin), which cannot `import` ES modules from the
 * parent. Exported apps must also be plain static files. So we inline
 * everything into a single script.
 *
 * How: each source module is wrapped in a tiny factory (CommonJS-style), so its
 * module-scoped helpers stay private and can't collide with another module's
 * (e.g. each component's local `applyProp`). `import`/`export` are rewritten to
 * a minimal `require`/`exports`. This relies on the project's own simple module
 * style (single-line `import { … } from "./x.js"`, `export const/function …`).
 *
 * Used by the live preview (Milestone 5) and the PWA exporter (Milestone 8).
 */

import { allComponents } from "../components/_registry.js";
import { escapeHtml } from "../components/schema.js";

/**
 * The source modules to bundle, in dependency-friendly order. Derived from the
 * registry so adding a component (file + registry entry) is automatically
 * included — no third edit here. Convention: file name === component name.
 */
export function modulePaths() {
  return [
    "src/components/schema.js",
    ...allComponents().map((d) => `src/components/${d.name}.js`),
    "src/components/_registry.js",
    "src/runtime/runtime.js",
  ];
}

/** Fetch the text of every module to bundle (returns [{ path, src }]). */
export async function fetchModules(base = "") {
  const paths = modulePaths();
  return Promise.all(paths.map(async (path) => ({
    path,
    src: await fetch(base + path).then((r) => {
      if (!r.ok) throw new Error(`Could not load ${path} (${r.status})`);
      return r.text();
    }),
  })));
}

/* ------------------------------------------------------------------ */
/* Module transform                                                   */
/* ------------------------------------------------------------------ */

/** Resolve a relative import specifier against the importing module's path. */
function resolvePath(importer, spec) {
  const dir = importer.split("/").slice(0, -1);
  for (const part of spec.split("/")) {
    if (part === "." || part === "") continue;
    if (part === "..") dir.pop();
    else dir.push(part);
  }
  return dir.join("/");
}

/** Wrap one module's source in a factory, rewriting import/export. */
function transformModule(path, src) {
  // Names this module exports, so we can re-expose them on `exports`.
  const exported = [];
  const nameRe = /export\s+(?:const|let|var|function|class)\s+([A-Za-z0-9_$]+)/g;
  for (let m; (m = nameRe.exec(src)); ) exported.push(m[1]);

  let body = src
    // `import { a, b } from "./x.js";` -> `const { a, b } = require("id");`
    .replace(/import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["'];?/g,
      (_, binds, spec) => `const {${binds}} = require(${JSON.stringify(resolvePath(path, spec))});`)
    // drop the `export ` keyword from declarations
    .replace(/\bexport\s+/g, "");

  const reexport = exported.map((n) => `exports.${n} = ${n};`).join("\n");
  return `__define(${JSON.stringify(path)}, function(require, module, exports){\n${body}\n${reexport}\n});`;
}

/* ------------------------------------------------------------------ */
/* Bundle assembly                                                    */
/* ------------------------------------------------------------------ */

/** The complete app script: module system + modules + project data + block code. */
export function buildBundle(modules, project, userCode) {
  const defines = modules.map(({ path, src }) => transformModule(path, src)).join("\n\n");
  return `(function(){
  var __factories = {}, __cache = {};
  function __define(id, factory){ __factories[id] = factory; }
  function require(id){
    if (__cache[id]) return __cache[id].exports;
    if (!__factories[id]) throw new Error("Module not found: " + id);
    var module = { exports: {} };
    __cache[id] = module;
    __factories[id](require, module, module.exports);
    return module.exports;
  }

${defines}

  // ---- bootstrap ----
  var mountApp = require("src/runtime/runtime.js").mountApp;
  var __project = ${JSON.stringify(project)};
  var app = mountApp(document.getElementById("app"), __project);
  var $bw = app.api;

  // ---- generated from blocks ----
  try {
${userCode || ""}
  } catch (err) {
    console.error("App error:", err);
  }
})();`;
}

/* ------------------------------------------------------------------ */
/* Preview HTML (self-contained, for the sandboxed iframe)            */
/* ------------------------------------------------------------------ */

/**
 * A complete HTML document for the live preview: component CSS inlined, the
 * bundle inlined, and a tiny shim that forwards console output and errors to
 * the editor's dev console via postMessage (the iframe can't share state).
 */
export function buildPreviewHtml(modules, project, userCode, componentsCss) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;height:100%}#app{min-height:100%}
${componentsCss}</style></head>
<body><div id="app"></div>
<script>
// Pipe logs/errors to the editor's dev console.
(function(){
  function send(level, args){ try { parent.postMessage({ __bwPreviewLog: { level: level, text: args.map(String).join(" ") } }, "*"); } catch(e){} }
  ["log","warn","error"].forEach(function(k){ var orig = console[k].bind(console); console[k] = function(){ send(k, [].slice.call(arguments)); orig.apply(null, arguments); }; });
  window.addEventListener("error", function(e){ send("error", [e.message]); });
})();
${buildBundle(modules, project, userCode)}
</script></body></html>`;
}

/* ------------------------------------------------------------------ */
/* PWA export (the downloadable zip)                                  */
/* ------------------------------------------------------------------ */

/**
 * Build and download an installable PWA zip for the project. The zip contains
 * exactly the files a student needs to host anywhere or open offline:
 *   index.html · app.js · manifest.json · service-worker.js · icon-192/512.png
 */
export async function exportProjectZip(project, userCode) {
  const JSZip = await loadJSZip();
  const [modules, css, template, icon192, icon512] = await Promise.all([
    fetchModules(),
    fetch("src/styles/components.css").then((r) => r.text()),
    fetch("src/runtime/runtime.template.html").then((r) => r.text()),
    fetch("icons/icon-192.png").then((r) => r.blob()),
    fetch("icons/icon-512.png").then((r) => r.blob()),
  ]);

  const name = project.name || "Blockwork App";
  const themeColor = project.screens?.[0]?.properties?.BackgroundColor || "#ffffff";

  const indexHtml = template
    .replace(/\{\{NAME\}\}/g, escapeHtml(name))
    .replace(/\{\{THEME_COLOR\}\}/g, themeColor)
    .replace(/\{\{STYLES\}\}/g, () => css); // function form: avoid $-substitution in css

  const zip = new JSZip();
  zip.file("index.html", indexHtml);
  zip.file("app.js", buildBundle(modules, project, userCode));
  zip.file("manifest.json", exportManifest(name, themeColor));
  zip.file("service-worker.js", exportServiceWorker());
  zip.file("icon-192.png", icon192);
  zip.file("icon-512.png", icon512);

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(`${safeName(name)}.zip`, blob);
}

function exportManifest(name, themeColor) {
  return JSON.stringify({
    name,
    short_name: name.slice(0, 12),
    start_url: ".",
    scope: ".",
    display: "standalone",
    background_color: themeColor,
    theme_color: themeColor,
    icons: [
      { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  }, null, 2);
}

/** Cache-first service worker for an exported app (its code never changes). */
function exportServiceWorker() {
  return `/* Offline support for your Blockwork app. Cache-first: the code never changes. */
const CACHE = "blockwork-app-v1";
const FILES = ["./", "index.html", "app.js", "manifest.json", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
`;
}

let jszipPromise = null;
/** Load the vendored JSZip on demand (keeps it out of the editor's initial load). */
function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (!jszipPromise) {
    jszipPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "vendor/jszip.min.js";
      s.onload = () => resolve(window.JSZip);
      s.onerror = () => reject(new Error("Could not load vendor/jszip.min.js"));
      document.head.append(s);
    });
  }
  return jszipPromise;
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeName(name) {
  return (name || "blockwork-app").replace(/[^\w.-]+/g, "_");
}
