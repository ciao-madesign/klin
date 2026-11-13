#!/usr/bin/env python3
"""Connections page acceptance run: installs extensions/connections, clicks the toolbar
button and checks that the page lists every entry of data/connections.json.

    run.py FIREFOX_DIR
"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

data = json.loads((ROOT / "extensions/connections/data/connections.json").read_text())["connections"]
expected = {"total": len(data), "on": sum(c["klin"] == "on" for c in data), "off": sum(c["klin"] == "off" for c in data)}

with Firefox(sys.argv[1]) as ff:
    addon = ff.install_addon(ROOT / "extensions/connections")
    before = ff.handles()
    ff.click_action(addon)
    ff.switch_to_new_tab(before)
    if not ff.wait_for("document.querySelectorAll('.card').length > 0"):
        sys.exit("FAIL: the page shows no connections")
    shown = ff.script("""
        const count = (f) => { document.querySelector(`button[data-filter="${f}"]`).click();
                               return [...document.querySelectorAll(".card")].filter((c) => !c.hidden).length; };
        return { total: count("all"), on: count("on"), off: count("off") };""")
    print("expected", expected, "shown", shown)
    sys.exit(0 if shown == expected else "FAIL: page and data differ")
