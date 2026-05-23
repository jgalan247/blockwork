/*
 * Label — static text on the screen.
 *
 * A simple visible component. TextAlign positions the text within the label, but
 * only has room to do so when the label is wider than its text — pair it with
 * Width = "fill" (or a pixel width) to left/center/right-align across the row.
 */

import { applyDimension, fillClass, sizeStyle, escapeHtml } from "./schema.js";

function applyProp(el, prop, value) {
  switch (prop) {
    case "Text": el.textContent = value; break;
    case "TextColor": el.style.color = value; break;
    case "FontSize": el.style.fontSize = `${value}px`; break;
    case "FontBold": el.style.fontWeight = value ? "700" : "400"; break;
    case "TextAlign": el.style.textAlign = String(value).toLowerCase(); break;
    case "Width": applyDimension(el, "width", value); break;
  }
}

export const Label = {
  name: "Label",
  category: "UI",
  icon: "🏷️",
  visible: true,
  help: "A piece of text. Change its Text from blocks to show results.",

  properties: {
    Text: { type: "string", default: "Label", editable: true },
    TextColor: { type: "color", default: "#111827", editable: true },
    FontSize: { type: "number", default: 16, editable: true },
    FontBold: { type: "boolean", default: false, editable: true },
    TextAlign: { type: "enum", default: "Left", editable: true, options: ["Left", "Center", "Right"] },
    Width: { type: "dimension", default: "auto", editable: true },
  },

  events: {},
  methods: {},

  designer: {
    defaultSize: { width: 120, height: 24 },
    render: (p) => {
      const style = `color:${p.TextColor};font-size:${p.FontSize}px;` +
        `font-weight:${p.FontBold ? 700 : 400};text-align:${String(p.TextAlign).toLowerCase()};${sizeStyle(p)}`;
      return `<span class="bw-label${fillClass(p)}" style="${style}">${escapeHtml(p.Text)}</span>`;
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
