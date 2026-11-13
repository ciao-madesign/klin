// Runs in the page's own context (manifest "world": "MAIN"), and does one thing: re-creates a drop
// event for the site once the user has decided. The event must be built here: data put into a DataTransfer
// by the extension's isolated script belongs to a different principal, and the site would see no files.
"use strict";

window.addEventListener("klin-photo-redispatch", (event) => {
  event.stopImmediatePropagation();
  const request = event.detail, target = event.target;
  if (!request || !target || !Array.isArray(request.files)) return;
  const transfer = new DataTransfer();
  for (const type of Object.keys(request.data || {})) { try { transfer.setData(type, request.data[type]); } catch (e) { /* skipped */ } }
  for (const f of request.files) transfer.items.add(new File([f.bytes], f.name, { type: f.type, lastModified: f.lastModified }));
  const init = { bubbles: true, cancelable: true, composed: true };
  const coords = request.coords || {};
  target.dispatchEvent(new DragEvent("drop", { ...init, clientX: coords.clientX, clientY: coords.clientY, screenX: coords.screenX, screenY: coords.screenY, dataTransfer: transfer }));
}, true);
