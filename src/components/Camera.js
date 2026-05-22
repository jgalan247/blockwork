/*
 * Camera — a non-visible sensor that takes a photo.
 *
 * Uses a file input with `capture`, which opens the camera on phones and a file
 * picker on desktop — no getUserMedia plumbing or permissions dance. The photo
 * is stored as a data URL in the read-only Picture property; point an Image
 * component's Source at it to show the result.
 *
 * TakePicture must be called from a user gesture (e.g. inside a Button.Click
 * handler) so the browser allows the file dialog to open.
 */

export const Camera = {
  name: "Camera",
  category: "Sensors",
  icon: "📷",
  visible: false,
  help: "Takes a photo. Show it by setting an Image's Source to Camera.Picture.",

  properties: {
    Picture: { type: "string", default: "", editable: false }, // data URL of the last photo
  },

  events: {
    AfterPicture: { params: [] },
  },

  methods: {
    TakePicture: {
      params: [],
      run: (_el, _args, ctx) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.setAttribute("capture", "environment"); // prefer the rear camera on phones
        input.style.display = "none";
        input.addEventListener("change", () => {
          const file = input.files && input.files[0];
          input.remove();
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            ctx.app.set(ctx.id, "Picture", reader.result);
            ctx.dispatch("AfterPicture");
          };
          reader.readAsDataURL(file);
        });
        (ctx.root || document.body).append(input);
        input.click();
      },
    },
  },

  runtime: { create: () => null, update: () => {}, wireEvents: () => {} },
};
