/*
 * VerticalArrangement — a container that lays its children out in a column.
 *
 * Like HorizontalArrangement, but the axes swap: down the column, AlignVertical
 * is the main axis (justify-content); across it, AlignHorizontal is the cross
 * axis (align-items).
 */

const H = { Left: "flex-start", Center: "center", Right: "flex-end" };
const V = { Top: "flex-start", Center: "center", Bottom: "flex-end" };

function styleFor(p) {
  return `flex-direction:column;justify-content:${V[p.AlignVertical] || "flex-start"};` +
    `align-items:${H[p.AlignHorizontal] || "flex-start"}`;
}

function applyProp(el, prop, value) {
  if (prop === "AlignVertical") el.style.justifyContent = V[value] || "flex-start";
  if (prop === "AlignHorizontal") el.style.alignItems = H[value] || "flex-start";
}

export const VerticalArrangement = {
  name: "VerticalArrangement",
  category: "Layout",
  icon: "↕️",
  visible: true,
  container: true,
  help: "Arranges the components inside it in a column.",

  properties: {
    AlignHorizontal: { type: "enum", default: "Left", editable: true, options: ["Left", "Center", "Right"] },
    AlignVertical: { type: "enum", default: "Top", editable: true, options: ["Top", "Center", "Bottom"] },
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
