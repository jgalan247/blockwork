/*
 * preview.js — the live, sandboxed app preview.
 *
 * Pressing Preview bundles the current project + generated blocks into one
 * self-contained HTML document and loads it into the iframe via `srcdoc`. The
 * iframe is sandboxed to scripts only (set in index.html), so the student's
 * code runs fully isolated — it cannot touch the editor or its origin.
 *
 * Console output and errors from inside the preview are posted back here and
 * shown in the editor's dev console.
 */

import { devlog } from "./console.js";
import { getProject } from "./model.js";
import { getGeneratedCode } from "./workspace.js";
import { fetchModules, buildPreviewHtml } from "../exporter/bundle.js";

let cssCache = null;
const loadComponentCss = async () => {
  if (cssCache == null) cssCache = await fetch("src/styles/components.css").then((r) => r.text());
  return cssCache;
};

// These need a real origin (network/device APIs) and so can't run in the
// sandboxed preview — they work once the app is exported.
const NEEDS_EXPORT = new Set(["MqttClient", "Geolocation", "Camera", "Accelerometer"]);

/** Which export-only component types does this project use? */
function exportOnlyComponents(project) {
  const found = new Set();
  const scan = (nodes) => {
    for (const node of nodes ?? []) {
      if (NEEDS_EXPORT.has(node.type)) found.add(node.type);
      scan(node.children);
    }
  };
  for (const screen of project.screens ?? []) scan(screen.components);
  return [...found];
}

export function initPreview() {
  const overlay = document.getElementById("preview-overlay");
  const frame = document.getElementById("preview-frame");
  const openBtn = document.getElementById("btn-preview");
  const closeBtn = document.getElementById("preview-close");

  // Forward logs from inside the sandboxed preview to our dev console.
  window.addEventListener("message", (e) => {
    const log = e.data?.__bwPreviewLog;
    if (log) devlog[log.level === "error" ? "error" : log.level === "warn" ? "warn" : "info"](`[preview] ${log.text}`);
  });

  const note = document.getElementById("preview-note");

  async function open() {
    overlay.hidden = false;
    frame.focus();

    // Heads-up if the project uses components that only work in the exported app.
    const exportOnly = exportOnlyComponents(getProject());
    if (exportOnly.length) {
      const verb = exportOnly.length === 1 ? "needs" : "need";
      note.hidden = false;
      note.textContent = `⚠ ${exportOnly.join(", ")} ${verb} the exported app — ` +
        `network and sensors can't run in this sandboxed preview. Use Export PWA to test them.`;
    } else {
      note.hidden = true;
    }

    try {
      const [css, modules] = await Promise.all([loadComponentCss(), fetchModules()]);
      const html = buildPreviewHtml(modules, getProject(), getGeneratedCode(), css);
      frame.srcdoc = html;
      devlog.info("Preview running.");
    } catch (err) {
      devlog.error("Preview failed:", err.message);
    }
  }

  function close() {
    overlay.hidden = true;
    frame.srcdoc = "";      // stop the running app
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) close(); });
}
