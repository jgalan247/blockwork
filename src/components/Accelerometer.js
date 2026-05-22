/*
 * Accelerometer — a non-visible sensor that reads device motion.
 *
 * Call Start (from a user gesture — e.g. a Button.Click — because iOS requires
 * permission requested from a tap), then react to AccelerationChanged and read
 * the read-only XAccel/YAccel/ZAccel properties. Call Stop to stop listening.
 *
 * Motion events only fire on a moving physical device, so this is best tried in
 * an exported app on a phone, not the desktop preview.
 */

// One motion listener per component instance, so Stop can remove the right one.
const listeners = new Map();

export const Accelerometer = {
  name: "Accelerometer",
  category: "Sensors",
  icon: "📐",
  visible: false,
  help: "Reads device motion. Call Start, then use AccelerationChanged / XAccel etc.",

  properties: {
    XAccel: { type: "number", default: 0, editable: false },
    YAccel: { type: "number", default: 0, editable: false },
    ZAccel: { type: "number", default: 0, editable: false },
  },

  events: {
    AccelerationChanged: { params: [] },
  },

  methods: {
    Start: {
      params: [],
      run: async (_el, _args, ctx) => {
        // iOS 13+ requires explicit permission, requested from a user gesture.
        try {
          const DME = window.DeviceMotionEvent;
          if (DME && typeof DME.requestPermission === "function") {
            const result = await DME.requestPermission();
            if (result !== "granted") { console.warn("Motion permission denied."); return; }
          }
        } catch (err) {
          console.warn("Motion permission error:", err.message);
        }

        if (listeners.has(ctx.id)) return; // already running

        let lastFired = 0;
        const handler = (e) => {
          const a = e.accelerationIncludingGravity || e.acceleration;
          if (!a) return;
          const now = Date.now();
          if (now - lastFired < 100) return; // throttle to ~10 updates/sec
          lastFired = now;
          ctx.app.set(ctx.id, "XAccel", a.x || 0);
          ctx.app.set(ctx.id, "YAccel", a.y || 0);
          ctx.app.set(ctx.id, "ZAccel", a.z || 0);
          ctx.dispatch("AccelerationChanged");
        };
        window.addEventListener("devicemotion", handler);
        listeners.set(ctx.id, handler);
      },
    },
    Stop: {
      params: [],
      run: (_el, _args, ctx) => {
        const handler = listeners.get(ctx.id);
        if (handler) {
          window.removeEventListener("devicemotion", handler);
          listeners.delete(ctx.id);
        }
      },
    },
  },

  runtime: { create: () => null, update: () => {}, wireEvents: () => {} },
};
