/*
 * Button — a clickable button.
 *
 * This is the reference component: it touches every part of the schema, so it
 * doubles as the template you copy when authoring a new one. Read schema.js for
 * the contract, then read this top to bottom.
 */

import { dimensionToCss, escapeHtml } from "./schema.js";

// Applying a single property is shared between create() and update() so the
// preview, the runtime, and live edits all behave identically. This is the most
// important pattern to copy: never duplicate property logic between the two.
function applyProp(el, prop, value) {
  switch (prop) {
    case "Text": el.textContent = value; break;
    case "BackgroundColor": el.style.background = value; break;
    case "TextColor": el.style.color = value; break;
    case "Enabled": el.disabled = !value; break;
    case "Width": el.style.width = dimensionToCss(value); break;
    case "Height": el.style.height = dimensionToCss(value); break;
  }
}

export const Button = {
  name: "Button",
  category: "UI",
  icon: "🔘",
  visible: true,
  help: "A button the user can tap. Use its Click event to run blocks.",

  properties: {
    Text: { type: "string", default: "Button", editable: true },
    BackgroundColor: { type: "color", default: "#2563eb", editable: true },
    TextColor: { type: "color", default: "#ffffff", editable: true },
    Enabled: { type: "boolean", default: true, editable: true },
    Width: { type: "dimension", default: "auto", editable: true },
    Height: { type: "dimension", default: "auto", editable: true },
  },

  events: {
    Click: { params: [] },
    LongClick: { params: [] },
  },

  methods: {
    Focus: { params: [], run: (el) => el && el.focus() },
  },

  designer: {
    defaultSize: { width: 120, height: 40 },
    render: (p) => {
      const style = `background:${p.BackgroundColor};color:${p.TextColor};` +
        `width:${dimensionToCss(p.Width)};height:${dimensionToCss(p.Height)}`;
      const disabled = p.Enabled ? "" : " disabled";
      return `<button class="bw-button" style="${style}"${disabled}>${escapeHtml(p.Text)}</button>`;
    },
  },

  runtime: {
    create(id, props) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "bw-button";
      for (const [prop, value] of Object.entries(props)) applyProp(el, prop, value);
      return el;
    },
    update: applyProp,
    wireEvents(el, dispatch) {
      el.addEventListener("click", () => dispatch("Click"));

      // LongClick: a press held for ~600ms without releasing or leaving.
      let timer = null;
      const cancel = () => { clearTimeout(timer); timer = null; };
      el.addEventListener("pointerdown", () => {
        cancel();
        timer = setTimeout(() => dispatch("LongClick"), 600);
      });
      el.addEventListener("pointerup", cancel);
      el.addEventListener("pointerleave", cancel);
    },
  },
};
