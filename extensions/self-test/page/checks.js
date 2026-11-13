// The checks a tracking script would run. This function is injected into the page being
// tested and runs in the page's own context, so it sees exactly what that site sees.
// It must stay self-contained (no outside variables): it is sent to the page as source text.
// No network requests (the WebRTC check uses no server), no storage.
"use strict";

async function klinSelfTestChecks() {
  const P = "protected", E = "exposed", V = "visible";

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

    if (changing) return { status: P, value: "random on every read: no usable identifier" };
    if (altered) return { status: P, value: "read-out altered by the browser" };
    return { status: E, value: `reads back exactly; stable identifier: ${hash(first.join(","))}` };
  }

  function webglCheck() {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return { status: P, value: "not available" };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
    const vendor = gl.getParameter(ext ? ext.UNMASKED_VENDOR_WEBGL : gl.VENDOR);
    return { status: V, value: `${vendor} / ${renderer}` };
  }

  async function audioCheck() {
    const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Ctx) return { status: P, value: "not available" };
    const ctx = new Ctx(1, 5000, 44100);
    const osc = ctx.createOscillator(); osc.type = "triangle"; osc.frequency.value = 10000;
    const comp = ctx.createDynamicsCompressor();
    osc.connect(comp); comp.connect(ctx.destination); osc.start(0);
    const data = (await ctx.startRendering()).getChannelData(0);
    let sum = 0;
    for (let i = 4000; i < 5000; i++) sum += Math.abs(data[i]);
    return { status: V, value: `identifier: ${hash(String(sum))}` };
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
    return { status: V, value: `${found.length} of ${candidates.length} tested fonts detected` + (found.length ? `: ${found.join(", ")}` : "") };
  }

  // No STUN/TURN server is configured, so nothing leaves the machine:
  // only the addresses the browser would hand to a page are collected.
  function webrtcCheck() {
    return new Promise((resolve) => {
      if (!window.RTCPeerConnection) return resolve({ status: P, value: "WebRTC not available" });
      const seen = new Set();
      let pc;
      const done = () => {
        try { pc.close(); } catch (e) { /* already closed */ }
        const raw = [...seen].filter((a) => !a.endsWith(".local"));
        if (raw.length) resolve({ status: E, value: `local address readable: ${raw.join(", ")}` });
        else if (seen.size) resolve({ status: P, value: "only a random placeholder name, no real address" });
        else resolve({ status: P, value: "no address handed to the page" });
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
      } catch (e) { resolve({ status: P, value: "WebRTC blocked" }); }
    });
  }

  async function mediaDevicesCheck() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return isSecureContext ? { status: P, value: "not available" } : { status: V, value: "not readable here: the page is not https" };
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const count = (kind) => devices.filter((d) => d.kind === kind).length;
    const labelled = devices.some((d) => d.label);
    return { status: labelled ? E : V, value: `${count("audioinput")} microphone(s), ${count("videoinput")} camera(s), ${count("audiooutput")} speaker(s)` + (labelled ? ", with device names" : ", names hidden") };
  }

  const absent = (present, what) => present ? { status: E, value: `${what} readable` } : { status: P, value: "not available to sites" };

  const checks = {
    "global-privacy-control": () => navigator.globalPrivacyControl === true ? { status: P, value: "sent" } : { status: E, value: "not sent" },
    "cookies": () => ({ status: V, value: navigator.cookieEnabled ? "accepted" : "refused" }),
    "local-network-address-webrtc": webrtcCheck,
    "connection-type": () => absent("connection" in navigator, "connection type"),
    "browser-and-system": () => ({ status: V, value: navigator.userAgent }),
    "processor-cores": () => ({ status: V, value: String(navigator.hardwareConcurrency ?? "hidden") }),
    "memory-size": () => absent("deviceMemory" in navigator, `memory (${navigator.deviceMemory} GB)`),
    "battery-level": () => absent("getBattery" in navigator, "battery state"),
    "screen-and-window": () => ({ status: V, value: `screen ${screen.width}×${screen.height}, window ${innerWidth}×${innerHeight}, pixel ratio ${devicePixelRatio}, ${screen.colorDepth}-bit colour` }),
    "touch-screen": () => ({ status: V, value: navigator.maxTouchPoints ? `yes (${navigator.maxTouchPoints} points)` : "no" }),
    "graphics-card": webglCheck,
    "cameras-and-microphones": mediaDevicesCheck,
    "languages": () => ({ status: V, value: (navigator.languages || [navigator.language]).join(", ") }),
    "time-zone": () => ({ status: V, value: `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC offset ${-new Date().getTimezoneOffset() / 60} h)` }),
    "canvas-drawing": canvasCheck,
    "audio-processing": audioCheck,
    "installed-fonts": fontCheck,
  };

  const results = [];
  for (const [id, run] of Object.entries(checks)) {
    let r;
    try { r = await run(); } catch (e) { r = { status: V, value: "check failed: " + e.message }; }
    results.push({ id, status: r.status, value: String(r.value) });
  }
  return results;
}
