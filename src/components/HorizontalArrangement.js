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

import { applyDimension, fillClass, sizeStyle } from "./schema.js";

const H = { Left: "flex-start", Center: "center", Right: "flex-end" };
const V = { Top: "flex-start", Center: "center", Bottom: "flex-end" };

// Alignment only — width/height are applied separately (they may be "fill").
// The element is a CSS grid (see components.css): justify-content positions the
// columns (AlignHorizontal), align-items positions items in their row (AlignVertical).
function alignStyle(p) {
  return `justify-content:${H[p.AlignHorizontal] || "flex-start"};` +
    `align-items:${V[p.AlignVertical] || "flex-start"};`;
}

function applyProp(el, prop, value) {
  switch (prop) {
    case "AlignHorizontal": el.style.justifyContent = H[value] || "flex-start"; break;
    case "AlignVertical": el.style.alignItems = V[value] || "flex-start"; break;
    case "Width": applyDimension(el, "width", value); break;
    case "Height": applyDimension(el, "height", value); break;
  }
}

export const HorizontalArrangement = {
  name: "HorizontalArrangement",
  category: "Layout",
  icon: "↔️",
  visible: true,
  container: true,
  help: "Arranges components in a row (up to 3, then wraps). AlignHorizontal positions them; set children to Width = fill for equal columns.",

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
    render: (p) => `<div class="bw-arrange bw-harrange${fillClass(p)}" style="${alignStyle(p)}${sizeStyle(p)}" data-bw-slot></div>`,
  },

  runtime: {
    create(id, props) {
      const el = document.createElement("div");
      el.className = "bw-arrange bw-harrange";
      el.style.cssText = alignStyle(props);
      applyDimension(el, "width", props.Width);
      applyDimension(el, "height", props.Height);
      return el;
    },
    update(el, prop, value) { applyProp(el, prop, value); },
    wireEvents() {},
    childHost: (el) => el,
  },
};
