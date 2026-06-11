(function () {
  "use strict";

  // The origin this script was served from — used to build the widget iframe URL.
  var SCRIPT_ORIGIN = (function () {
    try {
      var cur = document.currentScript && document.currentScript.src;
      if (cur) return new URL(cur).origin;
    } catch (e) {}
    return "http://localhost:3000";
  })();

  var state = {
    workspace: null,
    view: null,
    mounted: false,
    open: false,
  };


  var els = {};

  function buildUI() {
    if (state.mounted) return;
    state.mounted = true;

    // Floating launcher button
    var btn = document.createElement("button");
    btn.setAttribute("aria-label", "Open feedback");
    btn.style.cssText = [
      "position:fixed",
      "bottom:20px",
      "right:20px",
      "z-index:2147483646",
      "width:52px",
      "height:52px",
      "border-radius:9999px",
      "border:1px solid #27272a",
      "background:#fafafa",
      "color:#09090b",
      "cursor:pointer",
      "box-shadow:0 8px 30px rgba(0,0,0,.35)",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "font-size:22px",
      "transition:transform .15s ease",
    ].join(";");
    btn.innerHTML = "&#128172;"; // speech balloon
    btn.onmouseenter = function () {
      btn.style.transform = "scale(1.05)";
    };
    btn.onmouseleave = function () {
      btn.style.transform = "scale(1)";
    };
    btn.onclick = toggle;

    // Drawer container
    var drawer = document.createElement("div");
    drawer.style.cssText = [
      "position:fixed",
      "bottom:88px",
      "right:20px",
      "z-index:2147483647",
      "width:380px",
      "max-width:calc(100vw - 40px)",
      "height:560px",
      "max-height:calc(100vh - 120px)",
      "border:1px solid #27272a",
      "border-radius:14px",
      "overflow:hidden",
      "background:#09090b",
      "box-shadow:0 20px 60px rgba(0,0,0,.5)",
      "opacity:0",
      "transform:translateY(12px) scale(.98)",
      "pointer-events:none",
      "transition:opacity .18s ease, transform .18s ease",
    ].join(";");

    var iframe = document.createElement("iframe");
    var src = SCRIPT_ORIGIN + "/widget/" + encodeURIComponent(state.workspace);
    // Optional ?view= selects which surfaces are exposed. Generic surfaces:
    // all|board|roadmap|changelog|status|contact. Per-item targets:
    // "board:slug" pins a single board, "survey:slug" embeds a single published
    // survey form. "contact" pins the widget to the contact form.
    if (state.view) src += "?view=" + encodeURIComponent(state.view);

    iframe.src = src;

    iframe.style.cssText =
      "width:100%;height:100%;border:0;background:transparent;";
    iframe.setAttribute("title", "Feedback widget");
    drawer.appendChild(iframe);

    document.body.appendChild(btn);
    document.body.appendChild(drawer);

    els.btn = btn;
    els.drawer = drawer;

    // Allow the iframe to request closing itself.
    window.addEventListener("message", function (ev) {
      if (ev.origin !== SCRIPT_ORIGIN) return;
      if (ev.data && ev.data.type === "ck:close") close();
    });
  }

  function open() {
    if (!state.mounted) return;
    state.open = true;
    els.drawer.style.opacity = "1";
    els.drawer.style.transform = "translateY(0) scale(1)";
    els.drawer.style.pointerEvents = "auto";
  }

  function close() {
    if (!state.mounted) return;
    state.open = false;
    els.drawer.style.opacity = "0";
    els.drawer.style.transform = "translateY(12px) scale(.98)";
    els.drawer.style.pointerEvents = "none";
  }

  function toggle() {
    state.open ? close() : open();
  }

  // Process the command queue created by the inline snippet.
  function exec(cmd, opts) {
    if (cmd === "init") {
      state.workspace = (opts && opts.workspace) || state.workspace;
      state.view = (opts && opts.view) || state.view;
      if (!state.workspace) {

        console.error("[CannyKiller] init requires a { workspace } slug");
        return;
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", buildUI);
      } else {
        buildUI();
      }
    } else if (cmd === "open") {
      open();
    } else if (cmd === "close") {
      close();
    } else if (cmd === "toggle") {
      toggle();
    }
  }

  // Hook into the global stub (e.g. window.ck) created by the loader snippet.
  var objName = window.CannyKillerObject || "ck";
  var queued = window[objName] && window[objName].q ? window[objName].q : [];

  // Replace the stub with the real dispatcher.
  window[objName] = function () {
    exec.apply(null, arguments);
  };

  // Flush anything queued before this script finished loading.
  for (var i = 0; i < queued.length; i++) {
    exec.apply(null, queued[i]);
  }
})();
