#!/usr/bin/env python3
"""Build /workspace/site/data.json for the Fenton Family Pokémon website.

Inputs (all on the box, nothing paid, no network needed):
  /workspace/collection/collection.json        cards (kept in sync with the Google Sheet 'All Cards' tab by the daily routine)
  /workspace/collection/price_history/*.csv    daily price snapshots (value-over-time chart)
  /workspace/site/sheet_cache/*.json           small copies of sheet tabs that rarely change
                                               (Opened Products, Sets & Binders, PSA settings) - see README
Usage:  python3 /workspace/site/build_data.py [--check]
  --check  also assert the totals the sheet shows ($ value, cards) and print a summary.
"""
import json, os, re, csv, glob, sys, datetime, collections

SITE = os.path.dirname(os.path.abspath(__file__))
COLL = '/workspace/collection/collection.json'
HIST = '/workspace/collection/price_history'
CACHE = os.path.join(SITE, 'sheet_cache')

def load(name): return json.load(open(os.path.join(CACHE, name + '.json')))

def num(x):
    try: return float(x)
    except (TypeError, ValueError): return None

def img(url, size='200w'):
    m = re.search(r'/product/(\d+)', url or '')
    return f'https://tcgplayer-cdn.tcgplayer.com/product/{m.group(1)}_{size}.jpg' if m else ''

def numkey(n):
    m = re.match(r'(\d+)', str(n or ''))
    return (0, int(m.group(1)), str(n)) if m else (1, 0, str(n))

def main():
    data = json.load(open(COLL)); rows = data['cards']
    S = load('settings'); sets_cfg = load('sets'); binders_cfg = load('binders'); opened = load('opened_products')

    # ---------- one entry per distinct card (Card ID) ----------
    cards = collections.OrderedDict()
    for i, r in enumerate(rows):
        cid = r['card_id']
        if cid not in cards:
            price = num(r.get('market_price'))
            base = num(r.get('baseline_30d_price'))
            # trend: same rule as sheet col AD
            if base is None or price is None: trend, chg, pct = 'new', None, None
            else:
                chg = round(price - base, 2); pct = (price / base - 1) if base else None
                if abs(chg) < S['trend_min_dollars'] or (pct is not None and abs(pct) <= S['trend_pct']): trend = 'same'
                else: trend = 'up' if chg > 0 else 'down'
            # PSA 10
            psa = num(r.get('psa10_price')); gain = None; verdict = None; tier = None
            m = re.search(r'(\d+)\s+PSA 10 sale', r.get('psa10_asof') or ''); sales = int(m.group(1)) if m else 0
            if psa is not None and price is not None:
                fee = None
                for lo, f, label in S['psa_tiers']:
                    if psa >= lo: fee, tier = f, label
                if fee is not None:
                    gain = round(psa - price - fee - S['return_ship_per_card'], 2)
                    if gain >= S['gem_min_gain'] and psa >= S['gem_min_multiple'] * price and sales >= S['gem_min_sales']: verdict = 'gem'
                    elif gain > 0: verdict = 'maybe'
                    else: verdict = 'no'
            cards[cid] = dict(id=cid, name=r['name'], num=r.get('number') or '', set=r.get('set_name') or '',
                code=r.get('set_code') or '', rarity=r.get('rarity') or '', price=price,
                img=r.get('image_url') or img(r.get('tcgplayer_url')), big=img(r.get('tcgplayer_url'), '400w') or r.get('image_url'),
                url=r.get('tcgplayer_url') or '', qty=0, base=base, base_date=r.get('baseline_30d_date'),
                chg=chg, pct=None if pct is None else round(pct, 4), trend=trend,
                psa=psa, psa_text=None if psa is not None else (r.get('psa10_price') or None), psa_sales=sales,
                psa_url=r.get('psa10_url') or '', psa_asof=(r.get('psa10_asof') or '')[:10], gain=gain, verdict=verdict, tier=tier,
                where=[], row=i + 2)
        c = cards[cid]; q = r.get('owned_qty') or 0; c['qty'] += q
        if q and r.get('binder'):
            w = r['binder'] + (f" · Page {r['page']} · Pocket {r['slot_num']}" if r.get('page') else '')
            c['where'].append(w)
    cl = list(cards.values())

    # ---------- binders ----------
    binders = []
    for b in binders_cfg:
        brows = [r for r in rows if r.get('binder') == b['name']]
        pages = collections.defaultdict(lambda: [None] * 9)
        if any(r.get('page') for r in brows):
            for r in brows:
                if r.get('page') and r.get('slot_num'):
                    pages[int(r['page'])][int(r['slot_num']) - 1] = dict(id=r['card_id'], have=bool(r.get('owned_qty')))
            npages = max([b.get('pages') or 0] + list(pages))
            plist = [pages[p] if p in pages else [None] * 9 for p in range(1, npages + 1)]
        else:   # no pages (loose pulls): lay them out 9 per page in list order
            plist = []
            if b.get('group_copies'):   # one tile per card, with a copy count (e.g. 30th Bulk)
                grp = collections.OrderedDict()
                for r in brows:
                    g = grp.setdefault(r['card_id'], dict(id=r['card_id'], have=False, n=0))
                    g['n'] += r.get('owned_qty') or 0; g['have'] = g['have'] or bool(r.get('owned_qty'))
                items = list(grp.values())
                if b.get('sort') == 'number':   # main set by collector #, then Classic Collection etc.
                    first = {r['card_id']: r for r in reversed(brows)}
                    items.sort(key=lambda g: (first[g['id']].get('set_name') != '30th Celebration', numkey(first[g['id']].get('number'))))
            else:
                items = [dict(id=r['card_id'], have=bool(r.get('owned_qty'))) for r in brows]
            for k in range(0, len(items), 9):
                chunk = items[k:k + 9]
                plist.append(chunk + [None] * (9 - len(chunk)))
        owned = [r for r in brows if r.get('owned_qty')]
        binders.append(dict(name=b['name'], emoji=b['emoji'], desc=b['desc'], loose=not any(r.get('page') for r in brows),
            cards=sum(r['owned_qty'] for r in owned), missing=sum(1 for r in brows if not r.get('owned_qty')),
            value=round(sum((num(r['market_price']) or 0) * r['owned_qty'] for r in owned), 2), pages=plist,
            grouped=bool(b.get('group_copies')), distinct=len({r['card_id'] for r in owned})))

    # ---------- sets ----------
    sets = []
    for s in sets_cfg:
        sc = [c for c in cl if c['set'] == s['name']]   # binder order for sets like Classic Collection
        if s.get('order') != 'binder': sc.sort(key=lambda c: numkey(c['num']))
        if not sc: continue
        have = [c for c in sc if c['qty'] > 0]
        size = s.get('size') or len(sc)
        value_all = round(sum((c['price'] or 0) * c['qty'] for c in sc), 2)
        sets.append(dict(name=s['name'], code=s['code'], size=size, have=len(have), wishlist=s['wishlist'],
            checklist=bool(s.get('size')), released=s.get('released') or '', value=value_all,
            to_finish=round(sum(c['price'] or 0 for c in sc if c['qty'] == 0), 2), cards=[c['id'] for c in sc]))

    # ---------- totals / trend ----------
    owned = [c for c in cl if c['qty'] > 0]
    value = round(sum((num(r['market_price']) or 0) * (r.get('owned_qty') or 0) for r in rows), 2)
    value_base = round(sum((num(r.get('baseline_30d_price')) or num(r['market_price']) or 0) * (r.get('owned_qty') or 0) for r in rows), 2)
    tc = collections.Counter(c['trend'] for c in owned)
    base_dates = collections.Counter(c['base_date'] for c in owned if c['base_date'])

    # value over time + per-card price history from daily snapshots
    # Collection value = today's owned quantities × each day's prices (forward-fill a card's last known price).
    qty = {c['id']: c['qty'] for c in owned}
    day_prices = {}  # date -> {card_id: price}
    for f in sorted(glob.glob(os.path.join(HIST, '20??-??-??.csv'))):
        prices = {}
        with open(f) as fh:
            for r in csv.DictReader(fh):
                p = num(r.get('market_price'))
                if p is not None: prices[r['api_id']] = p
        if prices: day_prices[os.path.basename(f)[:10]] = prices
    dates = sorted(day_prices)
    # ensure today is the last point with current market prices
    today = datetime.date.today().isoformat()
    if not dates or dates[-1] != today:
        today_prices = {c['id']: c['price'] for c in cl if c['price'] is not None}
        day_prices[today] = today_prices; dates = sorted(day_prices)
    last = {}
    history = []
    ph = {c['id']: [] for c in cl}  # parallel to dates; None before a card's first price
    for d in dates:
        prices = day_prices[d]
        for cid, p in prices.items(): last[cid] = p
        # collection value for this day
        history.append([d, round(sum(last.get(k, cards[k]['price'] or 0) * q for k, q in qty.items()), 2)])
        for c in cl:
            cid = c['id']
            if cid in prices: ph[cid].append(round(prices[cid], 4))
            elif cid in last: ph[cid].append(round(last[cid], 4))
            else: ph[cid].append(None)

    # 30th Master Set = 30th Celebration main + Classic Collection (sizes from sets.json)
    mparts = [s for s in sets if s['name'] in ('30th Celebration', 'Classic Collection')]
    master = dict(name='30th Master Set', have=sum(s['have'] for s in mparts), size=sum(s['size'] for s in mparts),
        to_finish=round(sum(s['to_finish'] for s in mparts), 2),
        parts=[dict(name=s['name'], short='Main set' if s['name'] == '30th Celebration' else 'Classic Collection',
                    have=s['have'], size=s['size'], to_finish=s['to_finish'], index=sets.index(s)) for s in mparts])

    wish_sets = {s['name'] for s in sets_cfg if s['wishlist']}
    wishlist = sorted([c['id'] for c in cl if c['qty'] == 0 and c['set'] in wish_sets], key=lambda k: cards[k]['price'] or 0)

    asof = data.get('price_source') or ''
    m = re.match(r'(\d{4}-\d\d-\d\d)', asof)
    out = dict(
        generated=datetime.datetime.now().strftime('%Y-%m-%d %H:%M ET'),
        prices_asof=m.group(1) if m else asof, prices_note='TCGplayer market price (via tcgcsv.com)',
        totals=dict(value=value, value_30d=value_base, cards=sum(c['qty'] for c in owned), different=len(owned),
            extras_value=round(value - sum(c['price'] or 0 for c in owned), 2),
            wish_cost=round(sum(cards[k]['price'] or 0 for k in wishlist), 2), wish_count=len(wishlist),
            packs=sum(o['qty'] * (o['packs_each'] or 0) for o in opened), products=sum(o['qty'] for o in opened),
            up=tc['up'], down=tc['down'], same=tc['same'], new=tc['new'],
            base_date=base_dates.most_common(1)[0][0] if base_dates else None),
        settings=dict(trend_pct=S['trend_pct'], trend_min=S['trend_min_dollars'], window=S['trend_window_days'],
            psa_tiers=S['psa_tiers'], ship=round(S['return_ship_per_card'], 2), gem_gain=S['gem_min_gain'],
            gem_mult=S['gem_min_multiple'], gem_sales=S['gem_min_sales']),
        dates=dates, history=history, ph=ph, master=master, binders=binders, sets=sets, wishlist=wishlist,
        opened=[dict(o, img=img(o.get('url'))) for o in opened],
        cards={c['id']: c for c in cl})
    with open(os.path.join(SITE, 'data.json'), 'w') as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(',', ':'))
    t = out['totals']
    print(f"data.json: {len(cl)} cards, value ${t['value']:,.2f} ({t['cards']} cards, {t['different']} different), "
          f"30d ago ${t['value_30d']:,.2f}, up {t['up']} / down {t['down']} / same {t['same']} / new {t['new']}, "
          f"wishlist {t['wish_count']} ${t['wish_cost']:,.2f}, packs {t['packs']}, prices {out['prices_asof']}")
    for s in sets: print(f"  {s['name']}: {s['have']}/{s['size']}")
    print(f"  {master['name']}: {master['have']}/{master['size']} ({master['have']/master['size']:.0%}), ${master['to_finish']:,.2f} to finish")
    print(f"  history: {len(dates)} days ({dates[0]} → {dates[-1]}), {sum(1 for a in ph.values() if any(x is not None for x in a))} cards with prices")
    if '--check' in sys.argv:
        assert t['cards'] == sum(r.get('owned_qty') or 0 for r in rows)
        print('check ok')

if __name__ == '__main__':
    main()
