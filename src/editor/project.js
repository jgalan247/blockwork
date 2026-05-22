/*
 * project.js — save, load, import and export a whole project.
 *
 * A project on disk/in storage is one JSON document: the screen tree (from
 * model.js) plus the Blockly XML and any assets. This module is the only place
 * that joins those two halves together.
 *
 *   • Save   → browser localStorage (and restored automatically on next load)
 *   • Import → read a .json file from disk
 *   • Export → download the project as a .json file
 *   • New    → start blank
 */

import { devlog } from "./console.js";
import {
  getProject, loadProject, newProject as modelNewProject, setProjectName,
} from "./model.js";
import { getBlocksXml, getGeneratedCode, loadBlocksXml, clearBlocks } from "./workspace.js";
import { exportProjectZip } from "../exporter/bundle.js";

const STORAGE_KEY = "blockwork.project";

/** Combine the screen model + blocks XML into the saved/exported document. */
export function serializeProject() {
  const project = getProject();
  return { ...project, blocks: getBlocksXml(), assets: project.assets ?? {} };
}

/** Load a serialized document back into the editor (model + blocks). */
function applyProject(doc) {
  const { blocks, ...model } = doc;
  loadProject(model);
  loadBlocksXml(blocks || "");
  refreshNameInput();
}

/* ------------------------------------------------------------------ */
/* Persistence (localStorage)                                         */
/* ------------------------------------------------------------------ */

export function saveToLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeProject()));
    return true;
  } catch (err) {
    devlog.error("Save failed:", err.message);
    return false;
  }
}

function loadFromLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try { applyProject(JSON.parse(raw)); return true; }
  catch (err) { devlog.error("Couldn't restore saved project:", err.message); return false; }
}

/* ------------------------------------------------------------------ */
/* File import / export                                               */
/* ------------------------------------------------------------------ */

function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportJson() {
  const doc = serializeProject();
  const safe = (doc.name || "project").replace(/[^\w.-]+/g, "_");
  downloadText(`${safe}.blockwork.json`, JSON.stringify(doc, null, 2));
  devlog.info("Exported project JSON.");
}

function importFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try { applyProject(JSON.parse(reader.result)); devlog.info(`Opened "${file.name}".`); }
    catch (err) { devlog.error(`Couldn't read ${file.name}:`, err.message); }
  };
  reader.onerror = () => devlog.error(`Couldn't read ${file.name}.`);
  reader.readAsText(file);
}

/* ------------------------------------------------------------------ */
/* Wiring                                                             */
/* ------------------------------------------------------------------ */

function refreshNameInput() {
  const input = document.getElementById("project-name");
  if (input) input.value = getProject().name;
}

export function initProject() {
  const nameInput = document.getElementById("project-name");
  const fileInput = document.getElementById("file-input");

  // Restore the last session, then keep the name field in sync.
  if (loadFromLocal()) devlog.info("Restored your last project.");
  refreshNameInput();

  nameInput.addEventListener("input", () => setProjectName(nameInput.value));

  document.getElementById("btn-new").addEventListener("click", () => {
    modelNewProject();
    clearBlocks();
    refreshNameInput();
    devlog.info("Started a new project.");
  });

  document.getElementById("btn-save").addEventListener("click", () => {
    if (saveToLocal()) devlog.info("Saved to this browser.");
  });

  document.getElementById("btn-export-json").addEventListener("click", exportJson);

  document.getElementById("btn-export").addEventListener("click", async () => {
    devlog.info("Building your PWA…");
    try {
      await exportProjectZip(getProject(), getGeneratedCode());
      devlog.info("Exported! Unzip and host the folder, or open it on a phone to install.");
    } catch (err) {
      devlog.error("PWA export failed:", err.message);
    }
  });

  const pickFile = () => { fileInput.value = ""; fileInput.click(); };
  document.getElementById("btn-import").addEventListener("click", pickFile);
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) importFromFile(file);
  });

  // Best-effort: keep the latest state (including blocks) so a reload restores it.
  window.addEventListener("beforeunload", saveToLocal);
}
