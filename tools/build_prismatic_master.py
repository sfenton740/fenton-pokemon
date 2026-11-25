#!/usr/bin/env python3
"""Build site/prismatic_master.json — the official 3x3 Prismatic Evolutions
master-set pocket list (every numbered card 1–180 plus every tcgcsv variant).

Reads a local tcgcsv dump (products.json + prices.json for group 23821).
Does not need the network. Run from the site folder:

  python3 tools/build_prismatic_master.py /path/to/products.json /path/to/prices.json

Layout rule: the 180 base cards (Regular or Holo) come first, in collector
number order 001–180, filling every pocket with no gaps. Reverse Holos,
Poke Ball versions, and Master Ball versions follow at the end of the binder,
each in number order, each starting on a fresh page. Leftover empty pockets
appear only at the end of a section.
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

    # Four binder sections. Main cards fill consecutively with no gaps;
    # each later section starts on a fresh page.
    SECTION_DEFS = [
        ('main', 'Main cards', ('regular', 'holo')),
        ('reverse', 'Reverse Holo', ('reverse',)),
        ('pokeball', 'Poke Ball', ('pokeball',)),
        ('master', 'Master Ball', ('master',)),
    ]
    pages, empty_kept, sections = [], 0, []
    for sid, label, variants in SECTION_DEFS:
        sec_items = [dict(p, section=sid, section_label=label)
                     for n, rank, p in items if p['variant'] in variants]
        sec_items.sort(key=lambda p: (p['n'], p['pid']))
        if not sec_items:
            continue
        start = len(pages) + 1
        current = []
        for pocket in sec_items:
            current.append(pocket)
            if len(current) == 9:
                pages.append(current)
                current = []
        if current:
            empty_kept += 9 - len(current)
            pages.append(current + [None] * (9 - len(current)))
        sections.append(dict(id=sid, label=label, start_page=start,
                             end_page=len(pages), size=len(sec_items)))

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
        rule='The first pages are the main cards, in number order from 001 to 180, with no gaps. After that come the other versions, each in their own section: Reverse Holo, then Poke Ball, then Master Ball, all in number order. Each section starts on a new page, so a few pockets at the end of a section stay empty.',
        totals=dict(
            pockets=len(pockets),
            pages=len(pages),
            empty_pockets=empty_kept,
            numbers=len(numbers),
            missing_numbers=missing_nums,
            by_variant={k: vcounts[k] for k in VARIANT_ORDER if vcounts[k]},
        ),
        variants=[{'id': k, 'label': VARIANT_LABEL[k], 'size': vcounts[k]} for k in VARIANT_ORDER if vcounts[k]],
        sections=sections,
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
    print('  sections:')
    for s in sections:
        print(f"    {s['label']}: pages {s['start_page']}–{s['end_page']} ({s['size']} cards)")
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
