#!/usr/bin/env python3
"""Build site/30th_celebration_master.json — the official 3x3 30th Celebration
master-set pocket list (numbered cards 001–158 plus the 3 RGB Rare Mews).

Reads a local tcgcsv dump (products.json + prices.json for group 24722).
Does not need the network. Run from the site folder:

  python3 tools/build_30th_celebration_master.py /path/to/products.json /path/to/prices.json

Layout rule: the 158 main cards (all Holofoil; official press says the
expansion is all foil) come first, in collector number order 001–158,
filling every pocket with no gaps. The 3 official RGB Rare Mews follow
on a fresh page. Leftover empty pockets appear only at the end of a
section. Classic Collection is a separate tcgcsv group and is not in
this binder.
"""
import json, re, sys, collections, os, datetime

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(SITE, '30th_celebration_master.json')

VARIANT_ORDER = ['holo', 'rgb']
VARIANT_LABEL = {
    'holo': 'Holo',
    'rgb': 'RGB Rare',
}

def ext(p, name):
    for e in p.get('extendedData') or []:
        if e.get('name') == name or e.get('displayName') == name:
            return e.get('value')
    return None

def display_name(name):
    n = re.sub(r'\s*-\s*(?:\d+/\d+|[RGB]/RGB)\s*$', '', name, flags=re.I).strip()
    return n

def img_size(url, size):
    return re.sub(r'_(?:200|400)w\.jpg$', f'_{size}.jpg', url or '') if url else ''

def rgb_rank(num):
    # Family checklist order: Mew (B), Mew (G), Mew (R)
    return {'B/RGB': 0, 'G/RGB': 1, 'R/RGB': 2}.get(str(num).upper(), 9)

def main():
    prod_path, price_path = sys.argv[1], sys.argv[2]
    products = json.load(open(prod_path))['results']
    prices = json.load(open(price_path))['results']
    by_pid = collections.defaultdict(list)
    price_map = {}
    for r in prices:
        by_pid[r['productId']].append(r['subTypeName'])
        price_map[(r['productId'], r['subTypeName'])] = r.get('marketPrice')

    items = []
    skipped = []
    for p in products:
        num = ext(p, 'Number')
        rarity = ext(p, 'Rarity') or ''
        name = p['name']
        pid = p['productId']
        if not num:
            skipped.append({'pid': pid, 'name': name, 'why': 'no card number (sealed or code card)'})
            continue
        subs = by_pid.get(pid, [])
        img = p.get('imageUrl') or ''
        url = p.get('url') or ''
        base = dict(pid=pid, name=display_name(name), product_name=name,
                    num=num, rarity=rarity, img=img_size(img, '200w') or img,
                    big=img_size(img, '400w') or img, url=url)
        m = re.match(r'(\d+)', str(num))
        if m:
            n = int(m.group(1))
            if n < 1 or n > 158:
                skipped.append({'pid': pid, 'name': name, 'num': num, 'why': 'number outside 1-158'})
                continue
            if 'Holofoil' in subs:
                items.append(('main', n, 0, dict(base, n=n, variant='holo',
                                                 variant_label=VARIANT_LABEL['holo'],
                                                 subtype='Holofoil',
                                                 price=price_map.get((pid, 'Holofoil')))))
            elif 'Normal' in subs:
                items.append(('main', n, 0, dict(base, n=n, variant='regular',
                                                 variant_label='Regular',
                                                 subtype='Normal',
                                                 price=price_map.get((pid, 'Normal')))))
            else:
                skipped.append({'pid': pid, 'name': name, 'num': num, 'subs': subs,
                                'why': 'numbered product with no Normal or Holofoil SKU'})
        elif re.match(r'^[RGB]/RGB$', str(num), re.I):
            items.append(('rgb', rgb_rank(num), 0, dict(base, n=0, variant='rgb',
                                                        variant_label=VARIANT_LABEL['rgb'],
                                                        subtype='Holofoil' if 'Holofoil' in subs else (subs[0] if subs else ''),
                                                        price=price_map.get((pid, 'Holofoil')) or price_map.get((pid, subs[0] if subs else '')))))
        else:
            skipped.append({'pid': pid, 'name': name, 'num': num, 'why': 'unparseable number'})

    SECTION_DEFS = [
        ('main', 'Main cards', 'main'),
        ('rgb', 'RGB Rare', 'rgb'),
    ]
    pages, empty_kept, sections = [], 0, []
    for sid, label, kind in SECTION_DEFS:
        sec_items = [dict(p, section=sid, section_label=label)
                     for k, sort_a, sort_b, p in items if k == kind]
        sec_items.sort(key=lambda p: (p['n'], rgb_rank(p['num']) if p['variant'] == 'rgb' else 0, p['pid']))
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

    pockets = []
    for i, page in enumerate(pages, 1):
        for j, slot in enumerate(page, 1):
            if slot is None:
                continue
            slot = dict(slot, page=i, pocket=j)
            pockets.append(slot)
            page[j - 1] = slot

    vcounts = collections.Counter(p['variant'] for p in pockets)
    numbers = sorted({p['n'] for p in pockets if p['n']})
    missing_nums = [i for i in range(1, 159) if i not in numbers]

    out = dict(
        name='30th Celebration',
        emoji='🎉',
        slug='30th-celebration',
        guide='30c',
        code='30C',
        source=dict(
            groupId=24722,
            groupName='ME: 30th Celebration',
            abbreviation='30C',
            official='https://www.pokemon.com/us/pokemon-tcg/30th-celebration',
            products=os.path.abspath(prod_path),
            prices=os.path.abspath(price_path),
            built=datetime.datetime.now().strftime('%Y-%m-%d %H:%M ET'),
            note='Official 30th Celebration expansion (tcgcsv group 24722). All 158 numbered cards have a single Holofoil SKU (no Reverse Holo or ball-pattern products). The 3 RGB Rare Mews are official cards in the same group. Classic Collection is tcgcsv group 24837 and is not in this binder.'),
        rule='The first pages are the official main cards, in number order from 001 to 158, with no gaps. The 3 RGB Rare Mew cards start on a new page at the back. A few leftover pockets at the end of a section stay empty on purpose. Classic Collection, Mega Evolution Energies, and MEP promos stay in the 30th Binder 1 inventory pages, not in this official set layout.',
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
    print(f"  numbers {min(numbers) if numbers else '-'}–{max(numbers) if numbers else '-'} unique={len(numbers)} missing={missing_nums}")
    print(f"  by variant: {dict(vcounts)}")
    print('  sections:')
    for s in sections:
        print(f"    {s['label']}: pages {s['start_page']}–{s['end_page']} ({s['size']} cards)")
    print('  pages with empty leftover pockets:')
    for i, page in enumerate(pages, 1):
        empties = [j + 1 for j, s in enumerate(page) if s is None]
        if empties:
            first = next((s['name'] + ' ' + s['num'] for s in page if s), '')
            last = next((s['name'] + ' ' + s['num'] for s in reversed(page) if s), '')
            print(f'    page {i}: empty pockets {empties}  (from {first} … {last})')
    return 0

if __name__ == '__main__':
    sys.exit(main())
