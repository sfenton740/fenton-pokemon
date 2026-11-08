/* node tests/grading.test.js */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const G = require('../grading-math.js');

const TODAY = '2026-11-08';
const settings = G.clampSettings(null);
const comps = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'grading-comps.json'), 'utf8'));

function card(id, extra) {
  return Object.assign({
    id, name: 'Gengar ex', num: '154/128', set: '30th Celebration', qty: 3,
    where: ['30th Binder 1 · Page 18 · Pocket 1', '30th Extras Binder · Page 18 · Pocket 1', '30th Bulk'],
    price: 51.11, psa: 763.5, psa_asof: '2026-11-02', psa_sales: 25
  }, extra);
}
const GENGAR = card('me55-154');

function ref(id) {
  return comps.cards[id].rows.map(r => G.adaptReferenceRow(r, comps.provenance));
}
function summary(id, imports, opts) {
  return G.summarizeCard(id, ref(id), imports || [], opts || settings, TODAY);
}
function sale(over) {
  return Object.assign({
    inventory_id: 'me55-154',
    grade_class: 'PSA 10',
    date: '2026-11-07',
    price_usd: 600,
    currency: 'USD',
    sale_id: '999000111222',
    marketplace: 'eBay',
    source: 'ebay-product-research',
    best_offer: 'verified-accepted',
    shipping: 4.95,
    title: '2026 Pokemon 30th Celebration Gengar ex 154/128 PSA 10',
    language: 'English',
    variant: 'standard',
    original_url: 'https://www.ebay.com/itm/999000111222'
  }, over);
}

function cents(n) { return G.roundCents(n); }

/* --- published defaults reproduce the cross-checked file, not the older plan table --- */
{
  const s = summary('me55-154');
  assert.strictEqual(s.grades['PSA 10'].n, 29);
  assert.strictEqual(s.grades['PSA 10'].status, 'median');
  assert.strictEqual(s.grades['PSA 10'].median, 628.88);
  assert.strictEqual(s.grades['PSA 10'].min, 510);
  assert.strictEqual(s.grades['PSA 10'].max, 810);
  assert.strictEqual(s.grades['PSA 9'].n, 6);
  assert.strictEqual(s.grades['PSA 9'].median, 141.5);
  assert.strictEqual(s.grades.raw.n, 12);
  assert.strictEqual(s.grades.raw.median, 61.64);
  assert.strictEqual(s.grades['PSA 8'].n, 0);
  assert.strictEqual(s.grades['PSA 8'].status, 'unknown');
  assert.strictEqual(s.grades['PSA 8'].median, null);
  assert.strictEqual(s.grades['TAG 9'].n, 1);
  assert.strictEqual(s.grades['TAG 9'].status, 'observations');
  assert.strictEqual(s.grades['TAG 9'].median, null);
  assert.strictEqual(s.grades['TAG 10'].n, 7);
  assert.strictEqual(s.grades['TAG 10'].median, 399);
  assert.strictEqual(s.grades['TAG 10 Pristine'].n, 0);
  assert.strictEqual(s.grades['TAG 10 Pristine'].median, null);
  assert.strictEqual(s.models['PSA 10'].incremental, 417.33);
  assert.strictEqual(s.models['TAG 10'].incremental, 220.08);
  assert.strictEqual(s.models['PSA 9'].incremental, -0.95);
  assert.strictEqual(s.models['PSA 8'].incremental, null);
  assert.strictEqual(s.models['TAG 9'].incremental, null);
  assert.strictEqual(s.models['TAG 10 Pristine'].incremental, null);
  assert.ok(s.grades['PSA 10'].flags.includes('not-independently-verified'));
  assert.ok(s.grades['PSA 10'].flags.includes('shipping-unknown'));
  assert.ok(s.grades['PSA 10'].flags.includes('best-offer-unverified'));
  assert.ok(s.grades['PSA 10'].flags.includes('language-exclusion-only'));
  assert.strictEqual(s.grades['PSA 10'].stale, false);
  assert.strictEqual(s.grades['PSA 10'].window.start <= '2026-11-07', true);
  assert.strictEqual(s.grades['PSA 10'].window.end, '2026-11-07');
  const one = s.models['TAG 9'].observations;
  assert.strictEqual(one.length, 1);
  assert.strictEqual(one[0].price_usd, 150);
  assert.ok(/not a median/.test(one[0].label));
  assert.notStrictEqual(one[0].incremental, null);
}

{
  const z = summary('tcg-714372');
  assert.strictEqual(z.grades.raw.median, 169.99);
  assert.strictEqual(z.grades['PSA 10'].median, 980);
  assert.strictEqual(z.grades['PSA 10'].max, 1600);
  assert.strictEqual(z.models['PSA 10'].fee.fee, 79.99);
  assert.strictEqual(z.models['PSA 10'].fee.bumped, true);
  assert.strictEqual(z.models['PSA 10'].incremental, 605.68);
  assert.strictEqual(z.grades['PSA 9'].status, 'unknown');
  assert.strictEqual(z.grades['TAG 10'].status, 'observations');
  assert.strictEqual(z.grades['TAG 10'].median, null);
  assert.strictEqual(z.models['TAG 10'].incremental, null);
}

{
  const mew = summary('me55-158');
  assert.strictEqual(mew.grades.raw.median, 40);
  assert.strictEqual(mew.grades['PSA 10'].n, 29);
  assert.strictEqual(mew.grades['PSA 10'].median, 405);
  assert.strictEqual(mew.grades['PSA 9'].status, 'observations');
  assert.strictEqual(mew.models['PSA 9'].incremental, null);
  assert.strictEqual(mew.grades['TAG 10'].n, 3);
  assert.strictEqual(mew.grades['TAG 10'].median, null);
}

{
  const two = summary('me55-151');
  assert.strictEqual(two.grades['TAG 10'].n, 5);
  assert.strictEqual(two.grades['TAG 10'].median, 275);
  assert.strictEqual(two.grades.raw.median, 38);
  assert.ok(two.models['TAG 10'].incremental > 0);
  assert.strictEqual(two.grades['PSA 9'].median, null);
}

/* missing inputs stay unknown — no zero fill, no EV field */
{
  const broken = G.clampSettings({ sellFeeRate: 'nope', tagFee: '' });
  assert.strictEqual(broken.sellFeeRate, settings.sellFeeRate);
  const fee = G.gradingFeeFor('PSA 10', null, null, settings);
  assert.strictEqual(fee.fee, null);
  assert.strictEqual(fee.unknown, true);
  const inc = G.incremental(null, 61.64, settings, 59.99);
  assert.strictEqual(inc, null);
  const hypo = G.hypothetical({ grade: 'PSA 10', price: null, rawPrice: 61.64 }, settings);
  assert.strictEqual(hypo.verified, false);
  assert.strictEqual(hypo.incremental, null);
  assert.ok(/[Hh]ypothetical/.test(hypo.label));
  const hypoOk = G.hypothetical({ grade: 'TAG Gem 10', price: 399, rawPrice: 61.64 }, settings);
  assert.strictEqual(hypoOk.grade, 'TAG 10');
  assert.strictEqual(hypoOk.verified, false);
  assert.strictEqual(hypoOk.incremental, 220.08);
  assert.strictEqual(G.summarizeCard('me55-154', ref('me55-154'), [hypoOk], settings, TODAY).grades['TAG 10'].n, 7);
}

/* stale flag uses the newest sale, not a claim that the cache is live */
{
  const old = G.gradeStats(ref('me55-154').filter(r => r.grade_class === 'PSA 10'), 'PSA 10', settings, '2026-12-01');
  assert.strictEqual(old.stale, true);
  assert.ok(old.flags.includes('stale'));
  assert.strictEqual(old.median, 628.88);
}

/* lowering the median rule is honored and still not called certainty by the policy text */
{
  const loose = G.clampSettings({ minSalesForMedian: 1 });
  const s = summary('me55-154', [], loose);
  assert.strictEqual(s.grades['TAG 9'].status, 'median');
  assert.strictEqual(s.grades['TAG 9'].median, 150);
  assert.strictEqual(G.clampSettings({ minSalesForMedian: 0 }).minSalesForMedian, 5);
  assert.ok(G.POLICY.paragraphs.some(p => /at least 5 comparable sales/i.test(p)));
  assert.ok(G.POLICY.paragraphs.some(p => /not an expected value/i.test(p)));
  assert.ok(G.POLICY.paragraphs.some(p => /Missing prices stay unknown/i.test(p)));
  assert.ok(G.POLICY.paragraphs.some(p => /Cached prices are not live/i.test(p)));
  assert.ok(G.POLICY.paragraphs.some(p => /one sale/i.test(p)));
  assert.ok(G.POLICY.paragraphs.some(p => /not independently transaction-verified/i.test(p)));
  assert.ok(G.POLICY.paragraphs.some(p => /Accepted offers are unverified/i.test(p)));
  assert.ok(G.POLICY.paragraphs.some(p => /Shipping on those rows is unknown/i.test(p)));
  assert.ok(G.POLICY.paragraphs.some(p => /secondary database/i.test(p) && /not official/i.test(p)));
  assert.ok(G.POLICY.paragraphs.some(p => /does not record condition, language, or our own photos/i.test(p)));
  assert.ok(G.POLICY.paragraphs.some(p => /not a submission recommendation/i.test(p)));
  assert.ok(G.POLICY.paragraphs.some(p => /No percentage/i.test(p)));
}

/* import validation, exact match, dedup */
{
  const badLang = G.validateSale(sale({ language: 'Japanese', title: 'Japanese Gengar' }), GENGAR);
  assert.strictEqual(badLang.ok, false);
  const badGrade = G.validateSale(sale({ grade_class: 'CGC 10', title: 'Gengar CGC 10' }), GENGAR);
  assert.strictEqual(badGrade.ok, false);
  const half = G.validateSale(sale({ grade_class: 'PSA 9.5', title: 'Gengar PSA 9.5' }), GENGAR);
  assert.strictEqual(half.ok, false);
  const pristine = G.validateSale(sale({ grade_class: 'TAG Pristine', title: 'Gengar ex 154/128 TAG 10 Pristine' }), GENGAR);
  assert.strictEqual(pristine.ok, true);
  assert.strictEqual(pristine.sale.grade_class, 'TAG 10 Pristine');
  const gem = G.validateSale(sale({ grade_class: 'TAG Gem 10', title: 'Gengar ex 154/128 TAG Gem 10' }), GENGAR);
  assert.strictEqual(gem.sale.grade_class, 'TAG 10');
  assert.notStrictEqual(gem.sale.grade_class, 'TAG 10 Pristine');
  const mismatch = G.validateSale(sale({ grade_class: 'PSA 9', title: 'Gengar ex PSA 10' }), GENGAR);
  assert.strictEqual(mismatch.ok, false);
  const num = G.validateSale(sale({ number: '154/129' }), GENGAR);
  assert.strictEqual(num.ok, false);
  const name = G.validateSale(sale({ name: 'Haunter' }), GENGAR);
  assert.strictEqual(name.ok, false);
  const variant = G.validateSale(sale({ variant: '1st-edition' }), GENGAR);
  assert.strictEqual(variant.ok, false);
  const stamp = G.validateSale(sale({ variant: '30th-stamp' }), GENGAR);
  assert.strictEqual(stamp.ok, true);
  assert.ok(stamp.warnings.join(' ').includes('secondary database'));
  const otherCard = G.validateSale(sale({ inventory_id: 'me55-154', variant: '30th-stamp' }), card('me55-158', { name: 'Mew ex', num: '158/128' }));
  assert.strictEqual(otherCard.ok, false);
  const eur = G.validateSale(sale({ currency: 'EUR' }), GENGAR);
  assert.strictEqual(eur.ok, false);
  const noShip = G.validateSale(sale({ shipping: '' }), GENGAR);
  assert.strictEqual(noShip.ok, false);
  const unkShip = G.validateSale(sale({ shipping: 'unknown' }), GENGAR);
  assert.strictEqual(unkShip.ok, true);
  assert.strictEqual(unkShip.sale.shipping, 'unknown');
  const noOffer = G.validateSale(sale({ best_offer: '' }), GENGAR);
  assert.strictEqual(noOffer.ok, false);
  const ask = G.validateSale(sale({ best_offer: 'listed-not-accepted', source: 'ebay-sold' }), GENGAR);
  assert.strictEqual(ask.ok, false);
  const noId = G.validateSale(sale({ sale_id: '' }), GENGAR);
  assert.strictEqual(noId.ok, false);
  const rawPlayed = G.validateSale(sale({ grade_class: 'raw', title: 'Gengar ex 154/128 LP' }), GENGAR);
  assert.strictEqual(rawPlayed.ok, false);
  const rawOk = G.validateSale(sale({ grade_class: 'raw', title: 'Gengar ex 154/128 Near Mint English', source: 'tcgplayer', marketplace: 'TCGplayer', sale_id: 'tcg-1', original_url: '' }), GENGAR);
  assert.strictEqual(rawOk.ok, true);
  const unknownCard = G.validateSale(sale({ inventory_id: 'nope' }), null);
  assert.strictEqual(unknownCard.ok, false);
  const hypoRow = G.validateSale(sale({ kind: 'hypothetical', source: 'hypothetical' }), GENGAR);
  assert.strictEqual(hypoRow.ok, false);
}

/* private fields are not kept */
{
  const dirty = sale({
    notes: 'bought from a friend, do not publish',
    photo: 'data:image/jpeg;base64,AAAA',
    buyer_username: 'someone',
    address: '123 Main',
    api_key: 'sk-secret'
  });
  const res = G.validateSale(dirty, GENGAR);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.sale.notes, undefined);
  assert.strictEqual(res.sale.photo, undefined);
  assert.strictEqual(res.sale.buyer_username, undefined);
  assert.strictEqual(res.sale.address, undefined);
  assert.strictEqual(JSON.stringify(res.sale).includes('do not publish'), false);
  assert.strictEqual(JSON.stringify(res.sale).includes('sk-secret'), false);
  assert.ok(res.warnings.join(' ').includes('Ignored fields'));
}

/* same eBay item across sites is one sale; a verified accepted price wins */
{
  const pc = ref('me55-154').find(r => r.sale_id === '198773404973');
  assert.ok(pc, 'expected the crossed-price Gengar row');
  const research = G.validateSale(sale({
    sale_id: '198773404973',
    original_url: 'https://www.ebay.com/itm/198773404973',
    price_usd: 540,
    source: 'ebay-product-research',
    best_offer: 'verified-accepted',
    shipping: 0
  }), GENGAR).sale;
  const point = G.validateSale(sale({
    sale_id: '198773404973',
    original_url: 'https://www.ebay.com/itm/198773404973',
    price_usd: 540,
    source: '130point',
    best_offer: 'verified-accepted',
    shipping: 'unknown',
    marketplace: 'eBay'
  }), GENGAR).sale;
  const before = summary('me55-154').grades['PSA 10'].n;
  const after = summary('me55-154', [research, point]);
  assert.strictEqual(after.grades['PSA 10'].n, before);
  const kept = after.grades['PSA 10'].sales.find(r => G.ebayItemId(r) === '198773404973');
  assert.strictEqual(kept.source, 'ebay-product-research');
  assert.strictEqual(kept.price_usd, 540);
  assert.ok(kept.also_seen_on.includes('130point') || kept.also_seen_on.includes('pricecharting'));
  assert.ok(after.pool.dropped.length >= 2);
}

/* no item id: date + price + title collapses; a different item id does not */
{
  const a = G.validateSale(sale({ sale_id: '', sale_id_missing: true, original_url: '', title: 'Gengar ex 154/128 PSA 10 same', price_usd: 611, date: '2026-11-05' }), GENGAR).sale;
  const b = Object.assign({}, a, { source: '130point' });
  const c = G.validateSale(sale({ sale_id: '888777666555', original_url: 'https://www.ebay.com/itm/888777666555', title: 'Gengar ex 154/128 PSA 10 same', price_usd: 611, date: '2026-11-05' }), GENGAR).sale;
  const dup = G.dedupeSales([a, b, c]);
  assert.strictEqual(dup.kept.length, 2);
  assert.strictEqual(dup.dropped.length, 1);
}

/* language-exclusion policy removes the bundled rows when turned off */
{
  const off = summary('me55-154', [], G.clampSettings({ countUnverifiedLanguage: false }));
  assert.strictEqual(off.grades['PSA 10'].n, 0);
  assert.strictEqual(off.grades['PSA 10'].median, null);
  assert.strictEqual(off.models['PSA 10'].incremental, null);
}

/* CSV / JSON parse */
{
  const csv = G.blankTemplateCsv() + 'me55-154,PSA 10,2026-11-07,600,USD,999000111222,eBay,ebay-product-research,verified-accepted,4.95,"Gengar ex 154/128 PSA 10",English,standard,https://www.ebay.com/itm/999000111222,,,\n';
  const parsed = G.parseImport(csv);
  assert.strictEqual(parsed.format, 'csv');
  assert.strictEqual(parsed.records.length, 1);
  const v = G.validateSale(parsed.records[0], GENGAR);
  assert.strictEqual(v.ok, true, v.errors.join('; '));
  const json = G.parseImport(JSON.stringify({ sales: [sale({ notes: 'private' })] }));
  assert.strictEqual(json.format, 'json');
  const jv = G.validateSale(json.records[0], GENGAR);
  assert.strictEqual(jv.ok, true);
  assert.strictEqual(JSON.stringify(jv.sale).includes('private'), false);
  const round = G.parseImport(G.toCsv([jv.sale]));
  assert.strictEqual(round.records[0].sale_id, '999000111222');
  assert.strictEqual(round.records[0].currency, 'USD');
  const empty = G.parseImport('');
  assert.ok(empty.errors.length);
  const bad = G.parseImport('{');
  assert.ok(bad.errors.length);
}

/* copies: ids per pocket, disposition unknown, no accuracy percentage */
{
  const slots = G.copySlots(GENGAR);
  assert.deepStrictEqual(slots.map(s => s.copyId), ['me55-154#1', 'me55-154#2', 'me55-154#3']);
  assert.ok(slots.every(s => s.disposition === 'unknown' && s.condition == null && s.photo === 'none'));
  const none = G.accuracyReport(slots);
  assert.strictEqual(none.percentage, null);
  assert.strictEqual(none.status, 'withheld');
  const marked = slots.map((s, i) => Object.assign({}, s, {
    frozen: { grade: 'PSA 10', at: '2026-11-08' },
    returned: i === 0 ? { grade: 'PSA 9', at: '2027-01-01' } : null
  }));
  const acc = G.accuracyReport(marked);
  assert.strictEqual(acc.percentage, null);
  assert.strictEqual(acc.returned, 1);
  assert.strictEqual(acc.matched, 0);
  assert.strictEqual(acc.status, 'counts-only');
}

/* evidence bucket is not a recommendation; inventory price is not the comp */
{
  const s = summary('me55-154');
  const bucket = G.evidenceBucket(GENGAR, s);
  assert.strictEqual(bucket.bucket, 'research-candidate');
  assert.strictEqual(bucket.recommendation, false);
  const thin = G.evidenceBucket(card('tcg-716208', { name: 'Arceus VSTAR', num: '123/172', set: 'Classic Collection', qty: 3, psa: 462, where: [] }), { settings, pool: { kept: [] } });
  assert.strictEqual(thin.bucket, 'insufficient');
  assert.notStrictEqual(s.grades.raw.median, GENGAR.price);
}

/* a blank cost stays unknown instead of being invented */
{
  const unk = G.clampSettings({ tagFee: null });
  assert.strictEqual(unk.tagFee, null);
  assert.strictEqual(unk.defaultsAsOf, '2026-11-07');
  assert.strictEqual(summary('me55-154', [], unk).models['TAG 10'].incremental, null);
  assert.strictEqual(summary('me55-154', [], unk).models['PSA 10'].incremental, 417.33);
}

/* fee date stamp survives a partial edit */
{
  const edited = G.clampSettings({ tagFee: 29.95, editedOn: '2026-11-08' });
  assert.strictEqual(edited.defaultsAsOf, '2026-11-07');
  assert.strictEqual(edited.tagFeeAsOf, '2026-10-21');
  assert.strictEqual(edited.tagFee, 29.95);
  assert.strictEqual(edited.editedOn, '2026-11-08');
}

/* gross gap and incremental are different numbers */
{
  const s = summary('me55-154');
  assert.strictEqual(s.models['PSA 10'].gross_gap, cents(628.88 - 61.64));
  assert.notStrictEqual(s.models['PSA 10'].gross_gap, s.models['PSA 10'].incremental);
}

/* comps file itself has no private payloads */
{
  const blob = JSON.stringify(comps);
  assert.ok(!/data:image|"api_key"|"password"|"buyer_username"/.test(blob));
  assert.strictEqual(comps.provenance.not_independently_verified, true);
}

console.log('grading tests passed');
