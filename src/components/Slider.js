/*
 * Slider — a draggable range control. Read its Value, or react to ValueChanged
 * (e.g. to drive a Gauge or publish a setpoint over MQTT).
 */

function applyProp(el, prop, value) {
  switch (prop) {
    case "Min": el.min = value; break;
    case "Max": el.max = value; break;
    case "Value": el.value = value; break;
    case "Color": el.style.accentColor = value; break;
  }
}

export const Slider = {
  name: "Slider",
  category: "UI",
  icon: "🎚️",
  visible: true,
  help: "A draggable slider. Read Value, or use the ValueChanged event.",

  properties: {
    Min: { type: "number", default: 0, editable: true },
    Max: { type: "number", default: 100, editable: true },
    Value: { type: "number", default: 50, editable: true },
    Color: { type: "color", default: "#2563eb", editable: true },
  },

  events: { ValueChanged: { params: [] } },
  methods: {},

  designer: {
    defaultSize: { width: 200, height: 28 },
    render: (p) => `<input type="range" class="bw-slider" min="${p.Min}" max="${p.Max}" ` +
      `value="${p.Value}" style="accent-color:${p.Color}">`,
  },

  runtime: {
    create(id, props) {
      const el = document.createElement("input");
      el.type = "range";
      el.className = "bw-slider";
      for (const [prop, value] of Object.entries(props)) applyProp(el, prop, value);
      return el;
    },
    update: applyProp,
    read(el, prop) { if (prop === "Value") return Number(el.value); },
    wireEvents(el, dispatch) {
      el.addEventListener("input", () => dispatch("ValueChanged"));
    },
  },
};
