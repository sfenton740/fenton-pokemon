"""Automated text-size / overlap / clipping / overflow check for every page and game screen at three phone and three iPad sizes.
   Rules: body text >= 18px, the main text of every button >= 22px, no two pieces of text overlapping,
   no text clipped by its box or cut off the screen, no text or picture spilling out of the tile/card/button it sits in,
   no element wider than the screen, no sideways scrolling.
   Run one size or screen: python3 screenshots/text_check.py 412x915 home
   Run: python3 screenshots/text_check.py   (site served on http://localhost:8765)   -> exit 1 if anything is found."""
import asyncio, json, sys
from playwright.async_api import async_playwright

BASE = 'http://localhost:8765/'
PHONES = [(360, 780), (390, 844), (412, 915)]
PADS = [(820, 1180), (1180, 820), (1024, 1366)]
VIEWS = PHONES + PADS
MIN_TEXT, MIN_BTN = 18, 22

CHECK_JS = r"""
({minText, minBtn}) => {
  const out = [], W = innerWidth, H = innerHeight;
  // picture buttons (a card, a Pokémon on the board, a partner): the picture is the button, its labels only need the 18px text size
  const PICTURE_BTN = '.cell,.tc-hc,.tc-mon,.tc-deck,.tc-slot,.tc-team,.tr-pp,.tv-opt,.fg-card,.fg-opt,.fg-pick,.tc-prize';
  const vis = el => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
      if (e.hidden || e.closest('[hidden]')) return false; } return true; };
  const skip = el => el.closest('.tc-fxl,.tc-exin,.tc-fly,.ticker-strip,.ticker-wrap,svg,.tc-card .tc-mini,[data-textcheck="skip"],.fg-minus,.confetti,.fg-confetti,script,style,noscript,option,textarea,input');
  const name = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; if (el.classList.length) s += '.' + [...el.classList].slice(0, 3).join('.'); return s; };
  const items = [];
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) {
    const t = n.textContent.trim(); if (!t) continue;
    const el = n.parentElement; if (!el || skip(el) || !vis(el)) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const rects = [...r.getClientRects()].filter(x => x.width > 1 && x.height > 1);
    if (!rects.length) continue;
    const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
    // the glyph box can be taller than the line (tight line-height): only count the line itself for overlaps
    const lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight);
    rects.forEach((x, i) => { if (x.height > lh + 1) { const c = (x.top + x.bottom) / 2; rects[i] = {left: x.left, right: x.right, top: c - lh / 2, bottom: c + lh / 2, width: x.width, height: lh}; } });
    // emoji-only text (icons) doesn't count as reading text
    const words = /[A-Za-z0-9$%]/.test(t);
    items.push({el, t, rects, fs, words});
  }
  // 1) size
  for (const it of items) {
    if (!it.words) continue;
    const btn = it.el.closest('button,.btn,[role=button],a.tile,a.fg-pick,a.h-tile');
    if (btn) continue;
    if (it.fs < minText - .2) out.push({k: 'small', el: name(it.el), t: it.t.slice(0, 40), fs: it.fs});
  }
  // buttons: the biggest text inside must be >= minBtn; every text inside >= minText
  for (const b of document.querySelectorAll('button,.btn,[role=button],a.tile,a.fg-pick,a.h-tile')) {
    if (skip(b) || !vis(b)) continue;
    const mine = items.filter(i => b.contains(i.el) && i.words);
    if (!mine.length) continue;
    const r = b.getBoundingClientRect(); if (r.width < 2) continue;
    const max = Math.max(...mine.map(i => i.fs));
    if (b.matches(PICTURE_BTN)) { for (const i of mine) if (i.fs < minText - .2) out.push({k: 'small', el: name(i.el), t: i.t.slice(0, 40), fs: i.fs}); continue; }
    if (max < minBtn - .2) out.push({k: 'btn', el: name(b), t: mine.map(i => i.t).join(' ').slice(0, 40), fs: max});
    for (const i of mine) if (i.fs < minText - .2) out.push({k: 'small', el: name(i.el), t: i.t.slice(0, 40), fs: i.fs});
  }
  // 2) overlaps between different text pieces (not inside fixed overlays layered on purpose)
  const layer = el => { const f = el.closest('.tc-pass,.fg-sheetwrap,.tr-cele,.tv-secret,#modal,.fg-win:not([hidden]),.tr-toast,header'); return f; };
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j]; if (a.el === b.el) continue;
    if (layer(a.el) !== layer(b.el)) continue;
    for (const ra of a.rects) for (const rb of b.rects) {
      const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (ox > 3 && oy > Math.min(ra.height, rb.height) * .3) { out.push({k: 'overlap', el: name(a.el) + ' × ' + name(b.el), t: a.t.slice(0, 25) + ' × ' + b.t.slice(0, 25)}); ra.done = 1; break; }
    }
  }
  // 3) clipping: text outside an ancestor that hides overflow, or off the screen sideways
  for (const it of items) {
    for (const r of it.rects) {
      if (r.left < -1 || r.right > W + 1) { out.push({k: 'offscreen', el: name(it.el), t: it.t.slice(0, 40)}); break; }
      let clipped = false;
      for (let e = it.el; e && e !== document.body; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (/(hidden|clip)/.test(cs.overflowX + cs.overflowY)) {
          const c = e.getBoundingClientRect();
          if (r.left < c.left - 1 || r.right > c.right + 1 || (/(hidden|clip)/.test(cs.overflowY) && (r.top < c.top - 2 || r.bottom > c.bottom + 2))) { clipped = name(e); break; }
        }
      }
      if (clipped) { out.push({k: 'clip', el: name(it.el) + ' in ' + clipped, t: it.t.slice(0, 40)}); break; }
    }
    if (it.el.scrollWidth > it.el.clientWidth + 2 && getComputedStyle(it.el).textOverflow === 'ellipsis') out.push({k: 'ellipsis', el: name(it.el), t: it.t.slice(0, 40)});
  }
  // 4) spill: text or a picture sticking out of the nearest box it sits in (a tile, card, button, panel with a border or background)
  const boxy = e => { const cs = getComputedStyle(e); if (cs.display.startsWith('inline') && cs.display !== 'inline-block' && cs.display !== 'inline-flex' && cs.display !== 'inline-grid') return false;
    return parseFloat(cs.borderLeftWidth) > 0 || parseFloat(cs.borderTopWidth) > 0 || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') || cs.backgroundImage !== 'none'; };
  const boxOf = el => { for (let e = el; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e); if (e !== el && boxy(e)) return e; if (cs.position === 'absolute' || cs.position === 'fixed') return null; } return null; };
  const spill = (el, rects, t) => { const bx = boxOf(el); if (!bx) return; const c = bx.getBoundingClientRect(); if (c.width < 2) return;
    for (const r of rects) if (r.left < c.left - 2 || r.right > c.right + 2) { out.push({k: 'spill', el: name(el) + ' out of ' + name(bx), t, px: Math.round(Math.max(c.left - r.left, r.right - c.right))}); return; } };
  for (const it of items) if (it.words && !it.el.closest('header')) spill(it.el, it.rects, it.t.slice(0, 40));
  for (const im of document.querySelectorAll('img')) { if (skip(im) || !vis(im)) continue; const r = im.getBoundingClientRect(); if (r.width < 4) continue; spill(im, [r], 'img ' + (im.alt || '').slice(0, 30)); }
  // 5) anything (not deliberately moving) wider than the screen
  for (const e of document.querySelectorAll('body *')) { if (skip(e) || e.closest('.ticker-strip,.ticker-wrap,.fg-confetti,.tr-rays')) continue; const r = e.getBoundingClientRect();
    if (r.width > 2 && (r.right > W + 2 || r.left < -2) && getComputedStyle(e).position !== 'fixed' && vis(e)) { let sc = false; for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); if (/(auto|scroll|hidden|clip)/.test(cs.overflowX)) { sc = true; break; } }
      if (!sc) { out.push({k: 'wide', el: name(e), t: Math.round(r.left) + '..' + Math.round(r.right) + ' of ' + W}); } } }
  if (document.documentElement.scrollWidth > W + 1) out.push({k: 'hscroll', el: 'page', t: document.documentElement.scrollWidth + ' > ' + W});
  return out;
};
"""

# (label, route, setup JS run after load, wait ms)
SCREENS = [
  ('home', '#/', '', 600), ('games hub', '#/games', '', 600), ('math', '#/games/math', '', 600),
  ('memory', '#/games/memory', '', 600), ('who', '#/games/who', '', 900),
  ('trivia picker', '#/games/trivia', '', 600),
  ('trivia question', '#/games/trivia', "document.querySelector('[data-mode=little]').click()", 900),
  ('trivia answered', '#/games/trivia', "document.querySelector('[data-mode=big]').click(); setTimeout(()=>document.querySelector('.tv-opt').click(),300)", 1400),
  ('trivia finish', '#/games/trivia', "document.querySelector('[data-mode=little]').click(); (async()=>{for(let i=0;i<10;i++){await new Promise(r=>setTimeout(r,120)); document.querySelector('.tv-opt').click(); await new Promise(r=>setTimeout(r,60)); document.getElementById('tvNext').click();}})()", 3200),
  ('tcg learn', '#/games/tcg', '', 900),
  ('tcg pick', '#/games/tcg', "document.querySelector('[data-mode=play]').click()", 700),
  ('tcg play', '#/games/tcg', "document.querySelector('[data-mode=play]').click(); setTimeout(()=>document.querySelector('[data-team]').click(),200)", 1500),
  ('tcg duo', '#/games/tcg', "document.querySelector('[data-mode=duo]').click(); setTimeout(()=>document.querySelector('[data-team]').click(),200); setTimeout(()=>document.querySelector('[data-team]:not(.taken)').click(),500)", 1500),
  ('cards', '#/cards', '', 600), ('value', '#/value', '', 800), ('music page', '#/music', '', 600),
  ('music sheet', '#/games', "FentonGames.kit.openMusic()", 600), ('talk sheet', '#/games', "FentonGames.kit.openTalk()", 600),
  ('trainer', '#/trainer/little', '', 600), ('leaderboard', '#/leaderboard', '', 600),
  ('binder', '#/binder/0/1', '', 900), ('sets', '#/sets', '', 600), ('set', '#/set/0/need', '', 900), ('wish', '#/wish', '', 900),
  ('top', '#/top', '', 900), ('movers', '#/movers', '', 900), ('grading', '#/grading', '', 900), ('opened', '#/opened', '', 900),
  ('search', '#/search/pika', '', 900),
]

async def main():
    args = sys.argv[1:]
    views = [tuple(map(int, a.split('x'))) for a in args if 'x' in a and a.replace('x', '').isdigit()] or VIEWS
    only = [a for a in args if not ('x' in a and a.replace('x', '').isdigit())]
    found = 0
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for (w, h) in views:
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, has_touch=True)
            pg = await ctx.new_page()
            await pg.add_init_script("try{localStorage.setItem('fg.mute','1')}catch(e){}")
            for label, route, js, wait in SCREENS:
                if only and not any(o in label for o in only): continue
                await pg.goto('about:blank'); await pg.goto(BASE + route); await pg.wait_for_timeout(500)
                if js: await pg.evaluate(js)
                await pg.wait_for_timeout(wait)
                res = await pg.evaluate(CHECK_JS, {'minText': MIN_TEXT, 'minBtn': MIN_BTN})
                seen = set()
                for r in res:
                    key = (r['k'], r['el'], r['t'])
                    if key in seen: continue
                    seen.add(key); found += 1
                    print(f"{w}x{h} {label:16} {r['k']:9} {r['el']}  '{r['t']}'" + (f" {r['fs']}px" if 'fs' in r else '') + (f" by {r['px']}px" if 'px' in r else ''))
            await ctx.close()
        await b.close()
    print('PROBLEMS:', found)
    sys.exit(1 if found else 0)

asyncio.run(main())
