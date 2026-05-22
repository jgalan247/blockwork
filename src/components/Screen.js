/*
 * Screen — the root container every app has exactly one of (Screen1 in the MVP).
 *
 * Demonstrates a *container* component: `container: true` plus `childHost()`,
 * which tells the designer and runtime where child components mount. Containers
 * mark their child slot in designer HTML with the `data-bw-slot` attribute.
 *
 * Note: Screen deliberately does not touch document.title — that global side
 * effect is the runtime's job (it reads the Title property). Components stay
 * free of global side effects so they render safely inside the designer canvas.
 */

import { escapeHtml } from "./schema.js";

function applyProp(el, prop, value) {
  switch (prop) {
    case "BackgroundColor": el.style.background = value; break;
    case "Title": el.dataset.title = value; break;
    case "ScrollableContent": el.dataset.scrollable = String(!!value); break;
  }
}

export const Screen = {
  name: "Screen",
  category: "Layout",
  icon: "📱",
  visible: true,
  container: true,
  help: "The phone screen. Everything else lives inside it.",

  properties: {
    BackgroundColor: { type: "color", default: "#ffffff", editable: true },
    Title: { type: "string", default: "Screen1", editable: true },
    ScrollableContent: { type: "boolean", default: true, editable: true },
  },

  events: {},
  methods: {},

  designer: {
    defaultSize: { width: 320, height: 600 },
    render: (p) => {
      const style = `background:${p.BackgroundColor}`;
      return `<div class="bw-screen" style="${style}" ` +
        `data-scrollable="${!!p.ScrollableContent}" data-title="${escapeHtml(p.Title)}" data-bw-slot></div>`;
    },
  },

  runtime: {
    create(id, props) {
      const el = document.createElement("div");
      el.className = "bw-screen";
      for (const [prop, value] of Object.entries(props)) applyProp(el, prop, value);
      return el;
    },
    update: applyProp,
    wireEvents() {},
    childHost: (el) => el, // children mount directly inside the screen
  },
};
