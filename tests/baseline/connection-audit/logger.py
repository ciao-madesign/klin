"""Tiny logging proxy: records every destination Firefox tries to reach and refuses it (403).
Usage: python3 -I logger.py PORT OUTFILE
"""
import asyncio, sys, time

port, out = int(sys.argv[1]), sys.argv[2]
t0 = time.time()

async def handle(r, w):
    try:
        line = (await asyncio.wait_for(r.readline(), 10)).decode("latin1").strip()
        parts = line.split()
        if len(parts) >= 2:
            target = parts[1]
            if parts[0] == "CONNECT":
                entry = f"{parts[0]} {target}"
            else:
                entry = f"{parts[0]} {target.split('?')[0]}"
            with open(out, "a") as f:
                f.write(f"{time.time() - t0:7.1f}s {entry}\n")
        w.write(b"HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\nConnection: close\r\n\r\n")
        await w.drain()
    except Exception:
        pass
    finally:
        w.close()

async def main():
    srv = await asyncio.start_server(handle, "127.0.0.1", port)
    async with srv:
        await srv.serve_forever()

asyncio.run(main())
