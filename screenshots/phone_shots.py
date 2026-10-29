"""Phone screenshots (360x780, 390x844, 412x915) of the pages changed for phones."""
import asyncio
from playwright.async_api import async_playwright
B = 'http://localhost:8765/'; OUT = '/workspace/site/screenshots/'
SHOTS = [('home', '#/', ''), ('games_hub', '#/games', ''),
  ('tcg_play', '#/games/tcg', "document.querySelector('[data-mode=play]').click(); setTimeout(()=>document.querySelector('[data-team]').click(),200)"),
  ('tcg_pick', '#/games/tcg', "document.querySelector('[data-mode=play]').click()"),
  ('trivia_picker', '#/games/trivia', ''), ('math', '#/games/math', ''), ('music', '#/music', ''), ('leaderboard', '#/leaderboard', ''),
  ('binder', '#/binder/0/1', '')]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for (w, h) in [(412, 915), (390, 844), (360, 780)]:
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, has_touch=True, is_mobile=True)
            pg = await ctx.new_page(); await pg.add_init_script("try{localStorage.setItem('fg.mute','1')}catch(e){}")
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            for n, r, js in SHOTS:
                if w == 390 and n not in ('home', 'tcg_play'): continue
                await pg.goto('about:blank'); await pg.goto(B + r); await pg.wait_for_timeout(700)
                if js: await pg.evaluate(js)
                await pg.wait_for_timeout(3500 if 'tcg' in n else 900)
                f = f'{OUT}phone_{n}_{w}x{h}.png'; await pg.screenshot(path=f, full_page=True); print(f)
            print('errors', w, errs); await ctx.close()
        await b.close()
asyncio.run(main())
