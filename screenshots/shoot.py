"""Phone-width screenshots of the site (iPhone 14-ish, 390x844 @3x). Usage: python3 screenshots/shoot.py [base_url]"""
import sys, os
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/'
OUT = os.path.dirname(os.path.abspath(__file__))
errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True,
        user_agent='Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36')
    pg = ctx.new_page()
    pg.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    pg.on('pageerror', lambda e: errors.append(str(e)))
    def shot(hash_, name, full=False, wait='.tile, .cell, .row, .box'):
        pg.goto(BASE + hash_); pg.wait_for_selector(wait, timeout=15000)
        pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(800)
        pg.screenshot(path=f'{OUT}/{name}.png', full_page=full); print('saved', name)
    shot('#/', '01_home', full=True)
    shot('#/binder/0/6', '02_binder1_page6')
    pg.click('.cell[data-card]'); pg.wait_for_selector('.sheet img.pic'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(800)
    pg.screenshot(path=f'{OUT}/03_card_detail.png'); print('saved 03_card_detail')
    pg.keyboard.press('Escape')
    shot('#/value', '04_value', full=True)
    shot('#/set/1/all', '05_classic_checklist')
    shot('#/wish', '06_wishlist')
    shot('#/movers/up', '07_movers')
    shot('#/grading', '08_grading')
    shot('#/opened', '09_opened')
    pg.goto(BASE + '#/search/pika'); pg.wait_for_selector('.cell'); pg.wait_for_timeout(1200); pg.screenshot(path=f'{OUT}/10_search.png'); print('saved 10_search')
    shot('#/binder/1/1', '11_extras_binder')
    shot('#/binder/2/1', '12_unsorted')
    shot('#/top', '13_top')
    # image load check
    pg.goto(BASE + '#/binder/0/1'); pg.wait_for_selector('.cell img'); pg.wait_for_load_state('networkidle'); pg.wait_for_timeout(1500)
    print('images loaded:', pg.evaluate("[...document.querySelectorAll('.cell img')].filter(i=>i.complete&&i.naturalWidth>0).length"), 'of', pg.evaluate("document.querySelectorAll('.cell img').length"))
    print('horizontal overflow:', pg.evaluate('document.documentElement.scrollWidth'), 'px (viewport 390)')
    print('sw:', pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>!!r)"))
    b.close()
print('errors:', errors)
