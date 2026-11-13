"""Minimal Marionette client for tests: start Firefox, load an unsigned extension temporarily,
open pages and run scripts in them. Test-only; nothing here ships in Klin.

    with Firefox(firefox_dir, prefs={"some.pref": True}) as ff:
        addon_id = ff.install_addon("/abs/path/to/extension")
        ff.navigate(ff.addon_url(addon_id, "page/index.html"))
        value = ff.script("return document.title")
"""
import json, os, shutil, socket, subprocess, tempfile, time


class Firefox:
    def __init__(self, firefox_dir, prefs=None, port=2828, headless=True):
        self.profile = tempfile.mkdtemp(prefix="klin-test-")
        all_prefs = {"marionette.port": port, "datareporting.policy.dataSubmissionEnabled": False}
        all_prefs.update(prefs or {})
        with open(os.path.join(self.profile, "user.js"), "w") as f:
            for name, value in all_prefs.items():
                f.write("user_pref(%s, %s);\n" % (json.dumps(name), json.dumps(value)))
        env = {k: v for k, v in os.environ.items() if k.lower() not in ("http_proxy", "https_proxy", "all_proxy")}
        env["MOZ_REMOTE_ALLOW_SYSTEM_ACCESS"] = "1"  # needed to look up extension URLs
        args = [os.path.join(firefox_dir, "firefox"), "--marionette", "--no-remote", "--profile", self.profile]
        if headless:
            args.append("--headless")
        self.proc = subprocess.Popen(args, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.sock, self.msg_id, self.buf = None, 0, b""
        deadline = time.time() + 60
        while True:
            try:
                self.sock = socket.create_connection(("127.0.0.1", port), timeout=120)
                self._read()  # server hello
                break
            except OSError:
                if time.time() > deadline:
                    self.close()
                    raise RuntimeError("Firefox did not open the Marionette port")
                time.sleep(0.5)
        self.cmd("WebDriver:NewSession", {"capabilities": {"alwaysMatch": {"pageLoadStrategy": "normal"}}})

    def _read(self):
        while b":" not in self.buf:
            self.buf += self.sock.recv(65536)
        size, _, rest = self.buf.partition(b":")
        while len(rest) < int(size):
            chunk = self.sock.recv(65536)
            if not chunk:
                raise OSError("connection closed")
            rest += chunk
        self.buf = rest[int(size):]
        return json.loads(rest[:int(size)])

    def cmd(self, name, params=None):
        self.msg_id += 1
        body = json.dumps([0, self.msg_id, name, params or {}]).encode()
        self.sock.sendall(str(len(body)).encode() + b":" + body)
        _, _, error, result = self._read()
        if error:
            raise RuntimeError("%s: %s" % (name, error.get("message", error)))
        return result.get("value", result) if isinstance(result, dict) else result

    def install_addon(self, path):
        return self.cmd("Addon:Install", {"path": os.path.abspath(path), "temporary": True})

    def addon_url(self, addon_id, page):
        """moz-extension:// URL of a page of an installed extension."""
        self.cmd("Marionette:SetContext", {"value": "chrome"})
        try:
            uuid = self.script(
                "const p = WebExtensionPolicy.getByID(arguments[0]); return p ? p.mozExtensionHostname : null;", [addon_id])
        finally:
            self.cmd("Marionette:SetContext", {"value": "content"})
        if not uuid:
            raise RuntimeError("extension %s is not active" % addon_id)
        return "moz-extension://%s/%s" % (uuid, page)

    def chrome_script(self, source, args=None):
        """Runs a script with browser privileges (test-only)."""
        self.cmd("Marionette:SetContext", {"value": "chrome"})
        try:
            return self.async_script(source, args)
        finally:
            self.cmd("Marionette:SetContext", {"value": "content"})

    def click_action(self, addon_id):
        """Same as the user clicking the extension's toolbar button on the current tab."""
        return self.chrome_script("""
            const [id, done] = arguments;
            const { ExtensionParent } = ChromeUtils.importESModule("resource://gre/modules/ExtensionParent.sys.mjs");
            const ext = WebExtensionPolicy.getByID(id).extension;
            const win = Services.wm.getMostRecentWindow("navigator:browser");
            try { ExtensionParent.apiManager.global.browserActionFor(ext).triggerAction(win); done(true); } catch (e) { done(String(e)); }
        """, [addon_id])

    def switch_to_new_tab(self, known_handles, timeout=15):
        deadline = time.time() + timeout
        while time.time() < deadline:
            new = [h for h in self.cmd("WebDriver:GetWindowHandles") if h not in known_handles]
            if new:
                self.cmd("WebDriver:SwitchToWindow", {"handle": new[0]})
                return new[0]
            time.sleep(0.3)
        raise RuntimeError("no new tab was opened")

    def handles(self):
        return self.cmd("WebDriver:GetWindowHandles")

    def find(self, css):
        return self.cmd("WebDriver:FindElement", {"using": "css selector", "value": css})

    def send_keys(self, element, text):
        """Types into an element; for a file input, `text` is the path(s) to attach (newline-separated)."""
        self.cmd("WebDriver:ElementSendKeys", {"id": next(iter(element.values())), "text": text})

    ENTER, TAB, ESCAPE = "\ue007", "\ue004", "\ue00c"

    def press(self, *keys):
        actions = []
        for key in keys:
            actions += [{"type": "keyDown", "value": key}, {"type": "keyUp", "value": key}]
        self.cmd("WebDriver:PerformActions", {"actions": [{"type": "key", "id": "keyboard", "actions": actions}]})

    def navigate(self, url):
        self.cmd("WebDriver:Navigate", {"url": url})

    def script(self, source, args=None, timeout_ms=30000):
        self.cmd("WebDriver:SetTimeouts", {"script": timeout_ms})
        return self.cmd("WebDriver:ExecuteScript", {"script": source, "args": args or []})

    def async_script(self, source, args=None, timeout_ms=30000):
        """The script must call its last argument with the result."""
        self.cmd("WebDriver:SetTimeouts", {"script": timeout_ms})
        return self.cmd("WebDriver:ExecuteAsyncScript", {"script": source, "args": args or []})

    def wait_for(self, condition_js, timeout=20):
        deadline = time.time() + timeout
        while time.time() < deadline:
            if self.script("return (%s);" % condition_js):
                return True
            time.sleep(0.3)
        return False

    def close(self):
        try:
            if self.sock:
                self.sock.close()
        finally:
            self.proc.terminate()
            try:
                self.proc.wait(timeout=15)
            except subprocess.TimeoutExpired:
                self.proc.kill()
            shutil.rmtree(self.profile, ignore_errors=True)

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()
