# Trainer cards in Card Battle School: every card, the rules (1 Supporter / 1 Stadium / Tools), the zoom, and the friend (Easy + Tricky) using them.
import sys, json
from playwright.sync_api import sync_playwright
BASE='http://localhost:8765/'
OUT='/workspace/site/screenshots/'
errors=[]; fails=[]
def ok(cond, msg):
    print(('PASS ' if cond else 'FAIL ')+msg)
    if not cond: fails.append(msg)
SETUP = """(([team, op, hand, lvl]) => { localStorage.setItem('fg.tcLevel', JSON.stringify(lvl)); FentonTCG._force({op, hand}); FentonTCG._new('play', team);
  const S = FentonTCG._state(); S.level = lvl; S.tipped = {}; return S.me.hand.map(c => c.id); })"""
def setup(pg, team, op, hand, lvl='easy', draw=True):
    pg.evaluate(SETUP, [team, op, hand, lvl]); pg.wait_for_timeout(300)
    if draw:
        pg.evaluate("FentonTCG._state().me.deck.unshift({u: 9000+Math.floor(Math.random()*900), id:'E:'+FentonTCG._state().me.type})")
        click(pg, '[data-act="deck"]')
def click(pg, sel):
    pg.evaluate("s => { const e = document.querySelector(s); if (!e) throw new Error('no '+s); e.click(); }", sel); pg.wait_for_timeout(250)
def handU(pg, id): return pg.evaluate("id => (FentonTCG._state().me.hand.find(c => c.id === id) || {}).u", id)
def tapHand(pg, id): click(pg, f'[data-act="hand:{handU(pg, id)}"]')
def msg(pg): return pg.evaluate("(document.querySelector('.tc-coach, .tc-bubble, [class*=coach]')||{}).textContent || ''")
def S(pg, js): return pg.evaluate("(() => { const S = FentonTCG._state(); return " + js + "; })()")
def run(name, vp):
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
        ctx=b.new_context(viewport=vp, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg=ctx.new_page()
        pg.add_init_script("window.FG_NO_AUTO_PACKS=1;window._said=[];(()=>{const o=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{window._said.push(u.text);o(u);};})()")
        pg.on('console', lambda m: m.type=='error' and errors.append(name+': '+m.text))
        pg.on('pageerror', lambda e: errors.append(name+': '+str(e)))
        pg.goto(BASE+'#/games'); pg.wait_for_selector('.fg-pick.green'); pg.click('.fg-pick.green'); pg.wait_for_selector('.tc')
        # --- board with Trainer cards in hand
        setup(pg, 'fire', 'water', ['me55-9', 'T:potion', 'T:research', 'T:charm', 'T:nest', 'E:fire'])
        tapHand(pg, 'me55-9')
        ok(S(pg, "!!S.me.active"), name+' basic played')
        n = pg.locator('.tc-hc.trainer').count(); ok(n == 4, f'{name} 4 trainer cards shown in hand ({n})')
        kinds = pg.evaluate("[...document.querySelectorAll('.tc-hc.trainer')].map(e => getComputedStyle(e).backgroundColor)")
        print('   colors', kinds)
        pg.wait_for_timeout(600); pg.screenshot(path=OUT+f'tcg_trainers_hand_{name}.png')
        # Potion: no hurt Pokémon -> friendly no
        tapHand(pg, 'T:potion'); ok('Save Potion' in S(pg, 'S.msg') or S(pg,'S.sel') is None, name+' potion refused when nobody hurt')
        S(pg, "(S.me.active.dmg = 40, 0)"); pg.evaluate("FentonTCG._paint()")
        tapHand(pg, 'T:potion'); ok(S(pg, "S.sel") == handU(pg, 'T:potion'), name+' potion selected')
        said = S(pg, 'S.msg'); ok('Heal 30' in said, name+' voice reads Potion: '+said[:80])
        ok(S(pg, 'S.tipped.item') == 1, name+' Professor tip for Items given the first time')
        click(pg, f'[data-act="mon:{S(pg, "S.me.active.u")}"]'); pg.wait_for_timeout(300)
        ok(S(pg, "S.me.active.dmg") == 10 and S(pg, "S.me.used.some(c => c.id === 'T:potion')"), name+' potion healed 30')
        # Charm: +50 HP
        hp0 = S(pg, "FentonTCG._cards[S.me.active.id].hp")
        tapHand(pg, 'T:charm'); click(pg, f'[data-act="mon:{S(pg, "S.me.active.u")}"]')
        ok(S(pg, "S.me.active.tool") == 'T:charm' and pg.locator('.tc-tool').count() >= 1, name+' charm attached + badge shown')
        ok(str(hp0+50-10) in pg.inner_text('.tc'), name+f' HP shows {hp0+50-10}')
        # Nest Ball (Play button)
        b0 = S(pg, 'S.me.bench.length'); tapHand(pg, 'T:nest'); ok(pg.locator('[data-act="play"]').count()==1, name+' Play button appears')
        click(pg, '[data-act="play"]'); ok(S(pg, 'S.me.bench.length') == b0+1, name+' nest ball benched a Basic')
        # Research + supporter limit
        S(pg, "(S.me.hand.push({u: 8001, id: 'T:boss'}), 0)"); pg.evaluate("FentonTCG._paint()")
        tapHand(pg, 'T:research'); click(pg, '[data-act="play"]')
        ok(S(pg, 'S.me.hand.length') == 5 and S(pg, 'S.supp'), name+' research: new hand of 5')
        S(pg, "(S.me.hand.push({u: 8002, id: 'T:boss'}), 0)"); pg.evaluate("FentonTCG._paint()")
        tapHand(pg, 'T:boss'); said = S(pg, 'S.msg')
        ok('Only one Supporter' in said and S(pg, 'S.sel') != 8002, name+' second Supporter refused: '+said[:60])
        # --- zoom a Trainer card
        pg.evaluate("document.querySelector('.tc-hc.trainer .tc-zoom').click()"); pg.wait_for_selector('#tcZoom'); pg.wait_for_timeout(500)
        ok(pg.locator('.tc-trtxt').count()==1, name+' trainer zoom shows card text')
        pg.screenshot(path=OUT+f'tcg_trainer_zoom_{name}.png'); click(pg, '#tcZClose')
        # --- Switch, Boss, Ultra Ball, Rare Candy, Iono, Artazon
        wb = pg.evaluate("FentonTCG.TEAMS.water.cards.filter(id => !FentonTCG._cards[id].from && !FentonTCG._cards[id].ex).slice(0, 2)")
        setup(pg, 'water', 'fire', wb + ['T:switch', 'T:boss', 'E:water', 'E:water'])
        ids = S(pg, "S.me.hand.filter(c => FentonTCG._cards[c.id] && !FentonTCG._cards[c.id].from).map(c => c.id)")
        for i in ids: tapHand(pg, i)
        if S(pg, 'S.me.bench.length') == 0:
            S(pg, "(()=>{const b=S.me.deck.find(c=>FentonTCG._cards[c.id]&&!FentonTCG._cards[c.id].from); S.me.deck.splice(S.me.deck.indexOf(b),1); S.me.hand.push(b);})()"); pg.evaluate("FentonTCG._paint()")
            tapHand(pg, S(pg, "S.me.hand.find(c=>FentonTCG._cards[c.id]&&!FentonTCG._cards[c.id].from).id"))
        a0 = S(pg, 'S.me.active.u'); bu = S(pg, 'S.me.bench[0].u')
        tapHand(pg, 'T:switch'); click(pg, f'[data-act="mon:{bu}"]')
        ok(S(pg, 'S.me.active.u') == bu and S(pg, 'S.me.bench.some(m => m.u === %d)' % a0), name+' switch swapped for free')
        S(pg, "(S.op.bench.length ? 0 : S.op.bench.push({u:7200,id:FentonTCG.TEAMS.fire.cards.find(id => !FentonTCG._cards[id].from),en:[],dmg:0,under:[],turnIn:0,restUntil:0}), 0)"); pg.evaluate("FentonTCG._paint()")
        ob = S(pg, 'S.op.bench.length && S.op.bench[0].u')
        if ob:
            tapHand(pg, 'T:boss'); click(pg, f'[data-act="opmon:{ob}"]'); ok(S(pg, 'S.op.active.u') == ob, name+" boss's orders pulled the bench Pokémon")
        else: ok(False, name+' friend has no bench for boss test')
        # Rare Candy (fire: Charmander me55-9? find chain)
        chain = pg.evaluate("(()=>{const C=FentonTCG._cards; for (const [id,c] of Object.entries(C)) if (c.st===2) return [C[c.from].from, id]; })()")
        setup(pg, 'fire', 'water', [chain[0], chain[1], 'T:candy', 'E:fire'])
        tapHand(pg, chain[0]); tapHand(pg, 'T:candy'); said = S(pg, 'S.msg')
        ok(S(pg, 'S.sel') is None, name+' candy refused on the turn the Basic arrived: '+said[:70])
        S(pg, "(S.turn += 2, 0)"); tapHand(pg, 'T:candy'); click(pg, f'[data-act="mon:{S(pg, "S.me.active.u")}"]')
        ok(S(pg, 'S.me.active.id') == chain[1], name+' rare candy evolved straight to Stage 2')
        # Ultra Ball
        setup(pg, 'darkness', 'fire', [S(pg, "Object.keys(FentonTCG._cards).find(id => FentonTCG.TEAMS.darkness.cards.includes(id) && !FentonTCG._cards[id].from)"), 'T:ultra', 'E:darkness', 'E:darkness'])
        tapHand(pg, S(pg, "S.me.hand.find(c => FentonTCG._cards[c.id]).id"))
        h0 = S(pg, 'S.me.hand.length'); tapHand(pg, 'T:ultra'); click(pg, '[data-act="play"]')
        ok(S(pg, 'S.me.hand.length') == h0-3+1 and S(pg, 'S.me.hand.some(c => FentonTCG._cards[c.id])'), name+' ultra ball: discard 2, got a Pokémon')
        # Iono
        setup(pg, 'lightning', 'fire', [S(pg, "FentonTCG.TEAMS.lightning.cards.find(id => !FentonTCG._cards[id].from)"), 'T:iono', 'E:lightning'])
        tapHand(pg, S(pg, "S.me.hand.find(c => FentonTCG._cards[c.id]).id"))
        S(pg, "(S.me.prizes.splice(1), 0)"); tapHand(pg, 'T:iono'); click(pg, '[data-act="play"]')
        ok(S(pg, 'S.me.hand.length') == 1 and S(pg, 'S.op.hand.length') == 3, name+' iono: draw 1 per prize left (me 1, friend 3)')
        # Artazon stadium
        setup(pg, 'psychic', 'fire', [S(pg, "FentonTCG.TEAMS.psychic.cards.find(id => !FentonTCG._cards[id].from)"), 'T:artazon', 'E:psychic'])
        tapHand(pg, S(pg, "S.me.hand.find(c => FentonTCG._cards[c.id]).id"))
        tapHand(pg, 'T:artazon'); click(pg, '[data-act="play"]')
        ok(S(pg, "S.stadium && S.stadium.id") == 'T:artazon' and pg.locator('.tc-stad').count()==1, name+' artazon in play, chip shown')
        b0 = S(pg, 'S.me.bench.length'); click(pg, '[data-act="stadium"]'); ok(S(pg, 'S.me.bench.length') == b0+1, name+' artazon used')
        click(pg, '[data-act="stadium"]'); ok(S(pg, 'S.me.bench.length') == b0+1, name+' artazon once per turn')
        pg.wait_for_timeout(500); pg.screenshot(path=OUT+f'tcg_trainers_stadium_{name}.png')
        # --- friend AI uses trainers (Easy + Tricky)
        for lvl in ['easy', 'tricky']:
            setup(pg, 'fire', 'water', ['me55-9', 'E:fire'], lvl)
            tapHand(pg, 'me55-9')
            S(pg, "(S.op.hand.push({u:7001,id:'T:potion'},{u:7002,id:'T:boss'},{u:7003,id:'T:switch'},{u:7004,id:'T:research'}), S.op.active.dmg = 40, 0)")
            S(pg, "(S.me.bench.push((()=>{const x=Object.keys(FentonTCG._cards).find(id=>FentonTCG._cards[id].ex&&!FentonTCG._cards[id].from); return {u:7100,id:x,en:[],dmg:FentonTCG._cards[x].hp-10,under:[],turnIn:0,restUntil:0};})()), S.op.active.en = Array(4).fill(S.op.type), S.op.active.restUntil = 0, S.op.hand = S.op.hand.filter(c => c.u >= 7000), S.me.active.dmg = 0, S.me.active.tool = 'T:charm', 0)")
            click(pg, '[data-act="end"]')
            for _ in range(80):
                if S(pg, "S.whose") == 'me' or S(pg, 'S.over'): break
                pg.wait_for_timeout(250)
            used = S(pg, "S.op.used.map(c => c.id)"); said = ' | '.join(pg.evaluate("window._said.slice(-8)"))
            ok('T:potion' in used, f'{name} {lvl} friend used Potion ({used})')
            ok(('T:boss' in used) == (lvl == 'tricky'), f'{name} {lvl} friend Boss on a weak Bench ex only when tricky ({used})')
            print('   friend said:', said[:300])
        b.close()
for nm, vp in [('412x915', {'width':412,'height':915}), ('1180x820', {'width':1180,'height':820})]:
    run(nm, vp)
print('errors:', errors); print('FAILS:', len(fails), fails)
