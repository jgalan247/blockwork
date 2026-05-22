/*
 * main.js — the editor entry point.
 *
 * This file is deliberately a thin "wiring harness": it owns no logic of its
 * own, it just connects the UI chrome to the feature modules. Read this file
 * first to understand how the editor fits together, then dive into the module
 * that owns the behaviour you care about.
 *
 *   console.js   — the in-editor dev console (errors, logs)
 *   designer.js  — palette, canvas, component tree            (Milestone 3)
 *   inspector.js — properties panel                           (Milestone 3)
 *   workspace.js — Blockly + block generation                 (Milestone 4)
 *   preview.js   — sandboxed live preview                     (Milestone 5)
 *   project.js   — save / load / import / export              (Milestone 7)
 *   exporter     — PWA zip pipeline                            (Milestone 8)
 */

import { initConsole, devlog } from "./console.js";
import { initDesigner } from "./designer.js";
import { initInspector } from "./inspector.js";
import { ensureWorkspace } from "./workspace.js";
import { initPreview } from "./preview.js";
import { initProject } from "./project.js";

/** Toggle between the Designer canvas and the Blocks workspace. */
function initViewToggle() {
  const designerBtn = document.getElementById("view-designer");
  const blocksBtn = document.getElementById("view-blocks");
  const designerView = document.getElementById("designer-view");
  const blocksView = document.getElementById("blocks-view");

  function show(view) {
    const designer = view === "designer";
    designerView.hidden = !designer;
    blocksView.hidden = designer;
    designerBtn.setAttribute("aria-pressed", String(designer));
    blocksBtn.setAttribute("aria-pressed", String(!designer));
    // Lazily create/resize the Blockly workspace when its view becomes visible
    // (injecting into a hidden container would measure everything as zero).
    if (!designer) ensureWorkspace();
  }

  designerBtn.addEventListener("click", () => show("designer"));
  blocksBtn.addEventListener("click", () => show("blocks"));
}

/** Register the service worker so the editor installs and works offline. */
function initServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // Relative scope so this works on a GitHub Pages /<repo>/ subpath.
  navigator.serviceWorker.register("service-worker.js")
    .then(() => devlog.info("Offline support enabled."))
    .catch((err) => devlog.warn("Service worker not registered:", err.message));
}


function main() {
  initConsole();
  initDesigner();
  initInspector();
  initViewToggle();
  initPreview();
  initProject();
  initServiceWorker();
}

document.addEventListener("DOMContentLoaded", main);
