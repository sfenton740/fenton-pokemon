"""Card-popup regression check: open a card while scrolled down on several phone sizes."""
import sys, os
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/'
OUT = os.path.dirname(os.path.abspath(__file__))
SIZES = [('pixel9xl', 412, 915, 2.625), ('pixel9xl_toolbar', 412, 700, 2.625), ('iphone', 390, 844, 3)]
errs = []; ok = True
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for name, w, h, dpr in SIZES:
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr, is_mobile=True, has_touch=True)
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        for route, sel in [('#/set/0/all', '.cell[data-card]'), ('#/wish', '.row[data-card]'), ('#/top', '.row[data-card]')]:
            pg.goto(BASE + route); pg.wait_for_selector(sel); pg.wait_for_timeout(400)
            pg.evaluate('window.scrollTo(0, document.body.scrollHeight * 0.6)'); pg.wait_for_timeout(300)
            y0 = pg.evaluate('window.scrollY')
            els = pg.query_selector_all(sel)
            if not els: continue
            el = [e for e in els if e.is_visible() and 0 < e.bounding_box()['y'] < h - 50]
            (el[0] if el else els[-1]).tap(); pg.wait_for_selector('.sheet .pic'); pg.wait_for_timeout(500)
            y0 = pg.evaluate("-parseFloat(document.body.style.top || '0')")   # page position when the popup opened
            r = pg.evaluate("""() => { const c=document.querySelector('.mclose').getBoundingClientRect(), s=document.querySelector('.sheet').getBoundingClientRect(),
               i=document.querySelector('.sheet .pic').getBoundingClientRect(); return {close:[c.top,c.right,c.bottom], sheetTop:s.top, picTop:i.top, modalScroll:document.getElementById('modal').scrollTop,
               bodyFixed:getComputedStyle(document.body).position, vw:innerWidth, sw:document.documentElement.scrollWidth}; }""")
            good = r['close'][0] >= 0 and r['close'][2] <= h and r['close'][1] <= w and r['sheetTop'] >= 0 and r['picTop'] >= 0 and r['modalScroll'] == 0 and r['bodyFixed'] == 'fixed'
            # scroll inside the popup: close button must stay visible
            pg.evaluate("document.getElementById('modal').scrollTo(0, 400)"); pg.wait_for_timeout(200)
            c2 = pg.evaluate("document.querySelector('.mclose').getBoundingClientRect().top")
            good = good and 0 <= c2 < 100
            if route == '#/set/0/all':
                pg.evaluate("document.getElementById('modal').scrollTo(0, 0)"); pg.wait_for_timeout(200)
                pg.screenshot(path=f'{OUT}/03_card_detail_{name}.png')
            pg.click('.mclose'); pg.wait_for_timeout(400)
            y1 = pg.evaluate('window.scrollY'); hidden = pg.evaluate("document.getElementById('modal').hidden")
            good = good and hidden and abs(y1 - y0) < 2
            ok &= good
            print(f"{name:18} {route:12} scrolled {y0:5.0f}px  close top {r['close'][0]:.0f} (after inner scroll {c2:.0f})  card-top {r['picTop']:.0f}  restoreY {y1:.0f}  {'OK' if good else 'FAIL'}")
        ctx.close()
    b.close()
print('errors:', errs); print('ALL OK' if ok and not errs else 'PROBLEMS')
