/* Card Battle School - learn the Pokémon Trading Card Game with our own cards (#/games/tcg).
   🎓 Learn: a guided practice match, one tiny step at a time, every step spoken, the next thing to tap glows with a 👆.
   ⭐ Battle: a real (simplified) game vs a kind computer friend, with 💡 hints and spoken 🧑‍🏫 Professor tips.
      😊 Easy friend never knocks you out. 💪 Tricky friend plays for real (you send in a Bench Pokémon when one is Knocked Out).
   👥 2 Players: pass-and-play on one iPad.
   Rules (kid size): 3 Prize cards, a Pokémon ex is worth 2, Bench holds 3, one Energy per turn, attacking ends your turn,
   real Energy costs (colored dots = that type, ⭐ = any Energy), real Weakness (×2) and Retreat costs.
   Animations are CSS + a little JS (no libraries) and turn off with "Reduce Motion".
   Uses the sound + speech engine from games.js (FentonGames.kit), so the audio rules are the same everywhere. */
window.FentonTCG = (() => {
'use strict';
const K = () => window.FentonGames.kit;
const IMG = id => 'games/tcg/' + id + '.jpg';
const TY = {fire: ['🔥', 'Fire'], water: ['💧', 'Water'], grass: ['🍃', 'Grass'], lightning: ['⚡', 'Lightning'], psychic: ['🔮', 'Psychic'],
  fighting: ['👊', 'Fighting'], darkness: ['🌙', 'Darkness'], metal: ['⚙️', 'Metal'], colorless: ['⭐', 'Colorless']};
const CL = {F: 'fire', W: 'water', G: 'grass', L: 'lightning', P: 'psychic', D: 'darkness', M: 'metal', C: 'colorless'};
/* Our own cards. HP, type, Weakness (w), Resistance (rs), Retreat (r) and attacks [name, cost, damage, effect] are from the real cards.
   Attacks that only do tricky things (search, coin flips, Burn) are left out so every button does something a kid can see.
   Effects kept: disc (discard Energy), rest (can't attack next turn), noweak (ignores Weakness), x:'prize' (× Prizes you took),
   x:'types' (× Energy types you have), plus (+ per Energy of a type on itself), plusOpp (+ per Energy on the other Active). */
const C = {
  // 🔥 Fire
  'me55-9':     {n: 'Vulpix', hp: 70, t: 'fire', w: 'water', r: 1, a: [['Wild Kick', 'F', 30]]},
  'me55-10':    {n: 'Ninetales', s: 'Nine-tails', hp: 110, t: 'fire', from: 'me55-9', w: 'water', r: 1, a: [['Flame Tail', 'F', 60]]},
  'me55-13':    {n: 'Victini', s: 'Vic-tee-nee', hp: 80, t: 'fire', w: 'water', r: 1, a: [['V-Flame', 'FC', 50]]},
  'me55-14':    {n: 'Reshiram', s: 'Resh-ih-ram', hp: 130, t: 'fire', w: 'water', r: 2, a: [['Slash', 'FC', 50], ['Laser Flame', 'FCC', 80]]},
  'base1-46':   {n: 'Charmander', s: 'Char-man-der', hp: 50, t: 'fire', w: 'water', r: 1, a: [['Scratch', 'C', 10], ['Ember', 'FC', 30, {disc: 1}]]},
  'base1-24':   {n: 'Charmeleon', s: 'Char-meal-ee-on', hp: 80, t: 'fire', from: 'base1-46', w: 'water', r: 1, a: [['Slash', 'CCC', 30], ['Flamethrower', 'FFC', 50, {disc: 1}]]},
  'tcg-714372': {n: 'Charizard', s: 'Char-iz-ard', hp: 120, t: 'fire', from: 'base1-24', st: 2, w: 'water', rs: 'fighting', r: 3, a: [['Fire Spin', 'FFFF', 100, {disc: 2}]]},
  'me55-15':    {n: 'Fuecoco ex', s: 'Fweh-koh-koh ex', hp: 210, t: 'fire', ex: 1, w: 'water', r: 2, a: [['Cheerful Flame', 'FFC', 70, {x: 'prize'}]]},
  // 💧 Water (+ Jirachi ex, a Metal Pokémon whose Swift can use any Energy)
  'me55-16':    {n: 'Slowpoke', hp: 80, t: 'water', w: 'lightning', r: 2, a: [['Water Gun', 'WC', 20]]},
  'me55-17':    {n: 'Lapras', s: 'Lap-russ', hp: 130, t: 'water', w: 'metal', r: 2, a: [['Ice Beam', 'WCC', 80]]},
  'me55-19':    {n: 'Kyogre', s: 'Kai-oh-gur', hp: 140, t: 'water', w: 'lightning', r: 4, a: [['Hydro Pump', 'CCCC', 60, {plus: [30, 'water']}]]},
  'me55-21':    {n: 'Greninja ex', s: 'Greh-neen-ja ex', hp: 300, t: 'water', ex: 1, w: 'lightning', r: 1, a: [['Aqua Edge', 'WW', 160]]},
  'me55-102':   {n: 'Jirachi ex', s: 'Jih-rah-chee ex', hp: 160, t: 'metal', ex: 1, w: 'fire', rs: 'grass', r: 1, a: [['Swift', 'CCC', 150, {noweak: 1}]]},
  // ⚡ Lightning
  'me55-23':    {n: 'Pikachu', hp: 70, t: 'lightning', w: 'fighting', r: 1, a: [['Thunder Shock', 'LC', 20]]},
  'me55-53':    {n: 'Pikachu ex', hp: 190, t: 'lightning', ex: 1, w: 'fighting', r: 1, a: [['Thunderbolt', 'LLC', 200, {disc: 'all'}]]},
  'me55-58':    {n: 'Toxel', s: 'Tox-ell', hp: 70, t: 'lightning', w: 'fighting', r: 1, a: [['Ram', 'C', 10]]},
  'me55-59':    {n: 'Toxtricity', s: 'Tox-trih-city', hp: 130, t: 'lightning', from: 'me55-58', w: 'fighting', r: 2, a: [['Mach Bolt', 'LC', 80]]},
  'me55-61':    {n: 'Morpeko', s: 'Mor-peck-oh', hp: 70, t: 'lightning', w: 'fighting', r: 1, a: [['Slap', 'L', 30]]},
  'me55-57':    {n: 'Zeraora', s: 'Zeh-rah-or-uh', hp: 110, t: 'lightning', w: 'fighting', r: 1, a: [['Rapid Draw', 'C', 20], ['Electrobullet', 'LC', 50]]},
  // 🔮 Psychic
  'me55-67':    {n: 'Marill', hp: 70, t: 'psychic', w: 'metal', r: 1, a: [['Tackle', 'PC', 30]]},
  'me55-68':    {n: 'Azumarill', s: 'Ah-zoo-marill', hp: 130, t: 'psychic', from: 'me55-67', w: 'metal', r: 2, a: [['Body Slam', 'PPC', 90]]},
  'me55-73':    {n: 'Drifloon', hp: 70, t: 'psychic', w: 'darkness', rs: 'fighting', r: 1, a: [['Float Up', 'P', 20]]},
  'me55-65':    {n: 'Mew', hp: 60, t: 'psychic', w: 'darkness', rs: 'fighting', r: 1, a: [['Psychic', 'PP', 10, {plusOpp: 40}]]},
  'me55-74':    {n: 'Cresselia', s: 'Kress-ee-lee-uh', hp: 120, t: 'psychic', w: 'darkness', rs: 'fighting', r: 1, a: [['Aurora Gain', 'PC', 30], ['Lunar Blast', 'PCC', 100]]},
  'me55-64':    {n: 'Mewtwo ex', s: 'Mew-two ex', hp: 230, t: 'psychic', ex: 1, w: 'darkness', rs: 'fighting', r: 2, a: [['Psychic Powers', 'PPP', 230, {rest: 1}]]},
  'me55-71':    {n: 'Sylveon ex', s: 'Sill-vee-on ex', hp: 270, t: 'psychic', ex: 1, w: 'metal', r: 2, a: [['Colorful Harmony', 'PCC', 50, {x: 'types'}]]},
  // 🌙 Darkness
  'me55-95':    {n: 'Zorua', s: 'Zor-oo-uh', hp: 70, t: 'darkness', w: 'grass', r: 1, a: [['Darkness Fang', 'DD', 40]]},
  'me55-96':    {n: 'Zoroark', s: 'Zor-oh-ark', hp: 120, t: 'darkness', from: 'me55-95', w: 'grass', r: 1, a: [['Slashing Claw', 'DDC', 90]]},
  'me55-93':    {n: 'Murkrow', hp: 80, t: 'darkness', w: 'lightning', rs: 'fighting', r: 1, a: [['Clumsily Clutch', 'D', 20]]},
  'me55-87':    {n: 'Nidoran', s: 'Nee-doh-ran', hp: 60, t: 'darkness', w: 'fighting', r: 1, a: [['Headbutt', 'D', 10]]},
  'me55-97':    {n: 'Deino', s: 'Dye-no', hp: 70, t: 'darkness', w: 'grass', r: 2, a: [['Gnaw', 'D', 10], ['Headbutt', 'DC', 20]]},
  'me55-98':    {n: 'Zweilous', s: 'Zwhy-luss', hp: 100, t: 'darkness', from: 'me55-97', w: 'grass', r: 2, a: [['Bite', 'D', 20], ['Hammer In', 'DC', 50]]},
  'me55-99':    {n: 'Hydreigon', s: 'High-dry-gon', hp: 170, t: 'darkness', from: 'me55-98', st: 2, w: 'grass', r: 2, a: [['Pitch-Black Fangs', 'DC', 140]]},
  'me55-90':    {n: 'Gengar ex', s: 'Gen-gar ex', hp: 280, t: 'darkness', ex: 1, w: 'fighting', r: 2, a: [['Chaotic Pain', 'DD', 130, {noweak: 1}]]},
  // ⭐ Colorless
  'me55-113':   {n: 'Meowth', s: 'Mee-owth', hp: 60, t: 'colorless', w: 'fighting', r: 1, a: [['Pay Day', 'CC', 30]]},
  'me55-120':   {n: 'Igglybuff', hp: 30, t: 'colorless', w: 'fighting', r: 0, a: [['Bouncy Circle', 'C', 10]]}
};
const TEAMS = {
  fire:      {name: 'Fire team', show: ['base1-46', 'tcg-714372', 'me55-15'],
              cards: ['base1-46', 'base1-46', 'base1-24', 'tcg-714372', 'me55-9', 'me55-10', 'me55-15']},
  water:     {name: 'Water team', show: ['me55-17', 'me55-21', 'me55-102'],
              cards: ['me55-16', 'me55-16', 'me55-17', 'me55-19', 'me55-21', 'me55-102']},
  lightning: {name: 'Lightning team', show: ['me55-23', 'me55-53', 'me55-59'],
              cards: ['me55-23', 'me55-53', 'me55-58', 'me55-59', 'me55-61', 'me55-57']},
  psychic:   {name: 'Psychic team', show: ['me55-67', 'me55-64', 'me55-71'],
              cards: ['me55-67', 'me55-67', 'me55-68', 'me55-65', 'me55-73', 'me55-64', 'me55-71']},
  darkness:  {name: 'Darkness team', show: ['me55-97', 'me55-90', 'me55-99'],
              cards: ['me55-97', 'me55-97', 'me55-98', 'me55-99', 'me55-95', 'me55-96', 'me55-90']}
};
const FILES = Object.keys(C).map(IMG);
const isE = id => id.startsWith('E:'), eT = id => id.slice(2);
const nm = id => isE(id) ? TY[eT(id)][1] + ' Energy' : C[id].n;
const basic = id => !isE(id) && !C[id].from;
const isEx = id => !isE(id) && !!C[id].ex;
const stageOf = id => C[id].st === 2 ? 2 : C[id].from ? 1 : 0;
const noEmoji = t => t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2B50}]/gu, '').replace(/\bHP\b/g, 'H P').replace(/\s+/g, ' ');
let U = 0; const card = id => ({u: ++U, id});
const side = (name, type) => ({name, type, deck: [], hand: [], active: null, bench: [], prizes: [], disc: []});
let S = null, $tc = null, idle = null, FORCE = null;
const duo = () => S && S.mode === 'duo';
const oppName = () => duo() ? S.op.name : 'Friend';
const opWho = () => duo() ? S.op.name : 'Your friend';
// how speech should say names (the screen shows the real name)
const SAYFIX = Object.values(C).filter(c => c.s).sort((a, b) => b.n.length - a.n.length);
const forEar = t => { t = noEmoji(t.replace(/<[^>]+>/g, ' ')); SAYFIX.forEach(c => { t = t.split(c.n).join(c.s); });
  return t.replace(/\bHP\b/g, 'H P').replace(/\bex\b/g, 'E X').replace(/×2/g, 'times 2').replace(/\s+/g, ' ').trim(); };
const RM = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

/* ---------- engine ---------- */
const mon = c => ({u: c.u, id: c.id, dmg: 0, en: [], turnIn: S.turn, under: [], restUntil: 0});
const inPlay = sd => [sd.active, ...sd.bench].filter(Boolean);
const findMon = (sd, u) => inPlay(sd).find(m => m.u === u);
const hp = m => C[m.id].hp, left = m => Math.max(0, hp(m) - m.dmg);
const costOf = (id, i) => C[id].a[i][1].split('').map(ch => CL[ch]);
function payPlan(m, i) {                      // which cost dots are covered: typed dots need that Energy, ⭐ takes any
  const pool = m.en.slice(), cost = costOf(m.id, i), got = cost.map(() => false);
  cost.forEach((t, k) => { if (t !== 'colorless') { const j = pool.indexOf(t); if (j >= 0) { pool.splice(j, 1); got[k] = true; } } });
  cost.forEach((t, k) => { if (t === 'colorless' && pool.length) { pool.pop(); got[k] = true; } });
  return {cost, got};
}
const canPay = (m, i) => payPlan(m, i).got.every(Boolean);
const resting = m => m.restUntil >= S.turn;
function calc(at, i, def, sd) {               // damage this attack would do right now (with Weakness / Resistance)
  const c = C[at.id], x = c.a[i], o = x[3] || {}; let d = x[2];
  if (o.x === 'prize') d = x[2] * (3 - sd.prizes.length);
  if (o.x === 'types') d = x[2] * new Set(inPlay(sd).flatMap(m => m.en)).size;
  if (o.plus) d += o.plus[0] * at.en.filter(e => e === o.plus[1]).length;
  if (o.plusOpp && def) d += o.plusOpp * def.en.length;
  let weak = false, res = false;
  if (def && d > 0 && !o.noweak) { const dc = C[def.id];
    if (dc.w === c.t) { d *= 2; weak = true; }
    if (dc.rs === c.t) { d = Math.max(0, d - 30); res = true; } }
  return {d, weak, res};
}
const dmgText = x => { const o = x[3] || {}; return x[2] + (o.x ? '×' : (o.plus || o.plusOpp) ? '+' : ''); };
function take(arr, u) { const i = arr.findIndex(c => c.u === u); return i < 0 ? null : arr.splice(i, 1)[0]; }
function draw(sd) {
  let c = sd.deck.shift();
  if (!c && sd.human) c = card('E:' + sd.type);                  // never "run out": a fresh Energy instead
  if (c) { sd.hand.push(c); S.fx[c.u] = 'in'; }
  return c;
}
function playBasic(sd, u) {
  const c = take(sd.hand, u); if (!c) return null;
  const m = mon(c);
  if (!sd.active) sd.active = m; else sd.bench.push(m);
  S.fx[m.u] = 'in'; return m;
}
function attach(sd, eu, mu) {
  const e = take(sd.hand, eu), m = findMon(sd, mu); if (!e || !m) return;
  m.en.push(eT(e.id)); S.fx[m.u] = 'glow';
  if (sd === S.me) S.attached = true;
}
function evolve(sd, cu, mu) {
  const c = take(sd.hand, cu), m = findMon(sd, mu); if (!c || !m) return;
  m.under.push(m.id); m.id = c.id; m.turnIn = S.turn; m.restUntil = 0; S.fx[m.u] = 'evo';
  S.post.push(() => sparkle(monEl(m), 'evo'));
}
function retreatTo(mu) {                                          // pay the retreat cost (discard Energy), swap
  const sd = S.me, a = sd.active, b = findMon(sd, mu); if (!a || !b || b === a) return;
  for (let i = 0; i < C[a.id].r; i++) a.en.pop();
  sd.bench[sd.bench.indexOf(b)] = a; sd.active = b; S.retreated = true; S.fx[b.u] = 'in';
}
function promote(sd, mu) { const b = findMon(sd, mu); if (!b) return; sd.bench.splice(sd.bench.indexOf(b), 1); sd.active = b; S.fx[b.u] = 'in'; }
function knockOut(sd) { const m = sd.active; if (!m) return; sd.disc.push(m); sd.active = null; }

/* ---------- 🧑‍🏫 Professor tips: each idea once per game, the first time it matters ---------- */
const TIPS = {
  prizes: 'Knock out Pokémon to take Prize cards. Take all 3 to win!',
  energy: 'You can give just 1 Energy each turn.',
  cost: 'The colored dots on an attack show the Energy it needs. A star means any Energy works!',
  bench: 'Only the Active Pokémon can attack. Pokémon on the Bench are helpers waiting their turn.',
  evolve: 'Evolving puts the new card on top. It keeps its Energy and gets more HP!',
  stage2: 'Basic, then Stage 1, then Stage 2. Stage 2 is the biggest!',
  weak: 'Look at Weakness on the card. A Pokémon gets hit times 2 by its Weakness type!',
  ex: 'Pokémon ex are super strong. But if one is Knocked Out, the other player takes 2 Prize cards!',
  retreat: 'Swapping is called Retreat. It costs Energy. Count the stars on the Swap button.',
  rest: 'Some big attacks need a rest. Read the card to see!'
};
const tipsOn = () => K().store('tcTips') !== '0';
function tip(k) {
  if (!S || S.mode === 'learn' || !tipsOn() || S.tipped[k]) return '';
  S.tipped[k] = 1; return ` <span class="tc-proftip">🧑‍🏫 <b>Professor tip:</b> ${TIPS[k]}</span>`;
}

/* ---------- start ---------- */
const base = mode => ({mode, turn: 1, whose: 'me', drew: false, attached: false, retreated: false, sel: null, need: null, needN: 0, busy: false,
  fx: {}, post: [], hpFrom: {}, step: 0, over: false, msg: '', prizesShown: false, tipped: {}, level: K().store('tcLevel') || 'easy'});
function deal(sd, t, nE) {
  const build = () => K().shuffle([...TEAMS[t].cards, ...Array(nE).fill('E:' + t)].map(card));
  do { sd.deck = build(); sd.hand = sd.deck.splice(0, 5); } while (!sd.hand.some(c => basic(c.id)));   // always a Basic to start
  sd.prizes = sd.deck.splice(0, 3);
}
function newGame(mode, team, team2) {
  K().clearTimers(); clearTimeout(idle); U = 0;
  S = base(mode);
  if (mode === 'learn') {
    S.me = side('You', 'fire'); S.op = side('Friend', 'darkness'); S.me.human = true;
    S.me.hand = [card('me55-9'), card('me55-23')];
    S.me.deck = ['E:fire', 'E:fire', 'E:lightning', 'E:fire', 'E:fire', 'E:fire'].map(card);
    S.me.prizes = ['me55-10', 'E:fire', 'E:fire'].map(card);
    S.op.hand = ['me55-120', 'me55-87', 'me55-113', 'E:darkness', 'E:darkness'].map(card);
    S.op.deck = ['E:darkness', 'E:darkness', 'E:darkness'].map(card);
    S.op.prizes = ['E:darkness', 'E:darkness', 'E:darkness'].map(card);
  } else if (mode === 'duo') {
    S.me = side('Player 1', team); S.op = side('Player 2', team2); S.me.human = S.op.human = true; S.me.pn = 1; S.op.pn = 2;
    deal(S.me, team, 9); deal(S.op, team2, 9);
    S.prizesShown = true; S.need = 'pass';
  } else {
    const ot = (FORCE && FORCE.op) || K().shuffle(Object.keys(TEAMS).filter(t => t !== team))[0];
    S.me = side('You', team); S.op = side('Friend', ot); S.me.human = true;
    deal(S.me, team, 9); deal(S.op, ot, 8);
    if (FORCE && FORCE.hand) { S.me.deck.push(...S.me.hand); S.me.hand = FORCE.hand.map(card); }
    // the friend sets up right away: a Basic in front, one helper on the Bench
    const ob = S.op.hand.filter(c => basic(c.id)).sort((a, b) => isEx(a.id) - isEx(b.id));
    playBasic(S.op, ob[0].u); if (ob[1]) playBasic(S.op, ob[1].u);
    S.prizesShown = true; S.fx = {};
  }
  shell(); paint();
  if (mode === 'learn') return runStep();
  if (mode === 'duo') return coach(`${S.me.name}, you go first! Tap when you're ready.`);
  const t = TEAMS[team].name, oex = inPlay(S.op).find(m => isEx(m.id));
  coach(`Alright! You're the ${t}! Tap your deck to get a card.` + (oex ? ` Whoa, your friend has ${C[oex.id].n}!` : '') + tip('prizes'));
  if (oex) exEntrance(oex.id, 300);
}

/* ---------- screen ---------- */
function header(on) {
  const b = (k, em, label, aria) => `<button class="${on === k ? 'on' : ''}" data-mode="${k}" aria-label="${aria}"><span class="fg-em">${em}</span><span>${label}</span></button>`;
  return `<div class="fg-seg" role="group" aria-label="Which game">${b('learn', '🎓', 'Learn', 'Learn')}${b('play', '⭐', 'Battle', 'Battle a friend')}${b('duo', '👥', '2 Players', 'Two players')}</div>
    ${on !== 'learn' ? `<button class="fg-icon tc-tipsbtn ${tipsOn() ? '' : 'off'}" id="tcTips" aria-label="Professor tips" aria-pressed="${tipsOn()}">🧑‍🏫</button>` : ''}`;
}
function wireHeader() {
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { K().SFX.tap(); const m = b.dataset.mode; if (m === 'learn') newGame('learn'); else pickTeam(m); });
  const tb = document.getElementById('tcTips');
  if (tb) tb.onclick = () => { const on = !tipsOn(); K().store('tcTips', on ? '1' : '0'); tb.classList.toggle('off', !on); tb.setAttribute('aria-pressed', on);
    K().SFX.tap(); K().say(on ? 'Professor tips on!' : 'Professor tips off.'); };
}
function shell() {
  K().frame('Card Battle School', `<div class="tc ${S.mode === 'learn' ? 'learn' : 'play'} ${S.mode}" id="tc"></div><div class="fg-win" id="tcWin" hidden></div>`,
    header(S.mode) + (S.mode === 'learn' ? '' : '<button class="fg-icon" id="tcHint" aria-label="Hint">💡</button>'));
  $tc = document.getElementById('tc'); wireHeader();
  const h = document.getElementById('tcHint'); if (h) h.onclick = () => { K().SFX.tap(); showHint(true); };
  $tc.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.disabled) act(b.dataset.act, b); });
}
function pickTeam(mode = 'play', first = null) {
  K().clearTimers(); clearTimeout(idle); $tc = null; S = {mode: 'pick', fx: {}, post: [], hpFrom: {}};
  const who = mode === 'duo' ? (first ? 'Player 2' : 'Player 1') : '';
  const lv = K().store('tcLevel') || 'easy';
  K().frame('Card Battle School', `<div class="tc-pick">
    <div class="tc-picktitle">${who ? who + ', pick' : 'Pick'} your team!</div>
    ${mode === 'play' ? `<div class="tc-level" role="group" aria-label="Friend">
      <button class="${lv === 'easy' ? 'on' : ''}" data-level="easy" aria-label="Easy friend">😊 Easy friend</button>
      <button class="${lv === 'tricky' ? 'on' : ''}" data-level="tricky" aria-label="Tricky friend">💪 Tricky friend</button></div>` : ''}
    <div class="tc-teams">${Object.entries(TEAMS).map(([k, t]) => `<button class="tc-team ${k} ${k === first ? 'taken' : ''}" data-team="${k}" aria-label="${t.name}">
      <span class="tc-teamcards">${t.show.map(id => `<img class="${isEx(id) ? 'isex' : ''}" src="${IMG(id)}" alt="${C[id].n}" draggable="false">`).join('')}</span>
      <span class="tc-teamname">${TY[k][0]} ${t.name}</span>${k === first ? '<span class="tc-takenby">Player 1</span>' : ''}</button>`).join('')}</div></div>`,
    header(mode));
  wireHeader();
  document.querySelectorAll('[data-level]').forEach(b => b.onclick = () => { K().store('tcLevel', b.dataset.level); K().SFX.tap();
    document.querySelectorAll('[data-level]').forEach(x => x.classList.toggle('on', x === b));
    K().say(b.dataset.level === 'easy' ? 'Easy friend! Your friend will go easy on you.' : 'Tricky friend! Your friend plays for real. You can do it!'); });
  document.querySelectorAll('[data-team]').forEach(b => b.onclick = () => {
    const t = b.dataset.team; K().SFX.match();
    if (mode === 'duo' && !first) { K().say(`${TEAMS[t].name} for Player 1! Player 2, pick your team!`); return pickTeam('duo', t); }
    K().say(TEAMS[t].name + '! Alright, let\'s go!');
    if (mode === 'duo') newGame('duo', first, t); else newGame('play', t);
  });
  K().say(who ? `${who}, pick your team!` : 'Pick your team!');
}
const en = t => `<i class="tc-e ${t}">${TY[t][0]}</i>`;
const hpCls = f => f > .5 ? '' : f > .25 ? 'mid' : 'low';
function monHTML(m, who, big) {
  const c = C[m.id], f = S.fx[m.u] || '', ctr = Math.round(m.dmg / 10), L = left(m), from = S.hpFrom[m.u];
  const pct = v => Math.round(100 * v / c.hp), shown = from != null ? from : L;
  const tag = who === 'me' ? 'mon' : 'opmon';
  return `<button class="tc-mon ${big ? 'big' : 'sm'} ${f} ${who} ${c.ex ? 'isex' : ''} t-${c.t}" data-act="${tag}:${m.u}" aria-label="${c.n}, ${L} HP left">
    <img src="${IMG(m.id)}" alt="${c.n}" draggable="false">
    <span class="tc-hp ${hpCls(L / c.hp)}"><em style="width:${pct(shown)}%" ${from != null ? `data-to="${pct(L)}"` : ''}></em><i style="width:${pct(shown)}%" ${from != null ? `data-to="${pct(L)}"` : ''}></i><b ${from != null ? `data-from="${from}" data-to="${L}"` : ''}>❤️ <span>${shown}</span></b></span>
    ${ctr && f !== 'ko' ? `<span class="tc-ctr">${ctr <= 8 ? '<i></i>'.repeat(ctr) : `<i></i>×${ctr}`}</span>` : ''}
    ${m.en.length ? `<span class="tc-ens">${m.en.map(en).join('')}</span>` : ''}
    ${big && S.mode !== 'learn' && c.w ? `<span class="tc-wk" aria-label="Weakness ${TY[c.w][1]}">${TY[c.w][0]}×2</span>` : ''}
    ${resting(m) ? '<span class="tc-rest" aria-label="Resting">💤</span>' : ''}
    ${f === 'hit' ? `<span class="tc-pop ${S.popWeak ? 'weak' : ''}">-${S.popN}</span>` : ''}${f === 'ko' ? '<span class="tc-dizzy">💫</span><span class="tc-kotxt">Knocked Out!</span>' : ''}</button>`;
}
function sideHTML(sd, who) {
  const prizes = sd.prizes.length && S.prizesShown ? sd.prizes.map((c, i) => `<button class="tc-prize" data-act="${who === 'me' ? 'prize' : 'opprize'}:${i}" aria-label="Prize card"></button>`).join('') : '';
  const benchSlots = [0, 1, 2].map(i => sd.bench[i] ? monHTML(sd.bench[i], who, false) : `<span class="tc-slot sm" data-act="${who}slot">Bench</span>`).join('');
  const label = who === 'me' ? (duo() ? `${TY[sd.type][0]} ${sd.name}` : 'You') : (duo() ? `${TY[sd.type][0]} ${sd.name}` : 'Friend');
  return `<div class="tc-label">${label}</div>
    <div class="tc-prizes" data-act="${who}prizes"><span class="tc-cap">Prizes</span>${prizes}</div>
    <div class="tc-activebox">${sd.active ? monHTML(sd.active, who, true) : `<span class="tc-slot big" data-act="${who}active">Active</span>`}<span class="tc-cap">Active</span></div>
    <div class="tc-bench">${benchSlots}<span class="tc-cap">Bench</span></div>
    <div class="tc-deckbox"><button class="tc-deck" data-act="${who === 'me' ? 'deck' : 'opdeck'}" aria-label="Deck, ${sd.deck.length} cards"><b>${sd.deck.length}</b></button><span class="tc-cap">Deck</span>
      ${who === 'op' ? `<span class="tc-ophand">${'<i></i>'.repeat(Math.min(sd.hand.length, 7))}</span>` : ''}</div>`;
}
function handHTML() {
  return S.me.hand.map(c => {
    const f = S.fx[c.u] || '', sel = S.sel === c.u ? 'sel' : '';
    if (isE(c.id)) { const t = eT(c.id); return `<button class="tc-hc energy ${t} ${f} ${sel}" data-act="hand:${c.u}" aria-label="${nm(c.id)}"><span class="tc-ebig">${TY[t][0]}</span><span class="tc-hn">${TY[t][1]}<br>Energy</span></button>`; }
    const x = C[c.id], st = stageOf(c.id);
    const tg = x.ex ? ['ex', '✨ ex'] : st === 2 ? ['evo s2', '⬆️⬆️ Stage 2'] : st === 1 ? ['evo', '⬆️ Stage 1'] : ['', 'Basic'];
    return `<button class="tc-hc ${f} ${sel} ${x.ex ? 'isex' : ''}" data-act="hand:${c.u}" aria-label="${x.n}"><img src="${IMG(c.id)}" alt="${x.n}" draggable="false">
      <span class="tc-tag ${tg[0]}">${S.mode === 'learn' && st === 1 ? '⬆️ Evolves' : tg[1]}</span></button>`;
  }).join('');
}
function actsHTML() {
  const a = S.me.active, mine = S.whose === 'me' && !S.busy && !S.over && !S.need;
  if (!a) return `<div class="tc-acts"><span class="tc-tip">${S.mode === 'learn' && S.step < 3 ? '' : S.need === 'promote' ? 'Tap a Bench Pokémon to battle!' : 'Tap a Pokémon to send it out!'}</span></div>`;
  const atks = C[a.id].a.map((x, i) => {
    const {cost, got} = payPlan(a, i), r = S.op.active && S.mode !== 'learn' ? calc(a, i, S.op.active, S.me) : null;
    return `<button class="tc-atk ${canPay(a, i) && !resting(a) ? 'ok' : ''}" data-act="atk:${i}" ${mine ? '' : 'disabled'} aria-label="${x[0]}, needs ${cost.length} Energy, ${dmgText(x)} damage">
      <span class="tc-cost">${cost.map((t, k) => `<i class="tc-e ${t} ${got[k] ? '' : 'empty'}">${TY[t][0]}</i>`).join('')}</span>
      <span class="tc-an">${x[0]}</span><b>${dmgText(x)}</b>${r && r.weak ? '<span class="tc-x2">×2!</span>' : ''}</button>`; }).join('');
  if (S.mode === 'learn') return `<div class="tc-acts">${atks}</div>`;
  return `<div class="tc-acts">${atks}
    <button class="tc-btn retreat ${S.sel === 'retreat' ? 'sel' : ''}" data-act="retreat" ${mine ? '' : 'disabled'} aria-label="Swap, retreat costs ${C[a.id].r} Energy"><span>🔄</span>Swap<small>${'⭐'.repeat(C[a.id].r) || 'free'}</small></button>
    <button class="tc-btn end" data-act="end" ${mine ? '' : 'disabled'} aria-label="End turn"><span>✋</span>End turn</button></div>`;
}
function paint() {
  if (!$tc) return;
  const step = S.mode === 'learn' ? L[S.step] : null;
  const turnTxt = S.whose === 'op' ? "Friend's turn" : duo() ? `${S.me.name}'s turn!` : 'Your turn!';
  $tc.innerHTML = `
    <div class="tc-coach"><div class="tc-prof tc-trainer" role="img" aria-label="Trainer">🧢</div>
      <div class="tc-bubble"><span id="tcMsg">${S.msg}</span></div>
      <button class="fg-icon tc-hear" data-act="hear" aria-label="Hear it again">🗣️</button>
      ${step && step.next && !S.busy ? '<button class="tc-next" data-act="next" aria-label="Next">▶</button>' : ''}</div>
    <div class="tc-board" id="tcBoard">
      <div class="tc-side op ${S.whose === 'op' ? 'turn' : ''}">${sideHTML(S.op, 'op')}</div>
      <div class="tc-vs"><span>${turnTxt}</span></div>
      <div class="tc-side me ${S.whose === 'me' ? 'turn' : ''}">${sideHTML(S.me, 'me')}</div>
      ${actsHTML()}
    </div>
    <div class="tc-handbox"><span class="tc-cap">${duo() ? S.me.name + "'s hand" : 'Your hand'}</span><div class="tc-hand">${handHTML() || '<span class="tc-tip">No cards</span>'}</div></div>
    ${S.need === 'pass' ? `<div class="tc-pass"><div class="tc-passbox"><div class="tc-passem">📱➡️🙂</div>
      <div class="tc-passtxt">${S.turn > 1 ? 'Pass the iPad to' : 'First up:'}<br><b>${TY[S.me.type][0]} ${S.me.name}</b></div>
      <button class="btn green tc-ready" data-act="ready" aria-label="I'm ready">👍 I'm ready!</button></div></div>` : ''}`;
  S.fx = {}; S.popWeak = false;
  animateHP(); S.hpFrom = {};
  const post = S.post; S.post = []; post.forEach(f => { try { f(); } catch (e) {} });
  glow();
}
function animateHP() {                                           // HP bar drains from the old value, the number counts down
  $tc.querySelectorAll('.tc-hp [data-to]').forEach(el => {
    const to = +el.dataset.to;
    if (el.tagName === 'B') {
      const from = +el.dataset.from, sp = el.querySelector('span'); if (RM()) { sp.textContent = to; return; }
      const t0 = performance.now(), T = 900;
      const step = now => { const k = Math.min(1, (now - t0) / T); sp.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 2))); if (k < 1 && sp.isConnected) requestAnimationFrame(step); };
      requestAnimationFrame(step); return;
    }
    if (RM()) { el.style.width = to + '%'; return; }
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.width = to + '%'; }));
  });
}
function glow() {                                                // the one thing to tap glows, with a finger
  $tc.querySelectorAll('.want').forEach(e => e.classList.remove('want'));
  let w = null;
  if (S.mode === 'learn' && L[S.step]) w = L[S.step].next ? 'next' : wantOf(L[S.step]);
  if (S.mode !== 'learn' && S.showHint) w = hint().a;
  if (!w) return;
  const sel = w.endsWith('*') ? `[data-act^="${w.slice(0, -1)}"]` : `[data-act="${w}"]`;
  [...$tc.querySelectorAll(sel)].forEach(e => e.classList.add('want'));
}
function coach(text) { S.msg = text; const m = document.getElementById('tcMsg'); if (m) m.innerHTML = text; K().say(forEar(text)); }
const talkMs = t => Math.max(2400, noEmoji(t.replace(/<[^>]+>/g, ' ')).split(' ').length * 430 + 900);   // let each sentence finish before the next one
const wantOf = st => typeof st.want === 'function' ? st.want() : st.want;
const uidOf = (sd, pred) => { const c = sd.hand.find(pred); return c ? c.u : -1; };

/* ---------- ✨ effects: a fixed layer over the page, pieces remove themselves ---------- */
const PART = {fire: '🔥', water: '💧', lightning: '⚡', psychic: '✨', darkness: '🌑', metal: '⭐', grass: '🍃', colorless: '💫', fighting: '💥'};
let $fx = null;
function fxLayer() { if (!$fx || !$fx.isConnected) { $fx = document.createElement('div'); $fx.className = 'tc-fxl'; $fx.setAttribute('aria-hidden', 'true'); document.body.appendChild($fx); } return $fx; }
function spawn(cls, html, x, y, ms) { const d = document.createElement('div'); d.className = cls; d.style.left = x + 'px'; d.style.top = y + 'px'; d.innerHTML = html; fxLayer().appendChild(d); setTimeout(() => d.remove(), ms); return d; }
const elOf = a => $tc && $tc.querySelector(`[data-act="${a}"]`);
const monEl = m => m && (elOf('mon:' + m.u) || elOf('opmon:' + m.u));
const mid = r => [r.left + r.width / 2, r.top + r.height / 2];
function particles(n, chars, spread) {
  let h = '';
  for (let k = 0; k < n; k++) {
    const a = (Math.PI * 2 * k) / n + Math.random() * .5, d = spread * (.55 + Math.random() * .6);
    h += `<b style="--x:${Math.round(Math.cos(a) * d)}px;--y:${Math.round(Math.sin(a) * d)}px;--dl:${Math.round(Math.random() * 140)}ms;--s:${(.8 + Math.random() * .7).toFixed(2)}">${chars[k % chars.length]}</b>`;
  }
  return h;
}
function impact(type, def, big) {                                // type-colored attack effect on the Pokémon that got hit
  const el = monEl(def); if (!el || RM()) return;
  const r = el.getBoundingClientRect(), [x, y] = mid(r);
  spawn(`tc-burst t-${type} ${big ? 'big' : ''}`, `<i class="flash"></i><i class="ring"></i><i class="ring r2"></i>${particles(big ? 14 : 9, [PART[type] || '💥'], r.width * (big ? 1.05 : .8))}`, x, y, 1500);
  if (type === 'lightning') {                                    // a zig-zag bolt from the sky
    const b = spawn('tc-bolt', '<svg viewBox="0 0 60 200" preserveAspectRatio="none"><polyline points="34,0 16,64 40,92 18,146 42,170 30,200"/></svg>', x, 0, 800);
    b.style.height = y + 'px';
  }
}
function sparkle(el, kind) {                                     // gold sparkles (prize grab, evolution)
  if (!el || RM()) return;
  const r = el.getBoundingClientRect(), [x, y] = mid(r);
  spawn(`tc-burst t-gold ${kind || ''}`, `<i class="ring"></i>${particles(12, ['✨', '⭐', '🌟'], Math.max(70, r.width))}`, x, y, 1500);
}
function shake() { if (RM() || !$tc) return; $tc.classList.remove('shake'); void $tc.offsetWidth; $tc.classList.add('shake'); setTimeout(() => $tc && $tc.classList.remove('shake'), 650); }
function callout(def) {                                          // "SUPER EFFECTIVE! ×2"
  const el = monEl(def), bd = document.getElementById('tcBoard'); if (!el || !bd) return;
  const r = el.getBoundingClientRect(), b = bd.getBoundingClientRect();
  spawn('tc-callout' + (RM() ? ' still' : ''), '<span>Super effective!</span><b>×2</b>', b.left + b.width / 2, Math.max(70, r.top + r.height * .55), 2200);
}
function fly(a, toEl, html, cls) {                               // a card / energy flies from rect a to an element
  if (!a || !toEl || RM()) return;
  const b = toEl.getBoundingClientRect();
  const d = document.createElement('div'); d.className = 'tc-fly ' + (cls || '');
  d.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px;--dx:${Math.round(b.left + b.width / 2 - a.left - a.width / 2)}px;--dy:${Math.round(b.top + b.height / 2 - a.top - a.height / 2)}px;--sc:${(b.width / a.width).toFixed(2)}`;
  d.innerHTML = html; fxLayer().appendChild(d); setTimeout(() => d.remove(), 800);
}
const rectOf = a => { const e = elOf(a); return e ? e.getBoundingClientRect() : null; };
const BACK = '<span class="tc-cardback"></span>';
function exEntrance(id, delay = 0) {                             // ✨ a Pokémon ex arrives: rays, gold card, sparkles (about 2 s)
  const go = () => {
    const d = document.createElement('div'); d.className = 'tc-exin' + (RM() ? ' still' : '');
    d.innerHTML = `<div class="tc-rays"></div><div class="tc-exc"><img src="${IMG(id)}" alt="" draggable="false"><i class="tc-sheen"></i></div>
      <div class="tc-extxt">✨ ${C[id].n.replace(/ ex$/, '')} <b>ex</b> ✨</div>${RM() ? '' : `<div class="tc-exsp">${particles(16, ['✨', '⭐', '🌟'], 260)}</div>`}`;
    fxLayer().appendChild(d); setTimeout(() => d.remove(), 2300); K().SFX.shine();
  };
  if (delay) K().later(go, delay); else go();
}

/* ---------- 🎓 the guided lesson ---------- */
const meA = () => 'mon:' + S.me.active.u;
const pikaU = () => 'mon:' + S.me.bench.find(m => m.id === 'me55-23').u;
const handE = () => 'hand:' + uidOf(S.me, c => isE(c.id));
const L = [   // one idea per line, said right before the tap it asks for, and only about what is on screen now
  {m: "Alright! I'm your Trainer. Let's play cards!", next: 1},
  {m: "Your cards are down here. Your friend's cards are up top.", next: 1},
  {m: "This is Vulpix. Tap Vulpix!", want: () => 'hand:' + uidOf(S.me, c => c.id === 'me55-9')},
  {m: "I choose you, Vulpix! It's in the <b>Active</b> spot. The Active Pokémon battles!", next: 1},
  {m: "Now tap Pikachu!", want: () => 'hand:' + uidOf(S.me, c => c.id === 'me55-23')},
  {m: "Pikachu is on your <b>Bench</b>. Helpers wait here.", next: 1},
  {m: "These are <b>Prize cards</b>. Take all 3 to win!", next: 1, enter: () => { S.prizesShown = true; }},
  {m: "Your friend plays Igglybuff and Nidoran.", next: 1, enter: () => { playBasic(S.op, S.op.hand[0].u); playBasic(S.op, S.op.hand[0].u); }},
  {m: "Your turn! Tap your deck to get a card.", want: 'deck'},
  {m: "You got <b>Energy</b>! Energy gives power. Tap the Energy!", want: handE},
  {m: "Give it to Vulpix. Tap Vulpix!", want: meA},
  {m: "Vulpix has power! Let's go! Tap Wild Kick!", want: 'atk:0'},
  {m: "Bonk! Igglybuff got hurt. Red dots show the hurt.", next: 1},
  {m: "The heart shows health. It's called <b>HP</b>. Igglybuff's heart says 0!", next: 1},
  {m: "Igglybuff is <b>Knocked Out</b>. It leaves the game. Tap a Prize card!", want: 'prize:*', enter: () => { koFx(S.op); }},
  {m: "Awesome! You got Ninetales! Now it's your friend's turn.", next: 1},
  {m: "", oppTurn: 1},
  {m: "Your turn! Tap your deck.", want: 'deck', enter: () => { S.whose = 'me'; S.turn++; S.attached = false; }},
  {m: "Vulpix can <b>evolve</b>. That means grow up! Tap Ninetales.", want: () => 'hand:' + uidOf(S.me, c => c.id === 'me55-10')},
  {m: "Now tap Vulpix!", want: meA},
  {m: "Awesome! Vulpix evolved into Ninetales!", next: 1},
  {m: "Give Ninetales one Energy. Tap the Energy!", want: handE},
  {m: "Now tap Ninetales!", want: meA},
  {m: "Let's go! Tap Flame Tail!", want: 'atk:0'},
  {m: "Bonk! Nidoran's heart says 0.", next: 1},
  {m: "Nidoran is Knocked Out! Tap a Prize card!", want: 'prize:*', enter: () => { koFx(S.op); }},
  {m: "Alright! You got Energy! Now it's your friend's turn.", next: 1},
  {m: "", oppTurn: 2},
  {m: "Your turn! Tap your deck.", want: 'deck', enter: () => { S.whose = 'me'; S.turn++; S.attached = false; }},
  {m: "Lightning Energy! Pikachu loves it. Tap it!", want: () => 'hand:' + uidOf(S.me, c => c.id === 'E:lightning')},
  {m: "Helpers can get Energy too. Tap Pikachu!", want: pikaU},
  {m: "Ninetales is ready. Let's go! Tap Flame Tail!", want: 'atk:0'},
  {m: "Bonk! Meowth's heart says 0.", next: 1},
  {m: "Alright! Meowth is Knocked Out! Tap your last Prize card!", want: 'prize:*', enter: () => { koFx(S.op); }}
];
function runStep() {
  const st = L[S.step]; if (!st) return;
  if (st.enter) st.enter();
  if (st.oppTurn) return learnOpp(st.oppTurn);
  paint(); coach(st.next ? st.m + ' Tap the green arrow.' : st.m);
}
function nextStep(delay = 0) { S.busy = delay > 0; const go = () => { S.busy = false; S.step++; runStep(); }; if (delay) K().later(go, delay); else go(); }
function koFx(sd) { const m = sd.active; if (!m) return; S.fx[m.u] = 'ko'; K().SFX.faint(); K().later(() => { if (sd.active === m) { knockOut(sd); paint(); } }, 1300); }
function learnOpp(n) {                                          // the friend's turn, played out slowly with words
  S.whose = 'op'; S.busy = true;
  const o = S.op; if (o.active && o.active.dmg >= hp(o.active)) knockOut(o);
  const steps = n === 1 ? [
    ["Nidoran moves up to battle.", () => promote(o, o.bench[0].u)],
    ["Your friend gives Nidoran Energy.", () => { draw(o); attach(o, o.hand.find(c => isE(c.id)).u, o.active.u); }],
    ["Meowth sits on their Bench.", () => playBasic(o, o.hand.find(c => c.id === 'me55-113').u)],
    ["Nidoran bumps Vulpix. Just a little ouch!", () => hitFx(S.me.active, 10, o.active)]
  ] : [
    ["Meowth moves up to battle.", () => promote(o, o.bench[0].u)],
    ["Your friend gives Meowth Energy.", () => { draw(o); attach(o, o.hand.find(c => isE(c.id)).u, o.active.u); }]
  ];
  let i = 0;
  const tick = () => {
    const [t, f] = steps[i++]; f(); paint(); coach(t);
    if (i < steps.length) K().later(tick, talkMs(t)); else K().later(() => { S.busy = false; S.step++; runStep(); }, talkMs(t) + 300);
  };
  paint(); K().later(tick, 400);
}
function strike(att, def, d, weak) {                             // damage lands: HP drains, type effect, shake on big hits
  S.hpFrom[def.u] = left(def); def.dmg += d; S.popN = d; S.popWeak = weak; S.fx[def.u] = d ? 'hit' : 'glow';
  const big = d >= 100 || weak, t = C[att.id].t;
  S.post.push(() => { impact(t, def, big); if (big) shake(); if (weak) callout(def); });
  if (weak) K().SFX.super(); else K().SFX.hit();
}
function hitFx(def, dmg, att) { if (att) S.fx[att.u] = 'lunge'; strike(att || def, def, dmg, false); }

/* ---------- taps ---------- */
function act(a, el) {
  if (a === 'hear') { K().say(forEar(document.getElementById('tcMsg').innerHTML)); return; }
  if (S.busy || S.over) return;
  clearTimeout(idle); S.showHint = false;
  if (S.mode === 'learn') return learnTap(a, el);
  playTap(a, el);
  if (!S.over) idle = setTimeout(() => showHint(false), 12000);
}
function learnTap(a, el) {
  const st = L[S.step]; if (!st) return;
  const w = st.next ? 'next' : wantOf(st);
  const ok = w === a || (w.endsWith('*') && a.startsWith(w.slice(0, -1)));
  if (!ok) {                                                       // gentle: no "wrong", just point at the right thing again
    const t = $tc.querySelector('.want'); if (t) { t.classList.remove('nudge'); void t.offsetWidth; t.classList.add('nudge'); }
    const m = /mon:/.test(a) ? (findMon(S.op, +a.split(':')[1]) || findMon(S.me, +a.split(':')[1])) : null;
    K().SFX.tap(); K().say(forEar(m ? `That's ${C[m.id].n}!` : (st.next ? 'Tap the green arrow.' : st.m)));
    return;
  }
  if (a === 'next') { K().SFX.tap(); return nextStep(); }
  const [k, v] = a.split(':'), u = +v;
  if (k === 'hand') {
    const c = S.me.hand.find(x => x.u === u);
    if (basic(c.id)) { playBasic(S.me, u); K().SFX.flip(); }
    else { S.sel = u; K().SFX.tap(); }
    return nextStep();
  }
  if (k === 'deck') { const r = rectOf('deck'), c = draw(S.me); K().SFX.flip(); S.post.push(() => fly(r, elOf('hand:' + c.u), BACK, 'card')); return nextStep(); }
  if (k === 'mon') {
    const c = S.me.hand.find(x => x.u === S.sel), r = c && rectOf('hand:' + c.u);
    if (c && isE(c.id)) { attach(S.me, c.u, u); K().SFX.match(); S.post.push(() => fly(r, elOf('mon:' + u), en(eT(c.id)), 'orb')); }
    else if (c) { evolve(S.me, c.u, u); K().SFX.evo(); }
    S.sel = null; return nextStep();
  }
  if (k === 'atk') {
    const at = S.me.active, d = C[at.id].a[+v][2], def = S.op.active;
    S.busy = true; S.fx[at.u] = 'lunge'; paint();
    K().later(() => { strike(at, def, d, false); paint(); }, 380);
    return nextStep(1400);
  }
  if (k === 'prize') {
    const r = el.getBoundingClientRect(), c = S.me.prizes.shift(); S.me.hand.push(c); S.fx[c.u] = 'in'; K().SFX.match();
    S.post.push(() => fly(r, elOf('hand:' + c.u), BACK, 'card'));
    spawnPrizeSparkle(r);
    if (!S.me.prizes.length) { paint(); return win(); }
    return nextStep();
  }
}
function spawnPrizeSparkle(r) { if (!r || RM()) return; const [x, y] = mid(r); spawn('tc-burst t-gold', `<i class="ring"></i>${particles(12, ['✨', '⭐', '🌟'], 90)}`, x, y, 1500); }

/* ---------- ⭐ battle / 👥 two players ---------- */
const n = id => C[id].n;
function playTap(a, el) {
  const me = S.me, [k, v] = a.split(':'), u = +v;
  if (S.whose !== 'me') return;
  const nudge = t => { K().SFX.nope(); coach(t); };
  if (S.need === 'pass') { if (k !== 'ready') return; K().SFX.tap(); return startTurn(); }
  if (S.need === 'promote') {
    const m = k === 'mon' && me.bench.find(x => x.u === u);
    if (!m) return nudge('Tap a Pokémon on your Bench to send it out!');
    promote(me, u); S.need = null; K().SFX.flip();
    coach(`I choose you, ${n(m.id)}! Now tap your deck.`); return paint();
  }
  if (S.need === 'prize' && k !== 'prize') return nudge('Tap a Prize card first!');
  if (k === 'opmon' || k === 'mon') { const m = findMon(S.op, u) || findMon(me, u);
    if (m && !(k === 'mon' && S.sel != null)) { K().SFX.tap(); const c = C[m.id];
      coach(`That's ${c.n}. It has ${left(m)} HP.` + (c.ex ? ' It\'s a Pokémon ex, worth 2 Prize cards!' : '') + (k === 'opmon' && c.w ? ` Its Weakness is ${TY[c.w][1]}.` : ''));
      if (k === 'opmon') return; } }
  if (!S.drew && k !== 'deck' && k !== 'mon' && k !== 'opmon') return nudge('First, tap your deck to get a card.');
  switch (k) {
    case 'deck': {
      if (S.drew) return nudge('You got a card already.');
      const r = rectOf('deck'), c = draw(me); S.drew = true; K().SFX.flip();
      S.post.push(() => fly(r, elOf('hand:' + c.u), BACK, 'card'));
      coach(!me.active ? 'Tap a Pokémon to send it out!' : 'Great! Now give Energy, or attack!'); return paint();
    }
    case 'hand': {
      const c = me.hand.find(x => x.u === u); if (!c) return;
      if (S.sel === u) { S.sel = null; K().SFX.tap(); return paint(); }
      if (isE(c.id)) {
        if (S.attached) return nudge('One Energy each turn. Try again next turn!');
        if (!me.active) return nudge('Send out a Pokémon first!');
        S.sel = u; K().SFX.tap(); coach('Now tap a Pokémon to give it Energy.' + tip('energy')); return paint();
      }
      if (basic(c.id)) {
        if (me.active && me.bench.length >= 3) return nudge('Your Bench is full!');
        const m = playBasic(me, u); S.sel = null;
        const ex = isEx(m.id), act1 = me.active === m;
        if (ex) { exEntrance(m.id); S.busy = true; K().later(() => { S.busy = false; paint(); }, 1900); } else K().SFX.flip();
        coach((ex ? `Whoa! ${n(m.id)}! ` : '') + (act1 ? `I choose you, ${n(m.id)}! It's in the Active spot.` : `${n(m.id)} waits on your Bench.`)
          + (ex ? tip('ex') : act1 ? '' : tip('bench')));
        return paint();
      }
      const from = C[c.id].from, base = inPlay(me).filter(m => m.id === from);
      if (!base.length) return nudge(`${n(c.id)} grows from ${n(from)}. Play ${n(from)} first!`);
      if (!base.some(m => m.turnIn < S.turn)) return nudge(`${n(from)} just got here. Grow it next turn!`);
      S.sel = u; K().SFX.tap(); coach(`Now tap ${n(from)} to grow it!`); return paint();
    }
    case 'mon': {
      const m = findMon(me, u); if (!m) return;
      if (S.sel === 'retreat') {
        if (m === me.active) { S.sel = null; coach('OK, no swap.'); return paint(); }
        const was = me.active; retreatTo(u); S.sel = null; K().SFX.flip(); coach(`Come back, ${n(was.id)}! Go, ${n(m.id)}!`); return paint();
      }
      const c = me.hand.find(x => x.u === S.sel); if (!c) return;
      if (isE(c.id)) { const r = rectOf('hand:' + c.u); attach(me, c.u, u); S.sel = null; K().SFX.match(); S.post.push(() => fly(r, monEl(m), en(eT(c.id)), 'orb'));
        coach(`${n(m.id)} got Energy!` + tip('cost')); return paint(); }
      if (C[c.id].from !== m.id) return nudge(`${n(c.id)} grows from ${n(C[c.id].from)}. Tap ${n(C[c.id].from)}!`);
      if (m.turnIn >= S.turn) return nudge(`${n(m.id)} just got here. Grow it next turn!`);
      const was = m.id; evolve(me, c.u, u); S.sel = null; K().SFX.evo();
      coach(`What? ${n(was)} is evolving! Awesome! It grew into ${n(m.id)}!` + (stageOf(m.id) === 2 ? tip('stage2') || tip('evolve') : tip('evolve'))); return paint();
    }
    case 'retreat': {
      const ac = me.active; if (!ac) return;
      if (S.retreated) return nudge('You can swap once each turn.');
      if (!me.bench.length) return nudge('You need a helper on your Bench.' + tip('retreat'));
      if (ac.en.length < C[ac.id].r) return nudge(`Swapping ${n(ac.id)} costs ${C[ac.id].r} Energy. Give it more Energy first.` + tip('retreat'));
      S.sel = S.sel === 'retreat' ? null : 'retreat'; K().SFX.tap();
      coach(S.sel ? 'Tap a helper to swap in!' + tip('retreat') : 'OK, no swap.'); return paint();
    }
    case 'atk': {
      const at = me.active, x = C[at.id].a[u];
      if (!S.op.active) return nudge(`${opWho()} has no Pokémon to battle yet!`);
      if (resting(at)) return nudge(`${n(at.id)} is resting after ${x[0]}. Attack again next turn!` + tip('rest'));
      if (!canPay(at, u)) return nudge(`${x[0]} needs more Energy. Look at the colored dots!` + tip('cost'));
      if ((x[3] || {}).x === 'prize' && !calc(at, u, S.op.active, me).d) return nudge(`${x[0]} does 70 for each Prize card you took. Take a Prize card first!`);
      S.sel = null;
      return doAttack(me, S.op, u, ko => ko ? koByMe() : endTurn());
    }
    case 'prize': {
      if (S.need !== 'prize') return nudge('Knock out a Pokémon to get a Prize card!');
      const r = el.getBoundingClientRect(), c = me.prizes.splice(+v, 1)[0] || me.prizes.shift(); me.hand.push(c); S.fx[c.u] = 'in'; S.needN--;
      K().SFX.match(); spawnPrizeSparkle(r); S.post.push(() => fly(r, elOf('hand:' + c.u), BACK, 'card'));
      if (!me.prizes.length || !inPlay(S.op).length) { S.need = null; paint(); return win(); }
      if (S.needN > 0) { coach('One more! Tap another Prize card!'); return paint(); }
      S.need = null;
      const l3 = me.prizes.length, said = `Awesome! You got it! ${l3} more Prize${l3 > 1 ? 's' : ''} to go.`;
      coach(said); paint(); S.busy = true; K().later(() => { S.busy = false; endTurn(); }, talkMs(said)); return;
    }
    case 'end': if (!me.active) return nudge('Send out a Pokémon first!'); S.sel = null; K().SFX.tap(); return endTurn();
  }
}
function doAttack(sd, os, i, done) {                             // lunge → hit (with Weakness), effects, then done(knockedOut)
  const at = sd.active, def = os.active, x = C[at.id].a[i], o = x[3] || {};
  let {d, weak} = calc(at, i, def, sd);
  const gentle = S.mode === 'play' && sd === S.op && S.level !== 'tricky';
  if (gentle) d = Math.max(0, Math.min(d, left(def) - 10));       // 😊 Easy friend: never knocks you out
  S.busy = true; S.fx[at.u] = 'lunge'; paint();
  const said = `${n(at.id)} used ${x[0]}!` + (weak ? (d ? ` Super effective! ${TY[C[at.id].t][1]} beats ${n(def.id)}. Double damage!` : '') + tip('weak') : '')
    + (gentle && !d ? ` ${n(def.id)} is too strong! No ouch.` : '')
    + (o.noweak && C[def.id].w === C[at.id].t ? ` ${x[0]} ignores Weakness.` : '');
  coach(said);
  K().later(() => {
    strike(at, def, d, weak && d > 0);
    if (o.disc === 'all') at.en = []; else if (o.disc) at.en.splice(-o.disc, o.disc);
    if (o.rest) at.restUntil = S.turn + (duo() ? 2 : 1);
    paint();
  }, 380);
  K().later(() => done(def.dmg >= hp(def)), Math.max(1900, talkMs(said) - 300));
}
function koThen(os, after) {                                     // faint, then leave the board; after(prizeCount, mon)
  const m = os.active; S.fx[m.u] = 'ko'; paint(); K().SFX.faint();
  K().later(() => { knockOut(os); paint(); after(isEx(m.id) ? 2 : 1, m); }, 1300);
}
function koByMe() {
  koThen(S.op, (k, m) => {
    S.need = 'prize'; S.needN = Math.min(k, S.me.prizes.length); S.busy = false;
    coach(`Alright! ${n(m.id)} is Knocked Out!` + (k === 2 ? ` It's a Pokémon ex, so you get 2 Prize cards! Tap a Prize card!` + tip('ex') : ' Tap a Prize card!'));
    paint();
  });
}
function endTurn() { if (duo()) passTurn(); else oppTurn(); }
function passTurn() {
  S.sel = null; [S.me, S.op] = [S.op, S.me]; S.turn++; S.drew = S.attached = S.retreated = false; S.whose = 'me'; S.busy = false; S.need = 'pass';
  paint(); coach(`Great turn! Pass the iPad to ${S.me.name}!`);
}
function startTurn() {                                           // a human's turn begins (Battle: after the friend; 2 Players: after "I'm ready")
  S.whose = 'me'; S.busy = false; S.sel = null;
  if (!duo()) { S.turn++; S.drew = S.attached = S.retreated = false; }
  const me = S.me, who = duo() ? me.name + ', your' : 'Your';
  if (!me.active && me.bench.length) { S.need = 'promote'; paint(); coach(`${who} turn! Pick a Pokémon from your Bench to battle. Tap it!`); }
  else { S.need = null; paint(); coach(`Let's go! ${who} turn! Tap your deck.`); }
  clearTimeout(idle); idle = setTimeout(() => showHint(false), 12000);
}
function needsEnergy(m) { return C[m.id].a.some((x, i) => !canPay(m, i)); }
function bestAttack(sd, os) {                                    // the payable attack that does the most damage right now
  const a = sd.active; if (!a || !os.active || resting(a)) return -1;
  let best = -1, bd = 0;
  C[a.id].a.forEach((x, i) => { if (!canPay(a, i)) return; const d = calc(a, i, os.active, sd).d; if (d > bd) { bd = d; best = i; } });
  return best;
}
function oppTurn() {                                              // the kind friend: plays fair, talks about what it does
  const o = S.op, me = S.me; S.whose = 'op'; S.busy = true; S.sel = null; S.need = null; paint();
  let exWait = 0;
  const steps = [
    () => { if (o.active) return "Your friend's turn!";
      const b = o.bench.slice().sort((p, q) => left(q) - left(p))[0]; promote(o, b.u); return `${n(b.id)} moves up to battle.`; },
    () => { draw(o); const b = o.hand.filter(c => basic(c.id)).sort((p, q) => isEx(q.id) - isEx(p.id))[0];
      if (b && o.bench.length < 3) { const m = playBasic(o, b.u);
        if (isEx(m.id)) { exEntrance(m.id); exWait = 1900; return `Whoa! Your friend plays ${n(m.id)}!` + tip('ex'); }
        return `Your friend plays ${n(m.id)}.`; }
      return null; },
    () => { const ev = o.hand.find(c => !isE(c.id) && C[c.id].from && inPlay(o).some(m => m.id === C[c.id].from && m.turnIn < S.turn));
      if (!ev) return null; const m = inPlay(o).find(x => x.id === C[ev.id].from && x.turnIn < S.turn), was = m.id; evolve(o, ev.u, m.u); K().SFX.evo();
      return `What? ${n(was)} is evolving into ${n(m.id)}!`; },
    () => { const e = o.hand.find(c => isE(c.id)); if (!e) return null;
      const tgt = needsEnergy(o.active) ? o.active : (o.bench.find(m => isEx(m.id) && needsEnergy(m)) || o.bench.find(needsEnergy) || o.active);
      attach(o, e.u, tgt.u); return `Your friend gives ${n(tgt.id)} Energy.`; }
  ];
  let i = 0;
  const tick = () => {
    let r = null; while (i < steps.length && !(r = steps[i++]())) {}
    if (r) { paint(); coach(r); }
    const wait = (r ? talkMs(r) : 600) + exWait; exWait = 0;
    if (i < steps.length) K().later(tick, wait); else K().later(oppAttack, wait);
  };
  K().later(tick, 700);
}
function oppAttack() {
  const o = S.op, me = S.me, i = bestAttack(o, me);
  if (i < 0 || !me.active) return startTurn();
  doAttack(o, me, i, ko => {
    if (!ko) return startTurn();
    koThen(me, (k, m) => {
      const took = o.prizes.splice(0, k); o.hand.push(...took);
      const r = rectOf('opprizes'); spawnPrizeSparkle(r);
      const said = `Oh no! ${n(m.id)} is Knocked Out. ` + (k === 2 ? 'It was a Pokémon ex, so your friend takes 2 Prize cards.' : 'Your friend takes a Prize card.');
      paint(); coach(said);
      K().later(() => { if (!o.prizes.length || !inPlay(me).length) lose(); else startTurn(); }, talkMs(said));
    });
  });
}
function hint() {
  const me = S.me, hand = me.hand, a = me.active;
  if (S.need === 'pass') return {a: 'ready', t: "Tap I'm ready!"};
  if (S.need === 'promote') { const b = me.bench.slice().sort((p, q) => (bestAttackFor(q) - bestAttackFor(p)) || (left(q) - left(p)))[0]; return {a: 'mon:' + b.u, t: `Tap ${n(b.id)} to send it out!`}; }
  if (S.need === 'prize') return {a: 'prize:*', t: 'Tap a Prize card!'};
  if (!S.drew) return {a: 'deck', t: 'Tap your deck to get a card.'};
  if (S.sel === 'retreat') { const b = me.bench.slice().sort((p, q) => bestAttackFor(q) - bestAttackFor(p))[0]; return {a: 'mon:' + b.u, t: `Tap ${n(b.id)} to swap in!`}; }
  if (S.sel != null) { const c = hand.find(x => x.u === S.sel);
    if (c && isE(c.id)) { const tgt = a && needsEnergy(a) ? a : (me.bench.find(m => isEx(m.id) && needsEnergy(m)) || me.bench.find(needsEnergy) || a); return {a: 'mon:' + tgt.u, t: `Tap ${n(tgt.id)} to give it Energy.`}; }
    if (c) { const m = inPlay(me).find(x => x.id === C[c.id].from && x.turnIn < S.turn); if (m) return {a: 'mon:' + m.u, t: `Tap ${n(m.id)} to grow it!`}; } }
  const b = hand.filter(c => basic(c.id)).sort((p, q) => isEx(q.id) - isEx(p.id))[0];
  if (!a && b) return {a: 'hand:' + b.u, t: `Tap ${n(b.id)} to send it out!`};
  const ev = hand.find(c => !isE(c.id) && C[c.id].from && inPlay(me).some(m => m.id === C[c.id].from && m.turnIn < S.turn));
  if (ev) return {a: 'hand:' + ev.u, t: `Tap ${n(ev.id)} to grow ${n(C[ev.id].from)}!`};
  const e = hand.find(c => isE(c.id));
  if (e && !S.attached && inPlay(me).some(needsEnergy)) return {a: 'hand:' + e.u, t: 'Tap the Energy card.'};
  if (b && me.bench.length < 3) return {a: 'hand:' + b.u, t: `Tap ${n(b.id)}. It can be a helper!`};
  const i = bestAttack(me, S.op);
  if (i >= 0) return {a: 'atk:' + i, t: `Tap ${C[a.id].a[i][0]} to attack!`};
  if (a && !S.retreated && me.bench.length && a.en.length >= C[a.id].r && me.bench.some(m => bestAttackFor(m) > 0))
    return {a: 'retreat', t: `${n(a.id)} can't attack now. Tap Swap to send in a helper!`};
  return {a: 'end', t: 'Your Pokémon needs more Energy. Tap End turn.'};
}
function bestAttackFor(m) {                                      // how hard a Bench Pokémon could hit right now
  let bd = 0; C[m.id].a.forEach((x, i) => { if (canPay(m, i) && S.op.active) bd = Math.max(bd, calc(m, i, S.op.active, S.me).d); }); return bd;
}
function showHint(spoken) { if (!S || (S.mode !== 'play' && S.mode !== 'duo') || S.whose !== 'me' || S.busy || S.over) return; const h = hint(); S.showHint = true; glow(); if (spoken) coach('💡 ' + h.t); }

/* ---------- win / good game ---------- */
function endScreen(title, stars, sub, spoken, used) {
  S.over = true; S.busy = true; clearTimeout(idle);
  const w = document.getElementById('tcWin'); if (!w) return;
  K().later(() => {
    w.innerHTML = `<div class="fg-winbox tc-winbox"><div class="fg-pikas"><span class="fg-bounce">🏆</span><img class="fg-bounce d1" src="games/art/me55-23.jpg" alt="Pikachu" draggable="false"><span class="fg-bounce d2">🏆</span></div>
      <div class="fg-big">${title}</div><div class="fg-stars">${stars}</div>
      <div class="fg-sub">${sub}</div>
      <div class="tc-wincards">${used.map(id => `<img class="${isEx(id) ? 'isex' : ''}" src="${IMG(id)}" alt="${C[id].n}" draggable="false">`).join('')}</div>
      <div class="tc-winbtns"><button class="btn red fg-again" id="tcAgain">🔁 Play again</button>
      ${S.mode === 'learn' ? '<button class="btn blue fg-again" id="tcBig">⭐ Battle a friend</button>' : '<button class="btn blue fg-again" id="tcLearn">🎓 Lesson</button>'}</div></div>`;
    w.hidden = false; K().SFX.win(); K().say(spoken);
    K().confetti(120); K().later(() => K().confetti(80), 1000);
    const mode = S.mode;
    document.getElementById('tcAgain').onclick = () => { K().SFX.tap(); mode === 'learn' ? newGame('learn') : pickTeam(mode); };
    const big = document.getElementById('tcBig'); if (big) big.onclick = () => { K().SFX.tap(); pickTeam('play'); };
    const ln = document.getElementById('tcLearn'); if (ln) ln.onclick = () => { K().SFX.tap(); newGame('learn'); };
  }, 900);
}
const usedBy = sd => [...new Set([...inPlay(sd), ...sd.disc].flatMap(m => [m.id, ...m.under]))];
function win() {
  const sub = S.mode === 'learn' ? 'You got all 3 Prize cards!' : S.me.prizes.length ? `${duo() ? S.op.name : 'Your friend'} has no Pokémon left!` : 'You got all the Prize cards!';
  if (duo()) return endScreen(`${S.me.name} wins!`, '⭐⭐⭐', sub + ' Great battle, both of you!', `${S.me.name} wins! Great battle, both of you!`, usedBy(S.me));
  endScreen('You win!', '⭐⭐⭐', sub, S.mode === 'learn' ? 'You did it! You got all 3 Prize cards. You win!' : 'You did it! ' + sub + ' You win!', usedBy(S.me));
}
function lose() {                                                // 💪 Tricky friend won: kind words, try again
  endScreen('Good game!', '🌟', 'Your friend won this time. You were awesome! Try again?', 'Good game! Your friend won this time. You were awesome! Want to play again?', usedBy(S.me));
}

function render(app, data) { newGame('learn'); }
// test hooks for headless checks
return {render, FILES, TEAMS, _state: () => S, _hint: () => hint(), _force: f => { FORCE = f; }, _paint: () => paint(), _calc: calc, _cards: C};
})();
