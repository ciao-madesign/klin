#!/usr/bin/env python3
"""Sign Klin's own extensions with Mozilla (unlisted, free), one signature per version.

    sign-extensions.py [--dry-run] [--only NAME ...]

Needs, on the machine of the person who signs (never in the repository):
  - node and `npx web-ext` (the official Mozilla tool, fetched by npx),
  - the keys of the addons.mozilla.org account, in the environment: AMO_JWT_ISSUER and AMO_JWT_SECRET.
For each extensions/<name>/ with a manifest it skips versions already signed (a file
build/signed/<id>-<version>.xpi exists), otherwise runs `web-ext sign --channel=unlisted` and keeps the
signed file there. build/signed/ is not committed: publish the files as assets of a GitHub release of klin
and pin them in build/third-party.json like Greenweb (ADR 0010). Contacts addons.mozilla.org: signing time only.
"""
import json, os, pathlib, shutil, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "build/signed"
# test pages and helpers that are not extensions of the product
SKIP = {"_shared"}

def main(argv):
    dry = "--dry-run" in argv
    only = argv[argv.index("--only") + 1:] if "--only" in argv else None
    todo = []
    for d in sorted((ROOT / "extensions").iterdir()):
        m = d / "manifest.json"
        if not m.exists() or d.name in SKIP or (only and d.name not in only):
            continue
        man = json.loads(m.read_text())
        ext_id = man["browser_specific_settings"]["gecko"]["id"]
        target = OUT / ("%s-%s.xpi" % (ext_id, man["version"]))
        status = "already signed" if target.exists() else "to sign"
        print("%-16s %-8s %s" % (d.name, man["version"], status))
        if not target.exists():
            todo.append((d, target))
    if dry or not todo:
        return
    if not (os.environ.get("AMO_JWT_ISSUER") and os.environ.get("AMO_JWT_SECRET")):
        sys.exit("Set AMO_JWT_ISSUER and AMO_JWT_SECRET (addons.mozilla.org > Tools > Manage API Keys).")
    OUT.mkdir(parents=True, exist_ok=True)
    for d, target in todo:
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run(["npx", "--yes", "web-ext", "sign", "--channel=unlisted", "--source-dir", str(d),
                            "--artifacts-dir", tmp, "--api-key", os.environ["AMO_JWT_ISSUER"],
                            "--api-secret", os.environ["AMO_JWT_SECRET"]], check=True)
            made = list(pathlib.Path(tmp).glob("*.xpi"))
            if len(made) != 1:
                sys.exit("expected one signed file for %s, found %d" % (d.name, len(made)))
            shutil.copy(made[0], target)
        print("ok   signed %s -> %s" % (d.name, target))

if __name__ == "__main__":
    main(sys.argv[1:])
