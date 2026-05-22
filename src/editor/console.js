/*
 * console.js — the in-editor developer console.
 *
 * "No silent failures" is a project rule. Every part of the editor reports
 * problems here instead of (only) the browser devtools, so a teacher can see
 * what went wrong without opening F12. Generated preview code also pipes its
 * logs back to this panel.
 *
 * Usage:
 *   import { devlog } from "./console.js";
 *   devlog.info("Saved project");
 *   devlog.error("Export failed", err);
 */

const MAX_LINES = 200; // keep the DOM small; older lines drop off the top

let logEl;     // <pre id="console-log">
let countEl;   // badge showing total messages
let consoleEl; // <section class="console"> wrapper (for auto-expand)
let count = 0;

/** Wire the logger to the DOM. Call once on startup. */
export function initConsole() {
  logEl = document.getElementById("console-log");
  countEl = document.getElementById("console-count");
  consoleEl = document.querySelector(".console");

  // Collapse / expand by clicking the header (mouse + keyboard).
  const toggle = document.getElementById("console-toggle");
  const setCollapsed = (collapsed) => {
    consoleEl.dataset.collapsed = String(collapsed);
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.querySelector("span").textContent = collapsed ? "▸ Console" : "▾ Console";
  };
  toggle.addEventListener("click", () =>
    setCollapsed(consoleEl.dataset.collapsed !== "true")
  );
  toggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle.click(); }
  });

  // Catch anything that slips past explicit try/catch.
  window.addEventListener("error", (e) =>
    devlog.error(e.message, e.error?.stack || `${e.filename}:${e.lineno}`)
  );
  window.addEventListener("unhandledrejection", (e) =>
    devlog.error("Unhandled promise rejection", e.reason)
  );

  devlog._expand = () => setCollapsed(false);
  devlog.info("Blockwork ready.");
}

function write(level, args) {
  count += 1;
  if (countEl) countEl.textContent = String(count);
  if (!logEl) { console[level === "info" ? "log" : level](...args); return; }

  const line = document.createElement("div");
  line.className = `log-line ${level}`;
  const time = new Date().toLocaleTimeString();
  line.innerHTML = `<span class="time">${time}</span>`;
  line.append(args.map(stringify).join(" "));
  logEl.append(line);

  while (logEl.childElementCount > MAX_LINES) logEl.firstElementChild.remove();
  logEl.scrollTop = logEl.scrollHeight;

  // Surface problems immediately — expand the panel on first error/warning.
  if ((level === "error" || level === "warn") && devlog._expand) devlog._expand();

  // Mirror to the real console too, for contributors who do open devtools.
  console[level === "info" ? "log" : level](...args);
}

function stringify(v) {
  if (typeof v === "string") return v;
  if (v instanceof Error) return v.stack || v.message;
  try { return JSON.stringify(v); } catch { return String(v); }
}

export const devlog = {
  info: (...a) => write("info", a),
  warn: (...a) => write("warn", a),
  error: (...a) => write("error", a),
};
