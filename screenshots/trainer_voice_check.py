"""Checks talk levels (once-per-session instructions, chime, replay), testSounds/testMusic, and Trainer XP/levels/badges/migration/export."""
from playwright.sync_api import sync_playwright
B='http://localhost:8765/'
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome'); ctx=b.new_context(viewport={'width':820,'height':1180})
  pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
  pg.add_init_script("""window._said=[];window._sfx=[];(()=>{const o=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{window._said.push(u.text);o(u);};})();
    try{if(location.protocol.startsWith('http')&&!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded',1);localStorage.clear();localStorage.setItem('fg.trivBest.little','5');localStorage.setItem('fg.trivBest.big','8');localStorage.setItem('fg.trivBest.master','9');localStorage.setItem('fg.trivMaster','1');}}catch(e){}""")
  pg.goto(B+'#/games'); pg.wait_for_timeout(1200)
  K="FentonGames.kit"
  print('talk default:', pg.evaluate(f"{K}.talk()"))
  pg.evaluate(f"{K}.SFX.tap=(o=>(...a)=>{{window._sfx.push('tap');return o(...a)}})({K}.SFX.tap)")
  pg.evaluate(f"{K}.say('Pick two cards!','must')"); pg.wait_for_timeout(2500)
  n1=len(pg.evaluate('window._said'))
  pg.evaluate(f"{K}.say('Pick two cards!','must')"); pg.wait_for_timeout(1500)
  n2=len(pg.evaluate('window._said'))
  print('must once per session:', n1, '->', n2); assert n1==1 and n2==1
  pg.evaluate(f"{K}.line('Pick two cards!'); {K}.replay()"); pg.wait_for_timeout(2000)
  print('replay speaks again:', pg.evaluate('window._said')[-1]); assert len(pg.evaluate('window._said'))==2
  pg.evaluate(f"{K}.setTalk('quiet')"); pg.evaluate(f"{K}.say('Great job!','praise')"); pg.wait_for_timeout(800)
  print('quiet praise silent:', len(pg.evaluate('window._said'))==2); assert len(pg.evaluate('window._said'))==2
  pg.evaluate(f"{K}.setTalk('normal')"); pg.evaluate(f"{K}.say('Wow extra','extra')"); pg.wait_for_timeout(800)
  assert len(pg.evaluate('window._said'))==2; print('normal skips extra: ok')
  pg.evaluate(f"{K}.setTalk('chatty')"); pg.evaluate(f"{K}.say('Wow extra','extra')"); pg.wait_for_timeout(1500)
  assert pg.evaluate('window._said')[-1]=='Wow extra'; print('chatty speaks extra: ok')
  pg.evaluate(f"{K}.setTalk('normal')")
  print('talk saved:', pg.evaluate("localStorage.getItem('fg.talk')"))
  fresh=[pg.evaluate(f"{K}.pickFresh(['A','B','C'])") for _ in range(30)]+[pg.evaluate(f"{K}.cheer()") for _ in range(30)]
  assert all(a!=b for a,b in zip(fresh,fresh[1:])); print('praise never repeats back-to-back: ok')
  print('testSounds:', {k:(v.get('clicks'),v.get('peak')) for k,v in pg.evaluate("FentonGames.testSounds()").items()})
  tm=pg.evaluate("FentonGames.testMusic()"); print('testMusic:', tm); assert all(v['clicks']=='none' for v in tm.values())
  # Trainer
  T="Trainer"
  print('migrated best:', pg.evaluate(f"[{T}.get('little').best.trivia,{T}.get('big').best.trivia,{T}.get('big').best.triviaMaster]"))
  print('need L2,L10,L100:', pg.evaluate(f"[{T}._need(2),{T}._need(10),{T}._need(100)]"))
  pg.evaluate(f"{T}.addXP('little',40,'who')"); lv=pg.evaluate(f"{T}.level('little')"); print('little after 40xp(+daily 10):', lv)
  print('daily toast:', (pg.wait_for_selector('.tr-toast',timeout=4000) and True)); pg.wait_for_selector('.tr-cele',timeout=9000); print('celebration shown:', pg.locator('.tr-cele').count()>0, pg.evaluate("(document.querySelector('.tr-cele')||{}).innerText"))
  pg.evaluate("document.querySelectorAll('.tr-cele,.tr-toast').forEach(e=>e.remove())")
  for i in range(10): pg.evaluate(f"{T}.answer('little',true)")
  print('streak badge after 10 right:', pg.evaluate(f"!!{T}.get('little').badges.streak"))
  pg.evaluate(f"{T}.recordScore('big','memoryEasy',14)"); pg.evaluate(f"{T}.recordScore('big','memoryEasy',18)")
  print('memory best keeps lower moves:', pg.evaluate(f"{T}.get('big').best.memoryEasy")); assert pg.evaluate(f"{T}.get('big').best.memoryEasy")==14
  pg.evaluate(f"{T}.addXP('champ',5,'math')"); print('unknown id falls back ok')
  pg.goto(B+'#/trainer/little'); pg.wait_for_timeout(1000)
  pg.click('#trCode'); pg.wait_for_timeout(300)
  code=pg.evaluate("document.getElementById('trCodeBox').value")
  print('save code prefix:', code[:12], len(code))
  pg.evaluate("localStorage.removeItem('fg.trainers')"); pg.evaluate(f"{T}._reload()")
  print('after wipe little xp:', pg.evaluate(f"{T}.get('little').xp"))
  pg.on('dialog', lambda d: d.accept())
  pg.fill('#trPaste', code); pg.click('text=Load code'); pg.wait_for_timeout(800)
  print('after import little xp:', pg.evaluate(f"Trainer.get('little').xp"), 'badges', list(pg.evaluate("Trainer.get('little').badges").keys()))
  # Harper / Carter: new installs get the kids' names; an old save (v1, placeholder names) is renamed and keeps its XP, badges, scores
  print('new install names:', pg.evaluate("[Trainer.get('little').name, Trainer.get('big').name]"))
  assert pg.evaluate("[Trainer.get('little').name, Trainer.get('big').name]") == ['Harper', 'Carter']
  old = {'v': 1, 'current': 'big', 'profiles': {
    'little': {'id': 'little', 'name': 'Little Trainer', 'partner': 'pikachu', 'xp': 123, 'badges': {'first': '2026-10-28'}, 'best': {'trivia': 7}, 'wins': {}, 'plays': {}, 'days': [], 'lastDay': '', 'streak': 0, 'run': 0, 'bestRun': 0},
    'big': {'id': 'big', 'name': 'Big Trainer', 'partner': 'charmander', 'xp': 456, 'badges': {'tricky': '2026-10-28'}, 'best': {'memoryHard': 20}, 'wins': {'tcg': 2}, 'plays': {}, 'days': [], 'lastDay': '', 'streak': 0, 'run': 0, 'bestRun': 0}}}
  import json as _j
  pg.evaluate("s => { localStorage.setItem('fg.trainers', s); Trainer._reload(); }", _j.dumps(old))
  got = pg.evaluate("['little','big'].map(k => { const p = Trainer.get(k); return [p.name, p.xp, Object.keys(p.badges).join(), JSON.stringify(p.best)]; })")
  print('migrated old save:', got, 'v', pg.evaluate("JSON.parse(localStorage.getItem('fg.trainers')).v"))
  assert got[0][:2] == ['Harper', 123] and got[1][:2] == ['Carter', 456] and got[0][2] == 'first' and got[1][2] == 'tricky'
  old['profiles']['little']['name'] = 'Harpy'; old['v'] = 1
  pg.evaluate("s => { localStorage.setItem('fg.trainers', s); Trainer._reload(); }", _j.dumps(old))
  print('a typed-in name is kept:', pg.evaluate("Trainer.get('little').name")); assert pg.evaluate("Trainer.get('little').name") == 'Harpy'
  # per-kid game modes: Harper starts on the easy ones, Carter on the harder ones
  pg.evaluate("localStorage.removeItem('fg.trainers'); Trainer._reload(); Trainer.setCurrent('little')")
  pg.goto('about:blank'); pg.goto(B + '#/games/memory'); pg.wait_for_timeout(900); h = pg.locator('.fg-card').count()
  pg.evaluate("Trainer.setCurrent('big')"); pg.goto(B + '#/games/who'); pg.goto(B + '#/games/memory'); pg.wait_for_timeout(700); c = pg.locator('.fg-card').count()
  print('memory cards Harper / Carter:', h, c); assert h == 6 and c == 12
  pg.goto(B + '#/games/trivia'); pg.wait_for_timeout(700)
  print('trivia picker:', pg.evaluate("[...document.querySelectorAll('.tv-player')].map(b => b.innerText.replace(/\\s+/g, ' ').trim())"))
  pg.goto(B + '#/games/math'); pg.wait_for_timeout(900)
  print('math picker:', pg.evaluate("[...document.querySelectorAll('.mt-player')].map(b => b.innerText.replace(/\\s+/g, ' ').trim())"))
  print('math says:', [t for t in pg.evaluate('window._said') if 'Math' in t][-1:])
  print('errors', errs); assert not errs
  b.close()
