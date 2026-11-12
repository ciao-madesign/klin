#!/usr/bin/env bash
# Ad/tracker blocking test. Usage: run.sh FIREFOX_DIR UBO_XPI [WITH_UBO=1|0]
# Prints which mock resources actually reached the server (i.e. were NOT blocked).
set -euo pipefail
FF="$1"; XPI="$(realpath "$2")"; WITH="${3:-1}"; DELAY=25
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../.." && pwd)"
WORK="$(mktemp -d)"; PORT=8898
cp "$FF/distribution/policies.json" "$WORK/policies.orig" 2>/dev/null || true
python3 -I - "$ROOT/config/policies/policies.json" "$FF/distribution/policies.json" "$XPI" "$WITH" <<'PY'
import json, sys
src, dst, xpi, with_ubo = sys.argv[1:]
d = json.load(open(src))
d["policies"]["HttpsOnlyMode"] = "disallowed"          # test pages are plain http
ext = d["policies"]["ExtensionSettings"]
if with_ubo == "1":
    ext["uBlock0@raymondhill.net"]["install_url"] = "file://" + xpi
else:
    ext.clear()
json.dump(d, open(dst, "w"))
PY
mkdir -p "$WORK/profile"
cat > "$WORK/profile/user.js" <<PREFS
user_pref("network.proxy.type", 1);
user_pref("network.proxy.http", "127.0.0.1");
user_pref("network.proxy.http_port", $PORT);
user_pref("network.proxy.no_proxies_on", "localhost, 127.0.0.1");
user_pref("privacy.trackingprotection.enabled", false);   // isolate uBlock: native TP off
user_pref("privacy.trackingprotection.socialtracking.enabled", false);
user_pref("privacy.trackingprotection.fingerprinting.enabled", false);
user_pref("privacy.trackingprotection.cryptomining.enabled", false);
user_pref("privacy.trackingprotection.annotate_channels", false);
user_pref("privacy.annotate_channels.strict_list.enabled", false);
user_pref("urlclassifier.trackingTable", "");
user_pref("urlclassifier.trackingAnnotationTable", "");
user_pref("urlclassifier.features.socialtracking.skipURLs", "");
user_pref("urlclassifier.features.socialtracking.annotate.blacklistTables", "");
user_pref("urlclassifier.features.socialtracking.blacklistTables", "");
user_pref("browser.safebrowsing.malware.enabled", false);
PREFS
python3 -I "$HERE/mockweb.py" $PORT "$WORK/req.log" $DELAY & MP=$!
sleep 1
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy \
  "$FF/firefox" --headless --no-remote --profile "$WORK/profile" http://wait.test/ >/dev/null 2>&1 & FP=$!
sleep $((DELAY + 20))
kill $FP $MP 2>/dev/null || true; wait 2>/dev/null || true
[ -f "$WORK/policies.orig" ] && cp "$WORK/policies.orig" "$FF/distribution/policies.json"
echo "== uBlock Origin: $([ "$WITH" = 1 ] && echo ON || echo OFF) =="
grep -v wait.test "$WORK/req.log" | awk '{print $2}' | sort -u
