# Blockwork architecture

Blockwork is four small layers around one central idea: **a component is a plain
JavaScript object that describes itself completely.** Everything else is
generated from those descriptions.

```
            ┌───────────────────────────────────────────────┐
            │              Component definitions             │
            │        src/components/*.js  (the schema)       │
            └───────────────────────────────────────────────┘
                 ▲            ▲             ▲            ▲
        reads    │            │             │            │
     ┌───────────┴──┐  ┌──────┴─────┐  ┌────┴─────┐  ┌───┴────────┐
     │   Designer   │  │  Inspector │  │  Blocks  │  │  Runtime   │
     │ canvas+tree  │  │ properties │  │ generated│  │ live DOM   │
     └──────────────┘  └────────────┘  └──────────┘  └────────────┘
                                                          │
                                                    ┌─────┴──────┐
                                                    │  Exporter  │
                                                    │  PWA zip   │
                                                    └────────────┘
```

## The four layers

1. **Editor** (`src/editor/`) — the in-browser IDE. The designer canvas,
   component tree, properties inspector, Blockly workspace, live preview, and
   project menu. `main.js` is a thin wiring harness; each feature is its own
   module.

2. **Component model** (`src/components/`) — one file per component, each
   exporting a definition object that conforms to **[`schema.js`](../src/components/schema.js)**.
   This is the layer to understand first; the others are consumers of it.

3. **Runtime** (`src/runtime/`) — a small framework embedded in every exported
   app. It reads the project JSON, instantiates components via their
   `runtime.create`, applies properties, wires events, and exposes a stable API
   that block-generated code calls into.

4. **Exporter** (`src/exporter/`) — assembles `index.html`, `app.js` (runtime +
   project data + generated block code), `manifest.json`, `service-worker.js`,
   and icons into a downloadable zip.

## The component contract (summary)

The authoritative, commented version lives in
[`src/components/schema.js`](../src/components/schema.js). In brief, each
component declares:

| Field | Used by | Purpose |
|-------|---------|---------|
| `name`, `category`, `icon`, `visible` | all | identity & palette placement |
| `container`, `childHost` | designer, runtime | can it hold children, and where |
| `properties` | inspector, blocks, runtime | typed, default-valued state |
| `events` | blocks, runtime | what the user can react to |
| `methods` | blocks, runtime | callable actions (`run()` implements them) |
| `designer.render` | designer | static HTML preview for the canvas |
| `runtime.create/update/wireEvents` | runtime | build & drive the live DOM |

Because all four consumers read the same object, **adding a component never
touches the editor** — see [component-authoring.md](component-authoring.md).

### Why the model layer has no editor dependencies

`schema.js`, `_registry.js`, and the component files import nothing from
`src/editor/`. The runtime and exporter reuse them verbatim, so editor-only code
(like the dev console) never leaks into a student's exported app. Validation
problems are collected in `registryErrors` and logged by the editor, not by the
registry itself.

## Project file format

A project is one JSON document (see [`examples/`](../examples)). It holds the
screen tree (component instances with their properties and children), the
Blockly XML, and any image assets as data URLs. The same JSON is what the
runtime consumes and what the exporter bundles.

```jsonc
{
  "name": "...",
  "screens": [{ "name": "Screen1", "properties": {...}, "components": [...] }],
  "blocks": "<xml>...</xml>",
  "assets": { "image_1.png": "data:image/png;base64,..." }
}
```

## Security model

- The **live preview** runs untrusted, student-generated code in an iframe
  sandboxed to `allow-scripts` only — no same-origin access, no navigation, no
  popups.
- Designer previews escape all user-supplied text (`escapeHtml`) so a label
  containing `<script>` can never execute in the editor.
- Generated code is only ever executed inside the sandboxed iframe (preview) or
  the exported app — never `eval`'d in the editor itself.

## No build step

Everything is native ES modules and plain CSS. `python -m http.server` is a
complete dev environment, and the deployed artifact is the same static files.
A bundler is optional and only ever a developer convenience.
