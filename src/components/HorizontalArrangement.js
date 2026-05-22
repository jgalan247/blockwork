/*
 * HorizontalArrangement — a container that lays its children out in a row.
 *
 * A container component: `container: true`, a `data-bw-slot` in the designer
 * HTML, and a `childHost`. Alignment maps to flexbox: along the row,
 * AlignHorizontal is the main axis (justify-content); across it, AlignVertical
 * is the cross axis (align-items).
 */

const H = { Left: "flex-start", Center: "center", Right: "flex-end" };
const V = { Top: "flex-start", Center: "center", Bottom: "flex-end" };

function styleFor(p) {
  return `flex-direction:row;justify-content:${H[p.AlignHorizontal] || "flex-start"};` +
    `align-items:${V[p.AlignVertical] || "flex-start"}`;
}

function applyProp(el, prop, value, props) {
  if (prop === "AlignHorizontal") el.style.justifyContent = H[value] || "flex-start";
  if (prop === "AlignVertical") el.style.alignItems = V[value] || "flex-start";
}

export const HorizontalArrangement = {
  name: "HorizontalArrangement",
  category: "Layout",
  icon: "↔️",
  visible: true,
  container: true,
  help: "Arranges the components inside it in a row.",

  properties: {
    AlignHorizontal: { type: "enum", default: "Left", editable: true, options: ["Left", "Center", "Right"] },
    AlignVertical: { type: "enum", default: "Top", editable: true, options: ["Top", "Center", "Bottom"] },
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
