# ▦ Blockwork

**Build real phone apps from blocks, right in your browser.**

Blockwork is an open-source, [App Inventor](https://appinventor.mit.edu/)-style
visual app builder for **Progressive Web Apps**. It runs entirely in the
browser, needs no backend, and exports standalone PWAs that students can install
on their phones by scanning a QR code.

It's built for **secondary-school CS teachers and their students** — a bridge
between Scratch-style block programming and real mobile app development, without
the Android-toolchain pain that App Inventor itself wrestles with.

> **Status:** MVP complete — design UIs, wire blocks, preview live, and export
> installable PWAs. See the milestone checklist below.

---

## Why Blockwork

- **Zero-friction deployment.** It's plain static files. Any teacher can host it
  on GitHub Pages in minutes.
- **Forkable in an afternoon.** Vanilla JavaScript, no framework, no build step
  required. Read it, understand it, extend it.
- **No build step for users.** The deployed app is vanilla static files you can
  serve with `python -m http.server`.

## Quick start (run it locally)

No install, no build:

```bash
git clone https://github.com/<you>/blockwork.git
cd blockwork
python -m http.server 8000
# open http://localhost:8000
```

(Any static file server works. A server is needed — not `file://` — because the
editor uses ES modules and a service worker. While *developing* Blockwork
itself, `python3 tools/devserver.py 8000` adds no-cache headers so edits show up
on reload without fighting the offline cache.)

### Open an example

Click **Examples** in the toolbar and pick one (Guess the Number or Shopping
List), then press **Preview** to play. You can also **Import** any
`examples/*.json` file. To add your own example, drop a project JSON in
`examples/` and list it in `examples/examples.json`.

## Host it on GitHub Pages

1. Fork this repo.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   pick `main` and `/ (root)`.
3. Open `https://<you>.github.io/blockwork/`.

All paths in Blockwork are **relative**, so it works on a project-pages subpath
(`/blockwork/`) with no configuration.

## Add a new component

A component is a single self-describing file in `src/components/`. To add one,
copy an existing component (e.g. `Button.js`), adjust its schema, and register it
in `src/components/_registry.js`. The designer, properties panel, blocks, and
runtime are all generated from that schema — you don't touch the editor.

See **[docs/component-authoring.md](docs/component-authoring.md)** for the full
walkthrough.

## How it's built — four layers

| Layer | What it does | Where |
|-------|--------------|-------|
| **Editor** | The in-browser IDE: designer canvas, blocks, inspector, preview | `src/editor/` |
| **Component model** | One declarative spec per component (the core abstraction) | `src/components/` |
| **Runtime** | A small framework embedded in every exported app | `src/runtime/` |
| **Exporter** | Bundles a project into an installable PWA zip | `src/exporter/` |

More detail in **[docs/architecture.md](docs/architecture.md)**.

## Project structure

```
index.html              Editor shell
manifest.json           PWA manifest (the editor is itself installable)
service-worker.js       Offline editor (network-first)
src/
  editor/               The IDE: main, console, designer, inspector,
                        model, workspace, blocks, preview, project
  components/           One file per component + schema.js + _registry.js
  runtime/              runtime.js + runtime.template.html (ship in exports)
  exporter/             bundle.js — module bundler + PWA zip pipeline
  styles/               tokens.css (theme), editor.css, components.css
docs/                   architecture.md + component-authoring.md
examples/               Sample projects (open them via Import)
tests/                  Component-model stress test (open the .html)
tools/                  devserver.py (optional no-cache dev server)
vendor/                 jszip.min.js (Blockly loads from CDN by default)
```

## MVP scope

**Components:** Screen, Button, Label, TextBox, Image, Horizontal/Vertical
Arrangement, LocalStorage, Notifier.
**Blocks:** Blockly standard categories + auto-generated per-component blocks.
**Not in MVP:** sensors, networking, canvas, audio, multi-screen, accounts.

### Milestones

- [x] M1 — Repo scaffold, editor shell, theme, offline editor
- [x] M2 — Component model schema + Button/Label proof of concept
- [x] M3 — Designer canvas (drag-drop) + properties inspector
- [x] M4 — Blockly workspace + schema-driven block generation
- [x] M5 — Runtime framework + sandboxed live preview
- [x] M6 — Remaining MVP components
- [x] M7 — Project save/load (localStorage + JSON import/export)
- [x] M8 — PWA exporter (zip pipeline)
- [x] M9 — Example projects
- [x] M10 — Docs

## Tech stack

Vanilla JavaScript (ES2022, native modules) · [Blockly](https://developers.google.com/blockly)
· plain CSS with custom properties · `localStorage` + JSON · [JSZip](https://stuk.github.io/jszip/)
for export. No framework, no TypeScript, no required bundler.

## License

[MIT](LICENSE) © 2026 Blockwork contributors.
