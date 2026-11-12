#!/usr/bin/env bash
# Runs the self-test page as ordinary web content in the given Firefox and prints
# one line per check: STATUS <tab> NAME <tab> VALUE. Usage: run.sh FIREFOX_DIR [SECONDS]
# Compare a stock Firefox with one that has config/prefs/klin.js installed.
set -euo pipefail
FF="$1"; SECS="${2:-45}"; PORT=8897
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../.." && pwd)"
WORK="$(mktemp -d)"; mkdir -p "$WORK/profile"
python3 -I "$HERE/harness.py" $PORT "$ROOT/extensions/self-test" "$WORK/out.tsv" & SP=$!
sleep 1
env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy -u ALL_PROXY \
  "$FF/firefox" --headless --no-remote --profile "$WORK/profile" "http://127.0.0.1:$PORT/wrap" >/dev/null 2>&1 & FP=$!
sleep "$SECS"
kill $FP $SP 2>/dev/null || true; wait 2>/dev/null || true
if [ -s "$WORK/out.tsv" ]; then cat "$WORK/out.tsv"; else echo "no results: the page did not finish" >&2; exit 1; fi
