/*
 * runtime.js — the small framework that runs inside every preview and every
 * exported app. It turns a project's screen tree into live DOM and exposes the
 * `$bw` API that block-generated code calls into.
 *
 * It reuses the very same component definitions the editor uses (Button.js,
 * Label.js, …). Nothing here knows about the editor — this code ships to
 * students, so it imports only the component model.
 *
 * The `$bw` API (what generated blocks call):
 *   $bw.on(name, event, fn)   register an event handler
 *   $bw.set(name, prop, value)set a property (updates the live DOM)
 *   $bw.get(name, prop)       read a property (live value if the component reads one)
 *   $bw.call(name, method, [..]) call a component method, returns its result
 */

import { getComponent } from "../components/_registry.js";
import { defaultProps, coerce } from "../components/schema.js";

/**
 * Build the app into `root` from a project, returning { api, instances }.
 * `api` is the `$bw` object generated code runs against.
 */
export function mountApp(root, project) {
  const screen = project.screens[0];
  const instances = new Map();          // name -> { def, el, props }
  const handlers = new Map();           // "name/event" -> [fn, ...]

  const dispatch = (name, event, payload) => {
    for (const fn of handlers.get(`${name}/${event}`) ?? []) {
      try { fn(payload); } catch (err) { console.error(`${name}.${event} handler:`, err); }
    }
  };

  const api = {
    on(name, event, fn) {
      const key = `${name}/${event}`;
      if (!handlers.has(key)) handlers.set(key, []);
      handlers.get(key).push(fn);
    },
    set(name, prop, value) {
      const inst = instances.get(name);
      if (!inst) return;
      const spec = inst.def.properties?.[prop];
      const v = spec ? coerce(spec.type, value) : value;
      inst.props[prop] = v;
      if (inst.el) inst.def.runtime.update(inst.el, prop, v);
      if (name === screen.name && prop === "Title") document.title = v;
    },
    get(name, prop) {
      const inst = instances.get(name);
      if (!inst) return undefined;
      // Some components expose a live value (e.g. TextBox.Text after typing).
      if (inst.el && inst.def.runtime.read) {
        const live = inst.def.runtime.read(inst.el, prop);
        if (live !== undefined) return live;
      }
      return inst.props[prop];
    },
    call(name, method, args = []) {
      const inst = instances.get(name);
      const m = inst?.def.methods?.[method];
      if (!m || typeof m.run !== "function") return undefined;
      const ctx = { id: name, app: api, root, dispatch: (e, p) => dispatch(name, e, p) };
      return m.run(inst.el, args, ctx);
    },
  };

  // ---- Build the tree ----
  const screenDef = getComponent("Screen");
  const screenProps = { ...defaultProps(screenDef), ...screen.properties };
  const screenEl = screenDef.runtime.create(screen.name, screenProps);
  instances.set(screen.name, { def: screenDef, el: screenEl, props: screenProps });
  root.append(screenEl);
  if (screenProps.Title) document.title = screenProps.Title;

  const screenHost = hostOf(screenDef, screenEl);
  for (const node of screen.components ?? []) build(node, screenHost);

  function build(node, parentHost) {
    const def = getComponent(node.type);
    if (!def) { console.warn(`Unknown component type: ${node.type}`); return; }

    const props = { ...defaultProps(def), ...node.properties };
    const el = def.runtime.create(node.name, props); // null for non-visible components
    instances.set(node.name, { def, el, props });

    if (el) {
      parentHost.append(el);
      def.runtime.wireEvents(el, (event, payload) => dispatch(node.name, event, payload));
      if (def.container) {
        const host = hostOf(def, el);
        for (const child of node.children ?? []) build(child, host);
      }
    }
  }

  return { api, instances };
}

/** Where a container's children mount (its childHost, or the element itself). */
function hostOf(def, el) {
  return def.runtime.childHost ? def.runtime.childHost(el) : el;
}
