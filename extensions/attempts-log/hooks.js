// Notices when a script in the page reads the browser in ways used for fingerprinting, and who did it.
// Runs in the extension's isolated context and wraps the page's own functions with exportFunction:
// reports go straight to the extension (the page cannot forge them), and the wrapped function still does
// exactly what it did before. Only reads are reported; nothing is blocked or changed here.
"use strict";

(() => {
  const page = window.wrappedJSObject;
  if (!page) return;

  // The first stack frame that is a page script (not this extension) tells which script made the call.
  function callerOf() {
    const lines = String(new Error().stack || "").split("\n");
    for (const line of lines) {
      const m = line.match(/(https?:\/\/[^\s)]+?|blob:[^\s)]+?)(?::\d+){1,2}\s*$/);
      if (m) { try { return new URL(m[1]).hostname || location.hostname; } catch (e) { /* next */ } }
    }
    return location.hostname;                     // inline script or eval: the document itself
  }

  const seen = new Set();
  function report(api) {
    const script = callerOf(), key = api + "|" + script;
    if (seen.has(key) && seen.size > 200) return;
    seen.add(key);
    try { browser.runtime.sendMessage({ type: "fingerprint", api, script, frame: location.hostname }); } catch (e) { /* extension reloading */ }
  }

  // Arguments are passed on one by one: handing the page's function an array made here would fail
  // ("Permission denied to access property length"), because the page cannot read objects of this extension.
  function wrap(proto, name, api, only) {
    try {
      const original = proto && proto[name];
      if (typeof original !== "function") return;
      proto[name] = exportFunction(function (a, b, c, d, e) {
        try { if (!only || only(a)) report(api); } catch (err) { /* never break the page */ }
        switch (arguments.length) {
          case 0: return original.call(this);
          case 1: return original.call(this, a);
          case 2: return original.call(this, a, b);
          case 3: return original.call(this, a, b, c);
          case 4: return original.call(this, a, b, c, d);
          default: return original.call(this, a, b, c, d, e);
        }
      }, page, { defineAs: name });
    } catch (err) { /* not available in this context */ }
  }

  wrap(page.HTMLCanvasElement && page.HTMLCanvasElement.prototype, "toDataURL", "canvas-read");
  wrap(page.HTMLCanvasElement && page.HTMLCanvasElement.prototype, "toBlob", "canvas-read");
  wrap(page.CanvasRenderingContext2D && page.CanvasRenderingContext2D.prototype, "getImageData", "canvas-read");
  for (const gl of ["WebGLRenderingContext", "WebGL2RenderingContext"]) {
    wrap(page[gl] && page[gl].prototype, "getExtension", "graphics-card", (name) => name === "WEBGL_debug_renderer_info");
  }
  wrap(page.OfflineAudioContext && page.OfflineAudioContext.prototype, "startRendering", "audio-probe");
})();
