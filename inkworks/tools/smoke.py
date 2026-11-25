"""Smoke test for any Inkworks page: drives every control and checks the state reacts.

  python3 tools/smoke.py --url "http://localhost:9081/?m=pump"             # both layouts, 1440x900 + phone
  python3 tools/smoke.py --url ... --layouts sheet --sizes 1440x900

Exit code 1 on any page error or failed check. Needs playwright (webkit).
"""
import argparse, sys
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument("--url", default="http://localhost:9081/")
ap.add_argument("--layouts", default="sheet,figure")
ap.add_argument("--sizes", default="1440x900,1280x720,390x844")
ap.add_argument("--browser", choices=["webkit", "chromium"], default="webkit", help="chromium uses SwiftShader WebGL (CI)")
a = ap.parse_args()

S = "window.__sheet.state"
fails = []


def check(name, ok, detail=""):
    print(f"  {'ok ' if ok else 'FAIL'} {name} {detail}")
    if not ok:
        fails.append(name)


with sync_playwright() as p:
    b = p.webkit.launch() if a.browser == "webkit" else p.chromium.launch(args=["--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"])
    for layout in a.layouts.split(","):
        for size in a.sizes.split(","):
            w, h = map(int, size.split("x"))
            pg = b.new_page(viewport={"width": w, "height": h})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
            sep = "&" if "?" in a.url else "?"
            pg.goto(f"{a.url}{sep}layout={layout}", wait_until="networkidle")
            pg.wait_for_function("window.__sheet !== undefined", timeout=20000)
            pg.wait_for_timeout(1200)
            print(f"[{layout} {size}]")
            ev = pg.evaluate

            t0 = ev(f"{S}.theta"); pg.wait_for_timeout(500)
            check("plays", ev(f"{S}.theta") != t0)

            pg.click("#playBtn"); pg.wait_for_timeout(100)
            check("pause", ev(f"{S}.playing") is False)
            ph0 = ev("(() => { const s = window.__sheet; return s.api.phaseOf(s.state.phi[s.state.focus]); })()")
            pg.click("#nextBtn"); pg.wait_for_function("window.__sheet.state.tween === null", timeout=6000, polling=100)
            ph1 = ev("(() => { const s = window.__sheet; return s.api.phaseOf(s.state.phi[s.state.focus]); })()")
            n = ev("window.__sheet.mech.phases.length")
            check("next phase", ph1 == (ph0 + 1) % n, f"{ph0}->{ph1}")
            pg.click("#prevBtn"); pg.wait_for_function("window.__sheet.state.tween === null", timeout=6000, polling=100)
            ph2 = ev("(() => { const s = window.__sheet; return s.api.phaseOf(s.state.phi[s.state.focus]); })()")
            check("prev phase goes back", ph2 == ph0, f"{ph1}->{ph2}")

            if pg.locator("#phaseList li").count():
                pg.locator("#phaseList li").last.click(); pg.wait_for_function("window.__sheet.state.tween === null", timeout=6000, polling=100)
                ph = ev("(() => { const s = window.__sheet; return s.api.phaseOf(s.state.phi[s.state.focus]); })()")
                check("phase list jump", ph == n - 1, f"-> {ph}")

            pg.click("#playBtn"); pg.wait_for_timeout(100)
            check("play", ev(f"{S}.playing") is True)

            ev("(() => { const d = document.getElementById('drive'); d.value = 90; d.dispatchEvent(new Event('input')); })()")
            r0 = ev(f"{S}.rate"); pg.wait_for_timeout(1500)
            check("input raises rate", ev(f"{S}.rate") > r0 + 1e-6, f"{r0:.1f}->{ev(f'{S}.rate'):.1f}")

            sp = pg.locator("#slowSeg button")
            sp.first.click()
            check("speed button", ev(f"{S}.slow") == int(sp.first.get_attribute("data-s")))

            if pg.locator("#focusSeg button").count() > 2:
                pg.locator("#focusSeg button").nth(2).click()
                check("focus", ev(f"{S}.focus") == 2)

            for tog in pg.locator(".tog").all():
                k = tog.get_attribute("data-layer")
                before = ev(f"{S}.layers['{k}']")
                tog.click(); pg.wait_for_timeout(80)
                check(f"toggle {k}", ev(f"{S}.layers['{k}']") != before)
                tog.click()

            for act in pg.locator(".act").all():
                act.click(); pg.wait_for_timeout(200)
                check(f"action '{act.inner_text()}'", True)

            if pg.locator("#chart").count() and pg.locator("#chart").is_visible():
                pg.locator("#chart").scroll_into_view_if_needed(); pg.wait_for_timeout(200)
                box = pg.locator("#chart").bounding_box()
                pg.mouse.move(box["x"] + box["width"] * 0.3, box["y"] + box["height"] * 0.4)
                pg.mouse.down(); pg.mouse.move(box["x"] + box["width"] * 0.8, box["y"] + box["height"] * 0.4, steps=6)
                th = ev(f"{S}.theta"); pg.mouse.up()
                cyc = ev("window.__sheet.mech.cycle")
                frac = (th % cyc) / cyc
                check("chart scrub", 0.6 < frac < 0.95, f"at {frac:.2f} of the cycle")

            vis = ev("[...document.querySelectorAll('.callout:not(.cyltag)')].filter(e => +e.style.opacity === 1).length")
            want = ev("(() => { const m = window.__sheet.mech, n = window.__sheet.model.callouts.length; return Math.min(4, innerWidth < 700 && m.compactCallouts ? m.compactCallouts.length : n); })()")
            check("callouts shown", vis >= want, f"{vis} (want {want}+)")
            check("no page errors", not errs, "; ".join(errs[:3]))
            pg.close()
    b.close()

print(f"\n{len(fails)} failed" if fails else "\nall checks passed")
sys.exit(1 if fails else 0)
