// Unit test for extensions/photo-privacy/metadata.js. Usage: node tests/acceptance/photo-privacy/unit.js
const path = require("path");
const M = require(path.join(__dirname, "../../../extensions/photo-privacy/metadata.js"));
const F = require("./fixtures.js");

let failed = 0, total = 0;
const check = (label, ok, detail = "") => { total++; if (!ok) { failed++; console.log(`FAIL ${label} ${detail}`); } };
const labels = (bytes) => { const i = M.inspect(bytes); return i ? M.describe(i.found).join(",") : "unreadable"; };
const has = (bytes, s) => Buffer.from(bytes).includes(Buffer.from(s, "latin1"));
const bytes = (u) => Buffer.from(u).toString("hex");

// 1. Full Exif (big-endian) with location, model, date, author, rotation
for (const le of [false, true]) {
  const photo = F.jpegWith([F.exifSegment({ le, orientation: 6, make: "AcmeCam", model: "X100", dateOriginal: "2026:05:01 10:00:00", artist: "Jane Doe", gps: true })]);
  const info = M.inspect(photo);
  check(`exif ${le ? "LE" : "BE"}: location found`, info.found.location);
  check(`exif ${le ? "LE" : "BE"}: device, date, author found`, info.found.device && info.found.date && info.found.author);
  check(`exif ${le ? "LE" : "BE"}: orientation read`, info.orientation === 6, String(info.orientation));
  const clean = M.strip(photo, info), after = M.inspect(clean);
  check(`exif ${le ? "LE" : "BE"}: nothing left after removal`, after && !after.any, labels(clean));
  check(`exif ${le ? "LE" : "BE"}: rotation kept`, after.orientation === 6, String(after.orientation));
  check(`exif ${le ? "LE" : "BE"}: text gone`, !has(clean, "AcmeCam") && !has(clean, "Jane Doe") && !has(clean, "2026:05"));
  const sosAt = (u) => Buffer.from(u).indexOf(Buffer.from([0xff, 0xda]));
  check(`exif ${le ? "LE" : "BE"}: picture data identical`, bytes(clean.subarray(sosAt(clean))) === bytes(photo.subarray(sosAt(photo))));
  check(`exif ${le ? "LE" : "BE"}: still a JPEG`, clean[0] === 0xff && clean[1] === 0xd8 && clean[clean.length - 2] === 0xff && clean[clean.length - 1] === 0xd9);
}

// 2. Normal orientation: no Exif block is written back
{
  const photo = F.jpegWith([F.exifSegment({ orientation: 1, model: "AcmeCam" })]);
  const clean = M.strip(photo, M.inspect(photo));
  check("orientation 1: no Exif left", !has(clean, "Exif"));
}

// 3. XMP location, comment, trailing data
{
  const xmp = F.jpegWith([F.xmpSegment('<x:xmpmeta><rdf:Description exif:GPSLatitude="45,30N"/></x:xmpmeta>')]);
  check("xmp: location found", M.inspect(xmp).found.location);
  check("xmp: removed", !M.inspect(M.strip(xmp, M.inspect(xmp))).any);
  const com = F.jpegWith([F.segment(0xfe, F.text("secret note"))]);
  check("comment: found as other", M.inspect(com).found.other && !M.inspect(com).found.location);
  check("comment: removed", !has(M.strip(com, M.inspect(com)), "secret note"));
  const trail = F.jpegWith([], { trailer: F.text("HIDDEN-TRAILER") });
  check("trailer: found", M.inspect(trail).found.other);
  check("trailer: removed", !has(M.strip(trail, M.inspect(trail)), "HIDDEN-TRAILER"));
}

// 4. Clean files are left byte for byte
{
  const jpg = F.bytesOf(F.JPEG_B64), png = F.bytesOf(F.PNG_B64);
  check("clean jpeg: nothing found", !M.inspect(jpg).any);
  check("clean jpeg: returned unchanged", M.strip(jpg, M.inspect(jpg)) === jpg);
  check("clean png: nothing found", !M.inspect(png).any);
}

// 5. PNG
{
  const png = F.pngWith([["tEXt", F.text("Author\0Jane Doe")], ["tIME", Uint8Array.of(7, 234, 5, 1, 10, 0, 0)]]);
  const info = M.inspect(png);
  check("png: text and time found", info.found.other && info.found.date);
  const clean = M.strip(png, info);
  check("png: removed", !M.inspect(clean).any && !has(clean, "Jane Doe"));
  check("png: structure kept (IHDR, IDAT, IEND)", has(clean, "IHDR") && has(clean, "IDAT") && has(clean, "IEND"));
  const withGps = F.pngWith([["eXIf", F.exifBlock({ gps: true })]]);
  check("png: Exif location found", M.inspect(withGps).found.location);
}

// 6. Damaged or unsupported input is left alone
{
  const photo = F.jpegWith([F.exifSegment({ gps: true })]);
  check("truncated jpeg: unreadable", M.inspect(photo.subarray(0, photo.length - 40)) === null);
  const bad = Uint8Array.from(photo); bad[5] = 0xff;
  check("corrupt segment length: no crash", (() => { try { M.inspect(bad); return true; } catch (e) { return false; } })());
  check("text file: unreadable", M.inspect(F.text("hello world, not an image")) === null);
  check("empty: unreadable", M.inspect(new Uint8Array(0)) === null);
  const broken = F.jpegWith([F.segment(0xe1, F.cat(F.text("Exif\0\0"), Uint8Array.of(0x4d, 0x4d, 0, 42, 0, 0, 0xff, 0xff)))]);
  check("broken Exif: reported as other, no crash", M.inspect(broken).found.other);
}

console.log(failed ? `${failed} of ${total} checks failed` : `all ${total} checks pass`);
process.exit(failed ? 1 : 0);
