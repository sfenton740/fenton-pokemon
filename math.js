/* Pokémon Math - adaptive number games for little trainers (#/games/math).
   🐣 Little Trainer (age 4-5): counting to 10 then 20, more/fewer, find the number, shapes, patterns, adding and taking away with pictures.
   🔥 Big Trainer (age 6+): + and - to 20 then 100 (tens and ones), missing numbers, skip counting, comparing, HP word problems,
      teams (intro times) and real card-game math (Weakness x2, Resistance -30, prize cards).
   👑 Champion: times tables to 10x10, sharing (division), doubling/halving, number patterns, multi-step HP math.
   Adaptive: 3 right in a row = level up, 2 misses in a row = a slightly easier level; each mode's level is saved on the iPad.
   Doing great at the top Big Trainer level unlocks the Champion crown (Champion can also be picked directly).
   Right = +1 ⭐, wrong = -1 ⭐ (never below 0), like the other games. A Charmander buddy evolves as the streak grows.
   Sound + speech come from the shared engine in games.js (FentonGames.kit). Talk level (Quiet / Normal / Chatty) is read from
   the shared setting; nothing is ever repeated automatically - 🔊 says it again. */
window.FentonMath = (() => {
'use strict';
const K = () => window.FentonGames.kit;
const ART = id => 'games/art/' + id + '.jpg', CARD = id => 'games/tcg/' + id + '.jpg';
const RM = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuf = a => K().shuffle(a);
// Pokémon pictures (all from our own cards)
const MON = {pika: ['me55-23', 'Pikachu'], eevee: ['me55-116', 'Eevee'], vulpix: ['me55-9', 'Vulpix'], marill: ['me55-67', 'Marill'],
  snorlax: ['me55-119', 'Snorlax'], mew: ['me55-65', 'Mew'], meowth: ['me55-113', 'Meowth'], iggly: ['me55-120', 'Igglybuff'],
  zorua: ['me55-95', 'Zorua'], jirachi: ['me55-102', 'Jirachi'], gengar: ['me55-90', 'Gengar'], lapras: ['me55-17', 'Lapras'],
  lucario: ['me55-83', 'Lucario'], charizard: ['tcg-714372', 'Charizard'], mewtwo: ['me55-63', 'Mewtwo'], sylveon: ['me55-71', 'Sylveon'],
  greninja: ['me55-21', 'Greninja'], tropius: ['me55-5', 'Tropius'], kyogre: ['me55-19', 'Kyogre'], snorlax2: ['me55-119', 'Snorlax'],
  espeon: ['me55-69', 'Espeon'], umbreon: ['me55-91', 'Umbreon'], lugia: ['me55-121', 'Lugia'], zekrom: ['me55-56', 'Zekrom'], reshiram: ['me55-14', 'Reshiram']};
const LM = ['pika', 'eevee', 'vulpix', 'marill', 'snorlax', 'mew', 'meowth', 'iggly', 'zorua', 'jirachi'];          // little-kid pictures
const BM = ['pika', 'charizard', 'gengar', 'mewtwo', 'lucario', 'sylveon', 'greninja', 'snorlax', 'lapras', 'espeon', 'umbreon', 'lugia', 'zekrom', 'reshiram'];
const NM = k => MON[k][1];
// real type match-ups (attacker, defender, attacker's type) - the defender really is weak to that type
const WEAK = [['pika', 'lapras', 'Lightning'], ['greninja', 'charizard', 'Water'], ['charizard', 'tropius', 'Fire'], ['kyogre', 'vulpix', 'Water'], ['mewtwo', 'lucario', 'Psychic']];
const ear = s => { const T = window.FentonTrivia; let t = T && T.forEar ? T.forEar(s) : s.replace(/Poké/g, 'Pokay');
  return t.replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/−/g, ' minus ').replace(/\s+/g, ' ').trim(); };

/* ---------- speech: parts = [[text, kind], ...]; kinds follow the shared engine ('must' / 'line' / 'result' / 'praise' / 'replay') ---------- */
function speak(parts) {
  parts = parts.filter(p => p && p[0]).map(([t, k]) => [ear(t), k]);
  if (!parts.length) return;
  const k = K();
  if (typeof k.talk === 'function') { if (k.line) try { k.line(parts.map(p => p[0]).join(' ')); } catch (e) {} return k.say(parts); }   // new engine: knows kinds
  k.say(parts.map(p => p[0]).join(' '));                                    // older engine: one plain line
}
/* ---------- talk level (shared setting, default Normal) ---------- */
function talk() {
  const norm = v => { v = String(v == null ? '' : v).toLowerCase(); return /quiet|^0$|low|less/.test(v) ? 'quiet' : /chat|^2$|more|high/.test(v) ? 'chatty' : v ? 'normal' : null; };
  try { const k = K(); for (const f of ['talkLevel', 'getTalkLevel', 'talk']) if (typeof k[f] === 'function') { const v = norm(k[f]()); if (v) return v; } } catch (e) {}
  try { for (const key of ['fg.talk', 'fg.talkLevel', 'fg.voiceLevel', 'talkLevel', 'fenton.talk']) { const v = norm(localStorage.getItem(key)); if (v) return v; } } catch (e) {}
  return 'normal';
}

/* ---------- pictures ---------- */
const sizeFor = n => n <= 5 ? 'n5' : n <= 10 ? 'n10' : 'n20';
const one = k => k === 'ball' ? '<i class="mt-it ball" aria-hidden="true"></i>' : `<i class="mt-it"><img src="${ART(MON[k][0])}" alt="" draggable="false"></i>`;
function items(k, n, cross = 0, cls = '') {               // n pictures in rows of 5 (like a ten frame); the last `cross` ones run away
  let h = ''; for (let i = 0; i < n; i++) h += i >= n - cross ? one(k).replace('mt-it', 'mt-it x') : one(k);
  return `<div class="mt-items ${sizeFor(n)} ${cls}" data-n="${n}">${h}</div>`;
}
const SH = {circle: {c: '#2a75bb', s: 0}, square: {c: '#e3350d', s: 4}, triangle: {c: '#2e9e44', s: 3}, star: {c: '#ffcb05', s: 0},
  rectangle: {c: '#ff7ac6', s: 4}, diamond: {c: '#8a4fff', s: 4}, pentagon: {c: '#ff8a00', s: 5}, hexagon: {c: '#00a6a6', s: 6}};
const shape = (k, cls = '') => `<span class="mt-sh-w ${cls}"><span class="mt-sh ${k}" style="background:${SH[k].c}"></span></span>`;
const pic = id => id.startsWith('sh:') ? shape(id.slice(3)) : one(id);
const ballName = n => n === 1 ? 'Poké Ball' : 'Poké Balls';
const eq = (a, op, b, hole = 'r', c = '?') => {            // big equation; the ? box shows what is typed on the keypad
  const H = '<span class="mt-hole" id="mtHole">?</span>';
  return `<div class="mt-eq">${hole === 'a' ? H : `<span>${a}</span>`}<b>${op}</b>${hole === 'b' ? H : `<span>${b}</span>`}<b>=</b>${hole === 'r' ? H : `<span>${c}</span>`}</div>`;
};
function tensOnes(n) {                                    // base-ten blocks: tall rods of 10 + little cubes
  const t = Math.floor(n / 10), o = n % 10;
  return `<span class="mt-to" data-n="${n}"><span class="mt-rods">${'<i class="mt-rod"></i>'.repeat(t)}</span><span class="mt-cubes">${'<i class="mt-cube"></i>'.repeat(o)}</span><b>${n}</b></span>`;
}
const hpBox = (k, hp, hits = [], cls = '') => `<div class="mt-hp ${cls}"><span class="mt-hpart"><img src="${ART(MON[k][0])}" alt="" draggable="false"></span>
  <span class="mt-hpname">${NM(k)}</span><span class="mt-hpbadge">HP <b>${hp}</b></span>${hits.length ? `<span class="mt-hits">${hits.map((h, i) => `<span class="mt-dmg d${i}">${h}</span>`).join('')}</span>` : ''}</div>`;
const prizes = (total, taken) => `<div class="mt-prizes">${Array.from({length: total}, (_, i) => `<i class="mt-prize ${i < taken ? 'taken' : ''}"></i>`).join('')}</div>`;

/* ---------- answer choices ---------- */
function numOpts(ans, n, lo, hi, steps) {
  const set = new Set([ans]);
  for (const v of shuf(steps.flatMap(s => [ans + s, ans - s]))) { if (set.size >= n) break; if (v >= lo && v <= hi) set.add(v); }
  for (let g = 0; set.size < n && g < 400; g++) set.add(ri(lo, hi));
  return shuf([...set]).map(v => ({v, html: `<span class="mt-num">${v}</span>`, label: String(v)}));
}
const dots = v => v > 0 && v <= 10 ? `<span class="mt-dots">${'<i></i>'.repeat(v)}</span>` : '';
const littleNums = (ans, lo, hi) => numOpts(ans, 3, lo, hi, [1, 2]).map(o => ({...o, html: o.html + dots(o.v)}));
const bigNums = (ans, steps = [1, 2, 10], lo = 0, hi = 999) => numOpts(ans, 4, lo, hi, steps);

/* ---------- question makers (each returns plain data; check / expr let the test script verify the maths) ---------- */
const G = {
  // 🐣 Little Trainer
  count(max) {
    const min = max > 10 ? 11 : max > 5 ? 4 : 1, n = ri(min, max), k = pick(LM);
    return {kind: 'num', ans: n, expr: '' + n, check: {count: n}, text: `How many ${NM(k)}?`, say: `How many ${NM(k)} can you count?`,
      vis: items(k, n), opts: littleNums(n, 1, max), right: `${n}!`, wrong: `There are ${n}. Let's count them together next time!`, tip: 'Touch each one as you count.'};
  },
  numFind(max) {
    const n = ri(max > 10 ? 11 : 1, max), w = numWord(n);
    return {kind: 'num', ans: n, expr: '' + n, check: {say: n}, text: 'Find the number you hear!', say: `Find the number ${w}!`, sayNum: n,
      vis: '<div class="mt-ear" aria-hidden="true">👂</div>', opts: numOpts(n, 3, 1, max, max > 10 ? [1, 10, 2] : [1, 2, 3]).map(o => ({...o, html: o.html})), right: `That's ${w}!`, wrong: `This one is ${w}.`};
  },
  matchGroup(max) {                                      // see a number, tap the group with that many
    const n = ri(1, max), set = new Set([n]); while (set.size < 3) set.add(ri(1, max));
    const k = pick(LM), opts = shuf([...set]).map(v => ({v, html: items(k, v, 0, 'opt'), label: v + ' ' + NM(k), count: v}));
    return {kind: 'pick', ans: n, check: {count: n}, text: `Which group has ${n}?`, say: `Find the group with ${numWord(n)} ${NM(k)}!`, vis: `<div class="mt-bignum">${n}</div>`,
      opts, grp: true, right: `${numWord(n)}!`, wrong: `This group has ${numWord(n)}.`};
  },
  moreFewer(max) {
    let a = ri(1, max), b = ri(1, max); while (b === a) b = ri(1, max);
    const more = Math.random() < .5, [ka, kb] = shuf(LM).slice(0, 2), ans = (more ? a > b : a < b) ? 'L' : 'R';
    return {kind: 'pick', ans, check: {a, b, more}, text: `Which group has ${more ? 'MORE' : 'FEWER'}?`, say: `Which group has ${more ? 'more' : 'fewer'}?`,
      vis: `<div class="mt-ask">${more ? '⬆️ more' : '⬇️ fewer'}</div>`, grp: true,
      opts: [{v: 'L', html: items(ka, a, 0, 'opt'), label: a + ' ' + NM(ka), count: a}, {v: 'R', html: items(kb, b, 0, 'opt'), label: b + ' ' + NM(kb), count: b}],
      right: more ? `Yes! ${Math.max(a, b)} is more than ${Math.min(a, b)}!` : `Yes! ${Math.min(a, b)} is fewer than ${Math.max(a, b)}!`,
      wrong: more ? `This group has more. ${Math.max(a, b)} is more than ${Math.min(a, b)}.` : `This group has fewer. ${Math.min(a, b)} is fewer than ${Math.max(a, b)}.`};
  },
  shapes() {
    const pool = ['circle', 'square', 'triangle', 'star', 'rectangle', 'diamond'], opts = shuf(pool).slice(0, 3), k = pick(opts);
    return {kind: 'pick', ans: k, check: {shape: k}, text: `Find the ${k}!`, say: `Can you find the ${k}?`, vis: '<div class="mt-ask">🔍</div>',
      opts: opts.map(s => ({v: s, html: shape(s, 'big'), label: s})), right: `That's the ${k}!`, wrong: `This is the ${k}.`};
  },
  sides() {
    const k = pick(['triangle', 'square', 'rectangle', 'pentagon', 'hexagon']), n = SH[k].s;
    return {kind: 'num', ans: n, expr: '' + n, check: {shape: k, sides: n}, text: `How many sides does a ${k} have?`, say: `How many sides does this ${k} have?`,
      vis: shape(k, 'huge'), opts: littleNums(n, 2, 8), right: `A ${k} has ${n} sides!`, wrong: `A ${k} has ${n} sides. Count the straight lines!`};
  },
  pattern(type) {
    const useShapes = Math.random() < .4, pool = useShapes ? shuf(['circle', 'square', 'triangle', 'star']).map(s => 'sh:' + s) : shuf(LM).slice(0, 4);
    const len = {AB: 2, AAB: 3, ABB: 3, ABC: 3}[type], [A, B, C] = pool;
    const unit = {AB: [A, B], AAB: [A, A, B], ABB: [A, B, B], ABC: [A, B, C]}[type];
    const show = len === 2 ? ri(3, 5) : ri(4, 5), shown = Array.from({length: show}, (_, i) => unit[i % len]), ans = unit[show % len];
    const choices = shuf([...new Set([A, B, C || pool[3], pool[3]])].slice(0, 3));
    if (!choices.includes(ans)) choices[0] = ans;
    const nm = id => id.startsWith('sh:') ? id.slice(3) : NM(id);
    return {kind: 'pick', ans, check: {unit, shown, ans}, text: 'What comes next?', say: shown.map(nm).join(', ') + '. What comes next?',
      vis: `<div class="mt-pat">${shown.map(id => `<span class="mt-pi">${pic(id)}</span>`).join('')}<span class="mt-pi q">?</span></div>`,
      opts: shuf(choices).map(id => ({v: id, html: `<span class="mt-pi">${pic(id)}</span>`, label: nm(id)})), right: `Yes! ${nm(ans)} comes next!`, wrong: `${nm(ans)} comes next. The pattern goes ${unit.map(nm).join(', ')}.`};
  },
  addPics(max) {
    const s = ri(2, max), a = ri(1, s - 1), b = s - a, k = Math.random() < .5 ? 'ball' : pick(LM), nm = n => k === 'ball' ? ballName(n) : NM(k);
    return {kind: 'num', ans: s, expr: `${a}+${b}`, check: {a, b, max}, text: `${a} ${nm(a)} + ${b} ${nm(b)}`, say: `${a} ${nm(a)}, plus ${b} ${nm(b)}. How many in all?`,
      vis: `<div class="mt-sum">${items(k, a)}<b class="mt-op">+</b>${items(k, b)}</div>`, opts: littleNums(s, 1, max),
      right: `${a} plus ${b} makes ${s}!`, wrong: `${a} plus ${b} makes ${s}. Count them all together!`};
  },
  subPics(max) {
    const a = ri(2, max), b = ri(1, a - 1), k = Math.random() < .4 ? 'ball' : pick(LM), d = a - b;
    const how = k === 'ball' ? `${a} ${ballName(a)}. Take away ${b}.` : `${a} ${NM(k)}. ${b} ${b === 1 ? 'runs' : 'run'} away!`;
    return {kind: 'num', ans: d, expr: `${a}-${b}`, check: {a, b, max}, text: k === 'ball' ? `${a} ${ballName(a)} − ${b}` : `${a} ${NM(k)}, ${b} ${b === 1 ? 'runs' : 'run'} away`,
      say: how + ' How many are left?', vis: items(k, a, b), opts: littleNums(d, 0, max), right: `${a} take away ${b} is ${d}!`, wrong: `${a} take away ${b} leaves ${d}.`};
  },
  // 🔥 Big Trainer
  add(max, regroup) {
    let a, b;
    if (max <= 20) { a = ri(2, max - 2); b = ri(2, max - a); }
    else for (let g = 0; g < 200; g++) {
      a = ri(11, 89); b = ri(5, 99 - a); if (b < 1 || a + b > 99) continue;
      const carry = (a % 10) + (b % 10) > 9; if (regroup === carry || (regroup && g > 150)) break;
    }
    const s = a + b, to = max > 20;
    return {kind: 'num', ans: s, expr: `${a}+${b}`, check: {a, b, max, regroup: !!regroup}, text: to ? 'Add the tens, then the ones!' : 'Add them up!', say: `What is ${a} plus ${b}?`,
      vis: eq(a, '+', b) + (to ? `<div class="mt-toline">${tensOnes(a)}<b class="mt-op">+</b>${tensOnes(b)}</div>` : ''), opts: bigNums(s, to ? [10, 1, 11, 9] : [1, 2, 10]),
      right: `${a} plus ${b} is ${s}!`, wrong: `${a} plus ${b} is ${s}.` + (to ? ` ${Math.floor(a / 10) * 10} plus ${Math.floor(b / 10) * 10} is ${Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10}, then add the ones.` : '')};
  },
  sub(max, regroup) {
    let a, b;
    if (max <= 20) { a = ri(5, max); b = ri(1, a - 1); }
    else for (let g = 0; g < 200; g++) {
      a = ri(21, 99); b = ri(4, a - 5); const borrow = (a % 10) < (b % 10); if (regroup === borrow || (regroup && g > 150)) break;
    }
    const d = a - b, to = max > 20;
    return {kind: 'num', ans: d, expr: `${a}-${b}`, check: {a, b, max, regroup: !!regroup}, text: to ? 'Take away the tens, then the ones!' : 'Take it away!', say: `What is ${a} minus ${b}?`,
      vis: eq(a, '−', b) + (to ? `<div class="mt-toline">${tensOnes(a)}</div>` : ''), opts: bigNums(d, to ? [10, 1, 11, 9] : [1, 2, 10]),
      right: `${a} minus ${b} is ${d}!`, wrong: `${a} minus ${b} is ${d}.`};
  },
  missing(max) {
    const f = pick(['a+?', '?+b', 'a-?']);
    let a, b, c, hole, expr, sayQ;
    if (max <= 20) { c = ri(6, 20); a = ri(1, c - 1); } else { c = ri(30, 99); a = ri(10, c - 5); }
    if (f === 'a-?') { const big = c; b = ri(1, big - 1); const res = big - b;   // big − ? = res  ->  ? = b
      return {kind: 'num', ans: b, expr: `${big}-${res}`, check: {form: f, a: big, c: res}, text: 'What number is missing?', say: `${big} minus what equals ${res}?`,
        vis: eq(big, '−', '?', 'b', res), opts: bigNums(b, [1, 2, 10]), right: `${big} minus ${b} is ${res}!`, wrong: `It's ${b}. ${big} minus ${b} is ${res}.`}; }
    b = c - a; hole = f === 'a+?' ? 'b' : 'a';
    expr = `${c}-${hole === 'b' ? a : b}`; sayQ = hole === 'b' ? `${a} plus what equals ${c}?` : `What plus ${b} equals ${c}?`;
    const ans = hole === 'b' ? b : a;
    return {kind: 'num', ans, expr, check: {form: f, a: hole === 'b' ? a : b, c}, text: 'What number is missing?', say: sayQ, vis: eq(a, '+', b, hole, c),
      opts: bigNums(ans, [1, 2, 10]), right: `${a} plus ${b} is ${c}!`, wrong: `It's ${ans}. ${a} plus ${b} is ${c}.`};
  },
  skip(steps) {
    const step = pick(steps), start = step * ri(step === 10 ? 0 : 1, step === 2 ? 20 : step === 5 ? 10 : 5), seq = Array.from({length: 5}, (_, i) => start + step * i);
    const at = Math.random() < .7 ? 4 : ri(1, 3), ans = seq[at];
    return {kind: 'num', ans, expr: `${seq[0]}+${step}*${at}`, check: {step, seq, at}, text: `Count by ${step}s!`, say: `Count by ${step}s. ` + seq.map((v, i) => i === at ? 'what' : v).join(', ') + '?',
      vis: `<div class="mt-skip">${seq.map((v, i) => `<span class="${i === at ? 'mt-hole' : ''}" ${i === at ? 'id="mtHole"' : ''}>${i === at ? '?' : v}</span>`).join('')}</div>`,
      opts: bigNums(ans, [step, 1, 2 * step], 0), right: `${seq.join(', ')}!`, wrong: `It's ${ans}. Counting by ${step}s goes ${seq.join(', ')}.`};
  },
  compare(max) {
    let a = ri(1, max), b = ri(1, max);
    if (max > 20 && Math.random() < .4) { const t = ri(1, 9), o = ri(0, 9); a = t * 10 + o; b = o * 10 + t; }     // tricky swaps like 47 and 74
    if (a === b) b = a === max ? a - 1 : a + 1;
    const big = Math.random() < .6, ans = big ? Math.max(a, b) : Math.min(a, b);
    return {kind: 'pick', ans, check: {nums: [a, b], big}, text: `Which number is ${big ? 'BIGGER' : 'SMALLER'}?`, say: `Which number is ${big ? 'bigger' : 'smaller'}? ${a} or ${b}?`,
      vis: `<div class="mt-ask">${big ? '🐘 bigger' : '🐭 smaller'}</div>`, opts: [a, b].map(v => ({v, html: `<span class="mt-num">${v}</span>`, label: String(v)})),
      right: big ? `${ans} is bigger than ${Math.min(a, b)}!` : `${ans} is smaller than ${Math.max(a, b)}!`, wrong: big ? `${ans} is bigger. Look at the tens first!` : `${ans} is smaller. Look at the tens first!`};
  },
  hpWord(maxHp) {
    const k = pick(BM), hp = 10 * ri(4, maxHp / 10), dmg = 10 * ri(1, hp / 10 - 1), left = hp - dmg;
    return {kind: 'num', ans: left, expr: `${hp}-${dmg}`, check: {hp, dmg}, text: `${NM(k)} has ${hp} HP and takes ${dmg} damage. How much HP is left?`,
      say: `${NM(k)} has ${hp} HP and takes ${dmg} damage. How much HP is left?`, vis: hpBox(k, hp, ['−' + dmg]), opts: bigNums(left, [10, 20, 5]),
      right: `${hp} minus ${dmg} is ${left} HP!`, wrong: `${hp} minus ${dmg} leaves ${left} HP.`};
  },
  groups(maxG, maxN) {
    const g = ri(2, maxG), n = ri(2, maxN), k = pick(LM), p = g * n;
    return {kind: 'num', ans: p, expr: `${g}*${n}`, check: {g, n}, text: `${g} teams of ${n} Pokémon. How many Pokémon?`, say: `${g} teams, with ${n} Pokémon on each team. How many Pokémon in all?`,
      vis: `<div class="mt-groups">${Array.from({length: g}, () => `<span class="mt-team">${items(k, n, 0, 'tiny')}</span>`).join('')}</div>`,
      opts: bigNums(p, [n, 1, g]), right: `${g} groups of ${n} is ${p}! That's ${g} times ${n}!`, wrong: `It's ${p}. ${g} groups of ${n} is ${p}. Count by ${n}s!`};
  },
  weak() {
    const [atk, def, type] = pick(WEAK), dmg = 10 * ri(1, 6), tot = dmg * 2;
    return {kind: 'num', ans: tot, expr: `${dmg}*2`, check: {dmg}, text: `${NM(atk)}'s attack does ${dmg} damage. ${NM(def)} is weak to ${type}, so it's ×2! How much damage?`,
      say: `${NM(atk)}'s attack does ${dmg} damage. ${NM(def)} is weak to ${type}, so the damage is doubled! How much damage does it do?`,
      vis: `<div class="mt-vs">${hpBox(atk, '⚔️', [], 'small')}<span class="mt-badge red">×2</span>${hpBox(def, '💥', [], 'small')}</div>`.replace(/HP <b>⚔️<\/b>/, '⚔️').replace(/HP <b>💥<\/b>/, 'Weak ×2'),
      opts: bigNums(tot, [dmg, 10, 20]), right: `${dmg} times 2 is ${tot}! Weakness doubles the damage!`, wrong: `Weakness doubles it. ${dmg} plus ${dmg} is ${tot}.`};
  },
  resist() {
    const k = pick(BM), d2 = pick(BM.filter(x => x !== k)), dmg = 10 * ri(4, 12), tot = dmg - 30;
    return {kind: 'num', ans: tot, expr: `${dmg}-30`, check: {dmg}, text: `${NM(k)}'s attack does ${dmg} damage. ${NM(d2)} has Resistance: −30. How much damage?`,
      say: `${NM(k)}'s attack does ${dmg} damage. ${NM(d2)} has Resistance, so take away 30. How much damage does it do?`,
      vis: `<div class="mt-vs">${hpBox(k, '⚔️', [], 'small')}<span class="mt-badge blue">−30</span>${hpBox(d2, '🛡️', [], 'small')}</div>`.replace(/HP <b>⚔️<\/b>/, '⚔️').replace(/HP <b>🛡️<\/b>/, 'Resist −30'),
      opts: bigNums(tot, [10, 30, 20]), right: `${dmg} minus 30 is ${tot}!`, wrong: `Resistance takes away 30. ${dmg} minus 30 is ${tot}.`};
  },
  prizes() {
    const f = pick(['left', 'left', 'take']);
    if (f === 'take') { const ex = ri(1, 3), reg = ri(0, 2), t = ex * 2 + reg;
      return {kind: 'num', ans: t, expr: `${ex}*2+${reg}`, check: {ex, reg}, text: `You knock out ${ex} Pokémon ex${reg ? ` and ${reg} regular Pokémon` : ''}. An ex gives 2 prize cards! How many prize cards do you take?`,
        say: `You knock out ${ex} Pokémon ex${reg ? `, and ${reg} regular Pokémon` : ''}. A Pokémon ex gives you 2 prize cards. How many prize cards do you take?`,
        vis: `<div class="mt-exrow">${'<span class="mt-exc">ex<small>2</small></span>'.repeat(ex)}${'<span class="mt-exc reg">1</span>'.repeat(reg)}</div>`,
        opts: bigNums(t, [1, 2], 1, 12), right: `${t} prize cards!`, wrong: `It's ${t}. Each ex is 2, each regular Pokémon is 1.`}; }
    const have = ri(3, 6), ex = Math.random() < .5, take = ex ? 2 : 1, left = have - take;
    return {kind: 'num', ans: left, expr: `${have}-${take}`, check: {have, take}, text: `You have ${have} prize cards left. You knock out a ${ex ? 'Pokémon ex (2 prizes!)' : 'regular Pokémon (1 prize)'}. How many are left?`,
      say: `You have ${have} prize cards left. You knock out a ${ex ? 'Pokémon ex, and take 2 prize cards' : 'Pokémon and take 1 prize card'}. How many prize cards are left?`,
      vis: prizes(have, take), opts: bigNums(left, [1, 2], 0, 6), right: `${have} minus ${take} is ${left}!`, wrong: `${have} minus ${take} leaves ${left}.`};
  },
  // 👑 Champion
  mult(maxA) {
    const a = ri(2, maxA), b = ri(2, 10), p = a * b, [x, y] = Math.random() < .5 ? [a, b] : [b, a];
    return {kind: 'num', ans: p, expr: `${x}*${y}`, check: {a: x, b: y}, text: 'Times tables!', say: `What is ${x} times ${y}?`, vis: eq(x, '×', y),
      opts: bigNums(p, [x, y, 1, 10].filter((v, i, s) => s.indexOf(v) === i), 0), right: `${x} times ${y} is ${p}!`, wrong: `${x} times ${y} is ${p}.`};
  },
  missingFactor() {
    const a = ri(2, 10), b = ri(2, 10), p = a * b;
    return {kind: 'num', ans: a, expr: `${p}/${b}`, check: {a, b, p}, text: 'What number is missing?', say: `What times ${b} equals ${p}?`, vis: eq('?', '×', b, 'a', p),
      opts: bigNums(a, [1, 2], 1, 12), right: `${a} times ${b} is ${p}!`, wrong: `It's ${a}. ${a} times ${b} is ${p}.`};
  },
  share(maxEach) {
    const n = ri(2, 6), each = ri(2, maxEach), tot = n * each, k = pick(BM);
    const vis = `<div class="mt-share"><div class="mt-berries">${tot <= 30 ? '<i>🍓</i>'.repeat(tot) : `<b>${tot} 🍓</b>`}</div><div class="mt-pals">${Array.from({length: n}, () => one(k)).join('')}</div></div>`;
    return {kind: 'num', ans: each, expr: `${tot}/${n}`, check: {tot, n}, text: `${tot} berries shared equally by ${n} ${NM(k)}. How many does each get?`,
      say: `${tot} berries are shared equally by ${n} ${NM(k)}. How many berries does each one get?`, vis, opts: bigNums(each, [1, 2, 3], 1),
      right: `${tot} shared by ${n} is ${each} each!`, wrong: `Each gets ${each}. ${n} times ${each} is ${tot}.`};
  },
  dblHalf(max) {
    const dbl = Math.random() < .5;
    if (dbl) { const n = ri(6, max / 2), r = n * 2; return {kind: 'num', ans: r, expr: `${n}*2`, check: {n, dbl}, text: `Double ${n}!`, say: `What is double ${n}?`, vis: eq(n, '+', n),
      opts: bigNums(r, [1, 2, 10]), right: `Double ${n} is ${r}!`, wrong: `Double ${n} is ${r}. ${n} plus ${n}.`}; }
    const r = ri(5, max / 2), n = r * 2;
    return {kind: 'num', ans: r, expr: `${n}/2`, check: {n, dbl}, text: `Half of ${n}?`, say: `What is half of ${n}?`, vis: `<div class="mt-eq"><span>½</span><b>of</b><span>${n}</span><b>=</b><span class="mt-hole" id="mtHole">?</span></div>`,
      opts: bigNums(r, [1, 2, 5, 10], 1), right: `Half of ${n} is ${r}!`, wrong: `Half of ${n} is ${r}, because ${r} plus ${r} is ${n}.`};
  },
  numPattern(hard) {
    const kinds = hard ? ['add', 'sub', 'dbl', 'add'] : ['add', 'sub'], f = pick(kinds);
    let seq, rule, expr;
    if (f === 'dbl') { const s = ri(1, 6); seq = [0, 1, 2, 3, 4].map(i => s * 2 ** i); rule = 'doubles'; expr = `${s}*16`; }
    else { const step = pick(hard ? [3, 4, 6, 7, 9, 11, 25] : [3, 4, 5, 10, 20]);
      if (f === 'add') { const s = ri(1, 20); seq = [0, 1, 2, 3, 4].map(i => s + step * i); rule = `adds ${step}`; expr = `${s}+${step}*4`; }
      else { const s = step * 4 + ri(1, 30); seq = [0, 1, 2, 3, 4].map(i => s - step * i); rule = `takes away ${step}`; expr = `${s}-${step}*4`; } }
    const ans = seq[4];
    return {kind: 'num', ans, expr, check: {seq, f}, text: 'What comes next?', say: seq.slice(0, 4).join(', ') + '. What comes next?',
      vis: `<div class="mt-skip">${seq.map((v, i) => i === 4 ? '<span class="mt-hole" id="mtHole">?</span>' : `<span>${v}</span>`).join('')}</div>`,
      opts: bigNums(ans, [1, 2, Math.abs(seq[4] - seq[3])], 0), right: `${ans}! The pattern ${rule} each time.`, wrong: `It's ${ans}. The pattern ${rule} each time.`};
  },
  multiHP(weak) {
    if (weak) { const [atk, def, type] = pick(WEAK), dmg = 10 * ri(2, 7), hp = 10 * ri(dmg * 2 / 10 + 2, 33), left = hp - dmg * 2;
      return {kind: 'num', ans: left, expr: `${hp}-${dmg}*2`, check: {hp, dmg}, text: `${NM(def)} has ${hp} HP. ${NM(atk)} attacks for ${dmg}, and ${NM(def)} is weak to ${type} (×2). How much HP is left?`,
        say: `${NM(def)} has ${hp} HP. ${NM(atk)} attacks for ${dmg} damage, and ${NM(def)} is weak to ${type}, so it's doubled. How much HP is left?`,
        vis: hpBox(def, hp, [`−${dmg} ×2`]), opts: bigNums(left, [10, dmg, 20]), right: `${dmg} doubled is ${dmg * 2}, and ${hp} minus ${dmg * 2} is ${left}!`, wrong: `${dmg} doubled is ${dmg * 2}. ${hp} minus ${dmg * 2} leaves ${left} HP.`}; }
    const k = pick(BM), hp = 10 * ri(12, 33), a = 10 * ri(2, Math.min(12, hp / 10 - 2)), b = 10 * ri(1, Math.min(12, (hp - a) / 10 - 1)), left = hp - a - b;
    return {kind: 'num', ans: left, expr: `${hp}-${a}-${b}`, check: {hp, a, b}, text: `${NM(k)} has ${hp} HP. It takes ${a} damage, then ${b} more. How much HP is left?`,
      say: `${NM(k)} has ${hp} HP. It takes ${a} damage, and then ${b} more damage. How much HP is left?`, vis: hpBox(k, hp, ['−' + a, '−' + b]),
      opts: bigNums(left, [10, 20, a, b]), right: `${hp} minus ${a} is ${hp - a}, minus ${b} is ${left}!`, wrong: `${hp} minus ${a} is ${hp - a}, then minus ${b} leaves ${left}.`};
  }
};
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const numWord = n => WORDS[n] || String(n);

/* ---------- levels ---------- */
const LEVELS = {
  little: [
    {name: 'Count to 5', em: '🖐️', skills: [['count', 5], ['numFind', 5], ['matchGroup', 5], ['count', 5]]},
    {name: 'Count to 10', em: '🔟', skills: [['count', 10], ['moreFewer', 6], ['numFind', 10], ['shapes'], ['matchGroup', 8]]},
    {name: 'Patterns + adding to 5', em: '➕', skills: [['pattern', 'AB'], ['addPics', 5], ['count', 10], ['shapes'], ['moreFewer', 10]]},
    {name: 'Add + take away to 5', em: '➖', skills: [['addPics', 5], ['subPics', 5], ['pattern', 'ABB'], ['sides'], ['matchGroup', 10], ['pattern', 'AAB']]},
    {name: 'Add + take away to 10', em: '🌟', skills: [['addPics', 10], ['subPics', 10], ['count', 20], ['numFind', 20], ['pattern', 'ABC'], ['moreFewer', 10]]}],
  big: [
    {name: 'Add + subtract to 20', em: '➕', skills: [['add', 20], ['sub', 20], ['compare', 50], ['skip', [10]], ['add', 20]]},
    {name: 'Missing numbers + skip counting', em: '❓', skills: [['missing', 20], ['skip', [5, 2]], ['hpWord', 120], ['compare', 100], ['sub', 20]]},
    {name: 'Tens + ones to 100', em: '💯', skills: [['add', 100, false], ['sub', 100, false], ['groups', 4, 5], ['skip', [2, 5, 10]], ['prizes']]},
    {name: 'Card game math', em: '⚔️', skills: [['weak'], ['resist'], ['prizes'], ['add', 100, true], ['sub', 100, true], ['hpWord', 200], ['groups', 5, 5], ['missing', 100]]}],
  champ: [
    {name: 'Times tables + sharing', em: '✖️', skills: [['mult', 5], ['share', 5], ['dblHalf', 50], ['mult', 5], ['missing', 100]]},
    {name: 'Multi-step HP math', em: '❤️', skills: [['multiHP', false], ['mult', 10], ['numPattern', false], ['share', 8], ['dblHalf', 100]]},
    {name: 'Champion mix', em: '👑', skills: [['multiHP', true], ['multiHP', false], ['mult', 10], ['missingFactor'], ['share', 10], ['numPattern', true], ['dblHalf', 200]]}]
};
const MODES = {little: {name: 'Little Trainer', who: 'little', art: 'me55-23', age: 'ages 4-5', cls: 'little'},
  big: {name: 'Big Trainer', who: 'big', art: 'tcg-714372', age: 'ages 6+', cls: 'big'},
  champ: {name: 'Champion', who: 'big', art: 'me55-63', age: 'hard mix', cls: 'champ'}};
const ROUND = 10;
// evolving buddy: Charmander -> Charmeleon -> Charizard (cards from Card Battle School)
const BUDDY = [{id: 'base1-46', n: 'Charmander'}, {id: 'base1-24', n: 'Charmeleon'}, {id: 'tcg-714372', n: 'Charizard'}];
const stageFor = s => s >= 6 ? 2 : s >= 3 ? 1 : 0;

const store = (k, v) => K().store(k, v);
const lvlOf = m => Math.min(LEVELS[m].length - 1, Math.max(0, parseInt(store('mathLvl.' + m) || '0', 10) || 0));
const bestOf = m => parseInt(store('mathBest.' + m) || '0', 10) || 0;
const champUnlocked = () => store('mathChamp') === '1';
const padPref = m => { const v = store('mathPad.' + m); return v === '1' ? true : v === '0' ? false : null; };
const usePad = m => m !== 'little' && (padPref(m) != null ? padPref(m) : (m === 'champ' || lvlOf(m) >= 2));

let S = null, recent = [];
function make(mode, lvl) {                              // a fresh question for this level, not the same as the last few
  const L = LEVELS[mode][lvl];
  for (let g = 0; g < 30; g++) {
    const [fn, ...args] = pick(L.skills), q = G[fn](...args);
    q.skill = fn; q.mode = mode; q.lvl = lvl; q.key = fn + ':' + (q.expr || '') + ':' + JSON.stringify(q.check);
    if (!recent.includes(q.key) || g === 29) { recent = [q.key, ...recent].slice(0, 6); return q; }
  }
}
// Shared Trainer profiles (trainer.js), only if it's there: XP = 5 per right answer + 15 for finishing the round, given once at the
// end (so a level-up celebration never pops up in the middle of a question), plus the round's stars as the Math score.
const XP_RIGHT = 5, XP_ROUND = 15;
function trainerEnd(right, stars) {
  const T = window.Trainer; if (!T) return;
  try { T.addXP && T.addXP(S.who, right * XP_RIGHT + XP_ROUND, 'math'); } catch (e) {}
  try { T.recordScore && T.recordScore(S.who, 'math', stars); } catch (e) {}
  const champ = (S.mode === 'champ' && stars >= 7) || S.unlockedNow;
  try { if (stars >= 7 && T.recordWin) T.recordWin(S.who, 'math', {champion: champ}); else if (champ && T.award) T.award(S.who, 'math'); } catch (e) {}
}

/* ---------- screens ---------- */
function picker(quiet) {
  K().clearTimers(); S = null; closeOverlays();
  const tile = m => { const M = MODES[m], L = LEVELS[m][lvlOf(m)];
    return `<button class="mt-player ${M.cls}" data-mode="${m}" aria-label="${M.name}">
      <span class="mt-pava"><img src="${ART(M.art)}" alt="" draggable="false">${m === 'champ' ? `<i aria-hidden="true">👑</i>` : ''}</span>
      <span class="mt-ptext"><span class="mt-pname">${M.name}</span><span class="mt-psub">${M.age} · ${L.em} ${L.name}</span>
      <span class="mt-pbest">🏆 Best <b>${bestOf(m)}</b> ⭐ · Level <b>${lvlOf(m) + 1}</b>/${LEVELS[m].length}</span>
      ${m === 'champ' && !champUnlocked() ? '<span class="mt-plock">Earn the crown in Big Trainer, or try it now!</span>' : ''}</span></button>`; };
  K().frame('Pokémon Math', `<div class="mt-pick">
      <div class="mt-title"><span class="fg-bounce">🔢</span> Pokémon Math! <span class="fg-bounce d2">⭐</span></div>
      <div class="mt-hello">Who's playing?</div>
      <div class="mt-players">${tile('little')}${tile('big')}${tile('champ')}</div></div>`, '<div class="mt-barfill"></div>');
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => begin(b.dataset.mode));
  if (!quiet && talk() !== 'quiet') speak([["Pokémon Math! Who's playing? Pikachu is the Little Trainer. Charizard is the Big Trainer. Mewtwo is the Champion!", 'line']]);
}
function begin(mode) {
  K().clearTimers(); K().SFX.match(); closeOverlays();
  S = {mode, who: MODES[mode].who, lvl: lvlOf(mode), i: 0, stars: 0, res: [], run: 0, miss: 0, streak: 0, bestStreak: 0, stage: 0, told: {}, lvUps: 0, unlockedNow: false, startLvl: lvlOf(mode)};
  recent = [];
  show(`Let's go, ${MODES[mode].name}!`);
}
function bar() {
  const L = LEVELS[S.mode][S.lvl], b = BUDDY[S.stage];
  const dts = Array.from({length: ROUND}, (_, i) => `<i class="${i < S.res.length ? (S.res[i] ? 'ok' : 'no') : i === S.i ? 'now' : ''}"></i>`).join('');
  return `<div class="mt-lv ${S.mode}" id="mtLv" aria-label="Level ${S.lvl + 1}: ${L.name}"><span>${L.em}</span><b>Lv ${S.lvl + 1}</b></div>
    <div class="tv-dots mt-dotsbar" aria-label="Question ${S.i + 1} of ${ROUND}">${dts}</div>
    <div class="mt-buddy" id="mtBuddy" aria-label="${b.n}, streak ${S.streak}"><img src="${CARD(b.id)}" alt="" draggable="false"><span class="mt-streak" id="mtStreak">🔥${S.streak}</span></div>
    <div class="fg-starbox" id="mtStars" aria-label="${S.stars} stars"><span>⭐</span><b>${S.stars}</b></div>`;
}
function show(prefix = '', keep = null) {
  const q = S.q = keep || make(S.mode, S.lvl);
  S.answered = false; S.typed = '';
  const pad = q.kind === 'num' && usePad(S.mode);
  const canPad = S.mode !== 'little' && q.kind === 'num';
  const optsHTML = pad ? `<div class="mt-pad" id="mtPad">
      <div class="mt-padshow" id="mtShow" aria-live="polite">?</div>
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="mt-key" data-k="${n}">${n}</button>`).join('')}
      <button class="mt-key del" data-k="del" aria-label="Delete">⌫</button><button class="mt-key" data-k="0">0</button>
      <button class="mt-key ok" data-k="ok" aria-label="Check">✔</button></div>`
    : `<div class="mt-opts n${q.opts.length} ${q.grp ? 'grp' : ''}" id="mtOpts">${q.opts.map(o => `<button class="mt-opt" data-v="${o.v}" aria-label="${o.label}">${o.html}</button>`).join('')}</div>`;
  K().frame('Pokémon Math', `<div class="mt ${S.mode}" id="mt">
      <div class="mt-q"><div class="mt-bubble"><button class="fg-icon mt-hear" id="mtHear" aria-label="Hear it again">🔊</button>
          <div class="mt-text">${q.text}</div></div>
        <div class="mt-vis">${q.vis}</div></div>
      <div class="mt-ans">${optsHTML}
        ${canPad ? `<button class="mt-switch" id="mtSwitch">${pad ? '🔘 Pick an answer' : '🔢 Type it'}</button>` : ''}</div>
      <div class="mt-nextrow"><div class="mt-after" id="mtAfter"></div><button class="btn red mt-next" id="mtNext">${S.i + 1 < ROUND ? 'Next ▶' : '🏆 My stars!'}</button></div>
    </div><div class="fg-win" id="mtWin" hidden></div>`, bar());
  document.getElementById('mtHear').onclick = () => speak([[S.answered ? S.after : q.say, 'replay']]);
  if (pad) document.getElementById('mtPad').addEventListener('click', e => { const b = e.target.closest('.mt-key'); if (b) key(b.dataset.k); });
  else document.getElementById('mtOpts').addEventListener('click', e => { const b = e.target.closest('.mt-opt'); if (b) answer(b.dataset.v, b); });
  const sw = document.getElementById('mtSwitch');
  if (sw) sw.onclick = () => { if (S.answered) return; K().SFX.tap(); store('mathPad.' + S.mode, pad ? '0' : '1'); show('', q); };   // same question, other answer style
  document.getElementById('mtNext').onclick = next;
  // speech: the youngest can't read, so the question is always spoken for Little Trainer (unless muted); quiet = no extras
  const t = talk(), first = !S.told[q.skill]; S.told[q.skill] = 1;
  const parts = [];
  if (t !== 'quiet' && prefix) parts.push([prefix, 'line']);
  if (t !== 'quiet' || S.mode === 'little') parts.push([q.say, S.mode === 'little' ? 'must' : 'line']);   // pre-readers always hear the question once
  if (t === 'chatty' && first && q.tip) parts.push([q.tip, 'extra']);
  if (!keep) speak(parts);
}
function key(k) {
  if (S.answered) return;
  if (k === 'ok') { if (!S.typed) { K().SFX.nope(); return; } return answer(S.typed, null); }
  K().SFX.tap();
  S.typed = k === 'del' ? S.typed.slice(0, -1) : (S.typed + k).replace(/^0+(?=\d)/, '').slice(0, 3);
  const v = S.typed || '?', s = document.getElementById('mtShow'), h = document.getElementById('mtHole');
  if (s) s.textContent = v; if (h) h.textContent = v;
}
function answer(v, btn) {
  if (S.answered) return;
  const q = S.q, right = String(v) === String(q.ans);
  S.answered = true; S.res.push(right);
  document.getElementById('mt').classList.add('answered');
  const all = [...document.querySelectorAll('.mt-opt')], good = all.find(o => o.dataset.v === String(q.ans));
  const ans = document.querySelector('.mt-ans'); if (ans) ans.classList.add('done');
  const h = document.getElementById('mtHole'); if (h) { h.textContent = q.ans; h.classList.add(right ? 'ok' : 'fix'); }
  const shw = document.getElementById('mtShow'); if (shw) { shw.textContent = right ? v : `${v} → ${q.ans}`; shw.classList.add(right ? 'ok' : 'fix'); }
  const t = talk(); let sound = right ? 'match' : 'aww', line = '', evolved = false, levelMsg = '';
  if (right) {
    S.stars++; S.streak++; S.bestStreak = Math.max(S.bestStreak, S.streak); S.run++; S.miss = 0;
    if (btn) { btn.classList.add('right'); all.forEach(o => { if (o !== btn) o.classList.add('gone'); }); }
    const st = stageFor(S.streak); if (st > S.stage) { S.stage = st; evolved = true; sound = 'evo'; }
    if (S.run >= 3) { S.run = 0; levelMsg = levelUp(); }
  } else {
    S.streak = 0; S.miss++; S.run = 0;
    if (btn) { btn.classList.add('wrong', 'wiggle'); }
    if (good) { good.classList.add('right', 'show'); all.forEach(o => { if (o !== good && o !== btn) o.classList.add('gone'); }); }
    if (S.miss >= 2) { S.miss = 0; levelMsg = levelDown(); }
  }
  stars(right);
  try { if (window.Trainer && window.Trainer.answer) window.Trainer.answer(S.who, right); } catch (e) {}
  const buddy = document.getElementById('mtBuddy'), sk = document.getElementById('mtStreak');
  if (sk) sk.textContent = '🔥' + S.streak;
  const after = document.getElementById('mtAfter');
  const shown = right ? '✅ ' + q.right : '💡 ' + q.wrong;
  if (after) after.innerHTML = `<span>${shown}</span>${levelMsg ? `<span class="mt-lvmsg">${levelMsg}</span>` : ''}`;
  S.after = (right ? q.right : 'Oops! ' + q.wrong) + (levelMsg ? ' ' + levelMsg.replace(/[⬆️⬇️👑]/gu, '') : '');
  K().SFX[sound]();                                      // one sound for this tap
  if (evolved) evolve(buddy);
  else if (right && !RM()) K().confetti(36, btn || document.getElementById('mtShow'));
  // speech: Normal = short cheer or the answer; Chatty = the full explanation; Quiet = nothing (🔊 has it)
  if (t === 'normal') line = right ? (evolved ? `Whoa! Charmander evolved!` : q.right) : 'Oops! ' + q.wrong;
  if (t === 'chatty') line = S.after + (evolved ? ` Your buddy evolved into ${BUDDY[S.stage].n}!` : '');
  if (t === 'quiet' && levelMsg) line = '';
  if (levelMsg && t === 'normal') line += ' ' + levelMsg.replace(/[⬆️⬇️👑]/gu, '');
  if (line) speak([[line, 'result']]);
  K().later(() => { const n = document.getElementById('mtNext'); if (n) n.classList.add('want'); }, 900);
}
function levelUp() {
  const top = LEVELS[S.mode].length - 1;
  if (S.lvl < top) { S.lvl++; store('mathLvl.' + S.mode, S.lvl); S.lvUps++; paintLv(true); return `⬆️ Level up! Level ${S.lvl + 1}: ${LEVELS[S.mode][S.lvl].name}`; }
  if (S.mode === 'big' && !champUnlocked()) { store('mathChamp', '1'); S.unlockedNow = true; return '👑 You earned the Champion crown!'; }
  return '';
}
function levelDown() {
  if (S.lvl <= 0) return '';
  S.lvl--; store('mathLvl.' + S.mode, S.lvl); paintLv(false); return `⬇️ Let's practice Level ${S.lvl + 1} a little more.`;
}
function paintLv(up) {
  const L = LEVELS[S.mode][S.lvl], el = document.getElementById('mtLv'); if (!el) return;
  el.innerHTML = `<span>${L.em}</span><b>Lv ${S.lvl + 1}</b>`; el.setAttribute('aria-label', `Level ${S.lvl + 1}: ${L.name}`);
  el.classList.remove('up', 'down'); void el.offsetWidth; el.classList.add(up ? 'up' : 'down');
}
function stars(right) {
  const box = document.getElementById('mtStars'); if (!box) return; const s = box.querySelector('b');
  box.classList.remove('pop', 'lose', 'wobble'); void box.offsetWidth;
  if (right) { s.textContent = S.stars; box.classList.add('pop'); box.setAttribute('aria-label', S.stars + ' stars'); return; }
  if (S.stars <= 0) { box.classList.add('wobble'); return; }        // at 0: a gentle wobble, nothing taken away
  S.stars--; s.textContent = S.stars; box.classList.add('lose'); box.setAttribute('aria-label', S.stars + ' stars');
  const r = box.getBoundingClientRect(), f = document.createElement('div');
  f.className = 'fg-minus'; f.innerHTML = '−1 <span>⭐</span>'; f.setAttribute('aria-hidden', 'true');
  f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.bottom + 8) + 'px';
  document.body.appendChild(f); setTimeout(() => f.remove(), 1700);
}
function evolve(buddy) {                                 // the buddy glows white, grows, and turns into the next stage
  const b = BUDDY[S.stage], was = BUDDY[S.stage - 1];
  if (buddy) { buddy.querySelector('img').src = CARD(b.id); buddy.setAttribute('aria-label', b.n + ', streak ' + S.streak); }
  const ov = document.createElement('div'); ov.className = 'mt-evo' + (RM() ? ' still' : ''); ov.id = 'mtEvo'; ov.setAttribute('aria-hidden', 'true');
  ov.innerHTML = `<div class="mt-evobox"><div class="mt-evorays"></div><img class="from" src="${CARD(was.id)}" alt=""><img class="to" src="${CARD(b.id)}" alt="">
    <div class="mt-evotxt">${was.n} evolved into ${b.n}!</div></div>`;
  ov.onclick = () => ov.remove();
  document.body.appendChild(ov); K().later(() => { const o = document.getElementById('mtEvo'); if (o) o.remove(); }, RM() ? 1600 : 2300);
  if (!RM()) K().confetti(90);
}
function closeOverlays() { ['mtEvo'].forEach(id => { const o = document.getElementById(id); if (o) o.remove(); }); }
function next() {
  if (!S || !S.answered) return;
  K().clearTimers(); closeOverlays();
  S.i++;
  if (S.i >= ROUND) return finish();
  K().SFX.tap(); show(); scrollTo(0, 0);
}
function finish() {
  const w = document.getElementById('mtWin'); if (!w) return;
  const n = S.stars, old = bestOf(S.mode), nb = n > old; if (nb) store('mathBest.' + S.mode, n);
  const right0 = S.res.filter(Boolean).length;
  trainerEnd(right0, n);
  const b = BUDDY[S.stage], L = LEVELS[S.mode][S.lvl], right = S.res.filter(Boolean).length;
  const row = '⭐'.repeat(n) + `<span class="tv-dim">${'⭐'.repeat(Math.max(0, ROUND - n))}</span>`;
  w.innerHTML = `<div class="fg-winbox mt-winbox ${S.mode}">
      <div class="mt-winbuddy"><img class="fg-bounce" src="${CARD(b.id)}" alt="${b.n}" draggable="false"></div>
      <div class="fg-big">You got ${n === 1 ? '1 star' : n + ' stars'}!</div><div class="tv-orow big">${row}</div>
      <div class="mt-winfacts"><span>✅ ${right} of ${ROUND} right</span><span>🔥 Best streak ${S.bestStreak}</span><span>${L.em} Level ${S.lvl + 1}: ${L.name}</span></div>
      <div class="fg-sub">${nb ? '🏆 New best score!' : `🏆 Best: ${Math.max(old, n)} ⭐`}</div>
      ${S.unlockedNow ? '<div class="mt-crown">👑 Champion mode unlocked!</div>' : ''}
      <div class="tc-winbtns"><button class="btn red fg-again" id="mtAgain">🔁 Play again</button>
        ${S.unlockedNow ? '<button class="btn mt-goldbtn" id="mtChamp">👑 Try Champion</button>' : ''}
        <button class="btn blue fg-again" id="mtWho">👥 Who's playing?</button></div></div>`;
  w.hidden = false; K().SFX.win(); if (!RM()) { K().confetti(120); K().later(() => K().confetti(80), 1000); }
  if (talk() !== 'quiet' || S.mode === 'little') speak([[`You got ${n === 1 ? '1 star' : n + ' stars'}! ` + (S.unlockedNow ? 'And you earned the Champion crown! ' : '') + (nb && n > 0 ? "That's your new best!" : n >= 7 ? 'Awesome math, trainer!' : 'Great practice, trainer!'), 'result']]);
  document.getElementById('mtAgain').onclick = () => begin(S.mode);
  document.getElementById('mtWho').onclick = () => { K().SFX.tap(); picker(true); };
  const c = document.getElementById('mtChamp'); if (c) c.onclick = () => begin('champ');
}

function render() { picker(); }
// Route + games-list link without editing games.js: newer games.js routes #/games/math here itself; older ones get a small hook.
(function hook() {
  const FG = window.FentonGames; if (!FG || FG._mathHook) return; FG._mathHook = true;
  const orig = FG.render;
  FG.render = (app, data, sub) => {
    const r = orig(app, data, sub);
    if (sub === 'math' && !app.querySelector('.mt-pick, .mt')) render();          // older games.js showed its menu: draw Math instead
    if (!sub && !app.querySelector('a[href="#/games/math"]')) {                     // older menu: add a Math tile
      const m = app.querySelector('.fg-menu'); if (m) m.insertAdjacentHTML('beforeend', `<a class="fg-pick mtpick" href="#/games/math">
        <span class="fg-pickart"><span class="mtpick-art"><b>1</b><b>+</b><b>2</b></span></span>
        <span class="fg-pickname">Pokémon Math</span><span class="fg-picksub">count, add + times ➕</span></a>`);
    }
    return r;
  };
})();
// test hooks for headless checks
return {render, LEVELS, G, talk, _make: (m, l) => make(m, l), _state: () => S, _begin: begin, _ear: ear};
})();
