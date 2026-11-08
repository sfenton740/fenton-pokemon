/* Grading & value math. Pure functions, no network and no DOM.
   Browser: window.GradingMath. Tests: require('./grading-math.js'). */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GradingMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const GRADES = [
    { id: 'raw', label: 'Raw (NM-titled)', short: 'Raw', grader: null },
    { id: 'PSA 8', label: 'PSA 8', short: 'PSA 8', grader: 'PSA' },
    { id: 'PSA 9', label: 'PSA 9', short: 'PSA 9', grader: 'PSA' },
    { id: 'PSA 10', label: 'PSA 10', short: 'PSA 10', grader: 'PSA' },
    { id: 'TAG 9', label: 'TAG 9', short: 'TAG 9', grader: 'TAG' },
    { id: 'TAG 10', label: 'TAG Gem 10', short: 'TAG Gem 10', grader: 'TAG' },
    { id: 'TAG 10 Pristine', label: 'TAG Pristine', short: 'TAG Pristine', grader: 'TAG' }
  ];
  const GRADE_IDS = GRADES.map(g => g.id);

  const GRADE_ALIASES = {
    'raw': 'raw', 'nm': 'raw', 'near mint': 'raw', 'mint': 'raw',
    'psa 8': 'PSA 8', 'psa8': 'PSA 8',
    'psa 9': 'PSA 9', 'psa9': 'PSA 9',
    'psa 10': 'PSA 10', 'psa10': 'PSA 10',
    'tag 9': 'TAG 9', 'tag9': 'TAG 9',
    'tag 10': 'TAG 10', 'tag10': 'TAG 10', 'tag gem': 'TAG 10', 'tag gem 10': 'TAG 10', 'tag gem mint 10': 'TAG 10',
    'tag pristine': 'TAG 10 Pristine', 'tag 10 pristine': 'TAG 10 Pristine', 'tag pristine 10': 'TAG 10 Pristine',
    'tag gem mint pristine': 'TAG 10 Pristine'
  };

  const LIMITS = {
  maxImportChars: 400000,
  maxRecords: 500,
  maxKeysPerRecord: 40,
  maxTitle: 300,
  maxSaleId: 64,
  maxUrl: 400,
  maxField: 200,
  maxNote: 500,
  maxTiers: 8,
  maxSettingsBytes: 20000,
  maxImportsBytes: 350000,
  maxCopiesBytes: 80000,
  maxHypoBytes: 40000,
  maxBackupBytes: 450000,
  maxBackupSnapshots: 5
};
const STORAGE_KEYS = {
  settings: 'fenton.grading.settings.v1',
  imports: 'fenton.grading.imports.v1',
  hypotheticals: 'fenton.grading.hypotheticals.v1',
  copies: 'fenton.grading.copies.v1',
  backup: 'fenton.grading.backup.v1'
};
const RESERVED_STORAGE_KEYS = ['moversSort', 'fg.trainers', 'fg.trainers.before-import', 'fg.mute', 'fg.talk', 'fg.trivMaster', 'fenton.talk'];
const SOURCES = ['ebay-product-research', 'ebay-sold', 'psa-apr', 'tcgplayer', '130point', 'pricecharting', 'other'];
  const BEST_OFFERS = ['verified-accepted', 'unverified', 'not-best-offer', 'listed-not-accepted', 'unknown'];
  const SOURCE_RANK = {
    'ebay-product-research': 1,
    'psa-apr': 2,
    'tcgplayer': 3,
    '130point': 4,
    'pricecharting': 5,
    'ebay-sold': 6,
    'other': 7
  };

  /* Published fee snapshot. Provisional. The sheet file still lists a paused $39.99 Value tier;
     this model does not use that number unless someone types it into the editable fields. */
  const DEFAULT_SETTINGS = {
    schema: 'fenton-grading-settings-v1',
    defaultsAsOf: '2026-11-07',
    defaultsNote: 'PSA listing read 2026-11-07 (Value tier paused; lowest active listed price $59.99, max insured $1,000). TAG Standard $59.95 as of the 2026-10-21 help article. eBay trading-card fee 13.25% plus $0.40. Tax rate is an assumption used only as the fee base. Shipping and packaging are assumptions. Not a live quote.',
    psaMode: 'tiers',
    psaFlatFee: 59.99,
    psaTiers: [
      { maxDeclared: 1000, fee: 59.99, name: 'Lowest active listed (Value paused)' },
      { maxDeclared: 1500, fee: 79.99, name: 'Next listed' },
      { maxDeclared: 2500, fee: 199, name: 'Listed' },
      { maxDeclared: 5000, fee: 349, name: 'Listed' },
      { maxDeclared: 10000, fee: 599, name: 'Listed' }
    ],
    bumpTierWhenRangeExceedsCap: true,
    tagFee: 59.95,
    tagFeeName: 'TAG Standard',
    tagFeeAsOf: '2026-10-21',
    inboundPerCard: 5,
    sellFeeRate: 0.1325,
    sellFeeFixed: 0.40,
    taxFeeBaseRate: 0.07,
    shipRaw: 1,
    packRaw: 0.50,
    shipGraded: 5,
    packGraded: 1,
    minSalesForMedian: 5,
    staleDays: 14,
    countUnverifiedLanguage: true,
    shortlistMinCachedPsa10: 90,
    placeholderSubmitIncremental: 100,
    placeholderLiquiditySales: 10,
    placeholderLiquidityDays: 14,
    editedOn: null
  };

  const POLICY = {
    minSalesForMedian: 5,
    paragraphs: [
      'A median is shown only when at least 5 comparable sales remain after the match and de-duplication rules. That count is the default and can be changed in Assumptions. Fewer than 5 sales are listed as individual observations. They are not a market median and they are not market certainty.',
      'Missing prices stay unknown. This page does not fill a gap with zero, with the cached PSA 10 figure, or with a guess.',
      'This is not an expected value. No grade probabilities are invented, and no expected-value number is shown.',
      'Cached prices are not live. Nothing on this page refreshes eBay, PSA, TCGplayer, 130point, or PriceCharting. Deep links open those sites for a manual look. Newer sales are added by importing a file you downloaded yourself.',
      'The same eBay sale on PriceCharting, 130point, PSA Auction Prices Realized, and Product Research is one sale. It is not independent evidence. Sales are de-duplicated by eBay item id, or by date + price + title when there is no id.',
      'PriceCharting rows in the bundled file are not independently transaction-verified. They reproduce reported eBay or TCGplayer rows. Shipping on those rows is unknown. Accepted offers are unverified, including rows where PriceCharting shows a lower price and a higher crossed price.',
      'Match rule: same inventory card, same variant, English language, and the exact grader and grade. TAG Gem 10 and TAG Pristine are different grades. PSA 8, PSA 9, and PSA 10 are different grades. Other companies (CGC, BGS, SGC) are not pooled into PSA or TAG.',
      'Gengar ex 154/128: a secondary database (cardrake.com/cards/cel30-154) says this card was printed only as the holofoil special illustration rare and that every copy carries the large 30th stamp. Titles that mention the stamp are pooled with the standard card. That is not official Pokémon confirmation.',
      'Raw comps are seller titles that claim NM, Near Mint, Mint, or Pack Fresh. A title is not the condition of a copy in this collection. The inventory does not record condition, language, or our own photos. Pictures on the card pages are TCGplayer stock photos.',
      'Cards with comps are research candidates, not a submission recommendation. Keep, sell, and grade stay unknown until you mark a physical copy. The shortlist (cached PSA 10 of $90 or more) only chooses what to research.',
      'Incremental pre-tax proceeds compare a graded sale with selling the same card raw. The raw sale is the opportunity cost. Acquisition cost is not subtracted on top of that. Income tax, returns, promoted listings, grade-tier upcharges, and order minimums are not modeled.',
      'The bundled comp file was collected 2026-11-07 from public PriceCharting pages, window 2026-10-31 through 2026-11-07. It supersedes earlier pilot dollar tables. It is a snapshot, not a live feed.',
      'Hypothetical prices you type are stored on this browser only and are labeled hypothetical. They never enter the sale count or the median.',
      'This page is part of the public site. It is not a private tab. Anyone with the link can open it. Notes typed here stay in this browser under separate grading keys and are not written into the collection file. No percentage accuracy is shown. Returned grades, when you record them, are counts only.',
      'Imports are limited to 500 rows and 400000 characters. Saved grading data is size-capped so it cannot fill this site\'s browser storage. Existing collection keys are not read, cleared, or replaced. A backup copies grading keys only. CSV export prefixes formula-like cells so a spreadsheet does not treat them as commands.',
      'Fee defaults are provisional and date-stamped 2026-11-07 (TAG Standard date 2026-10-21). Placeholder submit and liquidity thresholds do not list, buy, sell, or submit anything.'
    ]
  };

  function isNum(v) { return typeof v === 'number' && Number.isFinite(v); }
  function roundCents(n) {
    if (!isNum(n)) return null;
    const sign = n < 0 ? -1 : 1;
    return sign * Math.round(Math.abs(n) * 100 + 1e-8) / 100;
  }
  function clampSettings(raw) {
    const d = DEFAULT_SETTINGS;
    const allow = ['psaMode', 'psaFlatFee', 'psaTiers', 'bumpTierWhenRangeExceedsCap', 'tagFee', 'tagFeeName', 'inboundPerCard', 'sellFeeRate', 'sellFeeFixed', 'taxFeeBaseRate', 'shipRaw', 'packRaw', 'shipGraded', 'packGraded', 'minSalesForMedian', 'staleDays', 'countUnverifiedLanguage', 'shortlistMinCachedPsa10', 'placeholderSubmitIncremental', 'placeholderLiquiditySales', 'placeholderLiquidityDays', 'editedOn'];
    const nullable = { psaFlatFee: 1, tagFee: 1, inboundPerCard: 1, sellFeeRate: 1, sellFeeFixed: 1, taxFeeBaseRate: 1, shipRaw: 1, packRaw: 1, shipGraded: 1, packGraded: 1 };
    const src = {};
    allow.forEach(k => {
      if (!raw || !Object.prototype.hasOwnProperty.call(raw, k)) return;
      if (raw[k] === null && nullable[k]) src[k] = null;
      else if (raw[k] != null) src[k] = raw[k];
    });
    const s = Object.assign({}, d, src);
    s.schema = d.schema;
    s.defaultsAsOf = d.defaultsAsOf;
    s.defaultsNote = d.defaultsNote;
    s.tagFeeAsOf = d.tagFeeAsOf;
    s.psaMode = s.psaMode === 'flat' ? 'flat' : 'tiers';
    const applyCost = (key, fallback) => { if (s[key] !== null) s[key] = numOr(s[key], fallback); };
    applyCost('psaFlatFee', d.psaFlatFee);
    applyCost('tagFee', d.tagFee);
    applyCost('inboundPerCard', d.inboundPerCard);
    applyCost('sellFeeRate', d.sellFeeRate);
    applyCost('sellFeeFixed', d.sellFeeFixed);
    applyCost('taxFeeBaseRate', d.taxFeeBaseRate);
    applyCost('shipRaw', d.shipRaw);
    applyCost('packRaw', d.packRaw);
    applyCost('shipGraded', d.shipGraded);
    applyCost('packGraded', d.packGraded);
    let minN = parseInt(s.minSalesForMedian, 10);
    if (!Number.isFinite(minN) || minN < 1) minN = d.minSalesForMedian;
    s.minSalesForMedian = minN;
    let stale = parseInt(s.staleDays, 10);
    if (!Number.isFinite(stale) || stale < 1) stale = d.staleDays;
    s.staleDays = stale;
    s.bumpTierWhenRangeExceedsCap = s.bumpTierWhenRangeExceedsCap !== false && s.bumpTierWhenRangeExceedsCap !== 'false';
    s.countUnverifiedLanguage = s.countUnverifiedLanguage !== false && s.countUnverifiedLanguage !== 'false';
    s.shortlistMinCachedPsa10 = numOr(s.shortlistMinCachedPsa10, d.shortlistMinCachedPsa10);
    s.placeholderSubmitIncremental = numOr(s.placeholderSubmitIncremental, d.placeholderSubmitIncremental);
    s.placeholderLiquiditySales = numOr(s.placeholderLiquiditySales, d.placeholderLiquiditySales);
    s.placeholderLiquidityDays = numOr(s.placeholderLiquidityDays, d.placeholderLiquidityDays);
    s.psaTiers = sanitizeTiers(s.psaTiers);
    s.editedOn = isoDateOrNull(s.editedOn);
    s.tagFeeName = String(s.tagFeeName || d.tagFeeName).replace(/[\u0000-\u001F]/g, '').slice(0, 80);
    return s;
  }
  function numOr(v, fallback) {
    if (typeof v === 'string' && v.trim() === '') return fallback;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  function isoDateOrNull(v) {
    if (v == null || v === '') return null;
    const s = String(v).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  }
  function sanitizeTiers(tiers) {
    const src = Array.isArray(tiers) && tiers.length ? tiers : DEFAULT_SETTINGS.psaTiers;
    const out = [];
    src.forEach(t => {
      const maxDeclared = Number(t && t.maxDeclared);
      const fee = Number(t && t.fee);
      if (!Number.isFinite(maxDeclared) || !Number.isFinite(fee) || fee < 0) return;
      out.push({ maxDeclared, fee, name: String((t && t.name) || 'Listed').slice(0, 80) });
    });
    out.sort((a, b) => a.maxDeclared - b.maxDeclared);
    const cleaned = out.length ? out : DEFAULT_SETTINGS.psaTiers.map(t => Object.assign({}, t));
    return cleaned.slice(0, LIMITS.maxTiers);
  }

  function canonicalGrade(value) {
    if (value == null) return null;
    const key = String(value).trim().toLowerCase().replace(/[_]+/g, ' ').replace(/\s+/g, ' ');
    return GRADE_ALIASES[key] || null;
  }

  function sellingFee(price, settings) {
    if (!isNum(price)) return null;
    const s = settings;
    if (!isNum(s.sellFeeRate) || !isNum(s.sellFeeFixed) || !isNum(s.taxFeeBaseRate)) return null;
    return s.sellFeeRate * price * (1 + s.taxFeeBaseRate) + s.sellFeeFixed;
  }

  function gradingFeeFor(gradeId, declared, rangeMax, settings) {
    if (gradeId === 'raw') return { fee: 0, label: 'No grading fee', bumped: false, unknown: false };
    if (String(gradeId).indexOf('TAG') === 0) {
      if (!isNum(settings.tagFee)) return { fee: null, label: 'TAG fee unknown', bumped: false, unknown: true };
      return { fee: settings.tagFee, label: settings.tagFeeName + ', provisional ' + settings.tagFeeAsOf, bumped: false, unknown: false };
    }
    if (String(gradeId).indexOf('PSA') === 0) {
      if (settings.psaMode === 'flat') {
        if (!isNum(settings.psaFlatFee)) return { fee: null, label: 'PSA fee unknown', bumped: false, unknown: true };
        return { fee: settings.psaFlatFee, label: 'PSA flat fee (manual)', bumped: false, unknown: false };
      }
      if (!isNum(declared)) return { fee: null, label: 'Declared value unknown, so the PSA tier is unknown', bumped: false, unknown: true };
      const tiers = settings.psaTiers;
      let idx = -1;
      for (let i = 0; i < tiers.length; i++) if (declared <= tiers[i].maxDeclared + 1e-9) { idx = i; break; }
      if (idx < 0) return { fee: null, label: 'Declared value is above every listed tier. Fee unknown.', bumped: false, unknown: true };
      const tier = tiers[idx];
      if (settings.bumpTierWhenRangeExceedsCap && isNum(rangeMax) && rangeMax > tier.maxDeclared + 1e-9) {
        const next = tiers[idx + 1];
        if (!next || !isNum(next.fee)) return { fee: null, label: 'The sale range exceeds this tier and the next tier fee is unknown.', bumped: true, unknown: true };
        return { fee: next.fee, label: 'PSA tier bumped because the sale range exceeds $' + tier.maxDeclared + ' (' + next.name + ')', bumped: true, unknown: false, cap: next.maxDeclared };
      }
      return { fee: tier.fee, label: 'PSA ' + tier.name + ' (declared up to $' + tier.maxDeclared + ')', bumped: false, unknown: false, cap: tier.maxDeclared };
    }
    return { fee: null, label: 'Grading fee unknown for this grade', bumped: false, unknown: true };
  }

  /* Net cash from selling, before income tax. Graded path pays the grading fee and inbound transport. */
  function netProceeds(price, settings, graded, gradingFee) {
    if (!isNum(price)) return null;
    const fee = sellingFee(price, settings);
    if (fee == null) return null;
    const ship = graded ? settings.shipGraded : settings.shipRaw;
    const pack = graded ? settings.packGraded : settings.packRaw;
    if (!isNum(ship) || !isNum(pack)) return null;
    let extra = 0;
    if (graded) {
      if (!isNum(gradingFee) || !isNum(settings.inboundPerCard)) return null;
      extra = gradingFee + settings.inboundPerCard;
    }
    return price - fee - ship - pack - extra;
  }

  function incremental(gradedPrice, rawPrice, settings, gradingFee) {
    const g = netProceeds(gradedPrice, settings, true, gradingFee);
    const r = netProceeds(rawPrice, settings, false, 0);
    if (g == null || r == null) return null;
    return { incremental: g - r, gradedNet: g, rawNet: r, sellingFeeGraded: sellingFee(gradedPrice, settings), sellingFeeRaw: sellingFee(rawPrice, settings) };
  }

  function median(values) {
    const xs = values.filter(isNum).slice().sort((a, b) => a - b);
    if (!xs.length) return null;
    const mid = Math.floor(xs.length / 2);
    if (xs.length % 2) return xs[mid];
    return (xs[mid - 1] + xs[mid]) / 2;
  }

  function daysBetween(isoEarlier, isoLater) {
    const a = Date.parse(isoEarlier + 'T12:00:00Z');
    const b = Date.parse(isoLater + 'T12:00:00Z');
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return Math.round((b - a) / 86400000);
  }

  function ebayItemId(row) {
    const url = String((row && row.original_url) || '');
    const fromUrl = url.match(/ebay\.com\/itm\/(\d{9,})/i);
    if (fromUrl) return fromUrl[1];
    const market = String((row && row.marketplace) || '');
    const source = String((row && row.source) || '');
    /* A numeric id is an eBay item id only when the row says eBay. TCGplayer ids are separate sales. */
    if (/ebay/i.test(market) || /ebay-product-research|ebay-sold/i.test(source)) {
      const id = String((row && row.sale_id) || '').match(/\d{9,}/);
      if (id) return id[0];
    }
    return null;
  }

  function normTitle(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function dedupeKey(row) {
    const ebay = ebayItemId(row);
    if (ebay) return 'ebay:' + ebay;
    const id = String(row.sale_id || '').trim();
    if (id && row.sale_id_missing !== true) return 'id:' + String(row.marketplace || '').toLowerCase() + ':' + id.toLowerCase();
    return 'fallback:' + [row.date, isNum(row.price_usd) ? row.price_usd.toFixed(2) : '', normTitle(row.title), row.grade_class, String(row.marketplace || '').toLowerCase()].join('|');
  }

  function sourceRank(row) {
    let r = SOURCE_RANK[row.source] != null ? SOURCE_RANK[row.source] : 9;
    if (row.best_offer === 'verified-accepted') r -= 0.4;
    return r;
  }

  function dedupeSales(sales) {
    const groups = new Map();
    sales.forEach((sale, i) => {
      const key = dedupeKey(sale);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ sale, i });
    });
    const kept = [];
    const dropped = [];
    groups.forEach(items => {
      items.sort((a, b) => sourceRank(a.sale) - sourceRank(b.sale) || a.i - b.i);
      const winner = items[0].sale;
      const also = items.slice(1).map(x => x.sale.source);
      const merged = Object.assign({}, winner, {
        dedupe_key: dedupeKey(winner),
        also_seen_on: unique(also.filter(s => s && s !== winner.source))
      });
      if (items.length > 1) merged.quality = unique((winner.quality || []).concat(['same-sale-multiple-reports']));
      kept.push(merged);
      items.slice(1).forEach(x => dropped.push({
        sale: x.sale,
        reason: 'Same sale as ' + (ebayItemId(winner) || x.sale.sale_id || 'the kept row') + ' kept from ' + winner.source + '. Not counted twice.',
        kept_source: winner.source
      }));
    });
    return { kept, dropped };
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function storageKeyAllowed(key) {
    return Object.keys(STORAGE_KEYS).some(name => STORAGE_KEYS[name] === key);
  }
  function prepareBackup(existing, snapshot) {
    const prev = existing && Array.isArray(existing.snapshots) ? existing.snapshots.slice() : [];
    const snap = {
      at: snapshot && snapshot.at || null,
      settings: snapshot ? snapshot.settings : null,
      imports: snapshot ? snapshot.imports : null,
      hypotheticals: snapshot ? snapshot.hypotheticals : null,
      copies: snapshot ? snapshot.copies : null
    };
    const next = prev.concat([snap]);
    const keep = next.slice(-LIMITS.maxBackupSnapshots);
    return {
      schema: 'fenton-grading-backup-v1',
      snapshots: keep,
      droppedOldest: next.length - keep.length
    };
  }
  function plainText(value, max, label, errors) {
    if (value != null && typeof value === 'object') {
      errors.push(label + ' must be text.');
      return '';
    }
    const s = String(value == null ? '' : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
    if (s.length > max) errors.push(label + ' is longer than ' + max + ' characters.');
    return s;
  }

  function unique(arr) {
    const o = [];
    arr.forEach(x => { if (o.indexOf(x) < 0) o.push(x); });
    return o;
  }

  const PRIVATE_KEY = /^(notes?|private_notes?|photos?|images?|secret|token|password|api[_-]?key|authorization|cookie|email|e-mail|address|phone|buyer(_name|_username)?|seller_username|recipient|tracking(_number)?)$/i;
  const PII_KEY = /(username|buyer|recipient|address|tracking|email|phone|password|secret|token|api[_-]?key|cookie|authorization)/i;

  function sanitizeRecord(input) {
    const removed = [];
    const src = input && typeof input === 'object' ? input : {};
    Object.keys(src).forEach(k => {
      if (PRIVATE_KEY.test(k) || PII_KEY.test(k)) removed.push(k);
    });
    return { removed };
  }

  const HEADER_ALIAS = {
    inventory_id: 'inventory_id', card_id: 'inventory_id',
    grade: 'grade_class', grade_class: 'grade_class', grader_grade: 'grade_class',
    date: 'date', sale_date: 'date',
    price: 'price_usd', price_usd: 'price_usd', sold_price: 'price_usd',
    currency: 'currency',
    sale_id: 'sale_id', item_id: 'sale_id', ebay_item_id: 'sale_id',
    sale_id_missing: 'sale_id_missing',
    marketplace: 'marketplace', source: 'source',
    best_offer: 'best_offer', best_offer_state: 'best_offer',
    shipping: 'shipping', shipping_usd: 'shipping',
    title: 'title', language: 'language', lang: 'language',
    language_verification: 'language_verification',
    variant: 'variant', url: 'original_url', original_url: 'original_url', link: 'original_url',
    price_basis: 'price_basis', condition_claim: 'condition_claim',
    set: 'set', number: 'number', card_number: 'number', name: 'name', card: 'name',
    kind: 'kind'
  };

  function mapAliases(obj) {
    const out = {};
    const dropped = [];
    Object.keys(obj || {}).forEach(k => {
      const lk = String(k).trim().toLowerCase();
      if (PRIVATE_KEY.test(lk) || PII_KEY.test(lk)) { dropped.push(k); return; }
      const dest = HEADER_ALIAS[lk];
      if (!dest) { dropped.push(k); return; }
      out[dest] = obj[k];
    });
    return { out, dropped };
  }

  function titleContradiction(title, grade) {
    const t = String(title || '').toLowerCase();
    if (!t) return null;
    if (/\b(cgc|bgs|beckett|sgc)\b/.test(t)) return 'Title names CGC, BGS, or SGC. Those grades are not pooled into PSA or TAG.';
    if (/\b(lot|bundle|pair)\b/.test(t)) return 'Title looks like a lot or bundle, not one card.';
    if (/\b(japanese|japan|korean|chinese|thai|indonesian|jpn|kor)\b/.test(t) || /\bjp\b/.test(t)) return 'Title names a non-English printing.';
    const found = [];
    if (/\bpsa\s*8\b/.test(t)) found.push('PSA 8');
    if (/\bpsa\s*9\b/.test(t)) found.push('PSA 9');
    if (/\bpsa\s*10\b/.test(t)) found.push('PSA 10');
    if (/\btag\b/.test(t) && /\bpristine\b/.test(t)) found.push('TAG 10 Pristine');
    else if (/\btag\b/.test(t) && /\b(gem\s*)?10\b/.test(t)) found.push('TAG 10');
    else if (/\btag\b/.test(t) && /\b9\b/.test(t)) found.push('TAG 9');
    if (/\bpsa\s*9\.5\b|\bpsa\s*8\.5\b/.test(t)) return 'Title names a half grade this comparison does not use.';
    if (found.length && found.indexOf(grade) < 0 && grade !== 'raw') return 'Title grade does not match grader-grade ' + grade + '.';
    if (found.length && grade === 'raw') return 'Title names a graded card, so it is not a raw comp.';
    return null;
  }

  function variantDecision(cardId, variant) {
    const v = String(variant || '').trim().toLowerCase();
    if (v === 'standard' || v === 'holofoil' || v === 'pooled-standard') return { ok: true, warning: null, variant: v || 'standard' };
    if (cardId === 'me55-154' && (v === '30th-stamp' || v === 'stamp')) {
      return {
        ok: true,
        variant: 'pooled-standard',
        warning: 'Gengar stamp titles are pooled with the standard card based on a secondary database only, not an official Pokémon verification.'
      };
    }
    return { ok: false, reason: 'Variant "' + (variant || '') + '" does not match this inventory card. It was not mixed into the comps.' };
  }

  function normNum(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ''); }
  function normName(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }

  function validateSale(input, card) {
    const errors = [];
    const warnings = [];
    if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: ['Row is not an object.'], warnings, sale: null };
    if (String(input.kind || '').toLowerCase() === 'hypothetical' || String(input.source || '').toLowerCase() === 'hypothetical') {
      return { ok: false, errors: ['Hypothetical scenarios are not sales and were not imported.'], warnings, sale: null };
    }
    const mapped = mapAliases(input);
    if (mapped.dropped.length) warnings.push('Ignored fields (not stored): ' + mapped.dropped.join(', ') + '.');
    const row = mapped.out;
    if (!card) errors.push('inventory_id does not match a card in this collection.');
    const grade = canonicalGrade(row.grade_class);
    if (!grade) errors.push('grader-grade is missing or not one of raw, PSA 8, PSA 9, PSA 10, TAG 9, TAG Gem 10, TAG Pristine.');
    const date = isoDateOrNull(row.date);
    if (!date) errors.push('date must be YYYY-MM-DD.');
    const price = typeof row.price_usd === 'number' ? row.price_usd : Number(String(row.price_usd == null ? '' : row.price_usd).replace(/[$,]/g, ''));
    if (!isNum(price) || price < 0) errors.push('price_usd must be a non-negative number.');
    const currency = String(row.currency || '').trim().toUpperCase();
    if (!currency) errors.push('currency is required (USD). This page does not convert other currencies.');
    else if (currency !== 'USD') errors.push('currency ' + currency + ' is not converted. Only USD sales are included.');
    let shipping = row.shipping;
    let shippingUsd = null;
    if (shipping == null || String(shipping).trim() === '') errors.push('shipping is required. Use a USD amount or the exact word unknown.');
    else if (String(shipping).trim().toLowerCase() === 'unknown') warnings.push('Shipping is unknown and is not added to the price.');
    else {
      shippingUsd = Number(shipping);
      if (!isNum(shippingUsd) || shippingUsd < 0) errors.push('shipping must be a USD amount or unknown.');
      else warnings.push('Shipping is recorded separately and is not added to the item price.');
    }
    const best = String(row.best_offer || '').trim().toLowerCase();
    if (BEST_OFFERS.indexOf(best) < 0) errors.push('best_offer must be verified-accepted, unverified, not-best-offer, listed-not-accepted, or unknown.');
    const source = String(row.source || '').trim().toLowerCase();
    if (SOURCES.indexOf(source) < 0) errors.push('source must be one of: ' + SOURCES.join(', ') + '.');
    if (row.price_usd != null && typeof row.price_usd === 'object') errors.push('price_usd must be a number.');
    const title = plainText(row.title, LIMITS.maxTitle, 'title', errors);
    if (!title) errors.push('title is required so the match can be checked.');
    const language = String(row.language || '').trim();
    if (!language) errors.push('language is required. Use English only when the listing states English.');
    else if (!/^english$/i.test(language)) errors.push('language ' + language + ' is not an exact English match.');
    let languageVerification = String(row.language_verification || 'stated').toLowerCase();
    if (languageVerification !== 'stated' && languageVerification !== 'exclusion-only') languageVerification = 'stated';
    if (!String(row.variant || '').trim()) errors.push('variant is required (standard, or 30th-stamp for the Gengar ex SIR stamp note).');
    const variant = card ? variantDecision(card.id, row.variant) : { ok: false, reason: 'No card.' };
    if (card && !variant.ok) errors.push(variant.reason);
    if (card && variant.warning) warnings.push(variant.warning);
    const saleId = plainText(row.sale_id, LIMITS.maxSaleId, 'sale_id', errors);
    const missingId = row.sale_id_missing === true || String(row.sale_id_missing).toLowerCase() === 'true';
    if (!saleId && !missingId) errors.push('sale_id (original item id) is required. If a source truly has none, set sale_id_missing to true.');
    const marketplace = plainText(row.marketplace, 40, 'marketplace', errors);
    if (!marketplace) errors.push('marketplace is required.');
    if (card && row.name && normName(row.name) !== normName(card.name)) errors.push('Card name does not exactly match inventory (' + card.name + ').');
    if (card && row.number && normNum(row.number) !== normNum(card.num)) errors.push('Card number does not exactly match inventory (' + card.num + ').');
    if (card && row.set && normName(row.set) !== normName(card.set)) errors.push('Set name does not exactly match inventory (' + card.set + ').');
    if (grade && title) {
      const contra = titleContradiction(title, grade);
      if (contra) errors.push(contra);
    }
    if (grade === 'raw') {
      const blob = (title + ' ' + String(row.condition_claim || '')).toLowerCase();
      if (!/\b(nm|near mint|mint|pack fresh)\b/.test(blob)) errors.push('Raw comps must claim NM, Near Mint, Mint, or Pack Fresh. That is a seller claim, not the condition of a copy in this collection.');
      if (/\b(lp|mp|hp|damaged|heavily played|moderately played)\b/.test(blob)) errors.push('Played or damaged raw sales are not mixed into the NM-titled set.');
    }
    if (best === 'listed-not-accepted') errors.push('best_offer listed-not-accepted is an asking price, not a realized sale. It was not included.');
    let url = plainText(row.original_url, LIMITS.maxUrl, 'original_url', errors);
    if (url && !/^https:\/\//i.test(url)) { warnings.push('original_url was dropped because it is not an https link.'); url = ''; }
    const priceBasis = plainText(row.price_basis, LIMITS.maxField, 'price_basis', errors);
    const conditionClaim = plainText(row.condition_claim, LIMITS.maxField, 'condition_claim', errors);
    if (errors.length || !card || !grade) return { ok: false, errors, warnings, sale: null };
    const quality = ['user-import'];
    if (best === 'unverified' || best === 'unknown') quality.push('best-offer-unverified');
    if (best === 'verified-accepted') quality.push('best-offer-verified-accepted');
    if (shippingUsd == null) quality.push('shipping-unknown');
    if (languageVerification === 'exclusion-only') quality.push('language-exclusion-only');
    if (source === 'pricecharting') quality.push('not-independently-verified');
    if (source === '130point' || source === 'pricecharting') quality.push('aggregator');
    const sale = {
      inventory_id: card.id,
      grade_class: grade,
      date,
      price_usd: price,
      currency: 'USD',
      sale_id: saleId,
      sale_id_missing: missingId,
      marketplace,
      source,
      best_offer: best,
      shipping: shippingUsd == null ? 'unknown' : shippingUsd,
      title,
      language: 'English',
      language_verification: languageVerification,
      variant: variant.variant,
      original_url: url,
      price_basis: priceBasis,
      condition_claim: conditionClaim,
      quality,
      provenance: 'user-import'
    };
    return { ok: true, errors, warnings, sale };
  }

  function adaptReferenceRow(row, fileProvenance) {
    const basis = String(row.price_basis || '');
    const crossed = /crossed/i.test(basis);
    const checks = row.match_checks || [];
    const titleSaysEnglish = /\benglish\b/i.test(row.title || '');
    const exclusion = checks.indexOf('English-by-exclusion') >= 0 && !titleSaysEnglish;
    const quality = [
      'public-reference',
      'not-independently-verified',
      'shipping-unknown',
      'best-offer-unverified',
      'aggregator'
    ];
    if (crossed) quality.push('crossed-price-unverified');
    if (exclusion) quality.push('language-exclusion-only');
    return {
      inventory_id: row.inventory_id,
      grade_class: canonicalGrade(row.grade_class) || row.grade_class,
      date: row.date,
      price_usd: row.price_usd,
      currency: 'USD',
      currency_note: 'USD as published in price_usd. The source row had no separate currency field.',
      sale_id: String(row.sale_id || ''),
      marketplace: row.marketplace || '',
      source: 'pricecharting',
      best_offer: 'unverified',
      best_offer_detail: crossed ? 'crossed-price' : 'single-displayed-price',
      shipping: 'unknown',
      title: row.title || '',
      language: exclusion ? '' : 'English',
      language_verification: exclusion ? 'exclusion-only' : 'stated',
      variant: 'pooled-standard',
      original_url: row.original_url || '',
      price_basis: basis,
      condition_claim: row.condition_claim || '',
      quality,
      provenance: 'public-reference',
      file_collected: fileProvenance && fileProvenance.collected || '',
      file_window: fileProvenance && fileProvenance.window || ''
    };
  }

  function includeReference(sale, settings) {
    if (!sale) return { ok: false, reason: 'Empty row.' };
    if (sale.language_verification === 'exclusion-only' && !settings.countUnverifiedLanguage) {
      return { ok: false, reason: 'Language is English only by exclusion, and that policy is off.' };
    }
    if (GRADE_IDS.indexOf(sale.grade_class) < 0) return { ok: false, reason: 'Grade is outside the comparison set.' };
    if (!isNum(sale.price_usd)) return { ok: false, reason: 'Price missing.' };
    return { ok: true };
  }

  function buildPool(referenceRows, importSales, settings) {
    const s = clampSettings(settings);
    const accepted = [];
    const excluded = [];
    (referenceRows || []).forEach(row => {
      const gate = includeReference(row, s);
      if (!gate.ok) excluded.push({ sale: row, reason: gate.reason });
      else accepted.push(row);
    });
    (importSales || []).forEach(sale => {
      if (!sale || sale.kind === 'hypothetical') {
        excluded.push({ sale, reason: 'Hypotheticals are not sales.' });
        return;
      }
      if (sale.language_verification === 'exclusion-only' && !s.countUnverifiedLanguage) {
        excluded.push({ sale, reason: 'Language is English only by exclusion, and that policy is off.' });
        return;
      }
      accepted.push(sale);
    });
    const dup = dedupeSales(accepted);
    return { kept: dup.kept, dropped: dup.dropped, excluded };
  }

  function gradeStats(sales, gradeId, settings, today) {
    const s = clampSettings(settings);
    const rows = sales.filter(r => r.grade_class === gradeId).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.price_usd - b.price_usd);
    const prices = rows.map(r => r.price_usd).filter(isNum);
    const n = prices.length;
    const min = n ? Math.min.apply(null, prices) : null;
    const max = n ? Math.max.apply(null, prices) : null;
    const enough = n >= s.minSalesForMedian;
    const med = enough ? median(prices) : null;
    const dates = rows.map(r => r.date).filter(Boolean).sort();
    const newest = dates.length ? dates[dates.length - 1] : null;
    const age = newest && today ? daysBetween(newest, today) : null;
    const stale = age != null && age > s.staleDays;
    let status = 'unknown';
    if (n === 0) status = 'unknown';
    else if (!enough) status = 'observations';
    else status = 'median';
    const flags = [];
    if (n === 0) flags.push('insufficient');
    if (n > 0 && !enough) flags.push('insufficient');
    if (stale) flags.push('stale');
    if (rows.some(r => (r.quality || []).indexOf('not-independently-verified') >= 0)) flags.push('not-independently-verified');
    if (rows.some(r => (r.quality || []).indexOf('best-offer-unverified') >= 0 || r.best_offer === 'unverified' || r.best_offer === 'unknown')) flags.push('best-offer-unverified');
    if (rows.some(r => r.shipping === 'unknown' || r.shipping == null)) flags.push('shipping-unknown');
    if (rows.some(r => (r.quality || []).indexOf('language-exclusion-only') >= 0)) flags.push('language-exclusion-only');
    if (rows.some(r => (r.also_seen_on || []).length)) flags.push('not-independent-across-sites');
    return {
      grade: gradeId,
      n,
      min: n ? min : null,
      max: n ? max : null,
      median: med,
      median_rounded: roundCents(med),
      status,
      flags: unique(flags),
      window: dates.length ? { start: dates[0], end: dates[dates.length - 1] } : null,
      newest,
      age_days: age,
      stale,
      sales: rows,
      thin: status === 'observations'
    };
  }

  function modelGrade(stat, rawStat, settings) {
    if (!stat || stat.status !== 'median' || !rawStat || rawStat.status !== 'median') {
      return { incremental: null, gross_gap: null, reason: 'Unknown until both this grade and raw have a median under the current rule.' };
    }
    const fee = gradingFeeFor(stat.grade, stat.median, stat.max, settings);
    if (fee.unknown || fee.fee == null) return { incremental: null, gross_gap: roundCents(stat.median - rawStat.median), fee, reason: fee.label };
    const math = incremental(stat.median, rawStat.median, settings, fee.fee);
    return {
      incremental: roundCents(math.incremental),
      graded_net: roundCents(math.gradedNet),
      raw_net: roundCents(math.rawNet),
      gross_gap: roundCents(stat.median - rawStat.median),
      fee,
      selling_fee_graded: roundCents(math.sellingFeeGraded),
      selling_fee_raw: roundCents(math.sellingFeeRaw),
      reason: null
    };
  }

  function illustrateOne(price, gradeId, rawMedian, rawOk, settings) {
    if (!rawOk || !isNum(rawMedian) || !isNum(price)) return { incremental: null, label: 'One reported sale. Raw median is unknown, so the dollar difference is unknown.' };
    const fee = gradingFeeFor(gradeId, price, price, settings);
    if (fee.unknown || fee.fee == null) return { incremental: null, label: 'One reported sale. Grading fee is unknown, so the dollar difference is unknown.' };
    const math = incremental(price, rawMedian, settings, fee.fee);
    return {
      incremental: roundCents(math.incremental),
      label: 'One reported sale, not a median. The figure uses this price against the raw median and is not market certainty.'
    };
  }

  function hypothetical(spec, settings) {
    const s = clampSettings(settings);
    const grade = canonicalGrade(spec && spec.grade);
    const price = spec && isNum(spec.price) ? spec.price : null;
    const rawPrice = spec && isNum(spec.rawPrice) ? spec.rawPrice : null;
    const base = {
      kind: 'hypothetical',
      verified: false,
      grade,
      price,
      rawPrice,
      label: 'Hypothetical scenario. Not a verified comp. Not included in sale counts or medians.'
    };
    if (!grade || grade === 'raw' || price == null || rawPrice == null) {
      return Object.assign(base, { incremental: null, reason: 'Enter a grade, a graded price, and a raw price. Blank values stay unknown.' });
    }
    const fee = gradingFeeFor(grade, price, price, s);
    if (fee.unknown || fee.fee == null) return Object.assign(base, { incremental: null, fee, reason: fee.label });
    const math = incremental(price, rawPrice, s, fee.fee);
    return Object.assign(base, {
      incremental: roundCents(math.incremental),
      graded_net: roundCents(math.gradedNet),
      raw_net: roundCents(math.rawNet),
      gross_gap: roundCents(price - rawPrice),
      fee,
      reason: null
    });
  }

  function summarizeCard(cardId, referenceRows, importSales, settings, today) {
    const s = clampSettings(settings);
    const pool = buildPool(referenceRows, importSales, s);
    const byGrade = {};
    GRADES.forEach(g => { byGrade[g.id] = gradeStats(pool.kept.filter(r => r.inventory_id === cardId), g.id, s, today); });
    const raw = byGrade.raw;
    const models = {};
    GRADES.forEach(g => {
      if (g.id === 'raw') return;
      models[g.id] = modelGrade(byGrade[g.id], raw, s);
      if (byGrade[g.id].thin) {
        models[g.id].observations = byGrade[g.id].sales.map(sale => Object.assign({
          sale_id: sale.sale_id,
          date: sale.date,
          price_usd: sale.price_usd,
          original_url: sale.original_url
        }, illustrateOne(sale.price_usd, g.id, raw.median, raw.status === 'median', s)));
      }
    });
    return { cardId, pool, grades: byGrade, models, settings: s, today: today || null };
  }

  function evidenceBucket(card, summary) {
    const cached = isNum(card && card.psa) ? card.psa : null;
    const onShortlist = !!(card && card.qty > 0 && cached != null && cached >= (summary.settings.shortlistMinCachedPsa10));
    const hasRows = summary.pool.kept.some(r => r.inventory_id === card.id);
    let bucket = 'no-comps';
    if (hasRows) bucket = 'research-candidate';
    else if (onShortlist) bucket = 'insufficient';
    else if (card && card.qty > 0 && cached != null) bucket = 'cached-only';
    return {
      bucket,
      onShortlist,
      recommendation: false,
      label: bucket === 'research-candidate'
        ? 'Research candidate. Not a submission recommendation.'
        : bucket === 'insufficient'
          ? 'Insufficient evidence. Cached PSA 10 only. Not a submission recommendation.'
          : bucket === 'cached-only'
            ? 'Cached PSA 10 only. Not on the $' + summary.settings.shortlistMinCachedPsa10 + ' research screen.'
            : 'No graded comps on file.'
    };
  }

  function copySlots(card) {
    const places = card && Array.isArray(card.where) ? card.where : [];
    const n = Math.max((card && card.qty) || 0, places.length);
    const slots = [];
    for (let i = 0; i < n; i++) {
      slots.push({
        copyId: card.id + '#' + (i + 1),
        place: places[i] || 'Location not recorded',
        condition: null,
        photo: 'none',
        disposition: 'unknown',
        frozen: null,
        returned: null
      });
    }
    return slots;
  }

  function accuracyReport(slots) {
    const list = slots || [];
    const returned = list.filter(s => s && s.returned && s.returned.grade);
    if (!returned.length) {
      return { status: 'withheld', percentage: null, returned: 0, matched: 0, withPrediction: 0, reason: 'No returned grades. A percentage is not computed.' };
    }
    const withPrediction = returned.filter(s => s.frozen && s.frozen.grade);
    const matched = withPrediction.filter(s => s.frozen.grade === s.returned.grade);
    return {
      status: 'counts-only',
      percentage: null,
      returned: returned.length,
      withPrediction: withPrediction.length,
      matched: matched.length,
      reason: 'Counts only. No percentage. The sample is small and self-selected, so a percent would overstate certainty.'
    };
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cur = '';
    let q = false;
    const s = String(text || '').replace(/^\uFEFF/, '');
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) {
        if (c === '"') {
          if (s[i + 1] === '"') { cur += '"'; i++; }
          else q = false;
        } else cur += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (c !== '\r') cur += c;
    }
    if (cur.length || row.length) { row.push(cur); rows.push(row); }
    const nonEmpty = rows.filter(r => r.some(cell => String(cell).trim() !== ''));
    if (!nonEmpty.length) return { headers: [], records: [], errors: ['CSV is empty.'] };
    const headers = nonEmpty[0].map(h => String(h).trim());
    const records = nonEmpty.slice(1).map(r => {
      const o = {};
      headers.forEach((h, i) => { o[h] = r[i] != null ? r[i] : ''; });
      return o;
    });
    return { headers, records, errors: [] };
  }

  function boundRecords(format, records) {
    if (!Array.isArray(records)) return { format, records: [], errors: ['The file has no sales array.'] };
    if (records.length > LIMITS.maxRecords) return { format, records: [], errors: ['Too many rows (' + records.length + '). The limit is ' + LIMITS.maxRecords + '. Nothing was saved.'] };
    if (records.some(r => !r || typeof r !== 'object' || Array.isArray(r))) return { format, records: [], errors: ['Each row must be an object matching the sales schema.'] };
    if (records.some(r => Object.keys(r).length > LIMITS.maxKeysPerRecord)) return { format, records: [], errors: ['A row has too many fields. Nothing was saved.'] };
    return { format, records, errors: [] };
  }
  function parseImport(text) {
    const raw = String(text || '').trim();
    if (!raw) return { format: null, records: [], errors: ['Nothing to import.'] };
    if (raw.length > LIMITS.maxImportChars) return { format: null, records: [], errors: ['File is over the ' + LIMITS.maxImportChars + ' character limit. Nothing was saved.'] };
    if (raw[0] === '{' || raw[0] === '[') {
      try {
        const data = JSON.parse(raw);
        const records = Array.isArray(data) ? data : (data && typeof data === 'object' && (data.sales || data.rows || data.records)) || null;
        if (!Array.isArray(records)) return { format: 'json', records: [], errors: ['JSON must be an array of sales, or an object with a sales array.'] };
        return boundRecords('json', records);
      } catch (e) {
        return { format: 'json', records: [], errors: ['JSON could not be parsed.'] };
      }
    }
    const csv = parseCsv(raw);
    if (csv.errors.length) return { format: 'csv', records: [], errors: csv.errors };
    if (csv.headers.length > LIMITS.maxKeysPerRecord) return { format: 'csv', records: [], errors: ['The CSV has too many columns. Nothing was saved.'] };
    return boundRecords('csv', csv.records);
  }

  function csvCell(v) {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(sales) {
    const headers = ['inventory_id', 'grade_class', 'date', 'price_usd', 'currency', 'sale_id', 'marketplace', 'source', 'best_offer', 'shipping', 'title', 'language', 'variant', 'original_url', 'price_basis', 'condition_claim', 'language_verification'];
    const lines = [headers.join(',')];
    (sales || []).forEach(sale => lines.push(headers.map(h => csvCell(sale[h])).join(',')));
    return lines.join('\n') + '\n';
  }

  function blankTemplateCsv() {
    return 'inventory_id,grade_class,date,price_usd,currency,sale_id,marketplace,source,best_offer,shipping,title,language,variant,original_url,price_basis,condition_claim,language_verification\n';
  }

  return {
    GRADES, GRADE_IDS, GRADE_ALIASES, SOURCES, BEST_OFFERS, DEFAULT_SETTINGS, POLICY, LIMITS, STORAGE_KEYS, RESERVED_STORAGE_KEYS,
    escapeHtml, storageKeyAllowed, prepareBackup, csvCell,
    clampSettings, canonicalGrade, roundCents, sellingFee, gradingFeeFor, netProceeds, incremental, median,
    ebayItemId, dedupeKey, dedupeSales, sanitizeRecord, validateSale, adaptReferenceRow, buildPool,
    gradeStats, modelGrade, illustrateOne, hypothetical, summarizeCard, evidenceBucket, copySlots, accuracyReport,
    parseCsv, parseImport, toCsv, blankTemplateCsv, daysBetween, titleContradiction, variantDecision
  };
});
