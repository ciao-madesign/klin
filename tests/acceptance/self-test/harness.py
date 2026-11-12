"""Test-only server for the self-test page. Serves extensions/self-test and a wrapper page
that waits for the checks to finish, then posts the results back here. The product page
itself never sends anything. Usage: harness.py PORT PAGE_DIR OUT_FILE"""
import functools, http.server, sys

WRAP = b"""<!doctype html><iframe id="f" src="/page/index.html" style="width:1000px;height:900px"></iframe><script>
const f = document.getElementById("f");
const timer = setInterval(() => {
  const d = f.contentDocument;
  if (!d || d.documentElement.dataset.done !== "1") return;
  clearInterval(timer);
  const rows = [...d.querySelectorAll(".item")].map((r) => r.dataset.status + "\\t" + r.dataset.name + "\\t" + r.dataset.value);
  fetch("/report", { method: "POST", body: rows.join("\\n") });
}, 200);
</script>"""

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/wrap":
            self.send_response(200); self.send_header("Content-Type", "text/html"); self.end_headers(); self.wfile.write(WRAP)
        else:
            super().do_GET()
    def do_POST(self):
        body = self.rfile.read(int(self.headers["Content-Length"]))
        open(sys.argv[3], "wb").write(body + b"\n")
        self.send_response(204); self.end_headers()
    def log_message(self, *args): pass

http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), functools.partial(Handler, directory=sys.argv[2])).serve_forever()
