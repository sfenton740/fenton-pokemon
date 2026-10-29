import sys, json
from playwright.sync_api import sync_playwright
BASE='http://localhost:8765/'
OUT='/workspace/site/screenshots/'
errors=[]
def run(name, vp):
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
        ctx=b.new_context(viewport=vp, device_scale_factor=2, is_mobile=True, has_touch=True,
          user_agent='Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
        pg=ctx.new_page()
        pg.add_init_script("window.FG_NO_AUTO_PACKS=1;window._said=[];(()=>{const o=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{window._said.push(u.text);o(u);};})()")
        pg.on('console', lambda m: m.type=='error' and errors.append(name+': '+m.text))
        pg.on('pageerror', lambda e: errors.append(name+': '+str(e)))
        pg.goto(BASE+'#/games'); pg.wait_for_selector('.fg-pick.green'); pg.wait_for_timeout(600)
        pg.screenshot(path=OUT+f'tcg_menu_{name}.png')
        pg.click('.fg-pick.green'); pg.wait_for_selector('.tc .want')
        shots={2:'setup',8:'draw',11:'attack',14:'ko_prize',17:'my_turn2',18:'evolve',23:'flame_tail',30:'bench_energy'}
        steps=0
        while True:
            st=pg.evaluate('(()=>{const s=FentonTCG._state();return {step:s.step,busy:s.busy,over:s.over}})()')
            if st['over']: break
            if st['busy'] or pg.locator('.tc .want').count()==0: pg.wait_for_timeout(250); steps+=0.02
            else:
                if st['step'] in shots: pg.wait_for_timeout(700); pg.screenshot(path=OUT+f"tcg_{name}_{st['step']:02d}_{shots.pop(st['step'])}.png")
                pg.locator('.tc .want').first.click(); steps+=1; pg.wait_for_timeout(350)
            if steps>200: errors.append(name+': tutorial stuck at '+str(st)); break
        pg.wait_for_selector('#tcWin:not([hidden])', timeout=8000); pg.wait_for_timeout(1500)
        pg.screenshot(path=OUT+f'tcg_{name}_win.png'); print(name,'tutorial won, taps',steps)
        print(name,'SPOKEN:'); [print('   ',t) for t in pg.evaluate('window._said')]
        ov=pg.evaluate('document.documentElement.scrollWidth'); print(name,'scrollWidth',ov,'vp',vp['width'])
        # big kid game: pick a team, follow hints until win
        pg.click('#tcBig'); pg.wait_for_selector('.tc-team'); pg.screenshot(path=OUT+f'tcg_{name}_teams.png')
        pg.click('.tc-team.lightning'); pg.wait_for_selector('.tc.play')
        n=0; shot=False
        while n<400:
            st=pg.evaluate('(()=>{const s=FentonTCG._state();return {busy:s.busy,over:s.over,whose:s.whose,turn:s.turn}})()')
            if st['over']: break
            if st['busy'] or st['whose']!='me': pg.wait_for_timeout(300); continue
            pg.click('#tcHint'); pg.wait_for_timeout(150)
            if st['turn']>=3 and not shot: pg.screenshot(path=OUT+f'tcg_{name}_bigkid_hint.png'); shot=True
            w=pg.locator('.tc .want')
            if w.count()==0: errors.append(name+': no hint target '+str(pg.evaluate('FentonTCG._hint()'))); break
            w.first.click(); n+=1; pg.wait_for_timeout(200)
        pg.wait_for_selector('#tcWin:not([hidden])', timeout=10000); pg.wait_for_timeout(1500)
        print(name,'big kid won in turns', pg.evaluate('FentonTCG._state().turn'), 'taps', n)
        pg.screenshot(path=OUT+f'tcg_{name}_bigkid_win.png')
        print(name,'sounds',pg.evaluate('FentonGames.testSounds()'))
        b.close()
run('portrait',{'width':820,'height':1180})
run('landscape',{'width':1180,'height':820})
print('errors:',errors)
