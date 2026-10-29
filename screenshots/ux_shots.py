"""iPad screenshots for the home / games hub / text fixes / music / talk level / trainer leveling update."""
import asyncio
from playwright.async_api import async_playwright
B = 'http://localhost:8765/'
OUT = '/workspace/site/screenshots/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        async def page(w, h):
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, has_touch=True)
            pg = await ctx.new_page(); await pg.add_init_script("try{localStorage.setItem('fg.mute','1')}catch(e){}")
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg._errs = errs
            return pg
        pg = await page(820, 1180)
        async def go(route, wait=900):
            await pg.goto('about:blank'); await pg.goto(B + route); await pg.wait_for_timeout(wait)
        async def shot(name, full=False):
            await pg.screenshot(path=OUT + name, full_page=full); print(OUT + name)
        # seed some progress so the profile / board have something to show
        await go('#/')
        await pg.evaluate("""() => { const T = Trainer;
          T.addXP('little', 180, 'trivia'); T.recordScore('little', 'trivia', 8); T.recordScore('little', 'who', 6); T.recordWin('little', 'memory'); T.recordScore('little', 'memoryEasy', 9);
          T.addXP('big', 470, 'tcg'); T.recordWin('big', 'tcg', {tricky: true}); T.recordScore('big', 'trivia', 9); T.recordScore('big', 'memoryHard', 21); T.award('big', 'scholar');
          document.querySelectorAll('.tr-cele,.tr-toast').forEach(e => e.remove()); }""")
        await pg.wait_for_timeout(9000); await pg.evaluate("document.querySelectorAll('.tr-cele,.tr-toast').forEach(e=>e.remove())")
        await go('#/'); await shot('ux_home_820x1180.png')
        await go('#/games'); await shot('ux_games_hub_820x1180.png', True)
        await go('#/games/tcg', 1200); await shot('ux_tcg_learn_820x1180.png')
        await pg.evaluate("document.querySelector('[data-mode=play]').click()"); await pg.wait_for_timeout(500)
        await pg.evaluate("document.querySelector('[data-team]').click()"); await pg.wait_for_timeout(2600); await shot('ux_tcg_play_820x1180.png')
        await go('#/games'); await pg.evaluate("FentonGames.kit.openMusic()"); await pg.wait_for_timeout(600); await shot('ux_music_player_820x1180.png')
        await go('#/games'); await pg.evaluate("FentonGames.kit.openTalk()"); await pg.wait_for_timeout(600); await shot('ux_talk_level_820x1180.png')
        await go('#/music'); await shot('ux_music_page_820x1180.png', True)
        await go('#/trainer/big'); await shot('ux_trainer_profile_820x1180.png', True)
        await go('#/leaderboard'); await shot('ux_leaderboard_820x1180.png', True)
        # level-up with evolution (Charmander -> Charmeleon at 16), then a badge
        await go('#/games')
        await pg.evaluate("() => { const T = Trainer, p = T.get('big'); p.xp = T._need(16) - 5; T.addXP('big', 10, 'tcg'); }")
        await pg.wait_for_timeout(4200); await shot('ux_levelup_evolve_820x1180.png')
        await pg.evaluate("document.getElementById('trCele').click()"); await pg.wait_for_timeout(500)
        await pg.evaluate("Trainer.award('little', 'streak')"); await pg.wait_for_timeout(3200); await shot('ux_badge_820x1180.png')
        print('errors 820:', pg._errs)
        # landscape + big iPad
        for (w, h) in [(1180, 820), (1024, 1366)]:
            pg = await page(w, h)
            for r, n in [('#/', 'home'), ('#/games', 'games_hub'), ('#/games/tcg', 'tcg_learn')]:
                await pg.goto(B + r); await pg.wait_for_timeout(1200); await pg.screenshot(path=f'{OUT}ux_{n}_{w}x{h}.png'); print(f'{OUT}ux_{n}_{w}x{h}.png')
            await pg.evaluate("document.querySelector('[data-mode=play]').click()"); await pg.wait_for_timeout(500)
            await pg.evaluate("document.querySelector('[data-team]').click()"); await pg.wait_for_timeout(2600)
            await pg.screenshot(path=f'{OUT}ux_tcg_play_{w}x{h}.png'); print(f'{OUT}ux_tcg_play_{w}x{h}.png')
            print('errors', w, pg._errs)
        await b.close()
asyncio.run(main())
