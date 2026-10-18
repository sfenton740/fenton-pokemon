/* Fenton Family Pokémon Cards - static single-page app. Data comes from data.json (built by build_data.py). */
(() => {
'use strict';
let D = null;
const $app = document.getElementById('app'), $modal = document.getElementById('modal');
const $title = document.getElementById('title'), $back = document.getElementById('back');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = v => v == null ? '—' : '$' + Number(v).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const money0 = v => v == null ? '—' : '$' + Math.round(v).toLocaleString('en-US');
const pct = v => v == null ? '' : (v > 0 ? '+' : '') + Math.round(v * 100) + '%';
const TR = {up: '➕', down: '➖', same: '⏸️', new: '🆕'};
const TRW = {up: 'Going up', down: 'Going down', same: 'About the same', new: 'New card'};
const VERD = {gem: '💎 Worth it', maybe: '🤔 Maybe', no: '❌ Not worth it'};
const card = id => D.cards[id];
const fmtDate = s => { if (!s) return ''; const d = new Date(s + 'T12:00:00'); return d.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}); };
const IMG = (c, cls = '') => c && c.img
  ? `<img class="${cls}" loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${esc(c.img)}" alt="${esc(c.name)}" onerror="this.outerHTML='<div class=&quot;noimg ${cls}&quot;>🃏</div>'">`
  : `<div class="noimg ${cls}">🃏</div>`;

function cell(id, opt = {}) {
  if (!id) return `<div class="cell empty" aria-hidden="true"></div>`;
  const c = card(id); if (!c) return `<div class="cell empty"></div>`;
  const miss = opt.have === false || (opt.have == null && c.qty === 0);
  const badge = miss ? `<span class="badge need" title="We need this one">?</span>` : (opt.showQty && c.qty > 1 ? `<span class="badge">×${c.qty}</span>` : '');
  const tr = opt.trend && !miss && c.trend !== 'same' && c.trend !== 'new' ? `<span class="tr">${TR[c.trend]}</span>` : '';
  return `<button class="cell${miss ? ' miss' : ''}" data-card="${esc(id)}" aria-label="${esc(c.name)}">${badge}${tr}${IMG(c)}
    <div class="cap">${esc(c.name)}</div><div class="pr">${opt.price === false ? '' : money(c.price)}</div></button>`;
}
function row(id, right, extra = '', rank = '') {
  const c = card(id);
  return `<button class="row" data-card="${esc(id)}">${rank ? `<span class="rank">${rank}</span>` : ''}${IMG(c)}
    <div class="mid"><div class="nm">${esc(c.name)}</div><div class="sm">${esc(c.set)} · #${esc(c.num)}</div>${extra}</div>
    <div class="rt">${right}</div></button>`;
}
function setTitle(t, back = true) { $title.textContent = t; $back.hidden = !back; document.title = t + ' · Our Pokémon'; }

/* ---------- pages ---------- */
function home() {
  setTitle('Our Pokémon', false);
  const t = D.totals, main = D.sets.find(s => s.name === '30th Celebration'), cc = D.sets.find(s => s.name === 'Classic Collection');
  const binTiles = D.binders.map((b, i) => `<a class="tile ${i === 0 ? 'red' : i === 1 ? 'blue' : 'yellow'}" href="#/binder/${i}/1">
      <span class="em">${b.emoji}</span>${esc(b.name.replace(' (new pulls)', ''))}<span class="sub">${b.cards} cards</span></a>`).join('');
  $app.innerHTML = `
  <a class="hero" href="#/value" style="display:block">
    <div class="lbl">💰 Our cards are worth</div>
    <div class="big">${money(t.value)}</div>
    <div class="lbl">🃏 ${t.cards} cards · ⭐ ${t.different} different</div>
    <div class="pills"><span class="pill up">➕ ${t.up}</span><span class="pill down">➖ ${t.down}</span><span class="pill same">⏸️ ${t.same}</span></div>
  </a>
  <div class="tiles">
    ${binTiles}
    <a class="tile" href="#/sets"><span class="em">✅</span>Checklists<span class="sub">${main ? `${main.have}/${main.size}` : ''}${cc ? ` · ${cc.have}/${cc.size}` : ''}</span></a>
    <a class="tile yellow" href="#/wish"><span class="em">🛒</span>Wishlist<span class="sub">${t.wish_count} to find</span></a>
    <a class="tile" href="#/top"><span class="em">🏆</span>Top Cards<span class="sub">most valuable</span></a>
    <a class="tile" href="#/movers"><span class="em">📈</span>Up &amp; Down<span class="sub">last ${D.settings.window} days</span></a>
    <a class="tile blue" href="#/grading"><span class="em">💎</span>Grading<span class="sub">PSA 10 check</span></a>
    <a class="tile red" href="#/opened"><span class="em">📦</span>Opened<span class="sub">${t.packs} packs</span></a>
    <a class="tile yellow" href="#/search"><span class="em">🔍</span>Find a card<span class="sub">search by name</span></a>
  </div>
  <p class="foot">Prices: ${esc(D.prices_note)}, ${esc(fmtDate(D.prices_asof))}.<br>Tap any card to see it big!</p>`;
}

function chart(hist) {
  if (!hist || hist.length < 2) return '';
  const W = 340, H = 150, P = 8, vals = hist.map(h => h[1]), mn = Math.min(...vals), mx = Math.max(...vals), rg = (mx - mn) || 1;
  const x = i => P + i * (W - 2 * P) / (hist.length - 1), y = v => P + (H - 2 * P) * (1 - (v - mn) / rg);
  const pts = hist.map((h, i) => `${x(i).toFixed(1)},${y(h[1]).toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H + 22}" role="img" aria-label="Value over time">
    <polygon points="${P},${H - P} ${pts} ${W - P},${H - P}" fill="#ffcb05" opacity=".45"/>
    <polyline points="${pts}" fill="none" stroke="#e3350d" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(hist.length - 1)}" cy="${y(vals[vals.length - 1])}" r="7" fill="#e3350d" stroke="#1e1e1e" stroke-width="3"/>
    <text x="${P}" y="${H + 18}" font-size="14" font-weight="800">${fmtDate(hist[0][0])}</text>
    <text x="${W - P}" y="${H + 18}" font-size="14" font-weight="800" text-anchor="end">${fmtDate(hist[hist.length - 1][0])}</text>
    <text x="${P + 4}" y="${P + 14}" font-size="14" font-weight="800">${money0(mx)}</text>
    <text x="${P + 4}" y="${H - P - 4}" font-size="14" font-weight="800">${money0(mn)}</text></svg>`;
}

function value() {
  setTitle('💰 Our Value');
  const t = D.totals, ch = t.value - t.value_30d, p = t.value_30d ? ch / t.value_30d : 0;
  const sets = D.sets.map(s => `<div class="row" style="cursor:default"><div class="mid"><div class="nm">${esc(s.name)}</div>
    <div class="sm">${s.checklist ? `${s.have} of ${s.size}` : `${s.have} different`}</div></div><div class="rt">${money(s.value)}</div></div>`).join('');
  const bins = D.binders.map((b, i) => `<a class="row" href="#/binder/${i}/1"><span class="rank">${b.emoji}</span><div class="mid"><div class="nm">${esc(b.name)}</div>
    <div class="sm">${b.cards} cards</div></div><div class="rt">${money(b.value)}</div></a>`).join('');
  $app.innerHTML = `
  <div class="hero"><div class="lbl">💰 Worth today</div><div class="big">${money(t.value)}</div>
    <div class="lbl">🕙 ${t.base_date ? fmtDate(t.base_date) : '30 days ago'}: ${money(t.value_30d)}</div>
    <div class="lbl ${''}" style="margin-top:4px">${ch >= 0 ? '⬆️' : '⬇️'} ${ch >= 0 ? '+' : '−'}${money(Math.abs(ch))} (${pct(p)})</div>
    <div class="pills"><span class="pill up">➕ ${t.up} up</span><span class="pill down">➖ ${t.down} down</span><span class="pill same">⏸️ ${t.same} same</span></div></div>
  <h2>📈 Value over time</h2><div class="box">${chart(D.history)}</div>
  <div class="note">➕ up · ➖ down · ⏸️ about the same (within ${Math.round(D.settings.trend_pct * 100)}% or less than ${money(D.settings.trend_min)}) over ${D.settings.window} days.
   New sets usually drop after release, then settle. We're keeping our cards, so this is just for fun!</div>
  <h2>📒 Binders</h2><div class="list">${bins}</div>
  <h2>📚 Sets</h2><div class="list">${sets}</div>
  <div class="tiles"><div class="tile" style="cursor:default"><span class="em">🃏</span>${t.cards}<span class="sub">cards</span></div>
   <div class="tile" style="cursor:default"><span class="em">👯</span>${money(t.extras_value)}<span class="sub">extra copies</span></div></div>`;
}

function binder(bi, page) {
  const b = D.binders[bi]; if (!b) return home();
  setTitle(b.name.replace(' (new pulls)', ''));
  const n = b.pages.length; page = Math.min(Math.max(1, page || 1), Math.max(1, n));
  const slots = b.pages[page - 1] || Array(9).fill(null);
  const dots = b.pages.map((p, i) => {
    const full = p.every(s => !s || s.have) && p.some(Boolean);
    return `<a href="#/binder/${bi}/${i + 1}" class="${i + 1 === page ? 'on' : ''} ${full ? 'full' : ''}">${i + 1}</a>`;
  }).join('');
  const have = slots.filter(s => s && s.have).length, miss = slots.filter(s => s && !s.have).length;
  $app.innerHTML = `
  <div class="pager"><a class="btn white" ${page > 1 ? `href="#/binder/${bi}/${page - 1}"` : 'disabled'} aria-label="Previous page">◀</a>
    <div class="pg">${b.loose ? 'Group' : 'Page'} ${page}<div class="muted">of ${n}</div></div>
    <a class="btn white" ${page < n ? `href="#/binder/${bi}/${page + 1}"` : 'disabled'} aria-label="Next page">▶</a></div>
  <div class="binder" id="binderPage"><div class="grid">${slots.map(s => s ? cell(s.id, {have: s.have, trend: true}) : cell(null)).join('')}</div></div>
  <p class="muted" style="text-align:center;font-weight:800">✅ ${have} here${miss ? ` · ❔ ${miss} still needed` : ''}${b.loose ? ' · not in a binder yet' : ''}</p>
  <h2 style="text-align:center">📖 Pages</h2><div class="dots">${dots}</div>
  <p class="foot">Swipe left or right to turn pages. Grey cards = we still need them.</p>`;
  swipe(document.getElementById('binderPage'), dir => { const np = page + dir; if (np >= 1 && np <= n) location.hash = `#/binder/${bi}/${np}`; });
}
function swipe(el, fn) {
  let x0 = null, y0 = null;
  el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, {passive: true});
  el.addEventListener('touchend', e => {
    if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) fn(dx < 0 ? 1 : -1); x0 = null;
  });
}

function sets() {
  setTitle('✅ Checklists');
  const html = D.sets.map((s, i) => {
    const p = s.checklist ? s.have / s.size : 1;
    return `<a class="box setcard" href="#/set/${i}/all"><div class="top"><span>${esc(s.name)}</span><span>${s.checklist ? `${s.have}/${s.size}` : `${s.have} 🃏`}</span></div>
      ${s.checklist ? `<div class="bar"><div style="width:${Math.round(p * 100)}%"></div></div><div class="muted">${p >= 1 ? '🎉 Complete!' : `${s.size - s.have} to go · ${money(s.to_finish)} to finish`}</div>`
        : `<div class="muted">Singles we pulled</div>`}</a>`;
  }).join('');
  $app.innerHTML = `<h1>Pick a set</h1>${html}`;
}
function setPage(si, filt) {
  const s = D.sets[si]; if (!s) return sets();
  setTitle(s.name);
  filt = filt || 'all';
  const ids = s.cards.filter(id => filt === 'all' || (filt === 'have' ? card(id).qty > 0 : card(id).qty === 0));
  const p = s.checklist ? s.have / s.size : 1;
  $app.innerHTML = `
  <div class="box"><div class="setcard"><div class="top"><span>${esc(s.name)}</span><span>${s.checklist ? `${s.have}/${s.size}` : `${s.have} 🃏`}</span></div>
  ${s.checklist ? `<div class="bar"><div style="width:${Math.round(p * 100)}%"></div></div>` : ''}<div class="muted">Worth ${money(s.value)}</div></div></div>
  <div class="seg"><button data-f="all" class="${filt === 'all' ? 'on' : ''}">All</button><button data-f="have" class="${filt === 'have' ? 'on' : ''}">✅ Have</button><button data-f="need" class="${filt === 'need' ? 'on' : ''}">❔ Need</button></div>
  ${ids.length ? `<div class="grid">${ids.map(id => cell(id, {showQty: true, trend: true})).join('')}</div>` : `<div class="empty-msg">${filt === 'need' ? '🎉 We have them all!' : 'Nothing here yet'}</div>`}`;
  $app.querySelectorAll('.seg button').forEach(b => b.onclick = () => { location.hash = `#/set/${si}/${b.dataset.f}`; });
}

function wish() {
  setTitle('🛒 Wishlist');
  const t = D.totals, bySet = {};
  D.wishlist.forEach(id => (bySet[card(id).set] = bySet[card(id).set] || []).push(id));
  $app.innerHTML = `<div class="hero"><div class="lbl">🛒 Cards we still need</div><div class="big">${t.wish_count}</div><div class="lbl">All of them: about ${money(t.wish_cost)}</div></div>
  ${Object.entries(bySet).map(([set, ids]) => `<h2>${esc(set)} (${ids.length})</h2><div class="list">${ids.map(id => row(id, money(card(id).price),
     `<div class="sm">${TR[card(id).trend]} ${esc(TRW[card(id).trend])}</div>`)).join('')}</div>`).join('')}
  <p class="foot">Cheapest first. Tap a card for the TCGplayer button.</p>`;
}

function topCards() {
  setTitle('🏆 Top Cards');
  const ids = Object.values(D.cards).filter(c => c.qty > 0 && c.price != null).sort((a, b) => b.price - a.price).slice(0, 30).map(c => c.id);
  const medal = i => ['🥇', '🥈', '🥉'][i] || (i + 1);
  $app.innerHTML = `<h1>Our most valuable cards</h1>
  <div class="grid" style="margin-bottom:16px">${ids.slice(0, 3).map(id => cell(id, {showQty: true})).join('')}</div>
  <div class="list">${ids.map((id, i) => row(id, money(card(id).price) + `<div class="sm">${TR[card(id).trend]}</div>`, card(id).qty > 1 ? `<div class="sm">We have ${card(id).qty}</div>` : '', medal(i))).join('')}</div>`;
}

function movers(tab) {
  setTitle('📈 Up & Down');
  tab = tab || 'up';
  const own = Object.values(D.cards).filter(c => c.qty > 0 && c.pct != null);
  const list = tab === 'up' ? own.filter(c => c.trend === 'up').sort((a, b) => b.pct - a.pct)
    : own.filter(c => c.trend === 'down').sort((a, b) => a.chg - b.chg);
  $app.innerHTML = `
  <div class="seg"><button data-t="up" class="${tab === 'up' ? 'on' : ''}">➕ Going up</button><button data-t="down" class="${tab === 'down' ? 'on' : ''}">➖ Going down</button></div>
  <p class="muted" style="font-weight:800;margin:0 4px 12px">Our cards, last ${D.settings.window} days (since ${fmtDate(D.totals.base_date)}).</p>
  ${list.length ? `<div class="list">${list.slice(0, 40).map(id => row(id.id, `<span class="${tab}">${pct(id.pct)}</span>`,
    `<div class="sm">${money(id.base)} → <b>${money(id.price)}</b></div>`)).join('')}</div>` : '<div class="empty-msg">Nothing yet</div>'}`;
  $app.querySelectorAll('.seg button').forEach(b => b.onclick = () => { location.hash = `#/movers/${b.dataset.t}`; });
}

function grading() {
  setTitle('💎 Grading');
  const S = D.settings;
  const own = Object.values(D.cards).filter(c => c.qty > 0 && c.gain != null).sort((a, b) => b.gain - a.gain);
  const others = Object.values(D.cards).filter(c => c.qty === 0 && c.gain != null).length;
  $app.innerHTML = `<h1>Is it worth grading?</h1>
  <div class="note">If a card came back a perfect <b>PSA 10</b>, how much more would it be worth?<br>
   Gain = PSA 10 price − card price − PSA fee (from $${S.psa_tiers[0][1]}) − ~${money(S.ship)} shipping.<br>
   💎 = gain ${money0(S.gem_gain)}+, PSA 10 is ${S.gem_mult}× the card, ${S.gem_sales}+ real sales · 🤔 = some gain · ❌ = no gain.
   A PSA 10 is never guaranteed!<br>Cheaper option: TAG Grading Base, $39.95 a card (5-card minimum, ~60 business days).</div>
  <div class="list">${own.map(c => row(c.id, `<span class="${c.gain > 0 ? 'up' : 'down'}">${c.gain > 0 ? '+' : ''}${money0(c.gain)}</span><div class="sm">${VERD[c.verdict].split(' ')[0]}</div>`,
     `<div class="sm">Card ${money(c.price)} · PSA 10 ${money0(c.psa)}</div><div class="sm">${VERD[c.verdict]} · ${c.psa_sales} sale${c.psa_sales === 1 ? '' : 's'}</div>`)).join('')}</div>
  <p class="foot">${own.length} of our cards have real PSA 10 sales (PriceCharting, ${esc(fmtDate(own[0]?.psa_asof))}). Others: no PSA 10 sales yet.</p>`;
}

function opened() {
  setTitle('📦 Opened');
  const t = D.totals;
  $app.innerHTML = `<div class="hero"><div class="lbl">📦 We opened</div><div class="big">${t.packs} packs</div><div class="lbl">from ${t.products} products 🎉</div></div>
  <div class="list" style="margin-top:14px">${D.opened.map(o => `<${o.url ? `a href="${esc(o.url)}" target="_blank" rel="noopener"` : 'div'} class="row">
    ${o.img ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(o.img)}" alt="" onerror="this.outerHTML='<div class=&quot;noimg&quot;>📦</div>'">` : '<div class="noimg">📦</div>'}
    <div class="mid"><div class="nm">${esc(o.product.replace('30th Celebration ', ''))}</div><div class="sm">${o.qty} × ${o.packs_each} packs${o.price ? ` · ${money(o.price)} each` : ''}</div>
    ${/⚠️/.test(o.note) ? `<div class="sm">⚠️ needs checking</div>` : ''}</div><div class="rt">×${o.qty}</div></${o.url ? 'a' : 'div'}>`).join('')}</div>
  <p class="foot">Sealed prices from TCGplayer. ⚠️ = Dad needs to double-check which version.</p>`;
}

function search(q) {
  setTitle('🔍 Find a card');
  $app.innerHTML = `<input type="search" id="q" placeholder="Type a Pokémon name…" autocomplete="off" autocapitalize="off" enterkeyhint="search" value="${esc(q || '')}">
  <div class="seg" style="margin-top:14px"><button data-f="all" class="on">All</button><button data-f="have">✅ Have</button><button data-f="need">❔ Need</button></div>
  <div id="res"></div>`;
  const $q = document.getElementById('q'), $r = document.getElementById('res'); let f = 'all';
  const run = () => {
    const s = $q.value.trim().toLowerCase();
    let list = Object.values(D.cards);
    if (s) list = list.filter(c => (c.name + ' ' + c.num + ' ' + c.set + ' ' + c.code).toLowerCase().includes(s));
    if (f !== 'all') list = list.filter(c => f === 'have' ? c.qty > 0 : c.qty === 0);
    if (!s && f === 'all') { $r.innerHTML = `<div class="empty-msg">⬆️ Type a name like <b>Pikachu</b></div>
      <div class="grid">${['Pikachu', 'Charizard', 'Mew', 'Eevee', 'Gengar', 'Lucario'].map(n => `<button class="btn white" data-q="${n}" style="font-size:16px;padding:6px">${n}</button>`).join('')}</div>`;
      $r.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { $q.value = b.dataset.q; run(); }); return; }
    list.sort((a, b) => (b.qty > 0) - (a.qty > 0) || (b.price || 0) - (a.price || 0));
    $r.innerHTML = list.length ? `<p class="muted" style="font-weight:800">${list.length} found</p><div class="grid">${list.slice(0, 90).map(c => cell(c.id, {showQty: true})).join('')}</div>`
      : `<div class="empty-msg">😮 No cards found</div>`;
    history.replaceState(null, '', '#/search/' + encodeURIComponent($q.value));
  };
  $q.oninput = run;
  $app.querySelectorAll('.seg button').forEach(b => b.onclick = () => { f = b.dataset.f; $app.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b)); run(); });
  run(); if (!q) setTimeout(() => $q.focus(), 50);
}

/* ---------- card detail ---------- */
function openCard(id) {
  const c = card(id); if (!c) return;
  const tr = c.trend === 'new' ? '🆕 New' : `${TR[c.trend]} <span class="${c.trend}">${pct(c.pct)}</span>`;
  const psa = c.psa != null ? money0(c.psa) : '—';
  $modal.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(c.name)}">
    <button class="hbtn close" aria-label="Close">✖️</button>
    <img class="pic${c.qty ? '' : ' miss'}" referrerpolicy="no-referrer" src="${esc(c.big || c.img)}" alt="${esc(c.name)}" onerror="if(this.src!=='${esc(c.img)}')this.src='${esc(c.img)}'">
    <h3>${esc(c.name)}</h3><div class="setl">${esc(c.set)} · #${esc(c.num)}${c.rarity ? ' · ' + esc(c.rarity) : ''}</div>
    <div class="stats">
      <div class="stat"><div class="k">💰 Price</div><div class="v">${money(c.price)}</div></div>
      <div class="stat"><div class="k">🃏 We have</div><div class="v">${c.qty ? c.qty : '❔ 0'}</div></div>
      <div class="stat"><div class="k">📈 ${D.settings.window} days</div><div class="v">${tr}</div>${c.base != null ? `<div class="k">${money(c.base)} → ${money(c.price)}</div>` : ''}</div>
      <div class="stat"><div class="k">🏅 PSA 10</div><div class="v">${psa}</div><div class="k">${c.psa != null ? `${c.psa_sales} sale${c.psa_sales === 1 ? '' : 's'}` : 'no sales yet'}</div></div>
      ${c.verdict ? `<div class="stat wide"><div class="k">💎 Worth grading?</div><div class="verdict">${VERD[c.verdict]} <span class="${c.gain > 0 ? 'up' : 'down'}">(${c.gain > 0 ? '+' : ''}${money0(c.gain)})</span></div></div>` : ''}
      ${c.where.length ? `<div class="stat wide"><div class="k">📍 Where it is</div><div style="font-weight:800;font-size:16px">${c.where.map(esc).join('<br>')}</div></div>` : ''}
    </div>
    ${c.url ? `<a class="btn red block" href="${esc(c.url)}" target="_blank" rel="noopener">🛒 See on TCGplayer</a>` : ''}
    <button class="btn white block close2" style="margin-top:12px">👍 Done</button></div>`;
  $modal.hidden = false; document.body.style.overflow = 'hidden';
  $modal.querySelectorAll('.close,.close2').forEach(b => b.onclick = closeCard);
  history.pushState({modal: 1}, '');
}
function closeCard(fromPop) {
  if ($modal.hidden) return;
  $modal.hidden = true; $modal.innerHTML = ''; document.body.style.overflow = '';
  if (fromPop !== true && history.state && history.state.modal) history.back();
}
$modal.addEventListener('click', e => { if (e.target === $modal) closeCard(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCard(); });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-card]'); if (b) { e.preventDefault(); openCard(b.dataset.card); }
});
$back.onclick = () => { if (history.length > 1) history.back(); else location.hash = '#/'; };

/* ---------- router ---------- */
function route() {
  if (!D) return;
  if (!$modal.hidden) closeCard(true);
  const p = location.hash.replace(/^#\/?/, '').split('/');
  window.scrollTo(0, 0);
  switch (p[0]) {
    case 'value': return value();
    case 'binder': return binder(+p[1] || 0, +p[2] || 1);
    case 'sets': return sets();
    case 'set': return setPage(+p[1] || 0, p[2]);
    case 'wish': return wish();
    case 'top': return topCards();
    case 'movers': return movers(p[1]);
    case 'grading': return grading();
    case 'opened': return opened();
    case 'search': return search(decodeURIComponent(p[1] || ''));
    case 'card': home(); return openCard(decodeURIComponent(p[1] || ''));
    default: return home();
  }
}
window.addEventListener('hashchange', route);
window.addEventListener('popstate', () => { if (!$modal.hidden && !(history.state && history.state.modal)) closeCard(true); });

fetch('data.json', {cache: 'no-cache'}).then(r => r.json()).then(d => { D = d; route(); })
  .catch(() => { $app.innerHTML = '<div class="empty-msg">😢 Could not load the cards. Check the internet and try again.</div>'; });
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
