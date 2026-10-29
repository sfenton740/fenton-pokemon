/* Game Time - kid games for the Fenton Pokémon site. No libraries, no network needed (pictures live in games/).
   Memory Match + Who's That Pokémon? (+ Card Battle School in tcg.js, Pokémon Trivia in trivia.js).  Built for little fingers on an iPad: big buttons, no timers. (Who's That: a wrong guess costs 1 star, never below 0.) */
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
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; try { clearTimeout(sayTimer); sayNext = null; } catch (e) {} };
const owned = id => !D || !D.cards || !D.cards[id] || D.cards[id].qty > 0;

/* ---------- sound (WebAudio, no files) + speech ----------
   Clean on iPad speakers: one shared AudioContext at the device's own sample rate, soft sine/triangle notes only (all < 1.1 kHz),
   10 ms linear attack + exponential release (no clicks), master gain 0.45 into a gentle compressor, max 6 voices, taps debounced,
   and speech waits until the jingle has finished. testSounds() renders every sound offline and reports its peak level. */
let muted = store('mute') === '1', ac = null, master = null, sched = [], busyUntil = 0, sayTimer = null;
const lastPlay = {}; let lastAny = 0;
const PEAK = .18, MAX_VOICES = 6, ATK = .018, TAIL = .025;
const N = {C4: 262, E4: 330, G4: 392, A4: 440, C5: 523, D5: 587, E5: 659, G5: 784, C6: 1047};
// [freq, start s, length s, wave, simultaneous voices at that moment] - per-note gain = PEAK / voices
const SOUNDS = {
  tap:   {gap: 120, notes: [[N.A4, 0, .14, 'sine', 1.6]]},                                   // soft "tick", not a pop
  flip:  {gap: 150, notes: [[N.E4, 0, .14, 'sine', 2], [N.A4, .07, .16, 'sine', 2]]},
  match: {gap: 300, notes: [[N.C5, 0, .2, 'sine', 2], [N.E5, .1, .2, 'sine', 2], [N.G5, .2, .22, 'sine', 2], [N.C6, .3, .38, 'sine', 2]]},
  hit:   {gap: 300, notes: [[N.E5, 0, .16, 'sine', 2.2], [N.C5, .1, .26, 'sine', 2.2]]},                     // gentle "boing" for an attack
  aww:   {gap: 400, notes: [[N.E5, 0, .26, 'sine', 1.8], [N.C5, .2, .26, 'sine', 1.8], [N.A4, .4, .42, 'sine', 1.8]]},  // soft falling "aww" (wrong guess)
  nope:  {gap: 300, notes: [[N.G4, 0, .2, 'sine', 1.4], [N.E4, .17, .28, 'sine', 1.4]]},       // soft "boop boop", never harsh
  win:   {gap: 900, notes: [[N.C5, 0, .2, 'triangle', 2], [N.E5, .14, .2, 'triangle', 2], [N.G5, .28, .2, 'triangle', 2],
          [N.E5, .42, .18, 'triangle', 2], [N.G5, .56, .2, 'triangle', 2],
          [N.C5, .72, .9, 'sine', 3], [N.E5, .72, .9, 'sine', 3], [N.G5, .72, .9, 'sine', 3], [N.C6, .74, .9, 'sine', 3]]},
  // 🤫 secret found (Trivia's hidden Master Trainer mode): a sparkly rising run, then a shimmering chord
  secret: {gap: 1500, notes: [[N.G4, 0, .16, 'sine', 2], [N.C5, .08, .16, 'sine', 2], [N.E5, .16, .16, 'sine', 2], [N.G5, .24, .16, 'sine', 2],
          [N.C6, .32, .22, 'triangle', 2], [N.G5, .44, .14, 'sine', 2], [N.C6, .52, .14, 'sine', 2],
          [N.C5, .66, 1.0, 'sine', 4], [N.E5, .66, 1.0, 'sine', 4], [N.G5, .68, 1.0, 'sine', 4], [N.C6, .70, 1.0, 'triangle', 4]]},
  // Card Battle School: ⚡ super effective hit (bright two-step "pow-PING")
  super: {gap: 300, notes: [[N.G4, 0, .12, 'triangle', 2], [N.C5, .08, .12, 'triangle', 2], [N.E5, .16, .32, 'sine', 2], [N.G5, .16, .32, 'sine', 2]]},
  // ✨ a Pokémon ex enters: sparkly run, then a warm golden chord
  shine: {gap: 1200, notes: [[N.C5, 0, .14, 'sine', 2], [N.E5, .07, .14, 'sine', 2], [N.G5, .14, .14, 'sine', 2], [N.C6, .21, .2, 'triangle', 2],
          [N.G5, .34, .12, 'sine', 2], [N.C6, .42, .12, 'sine', 2],
          [N.C5, .56, .8, 'sine', 4], [N.E5, .56, .8, 'sine', 4], [N.G5, .58, .8, 'sine', 4], [N.C6, .6, .8, 'triangle', 4]]},
  // 💫 Knocked Out: a soft falling "dee-doo-dum"
  faint: {gap: 500, notes: [[N.G4, 0, .22, 'sine', 1.6], [N.E4, .18, .24, 'sine', 1.6], [N.C4, .38, .5, 'sine', 1.6]]},
  // 🌟 evolution: a rising scale that blooms into a chord
  evo:   {gap: 800, notes: [[N.C4, 0, .14, 'sine', 2], [N.E4, .1, .14, 'sine', 2], [N.G4, .2, .14, 'sine', 2], [N.C5, .3, .14, 'sine', 2],
          [N.E5, .4, .14, 'sine', 2], [N.G5, .5, .14, 'sine', 2], [N.C5, .62, .6, 'sine', 3], [N.E5, .62, .6, 'sine', 3], [N.G5, .64, .6, 'triangle', 3]]},
  // 🔔 gentle "ding-dong" instead of repeating a line the kids already heard
  chime: {gap: 500, notes: [[N.G5, 0, .22, 'sine', 3], [N.E5, .1, .34, 'sine', 3]]},
  // 🆙 Trainer level up: a bright climbing fanfare that lands on a big chord
  levelup: {gap: 1500, notes: [[N.G4, 0, .12, 'triangle', 2], [N.C5, .1, .12, 'triangle', 2], [N.E5, .2, .12, 'triangle', 2], [N.G5, .3, .14, 'triangle', 2],
          [N.E5, .42, .1, 'sine', 2], [N.G5, .5, .1, 'sine', 2], [N.C6, .58, .2, 'triangle', 2],
          [N.C5, .78, 1.0, 'sine', 4], [N.E5, .78, 1.0, 'sine', 4], [N.G5, .8, 1.0, 'sine', 4], [N.C6, .82, 1.0, 'triangle', 4]]}
};
function graph(c) {                               // master gain -> soft compressor -> speakers
  const m = c.createGain(), comp = c.createDynamicsCompressor();
  m.gain.value = .38;                            // Oct 28: a little softer than before (.45)
  comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = .005; comp.release.value = .25;
  m.connect(comp); comp.connect(c.destination); return m;
}
let resuming = false;
function wake() {                                 // resume the ONE context only if iOS paused it (never recreated, never spammed)
  if (!ac || ac.state === 'running' || resuming) return;
  resuming = true; Promise.resolve(ac.resume()).catch(() => {}).then(() => { resuming = false; });
}
function audio() {
  if (muted) return null;
  try {
    if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)({latencyHint: 'interactive'}); master = graph(ac); }
    wake();
  } catch (e) { return null; }
  return ac;
}
function unlock() {                               // iOS: start the shared context on the first touch with a silent blip
  const c = audio(); if (!c) return;
  try { const b = c.createBuffer(1, 1, c.sampleRate), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
}
['touchend', 'pointerdown', 'click'].forEach(ev => document.addEventListener(ev, unlock, {once: true, passive: true}));
document.addEventListener('visibilitychange', () => { if (!document.hidden && !muted) wake(); });   // after the iPad wakes up
function note(c, dest, t0, [f, at, dur, type, nv], live) {
  const t = t0 + at, end = t + dur;
  if (live) {                                     // cap voices that would actually sound at the same time
    sched = sched.filter(v => v[1] > c.currentTime);
    if (sched.filter(v => v[0] < end && v[1] > t).length >= MAX_VOICES) return;
    sched.push([t, end + TAIL + .03]);
  }
  // Envelope, all scheduled ramps (no instant jumps): start at exactly 0, 18 ms linear rise, smooth exponential fall to 0.001,
  // then a 25 ms linear fade to exactly 0. The oscillator stops 30 ms AFTER it is silent, so nothing is ever cut while loud.
  const o = c.createOscillator(), g = c.createGain(), peak = PEAK / Math.max(1, nv);
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + ATK);
  g.gain.exponentialRampToValueAtTime(.001, end); g.gain.linearRampToValueAtTime(0, end + TAIL);
  o.connect(g); g.connect(dest); o.start(t); o.stop(end + TAIL + .03);
  if (live) o.onended = () => { try { g.disconnect(); } catch (e) {} };
}
function play(name) {
  const s = SOUNDS[name], c = audio(); if (!s || !c) return;
  const now = performance.now(); if (now - (lastPlay[name] || 0) < s.gap) return; lastPlay[name] = now;   // debounce rapid taps
  lastAny = now;
  const t0 = c.currentTime + .02;
  s.notes.forEach(n => note(c, master, t0, n, true));
  const len = Math.max(...s.notes.map(n => n[1] + n[2]));
  busyUntil = Math.max(busyUntil, now + (len + .05) * 1000);
}
const SFX = Object.fromEntries(Object.keys(SOUNDS).map(k => [k, () => play(k)]));
// Speech never gets cut off mid-word (that clicks): the newest line waits until the current one ends, and older waiting lines
// are dropped so the voice keeps up with the screen. It also still waits for any jingle to finish.
let sayNext = null, sayWaitSince = 0;
// Trainer voice: a young, upbeat built-in voice (we can't use a real character's voice). Pitch up so it sounds like a kid,
// rate just under 1 so a 4-year-old can follow.
const VOICE_PITCH = 1.35, VOICE_RATE = .97;
const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|kathy|grandma|grandpa|rocko|shelley|eddy|flo\b|reed|sandy|deranged|hysterical|pipe organ/i;
const VOICE_PREFS = [                               // first match wins
  v => /enhanced|premium/i.test(v.name),            // iPad/Mac: a downloaded high-quality US voice
  v => /^samantha\b/i.test(v.name),                // iPad default US voice
  v => /^aaron\b/i.test(v.name),                   // iOS US male
  v => /^nicky\b/i.test(v.name),                   // iOS US
  v => /\bana\b.*(natural|online)/i.test(v.name),  // Edge/Windows: young US voice
  v => /google us english/i.test(v.name),          // Chrome / Android
  v => /^fred\b/i.test(v.name),                    // older Mac voice
  v => v.default,
  v => true                                        // any other US voice
];
const isUS = v => /^en[-_]US$/i.test(v.lang || '');
function pickVoice(list) {
  const ok = (list || []).filter(v => v && !NOVELTY.test(v.name));
  const us = ok.filter(isUS);
  for (const f of VOICE_PREFS) { const v = us.find(f); if (v) return v; }
  return ok.find(v => /^en/i.test(v.lang || '')) || null;          // any English voice, else the browser default
}
let voice = null;
function loadVoice() { try { voice = pickVoice(speechSynthesis.getVoices()); } catch (e) {} }
if ('speechSynthesis' in window) { loadVoice(); try { speechSynthesis.addEventListener('voiceschanged', loadVoice); } catch (e) { speechSynthesis.onvoiceschanged = loadVoice; } }
/* 💬 Talk level (saved on this iPad): how much the trainer voice talks.
   quiet  = sound effects only; speech only for 🔊 taps and essential first-time instructions
   normal = (default) first-time lines + the result after each answer + short praise
   chatty = says everything, every time (the old behavior)
   In quiet/normal every instruction or tip is spoken ONCE per session; after that a soft chime plays instead.
   kinds: 'must' essential first-time instruction · 'line' instruction/tip · 'result' what just happened · 'praise' · 'extra' (chatty only) · 'replay' (🔊 tap) */
const LEVELS = ['quiet', 'normal', 'chatty'];
let talk = LEVELS.includes(store('talk')) ? store('talk') : 'normal';
let heard = new Set(); try { heard = new Set(JSON.parse(sessionStorage.getItem('fg.heard') || '[]')); } catch (e) {}
const keyOf = t => String(t).toLowerCase().replace(/<[^>]+>/g, ' ').replace(/[^a-z]+/g, ' ').trim();
const remember = k => { heard.add(k); try { sessionStorage.setItem('fg.heard', JSON.stringify([...heard].slice(-400))); } catch (e) {} };
let current = '';                                  // the line on screen right now (🔊 replays it)
const PRAISE = ['Awesome!', 'Alright!', 'You got it!', 'Yes!', 'Great job!', 'Way to go!', 'Super!', 'Nice one!', 'Wow!', 'Woo-hoo!'];
const recent = [];
function pickFresh(list) {                         // vary lines: never the same one twice in a row (or within the last 3)
  let ok = list.filter(x => !recent.includes(x)); if (!ok.length) ok = list.filter(x => x !== recent[recent.length - 1]); if (!ok.length) ok = list;
  const v = ok[Math.floor(Math.random() * ok.length)];
  recent.push(v); if (recent.length > 3) recent.shift(); return v;
}
const cheer = () => pickFresh(PRAISE);
function chime() { if (performance.now() - lastAny > 450) play('chime'); }   // one sound per tap: no chime on top of a tap sound
function speakable(text, kind) {
  if (kind === 'replay' || talk === 'chatty') return true;
  const k = keyOf(text);
  if (talk === 'quiet') return kind === 'must' && !heard.has(k);
  if (kind === 'extra') return false;
  if (kind === 'result' || kind === 'praise') return true;
  return !heard.has(k);
}
// say(text, kind) or say([[text, kind], ...]) - parts that aren't spoken are skipped; if everything was already heard, a chime plays
function say(text, kind = 'line') {
  const parts = (Array.isArray(text) ? text : [[text, kind]]).filter(p => p && p[0]);
  if (!parts.length) return;
  const full = parts.map(p => p[0]).join(' ');
  if (!parts.every(p => p[1] === 'replay')) current = full;
  if (muted || !('speechSynthesis' in window)) return;
  const go = parts.filter(p => speakable(p[0], p[1] || 'line'));
  if (!go.length) { if (talk !== 'quiet' && parts.some(p => p[1] !== 'extra' && heard.has(keyOf(p[0])))) chime(); return; }
  go.forEach(p => { if (p[1] !== 'result' && p[1] !== 'praise') remember(keyOf(p[0])); });
  sayNext = go.map(p => p[0]).join(' '); sayWaitSince = performance.now();
  clearTimeout(sayTimer); sayTimer = setTimeout(sayTry, Math.max(0, busyUntil - performance.now()) + 120);
}
const replay = () => { if (current) { SFX.tap(); say(current, 'replay'); } };
function setTalk(l) { if (!LEVELS.includes(l)) return; talk = l; store('talk', l); }
function sayTry() {
  if (muted || sayNext == null) return;
  const now = performance.now();
  if (busyUntil > now) { sayTimer = setTimeout(sayTry, busyUntil - now + 120); return; }
  let talking = false; try { talking = speechSynthesis.speaking || speechSynthesis.pending; } catch (e) {}
  if (talking && now - sayWaitSince < 15000) { sayTimer = setTimeout(sayTry, 150); return; }   // let the sentence finish (never cut mid-word)
  const text = sayNext; sayNext = null;
  if (!voice) loadVoice();                        // iOS fills the list late
  try { const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US';
    if (voice) try { u.voice = voice; u.lang = voice.lang; } catch (e) {}      // a bad voice never blocks speech
    u.rate = VOICE_RATE; u.pitch = VOICE_PITCH; u.volume = .9;
    duck(true); const up = () => duck(false); u.onend = up; u.onerror = up;
    setTimeout(up, 1500 + text.split(' ').length * 600);                  // safety: never stay ducked
    speechSynthesis.speak(u); } catch (e) {}
}

/* ---------- 🎵 music: our own little chiptune songs, made right here with WebAudio (no files, nothing copyrighted) ----------
   Same soft notes as the sound effects (sine/triangle, all under 1.1 kHz, 18 ms fade-in, smooth fade-out, so no clicks).
   Off by default and quiet; it ducks under the trainer voice. Notation: one token per 8th note, '-' holds, '.' rests. */
const TRACKS = {
  adventure: {name: 'Adventure', em: '🗺️', bpm: 138,
    mel: 'G4 C5 E5 G5 - E5 C5 D5 E5 - D5 C5 A4 - G4 - | A4 C5 F5 A5 - G5 F5 E5 D5 - E5 F5 G5 - - . | G4 C5 E5 G5 - A5 G5 E5 C5 - D5 E5 F5 - E5 D5 | C5 E5 D5 B4 - G4 A4 B4 C5 - - - . . . .',
    bass: 'C3 . G3 . C3 . G3 . A3 . E3 . A3 . G3 . | F3 . C4 . F3 . C4 . G3 . D4 . G3 . G3 . | C3 . G3 . A3 . E3 . F3 . C4 . G3 . D4 . | F3 . G3 . E3 . A3 . F3 . G3 . C3 . . .'},
  battle: {name: 'Battle', em: '⚔️', bpm: 160,
    mel: 'A4 A4 C5 A4 D5 C5 A4 G4 A4 - E5 - D5 C5 D5 - | A4 A4 C5 A4 E5 D5 C5 D5 E5 - G5 - E5 - . . | F5 E5 D5 C5 D5 C5 A4 C5 D5 - F5 - E5 D5 E5 - | A5 - G5 E5 D5 C5 D5 E5 A4 - - - . . . .',
    bass: 'A3 A3 . A3 A3 . G3 . A3 A3 . A3 C4 . G3 . | A3 A3 . A3 A3 . G3 . E3 E3 . E3 G3 . E3 . | F3 F3 . F3 F3 . C4 . D3 D3 . D3 F3 . D3 . | F3 . G3 . E3 . E3 . A3 . E3 . A3 . . .'},
  center: {name: 'Pokémon Center', em: '🏥', bpm: 100,
    mel: 'C5 - E5 G5 - E5 F5 - A5 - G5 - E5 - - . | D5 - F5 A5 - F5 E5 - G5 - E5 - C5 - - . | C5 - E5 G5 - E5 F5 - A5 - C6 - A5 - G5 - | F5 - E5 - D5 - G4 - C5 - - - . . . .',
    bass: 'C3 - G3 - E3 - F3 - C4 - A3 - C3 - G3 - | D3 - A3 - F3 - C3 - G3 - E3 - C3 - G3 - | C3 - G3 - E3 - F3 - C4 - A3 - E3 - G3 - | F3 - A3 - G3 - B3 - C3 - G3 - C3 - - -'},
  victory: {name: 'Victory', em: '🏆', bpm: 150,
    mel: 'C5 C5 C5 - G4 - C5 E5 G5 - - - E5 - G5 - | A5 - G5 F5 E5 - D5 - E5 - C5 - - - . . | F5 F5 F5 - C5 - F5 A5 C6 - - - A5 - G5 - | F5 - E5 D5 E5 G5 - - C5 - - - . . . .',
    bass: 'C3 . G3 . C3 . G3 . C3 . G3 . E3 . G3 . | F3 . C4 . G3 . B3 . C3 . G3 . C3 . . . | F3 . C4 . F3 . C4 . F3 . C4 . E3 . C4 . | G3 . D4 . G3 . B3 . C3 . G3 . C3 . . .'}
};
const TRACK_IDS = Object.keys(TRACKS);
const midi = n => { const m = /^([A-G])(#?)(\d)$/.exec(n); return 12 * (+m[3] + 1) + {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11}[m[1]] + (m[2] ? 1 : 0); };
const hz = n => 440 * Math.pow(2, (midi(n) - 69) / 12);
function parseLine(str) {                          // -> {len, ev: [[step, freq, steps]]}
  const tok = str.replace(/\|/g, ' ').trim().split(/\s+/), ev = [];
  tok.forEach((t, i) => { if (t === '-' && ev.length && ev[ev.length - 1][0] + ev[ev.length - 1][2] === i) ev[ev.length - 1][2]++;
    else if (/^[A-G]/.test(t)) ev.push([i, hz(t), 1]); });
  return {len: tok.length, ev};
}
Object.values(TRACKS).forEach(t => { const m = parseLine(t.mel), b = parseLine(t.bass); t.len = Math.max(m.len, b.len);
  t.at = {}; m.ev.forEach(([i, f, n]) => (t.at[i] = t.at[i] || []).push([f, n, 'triangle', .055]));
  b.ev.forEach(([i, f, n]) => (t.at[i] = t.at[i] || []).push([f, n, 'sine', .07])); });
const mus = {on: false, track: TRACKS[store('musicTrack')] ? store('musicTrack') : 'adventure', vol: Math.min(1, Math.max(0, +(store('musicVol') || .35))),
  bus: null, timer: null, next: 0, step: 0, ducked: false, listeners: []};
function mNote(c, dest, t, dur, f, wave, pk) {      // one soft music note: 0 → peak in 18 ms, smooth fall, exact 0 before stop
  const o = c.createOscillator(), g = c.createGain(); o.type = wave; o.frequency.value = f;
  const end = t + Math.max(.08, dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + ATK); g.gain.setValueAtTime(pk, t + Math.max(ATK, dur * .35));
  g.gain.exponentialRampToValueAtTime(.001, end); g.gain.linearRampToValueAtTime(0, end + TAIL);
  o.connect(g); g.connect(dest); o.start(t); o.stop(end + TAIL + .03); o.onended = () => { try { g.disconnect(); } catch (e) {} };
}
const busLevel = () => mus.vol * (mus.ducked ? .3 : 1);
function mTick() {
  const c = ac; if (!c || !mus.on || !mus.bus) return;
  const tr = TRACKS[mus.track], st = 60 / tr.bpm / 2;
  while (mus.next < c.currentTime + .4) {
    (tr.at[mus.step % tr.len] || []).forEach(([f, n, w, pk]) => mNote(c, mus.bus, mus.next, n * st * .92, f, w, pk));
    mus.next += st; mus.step++;
  }
}
function mEmit() { mus.listeners = mus.listeners.filter(f => { try { return f() !== false; } catch (e) { return false; } }); const b = document.getElementById('hdrMusic'); if (b) b.classList.toggle('playing', mus.on); }
function musicPlay(id) {
  if (id && TRACKS[id]) { if (mus.on && id !== mus.track) musicStop(true); mus.track = id; store('musicTrack', id); }
  if (mus.on) return mEmit();
  if (muted) { muted = false; store('mute', '0'); }  // tapping play means "I want sound"
  const c = audio(); if (!c) return;
  const bus = c.createGain(); bus.gain.setValueAtTime(0, c.currentTime); bus.gain.linearRampToValueAtTime(busLevel(), c.currentTime + .3); bus.connect(master);
  mus.bus = bus; mus.on = true; mus.next = c.currentTime + .08; mus.step = 0;
  clearInterval(mus.timer); mus.timer = setInterval(mTick, 90); mTick(); mEmit();
}
function musicStop(keepState) {
  clearInterval(mus.timer); mus.timer = null;
  const b = mus.bus, c = ac; mus.bus = null; mus.on = false;
  if (b && c) { try { b.gain.cancelScheduledValues(c.currentTime); b.gain.setValueAtTime(b.gain.value, c.currentTime); b.gain.linearRampToValueAtTime(0, c.currentTime + .25); } catch (e) {} setTimeout(() => { try { b.disconnect(); } catch (e) {} }, 900); }
  if (!keepState) mEmit();
}
function musicNext() { const i = TRACK_IDS.indexOf(mus.track); const id = TRACK_IDS[(i + 1) % TRACK_IDS.length]; if (mus.on) musicPlay(id); else { mus.track = id; store('musicTrack', id); mEmit(); } }
function musicVol(v) { mus.vol = Math.min(1, Math.max(0, v)); store('musicVol', mus.vol.toFixed(2)); if (mus.bus && ac) { mus.bus.gain.cancelScheduledValues(ac.currentTime); mus.bus.gain.setTargetAtTime(busLevel(), ac.currentTime, .05); } }
function duck(on) { if (mus.ducked === on) return; mus.ducked = on; if (mus.bus && ac) { mus.bus.gain.cancelScheduledValues(ac.currentTime); mus.bus.gain.setTargetAtTime(busLevel(), ac.currentTime, on ? .08 : .4); } }
const music = {play: musicPlay, stop: () => musicStop(), next: musicNext, vol: musicVol, state: () => ({on: mus.on, track: mus.track, vol: mus.vol, ducked: mus.ducked}), tracks: TRACKS, onChange: f => mus.listeners.push(f)};
const YT_THEME = 'https://www.youtube.com/watch?v=MpaHR-V_R-o';   // "Gotta Catch 'Em All!" on The Official Pokémon YouTube channel
async function testMusic() {                       // render one loop of each song offline; same click test as testSounds
  const out = {};
  for (const [k, tr] of Object.entries(TRACKS)) {
    const st = 60 / tr.bpm / 2, len = tr.len * st + .5, rate = 48000;
    const c = new OfflineAudioContext(1, Math.ceil(len * rate), rate), m = graph(c), bus = c.createGain(); bus.gain.value = 1; bus.connect(m);
    let maxF = 0, slope = [];
    for (let i = 0; i < tr.len; i++) (tr.at[i] || []).forEach(([f, n, w, pk]) => { mNote(c, bus, i * st, n * st * .92, f, w, pk); maxF = Math.max(maxF, f); slope.push(.38 * pk * f / rate * (w === 'triangle' ? 4 : 2 * Math.PI)); });
    const d = (await c.startRendering()).getChannelData(0);
    let peak = 0, jump = 0; for (let i = 1; i < d.length; i++) { peak = Math.max(peak, Math.abs(d[i])); jump = Math.max(jump, Math.abs(d[i] - d[i - 1])); }
    const lim = slope.sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0);
    out[k] = {seconds: +(tr.len * st).toFixed(1), peak: +peak.toFixed(4), maxJump: +jump.toFixed(5), smoothLimit: +lim.toFixed(5), clicks: jump > lim * 1.05 ? 'YES' : 'none', maxHz: Math.round(maxF)};
  }
  return out;
}

async function testSounds() {                     // render each sound offline through the same chain; report peak / clipped samples
  const out = {};
  for (const [k, s] of Object.entries(SOUNDS)) {
    const len = Math.max(...s.notes.map(n => n[1] + n[2])) + .2, rate = 48000;
    const c = new OfflineAudioContext(1, Math.ceil(len * rate), rate), m = graph(c);
    s.notes.forEach(n => note(c, m, 0, n, false));
    const d = (await c.startRendering()).getChannelData(0);
    let peak = 0, clip = 0, jump = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; if (a >= .999) clip++; if (i) jump = Math.max(jump, Math.abs(d[i] - d[i - 1])); }
    // smooth limit: the steepest a sum of these sines/triangles can move per sample (anything above it = a click)
    const slope = s.notes.reduce((t, [f, , , w, nv]) => t + .45 * (PEAK / Math.max(1, nv)) * f / rate * (w === 'triangle' ? 4 : 2 * Math.PI), 0);
    // level in the first 1 ms of every note and the last 1 ms before each oscillator stops (should be ~0 = no pop)
    // (each note rendered on its own, so neighbours don't hide a click)
    let startEdge = 0, stopEdge = 0;
    for (const n of s.notes) {
      const c1 = new OfflineAudioContext(1, Math.ceil(len * rate), rate), m1 = graph(c1); note(c1, m1, 0, n, false);
      const d1 = (await c1.startRendering()).getChannelData(0), pk = Math.max(...d1.map(Math.abs)) || 1;
      const at = (t0, t1) => { let x = 0; for (let i = Math.max(0, Math.floor(t0 * rate)); i < Math.min(d1.length, Math.ceil(t1 * rate)); i++) x = Math.max(x, Math.abs(d1[i])); return x; };
      startEdge = Math.max(startEdge, at(n[1], n[1] + .001) / pk); stopEdge = Math.max(stopEdge, at(n[1] + n[2] + TAIL + .029, n[1] + n[2] + TAIL + .04) / pk);   // around the moment the oscillator stops (+ the compressor's 6 ms look-ahead)
    }
    out[k] = {peak: +peak.toFixed(4), clipped: clip, maxJump: +jump.toFixed(5), smoothLimit: +slope.toFixed(5), clicks: jump > slope * 1.05 ? 'YES' : 'none',
      startEdge: (100 * startEdge).toFixed(1) + '% of peak (1st ms)', stopEdge: (100 * stopEdge).toFixed(3) + '% of peak (at stop)', maxHz: Math.max(...s.notes.map(n => n[0])), waves: [...new Set(s.notes.map(n => n[3]))].join('/')};
  }
  return out;
}
/* ---------- 💬 talk + 🎵 music sheets (pop-up panels, work on every page) ---------- */
const TALK_UI = {quiet: ['🤫', 'Quiet', 'Sounds only. Tap 🔊 to hear.'], normal: ['🙂', 'Normal', 'New tips, answers, cheers'], chatty: ['🗣️', 'Chatty', 'Talks about everything']};
function closeSheet() { const o = document.getElementById('fgSheet'); if (o) o.remove(); }
function sheet(title, inner, bind) {
  closeSheet();
  const o = document.createElement('div'); o.className = 'fg-sheetwrap'; o.id = 'fgSheet';
  o.innerHTML = `<div class="fg-sheet" role="dialog" aria-modal="true" aria-label="${title}"><div class="fg-sheethead"><h2>${title}</h2>
    <button class="fg-icon fg-x" aria-label="Close">✖️</button></div>${inner}</div>`;
  document.body.appendChild(o);
  o.addEventListener('click', e => { if (e.target === o || e.target.closest('.fg-x')) { SFX.tap(); closeSheet(); } });
  if (bind) bind(o);
  return o;
}
function talkHTML() {
  return `<div class="fg-talk" role="radiogroup" aria-label="How much talking">${LEVELS.map(l => `<button class="${l === talk ? 'on' : ''}" data-talk="${l}" role="radio" aria-checked="${l === talk}">
      <span class="fg-tem">${TALK_UI[l][0]}</span><b>${TALK_UI[l][1]}</b><span class="fg-tsub">${TALK_UI[l][2]}</span></button>`).join('')}</div>
    <button class="fg-soundtog ${muted ? 'off' : ''}" data-sound aria-pressed="${!muted}">${muted ? '🔕 Sounds are off' : '🔔 Sounds are on'}</button>`;
}
function bindTalk(root) {
  root.querySelectorAll('[data-talk]').forEach(b => b.onclick = () => { setTalk(b.dataset.talk); SFX.tap();
    root.querySelectorAll('[data-talk]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    say(TALK_UI[talk][1] + '!', 'replay'); });
  const t = root.querySelector('[data-sound]');
  if (t) t.onclick = () => { setMuted(!muted); t.classList.toggle('off', muted); t.setAttribute('aria-pressed', !muted); t.textContent = muted ? '🔕 Sounds are off' : '🔔 Sounds are on'; SFX.tap(); };
}
function setMuted(m) {
  muted = m; store('mute', m ? '1' : '0');
  if (m) { clearTimeout(sayTimer); sayNext = null; musicStop(); if ('speechSynthesis' in window) speechSynthesis.cancel(); }   // only when you tap it
}
const openTalk = () => { SFX.tap(); sheet('💬 Talking', talkHTML(), bindTalk); };
function musicHTML() {
  return `<div class="fg-music"><div class="fg-tracks">${TRACK_IDS.map(id => `<button class="fg-track ${id === mus.track ? 'on' : ''} ${id === mus.track && mus.on ? 'playing' : ''}" data-track="${id}" aria-label="${TRACKS[id].name}">
      <span class="fg-tem">${TRACKS[id].em}</span><b>${TRACKS[id].name}</b><span class="fg-eq" aria-hidden="true"><i></i><i></i><i></i></span></button>`).join('')}</div>
    <div class="fg-mctl"><button class="btn red fg-mbtn" data-m="play">${mus.on ? '⏸️ Pause' : '▶️ Play'}</button>
      <button class="btn white fg-mbtn" data-m="next">⏭️ Next</button></div>
    <label class="fg-vol"><span aria-hidden="true">🔈</span><input type="range" min="0" max="100" step="5" value="${Math.round(mus.vol * 100)}" aria-label="Music volume"><span aria-hidden="true">🔊</span></label>
    <a class="btn blue fg-yt" href="${YT_THEME}" target="_blank" rel="noopener">📺 Pokémon theme on YouTube</a>
    <p class="fg-mnote">Our own made-up songs. The real theme opens on YouTube.</p></div>`;
}
function bindMusic(root) {
  const box = root.querySelector('.fg-music'); if (!box) return;
  const redraw = () => { if (!box.isConnected) return false;
    box.querySelectorAll('[data-track]').forEach(b => { b.classList.toggle('on', b.dataset.track === mus.track); b.classList.toggle('playing', b.dataset.track === mus.track && mus.on); });
    const pb = box.querySelector('[data-m="play"]'); if (pb) pb.textContent = mus.on ? '⏸️ Pause' : '▶️ Play'; };
  mus.listeners.push(redraw);
  box.querySelectorAll('[data-track]').forEach(b => b.onclick = () => musicPlay(b.dataset.track));
  box.querySelector('[data-m="play"]').onclick = () => { if (mus.on) musicStop(); else musicPlay(); };
  box.querySelector('[data-m="next"]').onclick = musicNext;
  box.querySelector('input[type=range]').oninput = e => musicVol(e.target.value / 100);
}
const openMusic = () => { SFX.tap(); sheet('🎵 Music', musicHTML(), bindMusic); };
function wireHeader() { const b = document.getElementById('hdrMusic'); if (b && !b.dataset.on) { b.dataset.on = '1'; b.onclick = openMusic; } }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireHeader); else wireHeader();
function barIcons() { return `<button class="fg-icon" id="fgSay" aria-label="Say it again">🔊</button><button class="fg-icon" id="fgTalk" aria-label="Talking settings">💬</button>`; }
function bindBar() { const a = document.getElementById('fgSay'), b = document.getElementById('fgTalk'); if (a) a.onclick = replay; if (b) b.onclick = openTalk; }

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
    <div class="fg-bar"><a class="fg-icon" href="#/games" aria-label="All games">🎮</a>${bar}${barIcons()}</div>${inner}</div>`;
  bindBar();
}

/* ---------- menu ---------- */
const TR = () => window.Trainer || null;
const curP = () => TR() ? TR().current() : null;
// game settings are remembered per kid; first time, Harper (Star Trainer) gets the starter mode and Carter (Ace Trainer) the harder one
const kidPref = (key, v) => { const id = curP() || 'little'; if (v != null) return store(key + '.' + id, v); const x = store(key + '.' + id); return x != null ? x : id === 'big' ? '1' : '0'; };
function menu() {
  const pika = 'me55-23', math = !!window.FentonMath;
  $app.innerHTML = `<div class="fg fg-hub" id="fg">
    <div class="fg-bar hub"><a class="fg-icon" href="#/" aria-label="Home">🏠</a><div class="fg-hello"><span class="fg-bounce">⭐</span> Game Time! <span class="fg-bounce d2">⭐</span></div>${barIcons()}</div>
    ${TR() ? TR().whoHTML() : ''}
    <div class="fg-menu">
      <a class="fg-pick red" href="#/games/memory" data-say="Memory Match!">
        <span class="fg-pickart"><span class="fg-back mini"></span><span class="fg-face mini"><img src="${ART(pika)}" alt="" draggable="false"></span><span class="fg-back mini"></span></span>
        <span class="fg-pickname">Memory Match</span><span class="fg-picksub">find the pairs</span></a>
      <a class="fg-pick blue" href="#/games/who" data-say="Who's that Pokémon?">
        <span class="fg-pickart"><span class="fg-silmini"><img src="${SIL(pika)}" alt="" draggable="false"><b>?</b></span></span>
        <span class="fg-pickname">Who's That Pokémon?</span><span class="fg-picksub">guess the shadow</span></a>
      <a class="fg-pick green" href="#/games/tcg" data-say="Card Battle School!">
        <span class="fg-pickart tcgpick"><img class="l" src="games/tcg/me55-9.jpg" alt="" draggable="false"><span class="vs">VS</span><img class="r" src="games/tcg/me55-113.jpg" alt="" draggable="false"></span>
        <span class="fg-pickname">Card Battle School</span><span class="fg-picksub">learn the card game</span></a>
      <a class="fg-pick purple" href="#/games/trivia" data-say="Pokémon Trivia!">
        <span class="fg-pickart tvpick"><span class="tvpick-q"><img src="${ART(pika)}" alt="" draggable="false"><b>?</b></span><span class="tvpick-tf"><i>👍</i><i>👎</i></span></span>
        <span class="fg-pickname">Pokémon Trivia</span><span class="fg-picksub">true or false?</span></a>
      <a class="fg-pick orange" href="#/games/math" data-say="Pokémon Math!">
        <span class="fg-pickart mathpick"><span class="mathpick-eq">1 + 2</span><img src="${ART('me55-116')}" alt="" draggable="false"></span>
        <span class="fg-pickname">Pokémon Math</span><span class="fg-picksub">${math ? 'count and add' : 'coming soon'}</span></a>
      <a class="fg-pick gold" href="#/leaderboard" data-say="Our trainers!">
        <span class="fg-pickart lbpick"><span>🏆</span><span>🏅</span></span>
        <span class="fg-pickname">Trainers &amp; Badges</span><span class="fg-picksub">badges, packs, scores</span></a>
    </div></div>`;
  bindBar(); if (TR()) TR().bindWho($app);
  $app.querySelectorAll('[data-say]').forEach(a => a.addEventListener('click', () => { SFX.tap(); say(a.dataset.say, 'line'); }));
}
function mathSoon() {                              // placeholder until the Math game file is added (it registers window.FentonMath)
  frame('Pokémon Math', `<div class="fg-soon"><div class="fg-soonart"><img src="${ART('me55-116')}" alt="Eevee" draggable="false"></div>
    <div class="fg-big">Pokémon Math is coming soon!</div><div class="fg-sub">Counting and adding with Pokémon.</div>
    <a class="btn red fg-again" href="#/games">🎮 Pick another game</a></div>`, '');
  say('Pokémon Math is coming soon!', 'line');
}

/* ---------- Memory Match ---------- */
let M = null;
function memory() {
  const hard = kidPref('memHard') === '1', pairs = hard ? 6 : 3;
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
  document.querySelectorAll('[data-hard]').forEach(b => b.onclick = () => { SFX.tap(); kidPref('memHard', b.dataset.hard); clearTimers(); memory(); });
  document.getElementById('memGrid').addEventListener('click', e => { const b = e.target.closest('.fg-card'); if (b) flip(+b.dataset.i, b); });
  sizeGrid(); say("Let's go! Find two the same!", 'must');
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
      SFX.match(); say(cheer() + ' ' + (SAY[a.c.name] || a.c.name) + '!', 'praise'); confetti(26, b.el); M.found++; M.lock = false;
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
  w.hidden = false; SFX.win(); say('You did it! You found them all!', 'result'); confetti(110); later(() => confetti(70), 900);
  const p = curP(); if (p) { const T = TR(); T.recordWin(p, 'memory'); T.recordScore(p, M.hard ? 'memoryHard' : 'memoryEasy', M.moves); T.addXP(p, M.hard ? 25 : 15, 'memory'); }
  document.getElementById('memAgain').onclick = () => { SFX.tap(); clearTimers(); memory(); };
}

/* ---------- Who's That Pokémon? ---------- */
let W = {stars: 0, deck: []};
function who() {
  const names = kidPref('whoNames') === '1';
  if (!W.deck.length) W.deck = shuffle(WHO_IDS.filter(owned));
  const ans = W.deck.pop(), others = shuffle(WHO_IDS.filter(id => id !== ans && owned(id))).slice(0, 2), opts = shuffle([ans, ...others]);
  W.ans = ans; W.tries = 0; W.solved = false;
  frame("Who's That Pokémon?", `
    <div class="fg-who">
      <div class="fg-q"><div class="fg-rays"></div>
        <img class="fg-sil" id="whoSil" src="${SIL(ans)}" alt="Mystery Pokémon shadow" draggable="false">
        <img class="fg-reveal" id="whoArt" src="${ART(ans)}" alt="${NAME[ans]}" draggable="false">
        <div class="fg-qtext" id="whoText">Who's that Pokémon?</div></div>
      <div class="fg-opts ${names ? 'names' : 'pics'}" id="whoOpts">${opts.map(id => `<button class="fg-opt" data-id="${id}" aria-label="${NAME[id]}">
        ${names ? `<span>${NAME[id]}</span>` : `<img src="${ART(id)}" alt="${NAME[id]}" draggable="false">`}</button>`).join('')}</div>
      <button class="btn red fg-next" id="whoNext" hidden>Next ▶</button>
    </div>`,
    `<div class="fg-seg" role="group" aria-label="How to answer">
      <button class="${names ? '' : 'on'}" data-names="0" aria-label="Pictures"><span class="fg-em">🖼️</span><span>Pictures</span></button>
      <button class="${names ? 'on' : ''}" data-names="1" aria-label="Big kid, names"><span class="fg-em">🔤</span><span>Big kid</span></button></div>
     <div class="fg-starbox" aria-label="${W.stars} stars"><span>⭐</span><b id="whoStars">${W.stars}</b></div>`);
  document.querySelectorAll('[data-names]').forEach(b => b.onclick = () => { SFX.tap(); kidPref('whoNames', b.dataset.names); W.deck.push(W.ans); clearTimers(); who(); });
  document.getElementById('whoOpts').addEventListener('click', e => { const b = e.target.closest('.fg-opt'); if (b) answer(b); });
  document.getElementById('whoNext').onclick = () => { SFX.tap(); clearTimers(); who(); scrollTo(0, 0); };
  say("Who's that Pokémon?", 'must');
}
function answer(b) {
  if (W.solved || b.disabled) return;
  if (b.dataset.id !== W.ans) {      // wrong: wiggle + dim that choice (can't be tapped again), lose 1 star (never below 0), keep guessing
    W.tries++; b.disabled = true; SFX.aww(); b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle');
    later(() => b.classList.add('gone'), 450);
    loseStar(); say(pickFresh(['Oops! Try again!', 'Not that one! Try again!', 'Hmm, try another one!']), 'result');
    if (curP()) TR().answer(curP(), false, 'who'); return;
  }
  W.solved = true; W.stars++;
  document.getElementById('fg').querySelector('.fg-q').classList.add('solved');
  b.classList.add('right'); document.querySelectorAll('.fg-opt').forEach(o => { if (o !== b) o.classList.add('gone'); });
  const s = document.getElementById('whoStars'); s.textContent = W.stars; s.parentElement.classList.remove('lose', 'wobble'); void s.offsetWidth; s.parentElement.classList.add('pop');
  const big = W.stars % 5 === 0;                   // every 5 stars: fanfare instead of the jingle (speech waits for it)
  W.cheer = big ? 'You did it!' : cheer();
  document.getElementById('whoText').innerHTML = `${W.cheer} It's <b>${NAME[W.ans]}</b>!${big ? ` ${W.stars} stars! 🎉` : ''}`;
  if (big) SFX.win(); else SFX.match();
  say(W.cheer + " It's " + spoken(W.ans) + '!' + (big ? ` ${W.stars} stars!` : ''), 'result'); confetti(big ? 140 : 60);
  const p = curP(); if (p) { const T = TR(); T.answer(p, W.tries === 0, 'who'); T.recordScore(p, 'who', W.stars); if (big) T.recordWin(p, 'who'); T.addXP(p, W.tries === 0 ? 5 : 3, 'who'); }
  document.getElementById('whoNext').hidden = false;
}

function loseStar() {
  const s = document.getElementById('whoStars'); if (!s) return; const box = s.parentElement;
  box.classList.remove('pop', 'lose', 'wobble'); void box.offsetWidth;
  if (W.stars <= 0) { box.classList.add('wobble'); return; }      // at 0: just a gentle wobble, nothing taken away
  W.stars--; s.textContent = W.stars; box.setAttribute('aria-label', W.stars + ' stars'); box.classList.add('lose');
  const r = box.getBoundingClientRect(), f = document.createElement('div');   // big "−1 ⭐" that pops out and floats away
  f.className = 'fg-minus'; f.innerHTML = '−1 <span>⭐</span>'; f.setAttribute('aria-hidden', 'true');
  f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.bottom + 8) + 'px';
  document.body.appendChild(f); setTimeout(() => f.remove(), 1700);
}

/* ---------- entry ---------- */
function render(app, data, sub) {
  $app = app; D = data; clearTimers();
  if (sub === 'memory') return memory();
  if (sub === 'who') return who();
  if (sub === 'tcg' && window.FentonTCG) return window.FentonTCG.render(app, data);
  if (sub === 'trivia' && window.FentonTrivia) return window.FentonTrivia.render(app, data);
  if (sub === 'math') return window.FentonMath ? window.FentonMath.render(app, data) : mathSoon();
  return menu();
}
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(sizeGrid, 120); });
addEventListener('orientationchange', () => setTimeout(sizeGrid, 300));
// shared helpers for tcg.js (Card Battle School) so it uses the same sound engine, speech and look
const kit = {say, SFX, confetti, frame, later, clearTimers, store, shuffle, owned, spoken, isMuted: () => muted, cheer, pickFresh, ART,
  line: t => { current = t; }, replay, talk: () => talk, setTalk, sheet, closeSheet, openTalk, openMusic, talkHTML, bindTalk, musicHTML, bindMusic, music};
return {render, FILES, stop: clearTimers, testSounds, testMusic, kit, pickVoice, _voice: () => voice, _voicePrefs: () => ({pitch: VOICE_PITCH, rate: VOICE_RATE}),
  _heard: () => [...heard], _resetHeard: () => { heard = new Set(); try { sessionStorage.removeItem('fg.heard'); } catch (e) {} }};
})();
