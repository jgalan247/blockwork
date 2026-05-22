/*
 * LineChart — plots a running series of values over time. A display widget for
 * dashboards: call AddPoint(value) on each new reading and the line scrolls;
 * Clear empties it. Y-axis auto-scales to the data.
 *
 * State (the data points) lives on the element so it survives between calls;
 * the SVG is redrawn from the points and the element's current props.
 */

import { escapeHtml } from "./schema.js";

const W = 100, H = 50; // SVG viewBox units

function chartSvg(points, p) {
  const color = p.Color || "#6366f1";
  if (points.length < 2) {
    return `<svg viewBox="0 0 ${W} ${H}" class="bw-chart-svg">` +
      `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" class="bw-chart-empty">` +
      `${escapeHtml(points.length ? String(points[0]) : "no data yet")}</text></svg>`;
  }

  let lo = Math.min(...points), hi = Math.max(...points);
  if (lo === hi) { lo -= 1; hi += 1; }            // avoid divide-by-zero on flat data
  const pad = (hi - lo) * 0.1;
  lo -= pad; hi += pad;

  const stepX = W / (points.length - 1);
  const coords = points.map((v, i) => {
    const x = (i * stepX).toFixed(2);
    const y = (H - ((v - lo) / (hi - lo)) * H).toFixed(2);
    return `${x},${y}`;
  }).join(" ");

  return `<svg viewBox="0 0 ${W} ${H}" class="bw-chart-svg" preserveAspectRatio="none">` +
    `<polyline points="${coords}" fill="none" stroke="${color}" stroke-width="1.5" ` +
    `stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}

function redraw(el) { el.innerHTML = chartSvg(el._points, el._props); }

export const LineChart = {
  name: "LineChart",
  category: "Dashboard",
  icon: "📈",
  visible: true,
  help: "Plots values over time. Call AddPoint(value) for each reading.",

  properties: {
    Color: { type: "color", default: "#6366f1", editable: true },
    MaxPoints: { type: "number", default: 30, editable: true },
  },

  events: {},

  methods: {
    AddPoint: {
      params: [{ name: "value", type: "number" }],
      run: (el, [value]) => {
        if (!el) return;
        el._points.push(Number(value) || 0);
        const max = Number(el._props.MaxPoints) || 30;
        while (el._points.length > max) el._points.shift();
        redraw(el);
      },
    },
    Clear: {
      params: [],
      run: (el) => { if (el) { el._points = []; redraw(el); } },
    },
  },

  designer: {
    defaultSize: { width: 240, height: 120 },
    render: (p) => `<div class="bw-chart">${chartSvg([], p)}</div>`,
  },

  runtime: {
    create(id, props) {
      const el = document.createElement("div");
      el.className = "bw-chart";
      el._props = { ...props };
      el._points = [];
      redraw(el);
      return el;
    },
    update(el, prop, value) { el._props[prop] = value; redraw(el); },
    wireEvents() {},
  },
};
