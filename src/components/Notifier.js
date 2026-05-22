/*
 * Notifier — a non-visible component for messages: alerts, toasts, and choices.
 *
 * It renders its own in-app overlays into the app root (ctx.root) rather than
 * using window.alert/confirm, because the sandboxed preview blocks those native
 * dialogs. ShowChoice fires the ChoiceSelected event (via ctx.dispatch) with the
 * chosen text as the payload. Styling lives in components.css (.bw-notify-*).
 */

function overlay(root) {
  const back = document.createElement("div");
  back.className = "bw-notify-overlay";
  const card = document.createElement("div");
  card.className = "bw-notify-card";
  back.append(card);
  root.append(back);
  return { back, card, close: () => back.remove() };
}

function button(label, onClick) {
  const b = document.createElement("button");
  b.className = "bw-notify-btn";
  b.type = "button";
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}

export const Notifier = {
  name: "Notifier",
  category: "UI",
  icon: "💬",
  visible: false,
  help: "Shows messages: an alert, a brief toast, or a choice of buttons.",

  properties: {},

  events: {
    ChoiceSelected: { params: [{ name: "choice", type: "string" }] },
  },

  methods: {
    ShowAlert: {
      params: [{ name: "message", type: "string" }],
      run: (_el, [message], ctx) => {
        const { card, close } = overlay(ctx.root);
        const text = document.createElement("p");
        text.className = "bw-notify-text";
        text.textContent = String(message ?? "");
        card.append(text, button("OK", close));
      },
    },
    ShowToast: {
      params: [{ name: "message", type: "string" }],
      run: (_el, [message], ctx) => {
        const toast = document.createElement("div");
        toast.className = "bw-notify-toast";
        toast.textContent = String(message ?? "");
        ctx.root.append(toast);
        setTimeout(() => toast.remove(), 2500);
      },
    },
    ShowChoice: {
      params: [{ name: "message", type: "string" }, { name: "choices", type: "string" }],
      run: (_el, [message, choices], ctx) => {
        const list = Array.isArray(choices)
          ? choices
          : String(choices ?? "").split(",").map((s) => s.trim()).filter(Boolean);
        const { card, close } = overlay(ctx.root);
        const text = document.createElement("p");
        text.className = "bw-notify-text";
        text.textContent = String(message ?? "");
        card.append(text);
        const row = document.createElement("div");
        row.className = "bw-notify-row";
        for (const choice of list) {
          row.append(button(choice, () => { close(); ctx.dispatch("ChoiceSelected", choice); }));
        }
        card.append(row);
      },
    },
  },

  runtime: {
    create: () => null,
    update: () => {},
    wireEvents: () => {},
  },
};
