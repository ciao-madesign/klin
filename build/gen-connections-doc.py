#!/usr/bin/env python3
"""Regenerates the table in docs/CONNECTIONS.md from extensions/connections/data/connections.json.
Usage: python3 build/gen-connections-doc.py [--check]"""
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "extensions/connections/data/connections.json"
DOC = ROOT / "docs/CONNECTIONS.md"
BEGIN, END = "<!-- connections:begin (generated, do not edit) -->", "<!-- connections:end -->"

def table(data):
    rows = ["| Connection | Destination | When | Stock | Klin | Purpose | Decision |", "|---|---|---|---|---|---|---|"]
    for c in data["connections"]:
        klin = "yes" if c["klin"] == "on" else "**no**"
        rows.append("| {} | {} | {} | {} | {} | {} | {} |".format(
            c["name"], ", ".join(c["hosts"]), c["when"], "yes" if c["stock"] else "no", klin, c["purpose"], c["decision"]))
    return "\n".join(rows)

def main():
    text = DOC.read_text()
    start, end = text.index(BEGIN) + len(BEGIN), text.index(END)
    new = text[:start] + "\n" + table(json.loads(DATA.read_text())) + "\n" + text[end:]
    if "--check" in sys.argv:
        sys.exit(0 if new == text else "docs/CONNECTIONS.md is out of date: run build/gen-connections-doc.py")
    DOC.write_text(new)

main()
