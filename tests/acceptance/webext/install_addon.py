"""Install a temporary add-on in a running Firefox via Marionette. Usage: install_addon.py XPI"""
import socket, json, sys, time
for _ in range(60):
    try: s = socket.create_connection(("127.0.0.1", 2828), timeout=60); break
    except OSError: time.sleep(1)
f = s.makefile("rwb")
def rd():
    n = b""
    while (c := f.read(1)) != b":": n += c
    return json.loads(f.read(int(n)))
def cmd(i, name, params=None):
    m = json.dumps([0, i, name, params or {}]).encode(); f.write(str(len(m)).encode() + b":" + m); f.flush(); return rd()
rd(); cmd(1, "WebDriver:NewSession", {"capabilities": {}})
r = cmd(2, "Addon:Install", {"path": sys.argv[1], "temporary": True})
print("install:", r[2] or r[3])
