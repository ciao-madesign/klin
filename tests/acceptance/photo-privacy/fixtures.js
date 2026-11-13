// Builds test photos in memory: a tiny real JPEG/PNG plus hand-made metadata. Shared by the unit and browser tests.
const JPEG_B64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwClRRRXIfQn/9k=";
const PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGM8YWPDgA0wYRUdtBIA/xQBUEfB7b0AAAAASUVORK5CYII=";
const bytesOf = (b64) => Uint8Array.from(Buffer.from(b64, "base64"));
const text = (s) => Uint8Array.from(Buffer.from(s, "latin1"));
const cat = (...parts) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };

// A TIFF block with Exif tags. Entry: { tag, type, count, value: number | Uint8Array }.
function tiff(ifds, le) {
  const w16 = (v) => le ? [v & 255, v >> 8 & 255] : [v >> 8 & 255, v & 255];
  const w32 = (v) => le ? [v & 255, v >> 8 & 255, v >> 16 & 255, v >>> 24] : [v >>> 24, v >> 16 & 255, v >> 8 & 255, v & 255];
  const size = (entries) => 2 + entries.length * 12 + 4 + entries.reduce((n, e) => n + (e.value instanceof Uint8Array && e.value.length > 4 ? e.value.length + (e.value.length & 1) : 0), 0);
  // ifds: array of entry lists laid out one after another; entries with `ptr: index` point at another IFD.
  const offsets = []; let at = 8;
  for (const entries of ifds) { offsets.push(at); at += size(entries); }
  const out = [...(le ? [0x49, 0x49] : [0x4d, 0x4d]), ...w16(42), ...w32(8)];
  ifds.forEach((entries, i) => {
    const head = [...w16(entries.length)], extra = [];
    let dataAt = offsets[i] + 2 + entries.length * 12 + 4;
    for (const e of entries) {
      head.push(...w16(e.tag), ...w16(e.type), ...w32(e.ptr !== undefined ? 1 : e.count));
      if (e.ptr !== undefined) head.push(...w32(offsets[e.ptr]));
      else if (e.value instanceof Uint8Array) {
        if (e.value.length > 4) { head.push(...w32(dataAt)); extra.push(...e.value, ...(e.value.length & 1 ? [0] : [])); dataAt += e.value.length + (e.value.length & 1); }
        else head.push(...e.value, ...Array(4 - e.value.length).fill(0));
      } else head.push(...(e.type === 3 ? [...w16(e.value), 0, 0] : w32(e.value)));
    }
    head.push(0, 0, 0, 0);
    out.push(...head, ...extra);
  });
  return Uint8Array.from(out);
}
const ascii = (s) => Uint8Array.from([...Buffer.from(s + "\0", "latin1")]);
const entry = { text: (tag, s) => ({ tag, type: 2, count: s.length + 1, value: ascii(s) }), short: (tag, v) => ({ tag, type: 3, count: 1, value: v }),
  rational: (tag, n) => ({ tag, type: 5, count: n, value: Uint8Array.from({ length: n * 8 }, (_, i) => i % 8 === 0 ? 1 : 0) }) };

function exifBlock({ le = false, orientation, make, model, dateOriginal, artist, gps }) {
  const ifd0 = [];
  if (make) ifd0.push(entry.text(0x010f, make));
  if (model) ifd0.push(entry.text(0x0110, model));
  if (orientation) ifd0.push(entry.short(0x0112, orientation));
  if (artist) ifd0.push(entry.text(0x013b, artist));
  const ifds = [ifd0];
  if (dateOriginal) { ifd0.push({ tag: 0x8769, type: 4, ptr: ifds.length }); ifds.push([entry.text(0x9003, dateOriginal)]); }
  if (gps) { ifd0.push({ tag: 0x8825, type: 4, ptr: ifds.length }); ifds.push([entry.text(1, "N"), entry.rational(2, 3), entry.text(3, "E"), entry.rational(4, 3)]); }
  ifd0.sort((a, b) => a.tag - b.tag);
  return tiff(ifds, le);
}

const segment = (marker, body) => cat(Uint8Array.of(0xff, marker, (body.length + 2) >> 8, (body.length + 2) & 255), body);
// Inserts segments right after the first segment (APP0) of the base JPEG.
function jpegWith(segments, { trailer } = {}) {
  const base = bytesOf(JPEG_B64), after = 2 + 2 + ((base[4] << 8) | base[5]);
  return cat(base.subarray(0, after), ...segments, base.subarray(after), trailer || new Uint8Array(0));
}
const exifSegment = (opts) => segment(0xe1, cat(text("Exif\0\0"), exifBlock(opts)));
const xmpSegment = (xml) => segment(0xe1, cat(text("http://ns.adobe.com/xap/1.0/\0"), text(xml)));

function pngWith(chunks) {
  const base = bytesOf(PNG_B64), iend = base.length - 12;
  const crc = (buf) => { let c, crcv = 0xffffffff; for (const byte of buf) { c = (crcv ^ byte) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcv = (crcv >>> 8) ^ c; } return (crcv ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const body = cat(text(type), data), n = data.length; return cat(Uint8Array.of(n >>> 24, n >> 16 & 255, n >> 8 & 255, n & 255), body, Uint8Array.of(crc(body) >>> 24, crc(body) >> 16 & 255, crc(body) >> 8 & 255, crc(body) & 255)); };
  return cat(base.subarray(0, iend), ...chunks.map(([t, d]) => chunk(t, d)), base.subarray(iend));
}

module.exports = { bytesOf, text, cat, JPEG_B64, PNG_B64, exifBlock, exifSegment, xmpSegment, segment, jpegWith, pngWith };
