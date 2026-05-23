/*
 * VerticalArrangement — a container that lays its children out in a column.
 *
 * Like HorizontalArrangement, but the axes swap: down the column, AlignVertical
 * is the main axis (justify-content); across it, AlignHorizontal is the cross
 * axis (align-items).
 *
 * For alignment to be visible there must be spare space, so set Width/Height to
 * "fill" or a pixel size — otherwise the box shrink-wraps to its children.
 * Width/Height accept "auto", "fill", or a number of pixels.
 */

import { dimensionToCss } from "./schema.js";

const H = { Left: "flex-start", Center: "center", Right: "flex-end" };
const V = { Top: "flex-start", Center: "center", Bottom: "flex-end" };

function styleFor(p) {
  return `flex-direction:column;` +
    `justify-content:${V[p.AlignVertical] || "flex-start"};` +
    `align-items:${H[p.AlignHorizontal] || "flex-start"};` +
    `width:${dimensionToCss(p.Width)};height:${dimensionToCss(p.Height)}`;
}

function applyProp(el, prop, value) {
  switch (prop) {
    case "AlignVertical": el.style.justifyContent = V[value] || "flex-start"; break;
    case "AlignHorizontal": el.style.alignItems = H[value] || "flex-start"; break;
    case "Width": el.style.width = dimensionToCss(value); break;
    case "Height": el.style.height = dimensionToCss(value); break;
  }
}

export const VerticalArrangement = {
  name: "VerticalArrangement",
  category: "Layout",
  icon: "↕️",
  visible: true,
  container: true,
  help: "Arranges the components inside it in a column. Set Height to \"fill\" so AlignVertical can position them.",

  properties: {
    AlignHorizontal: { type: "enum", default: "Left", editable: true, options: ["Left", "Center", "Right"] },
    AlignVertical: { type: "enum", default: "Top", editable: true, options: ["Top", "Center", "Bottom"] },
    Width: { type: "dimension", default: "auto", editable: true },
    Height: { type: "dimension", default: "auto", editable: true },
  },

  events: {},
  methods: {},

  designer: {
    defaultSize: { width: 160, height: 160 },
    render: (p) => `<div class="bw-arrange bw-varrange" style="${styleFor(p)}" data-bw-slot></div>`,
  },

  runtime: {
    create(id, props) {
      const el = document.createElement("div");
      el.className = "bw-arrange bw-varrange";
      el.style.cssText = styleFor(props);
      return el;
    },
    update(el, prop, value) { applyProp(el, prop, value); },
    wireEvents() {},
    childHost: (el) => el,
  },
};
