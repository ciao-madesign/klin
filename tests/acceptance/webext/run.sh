#!/usr/bin/env bash
# Usage: run.sh FIREFOX_DIR MANIFEST_VERSION(2|3)
# Installs the probe extension twice (two sessions, same profile) to also test persistence.
set -euo pipefail
FF="$1"; MV="$2"; HERE="$(cd "$(dirname "$0")" && pwd)"; WORK="$(mktemp -d)"; PORT=8897
cp -r "$HERE/ext" "$WORK/ext"; python3 -I "$HERE/gen-manifest.py" "$MV" "$WORK/ext/manifest.json"
(cd "$WORK/ext" && python3 -I -c "import zipfile,os
z=zipfile.ZipFile('../probe.xpi','w')
[z.write(f) for f in os.listdir('.')]")
mkdir -p "$WORK/profile"
cat > "$WORK/profile/user.js" <<PREFS
user_pref("network.proxy.type", 1);
user_pref("network.proxy.http", "127.0.0.1");
user_pref("network.proxy.http_port", $PORT);
user_pref("network.proxy.no_proxies_on", "localhost, 127.0.0.1");
user_pref("privacy.userContext.enabled", true);
user_pref("dom.security.https_only_mode", false);
PREFS
for RUN in 1 2; do
  rm -f "$WORK/report.json" "$WORK/req.log"; touch "$WORK/req.log"
  python3 -I "$HERE/server.py" $PORT "$WORK/report.json" "$WORK/req.log" 12 & SP=$!
  env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy \
    "$FF/firefox" --headless --marionette --no-remote --profile "$WORK/profile" http://wait.test/ >/dev/null 2>&1 & FP=$!
  python3 -I "$HERE/install_addon.py" "$WORK/probe.xpi"
  for i in $(seq 1 60); do [ -s "$WORK/report.json" ] && break; sleep 1; done
  kill $FP $SP 2>/dev/null || true; wait 2>/dev/null || true; sleep 2
  echo "=== manifest v$MV, run $RUN ==="
  if [ -s "$WORK/report.json" ]; then python3 -I -c "import json,sys;print(json.dumps(json.loads(open('$WORK/report.json').read().splitlines()[0]),indent=1))"; else echo "NO REPORT"; fi
done
