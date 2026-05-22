/*
 * LocalStorage — a non-visible component that saves data on the device so it's
 * still there next time the app opens.
 *
 * Non-visible means: no `designer`, and runtime.create returns null. All the
 * behaviour is in `methods`. Values are JSON-encoded so numbers, booleans and
 * lists survive a round trip, not just strings.
 *
 * In the live preview the iframe is sandboxed (opaque origin) and real
 * localStorage throws, so we fall back to an in-memory store — values persist
 * for the session. In an exported, installed app, real localStorage is used.
 */

const memory = new Map();

const store = (() => {
  try {
    const probe = "__bw_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return {
      set: (k, v) => window.localStorage.setItem(k, v),
      get: (k) => window.localStorage.getItem(k),
      remove: (k) => window.localStorage.removeItem(k),
      clear: () => window.localStorage.clear(),
    };
  } catch {
    return {
      set: (k, v) => memory.set(k, v),
      get: (k) => (memory.has(k) ? memory.get(k) : null),
      remove: (k) => memory.delete(k),
      clear: () => memory.clear(),
    };
  }
})();

export const LocalStorage = {
  name: "LocalStorage",
  category: "Storage",
  icon: "💾",
  visible: false,
  help: "Saves values on the device by a tag, so they persist between visits.",

  properties: {},
  events: {},

  methods: {
    StoreValue: {
      params: [{ name: "tag", type: "string" }, { name: "value", type: "string" }],
      run: (_el, [tag, value]) => store.set(String(tag), JSON.stringify(value ?? null)),
    },
    GetValue: {
      params: [{ name: "tag", type: "string" }, { name: "ifEmpty", type: "string" }],
      returns: "any",
      run: (_el, [tag, ifEmpty]) => {
        const raw = store.get(String(tag));
        if (raw == null) return ifEmpty ?? "";
        try { return JSON.parse(raw); } catch { return raw; }
      },
    },
    RemoveTag: {
      params: [{ name: "tag", type: "string" }],
      run: (_el, [tag]) => store.remove(String(tag)),
    },
    ClearAll: {
      params: [],
      run: () => store.clear(),
    },
  },

  // Non-visible: nothing to render, but the runtime contract still applies.
  runtime: {
    create: () => null,
    update: () => {},
    wireEvents: () => {},
  },
};
