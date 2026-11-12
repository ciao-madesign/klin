#!/usr/bin/env bash
# Idle connection audit. Usage: run.sh FIREFOX_DIR LABEL [SECONDS]
# Starts Firefox headless on a fresh profile routed through a logging proxy
# and lists every destination it tries to reach. Nothing is actually fetched.
set -euo pipefail
FF="$1"; LABEL="$2"; SECS="${3:-90}"
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="$(mktemp -d)"; PORT=8899
python3 -I "$HERE/logger.py" $PORT "$WORK/conn.log" & LP=$!
mkdir -p "$WORK/profile"
cat > "$WORK/profile/user.js" <<PREFS
user_pref("network.proxy.type", 1);
user_pref("network.proxy.http", "127.0.0.1");
user_pref("network.proxy.http_port", $PORT);
user_pref("network.proxy.ssl", "127.0.0.1");
user_pref("network.proxy.ssl_port", $PORT);
user_pref("network.proxy.no_proxies_on", "localhost, 127.0.0.1");
PREFS
env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy -u ALL_PROXY \
  "$FF/firefox" --headless --no-remote --profile "$WORK/profile" >/dev/null 2>&1 & FP=$!
sleep "$SECS"
kill $FP $LP 2>/dev/null || true; wait 2>/dev/null || true
touch "$WORK/conn.log"
echo "== $LABEL: $(wc -l < "$WORK/conn.log") requests in ${SECS}s =="
awk '{print $2" "$3}' "$WORK/conn.log" | sed -E 's#http://([^/]+).*#HTTP \1#; s#^CONNECT #HTTPS #' | sort | uniq -c | sort -rn
cp "$WORK/conn.log" "${OUT:-/dev/null}" 2>/dev/null || true
