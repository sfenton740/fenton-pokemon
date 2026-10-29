# Headless check of Trivia's secret Master Trainer mode: unlock gesture, reveal, scoring, saved best, both iPad orientations.
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
    pg.add_init_script("window.FG_NO_AUTO_PACKS=1;window._said=[];(()=>{const o=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{window._said.push(u.text);o(u);};})()")
    pg.on('console', lambda m: m.type=='error' and errors.append(name+': '+m.text))
    pg.on('pageerror', lambda e: errors.append(name+': '+str(e)))
    def open_pick():
      pg.goto(BASE+'#/games/trivia'); pg.reload(); pg.wait_for_selector('.tv-player'); pg.wait_for_timeout(500)
    def taps(n, gap):
      for _ in range(n): pg.tap('#tvTitle'); pg.wait_for_timeout(gap)
    unl=lambda: pg.evaluate("localStorage.getItem('fg.trivMaster')")
    open_pick()
    assert pg.locator('[data-mode="master"]').count()==0 and 'master' not in pg.inner_text('.tv-pick').lower()
    # normal tapping around: buttons and the rest of the screen don't count
    for _ in range(8): pg.tap('.tv-hello'); pg.wait_for_timeout(60)
    assert unl() is None
    taps(6,120); pg.wait_for_timeout(300)
    r6=(unl(), pg.locator('#tvSecret').count())
    pg.wait_for_timeout(3200)
    taps(7,550)                        # slow taps (~3.9 s): never 7 inside 3 s
    rslow=(unl(), pg.locator('#tvSecret').count())
    open_pick(); taps(7,110)           # 7 quick taps
    pg.wait_for_selector('#tvSecret'); pg.wait_for_timeout(1500)
    pg.screenshot(path=OUT+f'trivia_master_reveal_{name}.png')
    said=pg.evaluate('window._said')
    print(name,'6 taps ->',r6,'| slow 7 taps ->',rslow,'| fast 7 taps ->',unl(), '| said:', said[-1])
    assert r6==(None,0) and rslow==(None,0) and unl()=='1'
    pg.click('#tvSecretLater'); pg.wait_for_timeout(300)
    assert pg.locator('#tvSecret').count()==0 and pg.locator('[data-mode="master"]').count()==1
    open_pick()                         # remembered after reload
    assert pg.locator('[data-mode="master"]').count()==1
    pg.wait_for_timeout(500); pg.screenshot(path=OUT+f'trivia_master_picker_{name}.png')
    print('   picker says:', (pg.evaluate('window._said') or ['(intro already heard this session -> chime only)'])[-1])
    taps(7,100); pg.wait_for_timeout(300); assert pg.locator('#tvSecret').count()==0   # no second reveal
    pg.click('[data-mode="master"]'); pg.wait_for_selector('.tv.master .tv-opt')
    st=lambda: pg.evaluate("(()=>{const T=FentonTrivia._state();const x=T.qs[T.i];return {i:T.i,n:T.qs.length,who:x.who,tf:'a' in x.q,a:x.q.a,l:x.q.l,q:x.q.q,p:!!x.q.p}})()")
    pattern=[False,True,False,False,True,True,True,False,True,True]
    exp=0; shots=set(); log=[]
    for i,right in enumerate(pattern):
      s=st(); assert s['i']==i and s['l']=='m' and s['who']=='master', s
      kind='tf' if s['tf'] else 'mc'
      if kind not in shots:
        pg.wait_for_timeout(500); pg.screenshot(path=OUT+f'trivia_master_question_{kind}_{name}.png'); shots.add(kind)
      # everything visible on screen without scrolling
      nb=pg.evaluate("Math.max(...[...document.querySelectorAll('.tv-opt')].map(o=>o.getBoundingClientRect().bottom))")
      assert nb<=vp['height']+1, ('options off screen', nb, s['q'])
      if s['tf']: v=('1' if s['a'] else '0') if right else ('0' if s['a'] else '1')
      else: v='0' if right else pg.evaluate("[...document.querySelectorAll('.tv-opt')].map(o=>o.dataset.v).find(v=>v!=='0')")
      pg.click(f'.tv-opt[data-v="{v}"]'); pg.wait_for_timeout(250)
      exp=exp+1 if right else max(0,exp-1)
      got=int(pg.inner_text('#tvS_master b')); assert got==exp,(i,got,exp)
      if not right and 'wrong' not in shots and i>0:
        pg.wait_for_timeout(900); pg.screenshot(path=OUT+f'trivia_master_wrong_{name}.png'); shots.add('wrong')
      nx=pg.locator('#tvNext').bounding_box(); assert nx['y']+nx['height']<=vp['height']+1,('next off screen',nx)
      log.append(f"{'+' if right else '-'}{got}")
      pg.click('#tvNext'); pg.wait_for_timeout(300)
    pg.wait_for_selector('#tvWin:not([hidden])'); pg.wait_for_timeout(1300)
    pg.screenshot(path=OUT+f'trivia_master_win_{name}.png')
    said=pg.evaluate('window._said')
    print('  ', ' '.join(log), '| END:', pg.inner_text('#tvWin').replace('\n',' | ')[:120])
    best=pg.evaluate("localStorage.getItem('fg.trivBest.master')"); print('   best stored', best, 'expected', exp); assert best==str(exp)
    print('   wrong-answer lines:', [t for t in said if t.startswith('Not quite')][:2])
    print('   last line:', said[-1])
    assert not any('Tap' in t or 'tap the' in t.lower() for t in said if 'Master' not in t and t in said[-25:]), 'kid how-to line in master'
    print('   scrollWidth', pg.evaluate('document.documentElement.scrollWidth'), 'vp', vp['width'])
    if name=='portrait':
      print('   counts', pg.evaluate('FentonTrivia._count()'))
      snd=pg.evaluate('FentonGames.testSounds()'); print('   sounds', json.dumps(snd)[:400])
    b.close()
run('portrait',{'width':820,'height':1180}); run('landscape',{'width':1180,'height':820})
print('ERRORS', errors)
