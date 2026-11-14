#!/usr/bin/env python3
"""Make a test copy of Klin you can run like a normal program (Windows), without touching your Firefox.

    python build/make-test-package.py [OUTPUT_DIR]          (Windows: downloads Firefox 160.0)
    python build/make-test-package.py OUTPUT_DIR --use-dir FIREFOX_DIR   (any system: use a Firefox folder you already have)

What it does: downloads the official Firefox 160.0 installer from archive.mozilla.org and checks its SHA-512
(fails if different), unpacks it WITHOUT installing it (/ExtractDir), adds Klin's settings (config/prefs,
config/policies), adds the signed extensions (build/bundle-third-party.py) and writes Klin.bat, which starts
it with its own profile folder (KlinProfile), next to your normal Firefox. Delete the output folder to remove everything.
This is a test package, not a release: no installer, no icon or name of its own, no updates.
"""
import hashlib, importlib.util, os, pathlib, shutil, subprocess, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
URL = "https://archive.mozilla.org/pub/firefox/releases/160.0/win64/en-US/Firefox%20Setup%20160.0.exe"
SHA512 = "d8775c051cc5f5330386a002fec915d2d057b33bbf7e19037d9f65f094d651f63e2302ada829a4cede9a05a24c015db4acb4f56a34d4147beada984487e9c53c"  # from archive.mozilla.org/pub/firefox/releases/160.0/SHA512SUMS, 14 Nov 2026

def find_firefox(base):
    for p in [base, base / "core"] + [d for d in base.iterdir() if d.is_dir()]:
        if (p / ("firefox.exe" if os.name == "nt" else "firefox")).exists():
            return p
    sys.exit("firefox not found in %s" % base)

def main(argv):
    args = [a for a in argv[1:]]
    use = None
    if "--use-dir" in args:
        i = args.index("--use-dir"); use = pathlib.Path(args[i + 1]); del args[i:i + 2]
    out = pathlib.Path(args[0] if args else "Klin-test").resolve()
    if out.exists():
        sys.exit("%s already exists: delete it or choose another folder." % out)
    app = out / "Klin"
    if use:
        shutil.copytree(use, app, symlinks=True)
    else:
        if os.name != "nt":
            sys.exit("Downloading the Windows installer only works on Windows; use --use-dir.")
        out.mkdir(parents=True)
        exe = out / "firefox-setup.exe"
        print("Downloading Firefox 160.0 ...")
        urllib.request.urlretrieve(URL, exe)
        got = hashlib.sha512(exe.read_bytes()).hexdigest()
        if got != SHA512:
            sys.exit("FAIL: SHA-512 of the download does not match. Nothing was installed.")
        print("SHA-512 ok. Unpacking (not installing) ...")
        subprocess.run([str(exe), "/ExtractDir=" + str(app)], check=True)
        exe.unlink()
        app = find_firefox(app)
    ff = find_firefox(app) if use else app
    prefs = ff / "browser/defaults/preferences"; prefs.mkdir(parents=True, exist_ok=True)
    shutil.copy(ROOT / "config/prefs/klin.js", prefs / "klin.js")
    spec = importlib.util.spec_from_file_location("bundle", ROOT / "build/bundle-third-party.py")
    bundle = importlib.util.module_from_spec(spec); spec.loader.exec_module(bundle)
    bundle.main(["bundle", str(ff)])
    rel = ff.relative_to(out)
    (out / "Klin.bat").write_text('@echo off\r\nstart "" "%~dp0' + str(rel / "firefox.exe") + '" -no-remote -profile "%~dp0KlinProfile"\r\n')
    (out / "KlinProfile").mkdir(exist_ok=True)
    print("\nDone. Start Klin with: %s" % (out / "Klin.bat"))

if __name__ == "__main__":
    main(sys.argv)
