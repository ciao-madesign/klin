// The checks a tracking script would run. This function is injected into the page being
// tested and runs in the page's own context, so it sees exactly what that site sees.
// It must stay self-contained (no outside variables): it is sent to the page as source text.
// No network requests (the WebRTC check uses no server), no storage.
"use strict";

async function klinSelfTestChecks() {
  const P = "protected", E = "exposed", V = "visible";
  // Every result carries its English text (value) and a message key with its arguments (k, a) for the page to translate.
  const R = (status, value, k, a = []) => ({ status, value, k, a });

  // Small non-cryptographic hash, enough to show "this is an identifier".
  function hash(text) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16).padStart(8, "0");
  }

  function drawSample(canvas) {
    const ctx = canvas.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, "#e63946"); g.addColorStop(0.5, "#2a9d8f"); g.addColorStop(1, "#264653");
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "18px serif"; ctx.fillStyle = "#f1faee"; ctx.fillText("Klin self-test ☃ 12345", 8, 30);
    ctx.strokeStyle = "#ffb703"; ctx.beginPath(); ctx.arc(150, 40, 18, 0, 5); ctx.stroke();
    return ctx;
  }

  // Two ways to notice that the browser alters what a page reads from a canvas:
  // 1. write known pixels and read them back: any difference means the read-out is altered;
  // 2. read the same drawing twice: a difference means it is randomised on every read.
  // If neither shows, the drawing reads back exactly and is a stable identifier.
  function canvasCheck() {
    const W = 220, H = 60;
    const known = Object.assign(document.createElement("canvas"), { width: W, height: H }).getContext("2d");
    const pattern = known.createImageData(W, H);
    let seed = 12345;
    for (let i = 0; i < pattern.data.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      pattern.data[i] = i % 4 === 3 ? 255 : (seed >> 16) & 255;
    }
    known.putImageData(pattern, 0, 0);
    const readBack = known.getImageData(0, 0, W, H).data;
    let altered = false;
    for (let i = 0; i < readBack.length && !altered; i++) altered = readBack[i] !== pattern.data[i];

    const ctx = drawSample(Object.assign(document.createElement("canvas"), { width: W, height: H }));
    const first = ctx.getImageData(0, 0, W, H).data, second = ctx.getImageData(0, 0, W, H).data;
    let changing = false;
    for (let i = 0; i < first.length && !changing; i++) changing = first[i] !== second[i];

    if (changing) return R(P, "random on every read: no usable identifier", "canvas_random");
    if (altered) return R(P, "read-out altered by the browser", "canvas_altered");
    const id = hash(first.join(","));
    return R(E, `reads back exactly; stable identifier: ${id}`, "canvas_exact", [id]);
  }

  function webglCheck() {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return R(P, "not available", "na");
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
    const vendor = gl.getParameter(ext ? ext.UNMASKED_VENDOR_WEBGL : gl.VENDOR);
    return R(V, `${vendor} / ${renderer}`, "raw");
  }

  async function audioCheck() {
    const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Ctx) return R(P, "not available", "na");
    const ctx = new Ctx(1, 5000, 44100);
    const osc = ctx.createOscillator(); osc.type = "triangle"; osc.frequency.value = 10000;
    const comp = ctx.createDynamicsCompressor();
    osc.connect(comp); comp.connect(ctx.destination); osc.start(0);
    const data = (await ctx.startRendering()).getChannelData(0);
    let sum = 0;
    for (let i = 4000; i < 5000; i++) sum += Math.abs(data[i]);
    const id = hash(String(sum));
    return R(V, `identifier: ${id}`, "audio_id", [id]);
  }

  function fontCheck() {
    const candidates = ["Arial", "Arial Black", "Calibri", "Cambria", "Comic Sans MS", "Consolas", "Courier New", "DejaVu Sans",
      "Fira Sans", "Futura", "Garamond", "Geneva", "Georgia", "Gill Sans", "Helvetica", "Helvetica Neue", "Impact", "Liberation Sans",
      "Lucida Console", "Menlo", "Monaco", "Noto Sans", "Optima", "Palatino", "Roboto", "Segoe UI", "Tahoma", "Times New Roman",
      "Trebuchet MS", "Ubuntu", "Verdana"];
    const ctx = document.createElement("canvas").getContext("2d");
    const text = "mmmmmmmmmmlli";
    const width = (font) => { ctx.font = `72px ${font}`; return ctx.measureText(text).width; };
    const base = { monospace: width("monospace"), serif: width("serif"), "sans-serif": width("sans-serif") };
    const found = candidates.filter((f) => Object.keys(base).some((b) => width(`"${f}", ${b}`) !== base[b]));
    return found.length
      ? R(V, `${found.length} of ${candidates.length} tested fonts detected: ${found.join(", ")}`, "fonts_list", [found.length, candidates.length, found.join(", ")])
      : R(V, `${found.length} of ${candidates.length} tested fonts detected`, "fonts_n", [found.length, candidates.length]);
  }

  // No STUN/TURN server is configured, so nothing leaves the machine:
  // only the addresses the browser would hand to a page are collected.
  function webrtcCheck() {
    return new Promise((resolve) => {
      if (!window.RTCPeerConnection) return resolve(R(P, "WebRTC not available", "webrtc_na"));
      const seen = new Set();
      let pc;
      const done = () => {
        try { pc.close(); } catch (e) { /* already closed */ }
        const raw = [...seen].filter((a) => !a.endsWith(".local"));
        if (raw.length) resolve(R(E, `local address readable: ${raw.join(", ")}`, "webrtc_addr", [raw.join(", ")]));
        else if (seen.size) resolve(R(P, "only a random placeholder name, no real address", "webrtc_placeholder"));
        else resolve(R(P, "no address handed to the page", "webrtc_none"));
      };
      try {
        pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel("t");
        pc.onicecandidate = (e) => {
          if (!e.candidate) return done();
          const parts = e.candidate.candidate.split(" ");
          if (parts[4]) seen.add(parts[4]);
        };
        pc.createOffer().then((o) => pc.setLocalDescription(o)).catch(done);
        setTimeout(done, 3000);
      } catch (e) { resolve(R(P, "WebRTC blocked", "webrtc_blocked")); }
    });
  }

  async function mediaDevicesCheck() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return isSecureContext ? R(P, "not available", "na") : R(V, "not readable here: the page is not https", "media_notsecure");
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const count = (kind) => devices.filter((d) => d.kind === kind).length;
    const labelled = devices.some((d) => d.label);
    const n = [count("audioinput"), count("videoinput"), count("audiooutput")];
    return R(labelled ? E : V, `${n[0]} microphone(s), ${n[1]} camera(s), ${n[2]} speaker(s)` + (labelled ? ", with device names" : ", names hidden"), labelled ? "media_named" : "media_hidden", n);
  }

  const absent = (present, what, k, a = []) => present ? R(E, `${what} readable`, k, a) : R(P, "not available to sites", "absent");

  const checks = {
    "global-privacy-control": () => navigator.globalPrivacyControl === true ? R(P, "sent", "gpc_sent") : R(E, "not sent", "gpc_not_sent"),
    "cookies": () => navigator.cookieEnabled ? R(V, "accepted", "cookies_yes") : R(V, "refused", "cookies_no"),
    "local-network-address-webrtc": webrtcCheck,
    "connection-type": () => absent("connection" in navigator, "connection type", "readable_connection"),
    "browser-and-system": () => R(V, navigator.userAgent, "raw"),
    "processor-cores": () => navigator.hardwareConcurrency == null ? R(V, "hidden", "hidden") : R(V, String(navigator.hardwareConcurrency), "raw"),
    "memory-size": () => absent("deviceMemory" in navigator, `memory (${navigator.deviceMemory} GB)`, "readable_memory", [navigator.deviceMemory]),
    "battery-level": () => absent("getBattery" in navigator, "battery state", "readable_battery"),
    "screen-and-window": () => R(V, `screen ${screen.width}×${screen.height}, window ${innerWidth}×${innerHeight}, pixel ratio ${devicePixelRatio}, ${screen.colorDepth}-bit colour`, "screen", [`${screen.width}×${screen.height}`, `${innerWidth}×${innerHeight}`, devicePixelRatio, screen.colorDepth]),
    "touch-screen": () => navigator.maxTouchPoints ? R(V, `yes (${navigator.maxTouchPoints} points)`, "touch_yes", [navigator.maxTouchPoints]) : R(V, "no", "touch_no"),
    "graphics-card": webglCheck,
    "cameras-and-microphones": mediaDevicesCheck,
    "languages": () => R(V, (navigator.languages || [navigator.language]).join(", "), "raw"),
    "time-zone": () => R(V, `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC offset ${-new Date().getTimezoneOffset() / 60} h)`, "tz", [Intl.DateTimeFormat().resolvedOptions().timeZone, -new Date().getTimezoneOffset() / 60]),
    "canvas-drawing": canvasCheck,
    "audio-processing": audioCheck,
    "installed-fonts": fontCheck,
  };

  const results = [];
  for (const [id, run] of Object.entries(checks)) {
    let r;
    try { r = await run(); } catch (e) { r = R(V, "check failed: " + e.message, "failed", [e.message]); }
    results.push({ id, status: r.status, value: String(r.value), k: r.k, a: r.a });
  }
  return results;
}
