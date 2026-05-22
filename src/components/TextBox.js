/*
 * TextBox — a field the user types into.
 *
 * Shows two schema features the simpler components don't use:
 *   • runtime.read — Text reflects what the user has typed, so getting the Text
 *     property must read the live DOM value, not the last value we set.
 *   • an element that depends on a property — MultiLine chooses input vs textarea
 *     at create time.
 */

import { escapeHtml } from "./schema.js";

function applyProp(el, prop, value) {
  switch (prop) {
    case "Text": if (el.value !== value) el.value = value; break;
    case "Hint": el.placeholder = value; break;
    // MultiLine decides the element type and is handled in create().
  }
}

export const TextBox = {
  name: "TextBox",
  category: "UI",
  icon: "⌨️",
  visible: true,
  help: "A box the user types into. Read its Text from blocks.",

  properties: {
    Hint: { type: "string", default: "Enter text…", editable: true },
    Text: { type: "string", default: "", editable: true },
    MultiLine: { type: "boolean", default: false, editable: true },
  },

  events: {
    TextChanged: { params: [] },
  },
  methods: {},

  designer: {
    defaultSize: { width: 200, height: 36 },
    render: (p) => {
      const hint = escapeHtml(p.Hint);
      const text = escapeHtml(p.Text);
      return p.MultiLine
        ? `<textarea class="bw-textbox" placeholder="${hint}" rows="3">${text}</textarea>`
        : `<input class="bw-textbox" type="text" placeholder="${hint}" value="${text}">`;
    },
  },

  runtime: {
    create(id, props) {
      const el = props.MultiLine
        ? document.createElement("textarea")
        : document.createElement("input");
      if (!props.MultiLine) el.type = "text";
      el.className = "bw-textbox";
      applyProp(el, "Hint", props.Hint);
      applyProp(el, "Text", props.Text);
      return el;
    },
    update: applyProp,
    read(el, prop) { if (prop === "Text") return el.value; },
    wireEvents(el, dispatch) {
      el.addEventListener("input", () => dispatch("TextChanged"));
    },
  },
};
