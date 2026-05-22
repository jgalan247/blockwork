/*
 * schema.js — the component contract.
 *
 * This is the single most important file in Blockwork. Every component is one
 * plain object that conforms to the shape documented here. Four different parts
 * of the system read that one object:
 *
 *   • the designer  — uses `designer.render(props)` to draw a static preview
 *   • the inspector — uses `properties` to build property editors
 *   • the blocks    — uses `properties`, `events`, `methods` to generate blocks
 *   • the runtime   — uses `runtime.*` to build and drive the real DOM
 *
 * Because the designer, blocks and runtime are all *generated* from the schema,
 * adding a new component never means editing the editor. You write one file.
 *
 * --------------------------------------------------------------------------
 * The shape of a component definition
 * --------------------------------------------------------------------------
 *   {
 *     name:      "Button",        // unique; also the block prefix
 *     category:  "UI",            // palette grouping
 *     icon:      "🔘",            // shown in palette + component tree
 *     visible:   true,            // false = non-visible (logic only, e.g. Notifier)
 *     container: false,           // optional; true = can hold child components
 *     help:      "...",           // optional one-line description
 *
 *     properties: {
 *       Text: { type: "string", default: "Button", editable: true },
 *       // type ∈ keys of PROPERTY_TYPES below
 *       // enum types also carry: options: ["Left", "Center", "Right"]
 *     },
 *
 *     events:  { Click: { params: [] } },
 *     methods: { Focus: { params: [], run: (el, args, ctx) => {...} } },
 *
 *     // visible components only:
 *     designer: {
 *       defaultSize: { width: 120, height: 40 },
 *       render: (props) => `<button ...>${...}</button>`   // returns an HTML string
 *     },
 *
 *     runtime: {
 *       create:     (id, props) => Element | null,   // build live DOM
 *       update:     (el, prop, value) => void,       // apply one property change
 *       wireEvents: (el, dispatch) => void,          // dispatch(eventName, payload)
 *       read?:      (el, prop) => value,             // read a live value (e.g. TextBox.Text)
 *       childHost?: (el) => Element                  // where children mount (containers)
 *     }
 *   }
 *
 * `methods[x].run` receives (el, args, ctx). `ctx` is supplied by the runtime
 * (Milestone 5) and exposes { id, app } where `app` can get/set properties,
 * dispatch events, and reach the app root for overlays.
 */

/* ------------------------------------------------------------------ */
/* Property types                                                     */
/* ------------------------------------------------------------------ */
/*
 * Each property has a `type`. The type decides how a raw value (from a property
 * editor or a block) is coerced into a real JS value. Keep this list small and
 * obvious — it is the vocabulary every component author works with.
 */
export const PROPERTY_TYPES = {
  string: { coerce: (v) => (v == null ? "" : String(v)) },
  color: { coerce: (v) => String(v) },
  boolean: { coerce: (v) => v === true || v === "true" },
  number: { coerce: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; } },
  dimension: { coerce: (v) => normalizeDimension(v) },
  enum: { coerce: (v) => String(v) },
};

/** A dimension is "auto", "fill", or a pixel count. Normalise any input to one. */
export function normalizeDimension(value) {
  if (value === "auto" || value === "fill") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = String(value).trim().toLowerCase();
  if (s === "auto" || s === "fill") return s;
  const n = Number(s.endsWith("px") ? s.slice(0, -2) : s);
  return Number.isFinite(n) ? n : "auto";
}

/** Turn a normalised dimension into a CSS value. */
export function dimensionToCss(value) {
  const d = normalizeDimension(value);
  if (d === "auto") return "auto";
  if (d === "fill") return "100%";
  return `${d}px`;
}

/** Coerce a raw value using a property's declared type (lenient: unknown → string). */
export function coerce(type, value) {
  return (PROPERTY_TYPES[type] ?? PROPERTY_TYPES.string).coerce(value);
}

/** Escape text so user-supplied strings can't break designer HTML. */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/** Build the default property bag for a component ({ Prop: default, ... }). */
export function defaultProps(def) {
  const props = {};
  for (const [name, spec] of Object.entries(def.properties ?? {})) {
    props[name] = coerce(spec.type, spec.default);
  }
  return props;
}

/* ------------------------------------------------------------------ */
/* Validation                                                         */
/* ------------------------------------------------------------------ */
/*
 * Returns a list of human-readable problems with a component definition — empty
 * means valid. The registry runs this on every component and surfaces failures
 * in the dev console, so a teacher writing a new component gets a precise error
 * instead of a silent blank screen.
 */
export function validateComponent(def) {
  const errors = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };

  if (!def || typeof def !== "object") return ["definition is not an object"];

  need(typeof def.name === "string" && def.name, "missing `name`");
  need(typeof def.category === "string" && def.category, "missing `category`");
  need(typeof def.icon === "string" && def.icon, "missing `icon`");
  need(typeof def.visible === "boolean", "`visible` must be true or false");

  for (const [prop, spec] of Object.entries(def.properties ?? {})) {
    need(spec && PROPERTY_TYPES[spec.type], `property "${prop}" has unknown type "${spec?.type}"`);
    need(spec && "default" in spec, `property "${prop}" has no default`);
    if (spec?.type === "enum") {
      need(Array.isArray(spec.options) && spec.options.length,
        `enum property "${prop}" needs a non-empty options array`);
    }
  }

  for (const [name, m] of Object.entries(def.methods ?? {})) {
    need(typeof m.run === "function", `method "${name}" needs a run() function`);
  }

  // Runtime contract applies to every component (non-visible ones still build state).
  need(def.runtime && typeof def.runtime.create === "function", "missing runtime.create()");
  need(def.runtime && typeof def.runtime.update === "function", "missing runtime.update()");
  need(def.runtime && typeof def.runtime.wireEvents === "function", "missing runtime.wireEvents()");

  // Designer contract applies only to visible components.
  if (def.visible) {
    need(def.designer && typeof def.designer.render === "function", "visible component missing designer.render()");
    need(def.designer && def.designer.defaultSize, "visible component missing designer.defaultSize");
  }

  return errors;
}
