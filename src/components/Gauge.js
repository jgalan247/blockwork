/*
 * Gauge — shows a number as a semicircular dial. A display widget: set its
 * Value from blocks (e.g. a sensor reading) and the needle fills proportionally
 * between Min and Max.
 *
 * The dial is plain inline SVG (no chart library). Because runtime.update only
 * gets one property at a time, we keep the current props on the element and
 * re-render the SVG from them.
 */

import { escapeHtml } from "./schema.js";

/** Inner SVG for the gauge, computed purely from props. */
function gaugeSvg(p) {
  const min = Number(p.Min) || 0;
  const max = Number(p.Max);
  const span = (max - min) || 1;
  let frac = (Number(p.Value) - min) / span;
  frac = Math.max(0, Math.min(1, frac || 0));

  // Semicircle: angle goes from π (left) to 0 (right) as frac goes 0 -> 1.
  const ang = Math.PI * (1 - frac);
  const x = (50 + 40 * Math.cos(ang)).toFixed(2);
  const y = (50 - 40 * Math.sin(ang)).toFixed(2);
  const color = p.Color || "#14b8a6";

  const valueArc = frac > 0.001
    ? `<path d="M10,50 A40,40 0 0 1 ${x},${y}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/>`
    : "";

  return `<svg viewBox="0 0 100 64" class="bw-gauge-svg">` +
    `<path d="M10,50 A40,40 0 0 1 90,50" fill="none" stroke="#e5e7eb" stroke-width="8" stroke-linecap="round"/>` +
    valueArc +
    `<text x="50" y="46" text-anchor="middle" class="bw-gauge-value">${escapeHtml(String(p.Value))}</text>` +
    `<text x="50" y="60" text-anchor="middle" class="bw-gauge-label">${escapeHtml(p.Label || "")}</text>` +
    `</svg>`;
}

export const Gauge = {
  name: "Gauge",
  category: "Dashboard",
  icon: "🌡️",
  visible: true,
  help: "A dial that shows a number between Min and Max. Set Value from blocks.",

  properties: {
    Value: { type: "number", default: 0, editable: true },
    Min: { type: "number", default: 0, editable: true },
    Max: { type: "number", default: 100, editable: true },
    Label: { type: "string", default: "", editable: true },
    Color: { type: "color", default: "#14b8a6", editable: true },
  },

  events: {},
  methods: {},

  designer: {
    defaultSize: { width: 160, height: 100 },
    render: (p) => `<div class="bw-gauge">${gaugeSvg(p)}</div>`,
  },

  runtime: {
    create(id, props) {
      const el = document.createElement("div");
      el.className = "bw-gauge";
      el._props = { ...props };       // keep current props for re-render
      el.innerHTML = gaugeSvg(el._props);
      return el;
    },
    update(el, prop, value) {
      el._props[prop] = value;
      el.innerHTML = gaugeSvg(el._props);
    },
    wireEvents() {},
  },
};
