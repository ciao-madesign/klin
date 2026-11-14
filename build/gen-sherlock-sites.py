#!/usr/bin/env python3
"""Convert Sherlock's site list into the compact list used by extensions/username-check.

    gen-sherlock-sites.py            download the pinned commit, verify its hash, write the list
    gen-sherlock-sites.py FILE       use a local copy of data.json (hash still verified)
    gen-sherlock-sites.py --check    fail if the committed list differs from what the pin produces

Pin and licence are recorded in build/third-party.json ("sherlock-sites"). Sites marked NSFW are left out.
"""
import hashlib, json, pathlib, subprocess, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
PIN = json.loads((ROOT / "build/third-party.json").read_text())["sherlock-sites"]
OUT = ROOT / "extensions/username-check/data"
BASE = "https://raw.githubusercontent.com/sherlock-project/sherlock/%s/" % PIN["commit"]

def fetch(path):
    with urllib.request.urlopen(BASE + path, timeout=60) as r:
        return r.read()

def build(raw):
    if hashlib.sha256(raw).hexdigest() != PIN["sha256"]:
        sys.exit("data.json does not match the pinned hash: update build/third-party.json deliberately")
    src = json.loads(raw)
    sites = []
    for name, s in sorted(src.items(), key=lambda kv: kv[0].lower()):
        if name.startswith("$") or not isinstance(s, dict) or s.get("isNSFW"):
            continue
        e = {"name": name, "url": s["url"], "main": s["urlMain"], "type": s["errorType"]}
        for src_key, key in (("urlProbe", "probe"), ("errorMsg", "msg"), ("errorUrl", "errUrl"),
                             ("errorCode", "code"), ("regexCheck", "regex"), ("request_method", "method"),
                             ("request_payload", "payload"), ("headers", "headers")):
            if src_key in s:
                e[key] = s[src_key]
        sites.append(e)
    return sites

def main():
    args = sys.argv[1:]
    check = "--check" in args
    files = [a for a in args if not a.startswith("--")]
    raw = pathlib.Path(files[0]).read_bytes() if files else fetch(PIN["path"])
    text = json.dumps({"source": PIN["source"], "commit": PIN["commit"], "licence": "MIT (see SHERLOCK-LICENSE)",
                       "sites": build(raw)}, ensure_ascii=False, separators=(",", ":")) + "\n"
    if check:
        if (OUT / "sites.json").read_text() != text:
            sys.exit("extensions/username-check/data/sites.json is out of date: run build/gen-sherlock-sites.py")
        print("sites.json is up to date")
        return
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "sites.json").write_text(text)
    if not files:
        (OUT / "SHERLOCK-LICENSE").write_bytes(fetch("LICENSE"))
    print("wrote", len(json.loads(text)["sites"]), "sites")

main()
