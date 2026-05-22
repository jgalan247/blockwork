# Adding a component

This is the whole point of Blockwork's design: you add a component by writing
**one self-contained file** and adding **two lines** to the registry. You never
touch the designer, the inspector, the blocks, or the runtime — they all read
your component's description and generate themselves.

Audience: a teacher comfortable with a little JavaScript. Budget: an afternoon.

## 1. Copy the reference component

[`src/components/Button.js`](../src/components/Button.js) is written to be
copied. It uses every part of the schema. Start there:

```bash
cp src/components/Button.js src/components/Switch.js
```

## 2. Fill in the description

Every component is one exported object. The fields are documented in full in
[`src/components/schema.js`](../src/components/schema.js); here's the shape:

```js
export const Switch = {
  name: "Switch",          // unique; becomes the block prefix
  category: "UI",          // palette group
  icon: "🔀",              // shown in the palette and component tree
  visible: true,           // false for logic-only components (e.g. Notifier)
  help: "An on/off toggle.",

  properties: {
    On:    { type: "boolean", default: false, editable: true },
    Color: { type: "color",   default: "#2563eb", editable: true },
  },

  events:  { Changed: { params: [] } },
  methods: {},

  designer: {
    defaultSize: { width: 60, height: 32 },
    render: (p) => `<input type="checkbox" class="bw-switch"${p.On ? " checked" : ""}>`,
  },

  runtime: {
    create(id, props) { /* build and return the DOM element */ },
    update(el, prop, value) { /* apply ONE property change */ },
    wireEvents(el, dispatch) { /* dispatch("Changed") on change */ },
  },
};
```

### Property types

`type` is one of: `string`, `color`, `boolean`, `number`, `dimension`, `enum`.
For `enum`, also provide `options: ["Left", "Center", "Right"]`. These are the
only types — they're defined in `PROPERTY_TYPES` in `schema.js`.

### The one rule that matters

Put the logic for applying a property in **one** place and call it from both
`create` and `update`. Button does this with a module-level `applyProp(el, prop,
value)` and `update: applyProp`. This guarantees the first render and later edits
behave identically.

### Events and methods

- `wireEvents(el, dispatch)` binds DOM listeners and calls `dispatch("EventName",
  payload)`. The payload (optional) becomes available to event blocks.
- A method is implemented inline: `methods: { Focus: { params: [], run: (el,
  args, ctx) => el.focus() } }`. `ctx` gives `{ id, app }` for reaching the
  runtime (get/set other properties, dispatch events, app root).

### Containers

If your component holds children, set `container: true`, mark the child slot in
your designer HTML with `data-bw-slot`, and add `runtime.childHost(el)` returning
the element children should mount into. See
[`Screen.js`](../src/components/Screen.js).

### Non-visible components

Set `visible: false` and omit `designer`. The component appears in the
non-visible tray, not on the canvas, and its `runtime.create` returns `null`.
Its behaviour lives entirely in `methods`. See `Notifier.js` / `LocalStorage.js`.

## 3. Register it

Open [`src/components/_registry.js`](../src/components/_registry.js) and add two
lines:

```js
import { Switch } from "./Switch.js";   // with the other imports
// ...
const DEFINITIONS = [ Screen, Button, Label, Switch ];  // add to the list
```

That's the only edit outside your component file.

## 4. Style it (optional)

Shared default styling lives in
[`src/styles/components.css`](../src/styles/components.css) under `.bw-*`
classes. Add a `.bw-switch` rule there if you want defaults beyond the inline
styles your component sets from properties. The same stylesheet is used by the
canvas, the live preview, and exported apps, so your component looks identical
everywhere.

## 5. Test it

The component model has a stress-test harness. Add a few assertions to
[`tests/run-tests.js`](../tests/run-tests.js) and open
`tests/component-model.test.html` through a local server. The registry also
**validates** your component on load — if a required field is missing or a
property type is unknown, you'll see a precise message in the editor's dev
console (the panel at the bottom), not a blank screen.

That's it. Reload the editor and your component is in the palette, has property
editors, generates blocks, previews live, and exports — all from the one file
you wrote.
