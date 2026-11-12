#!/usr/bin/env python3
"""Self-test of measure.py on a local fake web (no internet). Usage: selftest.py FIREFOX_PATH"""
import subprocess, sys, threading, tempfile, os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        host = self.headers.get("Host", "").split(":")[0]
        if self.path == "/": body, ct = (b'<!doctype html><title>t</title><p>hello</p><script src="/app.js"></script><script src="http://doubleclick.net/pagead/ads?x=1"></script>'), "text/html"
        else: body, ct = (b"//" + b"x" * 40000), "application/javascript"
        self.send_response(200); self.send_header("Content-Type", ct); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)

srv = ThreadingHTTPServer(("127.0.0.1", 0), H); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
tmp = Path(tempfile.mkdtemp()); sites = tmp / "sites.txt"; sites.write_text("http://a.test/\nhttp://b.test/\n")
here = Path(__file__).resolve().parent
common = ["--firefox", sys.argv[1], "--sites", str(sites), "--runs", "1", "--warmup", "5", "--settle", "2", "--idle", "5", "--headless", "--allow-http",
          "--map", f"a.test=127.0.0.1:{port}", "--map", f"b.test=127.0.0.1:{port}", "--map", f"doubleclick.net=127.0.0.1:{port}"]
for v in ("stock", "klin"):
    subprocess.run([sys.executable, str(here / "measure.py"), "run", "--variant", v, "--out", str(tmp / f"{v}.json")] + common, check=True)
subprocess.run([sys.executable, str(here / "measure.py"), "compare", str(tmp / "stock.json"), str(tmp / "klin.json")], check=True)
