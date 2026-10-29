# Headless check of Pokémon Math (#/games/math):
#  1) every question generator at every level: the maths is right, answers are whole numbers >= 0, choices are unique and contain
#     the answer once, pictures match the numbers (counts, groups, crossed-out ones), patterns / sequences follow their rule,
#     Little Trainer never goes negative or above 20;
#  2) play-through of each mode with real taps (choices + keypad): stars +1 / -1 never below 0, level up after 3 right in a row,
#     ease off after 2 misses, levels saved per mode, buddy evolves at streak 3 and 6, Champion unlock, best score, Trainer hooks;
#  3) layout at iPad 820x1180 and 1180x820: no overlapping text or buttons, nothing off-screen, text >= 18px, button text >= 22px;
#  4) screenshots of every level in both orientations.
import sys, json, re, random
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/'
OUT = '/workspace/site/screenshots/'
N_PER = int(sys.argv[2]) if len(sys.argv) > 2 else 300
errors, fails, shots = [], [], []
def fail(m):
  fails.append(m)
  if len(fails) < 60: print('FAIL', m)

GEN_JS = r"""(n) => {
  const M = window.FentonMath, out = [];
  const cnt = (html) => { const d = document.createElement('div'); d.innerHTML = html;
    return {groups: [...d.querySelectorAll('.mt-items')].map(g => ({n: g.querySelectorAll('.mt-it').length, x: g.querySelectorAll('.mt-it.x').length, data: +g.dataset.n})),
      teams: d.querySelectorAll('.mt-team').length, prizes: d.querySelectorAll('.mt-prize').length, taken: d.querySelectorAll('.mt-prize.taken').length,
      to: [...d.querySelectorAll('.mt-to')].map(t => ({n: +t.dataset.n, rods: t.querySelectorAll('.mt-rod').length, cubes: t.querySelectorAll('.mt-cube').length})),
      pat: [...d.querySelectorAll('.mt-pat .mt-pi')].length, berries: d.querySelectorAll('.mt-berries i').length, pals: d.querySelectorAll('.mt-pals .mt-it').length,
      ex: d.querySelectorAll('.mt-exc:not(.reg)').length, reg: d.querySelectorAll('.mt-exc.reg').length, shape: (d.querySelector('.mt-sh') || {}).className || ''}; };
  for (const mode of Object.keys(M.LEVELS)) M.LEVELS[mode].forEach((L, lvl) => L.skills.forEach(([fn, ...args], si) => {
    for (let i = 0; i < n; i++) { const q = M.G[fn](...args);
      out.push({mode, lvl, si, fn, args, kind: q.kind, ans: q.ans, expr: q.expr, check: q.check, text: q.text, say: q.say, right: q.right, wrong: q.wrong,
        opts: q.opts.map(o => ({v: o.v, label: o.label, count: o.count, c: cnt(o.html)})), vis: cnt(q.vis)}); }
  }));
  return out;
}"""

def ev(expr):
  assert re.fullmatch(r'[0-9+\-*/ ]+', expr), expr
  v = eval(expr)
  return v

def check_q(q):
  tag = f"{q['mode']} L{q['lvl']+1} {q['fn']}{q['args']}: {q['text']} -> {q['ans']}"
  ans, kind, ch, opts = q['ans'], q['kind'], q['check'], q['opts']
  vals = [o['v'] for o in opts]
  if len(set(map(str, vals))) != len(vals): fail('duplicate choices ' + tag + ' ' + str(vals))
  if sum(1 for v in vals if str(v) == str(ans)) != 1: fail('answer not exactly once in choices ' + tag + ' ' + str(vals))
  if kind == 'num':
    if not (isinstance(ans, int) and ans >= 0): fail('bad answer ' + tag)
    v = ev(q['expr'])
    if v != ans or (isinstance(v, float) and not v.is_integer()): fail(f'expr {q["expr"]}={v} != {ans} ' + tag)
    for o in vals:
      if not (isinstance(o, int) and o >= 0): fail('bad choice ' + str(o) + ' ' + tag)
  if q['mode'] == 'little':
    for o in vals:
      if isinstance(o, int) and not (0 <= o <= 20): fail('little choice out of 0..20 ' + tag + str(vals))
    if isinstance(ans, int) and not 0 <= ans <= 20: fail('little answer out of range ' + tag)
  fn, vis = q['fn'], q['vis']
  g = vis['groups']
  if fn == 'count':
    if len(g) != 1 or g[0]['n'] != ans or g[0]['x'] != 0: fail('count pictures != answer ' + tag + str(g))
    if ans > q['args'][0] or ans < 1: fail('count range ' + tag)
  if fn == 'numFind' and not 1 <= ans <= q['args'][0]: fail('numFind range ' + tag)
  if fn == 'matchGroup':
    for o in opts:
      if o['c']['groups'][0]['n'] != o['v']: fail('group picture count != value ' + tag)
  if fn == 'moreFewer':
    a, b, more = ch['a'], ch['b'], ch['more']
    want = 'L' if ((a > b) if more else (a < b)) else 'R'
    if a == b or ans != want: fail('more/fewer wrong ' + tag + str(ch))
    if [o['c']['groups'][0]['n'] for o in opts] != [a, b]: fail('more/fewer pictures ' + tag)
  if fn == 'pattern':
    u, s = ch['unit'], ch['shown']
    if any(s[i] != u[i % len(u)] for i in range(len(s))) or ans != u[len(s) % len(u)]: fail('pattern rule ' + tag + str(ch))
    if vis['pat'] != len(s) + 1: fail('pattern pictures ' + tag)
  if fn == 'addPics':
    a, b = ch['a'], ch['b']
    if a < 1 or b < 1 or a + b > ch['max'] or [x['n'] for x in g] != [a, b]: fail('addPics ' + tag + str(ch) + str(g))
  if fn == 'subPics':
    a, b = ch['a'], ch['b']
    if not (1 <= b < a <= ch['max']) or g[0]['n'] != a or g[0]['x'] != b: fail('subPics ' + tag + str(ch) + str(g))
  if fn == 'sides':
    want = {'triangle': 3, 'square': 4, 'rectangle': 4, 'pentagon': 5, 'hexagon': 6}[ch['shape']]
    if ans != want or ch['shape'] not in vis['shape']: fail('sides ' + tag)
  if fn == 'shapes' and ans not in vals: fail('shapes ' + tag)
  if fn in ('add', 'sub'):
    a, b, mx = ch['a'], ch['b'], ch['max']
    r = a + b if fn == 'add' else a - b
    if r != ans or r < 0 or (fn == 'add' and r > mx) or (fn == 'sub' and a > mx): fail(f'{fn} range ' + tag)
    if mx > 20:
      carry = (a % 10 + b % 10 > 9) if fn == 'add' else (a % 10 < b % 10)
      if carry != ch['regroup']: fail(f'{fn} regroup flag {ch["regroup"]} but carry {carry} ' + tag)
      for t in vis['to']:
        if t['rods'] * 10 + t['cubes'] != t['n']: fail('tens/ones blocks ' + tag)
  if fn == 'missing':
    f = ch['form']
    ok = (ch['a'] + ans == ch['c']) if f in ('a+?', '?+b') else (ch['a'] - ans == ch['c'])
    if not ok or ans < 1: fail('missing number ' + tag + str(ch))
  if fn == 'skip':
    st, seq, at = ch['step'], ch['seq'], ch['at']
    if any(seq[i + 1] - seq[i] != st for i in range(4)) or seq[0] % st or ans != seq[at]: fail('skip ' + tag + str(ch))
  if fn == 'compare':
    a, b = ch['nums']
    if a == b or ans != (max(a, b) if ch['big'] else min(a, b)): fail('compare ' + tag)
  if fn == 'hpWord' and not (ch['dmg'] < ch['hp'] and ch['hp'] % 10 == 0 and ch['dmg'] % 10 == 0): fail('hp ' + tag)
  if fn == 'groups':
    if vis['teams'] != ch['g'] or any(x['n'] != ch['n'] for x in g): fail('groups pictures ' + tag)
  if fn == 'weak' and ans != ch['dmg'] * 2: fail('weak ' + tag)
  if fn == 'resist' and (ans != ch['dmg'] - 30 or ans < 10): fail('resist ' + tag)
  if fn == 'prizes':
    if 'have' in ch:
      if vis['prizes'] != ch['have'] or vis['taken'] != ch['take'] or ans != ch['have'] - ch['take']: fail('prizes left ' + tag)
    elif vis['ex'] != ch['ex'] or vis['reg'] != ch['reg'] or ans != 2 * ch['ex'] + ch['reg']: fail('prizes take ' + tag)
  if fn == 'mult' and ans != ch['a'] * ch['b']: fail('mult ' + tag)
  if fn == 'missingFactor' and ans * ch['b'] != ch['p']: fail('missing factor ' + tag)
  if fn == 'share':
    if ans * ch['n'] != ch['tot'] or vis['pals'] != ch['n'] or (ch['tot'] <= 30 and vis['berries'] != ch['tot']): fail('share ' + tag)
  if fn == 'dblHalf' and ans != (ch['n'] * 2 if ch['dbl'] else ch['n'] // 2): fail('double/half ' + tag)
  if fn == 'numPattern':
    s = ch['seq']; d = [s[i + 1] - s[i] for i in range(4)]
    ok = (len(set(d)) == 1) if ch['f'] != 'dbl' else all(s[i + 1] == 2 * s[i] for i in range(4))
    if not ok or ans != s[4] or min(s) < 0: fail('number pattern ' + tag + str(s))
  if fn == 'multiHP':
    left = ch['hp'] - (ch['dmg'] * 2 if 'dmg' in ch else ch['a'] + ch['b'])
    if left != ans or left <= 0: fail('multiHP ' + tag + str(ch))
  # every number in the sum shows up in the spoken question (word problems and equations say what they show)
  if fn in ('addPics', 'subPics', 'add', 'sub', 'hpWord', 'groups', 'resist', 'mult', 'share') or (fn == 'multiHP' and 'a' in ch):
    for num in re.findall(r'\d+', q['expr']):
      if fn == 'resist' and num == '30': continue
      if not re.search(r'\b' + num + r'\b', q['say']): fail(f'{num} not spoken in "{q["say"]}" ' + tag)
  if str(ans) not in (q['right'] + q['wrong']) and kind == 'num' and fn not in ('numFind',): fail('feedback does not say the answer ' + tag)

LAYOUT_JS = r"""() => {
  const root = document.getElementById('fg'), bad = [], vw = innerWidth;
  const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
  const els = [...root.querySelectorAll('*')].filter(vis);
  const texty = els.filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
  for (const e of texty) { const fs = parseFloat(getComputedStyle(e).fontSize), btn = e.closest('button,.btn');
    if (fs < (btn ? 22 : 18)) bad.push(`small text ${fs}px in ${btn ? 'button' : 'body'}: .${e.className} "${e.textContent.trim().slice(0, 30)}"`); }
  for (const e of els) { const r = e.getBoundingClientRect(); if (r.right > vw + 1 || r.left < -1) bad.push(`off-screen x: .${e.className} ${Math.round(r.left)}..${Math.round(r.right)}`); }
  const ov = (a, b) => { const r = a.getBoundingClientRect(), s = b.getBoundingClientRect();
    return Math.max(0, Math.min(r.right, s.right) - Math.max(r.left, s.left)) * Math.max(0, Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top)); };
  const pairs = (list, what) => { for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j]; if (a.contains(b) || b.contains(a)) continue;
    if (ov(a, b) > 6) bad.push(`${what} overlap: .${a.className} "${a.textContent.trim().slice(0, 20)}" / .${b.className} "${b.textContent.trim().slice(0, 20)}"`); } };
  pairs(texty, 'text');
  pairs(els.filter(e => e.matches('button,a.fg-icon,.mt-q,.mt-ans,.mt-nextrow,.fg-starbox,.mt-lv,.mt-buddy,.tv-dots')), 'box');
  return {bad, h: document.documentElement.scrollHeight, vh: innerHeight};
}"""

VP = {'portrait': {'width': 820, 'height': 1180}, 'landscape': {'width': 1180, 'height': 820}}
def ctx_for(p, vp, trainer=False):
  b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
  ctx = b.new_context(viewport=vp, device_scale_factor=2, is_mobile=True, has_touch=True,
    user_agent='Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
  ctx.add_init_script("window.FG_NO_AUTO_PACKS=1;window._said=[];(()=>{try{const o=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{window._said.push(u.text);o(u);};}catch(e){}})()")
  pg = ctx.new_page()
  pg.on('console', lambda m: m.type == 'error' and errors.append(m.text))
  pg.on('pageerror', lambda e: errors.append(str(e)))
  return b, pg

def open_math(pg, ls=None):
  pg.goto(BASE + '#/games/math'); pg.evaluate("localStorage.clear(); sessionStorage.clear()")
  if ls: pg.evaluate("o => Object.entries(o).forEach(([k, v]) => localStorage.setItem(k, v))", ls)
  pg.reload(); pg.wait_for_selector('.mt-player'); pg.wait_for_timeout(300)

def st(pg): return pg.evaluate("(() => { const s = FentonMath._state(); return s && {i: s.i, lvl: s.lvl, stars: s.stars, streak: s.streak, stage: s.stage, ans: s.q && String(s.q.ans), kind: s.q && s.q.kind, answered: s.answered, unlockedNow: s.unlockedNow, mode: s.mode}; })()")

def tap_answer(pg, right):
  s = st(pg)
  if pg.locator('#mtPad').count():
    val = s['ans'] if right else str(int(s['ans']) + 1)
    for ch in val: pg.tap(f'.mt-key[data-k="{ch}"]'); pg.wait_for_timeout(40)
    pg.tap('.mt-key[data-k="ok"]')
  else:
    sel = f'.mt-opt[data-v="{s["ans"]}"]' if right else f'.mt-opt:not([data-v="{s["ans"]}"])'
    pg.locator(sel).first.tap()
  pg.wait_for_timeout(120)

def nxt(pg):
  pg.evaluate("document.getElementById('mtEvo') && document.getElementById('mtEvo').remove()")
  pg.tap('#mtNext'); pg.wait_for_timeout(150)

with sync_playwright() as p:
  # 1) generators
  b, pg = ctx_for(p, VP['portrait']); open_math(pg)
  qs = pg.evaluate(GEN_JS, N_PER)
  for q in qs: check_q(q)
  per = {}
  for q in qs: per.setdefault(f"{q['mode']} L{q['lvl']+1}", set()).add(q['fn'])
  print(f'generators: {len(qs)} questions checked;', {k: sorted(v) for k, v in per.items()})
  # spoken words for tricky bits
  e = pg.evaluate("FentonMath._ear('3 Poké Balls + 2 Poké Balls, 6 × 7, Pikachu has 60 HP')")
  if 'Pokay' not in e or 'times' not in e: fail('ear: ' + e)
  # talk level read from the shared setting
  for v, want in (('quiet', 'quiet'), ('chatty', 'chatty'), (None, 'normal')):
    pg.evaluate("v => { v == null ? localStorage.removeItem('fg.talk') : localStorage.setItem('fg.talk', v); }", v); pg.reload(); pg.wait_for_selector('.mt-player')
    got = pg.evaluate('FentonMath.talk()')
    if got != want: fail(f'talk level {v} -> {got}')
  b.close()

  # 2) play-through with taps
  b, pg = ctx_for(p, VP['portrait'])
  has_trainer = None
  for mode in ('little', 'big', 'champ'):
    open_math(pg)
    has_trainer = pg.evaluate('!!window.Trainer')
    xp0 = pg.evaluate("window.Trainer ? Trainer.get('%s').xp : null" % ('little' if mode == 'little' else 'big'))
    pg.tap(f'[data-mode="{mode}"]'); pg.wait_for_selector('.mt-q'); pg.wait_for_timeout(200)
    s = st(pg); assert s['lvl'] == 0 and s['stars'] == 0, s
    # wrong first: stars stay at 0 (never below 0)
    tap_answer(pg, False); s = st(pg)
    if s['stars'] != 0: fail(f'{mode}: stars below/above 0 after first miss: {s}')
    if pg.locator('.mt-opt.right, .mt-hole.fix, .mt-padshow.fix').count() == 0: fail(f'{mode}: right answer not shown after a miss')
    nxt(pg)
    for k in range(3): tap_answer(pg, True); s = st(pg); (k < 2) and nxt(pg)
    if s['lvl'] != 1 or s['stars'] != 3 or s['stage'] != 1: fail(f'{mode}: after 3 right expected lvl 2, 3 stars, Charmeleon: {s}')
    if pg.evaluate(f"localStorage.getItem('fg.mathLvl.{mode}')") != '1': fail(f'{mode}: level not saved')
    if 'Charmeleon' not in (pg.get_attribute('#mtBuddy', 'aria-label') or ''): fail(f'{mode}: buddy did not evolve')
    if mode == 'little': pg.wait_for_timeout(250); pg.screenshot(path=OUT + 'math_evolve_portrait.png'); shots.append('math_evolve_portrait.png')
    nxt(pg)
    tap_answer(pg, False); nxt(pg); tap_answer(pg, False); s = st(pg)
    if s['lvl'] != 0 or s['stars'] != 1: fail(f'{mode}: after 2 misses expected lvl 1 and 1 star: {s}')
    if mode == 'little': shots.append('math_miss_portrait.png'); pg.screenshot(path=OUT + 'math_miss_portrait.png')
    while st(pg)['i'] < 9: nxt(pg); tap_answer(pg, True)
    s = st(pg); pg.tap('#mtNext'); pg.wait_for_selector('#mtWin:not([hidden])'); pg.wait_for_timeout(400)
    best = pg.evaluate(f"localStorage.getItem('fg.mathBest.{mode}')")
    if best != str(s['stars']): fail(f'{mode}: best {best} != stars {s["stars"]}')
    if mode == 'big': pg.screenshot(path=OUT + 'math_finish_portrait.png'); shots.append('math_finish_portrait.png')
    if has_trainer:
      who = 'little' if mode == 'little' else 'big'
      t = pg.evaluate(f"(() => {{ const p = Trainer.get('{who}'); return {{xp: p.xp, best: p.best.math}}; }})()")
      if not (t['xp'] > (xp0 or 0)) or t['best'] != s['stars']: fail(f'{mode}: Trainer not updated {t} (xp before {xp0})')
  # keypad: typed digits show in the ? box
  open_math(pg, {'fg.mathPad.big': '1'}); pg.tap('[data-mode="big"]'); pg.wait_for_selector('.mt-q')
  for _ in range(10):
    if pg.locator('#mtPad').count(): break
    pg.evaluate("FentonMath._begin('big')"); pg.wait_for_timeout(100)
  if pg.locator('#mtPad').count():
    pg.tap('.mt-key[data-k="4"]'); pg.tap('.mt-key[data-k="2"]'); pg.wait_for_timeout(100)
    if pg.inner_text('#mtShow') != '42': fail('keypad display ' + pg.inner_text('#mtShow'))
    pg.tap('.mt-key[data-k="del"]'); pg.wait_for_timeout(80)
    if pg.inner_text('#mtShow') != '4': fail('keypad delete')
  else: fail('keypad never shown')
  # Champion unlock from the top Big Trainer level
  open_math(pg, {'fg.mathLvl.big': '3'}); pg.tap('[data-mode="big"]'); pg.wait_for_selector('.mt-q')
  for k in range(3): tap_answer(pg, True); (k < 2) and nxt(pg)
  if pg.evaluate("localStorage.getItem('fg.mathChamp')") != '1': fail('champion not unlocked after 3 right at the top Big level')
  # speech: one line per question, nothing repeated by itself; quiet = Big Trainer questions not auto-spoken
  open_math(pg); pg.evaluate('window._said = []'); pg.tap('[data-mode="little"]'); pg.wait_for_selector('.mt-q'); pg.wait_for_timeout(2500)
  said = pg.evaluate('window._said')
  if len(said) > 1: fail('more than one auto line at question start: ' + str(said))
  open_math(pg, {'fg.talk': 'quiet'}); pg.evaluate('window._said = []'); pg.tap('[data-mode="big"]'); pg.wait_for_selector('.mt-q'); pg.wait_for_timeout(1500)
  if pg.evaluate('window._said'): fail('quiet Big Trainer spoke: ' + str(pg.evaluate('window._said')))
  pg.tap('#mtHear'); pg.wait_for_timeout(1500)
  if len(pg.evaluate('window._said')) != 1: fail('🔊 replay did not speak once')
  b.close()

  # 3+4) layout + screenshots for every level, both orientations
  layout_n = 0
  for orient, vp in VP.items():
    b, pg = ctx_for(p, vp)
    open_math(pg, {'fg.mathChamp': '1'})
    pg.screenshot(path=OUT + f'math_pick_{orient}.png'); shots.append(f'math_pick_{orient}.png')
    r = pg.evaluate(LAYOUT_JS)
    for x in r['bad']: fail(f'{orient} picker: {x}')
    for mode in ('little', 'big', 'champ'):
      for lvl in range(len(pg.evaluate(f"FentonMath.LEVELS.{mode}"))):
        for pad in ((False, True) if mode != 'little' else (False,)):
          pg.evaluate(f"localStorage.setItem('fg.mathLvl.{mode}', '{lvl}'); localStorage.setItem('fg.mathPad.{mode}', '{1 if pad else 0}')")
          for rep in range(8 if not pad else 3):
            pg.evaluate(f"FentonMath._begin('{mode}')"); pg.wait_for_timeout(120)
            if pad and not pg.locator('#mtPad').count(): continue
            r = pg.evaluate(LAYOUT_JS); layout_n += 1
            sk = pg.evaluate('FentonMath._state().q.skill')
            for x in r['bad']: fail(f'{orient} {mode} L{lvl+1} {sk}{" pad" if pad else ""}: {x}')
            if rep == 0:
              name = f'math_{mode}_L{lvl+1}{"_pad" if pad else ""}_{orient}.png'
              pg.screenshot(path=OUT + name); shots.append(name)
              if not pad:                                   # answered state too (right answer + Next)
                tap_answer(pg, True); pg.evaluate("document.getElementById('mtEvo') && document.getElementById('mtEvo').remove()"); pg.wait_for_timeout(950)
                r = pg.evaluate(LAYOUT_JS)
                for x in r['bad']: fail(f'{orient} {mode} L{lvl+1} answered: {x}')
                if lvl == 0: name = f'math_{mode}_answered_{orient}.png'; pg.screenshot(path=OUT + name); shots.append(name)
    b.close()
  print('layout checks:', layout_n)

print('screenshots:', len(shots)); print('\n'.join(OUT + s for s in shots))
print('trainer.js present:', has_trainer)
print('page errors:', errors[:10])
print('FAILS:', len(fails))
sys.exit(1 if fails or errors else 0)
