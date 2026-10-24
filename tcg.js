/* Card Battle School - learn the Pokémon Trading Card Game with our own cards (#/games/tcg).
   🎓 Learn: a guided practice match, one tiny step at a time, every step spoken, the next thing to tap glows with a 👆.
   ⭐ Big kid: a real (simplified) game vs a gentle friend, with 💡 hints. No losing: the friend's attacks never knock you out.
   Kid rules: 3 Prize cards, Bench holds 3, one Energy per turn, attacking ends your turn, an Energy counts for any cost.
   Uses the sound + speech engine from games.js (FentonGames.kit), so the audio rules are the same everywhere. */
window.FentonTCG = (() => {
'use strict';
const K = () => window.FentonGames.kit;
const IMG = id => 'games/tcg/' + id + '.jpg';
const TY = {fire: ['🔥', 'Fire'], lightning: ['⚡', 'Lightning'], psychic: ['🔮', 'Psychic'], darkness: ['🌙', 'Darkness'], colorless: ['⭐', 'Colorless']};
// Our own cards (HP, attacks, costs and damage from the real cards; coin flips and fancy effects left out for little kids)
const C = {
  'me55-9':   {n: 'Vulpix', hp: 70, t: 'fire', r: 1, a: [['Wild Kick', 1, 30]]},
  'me55-10':  {n: 'Ninetales', s: 'Nine-tails', hp: 110, t: 'fire', from: 'me55-9', r: 1, a: [['Flame Tail', 1, 60]]},
  'me55-13':  {n: 'Victini', s: 'Vic-tee-nee', hp: 80, t: 'fire', r: 1, a: [['V-Flame', 2, 50]]},
  'me55-14':  {n: 'Reshiram', s: 'Resh-ih-ram', hp: 130, t: 'fire', r: 2, a: [['Slash', 2, 50], ['Laser Flame', 3, 80]]},
  'me55-23':  {n: 'Pikachu', hp: 70, t: 'lightning', r: 1, a: [['Thunder Shock', 2, 20]]},
  'me55-58':  {n: 'Toxel', s: 'Tox-ell', hp: 70, t: 'lightning', r: 1, a: [['Ram', 1, 10]]},
  'me55-59':  {n: 'Toxtricity', s: 'Tox-trih-city', hp: 130, t: 'lightning', from: 'me55-58', r: 2, a: [['Mach Bolt', 2, 80]]},
  'me55-61':  {n: 'Morpeko', s: 'Mor-peck-oh', hp: 70, t: 'lightning', r: 1, a: [['Slap', 1, 30]]},
  'me55-57':  {n: 'Zeraora', s: 'Zeh-rah-or-uh', hp: 110, t: 'lightning', r: 1, a: [['Rapid Draw', 1, 20], ['Electrobullet', 2, 50]]},
  'me55-67':  {n: 'Marill', hp: 70, t: 'psychic', r: 1, a: [['Tackle', 2, 30]]},
  'me55-68':  {n: 'Azumarill', s: 'Ah-zoo-marill', hp: 130, t: 'psychic', from: 'me55-67', r: 2, a: [['Body Slam', 3, 90]]},
  'me55-73':  {n: 'Drifloon', hp: 70, t: 'psychic', r: 1, a: [['Float Up', 1, 20]]},
  'me55-65':  {n: 'Mew', hp: 60, t: 'psychic', r: 1, a: [['Psychic', 2, 10]]},
  'me55-74':  {n: 'Cresselia', s: 'Kress-ee-lee-uh', hp: 120, t: 'psychic', r: 1, a: [['Aurora Gain', 2, 30], ['Lunar Blast', 3, 100]]},
  'me55-95':  {n: 'Zorua', s: 'Zor-oo-uh', hp: 70, t: 'darkness', r: 1, a: [['Darkness Fang', 2, 40]]},
  'me55-96':  {n: 'Zoroark', s: 'Zor-oh-ark', hp: 120, t: 'darkness', from: 'me55-95', r: 1, a: [['Slashing Claw', 3, 90]]},
  'me55-93':  {n: 'Murkrow', hp: 80, t: 'darkness', r: 1, a: [['Clumsily Clutch', 1, 20]]},
  'me55-87':  {n: 'Nidoran', s: 'Nee-doh-ran', hp: 60, t: 'darkness', r: 1, a: [['Headbutt', 1, 10]]},
  'me55-97':  {n: 'Deino', s: 'Dye-no', hp: 70, t: 'darkness', r: 2, a: [['Gnaw', 1, 10], ['Headbutt', 2, 20]]},
  'me55-98':  {n: 'Zweilous', s: 'Zwhy-luss', hp: 100, t: 'darkness', from: 'me55-97', r: 2, a: [['Bite', 1, 20], ['Hammer In', 2, 50]]},
  'me55-113': {n: 'Meowth', s: 'Mee-owth', hp: 60, t: 'colorless', r: 1, a: [['Pay Day', 2, 30]]},
  'me55-120': {n: 'Igglybuff', hp: 30, t: 'colorless', r: 0, a: [['Bouncy Circle', 1, 10]]}
};
const TEAMS = {
  fire:      {name: 'Fire team', lead: 'me55-9',  cards: ['me55-9', 'me55-9', 'me55-10', 'me55-13', 'me55-14']},
  lightning: {name: 'Lightning team', lead: 'me55-23', cards: ['me55-23', 'me55-58', 'me55-59', 'me55-61', 'me55-57']},
  psychic:   {name: 'Psychic team', lead: 'me55-67', cards: ['me55-67', 'me55-67', 'me55-68', 'me55-73', 'me55-74']},
  darkness:  {name: 'Darkness team', lead: 'me55-95', cards: ['me55-95', 'me55-96', 'me55-93', 'me55-87', 'me55-97', 'me55-98']}
};
const FILES = Object.keys(C).map(IMG);
const isE = id => id.startsWith('E:'), eT = id => id.slice(2);
const nm = id => isE(id) ? TY[eT(id)][1] + ' Energy' : C[id].n;
const sp = id => isE(id) ? TY[eT(id)][1] + ' Energy' : (C[id].s || C[id].n);
const basic = id => !isE(id) && !C[id].from;
const noEmoji = t => t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B50}]/gu, '').replace(/\bHP\b/g, 'H P').replace(/\s+/g, ' ');
let U = 0; const card = id => ({u: ++U, id});
const side = () => ({deck: [], hand: [], active: null, bench: [], prizes: [], disc: []});
let S = null, $tc = null, idle = null;
const oppName = () => 'Friend';
// how speech should say names (the screen shows the real name)
const SAYFIX = Object.values(C).filter(c => c.s).sort((a, b) => b.n.length - a.n.length);
const forEar = t => { t = noEmoji(t.replace(/<[^>]+>/g, '')); SAYFIX.forEach(c => { t = t.split(c.n).join(c.s); }); return t.replace(/\bHP\b/g, 'H P'); };

/* ---------- engine ---------- */
const mon = c => ({u: c.u, id: c.id, dmg: 0, en: [], turnIn: S.turn, under: []});
const inPlay = sd => [sd.active, ...sd.bench].filter(Boolean);
const findMon = (sd, u) => inPlay(sd).find(m => m.u === u);
const hp = m => C[m.id].hp, left = m => Math.max(0, hp(m) - m.dmg);
const canPay = (m, i) => m.en.length >= C[m.id].a[i][1];
function take(arr, u) { const i = arr.findIndex(c => c.u === u); return i < 0 ? null : arr.splice(i, 1)[0]; }
function draw(sd) {
  let c = sd.deck.shift();
  if (!c && sd === S.me) c = card('E:' + S.myType);            // never "run out": a fresh Energy instead
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
  m.en.push(eT(e.id)); m.enCards = (m.enCards || []).concat(e); S.fx[m.u] = 'glow';
  if (sd === S.me) S.attached = true;
}
function evolve(sd, cu, mu) {
  const c = take(sd.hand, cu), m = findMon(sd, mu); if (!c || !m) return;
  m.under.push(m.id); m.id = c.id; m.u2 = c.u; m.turnIn = S.turn; S.fx[m.u] = 'evo';
}
function retreatTo(mu) {                                          // pay the retreat cost (discard Energy), swap
  const sd = S.me, a = sd.active, b = findMon(sd, mu); if (!a || !b || b === a) return;
  for (let i = 0; i < C[a.id].r; i++) a.en.pop();
  sd.bench[sd.bench.indexOf(b)] = a; sd.active = b; S.retreated = true; S.fx[b.u] = 'in';
}
function promote(sd, mu) { const b = findMon(sd, mu); if (!b) return; sd.bench.splice(sd.bench.indexOf(b), 1); sd.active = b; S.fx[b.u] = 'in'; }
function knockOut(sd) { const m = sd.active; if (!m) return; sd.disc.push(m); sd.active = null; }

/* ---------- start ---------- */
function newGame(mode, team) {
  K().clearTimers(); clearTimeout(idle); U = 0;
  S = {mode, me: side(), op: side(), turn: 1, whose: 'me', drew: false, attached: false, retreated: false, sel: null, need: null, busy: false, fx: {}, step: 0, over: false, msg: '', prizesShown: false};
  if (mode === 'learn') {
    S.myType = 'fire';
    S.me.hand = [card('me55-9'), card('me55-23')];
    S.me.deck = ['E:fire', 'E:fire', 'E:lightning', 'E:fire', 'E:fire', 'E:fire'].map(card);
    S.me.prizes = ['me55-10', 'E:fire', 'E:fire'].map(card);
    S.op.hand = ['me55-120', 'me55-87', 'me55-113', 'E:darkness', 'E:darkness'].map(card);
    S.op.deck = ['E:darkness', 'E:darkness', 'E:darkness'].map(card);
    S.op.prizes = ['E:darkness', 'E:darkness', 'E:darkness'].map(card);
    S.prizesShown = false;
  } else {
    const types = Object.keys(TEAMS); S.myType = team; S.team = TEAMS[team];
    const ot = K().shuffle(types.filter(t => t !== team))[0]; S.opType = ot; S.opTeam = TEAMS[ot];
    const build = (t, nE) => K().shuffle([...TEAMS[t].cards, ...Array(nE).fill('E:' + t)].map(card));
    for (const [sd, t, nE] of [[S.me, team, 9], [S.op, ot, 8]]) {
      do { sd.deck = build(t, nE); sd.hand = sd.deck.splice(0, 5); } while (!sd.hand.some(c => basic(c.id)));  // always a Basic to start
      sd.prizes = sd.deck.splice(0, 3);
    }
    // the friend sets up right away: best Basic in front, one helper on the Bench
    const ob = S.op.hand.filter(c => basic(c.id)); playBasic(S.op, ob[0].u); if (ob[1]) playBasic(S.op, ob[1].u);
    S.prizesShown = true; S.fx = {};
  }
  shell(); paint();
  if (mode === 'learn') runStep(); else coach("Alright! You're the " + S.team.name + "! Tap your deck to get a card.");
}

/* ---------- screen ---------- */
function shell() {
  const learn = S.mode === 'learn';
  K().frame('Card Battle School', `<div class="tc ${S.mode}" id="tc"></div><div class="fg-win" id="tcWin" hidden></div>`,
    `<div class="fg-seg" role="group" aria-label="Which game">
      <button class="${learn ? 'on' : ''}" data-mode="learn" aria-label="Learn"><span class="fg-em">🎓</span><span>Learn</span></button>
      <button class="${learn ? '' : 'on'}" data-mode="play" aria-label="Big kid, you play"><span class="fg-em">⭐</span><span>Big kid</span></button></div>
     ${learn ? '' : '<button class="fg-icon" id="tcHint" aria-label="Hint">💡</button>'}`);
  $tc = document.getElementById('tc');
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { K().SFX.tap(); if (b.dataset.mode === 'play') pickTeam(); else newGame('learn'); });
  const h = document.getElementById('tcHint'); if (h) h.onclick = () => { K().SFX.tap(); showHint(true); };
  $tc.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.disabled) act(b.dataset.act, b); });
}
function pickTeam() {
  K().clearTimers(); clearTimeout(idle); S = {mode: 'pick', fx: {}};
  K().frame('Card Battle School', `<div class="tc-pick">
    <div class="tc-picktitle">Pick your team!</div>
    <div class="tc-teams">${Object.entries(TEAMS).map(([k, t]) => `<button class="tc-team ${k}" data-team="${k}" aria-label="${t.name}">
      <span class="tc-teamcards">${[...new Set(t.cards)].slice(0, 3).map(id => `<img src="${IMG(id)}" alt="${C[id].n}" draggable="false">`).join('')}</span>
      <span class="tc-teamname">${TY[k][0]} ${t.name}</span></button>`).join('')}</div></div>`,
    `<div class="fg-seg" role="group" aria-label="Which game">
      <button data-mode="learn" aria-label="Learn"><span class="fg-em">🎓</span><span>Learn</span></button>
      <button class="on" data-mode="play" aria-label="Big kid, you play"><span class="fg-em">⭐</span><span>Big kid</span></button></div>`);
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { K().SFX.tap(); if (b.dataset.mode === 'learn') newGame('learn'); });
  document.querySelectorAll('[data-team]').forEach(b => b.onclick = () => { K().SFX.match(); K().say(TEAMS[b.dataset.team].name + '! Let\'s go!'); newGame('play', b.dataset.team); });
  K().say('Pick your team!');
}
const en = t => `<i class="tc-e ${t}">${TY[t][0]}</i>`;
function monHTML(m, who, big) {
  const c = C[m.id], f = S.fx[m.u] || '', ctr = Math.round(m.dmg / 10);
  return `<button class="tc-mon ${big ? 'big' : 'sm'} ${f} ${who}" data-act="${who === 'me' ? 'mon' : 'opmon'}:${m.u}" aria-label="${c.n}, ${left(m)} HP left">
    <img src="${IMG(m.id)}" alt="${c.n}" draggable="false">
    <span class="tc-hp"><b>❤️ ${left(m)}</b><i style="width:${Math.round(100 * left(m) / c.hp)}%"></i></span>
    ${ctr ? `<span class="tc-ctr">${ctr <= 8 ? '<i></i>'.repeat(ctr) : `<i></i>×${ctr}`}</span>` : ''}
    ${m.en.length ? `<span class="tc-ens">${m.en.map(en).join('')}</span>` : ''}
    ${f === 'hit' ? `<span class="tc-pop">-${S.popN}</span>` : ''}${f === 'ko' ? '<span class="tc-kotxt">Knocked Out!</span>' : ''}</button>`;
}
function sideHTML(sd, who) {
  const prizes = sd.prizes.length && S.prizesShown ? sd.prizes.map((c, i) => `<button class="tc-prize" data-act="${who === 'me' ? 'prize' : 'opprize'}:${i}" aria-label="Prize card"></button>`).join('') : '';
  const benchSlots = [0, 1, 2].map(i => sd.bench[i] ? monHTML(sd.bench[i], who, false) : `<span class="tc-slot sm" data-act="${who}slot">Bench</span>`).join('');
  return `<div class="tc-label">${who === 'me' ? 'You' : oppName()}</div>
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
    const x = C[c.id];
    return `<button class="tc-hc ${f} ${sel}" data-act="hand:${c.u}" aria-label="${x.n}"><img src="${IMG(c.id)}" alt="${x.n}" draggable="false">
      <span class="tc-tag ${x.from ? 'evo' : ''}">${x.from ? '⬆️ Evolves' : 'Basic'}</span></button>`;
  }).join('');
}
function actsHTML() {
  const a = S.me.active, mine = S.whose === 'me' && !S.busy && !S.over;
  if (!a) return `<div class="tc-acts"><span class="tc-tip">${S.mode === 'learn' && S.step < 3 ? '' : 'Tap a Pokémon to send it out!'}</span></div>`;
  const atks = C[a.id].a.map((x, i) => `<button class="tc-atk ${canPay(a, i) ? 'ok' : ''}" data-act="atk:${i}" ${mine ? '' : 'disabled'} aria-label="${x[0]}, needs ${x[1]} Energy, ${x[2]} damage">
      <span class="tc-cost">${Array.from({length: Math.max(1, x[1])}, (_, k) => `<i class="tc-e ${C[a.id].t} ${k < a.en.length ? '' : 'empty'}">${TY[C[a.id].t][0]}</i>`).join('')}</span>
      <span class="tc-an">${x[0]}</span><b>${x[2]}</b></button>`).join('');
  const play = S.mode === 'play';
  return `<div class="tc-acts">${atks}
    ${play ? `<button class="tc-btn retreat ${S.sel === 'retreat' ? 'sel' : ''}" data-act="retreat" ${mine ? '' : 'disabled'} aria-label="Swap"><span>🔄</span>Swap<small>${'●'.repeat(C[a.id].r) || 'free'}</small></button>
    <button class="tc-btn end" data-act="end" ${mine ? '' : 'disabled'} aria-label="End turn"><span>✋</span>End turn</button>` : ''}</div>`;
}
function paint() {
  if (!$tc) return;
  const step = S.mode === 'learn' ? L[S.step] : null;
  $tc.innerHTML = `
    <div class="tc-coach"><div class="tc-prof tc-trainer" role="img" aria-label="Trainer">🧢</div>
      <div class="tc-bubble"><span id="tcMsg">${S.msg}</span></div>
      <button class="fg-icon tc-hear" data-act="hear" aria-label="Hear it again">🗣️</button>
      ${step && step.next && !S.busy ? '<button class="tc-next" data-act="next" aria-label="Next">▶</button>' : ''}</div>
    <div class="tc-board">
      <div class="tc-side op ${S.whose === 'op' ? 'turn' : ''}">${sideHTML(S.op, 'op')}</div>
      <div class="tc-vs"><span>${S.whose === 'op' ? "Friend's turn" : 'Your turn!'}</span></div>
      <div class="tc-side me ${S.whose === 'me' ? 'turn' : ''}">${sideHTML(S.me, 'me')}</div>
      ${actsHTML()}
    </div>
    <div class="tc-handbox"><span class="tc-cap">Your hand</span><div class="tc-hand">${handHTML() || '<span class="tc-tip">No cards</span>'}</div></div>`;
  S.fx = {};
  glow();
}
function glow() {                                                // learn mode: the one thing to tap glows, with a finger
  $tc.querySelectorAll('.want').forEach(e => e.classList.remove('want'));
  let w = null;
  if (S.mode === 'learn' && L[S.step]) w = L[S.step].next ? 'next' : wantOf(L[S.step]);
  if (S.mode === 'play' && S.showHint) w = hint().a;
  if (!w) return;
  const sel = w.endsWith('*') ? `[data-act^="${w.slice(0, -1)}"]` : `[data-act="${w}"]`;
  const els = [...$tc.querySelectorAll(sel)]; els.forEach(e => e.classList.add('want'));
}
function coach(text) { S.msg = text; const m = document.getElementById('tcMsg'); if (m) m.innerHTML = text; K().say(forEar(text)); }
const talkMs = t => Math.max(2400, noEmoji(t).split(' ').length * 430 + 900);   // let each sentence finish before the next one
const wantOf = st => typeof st.want === 'function' ? st.want() : st.want;
const uidOf = (sd, pred) => { const c = sd.hand.find(pred); return c ? c.u : -1; };

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
function koFx(sd) { const m = sd.active; if (!m) return; S.fx[m.u] = 'ko'; K().later(() => { if (sd.active === m) { knockOut(sd); paint(); } }, 1100); }
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
function hitFx(def, dmg, att) {
  def.dmg += dmg; S.popN = dmg; S.fx[def.u] = 'hit'; if (att) S.fx[att.u] = 'lunge';
  K().SFX.hit();
}

/* ---------- taps ---------- */
function act(a, el) {
  if (a === 'hear') { K().say(forEar(document.getElementById('tcMsg').textContent)); return; }
  if (S.busy || S.over) return;
  clearTimeout(idle); S.showHint = false;
  if (S.mode === 'learn') return learnTap(a, el);
  playTap(a, el);
  if (S.mode === 'play' && !S.over) idle = setTimeout(() => showHint(false), 12000);
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
  if (k === 'deck') { draw(S.me); K().SFX.flip(); return nextStep(); }
  if (k === 'mon') {
    const c = S.me.hand.find(x => x.u === S.sel);
    if (c && isE(c.id)) { attach(S.me, c.u, u); K().SFX.match(); }
    else if (c) { evolve(S.me, c.u, u); K().SFX.match(); K().confetti(40, el); }
    S.sel = null; return nextStep();
  }
  if (k === 'atk') {
    const at = S.me.active, d = C[at.id].a[+v][2];
    S.busy = true; hitFx(S.op.active, d, at); paint(); return nextStep(1000);
  }
  if (k === 'prize') {
    const c = S.me.prizes.shift(); S.me.hand.push(c); S.fx[c.u] = 'in'; K().SFX.match(); K().confetti(30, el);
    if (!S.me.prizes.length) { paint(); return win(); }
    return nextStep();
  }
}

/* ---------- ⭐ big kid game ---------- */
function playTap(a, el) {
  const me = S.me, [k, v] = a.split(':'), u = +v;
  if (S.whose !== 'me') return;
  const nudge = t => { K().SFX.nope(); coach(t); };
  const n = id => C[id].n;
  if (S.need === 'prize' && k !== 'prize') return nudge('Tap a Prize card first!');
  if (k === 'opmon' || k === 'mon') { const m = findMon(S.op, u) || findMon(me, u); if (m && !(k === 'mon' && S.sel != null)) { K().SFX.tap(); coach(`That's ${n(m.id)}. It has ${left(m)} HP.`); if (k === 'opmon') return; } }
  if (!S.drew && k !== 'deck' && k !== 'mon' && k !== 'opmon') return nudge('First, tap your deck to get a card.');
  switch (k) {
    case 'deck':
      if (S.drew) return nudge('You got a card already.');
      draw(me); S.drew = true; K().SFX.flip();
      coach(!me.active ? 'Tap a Pokémon to send it out!' : 'Great! Now give Energy, or attack!');
      return paint();
    case 'hand': {
      const c = me.hand.find(x => x.u === u); if (!c) return;
      if (S.sel === u) { S.sel = null; K().SFX.tap(); return paint(); }
      if (isE(c.id)) {
        if (S.attached) return nudge('One Energy each turn. Try again next turn!');
        if (!me.active) return nudge('Send out a Pokémon first!');
        S.sel = u; K().SFX.tap(); coach('Now tap a Pokémon to give it Energy.'); return paint();
      }
      if (basic(c.id)) {
        if (me.active && me.bench.length >= 3) return nudge('Your Bench is full!');
        const m = playBasic(me, u); K().SFX.flip(); S.sel = null;
        coach(me.active === m ? `I choose you, ${n(m.id)}! It's in the Active spot.` : `${n(m.id)} waits on your Bench.`);
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
        retreatTo(u); S.sel = null; K().SFX.flip(); coach(`${n(m.id)} jumps in!`); return paint();
      }
      const c = me.hand.find(x => x.u === S.sel); if (!c) return;
      if (isE(c.id)) { attach(me, c.u, u); S.sel = null; K().SFX.match(); coach(`${n(m.id)} got Energy!`); return paint(); }
      if (C[c.id].from !== m.id) return nudge(`${n(c.id)} grows from ${n(C[c.id].from)}. Tap ${n(C[c.id].from)}!`);
      if (m.turnIn >= S.turn) return nudge(`${n(m.id)} just got here. Grow it next turn!`);
      const was = m.id; evolve(me, c.u, u); S.sel = null; K().SFX.match(); K().confetti(40, el);
      coach(`Awesome! ${n(was)} grew into ${n(m.id)}!`); return paint();
    }
    case 'retreat': {
      const ac = me.active; if (!ac) return;
      if (S.retreated) return nudge('You can swap once each turn.');
      if (!me.bench.length) return nudge('You need a helper on your Bench.');
      if (ac.en.length < C[ac.id].r) return nudge('Swapping costs Energy. Give it more Energy first.');
      S.sel = S.sel === 'retreat' ? null : 'retreat'; K().SFX.tap();
      coach(S.sel ? 'Tap a helper to swap in!' : 'OK, no swap.'); return paint();
    }
    case 'atk': {
      const at = me.active, x = C[at.id].a[u];
      if (!canPay(at, u)) return nudge(`${x[0]} needs more Energy. Give it Energy first!`);
      const d = S.op.active; S.sel = null; S.busy = true;
      const said = `${n(at.id)} used ${x[0]}! Bonk!`;
      hitFx(d, x[2], at); paint(); coach(said);
      K().later(() => {
        if (d.dmg >= hp(d)) { S.fx[d.u] = 'ko'; paint(); coach(`Alright! ${n(d.id)} is Knocked Out! Tap a Prize card!`);
          K().later(() => { knockOut(S.op); S.need = 'prize'; S.busy = false; paint(); }, 1100); }
        else { S.busy = false; oppTurn(); }
      }, Math.max(1600, talkMs(said) - 400));
      return;
    }
    case 'prize': {
      if (S.need !== 'prize') return nudge('Knock out a Pokémon to get a Prize card!');
      const c = me.prizes.splice(+v, 1)[0] || me.prizes.shift(); me.hand.push(c); S.fx[c.u] = 'in'; S.need = null; K().SFX.match(); K().confetti(30, el);
      if (!me.prizes.length || !inPlay(S.op).length) { paint(); return win(); }
      const left3 = me.prizes.length, said = `Awesome! You got a card! ${left3} more Prize${left3 > 1 ? 's' : ''} to go.`;
      coach(said); paint(); S.busy = true; K().later(() => { S.busy = false; oppTurn(); }, talkMs(said)); return;
    }
    case 'end': if (!me.active) return nudge('Send out a Pokémon first!'); S.sel = null; return oppTurn();
  }
}
function oppTurn() {                                              // the gentle friend: plays fair, but never knocks you out
  const o = S.op, me = S.me, n = id => C[id].n; S.whose = 'op'; S.busy = true; S.sel = null; paint();
  const steps = [];
  steps.push(() => { if (o.active) return "Your friend's turn!";
    const b = o.bench[0]; promote(o, b.u); return `${n(b.id)} moves up to battle.`; });
  steps.push(() => { draw(o); const b = o.hand.find(c => basic(c.id));          // drawing is quiet: only say what you can see change
    if (b && o.bench.length < 3) { const m = playBasic(o, b.u); return `Your friend plays ${n(m.id)}.`; }
    return null; });
  steps.push(() => { const ev = o.hand.find(c => !isE(c.id) && C[c.id].from && inPlay(o).some(m => m.id === C[c.id].from && m.turnIn < S.turn));
    if (!ev) return null; const m = inPlay(o).find(x => x.id === C[ev.id].from && x.turnIn < S.turn), was = m.id; evolve(o, ev.u, m.u); K().SFX.match();
    return `${n(was)} grew into ${n(m.id)}!`; });
  steps.push(() => { const e = o.hand.find(c => isE(c.id)); if (!e) return null; attach(o, e.u, o.active.u);
    return `Your friend gives ${n(o.active.id)} Energy.`; });
  steps.push(() => { const a = o.active, i = C[a.id].a.map((x, k) => k).filter(k => canPay(a, k) && C[a.id].a[k][2] > 0).pop(); const t = me.active;
    if (!t || i === undefined) return null;                                 // can't attack yet: say nothing
    const d = Math.max(0, Math.min(C[a.id].a[i][2], left(t) - 10));
    if (!d) { S.fx[t.u] = 'glow'; return `${n(t.id)} is too strong! No ouch.`; }
    hitFx(t, d, a); return `${n(a.id)} bumps ${n(t.id)}. Ouch!`; });
  let i = 0;
  const tick = () => {
    let r = null; while (i < steps.length && !(r = steps[i++]())) {}
    if (r) { paint(); coach(r); }
    const wait = r ? talkMs(r) : 600;
    if (i < steps.length) K().later(tick, wait);
    else K().later(() => { S.whose = 'me'; S.turn++; S.drew = S.attached = S.retreated = false; S.busy = false; paint(); coach("Let's go! Your turn! Tap your deck.");
      clearTimeout(idle); idle = setTimeout(() => showHint(false), 12000); }, wait);
  };
  K().later(tick, 700);
}
function hint() {
  const me = S.me, hand = me.hand, a = me.active, n = id => C[id].n;
  if (S.need === 'prize') return {a: 'prize:*', t: 'Tap a Prize card!'};
  if (!S.drew) return {a: 'deck', t: 'Tap your deck to get a card.'};
  if (S.sel === 'retreat') return {a: 'mon:' + (me.bench[0] || {}).u, t: 'Tap a helper to swap in!'};
  if (S.sel != null) { const c = hand.find(x => x.u === S.sel);
    if (c && isE(c.id)) { const tgt = a && C[a.id].a.some((x, i) => !canPay(a, i)) ? a : (me.bench.find(m => C[m.id].a.some((x, i) => !canPay(m, i))) || a); return {a: 'mon:' + tgt.u, t: `Tap ${n(tgt.id)} to give it Energy.`}; }
    if (c) { const m = inPlay(me).find(x => x.id === C[c.id].from && x.turnIn < S.turn); if (m) return {a: 'mon:' + m.u, t: `Tap ${n(m.id)} to grow it!`}; } }
  const b = hand.find(c => basic(c.id));
  if (!a && b) return {a: 'hand:' + b.u, t: `Tap ${n(b.id)} to send it out!`};
  const ev = hand.find(c => !isE(c.id) && C[c.id].from && inPlay(me).some(m => m.id === C[c.id].from && m.turnIn < S.turn));
  if (ev) return {a: 'hand:' + ev.u, t: `Tap ${n(ev.id)} to grow ${n(C[ev.id].from)}!`};
  const e = hand.find(c => isE(c.id));
  if (e && !S.attached) return {a: 'hand:' + e.u, t: 'Tap the Energy card.'};
  if (b && me.bench.length < 3) return {a: 'hand:' + b.u, t: `Tap ${n(b.id)}. It can be a helper!`};
  if (a) { const ok = C[a.id].a.map((x, i) => i).filter(i => canPay(a, i)); if (ok.length) { const i = ok[ok.length - 1]; return {a: 'atk:' + i, t: `Tap ${C[a.id].a[i][0]} to attack!`}; } }
  return {a: 'end', t: 'Your Pokémon needs more Energy. Tap End turn.'};
}
function showHint(spoken) { if (!S || S.mode !== 'play' || S.whose !== 'me' || S.busy || S.over) return; const h = hint(); S.showHint = true; glow(); if (spoken) coach('💡 ' + h.t); }

/* ---------- win ---------- */
function win() {
  S.over = true; S.busy = true;
  const w = document.getElementById('tcWin'); if (!w) return;
  const used = [...new Set([...inPlay(S.me), ...S.me.disc].flatMap(m => [m.id, ...m.under]))];
  const beat = [...new Set(S.op.disc.flatMap(m => [m.id, ...m.under]))];
  K().later(() => {
    w.innerHTML = `<div class="fg-winbox tc-winbox"><div class="fg-pikas"><span class="fg-bounce">🏆</span><img class="fg-bounce d1" src="games/art/me55-23.jpg" alt="Pikachu" draggable="false"><span class="fg-bounce d2">🏆</span></div>
      <div class="fg-big">You win!</div><div class="fg-stars">⭐⭐⭐</div>
      <div class="fg-sub">${S.mode === 'learn' ? 'You got all 3 Prize cards!' : 'You got all the Prize cards!'}</div>
      <div class="tc-wincards">${used.map(id => `<img src="${IMG(id)}" alt="${C[id].n}" draggable="false">`).join('')}</div>
      <div class="tc-winbtns"><button class="btn red fg-again" id="tcAgain">🔁 Play again</button>
      ${S.mode === 'learn' ? '<button class="btn blue fg-again" id="tcBig">⭐ Big kid game</button>' : '<button class="btn blue fg-again" id="tcLearn">🎓 Lesson</button>'}</div></div>`;
    w.hidden = false; K().SFX.win(); K().say(S.mode === 'learn' ? 'You did it! You got all 3 Prize cards. You win!' : 'You did it! You got all the Prize cards. You win!');
    K().confetti(120); K().later(() => K().confetti(80), 1000);
    document.getElementById('tcAgain').onclick = () => { K().SFX.tap(); S.mode === 'learn' ? newGame('learn') : pickTeam(); };
    const big = document.getElementById('tcBig'); if (big) big.onclick = () => { K().SFX.tap(); pickTeam(); };
    const ln = document.getElementById('tcLearn'); if (ln) ln.onclick = () => { K().SFX.tap(); newGame('learn'); };
  }, 900);
}

function render(app, data) { newGame('learn'); }
// test hooks for headless checks
return {render, FILES, _state: () => S, _hint: () => hint()};
})();
