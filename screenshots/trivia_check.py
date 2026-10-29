import sys, json
from playwright.sync_api import sync_playwright
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8765/'
OUT='/workspace/site/screenshots/'
errors=[]
def run(name, vp):
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
    ctx=b.new_context(viewport=vp, device_scale_factor=2, is_mobile=True, has_touch=True,
      user_agent='Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
    pg=ctx.new_page()
    pg.add_init_script("window.FG_NO_AUTO_PACKS=1;window._said=[];(()=>{const o=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{window._said.push([u.text,u.rate,u.pitch,u.volume]);o(u);};})()")
    pg.on('console', lambda m: m.type=='error' and errors.append(name+': '+m.text))
    pg.on('pageerror', lambda e: errors.append(name+': '+str(e)))
    pg.goto(BASE+'#/games'); pg.wait_for_selector('.fg-pick.purple'); pg.wait_for_timeout(800)
    pg.screenshot(path=OUT+f'trivia_menu_{name}.png')
    pg.click('.fg-pick.purple'); pg.wait_for_selector('.tv-player'); pg.wait_for_timeout(600)
    pg.screenshot(path=OUT+f'trivia_pick_{name}.png')
    shots={}
    def st(): return pg.evaluate("(()=>{const T=FentonTrivia._state();const x=T.qs[T.i];return {i:T.i,n:T.qs.length,who:x.who,tf:'a' in x.q,a:x.q.a,lab:x.q.o?(x.q.ro||x.q.o.every(c=>/^[ect]:/.test(c))):null,stars:T.stars,q:x.q.q}})()")
    def shown(k): return int(pg.inner_text(f'#tvS_{k} b'))
    def play(mode, pattern):
      exp={'little':0,'big':0}; log=[]
      for i,right in enumerate(pattern):
        s=st(); assert s['i']==i
        kind='tf' if s['tf'] else ('lab' if s['lab'] else 'pics')
        if (mode,kind,'q') not in shots: pg.wait_for_timeout(500); pg.screenshot(path=OUT+f'trivia_{name}_{mode}_{kind}_q.png'); shots[(mode,kind,'q')]=1
        if s['tf']: v=('1' if s['a'] else '0') if right else ('0' if s['a'] else '1')
        else: v='0' if right else pg.evaluate("[...document.querySelectorAll('.tv-opt')].map(o=>o.dataset.v).find(v=>v!=='0')")
        pg.click(f'.tv-opt[data-v="{v}"]'); pg.wait_for_timeout(250)
        w=s['who']
        exp[w]=exp[w]+1 if right else max(0,exp[w]-1)
        got=shown(w); minus=pg.locator('.fg-minus').count()
        assert got==exp[w], (mode,i,got,exp)
        hl=pg.locator('.tv-opt.right').count()==1
        if not right: assert hl and pg.locator('.tv-opt.wrong').count()==1
        if (mode,kind,right) not in shots and i>0: pg.wait_for_timeout(900); pg.screenshot(path=OUT+f'trivia_{name}_{mode}_{kind}_{"right" if right else "wrong"}.png'); shots[(mode,kind,right)]=1
        log.append(f"{w[0]}{'+' if right else '-'}{got}{'(−1 shown)' if minus and not right else ''}")
        pg.click('#tvNext'); pg.wait_for_timeout(300)
      pg.wait_for_selector('#tvWin:not([hidden])'); pg.wait_for_timeout(1300)
      pg.screenshot(path=OUT+f'trivia_{name}_{mode}_win.png')
      win=pg.inner_text('#tvWin').replace('\n',' | ')
      print(name, mode, ' '.join(log)); print('   END:', win[:160]); return exp
    # Little: start wrong at 0 (floor), then mix
    pg.click('[data-mode="little"]'); pg.wait_for_selector('.tv-opt')
    e=play('little',[False,True,True,False,True,True,True,False,True,True])
    print('   best stored', pg.evaluate("localStorage.getItem('fg.trivBest.little')"), 'expected', e['little'])
    pg.click('#tvWho'); pg.wait_for_selector('.tv-player'); pg.wait_for_timeout(300)
    pg.screenshot(path=OUT+f'trivia_pick_after_{name}.png')
    pg.click('[data-mode="big"]'); pg.wait_for_selector('.tv-opt')
    e=play('big',[True,True,True,True,True,True,True,True,False,True])
    print('   best stored', pg.evaluate("localStorage.getItem('fg.trivBest.big')"))
    pg.click('#tvWho'); pg.wait_for_selector('.tv-player'); pg.click('[data-mode="turns"]'); pg.wait_for_selector('.tv-opt')
    e=play('turns',[True,False,True,True,False,True,True,True,True,False])
    print('   turns best', pg.evaluate("[localStorage.getItem('fg.trivBest.turns.little'),localStorage.getItem('fg.trivBest.turns.big')]"))
    said=pg.evaluate('window._said')
    print(name,'SPOKEN (first 14):'); [print('    ',t[0]) for t in said[:14]]
    print('   voice params', set((t[1],t[2],t[3]) for t in said))
    print('   scrollWidth', pg.evaluate('document.documentElement.scrollWidth'), 'vp', vp['width'])
    if name=='portrait': print('   sounds', json.dumps(pg.evaluate('FentonGames.testSounds()')))
    ctx.close(); b.close()
run('portrait',{'width':820,'height':1180})
run('landscape',{'width':1180,'height':820})
print('errors',errors)
