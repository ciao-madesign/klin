#!/usr/bin/env python3
"""Bundle acceptance run: the build script puts the pinned, signed Greenweb into a copy of Firefox,
the browser installs it at start, and the user can remove it. Also: a wrong hash stops the build.

    run.py FIREFOX_DIR          (needs network to GitHub: the .xpi is fetched at build time)
"""
import json, os, pathlib, shutil, subprocess, sys, tempfile, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)))
    if not ok: failures.append(label)

pins = json.loads((ROOT / "build/third-party.json").read_text())
gw = pins["greenweb"]
work = pathlib.Path(tempfile.mkdtemp(prefix="klin-bundle-"))
ff_dir = work / "ff"
shutil.copytree(sys.argv[1], ff_dir, symlinks=True)

# a wrong hash must stop the build and write nothing
bad = work / "bad-root"
shutil.copytree(ROOT / "build", bad / "build"); shutil.copytree(ROOT / "config", bad / "config")
pins_bad = json.loads(json.dumps(pins)); pins_bad["greenweb"]["sha256"] = "0" * 64
(bad / "build/third-party.json").write_text(json.dumps(pins_bad))
r = subprocess.run([sys.executable, "-I", str(bad / "build/bundle-third-party.py"), str(work / "ff-bad")], capture_output=True, text=True)
check("a wrong sha256 stops the build", r.returncode != 0 and "does not match" in r.stderr, r.stderr[-200:])
check("and nothing is written", not (work / "ff-bad").exists())

r = subprocess.run([sys.executable, "-I", str(ROOT / "build/bundle-third-party.py"), str(ff_dir)], capture_output=True, text=True)
check("the build script bundles Greenweb", r.returncode == 0, r.stdout + r.stderr)
xpi = ff_dir / "distribution/extensions" / (gw["id"] + ".xpi")
check("the .xpi is in distribution/extensions", xpi.exists())
policy = json.loads((ff_dir / "distribution/policies.json").read_text())["policies"]
entry = policy["ExtensionSettings"].get(gw["id"], {})
check("the policy installs it as normal_installed (removable)", entry.get("installation_mode") == "normal_installed", entry)
check("uBlock Origin's entry is still there", "uBlock0@raymondhill.net" in policy["ExtensionSettings"])

with Firefox(str(ff_dir)) as ff:
    ff.cmd("Marionette:SetContext", {"value": "chrome"})
    info = None
    for _ in range(40):
        info = ff.async_script("""
            const done = arguments[arguments.length - 1];
            const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
            AddonManager.getAddonByID(arguments[0]).then((a) => done(a ? { version: a.version, active: a.isActive, signed: a.signedState, type: a.type,
                 removable: !!(a.permissions & AddonManager.PERM_CAN_UNINSTALL), disabled: a.userDisabled, scope: a.scope } : null));""", [gw["id"]])
        if info: break
        time.sleep(1)
    print("     ", info)
    check("Greenweb is installed at the first start", bool(info))
    if info:
        check("it is the pinned version", info["version"] == gw["version"], info)
        check("it is active", info["active"] is True, info)
        check("Mozilla's signature is accepted (signed state 2 = signed)", info["signed"] == 2, info)
        gone = ff.async_script("""
            const done = arguments[arguments.length - 1];
            const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
            AddonManager.getAddonByID(arguments[0]).then(async (a) => {
              await a.disable(); const off = a.userDisabled; await a.enable(); await a.uninstall();
              done({ off, gone: !(await AddonManager.getAddonByID(arguments[0])) }); });""", [gw["id"]])
        check("the user can switch it off", gone["off"] is True, gone)
        check("the user can remove it", gone["gone"] is True, gone)

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
