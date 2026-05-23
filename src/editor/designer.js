/*
 * designer.js — the visual layer: palette, canvas, and component tree.
 *
 * It reads the project from model.js and re-renders whenever the model changes.
 * It owns three pieces of the editor:
 *   • the Palette  — draggable component sources (left panel)
 *   • the Canvas   — the phone frame showing live designer.render() previews
 *   • the Tree     — the component hierarchy (right panel, top)
 *
 * Selection and drag-drop both flow back into the model, which notifies us to
 * re-render. The inspector (inspector.js) handles property editing separately.
 */

import { defaultProps } from "../components/schema.js";
import {
  getComponent, allComponents, componentsByCategory, registryErrors,
} from "../components/_registry.js";
import {
  subscribe, getScreen, getSelectedId, select, addComponent, removeComponent,
  findComponent, getParentId,
} from "./model.js";
import { devlog } from "./console.js";

// In the DOM we need a string handle for "the screen"; the model uses null.
const SCREEN_ID = "__screen__";

let paletteEl, treeEl, canvasEl;

export function initDesigner() {
  paletteEl = document.getElementById("palette");
  treeEl = document.getElementById("component-tree");
  canvasEl = document.getElementById("phone-screen");

  // Surface any component that failed validation (no silent failures).
  registryErrors.forEach((e) => devlog.error("Component registry:", e));

  buildPalette();
  wireCanvas();
  subscribe(() => { renderCanvas(); renderTree(); });
  renderCanvas();
  renderTree();
}

/* ------------------------------------------------------------------ */
/* Palette                                                            */
/* ------------------------------------------------------------------ */

function buildPalette() {
  paletteEl.replaceChildren();
  for (const [category, defs] of componentsByCategory()) {
    // Screen is the root — you don't drag new ones in the MVP.
    const draggable = defs.filter((d) => d.name !== "Screen");
    if (!draggable.length) continue;

    const heading = document.createElement("div");
    heading.className = "palette-category";
    heading.textContent = category;
    paletteEl.append(heading);

    for (const def of draggable) {
      // A real <button> so it's keyboard-focusable; also draggable for mouse
      // users who want to drop onto a specific container.
      const item = document.createElement("button");
      item.type = "button";
      item.className = "palette-item";
      item.draggable = true;
      item.title = def.help || def.name;
      item.innerHTML = `<span class="icon">${def.icon}</span><span>${def.name}</span>`;
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/bw-type", def.name);
        e.dataTransfer.effectAllowed = "copy";
      });
      // Click/Enter adds into the selected container (or the screen) — the
      // keyboard-accessible path that doesn't require a drag gesture.
      item.addEventListener("click", () => addToSelectedContainer(def.name));
      paletteEl.append(item);
    }
  }
}

/**
 * Add a component where the user would expect, based on the current selection:
 *   • a container selected  → add inside it
 *   • a leaf selected       → add into the leaf's parent container (as a sibling),
 *                             so repeated clicks keep filling the same arrangement
 *   • nothing selected      → the screen root
 */
function addToSelectedContainer(type) {
  const sel = getSelectedId();
  let target = null; // screen root
  if (sel) {
    const inst = findComponent(sel);
    if (inst && getComponent(inst.type).container) target = sel;
    else if (inst) target = getParentId(sel);
  }
  try {
    addComponent(type, target);
    devlog.info(`Added ${type}.`);
  } catch (err) {
    devlog.error("Could not add component:", err.message);
  }
}

/* ------------------------------------------------------------------ */
/* Canvas                                                             */
/* ------------------------------------------------------------------ */

function renderCanvas() {
  const def = getComponent("Screen");
  const screen = getScreen();
  const el = htmlToElement(def.designer.render({ ...defaultProps(def), ...screen.properties }));
  el.dataset.bwId = SCREEN_ID;
  if (getSelectedId() === null) el.classList.add("bw-selected");

  const slot = childSlot(el);
  slot.dataset.bwDrop = SCREEN_ID;
  for (const child of screen.components) {
    const childEl = renderNode(child);
    if (childEl) slot.append(childEl);
  }
  canvasEl.replaceChildren(el);
}

/** Render one component instance (recursively for containers). */
function renderNode(instance) {
  const def = getComponent(instance.type);
  if (!def) {
    const err = document.createElement("div");
    err.className = "bw-error";
    err.textContent = `Unknown component: ${instance.type}`;
    return err;
  }
  if (!def.visible) return null; // non-visible components live in a tray (M6)

  const el = htmlToElement(def.designer.render({ ...defaultProps(def), ...instance.properties }));
  el.dataset.bwId = instance.id;
  if (getSelectedId() === instance.id) el.classList.add("bw-selected");

  if (def.container) {
    const slot = childSlot(el);
    if (slot) {
      slot.dataset.bwDrop = instance.id;
      for (const child of instance.children ?? []) {
        const childEl = renderNode(child);
        if (childEl) slot.append(childEl);
      }
    }
  }
  return el;
}

function wireCanvas() {
  // Click to select the nearest component (or the screen background).
  canvasEl.addEventListener("click", (e) => {
    const node = e.target.closest("[data-bw-id]");
    if (!node) return;
    e.preventDefault(); // don't activate preview buttons/inputs
    const id = node.dataset.bwId;
    select(id === SCREEN_ID ? null : id);
  });

  // Drag a palette item over a container slot, then drop to add it there.
  let active = null;
  const setActive = (el) => {
    if (active === el) return;
    active?.classList.remove("bw-drop-active");
    active = el;
    active?.classList.add("bw-drop-active");
  };
  canvasEl.addEventListener("dragover", (e) => {
    const target = e.target.closest("[data-bw-drop]");
    if (!target) return setActive(null);
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setActive(target);
  });
  canvasEl.addEventListener("dragleave", (e) => {
    if (!canvasEl.contains(e.relatedTarget)) setActive(null);
  });
  canvasEl.addEventListener("drop", (e) => {
    const target = e.target.closest("[data-bw-drop]");
    setActive(null);
    if (!target) return;
    e.preventDefault();
    const type = e.dataTransfer.getData("text/bw-type");
    if (!type) return;
    const dropId = target.dataset.bwDrop;
    try {
      addComponent(type, dropId === SCREEN_ID ? null : dropId);
      devlog.info(`Added ${type}.`);
    } catch (err) {
      devlog.error("Could not add component:", err.message);
    }
  });

  // Delete the selected component with Delete/Backspace (never while typing).
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Delete" && e.key !== "Backspace") return;
    if (isTextInput(e.target)) return;
    const id = getSelectedId();
    if (id === null) return; // can't delete the screen
    e.preventDefault();
    removeComponent(id);
  });
}

/* ------------------------------------------------------------------ */
/* Component tree                                                     */
/* ------------------------------------------------------------------ */

function renderTree() {
  treeEl.replaceChildren();
  treeEl.append(treeItem(getScreen().name, SCREEN_ID, 0, getSelectedId() === null));
  for (const node of getScreen().components) appendTreeNodes(node, 1);
}

function appendTreeNodes(instance, depth) {
  const selected = getSelectedId() === instance.id;
  treeEl.append(treeItem(`${instance.icon ?? ""}${instance.name}`, instance.id, depth, selected));
  for (const child of instance.children ?? []) appendTreeNodes(child, depth + 1);
}

function treeItem(label, id, depth, selected) {
  const li = document.createElement("li");
  li.textContent = label;
  // Indent by nesting depth (any depth, not just two levels).
  li.style.paddingLeft = `calc(var(--space-2) + ${depth} * var(--space-4))`;
  li.setAttribute("role", "treeitem");
  li.setAttribute("aria-selected", String(selected));
  li.tabIndex = 0;
  const choose = () => select(id === SCREEN_ID ? null : id);
  li.addEventListener("click", choose);
  li.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(); }
  });
  return li;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function htmlToElement(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/** The element children mount into: the [data-bw-slot] node, or the element itself. */
function childSlot(el) {
  return el.matches("[data-bw-slot]") ? el : el.querySelector("[data-bw-slot]");
}

function isTextInput(node) {
  return node && (/^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName) || node.isContentEditable);
}
