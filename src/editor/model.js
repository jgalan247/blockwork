/*
 * model.js — the single source of truth for the project being edited.
 *
 * Everything visual (canvas, component tree, inspector, blocks, preview) reads
 * from this one store and re-renders when it changes. Nothing else holds project
 * state. Mutations go through the functions here; each one calls notify() so the
 * UI stays in sync.
 *
 * Shape (matches the saved project.json — see docs/architecture.md):
 *   project = {
 *     name, version, createdWith,
 *     screens: [ { name, properties:{...Screen props}, components: [instance, ...] } ]
 *   }
 *   instance = { id, name, type, properties:{...}, children:[instance, ...] }
 *
 * `id` is a stable internal handle (comp_N). `name` is the unique, human-facing
 * label (Button1) that blocks reference. The MVP has exactly one screen.
 */

import { getComponent } from "../components/_registry.js";
import { defaultProps } from "../components/schema.js";

const SCREEN = null; // selection sentinel: the Screen itself is selected

let project = blankProject();
let selectedId = SCREEN;
let idCounter = 0;
const listeners = new Set();

/* ------------------------------------------------------------------ */
/* Construction & subscription                                        */
/* ------------------------------------------------------------------ */

function blankProject() {
  return {
    name: "Untitled project",
    version: "1.0",
    createdWith: "Blockwork v0.1",
    screens: [{
      name: "Screen1",
      properties: defaultProps(getComponent("Screen")),
      components: [],
    }],
  };
}

/** Subscribe to changes. The listener gets a reason: "tree" | "selection" | "props". */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function notify(reason) { for (const l of listeners) l(reason); }

/* ------------------------------------------------------------------ */
/* Reads                                                              */
/* ------------------------------------------------------------------ */

export const getProject = () => project;
export const getScreen = () => project.screens[0];
export const getSelectedId = () => selectedId;

/** The selected thing: the screen (when selectedId is null) or a component instance. */
export function getSelected() {
  return selectedId === SCREEN ? getScreen() : findComponent(selectedId);
}

/** Depth-first walk over every component instance (not the screen). */
export function walk(fn, nodes = getScreen().components, parent = SCREEN) {
  for (const node of nodes) {
    fn(node, parent);
    if (node.children?.length) walk(fn, node.children, node);
  }
}

export function findComponent(id) {
  let found = null;
  walk((node) => { if (node.id === id) found = node; });
  return found;
}

export function findParentList(id) {
  if (getScreen().components.some((c) => c.id === id)) return getScreen().components;
  let list = null;
  walk((node) => { if (node.children?.some((c) => c.id === id)) list = node.children; });
  return list;
}

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

export function select(id) { selectedId = id; notify("selection"); }

/**
 * Add a new component of `type` into the container identified by `parentId`
 * (null/"Screen" = the screen root). Returns the new instance.
 */
export function addComponent(type, parentId = SCREEN) {
  const def = getComponent(type);
  if (!def) throw new Error(`Unknown component type: ${type}`);

  const instance = {
    id: `comp_${++idCounter}`,
    name: nextName(type),
    type,
    properties: defaultProps(def),
    children: def.container ? [] : undefined,
  };

  const list = parentId === SCREEN ? getScreen().components : findComponent(parentId)?.children;
  if (!list) throw new Error(`Cannot add to ${parentId}: not a container`);
  list.push(instance);

  selectedId = instance.id;
  notify("tree");
  return instance;
}

export function removeComponent(id) {
  const list = findParentList(id);
  if (!list) return;
  const idx = list.findIndex((c) => c.id === id);
  if (idx >= 0) list.splice(idx, 1);
  if (selectedId === id) selectedId = SCREEN;
  notify("tree");
}

/** Set one property on the selected target (screen when id is null). */
export function setProperty(id, prop, value) {
  const target = id === SCREEN ? getScreen() : findComponent(id);
  if (!target) return;
  target.properties[prop] = value;
  notify("props");
}

/** Rename the project (shown in the header and used for the export filename). */
export function setProjectName(name) {
  project.name = name;
  notify("props");
}

/* ------------------------------------------------------------------ */
/* Project lifecycle (used by save/load in Milestone 7)              */
/* ------------------------------------------------------------------ */

export function newProject() {
  project = blankProject();
  selectedId = SCREEN;
  idCounter = 0;
  notify("tree");
}

export function loadProject(obj) {
  project = obj;
  selectedId = SCREEN;
  // Resume id numbering past anything already in the file to avoid collisions.
  idCounter = 0;
  walk((node) => {
    const n = Number(/comp_(\d+)/.exec(node.id || "")?.[1]);
    if (Number.isFinite(n)) idCounter = Math.max(idCounter, n);
  });
  notify("tree");
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Next free name for a type, e.g. Button1, Button2 (App Inventor style). */
function nextName(type) {
  let max = 0;
  walk((node) => {
    if (node.type !== type) return;
    const m = /(\d+)$/.exec(node.name);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return `${type}${max + 1}`;
}
