/* Set Guides: kid-friendly pages about each set in the family collection.
   Facts come from Pokémon official pages/press, the family's tcgcsv master lists, and the site data.
   Do not invent prices. */
(function (w) {
  'use strict';

  const IMG = (pid, w) => `https://tcgplayer-cdn.tcgplayer.com/product/${pid}_${w || 400}w.jpg`;

  const LOOK = [
    { ico: '🏷️', title: 'Set code', text: 'At the bottom of the card, look for letters like PRE, DLR, or PBL next to the number.' },
    { ico: '🔢', title: 'Number', text: 'The number looks like 093/131. If the first number is bigger than the second, it is a secret rare.' },
    { ico: '✨', title: 'Foil pattern', text: 'Look in the text box under the picture. Is it smooth, sparkly all over, one big Poké Ball, or a ball with an M?' },
    { ico: '⭐', title: 'Rarity stamp', text: 'A circle is Common, a diamond is Uncommon, and a star is Rare. Fancy art cards use special stamps too.' }
  ];

  const GUIDES = [
    {
      slug: 'prismatic',
      name: 'Prismatic Evolutions',
      setName: 'Prismatic Evolutions',
      code: 'PRE',
      emoji: '🌈',
      series: 'Scarlet & Violet',
      released: 'January 17, 2025',
      official: 'https://www.pokemon.com/us/pokemon-tcg/scarlet-violet-prismatic-evolutions',
      short: 'Eevee and its Evolutions, plus Poké Ball and Master Ball pattern cards.',
      intro: 'This set is a rainbow of Eevee and its eight Evolutions, shown as Stellar Tera Pokémon ex. Hidden patterns are part of the fun: some cards have a Poké Ball or a Master Ball in the background.',
      unique: [
        'It is a Scarlet & Violet special set with 180 numbered cards: 001 to 131 in the main set, then secret rares 132 to 180.',
        'The official English set code is PRE. The stamp often reads PRE EN.',
        'There are two special pattern versions, with a Poké Ball or a Master Ball etched in the background, plus the usual Regular, Holofoil, and Reverse Holofoil cards.',
        'Our master binder has 447 pockets: 180 main cards, 100 Reverse Holos, 100 Poké Ball cards, and 67 Master Ball cards.'
      ],
      variants: [
        { ico: '⬜', name: 'Regular', text: 'The text box is smooth and flat. No big ball and no sparkly all-over pattern.' },
        { ico: '🌟', name: 'Holofoil', text: 'Rares often have a rainbow shine on the picture frame. The text box stays mostly matte and flat. There is still no big ball.' },
        { ico: '✨', name: 'Reverse Holofoil', text: 'The text box is sparkly all over. On Trainer cards, that sparkle can look like lots of little Poké Balls and a starburst. That is still Reverse, not the special Poké Ball version.' },
        { ico: '⚪', name: 'Poké Ball pattern', text: 'Look for one large classic Poké Ball behind the rules text, with a line through the middle and a button. The rest of the text box is mostly plain.' },
        { ico: '🟣', name: 'Master Ball pattern', text: 'Look for one large ball with an M on it. In this set, Master Ball versions are for non-ex Pokémon. Trainer cards do not have a Master Ball version.' }
      ],
      variantNote: 'Future or Ancient Trainer cards can have printed dots or earth texture on the right side. That is part of the art, not foil. ACE SPEC cards come as Holofoil only.',
      examples: [
        { pid: 610448, cap: 'Amarys Regular — smooth text box, no ball' },
        { pid: 610604, cap: 'Amarys Poké Ball — one big ball behind the words' },
        { pid: 610641, cap: 'Leafeon Master Ball — one big ball with an M' }
      ],
      rarity: [
        'Common is a circle, Uncommon is a diamond, and Rare is a star.',
        'Numbers 001/131 through 131/131 are the main set. Numbers 132/131 and up are secret rares, like Ultra Rares and Special Illustration Rares.',
        'ACE SPEC cards have a bright ACE SPEC label. They are a special kind of rare item card.'
      ],
      chase: [
        'Eevee and its eight Evolutions as Stellar Tera Pokémon ex, especially the Special Illustration Rares.',
        'Master Ball pattern cards, especially the Eeveelutions.',
        'ACE SPEC items, and other secret rares with numbers over 131/131.'
      ],
      look: LOOK,
      team: '⭐ Star Trainer Harper can hunt for the big Poké Ball or the M on a Master Ball. 🔥 Ace Trainer Carter can check the PRE set code and the number, and tell Reverse sparkle from one big ball.'
    },
    {
      slug: 'delta-reign',
      name: 'Delta Reign',
      setName: 'Delta Reign',
      code: 'DLR',
      emoji: '⚔️',
      series: 'Mega Evolution',
      released: 'November 6, 2026',
      official: 'https://www.pokemon.com/us/pokemon-tcg/mega-evolution-delta-reign',
      short: 'Mega Rayquaza ex, more Mega Evolution Pokémon ex, and Legendary Stadiums that come in two halves.',
      intro: 'A roar from the sky means Mega Rayquaza ex has arrived. This Mega Evolution set also brings Mega Golurk ex, Mega Malamar ex, and Mega Golisopod ex, plus a new way to play Stadiums.',
      unique: [
        'It is Mega Evolution set ME06. The family set code is DLR. Official pages say it has over 135 cards. Our master binder lists 141 numbered cards: 001 to 103, then secret rares 104 to 141.',
        'Mega Evolution Pokémon ex are strong, but if one is Knocked Out, the other player takes 3 Prize cards.',
        'Legendary Stadiums are a new idea: two Stadium cards (a Left half and a Right half) are put together and count as one Stadium. They make one big picture. If a booster pack has a Legendary Stadium, it includes both halves.',
        'This set does not use Poké Ball or Master Ball patterns. The versions to watch are Regular, Holofoil, and Reverse Holofoil.'
      ],
      variants: [
        { ico: '⬜', name: 'Regular', text: 'The text box is smooth and flat, with no all-over sparkle.' },
        { ico: '🌟', name: 'Holofoil', text: 'Rares, Pokémon ex, and Mega Evolution Pokémon ex often have a shiny rainbow frame. The text box stays mostly flat.' },
        { ico: '✨', name: 'Reverse Holofoil', text: 'The text box has a sparkly pattern all over. There is no big Poké Ball or Master Ball watermark in this set.' }
      ],
      rarity: [
        'Common is a circle, Uncommon is a diamond, and Rare is a star. Mega Evolution Pokémon ex and other special cards use fancier stamps.',
        'Numbers 001/103 through 103/103 are the main set. Numbers 104/103 and up are secret rares, like Illustration Rares, Ultra Rares, and Special Illustration Rares.'
      ],
      chase: [
        'Mega Rayquaza ex, Mega Golurk ex, Mega Malamar ex, and Mega Golisopod ex.',
        'The Legendary Stadium pairs, including both halves of each picture.',
        'Illustration Rares and Special Illustration Rares with numbers over 103/103.'
      ],
      look: LOOK.map((x, i) => i === 0 ? { ...x, text: 'At the bottom of the card, look for the DLR or Mega Evolution set stamp next to the number.' } : x),
      team: '⭐ Star Trainer Harper can look for Mega Evolution Pokémon and the two-part Stadium pictures. 🔥 Ace Trainer Carter can match Left and Right Stadium halves and check whether the text box is smooth or reverse sparkly.'
    },
    {
      slug: 'pitch-black',
      name: 'Pitch Black',
      setName: 'Pitch Black',
      code: 'PBL',
      emoji: '🌑',
      series: 'Mega Evolution',
      released: 'July 17, 2026',
      official: 'https://www.pokemon.com/us/pokemon-tcg/mega-evolution-pitch-black',
      short: 'Mega Darkrai ex, Mega Zeraora ex, and more Mega Evolution Pokémon ex in a dark, stormy set.',
      intro: 'City lights fade as Mega Darkrai ex arrives, and Mega Zeraora ex answers with lightning. This Mega Evolution set is full of powerful Mega Evolution Pokémon ex from the shadows and the storm.',
      unique: [
        'It is Mega Evolution set ME05. The official English set code is PBL. Official pages say it has over 115 cards. Our master binder lists 120 numbered cards: 001 to 084, then secret rares 085 to 120.',
        'Mega Evolution Pokémon ex in this series have high HP and strong attacks. If one is Knocked Out, the other player takes 3 Prize cards.',
        'The official checklist includes Mega Darkrai ex, Mega Zeraora ex, Mega Chandelure ex, Mega Excadrill ex, Mega Slowbro ex, and Mega Delphox ex.',
        'This set does not use Poké Ball or Master Ball patterns. Look for Regular, Holofoil, and Reverse Holofoil. Commons, Uncommons, and Rares also come in Reverse Holofoil.'
      ],
      variants: [
        { ico: '⬜', name: 'Regular', text: 'The text box is smooth and flat, with no all-over sparkle.' },
        { ico: '🌟', name: 'Holofoil', text: 'Rares, Pokémon ex, and Mega Evolution Pokémon ex often have a shiny rainbow frame. The text box stays mostly flat.' },
        { ico: '✨', name: 'Reverse Holofoil', text: 'The text box has a sparkly pattern all over. There is no big Poké Ball or Master Ball watermark in this set.' }
      ],
      rarity: [
        'Common is a circle, Uncommon is a diamond, and Rare is a star.',
        'The official checklist also uses Double Rare, Ultra Rare, Illustration Rare, Special Illustration Rare, and Mega Hyper Rare stamps.',
        'Numbers 001/084 through 084/084 are the main set. Numbers 085/084 and up are secret rares.'
      ],
      chase: [
        'Mega Darkrai ex and Mega Zeraora ex, plus Mega Chandelure ex, Mega Excadrill ex, Mega Slowbro ex, and Mega Delphox ex.',
        'Illustration Rares, Special Illustration Rares, and Mega Hyper Rares with numbers over 084/084.'
      ],
      look: LOOK.map((x, i) => i === 0 ? { ...x, text: 'At the bottom of the card, look for the PBL set stamp next to the number.' } : x),
      team: '⭐ Star Trainer Harper can look for Mega Evolution Pokémon and shiny rainbow frames. 🔥 Ace Trainer Carter can check the PBL stamp and whether a number like 101/084 is a secret rare.'
    },
    {
      slug: '30c',
      name: '30th Celebration',
      setName: '30th Celebration',
      code: '30C',
      emoji: '🎉',
      series: 'Mega Evolution',
      released: 'September 16, 2026',
      official: 'https://www.pokemon.com/us/pokemon-tcg/30th-celebration',
      short: 'A 30-year party set, with 30 Pikachu rares and all-foil cards.',
      intro: 'This set celebrates 30 years of Pokémon. It is full of favorite Pokémon from three decades, and every card is foil.',
      unique: [
        'Official pages say it has over 150 cards. The family checklist has 158 cards in the main 30th Celebration set. The official master binder also has a last page for the 3 RGB Rare Mew cards.',
        'Each booster pack includes one of 30 unique Pikachu rare cards.',
        'The set introduces a new rarity called Futuristic rare, with art by YOSHIROTTEN.',
        'It also comes with a 30-card Classic Collection of famous older cards, kept as their own checklist in our binder.'
      ],
      variants: [
        { ico: '✨', name: 'All foil', text: 'Official press says the cards in this expansion are all foil. Still check the art, the stamp, and the number so each card is in the right pocket.' },
        { ico: '⚡', name: 'Pikachu rares', text: 'There are 30 different Pikachu rare cards to collect, with one in each booster pack.' },
        { ico: '🔮', name: 'Futuristic rare', text: 'A brand-new rarity in this set, with a special look by artist YOSHIROTTEN.' }
      ],
      rarity: [
        'Look at the rarity stamp and the card number just like other sets.',
        'Watch for Pikachu rares, illustration rares, special illustration rares, and Futuristic rares.'
      ],
      chase: [
        'The 30 Pikachu rare cards.',
        'Mewtwo ex and Mew ex, plus other Pokémon ex such as Umbreon ex, Salamence ex, and Greninja ex.',
        'Futuristic rares and the Classic Collection cards, which live on their own guide page.'
      ],
      look: LOOK,
      team: '⭐ Star Trainer Harper can hunt for all the different Pikachu pictures. 🔥 Ace Trainer Carter can help sort them by number into the 30th Celebration binder.'
    },
    {
      slug: 'classic',
      name: 'Classic Collection',
      setName: 'Classic Collection',
      code: '30C-CC',
      emoji: '🥇',
      series: 'Mega Evolution',
      released: 'September 16, 2026',
      official: 'https://www.pokemon.com/us/features/highlighting-10-cards-from-the-pokemon-tcg-30th-celebration-classic-collection',
      short: '30 famous cards from Pokémon history, reprinted with gold borders.',
      intro: 'These 30 cards are famous cards from the last 30 years, brought back for the 30th Celebration. They have gold borders and a special texture.',
      unique: [
        'There are 30 iconic cards in this collection, released with the 30th Celebration expansion on September 16, 2026.',
        'Official features describe gold borders and a unique texture that makes the reprints feel new.',
        'They are a separate binder and checklist in our collection, not mixed into the main 30th Celebration numbers.'
      ],
      variants: [
        { ico: '🥇', name: 'Gold-border reprints', text: 'These are special reprints of classic cards. Look for the gold border and the textured finish, then match the name to the Classic Collection binder.' }
      ],
      rarity: [
        'Each card keeps a classic feel, but the gold border and texture are the big clues that it belongs in this collection.',
        'Use the family checklist of 30 cards to see which ones we still need.'
      ],
      chase: [
        'All 30 cards are special. Official stories highlight favorites such as N, Erika’s Jigglypuff, and other famous cards from many eras.'
      ],
      look: LOOK,
      team: '⭐ Star Trainer Harper can look for the gold borders. 🔥 Ace Trainer Carter can match each card to its pocket in the Classic Collection binder.'
    },
    {
      slug: 'rgb-mews',
      name: '30th Celebration RGB Mews',
      setName: '30th Celebration RGB Mews',
      code: '30C-RGB',
      emoji: '🧬',
      series: 'Mega Evolution',
      released: 'September 16, 2026',
      short: 'Three special Mew cards on the family 30th Celebration checklist.',
      intro: 'The family keeps three special Mew cards on their own 30th Celebration RGB Mews checklist, next to the main 30th Celebration set.',
      unique: [
        'There are 3 cards on this family checklist, all Mew, from the 30th Celebration era (released September 16, 2026).',
        'They are tracked separately so they are easy to find.'
      ],
      variants: [
        { ico: '🧬', name: 'Special Mew cards', text: 'Compare the art and the stamp with the family checklist before filing one. These are not the same as every other Mew in the 30th Celebration set.' }
      ],
      rarity: [
        'Use the stamp, the number, and the picture to match the exact checklist card.'
      ],
      chase: [
        'All three Mew cards on this short list are worth spotting, because the family is still looking for them.'
      ],
      look: LOOK
    },
    {
      slug: 'mee',
      name: 'Mega Evolution Energies',
      setName: 'Mega Evolution Energies',
      code: 'MEE',
      emoji: '🔋',
      series: 'Mega Evolution',
      short: 'Special Energy cards from the Mega Evolution era.',
      intro: 'These are Energy cards from the Mega Evolution series. Energy cards power Pokémon attacks, so they matter in play and in the binder.',
      unique: [
        'The family checklist has 8 Mega Evolution Energy cards.',
        'They are filed as their own set so they do not get mixed up with Pokémon or Trainer cards.'
      ],
      variants: [
        { ico: '🔋', name: 'Energy cards', text: 'Look for the Energy name, the type color or symbol, and the Mega Evolution era stamp. Some Energy cards have a special or foil treatment, so compare them with the checklist picture.' }
      ],
      rarity: [
        'Match the name and the stamp to the family checklist. Do not go by color alone, because two Energy cards can look similar.'
      ],
      chase: [
        'Special or unusual Energy cards are the ones to look at twice before filing.'
      ],
      look: LOOK
    },
    {
      slug: 'mep',
      name: 'MEP Black Star Promos',
      setName: 'MEP Black Star Promos',
      code: 'MEP',
      emoji: '⭐',
      series: 'Mega Evolution',
      short: 'Promo cards from Mega Evolution products, stamped as MEP.',
      intro: 'Black Star Promos are special cards that come in products, not in the usual numbered set. In the Mega Evolution era, many of them use the MEP set code.',
      unique: [
        'The family checklist has 20 MEP promo cards.',
        'Promo numbers do not follow the same 001/131 style as a main set. The important clues are the MEP code, the promo number, and the art.'
      ],
      variants: [
        { ico: '⭐', name: 'Promo cards', text: 'Look for the MEP stamp and the promo number. Promos can be foil or have extra product art, so match them to the family checklist before adding a new row.' }
      ],
      rarity: [
        'Promos use their own numbering. A card that looks like a set card may still be a promo if the stamp says MEP.'
      ],
      chase: [
        'Promo versions of Mega Evolution Pokémon ex and other product exclusives are the ones people often look for.'
      ],
      look: LOOK.map((x, i) => i === 0 ? { ...x, text: 'At the bottom of the card, look for the MEP stamp. That means it is a promo, not the main set version.' } : x)
    },
    {
      slug: 'perfect-order',
      name: 'Perfect Order',
      setName: 'Perfect Order',
      code: 'POR',
      emoji: '🛡️',
      series: 'Mega Evolution',
      released: 'March 27, 2026',
      official: 'https://www.pokemon.com/us/pokemon-tcg/mega-evolution-perfect-order',
      short: 'Mega Zygarde ex and other Mega Evolution Pokémon ex keep the city in order.',
      intro: 'Mega Zygarde ex stands for strength in numbers and helps keep the city safe. This is an early Mega Evolution set with more Mega Evolution Pokémon ex.',
      unique: [
        'Official pages say it has over 120 cards. It released on March 27, 2026.',
        'Featured Mega Evolution Pokémon ex include Mega Zygarde ex, Mega Clefable ex, and Mega Starmie ex. Meowth ex is also part of the official set story.',
        'Like other Mega Evolution sets, Mega Evolution Pokémon ex give up 3 Prize cards if they are Knocked Out.',
        'This set does not use Poké Ball or Master Ball patterns. Look for Regular, Holofoil, and Reverse Holofoil.'
      ],
      variants: [
        { ico: '⬜', name: 'Regular', text: 'Smooth, flat text box.' },
        { ico: '🌟', name: 'Holofoil', text: 'A shiny rainbow frame is common on rares and Pokémon ex.' },
        { ico: '✨', name: 'Reverse Holofoil', text: 'A sparkly pattern all over the text box.' }
      ],
      rarity: [
        'Use the usual stamps (circle, diamond, star) and watch for Illustration Rares and other secret rares with numbers over the main set size.'
      ],
      chase: [
        'Mega Zygarde ex, Mega Clefable ex, Mega Starmie ex, and special-art cards from this set.'
      ],
      look: LOOK
    },
    {
      slug: 'chaos-rising',
      name: 'Chaos Rising',
      setName: 'Chaos Rising',
      code: 'CRI',
      emoji: '🌊',
      series: 'Mega Evolution',
      released: 'May 22, 2026',
      official: 'https://www.pokemon.com/us/pokemon-tcg/mega-evolution-chaos-rising',
      short: 'Mega Floette ex vs Mega Greninja ex, as night falls in the city.',
      intro: 'Mega Floette ex brings turmoil to the streets, and Mega Greninja ex leads the fight back, with Mega Pyroar ex and Mega Dragalge ex close behind.',
      unique: [
        'Official pages say it has over 120 cards. It released on May 22, 2026.',
        'Official press highlights Mega Floette ex, Mega Greninja ex, Mega Pyroar ex, and Mega Dragalge ex.',
        'Ultra rare Mega Evolution Pokémon ex in this set can show a silhouette of the Pokémon before Mega Evolution in the art.',
        'This set does not use Poké Ball or Master Ball patterns. Look for Regular, Holofoil, and Reverse Holofoil.'
      ],
      variants: [
        { ico: '⬜', name: 'Regular', text: 'Smooth, flat text box.' },
        { ico: '🌟', name: 'Holofoil', text: 'A shiny rainbow frame is common on rares and Pokémon ex.' },
        { ico: '✨', name: 'Reverse Holofoil', text: 'A sparkly pattern all over the text box.' }
      ],
      rarity: [
        'Use the usual stamps, and look closely at ultra rare Mega Evolution art for the pre-Mega silhouette mentioned in official press.'
      ],
      chase: [
        'Mega Floette ex, Mega Greninja ex, Mega Pyroar ex, Mega Dragalge ex, and special-art cards from this set.'
      ],
      look: LOOK
    },
    {
      slug: 'shrouded-fable',
      name: 'Shrouded Fable',
      setName: 'Shrouded Fable',
      code: 'SFA',
      emoji: '🍑',
      series: 'Scarlet & Violet',
      released: 'August 2, 2024',
      official: 'https://www.pokemon.com/us/pokemon-tcg/scarlet-violet-shrouded-fable',
      short: 'A Kitakami special set that introduces Pecharunt to the Trading Card Game.',
      intro: 'Rumors swirl in the land of Kitakami. This Scarlet & Violet special set introduces the Mythical Pokémon Pecharunt to the Trading Card Game.',
      unique: [
        'Official pages say it has over 95 cards. It released on August 2, 2024.',
        'The official set code is SFA.',
        'It comes from the Scarlet & Violet era, before Mega Evolution sets, so there are no Poké Ball or Master Ball pattern cards like Prismatic Evolutions.',
        'Look for Regular, Holofoil, and Reverse Holofoil, plus special-art secret rares.'
      ],
      variants: [
        { ico: '⬜', name: 'Regular', text: 'Smooth, flat text box.' },
        { ico: '🌟', name: 'Holofoil', text: 'A shiny rainbow frame is common on rares and Pokémon ex.' },
        { ico: '✨', name: 'Reverse Holofoil', text: 'A sparkly pattern all over the text box.' }
      ],
      rarity: [
        'Use the usual Scarlet & Violet stamps. Secret rares have numbers bigger than the main set size.'
      ],
      chase: [
        'Pecharunt ex and other special-art cards from Kitakami.'
      ],
      look: LOOK
    },
    {
      slug: 'silver-tempest',
      name: 'Silver Tempest',
      setName: 'Silver Tempest',
      code: 'SIT',
      emoji: '⛈️',
      series: 'Sword & Shield',
      released: 'November 11, 2022',
      official: 'https://www.pokemon.com/us/pokemon-tcg/sword-shield-silver-tempest',
      short: 'A Sword & Shield set with Radiant Pokémon, from before Scarlet & Violet.',
      intro: 'Silver Tempest is from the Sword & Shield series. Official press highlights new Radiant Pokémon in this expansion.',
      unique: [
        'Official pages say it has over 190 cards. It released on November 11, 2022.',
        'The official set code is SIT.',
        'Radiant Pokémon are a special kind of card from this era. A deck may only have one Radiant Pokémon.',
        'This older set does not use Poké Ball or Master Ball patterns. Look for Regular, Holofoil, Reverse Holofoil, and Sword & Shield rarities such as V, VSTAR, and Radiant cards.'
      ],
      variants: [
        { ico: '⬜', name: 'Regular or Holofoil', text: 'Older Sword & Shield cards still use a smooth text box for the regular or holo print.' },
        { ico: '✨', name: 'Reverse Holofoil', text: 'A sparkly pattern all over the text box.' },
        { ico: '🌈', name: 'Radiant Pokémon', text: 'Radiant cards have a special name and look. Official press called out Radiant Pokémon as part of this set.' }
      ],
      rarity: [
        'Sword & Shield stamps can look different from newer Scarlet & Violet cards. Check the SIT set code, the number, and whether the name says Radiant, V, or VSTAR.'
      ],
      chase: [
        'Radiant Pokémon and the set’s special-art and high-rarity cards.'
      ],
      look: LOOK
    }
  ];

  const bySlug = Object.create(null);
  GUIDES.forEach(g => { bySlug[g.slug] = g; });

  w.SetGuides = {
    all: GUIDES,
    bySlug,
    slugForSet(name) {
      const g = GUIDES.find(x => x.setName === name);
      return g ? g.slug : '';
    },
    img: IMG
  };
})(window);
