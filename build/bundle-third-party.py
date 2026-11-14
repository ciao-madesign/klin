#!/usr/bin/env python3
"""Bundle the pinned third-party extensions into a Klin distribution.

    bundle-third-party.py FIREFOX_DIR [--cache DIR]

For every entry of build/third-party.json that has "bundle": true:
  1. fetch the .xpi from "source" (build time only; the browser never makes this connection),
  2. check its sha256 against the pin; on mismatch stop and write nothing,
  3. copy it to FIREFOX_DIR/distribution/extensions/<id>.xpi,
  4. add it to FIREFOX_DIR/distribution/policies.json (ExtensionSettings, normal_installed:
     present by default, the user can remove it). The policies file is config/policies/policies.json
     plus these entries; the install path is only known here, so it is written here.
The .xpi is never unpacked or changed (ADR 0004).
"""
import hashlib, json, pathlib, shutil, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE_POLICIES = ROOT / "config/policies/policies.json"

def fetch(url, cache):
    name = url.rsplit("/", 1)[-1]
    if cache and (cache / name).exists():
        return (cache / name).read_bytes()
    with urllib.request.urlopen(url, timeout=60) as r:
        data = r.read()
    if cache:
        cache.mkdir(parents=True, exist_ok=True)
        (cache / name).write_bytes(data)
    return data

def main(argv):
    args = argv[1:]
    cache = None
    if "--cache" in args:
        i = args.index("--cache"); cache = pathlib.Path(args[i + 1]); del args[i:i + 2]
    if len(args) != 1:
        sys.exit(__doc__)
    dist = pathlib.Path(args[0]) / "distribution"
    pins = json.loads((ROOT / "build/third-party.json").read_text())
    policies = json.loads(SOURCE_POLICIES.read_text())
    settings = policies["policies"].setdefault("ExtensionSettings", {})

    staged = []
    for name, pin in pins.items():
        if not pin.get("bundle"):
            continue
        data = fetch(pin["source"], cache)
        got = hashlib.sha256(data).hexdigest()
        if got != pin["sha256"]:
            sys.exit("FAIL %s: sha256 %s does not match the pin %s (%s). Nothing was written." % (name, got, pin["sha256"], pin["source"]))
        staged.append((name, pin, data))

    out = dist / "extensions"
    out.mkdir(parents=True, exist_ok=True)
    for name, pin, data in staged:
        target = (out / (pin["id"] + ".xpi")).resolve()
        target.write_bytes(data)
        settings[pin["id"]] = {"installation_mode": "normal_installed", "install_url": target.as_uri()}
        print("ok   %s %s (sha256 verified) -> %s" % (name, pin["version"], target))
    (dist / "policies.json").write_text(json.dumps(policies, indent=2) + "\n")
    print("ok   policies written to %s" % (dist / "policies.json"))

if __name__ == "__main__":
    main(sys.argv)
