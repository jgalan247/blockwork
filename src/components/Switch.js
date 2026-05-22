/*
 * Switch — an on/off toggle. A control widget: read its On state, or react to
 * the Changed event (e.g. publish "on"/"off" to an MQTT topic).
 */

function applyProp(el, prop, value) {
  const input = el.querySelector("input");
  switch (prop) {
    case "On": input.checked = !!value; break;
    case "Enabled": input.disabled = !value; break;
    case "Color": el.style.setProperty("--bw-switch-color", value); break;
  }
}

export const Switch = {
  name: "Switch",
  category: "UI",
  icon: "🔀",
  visible: true,
  help: "An on/off toggle. Read On, or use the Changed event.",

  properties: {
    On: { type: "boolean", default: false, editable: true },
    Color: { type: "color", default: "#2563eb", editable: true },
    Enabled: { type: "boolean", default: true, editable: true },
  },

  events: { Changed: { params: [] } },
  methods: {},

  designer: {
    defaultSize: { width: 46, height: 26 },
    render: (p) => `<label class="bw-switch" style="--bw-switch-color:${p.Color}">` +
      `<input type="checkbox"${p.On ? " checked" : ""}${p.Enabled ? "" : " disabled"}>` +
      `<span class="bw-switch-track"></span></label>`,
  },

  runtime: {
    create(id, props) {
      const el = document.createElement("label");
      el.className = "bw-switch";
      el.innerHTML = '<input type="checkbox"><span class="bw-switch-track"></span>';
      for (const [prop, value] of Object.entries(props)) applyProp(el, prop, value);
      return el;
    },
    update: applyProp,
    read(el, prop) { if (prop === "On") return el.querySelector("input").checked; },
    wireEvents(el, dispatch) {
      el.querySelector("input").addEventListener("change", () => dispatch("Changed"));
    },
  },
};
