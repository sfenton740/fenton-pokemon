import sys
from playwright.sync_api import sync_playwright
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8765/'
errors=[]
def st(pg): return int(pg.inner_text('#whoStars'))
def ans(pg): return pg.evaluate("document.querySelector('#whoArt').getAttribute('alt')")
def wrong(pg): return pg.locator('.fg-opt:not([disabled])').filter(has_not=pg.locator(f'[alt="{ans(pg)}"]')) 
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for name,vp in [('portrait',{'width':820,'height':1180}),('landscape',{'width':1180,'height':820})]:
        ctx=b.new_context(viewport=vp,device_scale_factor=2,is_mobile=True,has_touch=True); pg=ctx.new_page()
        pg.on('console', lambda m: m.type=='error' and errors.append(m.text)); pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.add_init_script("window._said=[];(()=>{const o=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{window._said.push(u.text);o(u);};})()")
        pg.goto(BASE+'#/games/who'); pg.wait_for_selector('.fg-opt'); pg.wait_for_timeout(500)
        for mode in ['0','1']:
            pg.click(f'[data-names="{mode}"]'); pg.wait_for_timeout(500)
            def opts():
                a=pg.evaluate("document.querySelector('#whoArt').getAttribute('alt')")
                return pg.evaluate("a=>[...document.querySelectorAll('.fg-opt')].map((o,i)=>({i,right:o.getAttribute('aria-label')===a,dis:o.disabled}))",a)
            def tap(right):
                o=[x for x in opts() if x['right']==right and not x['dis']][0]
                pg.locator('.fg-opt').nth(o['i']).click(); pg.wait_for_timeout(250)
            s0=st(pg)
            # floor test: drive to 0 first
            while st(pg)>0:
                if not any((not x['right']) and not x['dis'] for x in opts()):
                    tap(True); pg.click('#whoNext'); pg.wait_for_timeout(400); continue
                tap(False); pg.wait_for_timeout(1700)
            if not any((not x['right']) and not x['dis'] for x in opts()) or pg.locator('#whoNext:not([hidden])').count():
                if pg.locator('#whoNext:not([hidden])').count()==0: tap(True)
                pg.click('#whoNext'); pg.wait_for_timeout(400)
            tap(False); z=st(pg); wob=pg.evaluate("document.querySelector('.fg-starbox').className"); minus0=pg.locator('.fg-minus').count()
            redis=pg.evaluate("[...document.querySelectorAll('.fg-opt')].filter(o=>o.disabled).length")
            pg.wait_for_timeout(1700)
            tap(True); one=st(pg); pg.click('#whoNext'); pg.wait_for_timeout(500)
            tap(True); two=st(pg); pg.click('#whoNext'); pg.wait_for_timeout(500)
            tap(False); pg.wait_for_timeout(300); after=st(pg); minus=pg.locator('.fg-minus').count(); cls=pg.evaluate("document.querySelector('.fg-starbox').className")
            pg.screenshot(path=f'/workspace/site/screenshots/who_minus_{name}_{mode}.png')
            pg.wait_for_timeout(1800); gone=pg.locator('.fg-minus').count()
            tap(True); fin=st(pg)
            print(name,'names' if mode=='1' else 'pics',f'at0 wrong->{z} class={wob!r} minusShown={minus0} disabledAfterWrong={redis} | right->{one} right->{two} wrong->{after} minusShown={minus} class={cls!r} minusGoneAfter={gone==0} | right->{fin}')
            pg.click('#whoNext'); pg.wait_for_timeout(400)
        print(name,'said:',pg.evaluate('window._said')[-6:])
        if name=='portrait': print('aww',pg.evaluate('FentonGames.testSounds()')['aww'])
        ctx.close()
print('errors',errors)
