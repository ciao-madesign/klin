# Baseline tools

Measure how much data, CPU and memory Firefox uses on real sites, with and without the Klin settings. Everything stays on your computer: results are written to a file, nothing is uploaded.

## Before you start (once)
1. Install **Python 3.9 or newer** from python.org (on Windows tick "Add Python to PATH").
2. Install **Firefox** (normal version, from mozilla.org).
3. Open a terminal (Windows: "Command Prompt"; Mac: "Terminal") and run: `python3 -m pip install psutil` (on Windows: `python -m pip install psutil`).
4. Download this repository (GitHub: Code > Download ZIP) and unzip it. In the terminal go to the folder `tests/baseline/tools`.

## Measure (about 40 minutes per variant, keep the computer plugged in and don't use it meanwhile)
```bash
python3 measure.py run --variant stock --label my-computer
python3 measure.py run --variant klin --label my-computer
python3 measure.py compare result-stock.json result-klin.json > comparison.md
```
On Windows use `python` instead of `python3`. Quick test (about 10 minutes): add `--runs 1 --idle 60` to the two `run` commands.

If Firefox is not found automatically, add `--firefox "FULL PATH TO FIREFOX"`.
The Klin variant installs uBlock Origin into a temporary profile (internet needed once) and applies the Klin preferences. Your own Firefox profile is never touched: each run uses a new temporary profile that is deleted afterwards.

## What you get
- `result-stock.json`, `result-klin.json`: all numbers, including which hosts each site contacted.
- `comparison.md`: tables with data received, requests, number of other hosts, CPU seconds, memory, idle behaviour.

Send the two `.json` files (or just `comparison.md`) back to continue the analysis.

## Notes on accuracy
- Data is counted by a local pass-through proxy, so HTTPS stays encrypted and sizes include protocol overhead.
- Memory is the browser's own memory (all its processes). CPU is the CPU time used. Energy is only shown where the computer exposes it (some Intel Linux machines); elsewhere use CPU time as the indicator.
- Sites change every day; compare only runs made on the same day with the same `sites.txt`.
- Pages that need a login, show a cookie banner or block automated browsers can look lighter than they are. Edit `sites.txt` to change the list.

## Self-test
`python3 selftest.py /path/to/firefox` runs both variants against a local fake website (no internet needed except to fetch uBlock Origin).
