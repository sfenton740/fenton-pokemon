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
     Trainer.event(player, name, n=1)            -> count something for a badge track (e.g. 'perfect' = a perfect Trivia round)
   🏅 Endless badges (Oct 29): every badge is a track with tiers Bronze, Silver, Gold, Diamond, Master, then Master ★1, ★2, ... forever.
   Every tier (and every secret badge) opens a pack with a Pokémon for that kid's Trainer Collection (#/collection/<id>).
   Packs are saved in the profile before they are shown (p.pending), so a closed tab never loses one.
   For the Math game: per question Trainer.answer(p, ok); at the end Trainer.recordScore(p, 'math', points),
   Trainer.addXP(p, points, 'math'), and Trainer.award(p, 'math') when it's a Champion round. Level-ups and badges celebrate on their own. */
window.Trainer = (() => {
'use strict';
const K = () => window.FentonGames.kit;
const KEY = 'fg.trainers', MAXL = 9999;   // levels never stop either
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
/* ---------- 🏅 badge tracks: no top tier, ever ----------
   Tiers: Bronze, Silver, Gold, Diamond, Master, then Master ★1, ★2, ... Thresholds: base × 1, 2, 4, 7, 12, then +5 × base per ★
   (or a hand-made start + step), so the next star is always a few play sessions away. */
const TIERS = [['Bronze', '🥉', '#c8793a'], ['Silver', '🥈', '#9aa7b4'], ['Gold', '🥇', '#e0a800'], ['Diamond', '💎', '#38b6ff'], ['Master', '👑', '#7b3fe4']];
const MULT = [1, 2, 4, 7, 12];
const sum = o => Object.values(o || {}).reduce((a, v) => a + (+v || 0), 0);
const E = (p, k) => +(p.ev[k] || 0);
const TRACKS = [
  // the 8 original badges (same ids) ...
  {id: 'first',   em: '🏆', name: 'Winner',         c: '#e3350d', how: 'Win games',                 unit: 'wins',    stat: p => sum(p.wins), b: 1},
  {id: 'streak',  em: '🔥', name: 'Hot Streak',     c: '#ff8a00', how: '10 right in a row',         unit: 'streaks', stat: p => E(p, 'hot'), b: 1},
  {id: 'master',  em: '🧠', name: 'Master Mind',    c: '#7b3fe4', how: '7+ stars in Master Trivia', unit: 'rounds',  stat: p => E(p, 'master'), b: 1},
  {id: 'tricky',  em: '💪', name: 'Tricky Tamer',   c: '#2e9e44', how: 'Beat the Tricky friend',    unit: 'wins',    stat: p => E(p, 'tricky'), b: 1},
  {id: 'math',    em: '➗', name: 'Math Champion',  c: '#2a75bb', how: 'Champion Math rounds',      unit: 'rounds',  stat: p => E(p, 'math'), b: 1},
  {id: 'week',    em: '📅', name: 'Play Days',      c: '#d6336c', how: 'Play on different days',    unit: 'days',    stat: p => Math.max(p.dayCount, p.days.length), seq: [7, 14, 21, 30, 45], step: 15},
  {id: 'level10', em: '⭐', name: 'Rising Star',    c: '#e0a800', how: 'Level up',                  unit: 'level',   stat: p => levelOf(p.xp), seq: [10, 15, 20, 30, 40], step: 10, abs: true},
  {id: 'scholar', em: '🎓', name: 'Card Scholar',   c: '#0b8a8a', how: 'Finish the card lesson',    unit: 'lessons', stat: p => E(p, 'scholar'), b: 1},
  // ... and new ones
  {id: 'plays',   em: '🎮', name: 'Game Fan',       c: '#ef476f', how: 'Play games',                unit: 'games',   stat: p => sum(p.plays), b: 5},
  {id: 'right',   em: '✅', name: 'Smart Answers',  c: '#2e9e44', how: 'Right answers',             unit: 'answers', stat: p => E(p, 'right'), b: 10},
  {id: 'mathwiz', em: '🧮', name: 'Math Whiz',      c: '#1971c2', how: 'Right math answers',        unit: 'answers', stat: p => E(p, 'right_math'), b: 10},
  {id: 'battle',  em: '⚔️', name: 'Battle Hero',    c: '#c92a2a', how: 'Win card battles',          unit: 'wins',    stat: p => +(p.wins.tcg || 0), b: 1},
  {id: 'memory',  em: '🃏', name: 'Memory Pro',     c: '#5f3dc4', how: 'Finish Memory games',       unit: 'games',   stat: p => +(p.wins.memory || 0), b: 2},
  {id: 'who',     em: '👀', name: "Who's That Pro", c: '#343a40', how: "Play Who's That?",          unit: 'games',   stat: p => +(p.plays.who || 0), b: 5},
  {id: 'perfect', em: '💯', name: 'Perfect Round',  c: '#f03e3e', how: 'Get every Trivia question', unit: 'rounds',  stat: p => E(p, 'perfect'), b: 1},
  {id: 'sunny',   em: '🌞', name: 'Day Streak',     c: '#f59f00', how: 'Play days in a row',        unit: 'days',    stat: p => Math.max(p.bestStreak, p.streak), seq: [2, 3, 5, 7, 10], step: 3, abs: true},
  {id: 'xp',      em: '💠', name: 'XP Collector',   c: '#0ca678', how: 'Earn XP',                   unit: 'XP',      stat: p => p.xp, b: 200},
  {id: 'explore', em: '🧭', name: 'Explorer',       c: '#e8590c', how: 'Play different games each day', unit: 'games', stat: p => E(p, 'explore'), b: 3},
  {id: 'collect', em: '📚', name: 'Collector',      c: '#7048e8', how: 'Collect different Pokémon', unit: 'Pokémon', stat: p => Object.keys(p.dex).length, b: 5}
];
const TR_BY = Object.fromEntries(TRACKS.map(t => [t.id, t]));
// secret badges: hidden until found, one pack each
const SECRETS = [
  {id: 'owl',     em: '🦉', name: 'Night Owl',     how: 'Played in the evening'},
  {id: 'early',   em: '🐓', name: 'Early Bird',    how: 'Played early in the morning'},
  {id: 'rainbow', em: '🌈', name: 'Rainbow Day',   how: 'Played 4 different games in one day'},
  {id: 'team',    em: '🤝', name: 'Team Up',       how: 'Both trainers played on the same day'},
  {id: 'shiny',   em: '✨', name: 'Shiny Hunter',  how: 'Found a shiny Pokémon'},
  {id: 'legend',  em: '🐉', name: 'Legend Finder', how: 'Found a legendary Pokémon'}
];
const SEC_BY = Object.fromEntries(SECRETS.map(t => [t.id, t]));
// total needed for tier k (0 = Bronze); never stops growing, never jumps too far
function tierNeed(t, k) {
  if (t.seq) return k < t.seq.length ? t.seq[k] : t.seq[t.seq.length - 1] + t.step * (k - t.seq.length + 1);
  return k < MULT.length ? t.b * MULT[k] : t.b * MULT[MULT.length - 1] + 5 * t.b * (k - MULT.length + 1);
}
const tierName = k => k < TIERS.length ? TIERS[k][0] : `Master ★${k - TIERS.length + 1}`;
const tierMedal = k => k < TIERS.length ? TIERS[k][1] : '🌟';
const tierColor = k => k < TIERS.length ? TIERS[k][2] : '#ff4fa3';
const tierSay = k => k < TIERS.length ? TIERS[k][0] : `Master star ${k - TIERS.length + 1}`;
const BADGES = TRACKS.slice(0, 8).map(t => [t.id, t.em, t.name, t.how, t.c]);   // the old list, kept for anything that still reads it

/* ---------- 🎁 rewards: Pokémon for the Trainer Collection, titles and buddy colors ---------- */
const DEX = (window.TRAINER_DEX || 'Pikachu|C').split(';').map((x, i) => { const [n, r] = x.split('|'); return {no: i + 1, n, r: r || 'C'}; });
const POOL = {C: DEX.filter(d => d.r === 'C'), R: DEX.filter(d => d.r === 'R'), L: DEX.filter(d => d.r === 'L')};
const RARE = {C: ['Common', '⚪'], R: ['Rare', '🔷'], L: ['Legendary', '👑']};
const SPR = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
const monArt = (no, sh) => `${SPR}other/official-artwork/${sh ? 'shiny/' : ''}${no}.png`;
const monImg = (no, sh, cls = '') => `<img class="${cls}" src="${monArt(no, sh)}" alt="" loading="lazy" decoding="async" draggable="false" referrerpolicy="no-referrer"
  onerror="if(!this.dataset.f){this.dataset.f=1;this.src='${SPR}${sh ? 'shiny/' : ''}${no}.png';this.classList.add('px')}else{this.replaceWith(Object.assign(document.createElement('span'),{className:'tr-noimg',textContent:'⚪'}))}">`;
const dexKey = (no, sh) => no + (sh ? 's' : '');
const TITLES = ['Bright Star', 'Super Trainer', 'Ace Explorer', 'Gym Hero', 'Elite Trainer', 'Ace Champion', 'Legend Trainer', 'Mythic Master', 'Pokémon Master'];
const titleAt = i => i < TITLES.length ? TITLES[i] : `Pokémon Master ★${i - TITLES.length + 2}`;
const COLORS = [['Sunny', '#ffd23f'], ['Ocean', '#2f9bff'], ['Leaf', '#40c057'], ['Berry', '#e64980'], ['Galaxy', '#7b3fe4'], ['Flame', '#ff6a2a'],
  ['Ice', '#66d9e8'], ['Gold', '#e0a800'], ['Coral', '#ff8787'], ['Mint', '#38d9a9'], ['Night', '#364fc7'], ['Rose', '#f783ac']];
const colorOf = p => (COLORS.find(c => c[0] === p.color) || [0, ''])[1];
const badgeTotal = p => sum(p.tiers) + Object.keys(p.secrets).length;
function pickMon(p, k) {                                         // higher tiers = better odds; prefers Pokémon they don't have yet
  k = Math.min(Math.max(0, k), 12);
  const x = Math.random(), pL = .03 + .015 * k, pR = .25 + .04 * k;
  const r = x < pL ? 'L' : x < pL + pR ? 'R' : 'C';
  const sh = Math.random() < Math.min(.15, .04 + .006 * k);
  const pool = POOL[r].length ? POOL[r] : DEX, fresh = pool.filter(d => !p.dex[dexKey(d.no, sh)]);
  const list = fresh.length && Math.random() < .9 ? fresh : pool;
  const d = list[Math.floor(Math.random() * list.length)];
  const key = dexKey(d.no, sh), had = +(p.dex[key] || 0);
  p.dex[key] = had + 1; p.packs++;
  return {no: d.no, n: d.n, r: d.r, sh: sh ? 1 : 0, c: had + 1, isNew: had === 0};
}
function extras(p) {                                             // every 10th badge: a new title · every 6th: a new buddy color
  const n = badgeTotal(p), out = {};
  const wantT = Math.floor(n / 10), wantC = Math.min(COLORS.length, Math.floor(n / 6));
  const have = Math.max(+p.tn || 0, p.titles.length);
  if (have < wantT) { const t = titleAt(have); p.tn = have + 1;                       // only the newest "Pokémon Master ★N" is kept in the list
    if (have >= TITLES.length) p.titles = p.titles.filter(x => !x.startsWith('Pokémon Master ★'));
    p.titles.push(t); p.title = t; out.title = t; }
  if (p.colors.length < wantC) { const c = COLORS[p.colors.length][0]; p.colors.push(c); p.color = c; out.color = c; }
  return out;
}
let RETRO = null;                                                // collects the catch-up Pokémon while upgrading an old save
function givePack(p, item, k, silent) {                         // the Pokémon is in the save before anyone sees the pack
  const cards = [pickMon(p, k)]; if (silent && RETRO) RETRO.push(...cards);
  cards.forEach(c => { if (c.sh) secret(p, 'shiny', true); if (c.r === 'L') secret(p, 'legend', true); });
  Object.assign(item, {cards}, extras(p));
  if (!silent) { p.pending.push(item); if (p.pending.length > 40) mergePending(p); }
  return cards;
}
function mergePending(p) {                                       // safety: a huge pile becomes one big pack
  const all = p.pending.splice(0); const big = {k: 'many', cards: all.flatMap(x => x.cards || []), n: all.length};
  all.forEach(x => { if (x.title) big.title = x.title; if (x.color) big.color = x.color; }); p.pending.push(big);
}
// check every track; a jump of several tiers gives a pack for each one (loop is bounded)
function check(p, silent, hold) {                                 // hold = mid-round: save the pack now, show it at the end
  let got = 0;
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    TRACKS.forEach(t => { const v = t.stat(p); let k = +(p.tiers[t.id] || 0), guard = 0;
      while (v >= tierNeed(t, k) && guard++ < 500) { p.tiers[t.id] = k + 1;
        if (t.id === 'first' || t.id === 'week' || t.id === 'level10' || t.id === 'streak' || t.id === 'tricky' || t.id === 'math' || t.id === 'master' || t.id === 'scholar') p.badges[t.id] = p.badges[t.id] || today();
        givePack(p, {k: 'tier', t: t.id, tier: k}, k, silent); k++; got++; changed = true; } });
    if (!changed) break;
  }
  if (!silent && !hold && (got || p.pending.length)) flushSoon();   // also shows packs saved mid-round
  return got;
}
function secret(p, id, inPack) {
  if (!p || !SEC_BY[id] || p.secrets[id]) return false;
  p.secrets[id] = today();
  givePack(p, {k: 'secret', s: id}, 3, false);
  if (!inPack) flushSoon();
  return true;
}
function upgrade(p) {                                            // once per profile: old badges -> tracks, retro packs as one welcome pack
  const old = Object.keys(p.badges || {});
  if (old.includes('streak')) p.ev.hot = Math.max(E(p, 'hot'), 1);
  ['master', 'tricky', 'math', 'scholar'].forEach(b => { if (old.includes(b)) p.ev[b] = Math.max(E(p, b), 1); });
  p.dayCount = Math.max(p.dayCount, p.days.length); p.bestStreak = Math.max(p.bestStreak, p.streak);
  if (!p.ev.right && p.bestRun) p.ev.right = p.bestRun;
  RETRO = [];
  old.forEach(b => { if (TR_BY[b] && !(p.tiers[b] > 0)) { p.tiers[b] = 1; givePack(p, {k: 'tier', t: b, tier: 0}, 0, true); } });   // earned = at least Bronze
  check(p, true);
  const retro = RETRO; RETRO = null;
  const cards = []; for (let i = 0; i < 3; i++) cards.push(pickMon(p, 2));                                          // + 3 welcome Pokémon
  p.pending = p.pending.filter(x => x.k !== 'welcome');
  p.pending.unshift({k: 'welcome', cards: [...retro, ...cards], badges: badgeTotal(p)});
  if (p.titles.length) p.title = p.titles[p.titles.length - 1];
  p.title = p.title || ''; p.bv = 3;
}

const GAMES = {
  trivia: {name: 'Trivia', emoji: '❓', unit: '⭐'},
  triviaMaster: {name: 'Master Trivia', emoji: '👑', unit: '⭐'},
  who: {name: "Who's That?", emoji: '👀', unit: '⭐'},
  memoryEasy: {name: 'Memory Easy', emoji: '🃏', unit: 'moves', low: true},
  memoryHard: {name: 'Memory Hard', emoji: '🃏', unit: 'moves', low: true},
  tcg: {name: 'Card Battle wins', emoji: '⚔️', unit: 'wins', wins: true},
  math: {name: 'Math', emoji: '➕', unit: 'points'}
};
// the two kids: Harper (age 4) plays the Star Trainer modes, Carter (age 6) the Ace Trainer modes
const KIDS = {little: 'Harper', big: 'Carter'};
const DEFAULT = () => ({v: 2, current: 'little', profiles: {
  little: blank('little', KIDS.little, 'pikachu'), big: blank('big', KIDS.big, 'charmander')}});
function blank(id, name, partner) { return {id, name, partner, xp: 0, badges: {}, best: {}, wins: {}, plays: {}, days: [], lastDay: '', streak: 0, run: 0, bestRun: 0,
  // endless badges + Trainer Collection (bv 3)
  ev: {}, tiers: {}, secrets: {}, dex: {}, packs: 0, pending: [], titles: [], title: '', colors: [], color: '', dayCount: 0, bestStreak: 0, exDay: '', exGames: [], tn: 0, bv: 0}; }
const OBJ = ['badges', 'best', 'wins', 'plays', 'ev', 'tiers', 'secrets', 'dex'], ARR = ['days', 'pending', 'titles', 'colors', 'exGames'];

/* ---------- save / load (+ move the old Trivia best scores in, once) ---------- */
let S = null;   // loaded at the bottom, after the badge tracks exist
function load() {
  let s = null; try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!s || !s.profiles) { s = DEFAULT(); migrate(s); save(s); }
  Object.values(s.profiles).forEach(p => { const b = blank(p.id, p.name, p.partner); for (const k in b) if (p[k] == null) p[k] = b[k]; if (!PARTNERS[p.partner]) p.partner = 'pikachu';
    OBJ.forEach(k => { if (!p[k] || typeof p[k] !== 'object' || Array.isArray(p[k])) p[k] = {}; }); ARR.forEach(k => { if (!Array.isArray(p[k])) p[k] = []; });
    ['xp', 'packs', 'dayCount', 'bestStreak', 'streak', 'run', 'bestRun', 'tn'].forEach(k => { p[k] = Math.max(0, +p[k] || 0); }); });
  if (!s.profiles[s.current]) s.current = Object.keys(s.profiles)[0];
  // v1 -> v2: the old placeholder names become the kids' names (XP, badges and scores stay); a name someone typed in is kept
  if ((s.v || 1) < 2) { const old = {little: 'Little Trainer', big: 'Big Trainer'};
    for (const k in KIDS) { const p = s.profiles[k]; if (p && (!p.name || p.name === old[k])) p.name = KIDS[k]; }
    s.v = 2; save(s); }
  // v2 -> v3: old badges become tracks (at least Bronze), every tier earned so far + a welcome pack go into the Trainer Collection
  Object.values(s.profiles).forEach(p => { if ((p.bv || 0) < 3) upgrade(p); });
  if ((s.v || 2) < 3) s.v = 3;
  save(s); return s;
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
    if (!p.days.includes(t)) { p.days.push(t); p.dayCount = Math.max(p.dayCount + 1, p.days.length); } if (p.days.length > 400) p.days = p.days.slice(-400);
    p.bestStreak = Math.max(p.bestStreak, p.streak);
    bonus = 10 + 5 * Math.min(p.streak - 1, 6);
    queue({k: 'daily', p: id, bonus, streak: p.streak});
    // 🤝 secret: both trainers played today
    const others = Object.values(S.profiles).filter(q => q.id !== p.id && q.lastDay === t);
    if (others.length) { secret(p, 'team'); others.forEach(q => secret(q, 'team')); }
  }
  const hr = new Date().getHours(); if (hr >= 19) secret(p, 'owl'); else if (hr < 8 && hr >= 4) secret(p, 'early');
  if (gameId) { if (p.exDay !== t) { p.exDay = t; p.exGames = []; }
    if (!p.exGames.includes(gameId)) { p.exGames.push(gameId); p.ev.explore = (p.ev.explore || 0) + 1; if (p.exGames.length >= 4) secret(p, 'rainbow'); } }
  p.xp += Math.max(0, Math.round(amount || 0)) + bonus;
  if (gameId) p.plays[gameId] = (p.plays[gameId] || 0) + 1;
  const after = levelOf(p.xp), stage1 = stageOf(p, after);
  if (after > before) queue({k: 'level', p: id, level: after, from: stage0, to: stage1[0] !== stage0[0] ? stage1 : null});
  check(p); save(); return {xp: p.xp, level: after, leveledUp: after > before};
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
  p.wins[gameId] = (p.wins[gameId] || 0) + 1;
  if (o.tricky) p.ev.tricky = (p.ev.tricky || 0) + 1;
  if (o.champion) p.ev.math = (p.ev.math || 0) + 1;
  check(p); save();
}
function answer(id, ok, gameId) {
  const p = W(id); id = p ? p.id : id; if (!p) return;
  p.run = ok ? p.run + 1 : 0; p.bestRun = Math.max(p.bestRun, p.run);
  if (ok) { p.ev.right = (p.ev.right || 0) + 1; if (gameId) p.ev['right_' + gameId] = (p.ev['right_' + gameId] || 0) + 1;
    if (p.run % 10 === 0) p.ev.hot = (p.ev.hot || 0) + 1; }                       // 🔥 every 10 in a row counts
  check(p, false, true); save();
}
// award(p, 'master' | 'math' | 'scholar' | 'tricky' | ...): one more of that thing (Master Trivia 7+, Math Champion round, lesson done)
function award(id, b) {
  const p = W(id); if (!p || typeof b !== 'string') return false;
  p.ev[b] = (p.ev[b] || 0) + 1; check(p); save(); return true;
}
function event(id, name, n = 1) { const p = W(id); if (!p || !name) return; p.ev[name] = (p.ev[name] || 0) + Math.max(0, +n || 0); check(p); save(); }
function registerGame(id, info) { GAMES[id] = Object.assign({name: id, emoji: '🎮', unit: ''}, info || {}); }

/* ---------- 🎉 celebrations: level up (partner evolves!), daily bonus, and 🎁 badge packs ---------- */
let Q = [], qBusy = false, qTimer = null;
function queue(item) { Q.push(item); if (!qBusy) { clearTimeout(qTimer); qTimer = setTimeout(nextCele, 1700); } }   // wait for the game's own jingle first
function flushSoon(ms = 1700) { if (window.FG_NO_AUTO_PACKS) return; if (!qBusy) { clearTimeout(qTimer); qTimer = setTimeout(nextCele, ms); } }
const hasPending = () => Object.values(S.profiles).some(p => p.pending.length);
function nextCele() {
  const it = Q.shift();
  if (!it) {                                                     // then any saved packs (current player first)
    const ps = [P(S.current), ...Object.values(S.profiles)].filter(p => p && p.pending.length);
    if (ps.length && !window.FG_NO_AUTO_PACKS && !document.getElementById('trCele')) return packReveal(ps[0]);
    qBusy = false; return;
  }
  qBusy = true;
  if (it.k === 'daily') return toast(it);
  const p = P(it.p); if (!p) return nextCele();
  const o = document.createElement('div'); o.className = 'tr-cele'; o.id = 'trCele';
  const pic = it.to ? `<div class="tr-evo"><img class="tr-evofrom" src="${ART(it.from[0])}" alt="${it.from[1]}"><span class="tr-arrow">➜</span><img class="tr-evoto" src="${ART(it.to[0])}" alt="${it.to[1]}"></div>`
    : `<div class="tr-ava huge"><img src="${ART(stageOf(p)[0])}" alt="${stageOf(p)[1]}"></div>`;
  const html = `<div class="tr-kicker">LEVEL UP!</div>${pic}<div class="tr-lv">Level <b>${it.level}</b></div>
    <div class="tr-cname">${esc(p.name)}${it.to ? ` · ${it.from[1]} evolved into ${it.to[1]}!` : ''}</div>`;
  const line = `Level up! ${p.name} is level ${it.level}!` + (it.to ? ` Whoa! ${it.from[1]} evolved into ${it.to[1]}!` : '');
  K().SFX[it.to ? 'evo' : 'levelup']();
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
const medal = (em, k, cls = '') => `<span class="tr-medal ${cls}" style="--bc:${tierColor(k)}"><span>${em}</span><i>${tierMedal(k)}</i></span>`;
const cardHTML = (c, cls = '') => `<div class="tr-mon r-${c.r} ${c.sh ? 'shiny' : ''} ${cls}">
  <div class="tr-mback" aria-hidden="true"><span></span></div>
  <div class="tr-mface">${monImg(c.no, c.sh, 'tr-monimg')}<b class="tr-mname">${c.sh ? '✨ ' : ''}${esc(c.n)}</b>
    <span class="tr-mtag">${c.sh ? '✨ Shiny' : RARE[c.r][1] + ' ' + RARE[c.r][0]}</span>
    <span class="tr-mcount ${c.isNew ? 'new' : ''}">${c.isNew ? '🆕 New!' : `+1! ×${c.c}`}</span></div></div>`;
const monSay = c => (c.sh ? 'A shiny ' : c.r === 'L' ? 'A legendary ' : '') + c.n + '!' + (c.isNew ? '' : ` Now you have ${c.c}!`);
// 🎁 the pack: badge -> tap the pack -> it bursts open -> card flips -> Pokémon! (one pack at a time, tap to go on)
function packReveal(p) {
  qBusy = true;
  const it = p.pending[0]; if (!it) return nextCele();
  const cards = (it.cards || []).filter(c => c && c.no);
  const many = cards.length > 1, left = sum(Object.values(S.profiles).map(q => q.pending.length)) - 1;
  let head, line;
  if (it.k === 'welcome') { head = `<div class="tr-kicker">WELCOME PACK!</div><div class="tr-pwho">${ava(p, 'sm')}<b>${esc(p.name)}</b></div>
      <div class="tr-psub">🏅 Badges never stop now! Here are your Pokémon.</div>`;
    line = `${p.name}, here's your welcome pack! Tap the pack!`; }
  else if (it.k === 'many') { head = `<div class="tr-kicker">BIG PACK!</div><div class="tr-pwho">${ava(p, 'sm')}<b>${esc(p.name)}</b></div><div class="tr-psub">${it.n} badges at once!</div>`;
    line = `Wow, ${p.name}! A big pack! Tap the pack!`; }
  else if (it.k === 'secret') { const x = SEC_BY[it.s] || {em: '❓', name: 'Secret'};
    head = `<div class="tr-kicker">SECRET BADGE!</div>${medal(x.em, 4, 'huge secret')}<div class="tr-bname">${x.name}</div><div class="tr-pwho">${ava(p, 'sm')}<b>${esc(p.name)}</b></div>`;
    line = `Wow! ${p.name} found a secret badge, ${x.name}! Tap the pack!`; }
  else { const t = TR_BY[it.t] || TRACKS[0];
    head = `<div class="tr-kicker">NEW BADGE!</div>${medal(t.em, it.tier, 'huge')}<div class="tr-bname">${t.name} <span style="color:${tierColor(it.tier)}">${tierName(it.tier)}</span></div>
      <div class="tr-pwho">${ava(p, 'sm')}<b>${esc(p.name)}</b></div>`;
    line = `${p.name} earned ${t.name} ${tierSay(it.tier)}! Tap the pack!`; }
  const o = document.createElement('div'); o.className = 'tr-cele tr-packwrap'; o.id = 'trCele'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'New badge');
  const shown = cards.slice(0, 6), more = cards.length - shown.length;
  o.innerHTML = `<div class="tr-celebox tr-packbox"><div class="tr-rays" aria-hidden="true"></div>${head}
    <button class="tr-pack" id="trPack" aria-label="Open the pack"><span class="tr-packtop"></span><span class="tr-packball"></span><span class="tr-packtxt">👆 Tap!</span></button>
    <div class="tr-cards ${many ? 'many' : ''}" id="trCards" hidden>${shown.map(c => cardHTML(c)).join('')}</div>
    ${more > 0 ? `<div class="tr-psub" id="trMore" hidden>+${more} more in your 📚 Trainer Collection!</div>` : ''}
    <div class="tr-extra" id="trExtra" hidden>${it.title ? `<span>🎖️ New title: <b>${esc(it.title)}</b></span>` : ''}${it.color ? `<span>🎨 New buddy color: <b style="color:${colorOf({color: it.color})}">${esc(it.color)}</b></span>` : ''}</div>
    <div class="tr-pbtns" id="trBtns" hidden><button class="btn red tr-yay" id="trNext">${left > 0 ? `▶ Next <small>(${left} more)</small>` : '⭐ Yay!'}</button>
      ${left >= 2 ? '<button class="btn white tr-yay" id="trAll">⏩ Open all</button>' : ''}</div></div>`;
  document.body.appendChild(o);
  K().SFX.shine(); K().confetti(60); K().say(line, 'result');
  const $ = id => o.querySelector('#' + id); let opened = false;
  const open = () => {
    if (opened) return; opened = true;
    $('trPack').classList.add('burst'); K().SFX.tap();
    setTimeout(() => {
      $('trPack').hidden = true; $('trCards').hidden = false;
      const els = [...o.querySelectorAll('.tr-mon')];
      els.forEach((el, i) => setTimeout(() => { el.classList.add('flip'); K().SFX.flip(); }, 250 + i * (many ? 260 : 0)));
      const end = 900 + els.length * (many ? 260 : 0);
      setTimeout(() => {
        const best = cards.find(c => c.r === 'L') || cards.find(c => c.sh) || cards[0];
        if (best && (best.r === 'L' || best.sh)) { K().SFX.secret(); K().confetti(160); } else { K().SFX.match(); K().confetti(90); }
        if ($('trMore')) $('trMore').hidden = false;
        if (it.title || it.color) $('trExtra').hidden = false;
        $('trBtns').hidden = false;
        if (best) K().say(many ? `You got ${shown.length + more} Pokémon! ` + (best.r === 'L' || best.sh ? monSay(best) : '') : 'You got ' + monSay(best)
          + (it.title ? ` New title, ${it.title}!` : '') + (it.color ? ` New buddy color, ${it.color}!` : ''), 'result');
      }, end);
    }, 520);
  };
  $('trPack').onclick = e => { e.stopPropagation(); open(); };
  o.querySelector('.tr-packbox').addEventListener('click', e => { if (!opened && !e.target.closest('button')) open(); });
  let done = false;
  const finish = all => { if (done) return; done = true;
    p.pending.shift();
    if (all) Object.values(S.profiles).forEach(q => { if (q.pending.length > 1) mergePending(q); });
    save(); K().SFX.tap(); o.classList.add('out');
    setTimeout(() => { o.remove(); if (document.querySelector('.tr-page')) rerender(); nextCele(); }, 300); };
  $('trNext').onclick = e => { e.stopPropagation(); finish(false); };
  if ($('trAll')) $('trAll').onclick = e => { e.stopPropagation(); finish(true); };
}
let lastPage = null;
function rerender() { if (lastPage) try { lastPage(); } catch (e) {} }

/* ---------- small UI pieces used by other screens ---------- */
const xpBar = p => { const L = levelOf(p.xp), a = need(L), b = need(Math.min(MAXL, L + 1)), f = L >= MAXL ? 1 : (p.xp - a) / (b - a);
  return `<div class="tr-xpbar" aria-label="${p.xp - a} of ${b - a} XP to the next level"><i style="width:${Math.max(3, Math.round(f * 100))}%"></i></div>`; };
const ring = p => colorOf(p) ? ` style="border-color:${colorOf(p)};box-shadow:0 0 0 3px ${colorOf(p)}55"` : '';
const ava = (p, cls = '') => `<span class="tr-ava ${cls}"${ring(p)}><img src="${ART(stageOf(p)[0])}" alt="${stageOf(p)[1]}" draggable="false"></span>`;
// progress on every track; nextBadge = the one closest to its next tier (there is always one)
function prog(p, t) { const k = +(p.tiers[t.id] || 0), v = t.stat(p), a = k ? tierNeed(t, k - 1) : (t.abs ? 0 : 0), b = tierNeed(t, k);
  const lo = t.abs && k === 0 ? 0 : a; return {t, k, v, need: b, left: Math.max(0, b - v), f: Math.max(0, Math.min(1, (v - lo) / Math.max(1, b - lo)))}; }
function nextBadge(p) { return TRACKS.map(t => prog(p, t)).filter(x => x.t.id !== 'collect').sort((a, b) => b.f - a.f || a.left - b.left)[0]; }
const leftText = x => x.t.abs ? `${x.t.unit === 'level' ? 'Level ' + x.need : x.need + ' ' + x.t.unit}` : `${x.left} more ${x.left === 1 ? x.t.unit.replace(/s$/, '') : x.t.unit}`;
function nextHTML(p, cls = '') { const x = nextBadge(p);
  return `<div class="tr-next ${cls}" aria-label="Next badge: ${x.t.name} ${tierName(x.k)}, ${leftText(x)}">${medal(x.t.em, x.k, 'sm')}
    <span class="tr-nmid"><span class="tr-nt">🎯 Next: <b>${x.t.name} ${tierName(x.k)}</b></span>
    <span class="tr-nbar"><i style="width:${Math.max(4, Math.round(x.f * 100))}%"></i></span><span class="tr-nleft">${leftText(x)}</span></span></div>`; }
function whoHTML() {
  if (hasPending()) flushSoon(900);
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
    <span class="tr-hmid"><b>${esc(p.name)}</b><span class="tr-hlv">Level ${levelOf(p.xp)} · ${badgeTotal(p)} 🏅 · ${Object.keys(p.dex).length} 📚</span>${xpBar(p)}${nextHTML(p, 'mini')}</span></a>`).join('')}</div>`;
}
function badgeCase(p) {
  return `<div class="tr-case">${TRACKS.map(t => { const x = prog(p, t), got = x.k > 0;
    return `<div class="tr-bslot ${got ? 'got' : 'locked'}">${medal(t.em, Math.max(0, x.k - 1), got ? '' : 'off')}
      <b>${t.name}</b><span class="tr-btier" style="${got ? `color:${tierColor(x.k - 1)}` : ''}">${got ? tierName(x.k - 1) : 'Not yet'}</span>
      <span class="tr-nbar"><i style="width:${Math.max(4, Math.round(x.f * 100))}%"></i></span><span class="tr-bhow">${t.how}<br>${got ? '➜ ' + tierName(x.k) + ': ' : ''}${leftText(x)}</span></div>`; }).join('')}</div>
    <h3>🤫 Secret badges</h3><div class="tr-case secrets">${SECRETS.map(x => { const got = p.secrets[x.id];
      return `<div class="tr-bslot ${got ? 'got' : 'locked'}">${medal(got ? x.em : '❓', 4, got ? 'secret' : 'off')}<b>${got ? x.name : 'Secret'}</b><span class="tr-bhow">${got ? x.how : 'Keep playing to find it!'}</span></div>`; }).join('')}</div>`;
}
function scoreRows(p) {
  return Object.entries(GAMES).map(([g, x]) => { const v = x.wins ? (p.wins[g] || 0) : p.best[g];
    return `<div class="tr-srow"><span>${x.emoji} ${x.name}</span><b>${v == null ? '—' : `${v} ${v === 1 ? x.unit.replace(/s$/, "") : x.unit}`}</b></div>`; }).join('');
}
const titleLine = p => p.title ? `<div class="tr-title" style="${colorOf(p) ? `--tc:${colorOf(p)}` : ''}">🎖️ ${esc(p.title)}</div>` : '';

/* ---------- pages: #/trainer/<id>, #/collection/<id> and #/leaderboard ---------- */
function profilePage($app, id) {
  lastPage = () => profilePage($app, id);
  const p = P(id) || P(S.current); const L = levelOf(p.xp), next = need(Math.min(MAXL, L + 1)), st = stageOf(p);
  const evo = PARTNERS[p.partner].find(x => x[2] > L);
  $app.innerHTML = `<div class="tr-page">
    <div class="tr-tabs">${Object.values(S.profiles).map(q => `<a class="${q.id === p.id ? 'on' : ''}" href="#/trainer/${q.id}">${ava(q, 'sm')}${esc(q.name)}</a>`).join('')}</div>
    <div class="tr-card">
      ${ava(p, 'big')}
      <div class="tr-cmid"><div class="tr-name">${esc(p.name)} <button class="tr-edit" id="trRename" aria-label="Change name">✏️</button></div>${titleLine(p)}
        <div class="tr-level">Level <b>${L}</b></div>${xpBar(p)}
        <div class="tr-xptext">${`${next - p.xp} XP to Level ${L + 1}`}</div>
        <div class="tr-facts"><span>🤝 ${st[1]}</span><span>🔥 ${p.streak} day${p.streak === 1 ? '' : 's'} in a row</span><span>🏅 ${badgeTotal(p)} badges</span><span>📚 ${Object.keys(p.dex).length} Pokémon</span></div>
        ${evo ? `<div class="tr-evonote">✨ ${st[1]} evolves at Level ${evo[2]}!</div>` : ''}</div></div>
    ${nextHTML(p, 'big')}
    <div class="tr-row2"><a class="btn yellow tr-colbtn" href="#/collection/${p.id}">📚 Trainer Collection <small>${Object.keys(p.dex).length}</small></a>
      <button class="btn red tr-play ${p.id === S.current ? 'on' : ''}" id="trPlay">${p.id === S.current ? '✅ Playing now' : '🎮 Make me the player'}</button>
      <a class="btn blue" href="#/leaderboard">🏆 Family board</a></div>
    <h2>🏅 Badges <small class="tr-h2sub">they never stop!</small></h2>${badgeCase(p)}
    ${p.titles.length || p.colors.length ? `<h2>🎖️ Titles &amp; buddy colors</h2><div class="tr-chips">
      ${p.titles.map(t => `<button class="tr-tchip ${t === p.title ? 'on' : ''}" data-title="${esc(t)}">🎖️ ${esc(t)}</button>`).join('')}
      ${p.colors.map(c => `<button class="tr-tchip ${c === p.color ? 'on' : ''}" data-color="${esc(c)}"><i style="background:${colorOf({color: c})}"></i>${esc(c)}</button>`).join('')}</div>` : ''}
    <h2>🏆 Best scores</h2><div class="tr-scores">${scoreRows(p)}</div>
    <h2>🤝 Partner Pokémon</h2>
    <div class="tr-partners">${Object.entries(PARTNERS).map(([k, st]) => { const s2 = stageOf({partner: k, xp: p.xp}, L);
      return `<button class="tr-pp ${k === p.partner ? 'on' : ''}" data-partner="${k}" aria-label="${st[0][1]}"><img src="${ART(s2[0])}" alt="" draggable="false"><b>${s2[1]}</b></button>`; }).join('')}</div>
    <h2>💾 Save progress</h2>
    <div class="tr-save"><p>Keep a code or file so levels, badges and the Trainer Collection are never lost.</p>
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
  $app.querySelectorAll('[data-title]').forEach(b => b.onclick = () => { p.title = b.dataset.title; save(); K().SFX.tap(); K().say(p.title + '!', 'result'); profilePage($app, p.id); });
  $app.querySelectorAll('[data-color]').forEach(b => b.onclick = () => { p.color = b.dataset.color; save(); K().SFX.tap(); profilePage($app, p.id); });
  $('trCode').onclick = () => { const box = $('trCodeBox'); box.value = exportCode(); box.hidden = false; $('trCopy').hidden = false; box.select(); };
  $('trCopy').onclick = () => { const v = $('trCodeBox').value; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => msg('📋 Copied!'), () => { $('trCodeBox').select(); msg('Select the code and copy it.'); }); };
  $('trFile').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], {type: 'application/json'}));
    a.download = `pokemon-trainers-${today()}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); msg('💾 Saved a file.'); };
  $('trLoad').onclick = () => { const r = importData($('trPaste').value); msg(r); if (r.startsWith('✅')) setTimeout(() => profilePage($app, S.current), 900); };
  $('trFileIn').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { const r = importData(t); msg(r); if (r.startsWith('✅')) setTimeout(() => profilePage($app, S.current), 900); }); };
  if (hasPending()) flushSoon(700);
}
// 📚 Trainer Collection: a sticker book per kid. "Mine" first, then a page per Pokémon generation.
const GENS = [[1, 151], [152, 251], [252, 386], [387, 493], [494, 649], [650, 721], [722, 809], [810, 905], [906, 1025]];
function collectionPage($app, id, tab) {
  const p = P(id) || P(S.current); tab = tab || 'mine';
  lastPage = () => collectionPage($app, p.id, tab);
  const has = no => +(p.dex[no] || 0) + +(p.dex[no + 's'] || 0), shiny = no => +(p.dex[no + 's'] || 0) > 0;
  const uniq = DEX.filter(d => has(d.no)).length, shinies = DEX.filter(d => shiny(d.no)).length, legends = DEX.filter(d => d.r === 'L' && has(d.no)).length;
  const slot = d => { const n = has(d.no);
    if (!n) return `<div class="tr-st empty" aria-label="Number ${d.no}, not found yet"><span class="tr-stno">#${d.no}</span><span class="tr-stq">?</span></div>`;
    const sh = shiny(d.no);
    return `<div class="tr-st r-${d.r} ${sh ? 'shiny' : ''}" data-mon="${d.no}" aria-label="${esc(d.n)}${n > 1 ? ', ' + n + ' copies' : ''}">${monImg(d.no, sh)}
      <b>${esc(d.n)}</b>${n > 1 ? `<span class="tr-stc">×${n}</span>` : ''}${sh ? '<span class="tr-sts">✨</span>' : d.r === 'L' ? '<span class="tr-sts">👑</span>' : ''}</div>`; };
  const list = tab === 'mine' ? DEX.filter(d => has(d.no)) : DEX.slice(GENS[+tab][0] - 1, GENS[+tab][1]);
  const genGot = g => DEX.slice(GENS[g][0] - 1, GENS[g][1]).filter(d => has(d.no)).length;
  $app.innerHTML = `<div class="tr-page tr-colpage">
    <div class="tr-tabs">${Object.values(S.profiles).map(q => `<a class="${q.id === p.id ? 'on' : ''}" href="#/collection/${q.id}">${ava(q, 'sm')}${esc(q.name)}</a>`).join('')}</div>
    <div class="tr-colhead"><div class="tr-btitle">📚 ${esc(p.name)}'s Trainer Collection</div>
      <div class="tr-facts"><span>🃏 <b>${uniq}</b> of ${DEX.length}</span><span>✨ ${shinies} shiny</span><span>👑 ${legends} legendary</span><span>🎁 ${p.packs} packs</span></div>
      ${nextHTML(p, 'big')}</div>
    <div class="tr-gens" role="group" aria-label="Pages"><button class="${tab === 'mine' ? 'on' : ''}" data-tab="mine">⭐ Mine</button>
      ${GENS.map((g, i) => `<button class="${String(tab) === String(i) ? 'on' : ''}" data-tab="${i}">Gen ${i + 1} <small>${genGot(i)}/${g[1] - g[0] + 1}</small></button>`).join('')}</div>
    <div class="tr-book">${list.length ? list.map(slot).join('') : '<p class="tr-foot">Earn badges to open packs and fill your book!</p>'}</div>
    <div class="tr-row2"><a class="btn blue" href="#/trainer/${p.id}">🏅 Badges</a><a class="btn white" href="#/leaderboard">🏆 Family board</a></div></div>`;
  $app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { K().SFX.tap(); collectionPage($app, p.id, b.dataset.tab); });
  $app.querySelectorAll('[data-mon]').forEach(b => b.onclick = () => { const d = DEX[+b.dataset.mon - 1]; K().SFX.tap(); K().say(d.n + '!', 'result'); });
  if (hasPending()) flushSoon(700);
}
function leaderboardPage($app) {
  lastPage = () => leaderboardPage($app);
  const ps = Object.values(S.profiles);
  const strong = p => { const g = Object.entries(p.plays).sort((a, b) => b[1] - a[1])[0]; return g && GAMES[g[0]] ? `Loves ${GAMES[g[0]].name.replace(' wins', '')}!` : 'Ready for adventure!'; };
  const total = ps.reduce((a, p) => a + p.xp, 0);
  const tops = p => TRACKS.filter(t => p.tiers[t.id] > 0).sort((a, b) => p.tiers[b.id] - p.tiers[a.id]).slice(0, 8);
  $app.innerHTML = `<div class="tr-page tr-board">
    <div class="tr-boardtop"><div class="tr-btitle">🏆 Family Trainers</div><div class="tr-bsub">Everyone is getting stronger! Team XP: <b>${total}</b></div></div>
    <div class="tr-cols">${ps.map(p => `<a class="tr-col" href="#/trainer/${p.id}">${ava(p, 'big')}
      <div class="tr-name">${esc(p.name)}</div>${titleLine(p)}<div class="tr-level">Level <b>${levelOf(p.xp)}</b></div>${xpBar(p)}
      <div class="tr-xptext">${p.xp} XP · 🔥 ${p.streak} day${p.streak === 1 ? '' : 's'} · 🏅 ${badgeTotal(p)} · 📚 ${Object.keys(p.dex).length}</div>
      <div class="tr-minibadges">${tops(p).map(t => medal(t.em, p.tiers[t.id] - 1, 'mini')).join('') || '<span class="tr-foot">First badge coming soon!</span>'}</div>
      ${nextHTML(p, 'mini')}
      <div class="tr-cheer">${strong(p)}</div>
      <div class="tr-scores">${scoreRows(p)}</div></a>`).join('')}</div>
    <p class="tr-foot">Tap a trainer for badges, the Trainer Collection, partner Pokémon and saving.</p></div>`;
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

S = load();
function current() { return S.current; }
function setCurrent(id) { if (S.profiles[id]) { S.current = id; save(); } }
return {current, setCurrent, list: () => Object.values(S.profiles), get: P, level: id => levelOf((P(id) || {xp: 0}).xp), stage: id => stageOf(P(id)),
  addXP, recordScore, recordWin, answer, award, event, registerGame, whoHTML, bindWho, homeHTML, profilePage, collectionPage, leaderboardPage, exportCode, importData,
  BADGES, TRACKS, SECRETS, GAMES, PARTNERS, ART, DEX, nextBadge: id => nextBadge(P(id)), tierNeed: (t, k) => tierNeed(TR_BY[t], k), tierName, flush: () => flushSoon(0),
  _need: need, _levelOf: levelOf, _reload: () => { S = load(); }, _save: () => save(), _test: {S: () => S, reveal: id => packReveal(P(id))}};
})();
