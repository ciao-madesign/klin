#!/usr/bin/env bash
# Runs the self-test page as ordinary web content in the given Firefox and prints
# one line per check: STATUS <tab> NAME <tab> VALUE. Usage: run.sh FIREFOX_DIR [SECONDS]
# Compare a stock Firefox with one that has config/prefs/klin.js installed.
# The page is opened as http://$TEST_HOST (default selftest.example.org) through the test server acting as
# proxy: Firefox keys some protections (canvas noise) on the site name and skips them on 127.0.0.1/localhost.
# HTTPS-only is switched off for the run because the test page is plain http.
# Optional: EXTRA_PREFS='user_pref(...);' adds prefs for this run.
set -euo pipefail
FF="$1"; SECS="${2:-45}"; PORT=8897
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../.." && pwd)"
WORK="$(mktemp -d)"; mkdir -p "$WORK/profile"
python3 -I "$HERE/harness.py" $PORT "$ROOT/extensions/self-test" "$WORK/out.tsv" & SP=$!
HOST="${TEST_HOST:-selftest.example.org}"
cat > "$WORK/profile/user.js" <<PREFS
user_pref("network.proxy.type", 1);
user_pref("network.proxy.http", "127.0.0.1");
user_pref("network.proxy.http_port", $PORT);
user_pref("network.proxy.no_proxies_on", "");
user_pref("network.proxy.allow_hijacking_localhost", true);
user_pref("network.proxy.ssl", "127.0.0.1");
user_pref("network.proxy.ssl_port", $PORT);
user_pref("dom.security.https_only_mode", false);
user_pref("dom.security.https_first", false);
${EXTRA_PREFS:-}
PREFS
sleep 1
env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy -u ALL_PROXY \
  "$FF/firefox" --headless --no-remote --profile "$WORK/profile" "http://$HOST/wrap" >/dev/null 2>&1 & FP=$!
sleep "$SECS"
kill $FP $SP 2>/dev/null || true; wait 2>/dev/null || true
if [ -s "$WORK/out.tsv" ]; then cat "$WORK/out.tsv"; else echo "no results: the page did not finish" >&2; exit 1; fi
