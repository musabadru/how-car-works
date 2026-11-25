"""Headless stills of a Inkworks page.

    python3 tools/shoot.py out.png [--url "http://localhost:9081/?m=pump&layout=figure"] [--w 1440 --h 900] [--scale 2]
                           [--js "window.__sheet.jumpTo(345)"] [--wait 3] [--browser webkit|chromium]

Needs the page served (python3 serve.py 9081). --js runs after load, before the wait.
Prints any page errors.
"""
import argparse
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--url", default="http://localhost:9081/")
ap.add_argument("--w", type=int, default=1440)
ap.add_argument("--h", type=int, default=900)
ap.add_argument("--js", default="")
ap.add_argument("--wait", type=float, default=3.0)
ap.add_argument("--scale", type=float, default=1.0)
ap.add_argument("--browser", choices=["webkit", "chromium"], default="webkit")
a = ap.parse_args()

with sync_playwright() as p:
    b = p.webkit.launch() if a.browser == "webkit" else p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": a.w, "height": a.h}, device_scale_factor=a.scale)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.goto(a.url, wait_until="networkidle")
    if a.js:
        pg.evaluate(a.js)
    pg.wait_for_timeout(int(a.wait * 1000))
    pg.screenshot(path=a.out)
    b.close()
    print("errors:", errs or "none")
