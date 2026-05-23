/*
 * Image — shows a picture from a URL or a data URL.
 */

import { applyDimension, fillClass, sizeStyle, escapeHtml } from "./schema.js";

function applyProp(el, prop, value) {
  switch (prop) {
    case "Source": if (value) el.src = value; else el.removeAttribute("src"); break;
    case "Alt": el.alt = value; break;
    case "Width": applyDimension(el, "width", value); break;
    case "Height": applyDimension(el, "height", value); break;
  }
}

export const Image = {
  name: "Image",
  category: "Media",
  icon: "🖼️",
  visible: true,
  help: "Shows a picture from a web address or an uploaded image.",

  properties: {
    Source: { type: "string", default: "", editable: true },
    Alt: { type: "string", default: "", editable: true },
    Width: { type: "dimension", default: "auto", editable: true },
    Height: { type: "dimension", default: "auto", editable: true },
  },

  events: {},
  methods: {},

  designer: {
    defaultSize: { width: 120, height: 120 },
    render: (p) => {
      const style = sizeStyle(p);
      if (!p.Source) {
        return `<div class="bw-image bw-image-empty${fillClass(p)}" style="${style}">🖼️ Image</div>`;
      }
      return `<img class="bw-image${fillClass(p)}" src="${escapeHtml(p.Source)}" alt="${escapeHtml(p.Alt)}" style="${style}">`;
    },
  },

  runtime: {
    create(id, props) {
      const el = document.createElement("img");
      el.className = "bw-image";
      for (const [prop, value] of Object.entries(props)) applyProp(el, prop, value);
      return el;
    },
    update: applyProp,
    wireEvents() {},
  },
};
