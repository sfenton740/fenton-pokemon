/* Game Time - kid games for the Fenton Pokémon site. No libraries, no network needed (pictures live in games/).
   Memory Match + Who's That Pokémon? (+ Card Battle School in tcg.js).  Built for little fingers on an iPad: big buttons, no timers, no losing. */
window.FentonGames = (() => {
'use strict';
// Owned cards with clear art (art crops made once by tools/make_game_art.py from our own card scans).
const MEM = [['me55-9','Vulpix'],['me55-10','Ninetales'],['me55-11','Moltres'],['me55-16','Slowpoke'],['me55-17','Lapras'],
  ['me55-19','Kyogre'],['me55-23','Pikachu'],['me55-55','Zapdos'],['me55-63','Mewtwo'],['me55-65','Mew'],['me55-67','Marill'],
  ['me55-69','Espeon'],['me55-75','Chandelure'],['me55-81','Gimmighoul'],['me55-93','Murkrow'],['me55-95','Zorua'],
  ['me55-113','Meowth'],['me55-116','Eevee'],['me55-119','Snorlax'],['me55-120','Igglybuff'],['me55-14','Reshiram']];
// Who's That: shadows traced from official artwork (clean outlines); the reveal + picture choices are our own card art.
const WHO = [["me55-23", "Pikachu"], ["me55-116", "Eevee"], ["tcg-714372", "Charizard"], ["me55-119", "Snorlax"], ["me55-65", "Mew"], ["me55-63", "Mewtwo"], ["me55-90", "Gengar"], ["me55-9", "Vulpix"], ["me55-10", "Ninetales"], ["me55-17", "Lapras"], ["me55-16", "Slowpoke"], ["me55-67", "Marill"], ["me55-69", "Espeon"], ["me55-91", "Umbreon"], ["me55-71", "Sylveon"], ["me55-83", "Lucario"], ["me55-113", "Meowth"], ["me55-95", "Zorua"], ["me55-121", "Lugia"], ["me55-12", "Ho-Oh"], ["me55-55", "Zapdos"], ["me55-18", "Articuno"], ["me55-11", "Moltres"], ["me55-19", "Kyogre"], ["me55-21", "Greninja"], ["me55-120", "Igglybuff"], ["me55-102", "Jirachi"], ["me55-15", "Fuecoco"], ["me55-68", "Azumarill"],
  // +50 more (Oct 2026), all from our own cards too
  ["me55-129", "Alolan Exeggutor"], ["me55-3", "Volbeat"], ["me55-5", "Tropius"], ["me55-8", "Vivillon"], ["me55-13", "Victini"], ["me55-14", "Reshiram"], ["me55-20", "Palkia"], ["me55-56", "Zekrom"], ["me55-57", "Zeraora"], ["me55-59", "Toxtricity"], ["me55-61", "Morpeko"], ["me55-73", "Drifloon"], ["me55-74", "Cresselia"], ["me55-75", "Chandelure"], ["me55-76", "Xerneas"], ["me55-77", "Comfey"], ["me55-80", "Lunala"], ["me55-82", "Groudon"], ["me55-84", "Seismitoad"], ["me55-85", "Lycanroc"], ["me55-86", "Koraidon"], ["me55-87", "Nidoran"], ["me55-94", "Scraggy"], ["me55-96", "Zoroark"], ["me55-97", "Deino"], ["me55-99", "Hydreigon"], ["me55-100", "Yveltal"], ["me55-103", "Dialga"], ["me55-104", "Ferrothorn"], ["me55-105", "Solgaleo"], ["me55-106", "Zacian"], ["me55-107", "Zamazenta"], ["me55-108", "Gholdengo"], ["me55-109", "Salamence"], ["me55-112", "Kommo-o"], ["me55-114", "Kangaskhan"], ["me55-125", "Maushold"], ["tcg-716161", "Sneasel"], ["tcg-716160", "Tyranitar"], ["tcg-716206", "Scizor"], ["tcg-716191", "Crobat"], ["tcg-716158", "Genesect"], ["tcg-716208", "Arceus"], ["me4-7", "Chesnaught"], ["me55-58", "Toxel"], ["me55-78", "Cosmog"], ["me5-59", "Chi-Yu"], ["swsh12-14", "Virizion"], ["tcg-716156", "Delcatty"], ["me55-110", "Jangmo-o"]];
const NAME = Object.fromEntries([...MEM, ...WHO]);
// How speech should say the trickier names (spoken only; the screen shows the real name).
const SAY = {"Alolan Exeggutor": "Uh-low-lun Egg-zeg-yoo-tor", "Tropius": "Troh-pee-us", "Vivillon": "Viv-ee-yon", "Victini": "Vic-tee-nee", "Reshiram": "Resh-ih-ram", "Palkia": "Pal-kee-uh", "Zeraora": "Zeh-rah-or-uh", "Toxtricity": "Tox-trih-city", "Morpeko": "Mor-peck-oh", "Cresselia": "Kress-ee-lee-uh", "Chandelure": "Shan-duh-loor", "Xerneas": "Zer-nee-us", "Comfey": "Comfy", "Lunala": "Loo-nah-luh", "Seismitoad": "Size-mih-toad", "Lycanroc": "Lie-can-rock", "Koraidon": "Kor-eye-don", "Nidoran": "Nee-doh-ran", "Zoroark": "Zor-oh-ark", "Deino": "Dye-no", "Hydreigon": "High-dry-gon", "Yveltal": "Ee-vel-tall", "Dialga": "Dee-al-guh", "Solgaleo": "Sol-gah-lay-oh", "Zacian": "Zah-see-an", "Zamazenta": "Zah-mah-zen-tuh", "Gholdengo": "Gold-en-go", "Kommo-o": "Koh-moh-oh", "Kangaskhan": "Kang-gas-kahn", "Maushold": "Mouse-hold", "Sneasel": "Snee-zul", "Scizor": "Sizz-or", "Genesect": "Jen-uh-sect", "Arceus": "Ark-ee-us", "Chesnaught": "Chess-nawt", "Toxel": "Tox-ell", "Cosmog": "Coz-mog", "Chi-Yu": "Chee-yoo", "Virizion": "Vih-rye-zee-on", "Jangmo-o": "Jahng-moh-oh"};
const spoken = id => SAY[NAME[id]] || NAME[id];
const WHO_IDS = WHO.map(w => w[0]);
const ART = id => 'games/art/' + id + '.jpg', SIL = id => 'games/sil/' + id + '.png';
const FILES = [...MEM.map(m => ART(m[0])), ...WHO_IDS.map(ART), ...WHO_IDS.map(SIL)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const store = (k, v) => { try { if (v === undefined) return localStorage.getItem('fg.' + k); localStorage.setItem('fg.' + k, v); } catch (e) { return null; } };
let D = null, $app = null, timers = [];
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; try { clearTimeout(sayTimer); } catch (e) {} };
const owned = id => !D || !D.cards || !D.cards[id] || D.cards[id].qty > 0;

/* ---------- sound (WebAudio, no files) + speech ----------
   Clean on iPad speakers: one shared AudioContext at the device's own sample rate, soft sine/triangle notes only (all < 1.1 kHz),
   10 ms linear attack + exponential release (no clicks), master gain 0.45 into a gentle compressor, max 6 voices, taps debounced,
   and speech waits until the jingle has finished. testSounds() renders every sound offline and reports its peak level. */
let muted = store('mute') === '1', ac = null, master = null, sched = [], busyUntil = 0, sayTimer = null;
const lastPlay = {};
const PEAK = .18, MAX_VOICES = 6;
const N = {C4: 262, E4: 330, G4: 392, A4: 440, C5: 523, D5: 587, E5: 659, G5: 784, C6: 1047};
// [freq, start s, length s, wave, simultaneous voices at that moment] - per-note gain = PEAK / voices
const SOUNDS = {
  tap:   {gap: 90,  notes: [[N.A4, 0, .09, 'sine', 1]]},
  flip:  {gap: 120, notes: [[N.E4, 0, .09, 'sine', 2], [N.A4, .05, .11, 'sine', 2]]},
  match: {gap: 300, notes: [[N.C5, 0, .2, 'sine', 2], [N.E5, .1, .2, 'sine', 2], [N.G5, .2, .22, 'sine', 2], [N.C6, .3, .38, 'sine', 2]]},
  hit:   {gap: 250, notes: [[N.E4, 0, .1, 'triangle', 1.5], [N.C4, .07, .22, 'sine', 1.5]]},                // soft "bonk" for an attack
  nope:  {gap: 300, notes: [[N.G4, 0, .2, 'sine', 1.4], [N.E4, .17, .28, 'sine', 1.4]]},       // soft "boop boop", never harsh
  win:   {gap: 900, notes: [[N.C5, 0, .2, 'triangle', 2], [N.E5, .14, .2, 'triangle', 2], [N.G5, .28, .2, 'triangle', 2],
          [N.E5, .42, .18, 'triangle', 2], [N.G5, .56, .2, 'triangle', 2],
          [N.C5, .72, .9, 'sine', 3], [N.E5, .72, .9, 'sine', 3], [N.G5, .72, .9, 'sine', 3], [N.C6, .74, .9, 'sine', 3]]}
};
function graph(c) {                               // master gain -> soft compressor -> speakers
  const m = c.createGain(), comp = c.createDynamicsCompressor();
  m.gain.value = .45;
  comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = .005; comp.release.value = .25;
  m.connect(comp); comp.connect(c.destination); return m;
}
function audio() {
  if (muted) return null;
  try {
    if (!ac || ac.state === 'closed') { ac = new (window.AudioContext || window.webkitAudioContext)({latencyHint: 'interactive'}); master = graph(ac); }
    if (ac.state !== 'running') ac.resume();
  } catch (e) { return null; }
  return ac;
}
function unlock() {                               // iOS: start the shared context on the first touch with a silent blip
  const c = audio(); if (!c) return;
  try { const b = c.createBuffer(1, 1, c.sampleRate), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
}
['touchend', 'pointerdown', 'click'].forEach(ev => document.addEventListener(ev, unlock, {once: true, passive: true}));
document.addEventListener('visibilitychange', () => { if (!document.hidden && ac && ac.state !== 'running' && !muted) ac.resume(); });
function note(c, dest, t0, [f, at, dur, type, nv], live) {
  const t = t0 + at, end = t + dur;
  if (live) {                                     // cap voices that would actually sound at the same time
    sched = sched.filter(v => v[1] > c.currentTime);
    if (sched.filter(v => v[0] < end && v[1] > t).length >= MAX_VOICES) return;
    sched.push([t, end + .03]);
  }
  const o = c.createOscillator(), g = c.createGain(), peak = PEAK / Math.max(1, nv);
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + .01); g.gain.exponentialRampToValueAtTime(0.0001, end);
  o.connect(g); g.connect(dest); o.start(t); o.stop(end + .03);
  if (live) o.onended = () => { try { g.disconnect(); } catch (e) {} };
}
function play(name) {
  const s = SOUNDS[name], c = audio(); if (!s || !c) return;
  const now = performance.now(); if (now - (lastPlay[name] || 0) < s.gap) return; lastPlay[name] = now;   // debounce rapid taps
  const t0 = c.currentTime + .02;
  s.notes.forEach(n => note(c, master, t0, n, true));
  const len = Math.max(...s.notes.map(n => n[1] + n[2]));
  busyUntil = Math.max(busyUntil, now + (len + .05) * 1000);
}
const SFX = Object.fromEntries(Object.keys(SOUNDS).map(k => [k, () => play(k)]));
function say(text) {                              // wait for any jingle to finish, then speak
  if (muted || !('speechSynthesis' in window)) return;
  clearTimeout(sayTimer);
  sayTimer = setTimeout(() => {
    if (muted) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = .9; u.pitch = 1.2; u.volume = .9; u.lang = 'en-US'; speechSynthesis.speak(u); } catch (e) {}
  }, Math.max(0, busyUntil - performance.now()) + 120);
}
async function testSounds() {                     // render each sound offline through the same chain; report peak / clipped samples
  const out = {};
  for (const [k, s] of Object.entries(SOUNDS)) {
    const len = Math.max(...s.notes.map(n => n[1] + n[2])) + .2, rate = 48000;
    const c = new OfflineAudioContext(1, Math.ceil(len * rate), rate), m = graph(c);
    s.notes.forEach(n => note(c, m, 0, n, false));
    const d = (await c.startRendering()).getChannelData(0);
    let peak = 0, clip = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; if (a >= .999) clip++; }
    out[k] = {peak: +peak.toFixed(4), clipped: clip, maxHz: Math.max(...s.notes.map(n => n[0])), waves: [...new Set(s.notes.map(n => n[3]))].join('/')};
  }
  return out;
}
function muteBtn() { return `<button class="fg-icon" id="fgMute" aria-label="${muted ? 'Sound off' : 'Sound on'}">${muted ? '🔇' : '🔊'}</button>`; }
function bindMute() {
  const b = document.getElementById('fgMute'); if (!b) return;
  b.onclick = () => { muted = !muted; store('mute', muted ? '1' : '0'); if (muted) { clearTimeout(sayTimer); if ('speechSynthesis' in window) speechSynthesis.cancel(); }
    b.textContent = muted ? '🔇' : '🔊'; b.setAttribute('aria-label', muted ? 'Sound off' : 'Sound on'); SFX.tap(); };
}

/* ---------- confetti ---------- */
function confetti(n = 70, from = null) {
  const box = document.createElement('div'); box.className = 'fg-confetti'; box.setAttribute('aria-hidden', 'true');
  const cols = ['#e3350d', '#ffcb05', '#2a75bb', '#2e9e44', '#ff7ac6', '#fff'];
  const r = from ? from.getBoundingClientRect() : null;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    const x = r ? r.left + r.width / 2 : Math.random() * innerWidth, y = r ? r.top + r.height / 2 : -20;
    p.style.cssText = `left:${x}px;top:${y}px;background:${cols[i % cols.length]};--dx:${(Math.random() - .5) * (r ? 380 : 160)}px;` +
      `--dy:${r ? (Math.random() * 260 - 200) : innerHeight + 60}px;--rot:${Math.random() * 900 - 450}deg;animation-delay:${Math.random() * (r ? .05 : .5)}s;` +
      `animation-duration:${r ? .9 + Math.random() * .5 : 1.8 + Math.random() * 1.2}s;${i % 3 === 0 ? 'border-radius:50%;' : ''}`;
    box.appendChild(p);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 3400);
}

/* ---------- shared bits ---------- */
const balls = n => `<span class="fg-balls">${'<span class="mini-ball"></span>'.repeat(n)}</span>`;
function frame(title, inner, bar) {
  $app.innerHTML = `<div class="fg" id="fg">
    <div class="fg-bar"><a class="fg-icon" href="#/games" aria-label="All games">🎮</a>${bar}${muteBtn()}</div>${inner}</div>`;
  bindMute();
}

/* ---------- menu ---------- */
function menu() {
  const pika = 'me55-23';
  $app.innerHTML = `<div class="fg" id="fg">
    <div class="fg-hello"><span class="fg-bounce">⭐</span> Game Time! <span class="fg-bounce d2">⭐</span></div>
    <div class="fg-menu">
      <a class="fg-pick red" href="#/games/memory" data-say="Memory Match!">
        <span class="fg-pickart"><span class="fg-back mini"></span><span class="fg-face mini"><img src="${ART(pika)}" alt="" draggable="false"></span><span class="fg-back mini"></span></span>
        <span class="fg-pickname">Memory Match</span><span class="fg-picksub">find the pairs 🃏🃏</span></a>
      <a class="fg-pick blue" href="#/games/who" data-say="Who's that Pokémon?">
        <span class="fg-pickart"><span class="fg-silmini"><img src="${SIL(pika)}" alt="" draggable="false"><b>?</b></span></span>
        <span class="fg-pickname">Who's That Pokémon?</span><span class="fg-picksub">guess the shadow 👀</span></a>
      <a class="fg-pick green wide" href="#/games/tcg" data-say="Card Battle School!">
        <span class="fg-pickart tcgpick"><img class="l" src="games/tcg/me55-9.jpg" alt="" draggable="false"><span class="vs">VS</span><img class="r" src="games/tcg/me55-113.jpg" alt="" draggable="false"></span>
        <span class="fg-pickname">Card Battle School</span><span class="fg-picksub">learn to play the card game ⚔️</span></a>
    </div>
    <div class="fg-menu-foot">${muteBtn()}<span>Pictures are from our own cards!</span></div></div>`;
  bindMute();
  $app.querySelectorAll('[data-say]').forEach(a => a.addEventListener('click', () => { SFX.tap(); say(a.dataset.say); }));
}

/* ---------- Memory Match ---------- */
let M = null;
function memory() {
  const hard = store('memHard') === '1', pairs = hard ? 6 : 3;
  const pool = shuffle(MEM.filter(m => owned(m[0]))).slice(0, pairs);
  M = {hard, pairs, deck: shuffle([...pool, ...pool]).map((m, i) => ({i, id: m[0], name: m[1], up: false, done: false})), open: [], moves: 0, found: 0, lock: false};
  frame('Memory Match', `
    <div class="fg-grid mem" id="memGrid">${M.deck.map(c => `<button class="fg-card" data-i="${c.i}" aria-label="Card ${c.i + 1}">
      <span class="fg-in"><span class="fg-back"></span><span class="fg-face"><img src="${ART(c.id)}" alt="${c.name}" draggable="false"></span></span></button>`).join('')}</div>
    <div class="fg-win" id="memWin" hidden></div>`,
    `<div class="fg-seg" role="group" aria-label="How hard">
      <button class="${hard ? '' : 'on'}" data-hard="0" aria-label="Easy, 6 cards">${balls(1)}<span>Easy</span></button>
      <button class="${hard ? 'on' : ''}" data-hard="1" aria-label="Hard, 12 cards">${balls(3)}<span>Hard</span></button></div>
     <div class="fg-moves" id="memMoves" ${hard ? '' : 'hidden'}>Moves <b>0</b></div>`);
  document.querySelectorAll('[data-hard]').forEach(b => b.onclick = () => { SFX.tap(); store('memHard', b.dataset.hard); clearTimers(); memory(); });
  document.getElementById('memGrid').addEventListener('click', e => { const b = e.target.closest('.fg-card'); if (b) flip(+b.dataset.i, b); });
  sizeGrid();
}
function sizeGrid() {
  const g = document.getElementById('memGrid'); if (!g) return;
  const n = g.children.length, top = g.getBoundingClientRect().top + scrollY;
  const W = g.clientWidth, H = Math.max(260, innerHeight - top - 18), gap = 12;
  let best = {w: 0, cols: 3};
  for (let cols = 2; cols <= 6; cols++) {
    const rows = Math.ceil(n / cols); if (n % cols && cols > 3 && n % cols < cols / 2) continue;   // avoid lonely last rows
    const w = Math.min((W - gap * (cols - 1)) / cols, ((H - gap * (rows - 1)) / rows) * 5 / 7, 240);
    if (w > best.w + 1) best = {w, cols};
  }
  g.style.gridTemplateColumns = `repeat(${best.cols}, ${Math.floor(best.w)}px)`;
}
function flip(i, el) {
  const c = M.deck[i]; if (M.lock || c.up || c.done) return;
  c.up = true; el.classList.add('up'); SFX.flip(); M.open.push({c, el});
  if (M.open.length < 2) return;
  M.moves++; const mv = document.querySelector('#memMoves b'); if (mv) mv.textContent = M.moves;
  const [a, b] = M.open; M.open = []; M.lock = true;
  if (a.c.id === b.c.id) {
    later(() => {
      a.c.done = b.c.done = true; a.el.classList.add('done'); b.el.classList.add('done');
      SFX.match(); say(a.c.name + '!'); confetti(26, b.el); M.found++; M.lock = false;
      if (M.found === M.pairs) later(memWin, 900);
    }, 380);
  } else {
    later(() => { a.c.up = b.c.up = false; a.el.classList.remove('up'); b.el.classList.remove('up'); M.lock = false; }, 1100);
  }
}
function memWin() {
  const w = document.getElementById('memWin'); if (!w) return;
  const got = [...new Set(M.deck.map(c => c.id))];
  w.innerHTML = `<div class="fg-winbox"><div class="fg-pikas"><span class="fg-bounce">⚡</span><img class="fg-bounce d1" src="${ART('me55-23')}" alt="Pikachu" draggable="false"><span class="fg-bounce d2">⚡</span></div>
    <div class="fg-big">You did it!</div><div class="fg-stars">⭐⭐⭐</div>
    ${M.hard ? `<div class="fg-sub">All 6 pairs in ${M.moves} moves!</div>` : ''}
    <div class="fg-found">${got.map(id => `<img src="${ART(id)}" alt="${NAME[id]}" draggable="false">`).join('')}</div>
    <button class="btn red fg-again" id="memAgain">🔁 Play again</button></div>`;
  w.hidden = false; SFX.win(); say('You did it!'); confetti(110); later(() => confetti(70), 900);
  document.getElementById('memAgain').onclick = () => { SFX.tap(); clearTimers(); memory(); };
}

/* ---------- Who's That Pokémon? ---------- */
let W = {stars: 0, deck: []};
function who() {
  const names = store('whoNames') === '1';
  if (!W.deck.length) W.deck = shuffle(WHO_IDS.filter(owned));
  const ans = W.deck.pop(), others = shuffle(WHO_IDS.filter(id => id !== ans && owned(id))).slice(0, 2), opts = shuffle([ans, ...others]);
  W.ans = ans; W.tries = 0; W.solved = false;
  frame("Who's That Pokémon?", `
    <div class="fg-who">
      <div class="fg-q"><div class="fg-rays"></div>
        <img class="fg-sil" id="whoSil" src="${SIL(ans)}" alt="Mystery Pokémon shadow" draggable="false">
        <img class="fg-reveal" id="whoArt" src="${ART(ans)}" alt="${NAME[ans]}" draggable="false">
        <button class="fg-icon fg-hear" id="whoHear" aria-label="Hear it again">🗣️</button>
        <div class="fg-qtext" id="whoText">Who's that Pokémon?</div></div>
      <div class="fg-opts ${names ? 'names' : 'pics'}" id="whoOpts">${opts.map(id => `<button class="fg-opt" data-id="${id}" aria-label="${NAME[id]}">
        ${names ? `<span>${NAME[id]}</span>` : `<img src="${ART(id)}" alt="${NAME[id]}" draggable="false">`}</button>`).join('')}</div>
      <button class="btn red fg-next" id="whoNext" hidden>Next ▶</button>
    </div>`,
    `<div class="fg-seg" role="group" aria-label="How to answer">
      <button class="${names ? '' : 'on'}" data-names="0" aria-label="Pictures"><span class="fg-em">🖼️</span><span>Pictures</span></button>
      <button class="${names ? 'on' : ''}" data-names="1" aria-label="Big kid, names"><span class="fg-em">🔤</span><span>Big kid</span></button></div>
     <div class="fg-starbox" aria-label="${W.stars} stars"><span>⭐</span><b id="whoStars">${W.stars}</b></div>`);
  document.querySelectorAll('[data-names]').forEach(b => b.onclick = () => { SFX.tap(); store('whoNames', b.dataset.names); W.deck.push(W.ans); clearTimers(); who(); });
  document.getElementById('whoHear').onclick = () => say(W.solved ? "It's " + spoken(W.ans) + '!' : "Who's that Pokémon?");
  document.getElementById('whoOpts').addEventListener('click', e => { const b = e.target.closest('.fg-opt'); if (b) answer(b); });
  document.getElementById('whoNext').onclick = () => { SFX.tap(); clearTimers(); who(); scrollTo(0, 0); };
  say("Who's that Pokémon?");
}
function answer(b) {
  if (W.solved || b.disabled) return;
  if (b.dataset.id !== W.ans) {      // gentle: wiggle, fade that one out, try again. Stars never go down.
    W.tries++; SFX.nope(); b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle');
    later(() => { b.disabled = true; b.classList.add('gone'); }, 450); return;
  }
  W.solved = true; W.stars++;
  document.getElementById('fg').querySelector('.fg-q').classList.add('solved');
  b.classList.add('right'); document.querySelectorAll('.fg-opt').forEach(o => { if (o !== b) o.classList.add('gone'); });
  const s = document.getElementById('whoStars'); s.textContent = W.stars; s.parentElement.classList.add('pop');
  document.getElementById('whoText').innerHTML = `It's <b>${NAME[W.ans]}</b>!`;
  const big = W.stars % 5 === 0;                   // every 5 stars: fanfare instead of the jingle (speech waits for it)
  if (big) { SFX.win(); document.getElementById('whoText').innerHTML = `It's <b>${NAME[W.ans]}</b>! ${W.stars} stars! 🎉`; } else SFX.match();
  say("It's " + spoken(W.ans) + '!'); confetti(big ? 140 : 60);
  document.getElementById('whoNext').hidden = false;
}

/* ---------- entry ---------- */
function render(app, data, sub) {
  $app = app; D = data; clearTimers();
  if (sub === 'memory') return memory();
  if (sub === 'who') return who();
  if (sub === 'tcg' && window.FentonTCG) return window.FentonTCG.render(app, data);
  return menu();
}
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(sizeGrid, 120); });
addEventListener('orientationchange', () => setTimeout(sizeGrid, 300));
// shared helpers for tcg.js (Card Battle School) so it uses the same sound engine, speech and look
const kit = {say, SFX, confetti, frame, later, clearTimers, store, shuffle, owned, spoken, isMuted: () => muted};
return {render, FILES, stop: clearTimers, testSounds, kit};
})();
