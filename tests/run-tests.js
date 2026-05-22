/*
 * run-tests.js — a dependency-free stress test for the component model.
 *
 * The spec says: prove the component schema with Button and Label before any UI
 * work. This file does exactly that — it exercises schema utilities, the three
 * proof-of-concept components, and the registry, then reports pass/fail both on
 * the page and to the console (so it can run headless via the preview tools).
 *
 * Run it by opening tests/component-model.test.html through a local server.
 */

import {
  coerce, dimensionToCss, escapeHtml, defaultProps, validateComponent,
} from "../src/components/schema.js";
import { Button } from "../src/components/Button.js";
import { Label } from "../src/components/Label.js";
import { Screen } from "../src/components/Screen.js";
import {
  components, registryErrors, getComponent, allComponents,
  visibleComponents, componentsByCategory,
} from "../src/components/_registry.js";

/* ---- micro test framework ---- */
const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (err) { results.push({ name, ok: false, err: err.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || "assertion failed"); }
function eq(a, b, msg) {
  if (a !== b) throw new Error(`${msg || "not equal"} — got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}`);
}

/* ---- schema utilities ---- */
test("coerce: boolean accepts real and string booleans", () => {
  eq(coerce("boolean", "true"), true);
  eq(coerce("boolean", "false"), false);
  eq(coerce("boolean", true), true);
});
test("coerce: number parses strings, falls back to 0", () => {
  eq(coerce("number", "14"), 14);
  eq(coerce("number", "nope"), 0);
});
test("coerce: dimension normalises auto/fill/px", () => {
  eq(coerce("dimension", "auto"), "auto");
  eq(coerce("dimension", "120px"), 120);
  eq(coerce("dimension", 80), 80);
});
test("dimensionToCss maps to CSS", () => {
  eq(dimensionToCss("auto"), "auto");
  eq(dimensionToCss("fill"), "100%");
  eq(dimensionToCss(120), "120px");
});
test("escapeHtml neutralises markup", () => {
  eq(escapeHtml("<b>&\"'"), "&lt;b&gt;&amp;&quot;&#39;");
});
test("defaultProps builds the coerced default bag", () => {
  const p = defaultProps(Button);
  eq(p.Text, "Button");
  eq(p.Enabled, true);
  eq(p.Width, "auto");
});

/* ---- validation ---- */
test("all registered components validate clean", () => {
  for (const def of allComponents()) {
    const errs = validateComponent(def);
    assert(errs.length === 0, `${def.name}: ${errs.join("; ")}`);
  }
});
test("validation catches a broken component", () => {
  const broken = {
    name: "Broken", category: "UI", icon: "x", visible: true,
    properties: { Bad: { type: "wat", default: 1 } },
    runtime: { create() {}, update() {} }, // missing wireEvents
    // missing designer.render
  };
  const errs = validateComponent(broken);
  assert(errs.some((e) => e.includes("unknown type")), "should flag unknown prop type");
  assert(errs.some((e) => e.includes("wireEvents")), "should flag missing wireEvents");
  assert(errs.some((e) => e.includes("designer.render")), "should flag missing render");
});

/* ---- registry ---- */
test("registry built without errors", () => {
  assert(registryErrors.length === 0, registryErrors.join(" | "));
});
test("registry indexes all components", () => {
  eq(allComponents().length, 17); // 9 MVP + 3 sensors + MqttClient + 4 widgets
  eq(visibleComponents().length, 11); // 7 + Switch, Slider, Gauge, LineChart
  assert(getComponent("Button") === Button, "getComponent returns Button");
  assert(components.has("Notifier") && components.has("LocalStorage"), "has non-visible components");
});

test("MqttClient: editable broker config + read-only readings + pub/sub methods", () => {
  const m = getComponent("MqttClient");
  assert(m && m.visible === false, "MqttClient is non-visible");
  eq(m.properties.BrokerUrl.editable, true);
  eq(m.properties.Password.type, "password");
  eq(m.properties.LastMessage.editable, false); // getter-only
  for (const name of ["Connect", "Subscribe", "Publish", "Disconnect"]) {
    assert(typeof m.methods[name]?.run === "function", `has ${name}()`);
  }
  // "password" is a recognised property type
  eq(coerce("password", 123), "123");
});

test("sensors are non-visible with read-only readings", () => {
  for (const name of ["Geolocation", "Camera", "Accelerometer"]) {
    const def = getComponent(name);
    assert(def, `${name} registered`);
    eq(def.visible, false);
    eq(def.runtime.create("x", {}), null);
    // Every property is a read-only reading (editable: false → getter-only block).
    for (const spec of Object.values(def.properties)) eq(spec.editable, false);
  }
});

test("Geolocation.RequestLocation updates readings and fires LocationChanged", () => {
  const Geo = getComponent("Geolocation");
  // Stub the browser geolocation API.
  const original = navigator.geolocation;
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition: (ok) => ok({ coords: { latitude: 51.5, longitude: -0.12, accuracy: 8 } }) },
    configurable: true,
  });
  const props = {};
  let fired = null;
  const ctx = {
    id: "Geolocation1",
    app: { set: (_id, prop, val) => { props[prop] = val; } },
    dispatch: (e) => { fired = e; },
  };
  Geo.methods.RequestLocation.run(null, [], ctx);
  Object.defineProperty(navigator, "geolocation", { value: original, configurable: true });
  eq(props.Latitude, 51.5);
  eq(props.Longitude, -0.12);
  eq(fired, "LocationChanged");
});
test("registry groups by category", () => {
  const groups = componentsByCategory();
  assert(groups.get("UI").includes(Button), "UI group has Button");
  assert(groups.get("Layout").includes(Screen), "Layout group has Screen");
});

/* ---- designer layer ---- */
test("Button.render shows text and escapes it", () => {
  const html = Button.designer.render(defaultProps(Button));
  assert(html.includes(">Button</button>"), "renders the text");
  const evil = Button.designer.render({ ...defaultProps(Button), Text: "<x>" });
  assert(evil.includes("&lt;x&gt;") && !evil.includes("<x>"), "escapes user text");
});
test("Screen.render marks a child slot", () => {
  const html = Screen.designer.render(defaultProps(Screen));
  assert(html.includes("data-bw-slot"), "container exposes a child slot");
});

/* ---- runtime layer ---- */
test("Button.create builds a real, styled <button>", () => {
  const el = Button.runtime.create("b1", { ...defaultProps(Button), BackgroundColor: "#ff0000", Enabled: false });
  eq(el.tagName, "BUTTON");
  eq(el.textContent, "Button");
  eq(el.disabled, true);
  assert(el.style.background.includes("255") || el.style.background === "#ff0000", "background applied");
});
test("Button.update applies a single property change", () => {
  const el = Button.runtime.create("b1", defaultProps(Button));
  Button.runtime.update(el, "Text", "Go");
  eq(el.textContent, "Go");
});
test("Button.wireEvents dispatches Click on click", () => {
  const el = Button.runtime.create("b1", defaultProps(Button));
  let fired = null;
  Button.runtime.wireEvents(el, (name) => { fired = name; });
  el.click();
  eq(fired, "Click");
});
test("Label.create reflects font properties", () => {
  const el = Label.runtime.create("l1", { ...defaultProps(Label), FontBold: true, FontSize: 22 });
  eq(el.style.fontWeight, "700");
  eq(el.style.fontSize, "22px");
});
test("Screen is a container with childHost", () => {
  assert(Screen.container === true, "Screen.container is true");
  const el = Screen.runtime.create("s1", defaultProps(Screen));
  assert(Screen.runtime.childHost(el) === el, "childHost returns the screen element");
});

/* ---- M6 components ---- */
test("TextBox reads its live (typed) value", () => {
  const TextBox = getComponent("TextBox");
  const el = TextBox.runtime.create("t1", defaultProps(TextBox));
  el.value = "typed";
  eq(TextBox.runtime.read(el, "Text"), "typed");
});
test("Arrangements are containers with a child host", () => {
  for (const name of ["HorizontalArrangement", "VerticalArrangement"]) {
    const def = getComponent(name);
    assert(def.container === true, `${name} is a container`);
    const el = def.runtime.create("a", defaultProps(def));
    assert(def.runtime.childHost(el) === el, `${name} childHost`);
  }
});
test("non-visible components render nothing", () => {
  for (const name of ["LocalStorage", "Notifier"]) {
    const def = getComponent(name);
    eq(def.visible, false);
    eq(def.runtime.create("x", {}), null);
  }
});
test("LocalStorage round-trips a value", () => {
  const LS = getComponent("LocalStorage");
  LS.methods.RemoveTag.run(null, ["score"]);
  eq(LS.methods.GetValue.run(null, ["score", "none"]), "none");
  LS.methods.StoreValue.run(null, ["score", 42]);
  eq(LS.methods.GetValue.run(null, ["score", "none"]), 42); // number survives
  LS.methods.RemoveTag.run(null, ["score"]);
});
test("Notifier.ShowChoice dispatches ChoiceSelected", () => {
  const N = getComponent("Notifier");
  const root = document.createElement("div");
  let chosen = null;
  const ctx = { id: "Notifier1", app: {}, root, dispatch: (e, p) => { if (e === "ChoiceSelected") chosen = p; } };
  N.methods.ShowChoice.run(null, ["Pick one", "A,B"], ctx);
  const btns = root.querySelectorAll(".bw-notify-btn");
  eq(btns.length, 2, "one button per choice");
  btns[1].click();
  eq(chosen, "B");
});

/* ---- dashboard widgets ---- */
test("Switch reads its On state and toggles", () => {
  const Sw = getComponent("Switch");
  const el = Sw.runtime.create("s", { ...defaultProps(Sw), On: true });
  eq(Sw.runtime.read(el, "On"), true);
  el.querySelector("input").checked = false;
  eq(Sw.runtime.read(el, "On"), false);
});
test("Slider reads its numeric Value", () => {
  const Sl = getComponent("Slider");
  const el = Sl.runtime.create("s", { ...defaultProps(Sl), Min: 0, Max: 100, Value: 30 });
  eq(Sl.runtime.read(el, "Value"), 30);
});
test("Gauge renders an SVG arc and re-renders on update", () => {
  const G = getComponent("Gauge");
  const el = G.runtime.create("g", { ...defaultProps(G), Value: 50, Max: 100, Color: "#123456" });
  assert(el.innerHTML.includes("<svg"), "draws an svg");
  assert(el.innerHTML.includes("#123456"), "uses the value-arc colour");
  G.runtime.update(el, "Value", 0);
  assert(el.innerHTML.includes("<svg"), "still an svg after update");
});
test("LineChart.AddPoint accumulates and caps at MaxPoints", () => {
  const C = getComponent("LineChart");
  const el = C.runtime.create("c", { ...defaultProps(C), MaxPoints: 3 });
  for (const v of [1, 2, 3, 4, 5]) C.methods.AddPoint.run(el, [v]);
  eq(el._points.length, 3);
  eq(el._points[2], 5); // newest kept
  assert(el.innerHTML.includes("polyline"), "draws a line once it has points");
  C.methods.Clear.run(el, []);
  eq(el._points.length, 0);
});

/* ---- report ---- */
const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;

const root = document.getElementById("results");
if (root) {
  root.innerHTML = results.map((r) =>
    `<li class="${r.ok ? "pass" : "fail"}">${r.ok ? "✓" : "✗"} ${r.name}` +
    (r.ok ? "" : `<br><small>${r.err}</small>`) + "</li>"
  ).join("");
  document.getElementById("summary").textContent =
    `${passed} passed, ${failed} failed`;
  document.getElementById("summary").className = failed ? "fail" : "pass";
}

// Headless-friendly summary line for the console.
console.log(`TEST RESULT: ${passed} passed, ${failed} failed`);
for (const r of results) if (!r.ok) console.error(`FAIL: ${r.name} — ${r.err}`);
