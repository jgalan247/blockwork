/*
 * HorizontalArrangement — a container that lays its children out in a row.
 *
 * A container component: `container: true`, a `data-bw-slot` in the designer
 * HTML, and a `childHost`. Alignment maps to flexbox: along the row,
 * AlignHorizontal is the main axis (justify-content); across it, AlignVertical
 * is the cross axis (align-items).
 *
 * For alignment to be visible there must be spare space, so set Width/Height to
 * "fill" (fill the parent) or a pixel size — otherwise the box shrink-wraps to
 * its children and there's nothing to align within. Width/Height accept "auto",
 * "fill", or a number of pixels.
 */

import { dimensionToCss } from "./schema.js";

const H = { Left: "flex-start", Center: "center", Right: "flex-end" };
const V = { Top: "flex-start", Center: "center", Bottom: "flex-end" };

function styleFor(p) {
  return `flex-direction:row;` +
    `justify-content:${H[p.AlignHorizontal] || "flex-start"};` +
    `align-items:${V[p.AlignVertical] || "flex-start"};` +
    `width:${dimensionToCss(p.Width)};height:${dimensionToCss(p.Height)}`;
}

function applyProp(el, prop, value) {
  switch (prop) {
    case "AlignHorizontal": el.style.justifyContent = H[value] || "flex-start"; break;
    case "AlignVertical": el.style.alignItems = V[value] || "flex-start"; break;
    case "Width": el.style.width = dimensionToCss(value); break;
    case "Height": el.style.height = dimensionToCss(value); break;
  }
}

export const HorizontalArrangement = {
  name: "HorizontalArrangement",
  category: "Layout",
  icon: "↔️",
  visible: true,
  container: true,
  help: "Arranges the components inside it in a row. Set Width to \"fill\" so AlignHorizontal can position them.",

  properties: {
    AlignHorizontal: { type: "enum", default: "Left", editable: true, options: ["Left", "Center", "Right"] },
    AlignVertical: { type: "enum", default: "Top", editable: true, options: ["Top", "Center", "Bottom"] },
    Width: { type: "dimension", default: "auto", editable: true },
    Height: { type: "dimension", default: "auto", editable: true },
  },

  events: {},
  methods: {},

  designer: {
    defaultSize: { width: 200, height: 80 },
    render: (p) => `<div class="bw-arrange bw-harrange" style="${styleFor(p)}" data-bw-slot></div>`,
  },

  runtime: {
    create(id, props) {
      const el = document.createElement("div");
      el.className = "bw-arrange bw-harrange";
      el.style.cssText = styleFor(props);
      return el;
    },
    update(el, prop, value) { applyProp(el, prop, value); },
    wireEvents() {},
    childHost: (el) => el,
  },
};
