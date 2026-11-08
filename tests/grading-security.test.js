/* node tests/grading-security.test.js */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const G = require('../grading-math.js');

const root = path.join(__dirname, '..');

/* The grading scripts must not wipe storage, eval code, or write collection keys. */
for (const file of ['grading.js', 'grading-math.js']) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(!/localStorage\.removeItem/.test(src), file + ' removes storage');
  assert.ok(!/localStorage\.clear/.test(src), file + ' clears storage');
  assert.ok(!/\beval\s*\(/.test(src), file + ' uses eval');
  assert.ok(!/new Function/.test(src), file + ' builds a function from text');
  assert.ok(!/document\.write/.test(src), file + ' uses document.write');
  assert.ok(!/outerHTML\s*=/.test(src), file + ' assigns outerHTML');
}

/* New keys are versioned and do not collide with the collection's keys. */
{
  const ours = Object.values(G.STORAGE_KEYS);
  assert.strictEqual(new Set(ours).size, ours.length);
  ours.forEach(key => {
    assert.ok(key.indexOf('fenton.grading.') === 0, key);
    assert.ok(/\.v1$/.test(key), key);
    assert.strictEqual(G.storageKeyAllowed(key), true);
  });
  G.RESERVED_STORAGE_KEYS.forEach(key => {
    assert.strictEqual(G.storageKeyAllowed(key), false, key);
    assert.ok(ours.indexOf(key) < 0, key);
  });
  assert.strictEqual(G.storageKeyAllowed('fg.trainers'), false);
  assert.strictEqual(G.storageKeyAllowed('moversSort'), false);
}

/* HTML text is escaped. A title is data, not markup. */
{
  const nasty = '<img src=x onerror="alert(1)"><script>alert(1)</script>';
  const html = G.escapeHtml(nasty);
  assert.ok(html.indexOf('<') < 0);
  assert.ok(html.indexOf('>') < 0);
  assert.ok(html.indexOf('"') < 0);
  assert.ok(html.indexOf('&lt;script&gt;') >= 0);
  const card = { id: 'me55-154', name: 'Gengar ex', num: '154/128', set: '30th Celebration' };
  const row = G.validateSale({
    inventory_id: 'me55-154', grade_class: 'PSA 10', date: '2026-11-07', price_usd: 10,
    currency: 'USD', sale_id: '123456789012', marketplace: 'eBay', source: 'other',
    best_offer: 'unverified', shipping: 'unknown', language: 'English', variant: 'standard',
    title: 'Gengar ex 154/128 PSA 10 ' + nasty
  }, card);
  assert.strictEqual(row.ok, true, (row.errors || []).join('; '));
  assert.ok(row.sale.title.indexOf('<script>') >= 0);
  assert.ok(G.escapeHtml(row.sale.title).indexOf('<script>') < 0);
  const objPrice = G.validateSale(Object.assign({}, {
    inventory_id: 'me55-154', grade_class: 'PSA 10', date: '2026-11-07', price_usd: { evil: 1 },
    currency: 'USD', sale_id: '123456789012', marketplace: 'eBay', source: 'other',
    best_offer: 'unverified', shipping: 'unknown', language: 'English', variant: 'standard',
    title: 'Gengar ex 154/128 PSA 10'
  }), card);
  assert.strictEqual(objPrice.ok, false);
}

/* CSV formula injection is prefixed, including quoted formulas. */
{
  const csv = G.toCsv([{
    inventory_id: 'me55-154', grade_class: 'PSA 10', date: '2026-11-07', price_usd: 12,
    currency: 'USD', sale_id: '123', marketplace: 'eBay', source: 'other', best_offer: 'unverified',
    shipping: 'unknown', title: '=HYPERLINK("https://evil.example")', language: 'English',
    variant: 'standard', original_url: '', price_basis: '+cmd', condition_claim: '@sum', language_verification: 'stated'
  }]);
  assert.ok(csv.indexOf("'=HYPERLINK") >= 0, csv);
  assert.ok(csv.indexOf("'+cmd") >= 0, csv);
  assert.ok(csv.indexOf("'@sum") >= 0, csv);
  assert.ok(!/(^|,)=HYPERLINK/.test(csv), csv);
  const neg = G.csvCell('-1+1');
  assert.ok(neg.indexOf("'-1+1") === 0);
  const plain = G.csvCell('Gengar ex');
  assert.strictEqual(plain, 'Gengar ex');
}

/* File size, row count, and shape are refused before anything is stored. */
{
  const huge = 'x'.repeat(G.LIMITS.maxImportChars + 1);
  const over = G.parseImport(huge);
  assert.strictEqual(over.records.length, 0);
  assert.ok(/limit/i.test(over.errors.join(' ')));
  const tooMany = G.parseImport(JSON.stringify(new Array(G.LIMITS.maxRecords + 1).fill({ inventory_id: 'me55-154' })));
  assert.strictEqual(tooMany.records.length, 0);
  assert.ok(/Too many rows/.test(tooMany.errors.join(' ')));
  const wide = { inventory_id: 'me55-154' };
  for (let i = 0; i < G.LIMITS.maxKeysPerRecord + 1; i++) wide['k' + i] = 'a';
  const wideRes = G.parseImport(JSON.stringify([wide]));
  assert.strictEqual(wideRes.records.length, 0);
  const badShape = G.parseImport(JSON.stringify({ sales: ['nope'] }));
  assert.strictEqual(badShape.records.length, 0);
  const card = { id: 'me55-154', name: 'Gengar ex', num: '154/128', set: '30th Celebration' };
  const longTitle = G.validateSale({
    inventory_id: 'me55-154', grade_class: 'PSA 10', date: '2026-11-07', price_usd: 10,
    currency: 'USD', sale_id: '123456789012', marketplace: 'eBay', source: 'other',
    best_offer: 'unverified', shipping: 'unknown', language: 'English', variant: 'standard',
    title: 'PSA 10 ' + 'A'.repeat(G.LIMITS.maxTitle)
  }, card);
  assert.strictEqual(longTitle.ok, false);
}

/* Backup copies grading data and does not mutate the previous snapshot list. */
{
  const existing = { snapshots: [{ at: '2026-11-01', settings: { tagFee: 1 }, imports: null, hypotheticals: null, copies: null }] };
  const before = JSON.parse(JSON.stringify(existing));
  const out = G.prepareBackup(existing, { at: '2026-11-08', settings: { tagFee: 59.95 }, imports: { rows: [{ sale_id: '1' }] } });
  assert.deepStrictEqual(existing, before);
  assert.strictEqual(out.schema, 'fenton-grading-backup-v1');
  assert.strictEqual(out.snapshots.length, 2);
  assert.strictEqual(out.snapshots[0].settings.tagFee, 1);
  assert.strictEqual(out.droppedOldest, 0);
  let bag = { snapshots: [] };
  for (let i = 0; i < G.LIMITS.maxBackupSnapshots + 2; i++) bag = G.prepareBackup(bag, { at: '2026-11-0' + i, settings: { n: i } });
  assert.strictEqual(bag.snapshots.length, G.LIMITS.maxBackupSnapshots);
  assert.ok(bag.droppedOldest >= 1);
  assert.strictEqual(bag.snapshots[bag.snapshots.length - 1].settings.n, G.LIMITS.maxBackupSnapshots + 1);
}

/* Settings from an untrusted object cannot rename the dated defaults or carry extra keys into the model. */
{
  const s = G.clampSettings({ defaultsAsOf: '1999-01-01', tagFee: 12, api_key: 'secret', password: 'nope' });
  assert.strictEqual(s.defaultsAsOf, '2026-11-07');
  assert.strictEqual(s.tagFee, 12);
  assert.strictEqual(s.api_key, undefined);
  assert.strictEqual(s.password, undefined);
  assert.ok(s.tagFeeName.length <= 80);
}

/* The public comp file and inventory file are not a place for account exports. */
{
  const comps = fs.readFileSync(path.join(root, 'grading-comps.json'), 'utf8');
  assert.ok(!/data:image|api_key|password|buyer_username|localStorage/.test(comps));
  const data = fs.readFileSync(path.join(root, 'data.json'), 'utf8');
  assert.ok(data.indexOf('"fenton.grading.') < 0);
}

console.log('grading security tests passed');
