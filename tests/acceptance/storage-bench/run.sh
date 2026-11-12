#!/usr/bin/env bash
# Usage: run.sh FIREFOX_DIR   (needs node/npm to fetch sql.js, MIT)
set -euo pipefail
FF="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"; WEB="$HERE/../webext"; WORK="$(mktemp -d)"; PORT=8897
cp -r "$HERE/ext" "$WORK/ext"
(cd "$WORK" && npm pack sql.js >/dev/null 2>&1 && tar xzf sql.js-*.tgz && cp package/dist/sql-wasm.js package/dist/sql-wasm.wasm ext/)
cat > "$WORK/ext/manifest.json" <<'JSON'
{"manifest_version": 3, "name": "Klin storage bench", "version": "0.0.1",
 "browser_specific_settings": {"gecko": {"id": "klin-bench@example.invalid"}},
 "permissions": ["storage"], "host_permissions": ["<all_urls>"],
 "background": {"scripts": ["sql-wasm.js", "background.js"]},
 "content_security_policy": {"extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"}}
JSON
(cd "$WORK/ext" && python3 -I -c "import zipfile,os
z=zipfile.ZipFile('../bench.xpi','w')
[z.write(f) for f in os.listdir('.')]")
mkdir -p "$WORK/profile"
cat > "$WORK/profile/user.js" <<PREFS
user_pref("network.proxy.type", 1);
user_pref("network.proxy.http", "127.0.0.1");
user_pref("network.proxy.http_port", $PORT);
user_pref("network.proxy.no_proxies_on", "localhost, 127.0.0.1");
user_pref("dom.security.https_only_mode", false);   // Klin default is HTTPS-only; the mock server is plain http
PREFS
REAL_OLLAMA=1 python3 -I "$WEB/server.py" $PORT "$WORK/report.json" "$WORK/req.log" 5 & SP=$!
env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy "$FF/firefox" --headless --marionette --no-remote --profile "$WORK/profile" about:blank >"$WORK/ff.log" 2>&1 & FP=$!
python3 -I "$WEB/install_addon.py" "$WORK/bench.xpi"
for i in $(seq 1 240); do grep -q '"rows"' "$WORK/report.json" 2>/dev/null && break; sleep 1; done
kill $FP $SP 2>/dev/null || true; wait 2>/dev/null || true
[ -s "$WORK/report.json" ] && python3 -I -c "import json;[print(json.dumps(json.loads(l),indent=1)) for l in open('$WORK/report.json') if l.strip()][-1:]" || { echo "NO REPORT"; grep -i "error\|warn\|extension" "$WORK/ff.log" | head -15; }
