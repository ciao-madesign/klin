// Photo metadata: find and remove hidden data in JPEG and PNG files.
// Pure functions on bytes (Uint8Array); no browser APIs, also loaded by the unit test.
// Removal never re-encodes the picture: image data is copied byte for byte.
"use strict";

const KlinPhotoMetadata = (() => {
  const LABELS = [
    ["location", "location (GPS)"],
    ["device", "camera or phone model"],
    ["date", "date and time"],
    ["author", "author or owner name"],
    ["serial", "device serial number"],
    ["software", "editing software"],
    ["other", "other hidden data"],
  ];
  const emptyFound = () => ({ location: false, device: false, date: false, author: false, serial: false, software: false, other: false });

  // ---- TIFF / Exif -------------------------------------------------------------------------
  // Reads the tags that matter for privacy. Throws RangeError on any out-of-bounds read.
  function readTiff(b, start, end, found) {
    const le = b[start] === 0x49;
    if (!(le || b[start] === 0x4d)) throw new RangeError("not TIFF");
    const u16 = (o) => { if (o < start || o + 2 > end) throw new RangeError("range"); return le ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1]; };
    const u32 = (o) => { if (o < start || o + 4 > end) throw new RangeError("range"); return (le ? b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24) : (b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0; };
    if (u16(start + 2) !== 42) throw new RangeError("not TIFF");
    let orientation = 1;

    const walk = (offset, kind, depth) => {
      if (depth > 3) return;
      const ifd = start + offset;
      const n = u16(ifd);
      if (n > 512) throw new RangeError("too many entries");
      for (let i = 0; i < n; i++) {
        const e = ifd + 2 + i * 12, tag = u16(e);
        if (kind === "gps") { if (tag === 2 || tag === 4) found.location = true; continue; }
        switch (tag) {
          case 0x010f: case 0x0110: case 0xa434: found.device = true; break;
          case 0x0131: found.software = true; break;
          case 0x0132: case 0x9003: case 0x9004: found.date = true; break;
          case 0x013b: case 0x8298: case 0xa430: found.author = true; break;
          case 0xa431: case 0xa435: found.serial = true; break;
          case 0x0112: if (kind === "ifd0") orientation = u16(e + 8); break;
          case 0x8769: walk(u32(e + 8), "exif", depth + 1); break;
          case 0x8825: walk(u32(e + 8), "gps", depth + 1); break;
          default: break;
        }
      }
    };
    walk(u32(start + 4), "ifd0", 0);
    return orientation >= 1 && orientation <= 8 ? orientation : 1;
  }

  const ascii = (b, from, to) => { let s = ""; for (let i = from; i < to && i < b.length; i++) s += String.fromCharCode(b[i]); return s; };
  const startsWith = (b, at, text) => ascii(b, at, at + text.length) === text;

  // Minimal Exif block that keeps only the rotation, so the photo is not shown sideways after removal.
  function orientationSegment(o) {
    return Uint8Array.from([0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0, 0,
      0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, o, 0, 0, 0, 0, 0, 0]);
  }

  // ---- JPEG ---------------------------------------------------------------------------------
  function parseJpeg(b) {
    if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
    const segments = [];
    let o = 2;
    while (o + 4 <= b.length) {
      if (b[o] !== 0xff) return null;
      const marker = b[o + 1];
      if (marker === 0xff) { o++; continue; }
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) { o += 2; continue; }
      if (marker === 0xd9) return { segments, scanStart: o, eoi: o };
      const len = (b[o + 2] << 8) | b[o + 3];
      if (len < 2 || o + 2 + len > b.length) return null;
      if (marker === 0xda) {
        // Entropy-coded data: the first FF D9 after it is the real end of the picture.
        let e = o + 2 + len;
        while (e + 1 < b.length && !(b[e] === 0xff && b[e + 1] === 0xd9)) e++;
        if (e + 1 >= b.length) return null;
        return { segments, scanStart: o, eoi: e };
      }
      segments.push({ marker, start: o, end: o + 2 + len });
      o += 2 + len;
    }
    return null;
  }

  function inspectJpeg(b) {
    const parsed = parseJpeg(b);
    if (!parsed) return null;
    const found = emptyFound();
    let orientation = 1;
    for (const s of parsed.segments) {
      const body = s.start + 4;
      if (s.marker === 0xe1) {
        if (startsWith(b, body, "Exif\0\0")) {
          try { orientation = readTiff(b, body + 6, s.end, found); } catch (e) { found.other = true; }
        } else if (startsWith(b, body, "http://ns.adobe.com/xap/1.0/")) {
          found.other = true;
          if (/GPS(Latitude|Longitude)/.test(ascii(b, body, s.end))) found.location = true;
        } else found.other = true;
      } else if (s.marker === 0xfe || s.marker === 0xed || (s.marker >= 0xe3 && s.marker <= 0xef && s.marker !== 0xee)) {
        found.other = true;                                  // comment, IPTC/Photoshop, other APPn
      } else if (s.marker === 0xe2 && !startsWith(b, body, "ICC_PROFILE")) {
        found.other = true;                                  // multi-picture data, not a colour profile
      }
    }
    if (parsed.eoi + 2 < b.length) found.other = true;       // data hidden after the end of the picture
    return { format: "jpeg", found, orientation, parsed };
  }

  function stripJpeg(b, info) {
    const { parsed, orientation } = info;
    const parts = [Uint8Array.of(0xff, 0xd8)];
    let orientationDone = orientation === 1;
    const addOrientation = () => { if (!orientationDone) { parts.push(orientationSegment(orientation)); orientationDone = true; } };
    for (const s of parsed.segments) {
      const body = s.start + 4;
      const keep = s.marker < 0xe0 || s.marker === 0xe0 || s.marker === 0xee ||
        (s.marker === 0xe2 && startsWith(b, body, "ICC_PROFILE"));
      if (s.marker !== 0xe0) addOrientation();
      if (keep) parts.push(b.subarray(s.start, s.end));
    }
    addOrientation();
    parts.push(b.subarray(parsed.scanStart, parsed.eoi + 2));
    return concat(parts);
  }

  // ---- PNG ----------------------------------------------------------------------------------
  const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const PNG_DROP = new Set(["eXIf", "tEXt", "zTXt", "iTXt", "tIME"]);

  function parsePng(b) {
    if (b.length < 20 || PNG_SIGNATURE.some((v, i) => b[i] !== v)) return null;
    const chunks = [];
    let o = 8;
    while (o + 12 <= b.length) {
      const len = ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
      if (o + 12 + len > b.length) return null;
      const type = ascii(b, o + 4, o + 8);
      chunks.push({ type, start: o, end: o + 12 + len, data: o + 8, dataEnd: o + 8 + len });
      o += 12 + len;
      if (type === "IEND") return { chunks, end: o };
    }
    return null;
  }

  function inspectPng(b) {
    const parsed = parsePng(b);
    if (!parsed) return null;
    const found = emptyFound();
    for (const c of parsed.chunks) {
      if (c.type === "eXIf") { try { readTiff(b, c.data, c.dataEnd, found); } catch (e) { found.other = true; } }
      else if (c.type === "tIME") found.date = true;
      else if (c.type === "tEXt" || c.type === "zTXt" || c.type === "iTXt") found.other = true;
    }
    if (parsed.end < b.length) found.other = true;
    return { format: "png", found, parsed };
  }

  function stripPng(b, info) {
    const parts = [b.subarray(0, 8)];
    for (const c of info.parsed.chunks) if (!PNG_DROP.has(c.type)) parts.push(b.subarray(c.start, c.end));
    return concat(parts);
  }

  // ---- public ---------------------------------------------------------------------------------
  function concat(parts) {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  }

  // null when the file is not a JPEG/PNG or cannot be read safely (it is then left untouched).
  function inspect(bytes) {
    let info;
    try { info = inspectJpeg(bytes) || inspectPng(bytes); } catch (e) { return null; }
    if (!info) return null;
    info.any = Object.values(info.found).some(Boolean);
    return info;
  }

  function strip(bytes, info) {
    if (!info || !info.any) return bytes;
    return info.format === "jpeg" ? stripJpeg(bytes, info) : stripPng(bytes, info);
  }

  const describe = (found) => LABELS.filter(([key]) => found[key]).map(([, label]) => label);

  return { inspect, strip, describe };
})();

if (typeof module !== "undefined") module.exports = KlinPhotoMetadata;
