#!/usr/bin/env python3
"""EU suspended-media converter: reads Annex XV from a saved copy of the consolidated regulation (no network)
and checks the result. Needs no Firefox.

    run.py
"""
import json, pathlib, subprocess, sys, tempfile

ROOT = pathlib.Path(__file__).resolve().parents[3]
FIX = ROOT / "tests/acceptance/eu-list/annex-xv-fixture.xhtml"
failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)))
    if not ok: failures.append(label)

def run(*extra):
    return subprocess.run([sys.executable, "-I", str(ROOT / "build/gen-eu-suspended-media.py"), "--from-file", str(FIX), "--stdout", *extra], capture_output=True, text=True)

r = run()
out = json.loads(r.stdout[r.stdout.index("{"):])
names = [o["name"] for o in out["outlets"]]
check("the converter reads the outlets of Annex XV in order", names[0].startswith("RT") and "Sputnik" in names and len(names) >= 30, len(names))
check("every outlet has at least one domain", r.returncode == 0 and all(o["domains"] for o in out["outlets"]), r.stdout[:200])
check("it records which regulation inserted each group", {o["inserted_by"] for o in out["outlets"]} >= {None, "32022R0879"}, {o["inserted_by"] for o in out["outlets"]})
check("it says the domains are unverified", "UNVERIFIED" in out["domains_status"])
check("every domain is a bare host name", all(d == d.lower() and "/" not in d and " " not in d for d in out["domains"]))

# an outlet without a domain entry must make the run fail
text = FIX.read_text(encoding="utf-8").replace("Katehon", "Some New Outlet")
tmp = pathlib.Path(tempfile.mkdtemp()) / "x.xhtml"; tmp.write_text(text, encoding="utf-8")
r2 = subprocess.run([sys.executable, "-I", str(ROOT / "build/gen-eu-suspended-media.py"), "--from-file", str(tmp), "--stdout"], capture_output=True, text=True)
check("an outlet with no domain entry is reported and fails the run", r2.returncode == 1 and "Some New Outlet" in r2.stdout, r2.stdout[-200:])

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
