/* Grading & value tab. Public page. Reads data.json plus the public comp snapshot.
   Grading saves use their own localStorage keys. Collection keys are never read or removed. */
(() => {
  'use strict';
  const G = window.GradingMath;
  if (!G) return;
  const LS_SETTINGS = G.STORAGE_KEYS.settings;
  const LS_IMPORTS = G.STORAGE_KEYS.imports;
  const LS_HYPO = G.STORAGE_KEYS.hypotheticals;
  const LS_COPIES = G.STORAGE_KEYS.copies;
  const LS_BACKUP = G.STORAGE_KEYS.backup;
  const ui = { q: '', filter: 'owned', sort: 'name', comps: null, compsError: '', storageNote: '', loading: false, section: '', importPreview: null };
  let DATA = null;
  let APP = null;

  const esc = s => G.escapeHtml(s);
  function money(v) {
    if (v == null || !Number.isFinite(Number(v))) return 'unknown';
    const n = G.roundCents(Number(v));
    return (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function delta(v) {
    if (v == null || !Number.isFinite(Number(v))) return 'unknown';
    const n = G.roundCents(Number(v));
    const sign = n > 0 ? '+' : n < 0 ? '−' : '';
    return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtDate(s) {
    if (!s) return 'unknown';
    const d = new Date(String(s).slice(0, 10) + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return 'unknown';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function todayISO() {
    const d = new Date();
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
  }
  function loadJSON(key, fallback, maxBytes) {
    if (!G.storageKeyAllowed(key)) return fallback;
    try {
      const raw = localStorage.getItem(key);
      if (raw == null || raw === '') return fallback;
      if (maxBytes && raw.length > maxBytes) {
        ui.storageNote = 'A grading save is over its size limit, so it is not being used. It was not deleted, and collection data was not changed.';
        return fallback;
      }
      return JSON.parse(raw);
    } catch (e) {
      ui.storageNote = 'A grading save could not be read. It was left in place, and collection data was not changed.';
      return fallback;
    }
  }
  function saveJSON(key, value, maxBytes) {
    if (!G.storageKeyAllowed(key)) return 'Refused to write a storage key outside grading.';
    let text = '';
    try { text = JSON.stringify(value); }
    catch (e) { return 'Could not store that. Nothing was written.'; }
    if (maxBytes && text.length > maxBytes) return 'That grading save is over its size limit, so nothing was written. Collection data was not changed.';
    try { localStorage.setItem(key, text); return ''; }
    catch (e) { return 'This browser refused to store that. Nothing else was changed.'; }
  }
  function snapshotGrading() {
    return {
      at: todayISO(),
      settings: loadJSON(LS_SETTINGS, null, G.LIMITS.maxSettingsBytes),
      imports: loadJSON(LS_IMPORTS, null, G.LIMITS.maxImportsBytes),
      hypotheticals: loadJSON(LS_HYPO, null, G.LIMITS.maxHypoBytes),
      copies: loadJSON(LS_COPIES, null, G.LIMITS.maxCopiesBytes)
    };
  }
  function storedSize(key) {
    try { const raw = localStorage.getItem(key); return raw ? raw.length : 0; }
    catch (e) { return -1; }
  }
  function writeBackup() {
    if (!G.storageKeyAllowed(LS_BACKUP)) return 'Refused to write a storage key outside grading.';
    let raw = null;
    try { raw = localStorage.getItem(LS_BACKUP); }
    catch (e) { return 'Could not read the grading backup. Nothing was written.'; }
    if (raw && raw.length > G.LIMITS.maxBackupBytes) return 'The grading backup is over its size limit, so it was left unchanged.';
    let existing = null;
    if (raw) {
      try { existing = JSON.parse(raw); }
      catch (e) { return 'The grading backup could not be read, so it was left unchanged.'; }
    }
    return saveJSON(LS_BACKUP, G.prepareBackup(existing, snapshotGrading()), G.LIMITS.maxBackupBytes);
  }
  function loadSettings() { return G.clampSettings(loadJSON(LS_SETTINGS, null, G.LIMITS.maxSettingsBytes)); }
  function storedImports() {
    const bag = loadJSON(LS_IMPORTS, { rows: [] }, G.LIMITS.maxImportsBytes);
    return bag && Array.isArray(bag.rows) ? bag.rows : [];
  }
  function safeUrl(u) {
    const s = String(u || '').trim();
    if (!/^https:\/\//i.test(s)) return '';
    try { const x = new URL(s); return x.protocol === 'https:' ? x.href : ''; }
    catch (e) { return ''; }
  }
  function setTitle(t) {
    const title = document.getElementById('title');
    const back = document.getElementById('back');
    if (title) title.textContent = t;
    if (back) back.hidden = false;
    document.title = t + ' · Our Pokémon';
  }
  function kick() {
    if (ui.comps || ui.loading) return;
    ui.loading = true;
    fetch('grading-comps.json', { cache: 'no-cache' }).then(r => {
      if (!r.ok) throw new Error('missing');
      return r.json();
    }).then(j => {
      ui.comps = j;
      ui.loading = false;
      if (location.hash.indexOf('#/grading') === 0) paint();
    }).catch(() => {
      ui.loading = false;
      ui.compsError = 'The public comp file did not load. Medians stay unknown. There is no live price refresh on this page.';
      if (location.hash.indexOf('#/grading') === 0) paint();
    });
  }
  function rowsFor(id) {
    if (!ui.comps || !ui.comps.cards || !ui.comps.cards[id]) return [];
    return ui.comps.cards[id].rows.map(r => G.adaptReferenceRow(r, ui.comps.provenance));
  }
  function cardSummary(c) {
    const imports = storedImports().filter(r => r && r.inventory_id === c.id);
    return G.summarizeCard(c.id, rowsFor(c.id), imports, loadSettings(), todayISO());
  }
  function img(c) {
    const src = safeUrl(c && c.img);
    if (!src) return '<div class="noimg">🃏</div>';
    return `<img loading="lazy" decoding="async" referrerpolicy="no-referrer" alt="${esc(c.name)}" src="${esc(src)}">`;
  }
  document.addEventListener('error', e => {
    const t = e.target;
    if (!t || t.tagName !== 'IMG' || !t.closest || !t.closest('.gv')) return;
    const d = document.createElement('div');
    d.className = 'noimg';
    d.textContent = '🃏';
    t.replaceWith(d);
  }, true);
  function nav() {
    return `<div class="gv-actions">
      <a class="gv-btn" href="#/grading">Cards</a>
      <a class="gv-btn" href="#/grading/policy">Policy</a>
      <a class="gv-btn" href="#/grading/assumptions">Assumptions</a>
      <a class="gv-btn" href="#/grading/import">Import</a>
    </div>`;
  }
  function banner() {
    const s = loadSettings();
    const when = ui.comps && ui.comps.provenance ? ui.comps.provenance.collected : 'not loaded';
    return `<div class="note">
      <p>This page is on the public site. It is not a private tab. Anyone with the link can open it.</p>
      <p>Research view only. Not a submission recommendation, a listing, or an order.</p>
      ${ui.storageNote ? `<p class="gv-err">${esc(ui.storageNote)}</p>` : ''}
      <p>Cached prices are not live. Comp file: ${esc(when)}. Fee defaults dated ${esc(s.defaultsAsOf)}${s.editedOn ? ', edited ' + esc(fmtDate(s.editedOn)) : ''}.</p>
      <p>Missing grades stay unknown. No expected value is calculated.</p>
      ${ui.compsError ? `<p class="gv-err">${esc(ui.compsError)}</p>` : ''}
      ${s.minSalesForMedian < 5 ? `<p class="gv-flag">The median rule is set to ${s.minSalesForMedian}, below the default of 5. A thin median is not market certainty.</p>` : ''}
    </div>`;
  }

  const FLAG_TEXT = {
    insufficient: 'Insufficient sales for a median under the current rule.',
    stale: 'Stale. The newest sale is older than the stale-day setting.',
    'not-independently-verified': 'Not independently transaction-verified.',
    'best-offer-unverified': 'Accepted offers are unverified.',
    'shipping-unknown': 'Shipping is unknown and is not added to the price.',
    'language-exclusion-only': 'Language is English only because foreign-language words were absent.',
    'not-independent-across-sites': 'A sale reported on more than one site was counted once.',
    'crossed-price-unverified': 'A crossed price is not a verified accepted offer.'
  };

  function flagsHtml(flags) {
    if (!flags || !flags.length) return '';
    return flags.map(f => `<p class="gv-flag">${esc(FLAG_TEXT[f] || f)}</p>`).join('');
  }

  function gradeBlock(summary, grade) {
    const stat = summary.grades[grade.id];
    const model = summary.models[grade.id];
    const label = grade.label;
    let body = '';
    if (grade.id === 'raw') {
      if (stat.status === 'median') {
        body = `<p><b>${stat.n} sales.</b> Median ${money(stat.median)}.</p>
          <p>Range of these sales: ${money(stat.min)} to ${money(stat.max)}.</p>
          <p>Window: ${esc(fmtDate(stat.window.start))} through ${esc(fmtDate(stat.window.end))}.</p>
          <p>This median is the raw opportunity cost. It is a seller's NM title claim, not the condition of a copy we own.</p>`;
      } else if (stat.status === 'observations') {
        body = `<p><b>${stat.n} sale${stat.n === 1 ? '' : 's'}.</b> Median unknown. The default rule needs ${summary.settings.minSalesForMedian}.</p>
          <p>These are individual observations, not a market.</p>
          ${stat.sales.map(saleLine).join('')}`;
      } else body = `<p><b>0 sales.</b> Raw comp median unknown. The inventory TCGplayer price is not used in its place.</p>`;
    } else if (stat.status === 'unknown') {
      body = `<p><b>0 sales.</b> Median unknown. Dollar difference versus raw: unknown.</p>`;
    } else if (stat.status === 'observations') {
      const ill = (model && model.observations) || [];
      body = `<p><b>${stat.n} sale${stat.n === 1 ? '' : 's'}.</b> Median unknown. Below the ${summary.settings.minSalesForMedian}-sale rule.</p>
        <p>Shown as individual observations, not market certainty.</p>
        ${stat.sales.map(r => {
          const one = ill.find(x => x.sale_id === r.sale_id && x.date === r.date && x.price_usd === r.price_usd) || {};
          return saleLine(r) + `<p>${esc(one.label || 'One reported sale.')} Incremental pre-tax proceeds: ${delta(one.incremental)}.</p>`;
        }).join('')}`;
    } else {
      body = `<p><b>${stat.n} sales.</b> Median ${money(stat.median)}.</p>
        <p>Range of these sales: ${money(stat.min)} to ${money(stat.max)}.</p>
        <p>Window: ${esc(fmtDate(stat.window.start))} through ${esc(fmtDate(stat.window.end))}.</p>
        <p>Price difference versus the raw median: ${delta(model && model.gross_gap)}.</p>
        <p>Incremental pre-tax proceeds versus selling raw: ${delta(model && model.incremental)}.</p>
        ${model && model.reason ? `<p>${esc(model.reason)}</p>` : ''}
        ${model && model.incremental != null ? breakdown(model, summary.settings, label) : ''}`;
    }
    return `<article class="box gv-grade"><h3>${esc(label)}</h3>${body}${flagsHtml(stat.flags)}</article>`;
  }

  function saleLine(r) {
    const href = safeUrl(r.original_url);
    const offer = r.best_offer === 'verified-accepted' ? 'Best offer verified as accepted' : (r.best_offer_detail === 'crossed-price' ? 'Crossed price, accepted amount unverified' : 'Best offer ' + (r.best_offer || 'unverified'));
    const ship = r.shipping === 'unknown' || r.shipping == null ? 'Shipping unknown' : ('Shipping ' + money(r.shipping) + ', not added to the price');
    const also = (r.also_seen_on && r.also_seen_on.length) ? ` Also reported by ${r.also_seen_on.join(', ')}. Counted once.` : '';
    return `<p>${esc(fmtDate(r.date))} · ${money(r.price_usd)} · ${esc(r.marketplace || 'marketplace unknown')} · ${esc(r.source || 'source unknown')}</p>
      <p>Sale id ${esc(r.sale_id || 'none')} · ${esc(offer)} · ${esc(ship)} · ${esc(r.currency || 'USD')}.${esc(also)}</p>
      ${href ? `<p><a href="${esc(href)}" target="_blank" rel="noopener noreferrer">Open this sale</a></p>` : '<p>No source link on this row.</p>'}
      <p>${esc(r.title || '')}</p>`;
  }

  function breakdown(model, settings, label) {
    return `<p>${esc(label)} net ${money(model.graded_net)} after selling fee ${money(model.selling_fee_graded)}, outbound shipping ${money(settings.shipGraded)}, packaging ${money(settings.packGraded)}, grading fee ${money(model.fee && model.fee.fee)}, and transport plus insurance ${money(settings.inboundPerCard)}.</p>
      <p>Raw net ${money(model.raw_net)} after selling fee ${money(model.selling_fee_raw)}, outbound shipping ${money(settings.shipRaw)}, and packaging ${money(settings.packRaw)}.</p>
      <p>Incremental is graded net minus raw net. The purchase price is not subtracted again. This is pre-tax and it is not an expected value.</p>
      <p>${esc(model.fee && model.fee.label || '')}</p>`;
  }

  function listCards() {
    const settings = loadSettings();
    let list = Object.values(DATA.cards);
    if (ui.filter !== 'all') list = list.filter(c => c.qty > 0);
    const q = ui.q.trim().toLowerCase();
    if (q) list = list.filter(c => (c.name + ' ' + c.num + ' ' + c.set + ' ' + c.id).toLowerCase().includes(q));
    if (ui.filter === 'shortlist') list = list.filter(c => c.psa != null && c.psa >= settings.shortlistMinCachedPsa10);
    if (ui.filter === 'comps') list = list.filter(c => rowsFor(c.id).length || storedImports().some(r => r.inventory_id === c.id));
    if (ui.filter === 'thin') list = list.filter(c => c.psa != null && c.psa >= settings.shortlistMinCachedPsa10 && !rowsFor(c.id).length && !storedImports().some(r => r.inventory_id === c.id));
    const summaryCache = new Map();
    const sum = c => {
      if (!summaryCache.has(c.id)) summaryCache.set(c.id, cardSummary(c));
      return summaryCache.get(c.id);
    };
    const psaInc = c => {
      const m = sum(c).models['PSA 10'];
      return m && m.incremental != null ? m.incremental : null;
    };
    list.sort((a, b) => {
      if (ui.sort === 'copies') return b.qty - a.qty || a.name.localeCompare(b.name);
      if (ui.sort === 'raw') return (b.price || 0) - (a.price || 0);
      if (ui.sort === 'cache') return (b.psa || 0) - (a.psa || 0);
      if (ui.sort === 'scenario') {
        const av = psaInc(a), bv = psaInc(b);
        if (av == null && bv == null) return a.name.localeCompare(b.name);
        if (av == null) return 1;
        if (bv == null) return -1;
        return bv - av;
      }
      return a.name.localeCompare(b.name) || a.num.localeCompare(b.num);
    });
    return list.map(c => {
      const s = sum(c);
      const bucket = G.evidenceBucket(c, s);
      const psa = s.grades['PSA 10'];
      const tag = s.grades['TAG 10'];
      const line = psa.status === 'median'
        ? `PSA 10 median ${money(psa.median)} (n=${psa.n}). Scenario incremental ${delta(s.models['PSA 10'].incremental)}.`
        : (psa.n ? `PSA 10: ${psa.n} sale${psa.n === 1 ? '' : 's'}, median unknown.` : 'PSA 10 median unknown.');
      const tagLine = tag.status === 'median'
        ? `TAG Gem 10 median ${money(tag.median)} (n=${tag.n}).`
        : (tag.n ? `TAG Gem 10: ${tag.n} sale${tag.n === 1 ? '' : 's'}, median unknown.` : 'TAG Gem 10 unknown.');
      return `<a class="row" href="#/grading/${esc(c.id)}">${img(c)}
        <div class="mid"><div class="nm">${esc(c.name)}</div>
        <div class="sm">${esc(c.set)} · #${esc(c.num)} · ${c.qty} cop${c.qty === 1 ? 'y' : 'ies'}</div>
        <div class="sm">${esc(line)}</div>
        <div class="sm">${esc(tagLine)}</div>
        <div class="sm">${esc(bucket.label)}</div></div>
        <div class="rt">Open</div></a>`;
    }).join('');
  }

  function paintList() {
    setTitle('Grading & value');
    const settings = loadSettings();
    const owned = Object.values(DATA.cards).filter(c => c.qty > 0);
    const short = owned.filter(c => c.psa != null && c.psa >= settings.shortlistMinCachedPsa10);
    const withComps = short.filter(c => rowsFor(c.id).length);
    const pilots = ui.comps && ui.comps.cards ? Object.keys(ui.comps.cards).map(id => DATA.cards[id]).filter(Boolean) : [];
    const chips = [
      ['owned', 'Ours'], ['shortlist', 'Shortlist'], ['comps', 'Comps'], ['thin', 'Thin'], ['all', 'Every card']
    ];
    const sorts = [
      ['name', 'Name'], ['copies', 'Copies'], ['raw', 'Raw price'], ['cache', 'PSA cache'], ['scenario', 'Scenario']
    ];
    APP.innerHTML = `<div class="gv"><h1>Grading and value</h1>${banner()}${nav()}
      <p>${owned.length} cards we own. ${withComps.length} of the ${short.length} shortlist cards (cached PSA 10 of ${money(settings.shortlistMinCachedPsa10)} or more) have the public comp file. The other shortlist cards are insufficient until a comp file is imported. Inventory does not record condition, language, or our own photos.</p>
      ${pilots.length ? `<p>Public snapshot cards:</p><div class="gv-actions">${pilots.map(c => `<a class="gv-btn" href="#/grading/${esc(c.id)}">${esc(c.name)}</a>`).join('')}</div>` : ''}
      <input type="search" id="gvq" placeholder="Search name, number, or set" value="${esc(ui.q)}" autocomplete="off" enterkeyhint="search">
      <div class="gv-chips" role="group" aria-label="Filter">${chips.map(([id, label]) => `<button type="button" data-filter="${id}" class="${ui.filter === id ? 'on' : ''}" aria-pressed="${ui.filter === id}">${label}</button>`).join('')}</div>
      <div class="gv-chips" role="group" aria-label="Sort">${sorts.map(([id, label]) => `<button type="button" data-sort="${id}" class="${ui.sort === id ? 'on' : ''}" aria-pressed="${ui.sort === id}">${label}</button>`).join('')}</div>
      <div class="list">${listCards() || '<p>No cards match.</p>'}</div>
      <p><a class="gv-btn" href="#/grading/sheet">Sheet cached PSA 10 check</a></p>
      <p class="foot">Sources on a card page are links only. This site does not sign in, scrape, buy, or sell.</p></div>`;
    const q = document.getElementById('gvq');
    if (q) q.oninput = () => { ui.q = q.value; paintList(); const again = document.getElementById('gvq'); if (again) { again.focus(); const n = again.value.length; try { again.setSelectionRange(n, n); } catch (e) {} } };
    APP.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { ui.filter = b.dataset.filter; paintList(); });
    APP.querySelectorAll('[data-sort]').forEach(b => b.onclick = () => { ui.sort = b.dataset.sort; paintList(); });
  }

  function paintSheet() {
    setTitle('Sheet PSA check');
    const own = Object.values(DATA.cards).filter(c => c.qty > 0 && c.gain != null).sort((a, b) => b.gain - a.gain);
    const rows = own.map(c => `<a class="row" href="#/grading/${esc(c.id)}">${img(c)}<div class="mid"><div class="nm">${esc(c.name)}</div>
      <div class="sm">Stored sheet gain ${delta(c.gain)} · verdict ${esc(c.verdict || 'unknown')} · cached PSA 10 ${c.psa == null ? 'unknown' : money(c.psa)}</div></div><div class="rt">Open</div></a>`).join('');
    APP.innerHTML = `<div class="gv"><h1>Sheet cached PSA 10 check</h1>${nav()}
      <article class="box"><p>These numbers are already stored in the collection file. The formula there is cached PSA 10 minus the TCGplayer price minus a sheet fee minus return shipping. The sheet fee table still starts at $39.99. PSA's pricing page on 2026-11-07 listed that Value tier as paused. This is not the incremental model, and it is not a live price.</p></article>
      <div class="list">${rows}</div></div>`;
  }

  function paintDetail(c) {
    setTitle(c.name);
    const summary = cardSummary(c);
    const bucket = G.evidenceBucket(c, summary);
    const settings = summary.settings;
    const note = c.id === 'me55-154' && ui.comps && ui.comps.provenance ? ui.comps.provenance.variant_note : '';
    const prov = ui.comps && ui.comps.provenance;
    const where = (c.where && c.where.length) ? c.where.map(w => `<li>${esc(w)}</li>`).join('') : '<li>Location not recorded</li>';
    APP.innerHTML = `<div class="gv"><h1>${esc(c.name)}</h1>${banner()}${nav()}
      <p><a class="gv-btn" href="#/card/${esc(c.id)}">Collection card</a></p>
      <article class="box">
        <p>${esc(c.set)} · #${esc(c.num)} · ${esc(c.rarity || '')}</p>
        <p>${c.qty} cop${c.qty === 1 ? 'y' : 'ies'} in inventory. Language: not recorded. Condition: not recorded. Photos here are TCGplayer stock, not our copies.</p>
        <ul>${where}</ul>
        <p>${esc(bucket.label)}</p>
        <p>Inventory raw (TCGplayer market, cached ${esc(fmtDate(DATA.prices_asof))}): ${money(c.price)}. Not a comp median, and not used as the opportunity cost unless you type it into a hypothetical.</p>
        <p>Cached PriceCharting PSA 10: ${c.psa == null ? 'unknown' : money(c.psa)}, as of ${esc(fmtDate(c.psa_asof))}. Sale-count field: ${c.psa_sales == null ? 'unknown' : esc(String(c.psa_sales))} (definition not re-verified). Not a live price.</p>
      </article>
      ${note ? `<div class="note"><p>${esc(note)}</p><p>That stamp note is from a secondary database only. It is not an official Pokémon verification.</p></div>` : ''}
      ${prov && rowsFor(c.id).length ? `<article class="box"><h2>Where these comps came from</h2>
        <p>${esc(prov.via || '')}</p>
        <p>Collected ${esc(prov.collected || 'unknown')}. Window ${esc(prov.window || 'unknown')}.</p>
        <p>${esc(prov.filters || '')}</p>
        <p>Quality: ${ui.comps.evidence_quality ? esc(ui.comps.evidence_quality.level) : 'reported rows'}.</p>
        <p>PriceCharting reported rows are not independently transaction-verified. Shipping is unknown. Accepted offers are unverified.</p>
      </article>` : `<article class="box"><p>No public comp rows for this card. Cached PSA 10 is not a substitute median. Use the source links and import sales if you have them.</p></article>`}
      <h2>Grades</h2>
      ${G.GRADES.map(g => gradeBlock(summary, g)).join('')}
      <h2>Assumptions in this scenario</h2>
      <article class="box">
        <p>Selling fee ${Number.isFinite(settings.sellFeeRate) ? (settings.sellFeeRate * 100).toFixed(2) + '%' : 'unknown'} of price times (1 + ${Number.isFinite(settings.taxFeeBaseRate) ? (settings.taxFeeBaseRate * 100).toFixed(2) + '% assumed sales tax' : 'unknown tax'}) plus ${money(settings.sellFeeFixed)} per order.</p>
        <p>Raw outbound ${money(settings.shipRaw)} plus packaging ${money(settings.packRaw)}. Graded outbound ${money(settings.shipGraded)} plus packaging ${money(settings.packGraded)}. Transport and insurance ${money(settings.inboundPerCard)} per card.</p>
        <p>TAG fee ${money(settings.tagFee)} (${esc(settings.tagFeeName)}, article dated ${esc(settings.tagFeeAsOf)}). PSA uses ${settings.psaMode === 'flat' ? 'a flat fee of ' + money(settings.psaFlatFee) : 'the editable tier table'}.</p>
        <p>Median rule: ${settings.minSalesForMedian} sales. Stale after ${settings.staleDays} days. Defaults dated ${esc(settings.defaultsAsOf)}.</p>
        <p><a class="gv-btn" href="#/grading/assumptions">Edit assumptions</a></p>
      </article>
      ${hypoHtml(c, summary)}
      <h2>Source links</h2>
      ${linksHtml(c)}
      <h2>Sales on file</h2>
      ${salesHtml(summary)}
      <h2>Copy log</h2>
      ${copiesHtml(c)}
      <p class="foot">Keep, sell, and grade start unknown. Nothing here submits a card or places an order.</p>
    </div>`;
    bindHypo(c, summary);
    bindCopies(c);
  }

  function hypoHtml(c, summary) {
    const saved = (loadJSON(LS_HYPO, {}, G.LIMITS.maxHypoBytes) || {})[c.id] || {};
    const grades = G.GRADES.filter(g => g.id !== 'raw');
    const rawMed = summary.grades.raw.status === 'median' ? summary.grades.raw.median : null;
    const result = G.hypothetical({
      grade: saved.grade || '',
      price: saved.price == null || saved.price === '' ? null : Number(saved.price),
      rawPrice: saved.rawPrice == null || saved.rawPrice === '' ? null : Number(saved.rawPrice)
    }, summary.settings);
    return `<article class="box gv-hypo"><h2>Hypothetical scenario</h2>
      <p>${esc(result.label)}</p>
      <label class="gv-k">Grade
        <select id="gv-hypo-grade">${[''].concat(grades.map(g => g.id)).map(id => `<option value="${esc(id)}"${saved.grade === id ? ' selected' : ''}>${id ? esc(G.GRADES.find(g => g.id === id).label) : 'Choose'}</option>`).join('')}</select>
      </label>
      <label class="gv-k">Graded price, USD<input id="gv-hypo-price" inputmode="decimal" value="${esc(saved.price ?? '')}"></label>
      <label class="gv-k">Raw price, USD<input id="gv-hypo-raw" inputmode="decimal" value="${esc(saved.rawPrice ?? '')}"></label>
      <div class="gv-actions">
        <button type="button" id="gv-hypo-med" ${rawMed == null ? 'disabled' : ''}>Use raw comp median</button>
        <button type="button" id="gv-hypo-inv">Use inventory price as raw</button>
        <button type="button" id="gv-hypo-clear">Clear scenario</button>
      </div>
      <p id="gv-hypo-out">Price difference ${delta(result.gross_gap)}. Incremental pre-tax proceeds ${delta(result.incremental)}. ${esc(result.reason || '')}</p>
      ${saved.rawSource === 'inventory' ? '<p>The raw price in this scenario is the cached inventory market, not a verified comp.</p>' : ''}
    </article>`;
  }

  function bindHypo(c, summary) {
    const read = () => {
      const bag = loadJSON(LS_HYPO, {}, G.LIMITS.maxHypoBytes) || {};
      const prev = bag[c.id] || {};
      const price = document.getElementById('gv-hypo-price').value.trim().slice(0, 20);
      const raw = document.getElementById('gv-hypo-raw').value.trim().slice(0, 20);
      bag[c.id] = {
        grade: String(document.getElementById('gv-hypo-grade').value || '').slice(0, 40),
        price: price === '' ? '' : price,
        rawPrice: raw === '' ? '' : raw,
        rawSource: prev.rawSource || ''
      };
      saveJSON(LS_HYPO, bag, G.LIMITS.maxHypoBytes);
      paintDetail(c);
    };
    document.getElementById('gv-hypo-grade').onchange = read;
    document.getElementById('gv-hypo-price').onchange = read;
    document.getElementById('gv-hypo-raw').onchange = () => {
      const bag = loadJSON(LS_HYPO, {}, G.LIMITS.maxHypoBytes) || {};
      bag[c.id] = Object.assign({}, bag[c.id], { rawSource: '' });
      saveJSON(LS_HYPO, bag, G.LIMITS.maxHypoBytes);
      read();
    };
    const med = document.getElementById('gv-hypo-med');
    if (med) med.onclick = () => {
      const rawMed = summary.grades.raw.status === 'median' ? summary.grades.raw.median : null;
      if (rawMed == null) return;
      document.getElementById('gv-hypo-raw').value = String(rawMed);
      const bag = loadJSON(LS_HYPO, {}, G.LIMITS.maxHypoBytes) || {};
      bag[c.id] = Object.assign({}, bag[c.id], { rawSource: 'comp' });
      saveJSON(LS_HYPO, bag, G.LIMITS.maxHypoBytes);
      read();
    };
    document.getElementById('gv-hypo-inv').onclick = () => {
      document.getElementById('gv-hypo-raw').value = c.price == null ? '' : String(c.price);
      const bag = loadJSON(LS_HYPO, {}, G.LIMITS.maxHypoBytes) || {};
      bag[c.id] = Object.assign({}, bag[c.id], { rawSource: 'inventory' });
      saveJSON(LS_HYPO, bag, G.LIMITS.maxHypoBytes);
      read();
    };
    document.getElementById('gv-hypo-clear').onclick = () => {
      const bag = loadJSON(LS_HYPO, {}, G.LIMITS.maxHypoBytes) || {};
      delete bag[c.id];
      saveJSON(LS_HYPO, bag, G.LIMITS.maxHypoBytes);
      paintDetail(c);
    };
  }

  function linksHtml(c) {
    const q = [c.name, c.num, c.set, 'pokemon'].filter(Boolean).join(' ');
    const items = [
      ['eBay Product Research', 'https://www.ebay.com/sh/research', 'Actual accepted offers, including Best Offer. Requires your own eBay sign-in. This site cannot log in or call a private API. Export a file and use Import.'],
      ['How Product Research works', 'https://www.ebay.com/help/selling/selling-tools/terapeak-research-and-SEO?id=4853', 'eBay help page. No login is sent from here.'],
      ['eBay sold search', 'https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(q) + '&LH_Sold=1&LH_Complete=1', 'A Best Offer sale shows the listed price struck through, not the accepted price. Do not treat a struck-through price as the sale.'],
      ['PSA Auction Prices Realized', 'https://www.psacard.com/auctionprices', 'Public PSA results. Search this card there. This site did not download PSA rows.'],
      ['TCGplayer product', c.url, 'Market price is an aggregate of recent raw sales. Asking prices are not sales. Graded comps are not taken from here.'],
      ['130point', 'https://130point.com/sales/', 'Cross-check for an accepted Best Offer amount. The same eBay sale is not a second data point. Suggested search: ' + q],
      ['PriceCharting', c.psa_url, 'Bundled rows, when this card has them, came from the public page on 2026-11-07. Not independently verified.']
    ];
    return items.map(([name, href, note]) => {
      const url = safeUrl(href);
      if (!url) return `<article class="box"><h3>${esc(name)}</h3><p>Link unavailable.</p><p>${esc(note)}</p></article>`;
      return `<article class="box"><h3>${esc(name)}</h3><p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open ${esc(name)}</a></p><p>${esc(note)}</p></article>`;
    }).join('');
  }

  function salesHtml(summary) {
    const rows = [];
    G.GRADES.forEach(g => summary.grades[g.id].sales.forEach(r => rows.push(r)));
    if (!rows.length) return '<p>No sales on file for this card.</p>';
    return `<p>${rows.length} sales after de-duplication. The same eBay item is one sale even if another site also lists it.</p>` + rows.map(r => `<article class="box">${saleLine(r)}</article>`).join('');
  }

  function copiesHtml(c) {
    const saved = loadJSON(LS_COPIES, {}, G.LIMITS.maxCopiesBytes) || {};
    const slots = G.copySlots(c).map(slot => Object.assign({}, slot, saved[slot.copyId] || {}));
    const report = G.accuracyReport(slots);
    const opts = ['', 'PSA 8', 'PSA 9', 'PSA 10', 'TAG 9', 'TAG 10', 'TAG 10 Pristine'];
    const opt = (cur) => opts.map(id => `<option value="${esc(id)}"${cur === id ? ' selected' : ''}>${id ? esc(G.GRADES.find(g => g.id === id).label) : 'Unknown'}</option>`).join('');
    const cards = slots.map(slot => `<article class="box" data-copy="${esc(slot.copyId)}">
      <h3>${esc(slot.copyId)}</h3>
      <p>${esc(slot.place)}</p>
      <label class="gv-k">Condition note (stays in this browser)<textarea data-field="condition" maxlength="500">${esc(slot.condition || '')}</textarea></label>
      <label class="gv-k">Photos<select data-field="photo">
        <option value="none"${slot.photo !== 'taken-offline' ? ' selected' : ''}>No photo recorded</option>
        <option value="taken-offline"${slot.photo === 'taken-offline' ? ' selected' : ''}>Photos taken, kept off this site</option>
      </select></label>
      <label class="gv-k">Keep or sell<select data-field="disposition">
        <option value="unknown"${slot.disposition !== 'keep' && slot.disposition !== 'sell-raw' ? ' selected' : ''}>Unknown</option>
        <option value="keep"${slot.disposition === 'keep' ? ' selected' : ''}>Keep</option>
        <option value="sell-raw"${slot.disposition === 'sell-raw' ? ' selected' : ''}>Sell raw</option>
      </select></label>
      <p>Frozen prediction: ${slot.frozen && slot.frozen.grade ? esc(slot.frozen.grade) + ' on ' + esc(fmtDate(slot.frozen.at)) : 'none yet'}.</p>
      ${slot.frozenHistory && slot.frozenHistory.length ? `<p>Earlier frozen grades: ${slot.frozenHistory.map(h => esc(h.grade) + ' on ' + esc(fmtDate(h.at))).join('; ')}.</p>` : ''}
      <label class="gv-k">Prediction to freeze<select data-field="predict">${opt('')}</select></label>
      <button type="button" data-freeze>Freeze prediction</button>
      <p>Returned grade: ${slot.returned && slot.returned.grade ? esc(slot.returned.grade) + ' on ' + esc(fmtDate(slot.returned.at)) : 'none'}.</p>
      <label class="gv-k">Returned grade<select data-field="returned">${opt(slot.returned && slot.returned.grade || '')}</select></label>
      <button type="button" data-return>Record returned grade</button>
    </article>`).join('');
    return `<p>One id per physical copy, from the binder pocket list. Keep or sell starts unknown. Photos are not uploaded.</p>
      <p id="gv-copy-msg"></p>
      <p>Condition notes stay in this browser under a grading key. They are not written into the public collection files. This page is still public. Do not commit a downloaded copy log.</p>
      <button type="button" id="gv-copy-export">Download copy log JSON</button>
      <p>${esc(report.reason)} Returned ${report.returned}. Matched the original frozen grade: ${report.matched} of ${report.withPrediction}. Percentage: not shown.</p>
      ${cards}`;
  }

  function bindCopies(c) {
    const exportBtn = document.getElementById('gv-copy-export');
    if (exportBtn) exportBtn.onclick = () => {
      const slots = G.copySlots(c).map(slot => Object.assign({}, slot, (loadJSON(LS_COPIES, {}, G.LIMITS.maxCopiesBytes) || {})[slot.copyId] || {}));
      download(c.id + '-copy-log.json', JSON.stringify({ schema: 'fenton-grading-copy-log-v1', publicSite: true, doNotCommit: true, copies: slots }, null, 2), 'application/json');
    };
    const bag = () => loadJSON(LS_COPIES, {}, G.LIMITS.maxCopiesBytes) || {};
    APP.querySelectorAll('[data-copy]').forEach(box => {
      const id = box.dataset.copy;
      const field = name => box.querySelector('[data-field="' + name + '"]');
      const write = (patch) => {
        const all = bag();
        const cur = all[id] || {};
        all[id] = Object.assign({}, cur, patch);
        const err = saveJSON(LS_COPIES, all, G.LIMITS.maxCopiesBytes);
        const note = document.getElementById('gv-copy-msg');
        if (note) note.textContent = err || '';
      };
      field('condition').onchange = () => {
        let text = field('condition').value.slice(0, 500);
        if (/data:image/i.test(text)) text = '';
        write({ condition: text || null });
      };
      field('photo').onchange = () => write({ photo: field('photo').value === 'taken-offline' ? 'taken-offline' : 'none' });
      field('disposition').onchange = () => {
        const v = field('disposition').value;
        write({ disposition: v === 'keep' || v === 'sell-raw' ? v : 'unknown' });
      };
      box.querySelector('[data-freeze]').onclick = () => {
        const grade = field('predict').value;
        if (!grade) return;
        const all = bag();
        const cur = all[id] || {};
        const history = (cur.frozenHistory || []).slice();
        if (cur.frozen && cur.frozen.grade) history.push(cur.frozen);
        all[id] = Object.assign({}, cur, { frozen: { grade, at: todayISO() }, frozenHistory: history });
        saveJSON(LS_COPIES, all, G.LIMITS.maxCopiesBytes);
        paintDetail(c);
      };
      box.querySelector('[data-return]').onclick = () => {
        const grade = field('returned').value;
        const all = bag();
        const cur = all[id] || {};
        all[id] = Object.assign({}, cur, { returned: grade ? { grade, at: todayISO() } : null });
        saveJSON(LS_COPIES, all, G.LIMITS.maxCopiesBytes);
        paintDetail(c);
      };
    });
  }

  function paintPolicy() {
    setTitle('Grading policy');
    const s = loadSettings();
    APP.innerHTML = `<div class="gv"><h1>Policy</h1>${nav()}
      ${G.POLICY.paragraphs.map(p => `<article class="box"><p>${esc(p)}</p></article>`).join('')}
      <article class="box"><h2>Defaults in use</h2>
        <p>Median rule: ${s.minSalesForMedian} sales (published default ${G.DEFAULT_SETTINGS.minSalesForMedian}).</p>
        <p>Stale after ${s.staleDays} days.</p>
        <p>English-by-exclusion rows ${s.countUnverifiedLanguage ? 'are counted and flagged' : 'are excluded'}.</p>
        <p>PSA tier bump when the sale range exceeds the cap: ${s.bumpTierWhenRangeExceedsCap ? 'on' : 'off'}.</p>
        <p>Placeholder screens, not actions: incremental at least ${money(s.placeholderSubmitIncremental)}, and ${s.placeholderLiquiditySales} sales in ${s.placeholderLiquidityDays} days. Changing them does not submit, list, or buy a card.</p>
        <p>${esc(s.defaultsNote)}</p>
      </article>
      <article class="box"><h2>Strongest sources, in order</h2>
        <p>1. eBay Product Research for the actual accepted price. Login required. Not connected.</p>
        <p>2. PSA Auction Prices Realized for PSA grades. Public page. Not downloaded into this snapshot.</p>
        <p>3. TCGplayer recent sales for raw cards, by condition.</p>
        <p>4. 130point only to cross-check an accepted Best Offer. Same eBay sale, so de-duplicate by item id.</p>
        <p>The bundled file is PriceCharting's reproduction of marketplace rows. It is the latest snapshot and it replaces earlier pilot dollar tables.</p>
      </article></div>`;
  }

  function paintAssumptions() {
    setTitle('Assumptions');
    const s = loadSettings();
    const pct = v => v == null || !Number.isFinite(v) ? '' : String(Math.round(v * 10000) / 100);
    const num = v => v == null || !Number.isFinite(v) ? '' : String(v);
    const tiers = s.psaTiers.map((t, i) => `<div class="box" data-tier>
      <label class="gv-k">Declared value up to<input data-max inputmode="decimal" value="${esc(String(t.maxDeclared))}"></label>
      <label class="gv-k">Fee, USD<input data-fee inputmode="decimal" value="${esc(String(t.fee))}"></label>
      <label class="gv-k">Tier name<input data-name value="${esc(t.name)}"></label>
      <button type="button" data-remove-tier="${i}">Remove tier</button>
    </div>`).join('');
    APP.innerHTML = `<div class="gv"><h1>Assumptions</h1>${banner()}${nav()}
      <p>Published defaults were read ${esc(fmtDate(s.defaultsAsOf))}. TAG Standard's article date is ${esc(s.tagFeeAsOf)}. Blank cost fields stay unknown and the incremental becomes unknown. Invalid numbers are not saved.</p>
      <p>${esc(s.defaultsNote)}</p>
      <div id="gv-set-msg"></div>
      <label class="gv-k">Reviewed on<input id="gv-edited" type="date" value="${esc(s.editedOn || todayISO())}"></label>
      <h2>PSA fee</h2>
      <div class="gv-chips">
        <button type="button" id="gv-mode-tiers" class="${s.psaMode !== 'flat' ? 'on' : ''}">Tier table</button>
        <button type="button" id="gv-mode-flat" class="${s.psaMode === 'flat' ? 'on' : ''}">One PSA fee</button>
      </div>
      <label class="gv-k">Flat PSA fee, USD (used only in one-fee mode)<input id="gv-psa-flat" inputmode="decimal" value="${esc(num(s.psaFlatFee))}"></label>
      <div id="gv-tiers">${tiers}</div>
      <button type="button" id="gv-add-tier">Add tier</button>
      <label class="gv-k"><input id="gv-bump" type="checkbox" ${s.bumpTierWhenRangeExceedsCap ? 'checked' : ''}> Use the next tier when the sale range exceeds the cap</label>
      <h2>TAG fee</h2>
      <label class="gv-k">TAG fee, USD<input id="gv-tag" inputmode="decimal" value="${esc(num(s.tagFee))}"></label>
      <label class="gv-k">TAG fee name<input id="gv-tag-name" value="${esc(s.tagFeeName)}"></label>
      <h2>Selling costs</h2>
      <label class="gv-k">Selling fee percent<input id="gv-fee-pct" inputmode="decimal" value="${esc(pct(s.sellFeeRate))}"></label>
      <label class="gv-k">Per order, USD<input id="gv-fee-fixed" inputmode="decimal" value="${esc(num(s.sellFeeFixed))}"></label>
      <label class="gv-k">Sales-tax percent used only as the fee base<input id="gv-tax" inputmode="decimal" value="${esc(pct(s.taxFeeBaseRate))}"></label>
      <label class="gv-k">Transport and insurance per card, USD<input id="gv-in" inputmode="decimal" value="${esc(num(s.inboundPerCard))}"></label>
      <label class="gv-k">Raw outbound shipping, USD<input id="gv-ship-raw" inputmode="decimal" value="${esc(num(s.shipRaw))}"></label>
      <label class="gv-k">Raw packaging, USD<input id="gv-pack-raw" inputmode="decimal" value="${esc(num(s.packRaw))}"></label>
      <label class="gv-k">Graded outbound shipping, USD<input id="gv-ship-gr" inputmode="decimal" value="${esc(num(s.shipGraded))}"></label>
      <label class="gv-k">Graded packaging, USD<input id="gv-pack-gr" inputmode="decimal" value="${esc(num(s.packGraded))}"></label>
      <h2>Evidence rule</h2>
      <label class="gv-k">Sales required before a median<input id="gv-min-n" inputmode="numeric" value="${esc(String(s.minSalesForMedian))}"></label>
      <label class="gv-k">Stale after this many days<input id="gv-stale" inputmode="numeric" value="${esc(String(s.staleDays))}"></label>
      <label class="gv-k">Shortlist screen, cached PSA 10 at least<input id="gv-short" inputmode="decimal" value="${esc(num(s.shortlistMinCachedPsa10))}"></label>
      <label class="gv-k"><input id="gv-lang" type="checkbox" ${s.countUnverifiedLanguage ? 'checked' : ''}> Count English-by-exclusion rows (they stay flagged)</label>
      <h2>Placeholder screens</h2>
      <p>These do not submit, list, buy, or sell. They are notes for a later decision.</p>
      <label class="gv-k">Incremental at least, USD<input id="gv-ph-inc" inputmode="decimal" value="${esc(num(s.placeholderSubmitIncremental))}"></label>
      <label class="gv-k">Liquidity sales<input id="gv-ph-n" inputmode="numeric" value="${esc(String(s.placeholderLiquiditySales))}"></label>
      <label class="gv-k">Liquidity window, days<input id="gv-ph-days" inputmode="numeric" value="${esc(String(s.placeholderLiquidityDays))}"></label>
      <div class="gv-actions">
        <button type="button" id="gv-save">Save on this browser</button>
        <button type="button" id="gv-reset">Use published defaults</button>
        <button type="button" id="gv-export-set">Download settings JSON</button>
      </div>
    </div>`;
    let mode = s.psaMode === 'flat' ? 'flat' : 'tiers';
    document.getElementById('gv-mode-tiers').onclick = () => { mode = 'tiers'; document.getElementById('gv-mode-tiers').classList.add('on'); document.getElementById('gv-mode-flat').classList.remove('on'); };
    document.getElementById('gv-mode-flat').onclick = () => { mode = 'flat'; document.getElementById('gv-mode-flat').classList.add('on'); document.getElementById('gv-mode-tiers').classList.remove('on'); };
    document.getElementById('gv-add-tier').onclick = () => {
      const wrap = document.getElementById('gv-tiers');
      const div = document.createElement('div');
      div.className = 'box';
      div.dataset.tier = '1';
      div.innerHTML = `<label class="gv-k">Declared value up to<input data-max inputmode="decimal" value=""></label>
        <label class="gv-k">Fee, USD<input data-fee inputmode="decimal" value=""></label>
        <label class="gv-k">Tier name<input data-name value="Listed"></label>
        <button type="button" data-remove-tier="new">Remove tier</button>`;
      wrap.appendChild(div);
      div.querySelector('[data-remove-tier]').onclick = () => div.remove();
    };
    APP.querySelectorAll('[data-remove-tier]').forEach(b => b.onclick = () => b.closest('[data-tier]').remove());
    document.getElementById('gv-save').onclick = () => saveAssumptions(mode);
    document.getElementById('gv-reset').onclick = () => {
      const msg = document.getElementById('gv-set-msg');
      if (storedSize(LS_SETTINGS) < 0 || storedSize(LS_SETTINGS) > G.LIMITS.maxSettingsBytes) {
        msg.innerHTML = '<p class="gv-err">Current grading settings were left unchanged.</p>'; return;
      }
      const backed = writeBackup();
      if (backed) { msg.innerHTML = `<p class="gv-err">${esc(backed)} Published defaults were not applied.</p>`; return; }
      const err = saveJSON(LS_SETTINGS, G.clampSettings({ editedOn: todayISO() }), G.LIMITS.maxSettingsBytes);
      msg.innerHTML = err ? `<p class="gv-err">${esc(err)}</p>` : '<p class="gv-ok">Published defaults are in use. The previous grading settings remain in the grading backup. Nothing was deleted.</p>';
      if (!err) paintAssumptions();
    };
    document.getElementById('gv-export-set').onclick = () => download('grading-assumptions.json', JSON.stringify(loadSettings(), null, 2), 'application/json');
  }

  function readCost(id) {
    const el = document.getElementById(id);
    const t = el.value.trim();
    if (t === '') return { ok: true, value: null };
    const n = Number(t);
    if (!Number.isFinite(n)) return { ok: false, value: null };
    return { ok: true, value: n };
  }
  function saveAssumptions(mode) {
    const msg = document.getElementById('gv-set-msg');
    const costs = ['gv-psa-flat', 'gv-tag', 'gv-fee-fixed', 'gv-in', 'gv-ship-raw', 'gv-pack-raw', 'gv-ship-gr', 'gv-pack-gr'];
    const parsed = {};
    for (const id of costs) {
      const r = readCost(id);
      if (!r.ok) { msg.innerHTML = '<p class="gv-err">A cost field is not a number, so nothing was saved.</p>'; return; }
      parsed[id] = r.value;
    }
    const feePct = readCost('gv-fee-pct');
    const tax = readCost('gv-tax');
    if (!feePct.ok || !tax.ok) { msg.innerHTML = '<p class="gv-err">A percent field is not a number, so nothing was saved.</p>'; return; }
    const tiers = [];
    let tierBad = false;
    APP.querySelectorAll('[data-tier]').forEach(box => {
      const max = box.querySelector('[data-max]').value.trim();
      const fee = box.querySelector('[data-fee]').value.trim();
      const name = box.querySelector('[data-name]').value.trim() || 'Listed';
      if (max === '' && fee === '') return;
      const maxN = Number(max), feeN = Number(fee);
      if (!Number.isFinite(maxN) || !Number.isFinite(feeN) || feeN < 0) tierBad = true;
      else tiers.push({ maxDeclared: maxN, fee: feeN, name: name.slice(0, 80) });
    });
    if (tierBad) { msg.innerHTML = '<p class="gv-err">A PSA tier is not a number, so nothing was saved.</p>'; return; }
    if (tiers.length > G.LIMITS.maxTiers) { msg.innerHTML = '<p class="gv-err">Too many PSA tiers. Nothing was saved.</p>'; return; }
    const minN = parseInt(document.getElementById('gv-min-n').value, 10);
    const stale = parseInt(document.getElementById('gv-stale').value, 10);
    if (!Number.isFinite(minN) || minN < 1 || !Number.isFinite(stale) || stale < 1) {
      msg.innerHTML = '<p class="gv-err">The median rule and stale days need whole numbers of 1 or more.</p>'; return;
    }
    const next = G.clampSettings({
      psaMode: mode,
      psaFlatFee: parsed['gv-psa-flat'],
      psaTiers: tiers.length ? tiers : loadSettings().psaTiers,
      bumpTierWhenRangeExceedsCap: document.getElementById('gv-bump').checked,
      tagFee: parsed['gv-tag'],
      tagFeeName: document.getElementById('gv-tag-name').value.trim() || 'TAG Standard',
      sellFeeRate: feePct.value == null ? null : feePct.value / 100,
      sellFeeFixed: parsed['gv-fee-fixed'],
      taxFeeBaseRate: tax.value == null ? null : tax.value / 100,
      inboundPerCard: parsed['gv-in'],
      shipRaw: parsed['gv-ship-raw'],
      packRaw: parsed['gv-pack-raw'],
      shipGraded: parsed['gv-ship-gr'],
      packGraded: parsed['gv-pack-gr'],
      minSalesForMedian: minN,
      staleDays: stale,
      shortlistMinCachedPsa10: (() => { const r = readCost('gv-short'); return r.ok && r.value != null ? r.value : loadSettings().shortlistMinCachedPsa10; })(),
      countUnverifiedLanguage: document.getElementById('gv-lang').checked,
      placeholderSubmitIncremental: readCost('gv-ph-inc').value == null ? 0 : readCost('gv-ph-inc').value,
      placeholderLiquiditySales: parseInt(document.getElementById('gv-ph-n').value, 10) || 0,
      placeholderLiquidityDays: parseInt(document.getElementById('gv-ph-days').value, 10) || 0,
      editedOn: document.getElementById('gv-edited').value || todayISO()
    });
    const err = saveJSON(LS_SETTINGS, next, G.LIMITS.maxSettingsBytes);
    msg.innerHTML = err ? `<p class="gv-err">${esc(err)}</p>` : '<p class="gv-ok">Saved in this browser under the grading settings key. The collection file and other saved site data were not changed. This page is still public.</p>';
  }

  function paintImport() {
    setTitle('Import sales');
    const n = storedImports().length;
    const preview = ui.importPreview;
    APP.innerHTML = `<div class="gv"><h1>Import and export</h1>${banner()}${nav()}
      <article class="box">
        <p>Bring in CSV or JSON you downloaded yourself. Rows must match the inventory card, variant, English language, and exact grader and grade. Currency has to be USD. Shipping is a number or the word unknown. Best-offer state is required.</p>
        <p>The same eBay item id is one sale. A listed-not-accepted price is rejected. Notes, photos, addresses, and secrets are rejected and are not stored. Nothing is uploaded. This page is public.</p>
        <p>Saved on this browser: ${n} sale${n === 1 ? '' : 's'}. Limit ${G.LIMITS.maxRecords} rows and ${G.LIMITS.maxImportChars} characters.</p>
      </article>
      <label class="gv-k">CSV or JSON file<input id="gv-file" type="file" accept=".csv,.json,text/csv,application/json"></label>
      <label class="gv-k">Or paste CSV or JSON<textarea id="gv-paste"></textarea></label>
      <div class="gv-actions">
        <button type="button" id="gv-check">Check file</button>
        <button type="button" id="gv-save-import">Save accepted rows here</button>
        <button type="button" id="gv-template">Download blank CSV</button>
        <button type="button" id="gv-export">Download saved sales JSON</button>
        <button type="button" id="gv-export-csv">Download saved sales CSV</button>
        <button type="button" id="gv-backup">Download grading backup</button>
        <button type="button" id="gv-archive">Stop using saved sales</button>
      </div>
      <div id="gv-import-out">${preview ? previewHtml(preview) : '<p>Nothing checked yet.</p>'}</div>
    </div>`;
    document.getElementById('gv-file').onchange = () => {
      const f = document.getElementById('gv-file').files && document.getElementById('gv-file').files[0];
      if (!f) return;
      if (f.size > G.LIMITS.maxImportChars) {
        ui.importPreview = { error: 'That file is over the size limit. It was not read, and nothing was saved.' };
        paintImport();
        return;
      }
      const reader = new FileReader();
      reader.onload = () => { document.getElementById('gv-paste').value = String(reader.result || ''); };
      reader.readAsText(f);
    };
    document.getElementById('gv-check').onclick = () => {
      ui.importPreview = reviewImport(document.getElementById('gv-paste').value);
      paintImport();
    };
    document.getElementById('gv-save-import').onclick = () => {
      const preview = ui.importPreview;
      if (!preview || !preview.accepted.length) {
        ui.importPreview = { error: 'Check a file first. Nothing new was saved.' };
        paintImport();
        return;
      }
      const existing = storedImports();
      const merged = existing.concat(preview.accepted);
      if (merged.length > G.LIMITS.maxRecords) {
        ui.importPreview = { error: 'Saving those rows would pass the ' + G.LIMITS.maxRecords + ' row limit. Nothing was written.' };
        paintImport();
        return;
      }
      const err = saveJSON(LS_IMPORTS, { schema: 'fenton-grading-sales-v1', savedAt: todayISO(), rows: merged }, G.LIMITS.maxImportsBytes);
      ui.importPreview = err ? { error: err } : { saved: preview.accepted.length };
      paintImport();
    };
    document.getElementById('gv-template').onclick = () => download('grading-sales-template.csv', G.blankTemplateCsv(), 'text/csv');
    document.getElementById('gv-export').onclick = () => {
      const rows = storedImports();
      download('grading-sales.json', JSON.stringify({ schema: 'fenton-grading-sales-v1', sales: rows }, null, 2), 'application/json');
    };
    document.getElementById('gv-export-csv').onclick = () => download('grading-sales.csv', G.toCsv(storedImports()), 'text/csv');
    document.getElementById('gv-backup').onclick = () => {
      const backed = writeBackup();
      if (backed) { ui.importPreview = { error: backed }; paintImport(); return; }
      const bag = loadJSON(LS_BACKUP, null, G.LIMITS.maxBackupBytes);
      download('grading-backup.json', JSON.stringify(bag, null, 2), 'application/json');
    };
    document.getElementById('gv-archive').onclick = () => {
      if (storedSize(LS_IMPORTS) < 0 || storedSize(LS_IMPORTS) > G.LIMITS.maxImportsBytes) {
        ui.importPreview = { error: 'Saved sales were left unchanged.' };
        paintImport();
        return;
      }
      const backed = writeBackup();
      if (backed) { ui.importPreview = { error: backed + ' Saved sales are still in use.' }; paintImport(); return; }
      const err = saveJSON(LS_IMPORTS, { schema: 'fenton-grading-sales-v1', savedAt: todayISO(), rows: [], inactive: true }, G.LIMITS.maxImportsBytes);
      ui.importPreview = err ? { error: err } : { archived: true };
      paintImport();
    };
  }

  function reviewImport(text) {
    const parsed = G.parseImport(text);
    if (parsed.errors.length) return { accepted: [], rejected: [], warnings: [], parseErrors: parsed.errors };
    const accepted = [];
    const rejected = [];
    const warnings = [];
    parsed.records.forEach((rec, i) => {
      const id = String(rec.inventory_id || rec.card_id || rec.id || '').trim();
      const card = DATA.cards[id] || null;
      const res = G.validateSale(rec, card);
      res.warnings.forEach(w => warnings.push('Row ' + (i + 1) + ': ' + w));
      if (!res.ok) rejected.push({ i: i + 1, errors: res.errors });
      else accepted.push(res.sale);
    });
    const pool = G.dedupeSales(storedImports().concat(accepted));
    return { accepted, rejected, warnings, parseErrors: [], dropped: pool.dropped.length, kept: pool.kept.length };
  }
  function previewHtml(p) {
    if (p.error) return `<p class="gv-err">${esc(p.error)}</p>`;
    if (p.archived) return '<p class="gv-ok">Saved sales are no longer used. A copy remains in the grading backup. Nothing was deleted, and collection data was not changed.</p>';
    if (p.saved != null && !p.accepted) return `<p class="gv-ok">Saved ${p.saved} accepted row${p.saved === 1 ? '' : 's'} in this browser only.</p>`;
    const errs = (p.parseErrors || []).map(e => `<li>${esc(e)}</li>`).join('');
    const rej = (p.rejected || []).slice(0, 12).map(r => `<li>Row ${r.i}: ${esc(r.errors.join(' '))}</li>`).join('');
    const more = (p.rejected || []).length > 12 ? `<li>${(p.rejected.length - 12)} more rejected rows not listed.</li>` : '';
    const warn = (p.warnings || []).slice(0, 8).map(w => `<li>${esc(w)}</li>`).join('');
    return `<article class="box">
      <p>Accepted ${p.accepted.length}. Rejected ${(p.rejected || []).length}.</p>
      <p>After de-duplication with sales already saved, ${p.kept} distinct sales remain and ${p.dropped} duplicate reports are not counted twice.</p>
      ${errs ? `<ul>${errs}</ul>` : ''}
      ${rej ? `<ul>${rej}${more}</ul>` : ''}
      ${warn ? `<ul>${warn}</ul>` : ''}
    </article>`;
  }

  function download(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function paintMissing(id) {
    setTitle('Grading & value');
    APP.innerHTML = `<div class="gv"><h1>Card not in inventory</h1>${nav()}<p>No card id ${esc(id)} is in the collection file. Nothing was guessed.</p></div>`;
  }

  function paint() {
    if (!DATA || !APP) return;
    const section = ui.section;
    if (section === 'policy') return paintPolicy();
    if (section === 'assumptions') return paintAssumptions();
    if (section === 'import') return paintImport();
    if (section === 'sheet') return paintSheet();
    if (section && DATA.cards[section]) return paintDetail(DATA.cards[section]);
    if (section) return paintMissing(section);
    return paintList();
  }

  function render(app, data, section) {
    DATA = data;
    APP = app;
    ui.section = section || '';
    kick();
    paint();
  }
  kick();

  window.Grading = { render };
})();
