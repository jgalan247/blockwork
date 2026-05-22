/*
 * Geolocation — a non-visible sensor that reads the device's location.
 *
 * Proof that the component model scales to real device APIs: it's still just one
 * file. The readings (Latitude/Longitude/Accuracy) are read-only properties
 * (editable: false) — the block editor gives them getter blocks but no setters,
 * and the inspector hides them. RequestLocation fills them in and fires
 * LocationChanged.
 *
 * The browser asks the user for permission. In the sandboxed live preview the
 * browser usually blocks geolocation, so this is best tried in an exported,
 * installed app served over HTTPS (GitHub Pages works).
 */

export const Geolocation = {
  name: "Geolocation",
  category: "Sensors",
  icon: "📍",
  visible: false,
  help: "Reads the device location (with the user's permission). Call RequestLocation.",

  properties: {
    Latitude: { type: "number", default: 0, editable: false },
    Longitude: { type: "number", default: 0, editable: false },
    Accuracy: { type: "number", default: 0, editable: false },
  },

  events: {
    LocationChanged: { params: [] },
    LocationError: { params: [] },
  },

  methods: {
    RequestLocation: {
      params: [],
      run: (_el, _args, ctx) => {
        if (!navigator.geolocation) {
          console.warn("Geolocation is not available in this browser.");
          ctx.dispatch("LocationError");
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            ctx.app.set(ctx.id, "Latitude", pos.coords.latitude);
            ctx.app.set(ctx.id, "Longitude", pos.coords.longitude);
            ctx.app.set(ctx.id, "Accuracy", pos.coords.accuracy);
            ctx.dispatch("LocationChanged");
          },
          (err) => {
            console.warn("Geolocation error:", err.message);
            ctx.dispatch("LocationError");
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      },
    },
  },

  runtime: { create: () => null, update: () => {}, wireEvents: () => {} },
};
