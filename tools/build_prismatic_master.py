#!/usr/bin/env python3
"""Build site/prismatic_master.json — the official 3x3 Prismatic Evolutions
master-set pocket list (every numbered card 1–180 plus every tcgcsv variant).

Reads a local tcgcsv dump (products.json + prices.json for group 23821).
Does not need the network. Run from the site folder:

  python3 tools/build_prismatic_master.py /path/to/products.json /path/to/prices.json

Layout rule: set order by collector number. A card's versions stay together
in this order: Regular (or Holo), Reverse Holo, Poke Ball, Master Ball.
If the whole group would not fit on the rest of a 9-pocket page, the leftover
pockets on that page stay empty and the group starts on the next page.
"""
import json, re, sys, collections, os, datetime

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(SITE, 'prismatic_master.json')

VARIANT_ORDER = ['regular', 'holo', 'reverse', 'pokeball', 'master']
VARIANT_LABEL = {
    'regular': 'Regular',
    'holo': 'Holo',
    'reverse': 'Reverse Holo',
    'pokeball': 'Poke Ball',
    'master': 'Master Ball',
}

def ext(p, name):
    for e in p.get('extendedData') or []:
        if e.get('name') == name or e.get('displayName') == name:
            return e.get('value')
    return None

def display_name(name):
    n = re.sub(r'\s*\((?:Poke Ball Pattern|Master Ball Pattern|Reverse Holo(?:foil)?)\)\s*$', '', name, flags=re.I)
    n = re.sub(r'\s*-\s*\d+/\d+\s*$', '', n).strip()
    return n

def img_size(url, size):
    return re.sub(r'_(?:200|400)w\.jpg$', f'_{size}.jpg', url or '') if url else ''

def classify_product(name):
    low = (name or '').lower()
    if 'master ball' in low:
        return 'master'
    if 'poke ball' in low or 'poké ball' in low:
        return 'pokeball'
    return 'base'

def main():
    prod_path, price_path = sys.argv[1], sys.argv[2]
    products = json.load(open(prod_path))['results']
    prices = json.load(open(price_path))['results']
    by_pid = collections.defaultdict(list)
    price_map = {}  # (pid, subtype) -> marketPrice
    for r in prices:
        by_pid[r['productId']].append(r['subTypeName'])
        price_map[(r['productId'], r['subTypeName'])] = r.get('marketPrice')

    # numbered singles only (skip sealed, code cards, cases)
    items = []  # (n, var_rank, pocket_dict_without_page)
    skipped = []
    for p in products:
        num = ext(p, 'Number')
        rarity = ext(p, 'Rarity') or ''
        name = p['name']
        pid = p['productId']
        if not num:
            skipped.append({'pid': pid, 'name': name, 'why': 'no card number (sealed or code card)'})
            continue
        m = re.match(r'(\d+)', str(num))
        if not m:
            skipped.append({'pid': pid, 'name': name, 'num': num, 'why': 'unparseable number'})
            continue
        n = int(m.group(1))
        if n < 1 or n > 180:
            skipped.append({'pid': pid, 'name': name, 'num': num, 'why': 'number outside 1-180'})
            continue
        kind = classify_product(name)
        subs = by_pid.get(pid, [])
        img = p.get('imageUrl') or ''
        url = p.get('url') or ''
        base = dict(pid=pid, name=display_name(name), product_name=name,
                    num=num, n=n, rarity=rarity, img=img_size(img, '200w') or img,
                    big=img_size(img, '400w') or img, url=url)

        if kind == 'base':
            # Standard printing: Normal for C/U, Holofoil for R and up.
            if 'Normal' in subs:
                items.append((n, 0, dict(base, variant='regular', variant_label=VARIANT_LABEL['regular'],
                                         subtype='Normal', price=price_map.get((pid, 'Normal')))))
            elif 'Holofoil' in subs:
                items.append((n, 1, dict(base, variant='holo', variant_label=VARIANT_LABEL['holo'],
                                         subtype='Holofoil', price=price_map.get((pid, 'Holofoil')))))
            else:
                skipped.append({'pid': pid, 'name': name, 'num': num, 'subs': subs, 'why': 'base product with no Normal or Holofoil SKU'})
            if 'Reverse Holofoil' in subs:
                items.append((n, 2, dict(base, variant='reverse', variant_label=VARIANT_LABEL['reverse'],
                                         subtype='Reverse Holofoil', price=price_map.get((pid, 'Reverse Holofoil')))))
        elif kind == 'pokeball':
            items.append((n, 3, dict(base, variant='pokeball', variant_label=VARIANT_LABEL['pokeball'],
                                     subtype='Holofoil' if 'Holofoil' in subs else (subs[0] if subs else ''),
                                     price=price_map.get((pid, 'Holofoil')) or price_map.get((pid, subs[0] if subs else '')))))
        elif kind == 'master':
            items.append((n, 4, dict(base, variant='master', variant_label=VARIANT_LABEL['master'],
                                     subtype='Holofoil' if 'Holofoil' in subs else (subs[0] if subs else ''),
                                     price=price_map.get((pid, 'Holofoil')) or price_map.get((pid, subs[0] if subs else '')))))

    items.sort(key=lambda x: (x[0], x[1], x[2]['pid']))

    # Group by collector number (all versions of one card stay together)
    groups = []
    cur_n, cur = None, []
    for n, rank, pocket in items:
        if cur_n is None:
            cur_n, cur = n, [pocket]
        elif n == cur_n:
            cur.append(pocket)
        else:
            groups.append(cur)
            cur_n, cur = n, [pocket]
    if cur:
        groups.append(cur)

    # Paginate: 9 pockets, don't split a group if it fits on a fresh page
    pages, current = [], []
    empty_kept = 0
    for group in groups:
        if len(group) <= 9 and len(current) + len(group) > 9:
            empty_kept += 9 - len(current)
            pages.append(current + [None] * (9 - len(current)))
            current = []
        for pocket in group:
            current.append(pocket)
            if len(current) == 9:
                pages.append(current)
                current = []
    if current:
        empty_kept += 9 - len(current)
        pages.append(current + [None] * (9 - len(current)))

    # Stamp page / pocket numbers (1-based)
    pockets = []
    for i, page in enumerate(pages, 1):
        for j, slot in enumerate(page, 1):
            if slot is None:
                continue
            slot = dict(slot, page=i, pocket=j)
            pockets.append(slot)
            page[j - 1] = slot

    # counts
    vcounts = collections.Counter(p['variant'] for p in pockets)
    numbers = sorted({p['n'] for p in pockets})
    missing_nums = [i for i in range(1, 181) if i not in numbers]

    out = dict(
        source=dict(
            groupId=23821,
            groupName='SV: Prismatic Evolutions',
            abbreviation='PRE',
            products=os.path.abspath(prod_path),
            prices=os.path.abspath(price_path),
            built=datetime.datetime.now().strftime('%Y-%m-%d %H:%M ET'),
            note='Variants come from tcgcsv.com product/sku data: Reverse Holofoil is a SKU (subTypeName) of the base product; Poke Ball and Master Ball are separate products.'),
        rule='Set order by collector number 001–180. Each card’s versions stay together in this order: Regular or Holo, Reverse Holo, Poke Ball, Master Ball (only versions that exist). If a card’s whole group will not fit in the pockets left on a page, those leftover pockets stay empty and the group starts on the next page.',
        totals=dict(
            pockets=len(pockets),
            pages=len(pages),
            empty_pockets=empty_kept,
            numbers=len(numbers),
            missing_numbers=missing_nums,
            by_variant={k: vcounts[k] for k in VARIANT_ORDER if vcounts[k]},
        ),
        variants=[{'id': k, 'label': VARIANT_LABEL[k], 'size': vcounts[k]} for k in VARIANT_ORDER if vcounts[k]],
        pockets=pockets,
        skipped_unnumbered=len(skipped),
    )
    with open(OUT, 'w') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)
        fh.write('\n')

    print(f'wrote {OUT}')
    print(f"  {len(pockets)} pockets on {len(pages)} pages ({empty_kept} empty pockets left on purpose)")
    print(f"  numbers {min(numbers)}-{max(numbers)} unique={len(numbers)} missing={missing_nums}")
    print(f"  by variant: {dict(vcounts)}")
    # show leftover empties by page
    print('  pages with empty leftover pockets:')
    for i, page in enumerate(pages, 1):
        empties = [j + 1 for j, s in enumerate(page) if s is None]
        if empties:
            first = next((s['name'] + ' ' + s['variant_label'] for s in page if s), '')
            last = next((s['name'] + ' ' + s['variant_label'] for s in reversed(page) if s), '')
            print(f'    page {i}: empty pockets {empties}  (from {first} … {last})')
    return 0

if __name__ == '__main__':
    sys.exit(main())
