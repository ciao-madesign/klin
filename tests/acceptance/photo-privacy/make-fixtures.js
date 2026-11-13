// Writes the test photos to a directory. Usage: node make-fixtures.js DIR
const fs = require("fs"), path = require("path");
const F = require("./fixtures.js");
const dir = process.argv[2];
const write = (name, bytes) => fs.writeFileSync(path.join(dir, name), bytes);
write("gps.jpg", F.jpegWith([F.exifSegment({ orientation: 6, make: "AcmeCam", model: "X100", dateOriginal: "2026:05:01 10:00:00", gps: true })]));
write("clean.jpg", F.bytesOf(F.JPEG_B64));
write("text.png", F.pngWith([["tEXt", F.text("Author\0Jane Doe")]]));
write("note.txt", F.text("just a note"));
