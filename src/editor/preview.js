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

  async function open() {
    overlay.hidden = false;
    frame.focus();
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
