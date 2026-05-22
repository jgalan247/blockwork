/*
 * Label — static text on the screen.
 *
 * The simplest visible component: a few properties, no events, no methods.
 * Good second example after Button.
 */

import { escapeHtml } from "./schema.js";

function applyProp(el, prop, value) {
  switch (prop) {
    case "Text": el.textContent = value; break;
    case "TextColor": el.style.color = value; break;
    case "FontSize": el.style.fontSize = `${value}px`; break;
    case "FontBold": el.style.fontWeight = value ? "700" : "400"; break;
  }
}

export const Label = {
  name: "Label",
  category: "UI",
  icon: "🏷️",
  visible: true,
  help: "A piece of text. Change its Text property from blocks to show results.",

  properties: {
    Text: { type: "string", default: "Label", editable: true },
    TextColor: { type: "color", default: "#111827", editable: true },
    FontSize: { type: "number", default: 16, editable: true },
    FontBold: { type: "boolean", default: false, editable: true },
  },

  events: {},
  methods: {},

  designer: {
    defaultSize: { width: 120, height: 24 },
    render: (p) => {
      const style = `color:${p.TextColor};font-size:${p.FontSize}px;` +
        `font-weight:${p.FontBold ? 700 : 400}`;
      return `<span class="bw-label" style="${style}">${escapeHtml(p.Text)}</span>`;
    },
  },

  runtime: {
    create(id, props) {
      const el = document.createElement("span");
      el.className = "bw-label";
      for (const [prop, value] of Object.entries(props)) applyProp(el, prop, value);
      return el;
    },
    update: applyProp,
    wireEvents() {}, // Label has no events
  },
};
