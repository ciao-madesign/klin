#!/usr/bin/env python3 -I
"""Copies the shared style (extensions/_shared) into every extension that has pages, so each extension is self-contained.

    sync-shared.py          copy
    sync-shared.py --check  fail if a copy differs from the source (used by tests/acceptance/style)
"""
import filecmp, pathlib, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "extensions/_shared"
TARGETS = ["welcome", "connections", "self-test", "lookalike", "private-window", "attempts-log", "username-check", "alias-registry", "privacy-level"]

def files():
    return [p.relative_to(SOURCE) for p in sorted(SOURCE.rglob("*")) if p.is_file()]

def main():
    check = "--check" in sys.argv
    bad = []
    for name in TARGETS:
        for rel in files():
            src, dst = SOURCE / rel, ROOT / "extensions" / name / "shared" / rel
            if check:
                if not dst.exists() or not filecmp.cmp(src, dst, shallow=False): bad.append(str(dst.relative_to(ROOT)))
            else:
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(src, dst)
    if check:
        print("\n".join("differs or missing: " + b for b in bad) or "shared files are in sync")
        sys.exit(1 if bad else 0)

main()
