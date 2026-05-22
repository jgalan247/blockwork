/*
 * inspector.js — the properties panel.
 *
 * For whatever is selected (a component, or the screen), it builds one editor
 * per editable property, choosing the editor widget from the property's `type`.
 * Editing writes straight back to the model, which re-renders the canvas.
 *
 * The inspector intentionally does NOT rebuild itself on "props" changes — the
 * input the user is typing into is the source of that change, so rebuilding it
 * would steal focus mid-keystroke. It rebuilds only when the selection changes.
 */

import { coerce } from "../components/schema.js";
import { getComponent } from "../components/_registry.js";
import { subscribe, getSelected, getSelectedId, setProperty, removeComponent } from "./model.js";

let el;

export function initInspector() {
  el = document.getElementById("inspector");
  subscribe((reason) => { if (reason === "selection" || reason === "tree") render(); });
  render();
}

function render() {
  el.replaceChildren();
  const target = getSelected();
  const id = getSelectedId();
  if (!target) { el.innerHTML = `<div class="inspector-empty">Nothing selected.</div>`; return; }

  // The screen's def is "Screen"; a component instance carries its type.
  const def = id === null ? getComponent("Screen") : getComponent(target.type);
  if (!def) { el.innerHTML = `<div class="inspector-empty">Unknown component.</div>`; return; }

  // Header: name + type (+ delete, except for the screen).
  const head = document.createElement("div");
  head.className = "inspector-head";
  head.innerHTML = `<span class="name">${target.name}</span><span class="type">${def.name}</span>`;
  if (id !== null) {
    const del = document.createElement("button");
    del.className = "btn btn-danger";
    del.type = "button";
    del.textContent = "Delete";
    del.addEventListener("click", () => removeComponent(id));
    head.append(del);
  }
  el.append(head);

  if (def.help) {
    const help = document.createElement("div");
    help.className = "inspector-help";
    help.textContent = def.help;
    el.append(help);
  }

  // One row per editable property.
  for (const [prop, spec] of Object.entries(def.properties)) {
    if (spec.editable === false) continue;
    el.append(propertyRow(id, prop, spec, target.properties[prop]));
  }
}

function propertyRow(id, prop, spec, value) {
  const row = document.createElement("div");
  row.className = "prop-row";

  const label = document.createElement("label");
  label.textContent = prop;
  label.htmlFor = `prop-${prop}`;
  row.append(label);

  const editor = makeEditor(spec, value);
  editor.id = `prop-${prop}`;
  const event = (spec.type === "boolean" || spec.type === "enum") ? "change" : "input";
  editor.addEventListener(event, () => {
    const raw = spec.type === "boolean" ? editor.checked : editor.value;
    setProperty(id, prop, coerce(spec.type, raw));
  });
  row.append(editor);
  return row;
}

/** Pick the right input widget for a property type. */
function makeEditor(spec, value) {
  switch (spec.type) {
    case "boolean": {
      const i = document.createElement("input");
      i.type = "checkbox";
      i.checked = !!value;
      return i;
    }
    case "color": {
      const i = document.createElement("input");
      i.type = "color";
      i.value = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
      return i;
    }
    case "number": {
      const i = document.createElement("input");
      i.type = "number";
      i.value = value;
      return i;
    }
    case "enum": {
      const s = document.createElement("select");
      for (const opt of spec.options) {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        o.selected = String(value) === opt;
        s.append(o);
      }
      return s;
    }
    case "dimension": {
      const i = document.createElement("input");
      i.type = "text";
      i.value = String(value);
      i.placeholder = "auto, fill, or pixels";
      return i;
    }
    default: { // string
      const i = document.createElement("input");
      i.type = "text";
      i.value = value ?? "";
      return i;
    }
  }
}
