#!/usr/bin/env python3
"""End-to-end Playwright verification for Phase 1 ("From fuel to the front wheels").

Verifies:
  1. Phone (390x844, touch) & Desktop (1440x900) journeys from Vehicle Map -> Engine -> Driveline
  2. Keyboard hotspot selection, stroke stepping, CVT Launch->Cruise + belt ratio, Differential turns
  3. Click-to-load Inkworks 3D figure + IntersectionObserver off-screen rAF suspend/resume
  4. WebGL-disabled graceful fallback on both Engine lesson and standalone Inkworks page
  5. Reduced-motion initial paused state & zero console/page errors and zero horizontal overflow

Usage (with active virtualenv containing playwright):
    python tests/e2e_smoke.py --url http://127.0.0.1:9081/ --shots tests/artifacts
"""
import argparse
import pathlib
import sys
from playwright.sync_api import sync_playwright

DISABLE_WEBGL_JS = """
(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, ...args) {
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
      return null;
    }
    return orig.call(this, type, ...args);
  };
})();
"""


def assert_no_overflow(page, label):
    overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    assert overflow <= 1, f"[{label}] horizontal overflow detected: {overflow}px"


def run_journey(browser, base_url, shots_dir):
    results = []

    # 1. Phone touch journey (390x844)
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)

    page.goto(base_url, wait_until="networkidle")
    assert_no_overflow(page, "phone-map")
    assert "2019 Japan-market Toyota RAV4 X" in page.text_content(".vehicle-bar")

    # Test all 4 hotspots via tap & keyboard
    for part, expected_title in [
        ("transmission", "Direct Shift-CVT"),
        ("differential", "Final drive & open differential"),
        ("wheels", "Front wheels & tyres"),
        ("engine", "Four-stroke petrol engine"),
    ]:
        btn = page.locator(f'.part-btn[data-part="{part}"]')
        btn.scroll_into_view_if_needed()
        btn.tap()
        assert expected_title in page.text_content("#inspTitle"), f"Unexpected inspector title for {part}"
        assert page.locator(f'.hotspot[data-part="{part}"]').get_attribute("aria-pressed") == "true"

    # Keyboard activation directly on an SVG hotspot
    hs_cvt = page.locator('.hotspot[data-part="transmission"]')
    hs_cvt.focus()
    page.keyboard.press("Enter")
    assert "Direct Shift-CVT" in page.text_content("#inspTitle")
    hs_eng = page.locator('.hotspot[data-part="engine"]')
    hs_eng.focus()
    page.keyboard.press("Space")
    assert "Four-stroke petrol engine" in page.text_content("#inspTitle")

    if shots_dir:
        page.evaluate("window.scrollTo(0, 0)")
        page.screenshot(path=str(shots_dir / "phone-map.png"), full_page=False)

    # Navigate to Engine lesson
    page.locator("#inspLink").click()
    page.wait_for_load_state("networkidle")
    assert "lessons/engine.html" in page.url
    assert_no_overflow(page, "phone-engine-2d")

    # Step through all 4 strokes in 2D cutaway
    expected_strokes = ["Compression", "Power", "Exhaust", "Intake"]
    for name in expected_strokes:
        page.locator("#nextStrokeBtn").click()
        assert page.text_content("#p2dName").strip() == name, f"Expected {name}, got {page.text_content('#p2dName')}"

    # Scrub to Turn 2 (Power)
    page.locator("#crankSlider").fill("420")
    page.locator("#crankSlider").dispatch_event("input")
    assert page.text_content("#p2dName").strip() == "Power"
    assert "Turn 2 of 2" in page.text_content("#t2dTurn")

    if shots_dir:
        page.evaluate("window.scrollTo(0, 0)")
        page.screenshot(path=str(shots_dir / "phone-engine-2d.png"), full_page=False)

    # Click-to-load Inkworks 3D figure & test off-screen suspend/resume
    page.locator("#toggle3dBtn").click()
    iframe_el = page.locator("#embedFrameWrap iframe")
    iframe_el.wait_for(state="visible", timeout=10000)
    frame = page.frame_locator("#embedFrameWrap iframe")
    frame.locator("#playBtn").wait_for(state="visible", timeout=10000)
    page.wait_for_timeout(400)

    if shots_dir:
        page.locator("#engineDemo").scroll_into_view_if_needed()
        page.screenshot(path=str(shots_dir / "phone-engine-3d.png"), full_page=False)

    # Scroll far down so the 3D embed leaves the viewport -> must suspend rAF
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(350)
    child_frame = [f for f in page.frames if "inkworks/index.html" in f.url][0]
    assert child_frame.evaluate("window.__sheet.isSuspended()") is True, "3D embed did not suspend off-screen!"
    assert "suspended" in page.text_content("#embedPowerState").lower()

    # Scroll back to embed -> must resume
    page.locator("#embedFrameWrap").scroll_into_view_if_needed()
    page.wait_for_timeout(350)
    assert child_frame.evaluate("window.__sheet.isSuspended()") is False, "3D embed did not resume when visible!"

    # Open expandable engineering details with keyboard
    summary = page.locator(".eng-details summary")
    summary.scroll_into_view_if_needed()
    summary.focus()
    page.keyboard.press("Enter")
    assert page.locator(".eng-details").evaluate("el => el.open") is True

    # Navigate to Driveline lesson
    page.locator('.lesson-pager a[href="driveline.html"]').click()
    page.wait_for_load_state("networkidle")
    assert "lessons/driveline.html" in page.url
    assert_no_overflow(page, "phone-driveline")

    # Interaction 1: Launch -> Cruise + belt ratio
    assert page.locator("#beltRatioSlider").is_disabled() is True
    page.locator("#modeCruiseBtn").click()
    assert page.locator("#beltRatioSlider").is_disabled() is False
    page.locator("#beltRatioSlider").fill("85")
    page.locator("#beltRatioSlider").dispatch_event("input")
    assert "overdrive" in page.text_content("#cvtReadSpeed").lower()

    # Interaction 2: Straight -> Left turn -> Right turn
    page.locator('[data-turn="left"]').click()
    assert "75%" in page.text_content("#diffReadLeft")
    assert "125%" in page.text_content("#diffReadRight")
    page.locator('[data-turn="right"]').click()
    assert "125%" in page.text_content("#diffReadLeft")
    assert "75%" in page.text_content("#diffReadRight")
    page.locator('[data-turn="straight"]').click()
    assert "100%" in page.text_content("#diffReadLeft")

    if shots_dir:
        page.evaluate("window.scrollTo(0, 0)")
        page.screenshot(path=str(shots_dir / "phone-driveline.png"), full_page=False)

    assert not errors, f"Phone journey had errors: {errors}"
    results.append("PASS phone touch + keyboard + 3D suspend/resume journey (390x844)")
    ctx.close()

    # 2. WebGL-disabled journey (phone 390x844)
    ctx_nowebgl = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True)
    ctx_nowebgl.add_init_script(DISABLE_WEBGL_JS)
    page2 = ctx_nowebgl.new_page()
    errors2 = []
    page2.on("pageerror", lambda e: errors2.append(f"pageerror: {e}"))
    page2.on("console", lambda m: errors2.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)

    page2.goto(base_url.rstrip("/") + "/lessons/engine.html", wait_until="networkidle")
    page2.locator("#toggle3dBtn").click()
    page2.locator("#webglNotice").wait_for(state="visible", timeout=5000)
    assert "WebGL unavailable" in page2.text_content("#webglNotice")
    assert page2.locator("#fallback2dSection").is_visible()
    page2.locator("#nextStrokeBtn").click()
    assert page2.text_content("#p2dName").strip() == "Compression"

    # Also test standalone Inkworks sheet with WebGL disabled -> zero uncaught errors
    page2.goto(base_url.rstrip("/") + "/inkworks/index.html?m=engine&layout=sheet", wait_until="networkidle")
    page2.locator(".webgl-fallback").wait_for(state="visible", timeout=5000)
    assert not errors2, f"WebGL-disabled journey had errors: {errors2}"
    results.append("PASS WebGL-disabled fallback journey (Engine lesson + standalone Inkworks sheet)")
    ctx_nowebgl.close()

    # 3. Desktop + reduced motion check (1440x900)
    ctx_rm = browser.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    page3 = ctx_rm.new_page()
    errors3 = []
    page3.on("pageerror", lambda e: errors3.append(f"pageerror: {e}"))
    page3.on("console", lambda m: errors3.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)

    page3.goto(base_url, wait_until="networkidle")
    assert_no_overflow(page3, "desktop-map")
    if shots_dir:
        page3.screenshot(path=str(shots_dir / "desktop-map.png"), full_page=False)

    page3.goto(base_url.rstrip("/") + "/lessons/driveline.html", wait_until="networkidle")
    assert_no_overflow(page3, "desktop-driveline")
    assert page3.locator("#cvtPlayBtn").get_attribute("aria-pressed") == "false"
    assert page3.locator("#diffPlayBtn").get_attribute("aria-pressed") == "false"
    if shots_dir:
        page3.screenshot(path=str(shots_dir / "desktop-driveline.png"), full_page=False)

    assert not errors3, f"Desktop reduced-motion journey had errors: {errors3}"
    results.append("PASS desktop (1440x900) + prefers-reduced-motion check")
    ctx_rm.close()

    return results


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--url", default="http://127.0.0.1:9081/")
    ap.add_argument("--shots", default=None, help="optional directory to save verification screenshots")
    args = ap.parse_args()

    shots_dir = pathlib.Path(args.shots) if args.shots else None
    if shots_dir:
        shots_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.webkit.launch()
        try:
            results = run_journey(browser, args.url, shots_dir)
        finally:
            browser.close()

    for line in results:
        print(line)
    print("ALL E2E CHECKS PASSED")


if __name__ == "__main__":
    main()
