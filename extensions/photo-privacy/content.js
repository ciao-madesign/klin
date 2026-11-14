// Intercepts photos chosen with a site's upload button, or dropped into the page, before the site sees them.
// If a photo carries hidden data, the user decides; the site then receives the cleaned or the original file.
// Everything happens in this tab: files are read in memory, nothing is sent or stored.
"use strict";

(() => {
  // Wording comes from _locales (the browser's language); the English text here is the fallback.
  const t = (key, fallback, ...subs) => {
    let text = "";
    try { text = browser.i18n.getMessage(key); } catch (e) { /* no i18n: use the fallback */ }
    text = text || fallback;
    subs.forEach((v, i) => { text = text.split("{" + (i + 1) + "}").join(String(v)); });
    return text;
  };
  const kindText = (found) => KlinPhotoMetadata.keysOf(found).map((k) => t("p_kind_" + k, KlinPhotoMetadata.labelFor(k)));
  const MAX_BYTES = 40 * 1024 * 1024;            // larger files are passed through unchecked
  const isCandidate = (f) => /^image\/(jpeg|png)$/.test(f.type) || /\.(jpe?g|png)$/i.test(f.name);
  const SYNC_LIMIT = 16 * 1024 * 1024;           // dropped files up to this size are checked at once
  const pending = new WeakMap();                  // input -> token of the selection being checked
  let redispatching = false;

  async function examine(files) {
    const items = [];
    for (const file of files) {
      const item = { file, info: null, bytes: null };
      if (isCandidate(file) && file.size <= MAX_BYTES) {
        try {
          // Copy into a buffer owned by this script: a view over the page's buffer cannot be sliced
          // (Firefox denies access to its `constructor`), which would break removal.
          const view = new Uint8Array(await file.arrayBuffer());
          item.bytes = new Uint8Array(view.length);
          item.bytes.set(view);
          item.info = KlinPhotoMetadata.inspect(item.bytes);
        } catch (e) { item.info = null; }
      }
      items.push(item);
    }
    return items;
  }

  function cleaned(item) {
    const bytes = KlinPhotoMetadata.strip(item.bytes, item.info);
    return new File([bytes], item.file.name, { type: item.file.type, lastModified: item.file.lastModified });
  }

  // ---- messages shown to the user (closed shadow root: the page cannot read or click them) ----------
  function ui() {
    const host = document.createElement("div");
    host.style.cssText = "all:initial;position:fixed;z-index:2147483647;inset:0;pointer-events:none";
    const root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = `
      :host{all:initial}
      .box{pointer-events:auto;position:fixed;left:50%;top:16px;transform:translateX(-50%);width:min(460px,calc(100vw - 24px));
        font:15px/1.5 system-ui,sans-serif;color:#f1f1ec;background:#141414;border-top:3px solid #d4ff2a;padding:16px 16px 14px;
        clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,0 100%)}
      h2{all:unset;display:block;font:700 17px/1.2 "Chakra Petch",system-ui,sans-serif;margin-bottom:6px}
      p{margin:6px 0}.muted{color:#a8a8a2;font-size:13px}
      mark{background:#d4ff2a;color:#0a0a0a;padding:0 .25em;font-weight:600}
      ul{margin:6px 0;padding-left:20px}
      .row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
      button{font:600 14px system-ui,sans-serif;padding:7px 14px;border:2px solid #f1f1ec;border-radius:0;background:transparent;color:#f1f1ec;cursor:pointer;
        clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,0 100%)}
      button.primary{background:#d4ff2a;border-color:#d4ff2a;color:#0a0a0a}
      button:focus-visible{outline:2px solid #d4ff2a;outline-offset:3px;clip-path:none}`;
    root.append(style);
    document.documentElement.append(host);
    return { host, root };
  }
  const el = (tag, props = {}, kids = []) => { const n = Object.assign(document.createElement(tag), props); n.append(...[].concat(kids)); return n; };

  function ask(items) {
    const withData = items.filter((i) => i.info && i.info.any);
    const kinds = [...new Set(withData.flatMap((i) => kindText(i.info.found)))];
    const names = withData.map((i) => i.file.name);
    return new Promise((resolve) => {
      const { host, root } = ui();
      const done = (answer) => { host.remove(); resolve(answer); };
      const click = (answer) => (e) => { if (e.isTrusted) done(answer); };
      const remove = el("button", { className: "primary", type: "button", textContent: t("p_clean", "Clean and continue") });
      const keep = el("button", { type: "button", textContent: t("p_keep", "Keep it") });
      const cancel = el("button", { type: "button", textContent: t("p_cancel", "Cancel") });
      remove.addEventListener("click", click("remove"));
      keep.addEventListener("click", click("keep"));
      cancel.addEventListener("click", click("cancel"));
      const box = el("div", { className: "box", role: "alertdialog", ariaLabel: t("p_label", "Photo privacy") }, [
        el("h2", { textContent: t("p_title", "This photo says where it was taken.") }),
        el("p", { textContent: names.length > 2 ? t("p_body_many", "Hidden data in {1} photos. Whoever receives them can read it:", names.length) : t("p_body_one", "Hidden data in {1}. Whoever receives it can read it:", names.join(", ")) }),
        el("ul", {}, kinds.map((k) => el("li", { textContent: k }))),
        el("div", { className: "row" }, [remove, keep, cancel]),
        el("p", { className: "muted" }, [t("p_note1", "Cleaning does not change the picture. Klin checks photos you pick or drop on the page. Not pasted ones. ") , el("mark", { textContent: t("p_note2", "It cannot know what a site does with a photo you keep.") })]),
      ]);
      box.addEventListener("keydown", (e) => { if (e.isTrusted && e.key === "Escape") done("cancel"); });
      root.append(box);
      remove.focus();
    });
  }

  function notice(text) {
    const { host, root } = ui();
    const box = el("div", { className: "box", role: "status" }, [el("p", { textContent: text })]);
    root.append(box);
    setTimeout(() => host.remove(), 7000);
  }

  // ---- interception --------------------------------------------------------------------------------
  function deliver(input, files) {
    const transfer = new DataTransfer();
    for (const f of files) transfer.items.add(f);
    input.files = transfer.files;
    redispatching = true;
    try {
      input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } finally { redispatching = false; }
  }

  // Decides what the site will receive: the files to deliver, or null if the user cancelled.
  async function resolve(original) {
    const items = await examine(original);
    const withData = items.filter((i) => i.info && i.info.any);
    if (!withData.length) return original;
    const location = withData.some((i) => i.info.found.location);
    const answer = location ? await ask(items) : "remove";
    if (answer === "cancel") return null;
    if (answer === "keep") return original;
    if (!location) {
      const kinds = [...new Set(withData.flatMap((i) => kindText(i.info.found)))];
      notice(t("p_removed", "Klin removed hidden details ({1}) from {2}.", kinds.join(", "), withData.length === 1 ? withData[0].file.name : t("p_n_photos", "{1} photos", withData.length)));
    }
    return items.map((i) => (i.info && i.info.any ? cleaned(i) : i.file));
  }

  async function handle(input) {
    const token = Symbol();
    pending.set(input, token);
    const original = [...input.files];
    try {
      const files = await resolve(original);
      if (pending.get(input) !== token) return;
      pending.delete(input);
      if (files === null) { input.value = ""; return; }
      deliver(input, files);
    } catch (e) {
      // Never leave the user's upload dead: say so, and let the original selection through.
      console.error("Klin Photo Privacy:", e);
      if (pending.get(input) === token) {
        pending.delete(input);
        notice(t("p_failed", "Klin could not check this photo, so it was sent as it is."));
        deliver(input, original);
      }
    }
  }

  // ---- photos dropped into the page ---------------------------------------------------------------
  // A drop hands the files to the site at once, so the file is read synchronously first:
  // clean photos (the common case) are left completely alone; only photos with hidden data are held back.
  function peek(file) {
    if (file.size > SYNC_LIMIT) return undefined;           // unknown: check it the slow way
    let url;
    try {
      url = URL.createObjectURL(file);
      const request = new XMLHttpRequest();
      request.open("GET", url, false);
      request.overrideMimeType("text/plain; charset=x-user-defined");
      request.send();
      const text = request.responseText, bytes = new Uint8Array(text.length);
      for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 255;
      return KlinPhotoMetadata.inspect(bytes);
    } catch (e) { return undefined; } finally { if (url) URL.revokeObjectURL(url); }
  }

  // The browser empties a DataTransfer once its event has finished, so everything is copied beforehand.
  function snapshot(source) {
    const data = {};
    for (const type of source.types) {
      if (type === "Files") continue;
      try { data[type] = source.getData(type); } catch (e) { /* not readable: skipped */ }
    }
    return data;
  }

  // Copies files into buffers owned by this script, so they can be handed to the page's own context.
  async function exportFiles(files) {
    const out = [];
    for (const file of files) {
      const view = new Uint8Array(await file.arrayBuffer()), bytes = new Uint8Array(view.length);
      bytes.set(view);
      out.push({ name: file.name, type: file.type, lastModified: file.lastModified, bytes });
    }
    return out;
  }

  async function handleTransfer(event, source) {
    const target = event.target;
    const original = [...source.files], data = snapshot(source);
    const coords = { clientX: event.clientX, clientY: event.clientY, screenX: event.screenX, screenY: event.screenY };
    let files = original;
    try {
      files = await resolve(original);
    } catch (e) {
      console.error("Klin Photo Privacy:", e);
      notice(t("p_failed", "Klin could not check this photo, so it was sent as it is."));
    }
    if (files === null) return;
    const detail = cloneInto({ data, coords, files: await exportFiles(files) }, window);
    redispatching = true;
    try {
      // main.js (page context) turns this into the real drop event for the site.
      target.dispatchEvent(new CustomEvent("klin-photo-redispatch", { bubbles: true, composed: true, detail }));
    } finally { redispatching = false; }
  }

  function onTransfer(event) {
    if (redispatching || !event.isTrusted) return;
    const source = event.dataTransfer;
    if (!source || !source.files || ![...source.files].some(isCandidate)) return;
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "file") return;   // handled as a selection
    const verdicts = [...source.files].filter(isCandidate).map(peek);
    if (verdicts.every((v) => v === null || (v && !v.any))) return;   // nothing to report: do not interfere
    event.preventDefault();                       // otherwise the browser would open the dropped file
    event.stopImmediatePropagation();
    handleTransfer(event, source);
  }

  function onSelect(event) {
    if (redispatching || !event.isTrusted) return;
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "file" || !input.files || !input.files.length) return;
    if (![...input.files].some(isCandidate)) return;
    event.stopImmediatePropagation();             // the site hears about the selection only after the check
    if (event.type === "input" || !pending.has(input)) handle(input);
  }

  window.addEventListener("input", onSelect, true);
  window.addEventListener("change", onSelect, true);
  window.addEventListener("drop", onTransfer, true);
  // Paste is deliberately not handled: Firefox lets a script build a paste event only without files,
  // so once held back a pasted photo could not be handed to the site again.
})();
