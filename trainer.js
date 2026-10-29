/* 🏅 Trainer Profiles & Leveling - shared by every game (Memory, Who's That, Card Battle School, Trivia, Math).
   Everything is saved on this iPad in localStorage 'fg.trainers' (Export/Import on the Trainer page keeps it safe).

   API (window.Trainer) - player = a profile id ('little' or 'big'); Trainer.current() is who's playing right now:
     Trainer.current() / Trainer.setCurrent(id) / Trainer.list() / Trainer.get(id) / Trainer.level(id)
     Trainer.addXP(player, amount, gameId)       -> {xp, level, leveledUp}. The first XP of each day adds a small daily bonus.
     Trainer.recordScore(player, gameId, score)  -> {best, isNew}. Lower is better for games registered with {low: true}.
     Trainer.recordWin(player, gameId, opts)     -> counts a win; badges: any first win, opts.tricky (Tricky friend), opts.champion (Math)
     Trainer.answer(player, correct)             -> right-in-a-row counter (10 in a row = 🔥 Hot Streak badge)
     Trainer.award(player, badgeId)              -> give a badge directly, e.g. Trainer.award(p, 'math') for Math Champion
     Trainer.registerGame(id, {name, emoji, unit, low})  -> adds a row to the best-score table (math is already registered)
   For the Math game: per question Trainer.answer(p, ok); at the end Trainer.recordScore(p, 'math', points),
   Trainer.addXP(p, points, 'math'), and Trainer.award(p, 'math') when it's a Champion round. Level-ups and badges celebrate on their own. */
window.Trainer = (() => {
'use strict';
const K = () => window.FentonGames.kit;
const KEY = 'fg.trainers', MAXL = 100;
const ART = id => 'games/art/' + id + '.jpg';
// Partner Pokémon: [art id, name, level it evolves at]
const PARTNERS = {
  pikachu:    [['me55-23', 'Pikachu', 1], ['me55-53', 'Pikachu ex', 30]],
  charmander: [['base1-46', 'Charmander', 1], ['base1-24', 'Charmeleon', 16], ['tcg-714372', 'Charizard', 36]],
  eevee:      [['me55-116', 'Eevee', 1], ['me55-71', 'Sylveon', 20]],
  deino:      [['me55-97', 'Deino', 1], ['me55-98', 'Zweilous', 18], ['me55-99', 'Hydreigon', 40]],
  marill:     [['me55-67', 'Marill', 1], ['me55-68', 'Azumarill', 18]],
  zorua:      [['me55-95', 'Zorua', 1], ['me55-96', 'Zoroark', 22]],
  vulpix:     [['me55-9', 'Vulpix', 1], ['me55-10', 'Ninetales', 20]]
};
const BADGES = [
  ['first', '🥇', 'First Win', 'Win any game', '#e3350d'],
  ['streak', '🔥', 'Hot Streak', '10 right in a row', '#ff8a00'],
  ['master', '👑', 'Master Mind', '7+ stars in Master Trivia', '#7b3fe4'],
  ['tricky', '💪', 'Tricky Tamer', 'Beat the Tricky friend', '#2e9e44'],
  ['math', '➗', 'Math Champion', 'Be a Math Champion', '#2a75bb'],
  ['week', '📅', '7-Day Trainer', 'Play on 7 different days', '#d6336c'],
  ['level10', '⭐', 'Rising Star', 'Reach Level 10', '#e0a800'],
  ['scholar', '🎓', 'Card Scholar', 'Finish the card lesson', '#0b8a8a']
];
const GAMES = {
  trivia: {name: 'Trivia', emoji: '❓', unit: '⭐'},
  triviaMaster: {name: 'Master Trivia', emoji: '👑', unit: '⭐'},
  who: {name: "Who's That?", emoji: '👀', unit: '⭐'},
  memoryEasy: {name: 'Memory Easy', emoji: '🃏', unit: 'moves', low: true},
  memoryHard: {name: 'Memory Hard', emoji: '🃏', unit: 'moves', low: true},
  tcg: {name: 'Card Battle wins', emoji: '⚔️', unit: 'wins', wins: true},
  math: {name: 'Math', emoji: '➕', unit: 'points'}
};
const DEFAULT = () => ({v: 1, current: 'little', profiles: {
  little: blank('little', 'Little Trainer', 'pikachu'), big: blank('big', 'Big Trainer', 'charmander')}});
function blank(id, name, partner) { return {id, name, partner, xp: 0, badges: {}, best: {}, wins: {}, plays: {}, days: [], lastDay: '', streak: 0, run: 0, bestRun: 0}; }

/* ---------- save / load (+ move the old Trivia best scores in, once) ---------- */
let S = load();
function load() {
  let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!s || !s.profiles) { s = DEFAULT(); migrate(s); save(s); }
  Object.values(s.profiles).forEach(p => { const b = blank(p.id, p.name, p.partner); for (const k in b) if (p[k] == null) p[k] = b[k]; if (!PARTNERS[p.partner]) p.partner = 'pikachu'; });
  if (!s.profiles[s.current]) s.current = Object.keys(s.profiles)[0];
  return s;
}
function migrate(s) {                                  // old per-device Trivia bests -> each kid's profile
  const get = k => { try { return +(localStorage.getItem('fg.trivBest.' + k) || 0); } catch (e) { return 0; } };
  const L = s.profiles.little, B = s.profiles.big;
  const lt = Math.max(get('little'), get('turns.little')), bt = Math.max(get('big'), get('turns.big')), m = get('master');
  if (lt) L.best.trivia = lt; if (bt) B.best.trivia = bt; if (m) B.best.triviaMaster = m;
  s.migrated = new Date().toISOString().slice(0, 10);
}
function save(s = S) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

/* ---------- levels: gentle curve, fast early (Lv 2 after one game, Lv 10 after ~15 games) ---------- */
const need = L => L <= 1 ? 0 : Math.round(15 * Math.pow(L - 1, 1.55));   // total XP to reach level L
const levelOf = xp => { let L = 1; while (L < MAXL && need(L + 1) <= xp) L++; return L; };
const stageOf = (p, L = levelOf(p.xp)) => { const st = PARTNERS[p.partner]; let s = st[0]; st.forEach(x => { if (L >= x[2]) s = x; }); return s; };
const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return today(d); };
const P = id => S.profiles[id] || null;
const W = id => S.profiles[id] || S.profiles[S.current] || null;   // API calls: an unknown id (e.g. 'champ' / 'master') counts for who's playing

function addXP(id, amount, gameId) {
  const p = W(id); id = p ? p.id : id; if (!p) return null;
  const before = levelOf(p.xp), stage0 = stageOf(p, before);
  let bonus = 0;
  const t = today();
  if (p.lastDay !== t) {                               // 🌞 first play today: daily bonus (+ streak days in a row)
    p.streak = p.lastDay === yesterday() ? p.streak + 1 : 1; p.lastDay = t;
    if (!p.days.includes(t)) p.days.push(t); if (p.days.length > 400) p.days = p.days.slice(-400);
    bonus = 10 + 5 * Math.min(p.streak - 1, 6);
    queue({k: 'daily', p: id, bonus, streak: p.streak});
    if (p.days.length >= 7) award(id, 'week', true);
  }
  p.xp += Math.max(0, Math.round(amount || 0)) + bonus;
  if (gameId) p.plays[gameId] = (p.plays[gameId] || 0) + 1;
  const after = levelOf(p.xp), stage1 = stageOf(p, after);
  if (after > before) queue({k: 'level', p: id, level: after, from: stage0, to: stage1[0] !== stage0[0] ? stage1 : null});
  if (after >= 10) award(id, 'level10', true);
  save(); return {xp: p.xp, level: after, leveledUp: after > before};
}
function recordScore(id, gameId, score) {
  const p = W(id); id = p ? p.id : id; if (!p || score == null || isNaN(score)) return null;
  const g = GAMES[gameId] || {}, old = p.best[gameId];
  const isNew = old == null || (g.low ? score < old : score > old);
  if (isNew) p.best[gameId] = score; save();
  return {best: p.best[gameId], isNew: isNew && old != null};
}
function recordWin(id, gameId, o = {}) {
  const p = W(id); id = p ? p.id : id; if (!p) return;
  p.wins[gameId] = (p.wins[gameId] || 0) + 1; save();
  award(id, 'first', true);
  if (o.tricky) award(id, 'tricky', true);
  if (o.champion) award(id, 'math', true);
}
function answer(id, ok) {
  const p = W(id); id = p ? p.id : id; if (!p) return;
  p.run = ok ? p.run + 1 : 0; p.bestRun = Math.max(p.bestRun, p.run); save();
  if (p.run >= 10) award(id, 'streak', true);
}
function award(id, b, quietIfHave) {
  const p = W(id); id = p ? p.id : id; if (!p || !BADGES.find(x => x[0] === b)) return false;
  if (p.badges[b]) return false;
  p.badges[b] = today(); save(); queue({k: 'badge', p: id, b}); return true;
}
function registerGame(id, info) { GAMES[id] = Object.assign({name: id, emoji: '🎮', unit: ''}, info || {}); }

/* ---------- 🎉 celebrations: level up (partner evolves!), new badge, daily bonus ---------- */
let Q = [], qBusy = false, qTimer = null;
function queue(item) { Q.push(item); if (!qBusy) { clearTimeout(qTimer); qTimer = setTimeout(nextCele, 1700); } }   // wait for the game's own jingle first
function nextCele() {
  const it = Q.shift(); if (!it) { qBusy = false; return; }
  qBusy = true;
  if (it.k === 'daily') return toast(it);
  const p = P(it.p); if (!p) return nextCele();
  const o = document.createElement('div'); o.className = 'tr-cele'; o.id = 'trCele';
  let html, line;
  if (it.k === 'level') {
    const pic = it.to ? `<div class="tr-evo"><img class="tr-evofrom" src="${ART(it.from[0])}" alt="${it.from[1]}"><span class="tr-arrow">➜</span><img class="tr-evoto" src="${ART(it.to[0])}" alt="${it.to[1]}"></div>`
      : `<div class="tr-ava huge"><img src="${ART(stageOf(p)[0])}" alt="${stageOf(p)[1]}"></div>`;
    html = `<div class="tr-kicker">LEVEL UP!</div>${pic}<div class="tr-lv">Level <b>${it.level}</b></div>
      <div class="tr-cname">${esc(p.name)}${it.to ? ` · ${it.from[1]} evolved into ${it.to[1]}!` : ''}</div>`;
    line = `Level up! ${p.name} is level ${it.level}!` + (it.to ? ` Whoa! ${it.from[1]} evolved into ${it.to[1]}!` : '');
    K().SFX[it.to ? 'evo' : 'levelup']();
  } else {
    const b = BADGES.find(x => x[0] === it.b);
    html = `<div class="tr-kicker">NEW BADGE!</div><div class="tr-badge huge" style="--bc:${b[4]}"><span>${b[1]}</span></div>
      <div class="tr-lv">${b[2]}</div><div class="tr-cname">${esc(p.name)} · ${b[3]}</div>`;
    line = `${p.name} earned the ${b[2]} badge!`;
    K().SFX.shine();
  }
  o.innerHTML = `<div class="tr-celebox"><div class="tr-rays" aria-hidden="true"></div>${html}<button class="btn red tr-yay">⭐ Yay!</button></div>`;
  document.body.appendChild(o); K().confetti(120); K().say(line, 'result');
  let done = false; const close = () => { if (done) return; done = true; o.classList.add('out'); setTimeout(() => { o.remove(); nextCele(); }, 300); };
  o.addEventListener('click', close); setTimeout(close, 6500);
}
function toast(it) {
  const p = P(it.p), t = document.createElement('div'); t.className = 'tr-toast';
  t.innerHTML = `🌞 <b>Daily bonus +${it.bonus} XP!</b> ${it.streak > 1 ? `🔥 ${it.streak} days in a row` : 'Welcome back'}${p ? `, ${esc(p.name)}` : ''}!`;
  document.body.appendChild(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => { t.remove(); nextCele(); }, 400); }, 2600);
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

/* ---------- little UI pieces used by other screens ---------- */
const xpBar = p => { const L = levelOf(p.xp), a = need(L), b = need(Math.min(MAXL, L + 1)), f = L >= MAXL ? 1 : (p.xp - a) / (b - a);
  return `<div class="tr-xpbar" aria-label="${p.xp - a} of ${b - a} XP to the next level"><i style="width:${Math.max(3, Math.round(f * 100))}%"></i></div>`; };
const ava = (p, cls = '') => `<span class="tr-ava ${cls}"><img src="${ART(stageOf(p)[0])}" alt="${stageOf(p)[1]}" draggable="false"></span>`;
function whoHTML() {
  return `<div class="tr-who" role="group" aria-label="Who's playing?"><span class="tr-wholbl">Who's playing?</span>
    ${Object.values(S.profiles).map(p => `<button class="tr-chip ${p.id === S.current ? 'on' : ''}" data-trainer="${p.id}" aria-pressed="${p.id === S.current}">${ava(p)}
      <span class="tr-chipt"><b>${esc(p.name)}</b><span>Level ${levelOf(p.xp)}</span></span></button>`).join('')}</div>`;
}
function bindWho(root) {
  root.querySelectorAll('[data-trainer]').forEach(b => b.onclick = () => { setCurrent(b.dataset.trainer); K().SFX.tap();
    root.querySelectorAll('[data-trainer]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    K().say(`${P(b.dataset.trainer).name}, let's go!`, 'line'); });
}
function homeHTML() {
  return `<div class="tr-home">${Object.values(S.profiles).map(p => `<a class="tr-hcard" href="#/trainer/${p.id}">${ava(p)}
    <span class="tr-hmid"><b>${esc(p.name)}</b><span class="tr-hlv">Level ${levelOf(p.xp)} · ${Object.keys(p.badges).length} 🏅</span>${xpBar(p)}</span></a>`).join('')}</div>`;
}
function badgeCase(p) {
  return `<div class="tr-case">${BADGES.map(b => { const got = p.badges[b[0]];
    return `<div class="tr-bslot ${got ? 'got' : 'locked'}"><span class="tr-badge" style="--bc:${b[4]}"><span>${got ? b[1] : '🔒'}</span></span>
      <b>${b[2]}</b><span>${got ? 'Got it!' : b[3]}</span></div>`; }).join('')}</div>`;
}
function scoreRows(p) {
  return Object.entries(GAMES).map(([g, x]) => { const v = x.wins ? (p.wins[g] || 0) : p.best[g];
    return `<div class="tr-srow"><span>${x.emoji} ${x.name}</span><b>${v == null ? '—' : `${v} ${v === 1 ? x.unit.replace(/s$/, "") : x.unit}`}</b></div>`; }).join('');
}

/* ---------- pages: #/trainer/<id> and #/leaderboard ---------- */
function profilePage($app, id) {
  const p = P(id) || P(S.current); const L = levelOf(p.xp), next = need(Math.min(MAXL, L + 1)), st = stageOf(p);
  const evo = PARTNERS[p.partner].find(x => x[2] > L);
  $app.innerHTML = `<div class="tr-page">
    <div class="tr-tabs">${Object.values(S.profiles).map(q => `<a class="${q.id === p.id ? 'on' : ''}" href="#/trainer/${q.id}">${ava(q, 'sm')}${esc(q.name)}</a>`).join('')}</div>
    <div class="tr-card">
      ${ava(p, 'big')}
      <div class="tr-cmid"><div class="tr-name">${esc(p.name)} <button class="tr-edit" id="trRename" aria-label="Change name">✏️</button></div>
        <div class="tr-level">Level <b>${L}</b></div>${xpBar(p)}
        <div class="tr-xptext">${L >= MAXL ? 'Top level!' : `${next - p.xp} XP to Level ${L + 1}`}</div>
        <div class="tr-facts"><span>🤝 ${st[1]}</span><span>🔥 ${p.streak} day${p.streak === 1 ? '' : 's'} in a row</span><span>🏅 ${Object.keys(p.badges).length} of 8</span></div>
        ${evo ? `<div class="tr-evonote">✨ ${st[1]} evolves at Level ${evo[2]}!</div>` : ''}</div></div>
    <div class="tr-row2"><button class="btn red tr-play ${p.id === S.current ? 'on' : ''}" id="trPlay">${p.id === S.current ? '✅ Playing now' : '🎮 Make me the player'}</button>
      <a class="btn blue" href="#/leaderboard">🏆 Family board</a></div>
    <h2>🏅 Badge case</h2>${badgeCase(p)}
    <h2>🏆 Best scores</h2><div class="tr-scores">${scoreRows(p)}</div>
    <h2>🤝 Partner Pokémon</h2>
    <div class="tr-partners">${Object.entries(PARTNERS).map(([k, st]) => { const s2 = stageOf({partner: k, xp: p.xp}, L);
      return `<button class="tr-pp ${k === p.partner ? 'on' : ''}" data-partner="${k}" aria-label="${st[0][1]}"><img src="${ART(s2[0])}" alt="" draggable="false"><b>${s2[1]}</b></button>`; }).join('')}</div>
    <h2>💾 Save progress</h2>
    <div class="tr-save"><p>Keep a code or file so levels and badges are never lost.</p>
      <div class="tr-row2"><button class="btn white" id="trCode">🔑 Show save code</button><button class="btn white" id="trFile">💾 Save file</button></div>
      <textarea id="trCodeBox" readonly hidden aria-label="Save code"></textarea>
      <div class="tr-row2"><button class="btn white" id="trCopy" hidden>📋 Copy code</button></div>
      <h3>📥 Load saved progress</h3>
      <textarea id="trPaste" placeholder="Paste a save code here" aria-label="Paste a save code"></textarea>
      <div class="tr-row2"><button class="btn white" id="trLoad">📥 Load code</button><label class="btn white tr-filebtn">📂 Load file<input type="file" id="trFileIn" accept=".json,application/json,text/plain" hidden></label></div>
      <p class="tr-msg" id="trMsg" aria-live="polite"></p></div></div>`;
  const $ = s => document.getElementById(s), msg = t => { $('trMsg').textContent = t; };
  $('trRename').onclick = () => { const n = prompt('New trainer name?', p.name); if (n && n.trim()) { p.name = n.trim().slice(0, 20); save(); profilePage($app, p.id); } };
  $('trPlay').onclick = () => { setCurrent(p.id); K().SFX.tap(); profilePage($app, p.id); };
  $app.querySelectorAll('[data-partner]').forEach(b => b.onclick = () => { p.partner = b.dataset.partner; save(); K().SFX.match();
    K().say(`${stageOf(p)[1]}, I choose you!`, 'result'); profilePage($app, p.id); });
  $('trCode').onclick = () => { const box = $('trCodeBox'); box.value = exportCode(); box.hidden = false; $('trCopy').hidden = false; box.select(); };
  $('trCopy').onclick = () => { const v = $('trCodeBox').value; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => msg('📋 Copied!'), () => { $('trCodeBox').select(); msg('Select the code and copy it.'); }); };
  $('trFile').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], {type: 'application/json'}));
    a.download = `pokemon-trainers-${today()}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); msg('💾 Saved a file.'); };
  $('trLoad').onclick = () => { const r = importData($('trPaste').value); msg(r); if (r.startsWith('✅')) setTimeout(() => profilePage($app, S.current), 900); };
  $('trFileIn').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { const r = importData(t); msg(r); if (r.startsWith('✅')) setTimeout(() => profilePage($app, S.current), 900); }); };
}
function leaderboardPage($app) {
  const ps = Object.values(S.profiles);
  const strong = p => { const g = Object.entries(p.plays).sort((a, b) => b[1] - a[1])[0]; return g && GAMES[g[0]] ? `Loves ${GAMES[g[0]].name.replace(' wins', '')}!` : 'Ready for adventure!'; };
  const total = ps.reduce((a, p) => a + p.xp, 0);
  $app.innerHTML = `<div class="tr-page tr-board">
    <div class="tr-boardtop"><div class="tr-btitle">🏆 Family Trainers</div><div class="tr-bsub">Everyone is getting stronger! Team XP: <b>${total}</b></div></div>
    <div class="tr-cols">${ps.map(p => `<a class="tr-col" href="#/trainer/${p.id}">${ava(p, 'big')}
      <div class="tr-name">${esc(p.name)}</div><div class="tr-level">Level <b>${levelOf(p.xp)}</b></div>${xpBar(p)}
      <div class="tr-xptext">${p.xp} XP · 🔥 ${p.streak} day${p.streak === 1 ? '' : 's'}</div>
      <div class="tr-minibadges">${BADGES.map(b => `<span class="tr-badge mini ${p.badges[b[0]] ? '' : 'locked'}" style="--bc:${b[4]}" title="${b[2]}"><span>${p.badges[b[0]] ? b[1] : '·'}</span></span>`).join('')}</div>
      <div class="tr-cheer">${strong(p)}</div>
      <div class="tr-scores">${scoreRows(p)}</div></a>`).join('')}</div>
    <p class="tr-foot">Tap a trainer for badges, partner Pokémon and saving.</p></div>`;
}

/* ---------- export / import ---------- */
function exportCode() { return 'PKMN1-' + btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
function importData(text) {
  let t = String(text || '').trim(); if (!t) return 'Paste a code or pick a file first.';
  let data = null;
  try { data = t.startsWith('PKMN1-') ? JSON.parse(decodeURIComponent(escape(atob(t.slice(6).replace(/\s+/g, ''))))) : JSON.parse(t); } catch (e) { return '😕 That code didn\'t work. Check it and try again.'; }
  if (!data || !data.profiles || !Object.values(data.profiles).every(p => p && p.id && typeof p.xp === 'number')) return '😕 That isn\'t a trainer save.';
  if (!confirm('Replace the trainer progress on this iPad with this save?')) return 'Nothing changed.';
  try { localStorage.setItem(KEY + '.before-import', JSON.stringify(S)); } catch (e) {}   // a safety copy
  localStorage.setItem(KEY, JSON.stringify(data)); S = load(); return '✅ Loaded! Welcome back, trainers!';
}

function current() { return S.current; }
function setCurrent(id) { if (S.profiles[id]) { S.current = id; save(); } }
return {current, setCurrent, list: () => Object.values(S.profiles), get: P, level: id => levelOf((P(id) || {xp: 0}).xp), stage: id => stageOf(P(id)),
  addXP, recordScore, recordWin, answer, award, registerGame, whoHTML, bindWho, homeHTML, profilePage, leaderboardPage, exportCode, importData,
  BADGES, GAMES, PARTNERS, ART, _need: need, _levelOf: levelOf, _reload: () => { S = load(); }};
})();
