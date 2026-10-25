/* Pokémon Trivia - true/false + picture questions for little trainers (#/games/trivia).
   🐣 Little Trainer = easy questions (age 4), 🔥 Big Trainer = harder ones (age 6), 👥 Take Turns = both, 5 questions each.
   👑 Master Trainer = a secret, super-hard mode for grown-ups (unlock: tap the title 7 times in 3 seconds on Who's playing?).
   Every question and answer is read aloud (🔊 to hear it again); answers are big pictures, emoji, colors or 👍/👎, so no reading needed.
   Right = +1 ⭐. Wrong = we say the right answer gently, show it glowing, and take away 1 ⭐ (never below 0), like Who's That.
   Uses the shared sound + speech engine from games.js (FentonGames.kit), so the audio rules are the same everywhere. */
window.FentonTrivia = (() => {
'use strict';
const K = () => window.FentonGames.kit;
const ART = id => 'games/art/' + id + '.jpg', CARD = id => 'games/tcg/' + id + '.jpg';
// Names for the pictures we use (all from our own cards)
const PN = {'me55-23': 'Pikachu', 'me55-119': 'Snorlax', 'me55-65': 'Mew', 'me55-63': 'Mewtwo', 'me55-90': 'Gengar', 'me55-9': 'Vulpix',
  'me55-10': 'Ninetales', 'me55-17': 'Lapras', 'me55-16': 'Slowpoke', 'me55-67': 'Marill', 'me55-68': 'Azumarill', 'me55-69': 'Espeon',
  'me55-91': 'Umbreon', 'me55-71': 'Sylveon', 'me55-83': 'Lucario', 'me55-113': 'Meowth', 'me55-95': 'Zorua', 'me55-96': 'Zoroark',
  'me55-93': 'Murkrow', 'me55-121': 'Lugia', 'me55-12': 'Ho-Oh', 'me55-55': 'Zapdos', 'me55-18': 'Articuno', 'me55-11': 'Moltres',
  'me55-19': 'Kyogre', 'me55-82': 'Groudon', 'me55-21': 'Greninja', 'me55-120': 'Igglybuff', 'me55-102': 'Jirachi', 'me55-116': 'Eevee',
  'tcg-714372': 'Charizard', 'me55-58': 'Toxel', 'me55-109': 'Salamence', 'me55-106': 'Zacian',
  'me55-73': 'Drifloon', 'me55-8': 'Vivillon', 'me55-15': 'Fuecoco', 'me55-5': 'Tropius', 'me55-129': 'Alolan Exeggutor', 'me55-114': 'Kangaskhan',
  'me55-125': 'Maushold', 'me55-81': 'Gimmighoul', 'me55-108': 'Gholdengo', 'me55-80': 'Lunala', 'me55-105': 'Solgaleo', 'me55-78': 'Cosmog',
  'me55-77': 'Comfey', 'me55-84': 'Seismitoad', 'me55-85': 'Lycanroc', 'me55-94': 'Scraggy', 'me55-97': 'Deino', 'me55-99': 'Hydreigon',
  'me55-61': 'Morpeko', 'me55-14': 'Reshiram', 'me55-56': 'Zekrom', 'me55-13': 'Victini', 'me55-75': 'Chandelure', 'me55-103': 'Dialga',
  'me55-20': 'Palkia', 'me55-76': 'Xerneas', 'me55-100': 'Yveltal', 'me55-107': 'Zamazenta', 'me55-86': 'Koraidon', 'me55-110': 'Jangmo-o',
  'me55-112': 'Kommo-o', 'me55-87': 'Nidoran♀', 'me55-74': 'Cresselia'};
// How speech should say tricky words (the screen shows the real word). Longest first.
const EAR = [['Poké Balls', 'Pokay Balls'], ['Poké Ball', 'Pokay Ball'], ['Poké Flute', 'Pokay Flute'], ['Pokédex', 'Pokay-dex'],
  ['Pokémon ex', 'Pokémon E X'], ['HP', 'H P'], ['Ninetales', 'Nine-tails'], ['Meowth', 'Mee-owth'], ['Gengar', 'Ghen-gar'],
  ['Lapras', 'Lap-rus'], ['Mewtwo', 'Mew two'], ['Espeon', 'Ess-pee-on'], ['Umbreon', 'Um-bree-on'], ['Sylveon', 'Sil-vee-on'],
  ['Lucario', 'Loo-car-ee-oh'], ['Zoroark', 'Zor-oh-ark'], ['Zorua', 'Zor-oo-uh'], ['Lugia', 'Loo-gee-uh'], ['Ho-Oh', 'Ho Oh'],
  ['Zapdos', 'Zap-dose'], ['Articuno', 'Ar-tih-coo-no'], ['Moltres', 'Mol-tress'], ['Kyogre', 'Kai-oh-ger'], ['Groudon', 'Grow-don'],
  ['Greninja', 'Greh-nin-juh'], ['Jirachi', 'Jih-rah-chee'], ['Toxtricity', 'Tox-trih-city'], ['Toxel', 'Tox-ell'], ['Salamence', 'Sal-uh-mence'],
  ['Zacian', 'Zah-see-an'], ['Azumarill', 'Ah-zoo-marill'], ['Raichu', 'Rye-choo'], ['Charmeleon', 'Char-meal-ee-un'], ['Gyarados', 'Gyare-uh-dose'],
  ['Murkrow', 'Murk-row'], ['Ketchum', 'Ketch-um'],
  ['Nidoran♀', 'Nidoran female'], ['Poké-Powers', 'Pokay Powers'], ['Poké-Bodies', 'Pokay Bodies'], ['Pokémon-ex', 'Pokémon E X'], ['EX ', 'E X '],
  ['LV.X', 'Level X'], ['VMAX', 'V Max'], ['VSTAR', 'V Star'], ['YOSHIROTTEN', 'Yoshirotten'], ['Mt. Silver', 'Mount Silver'], ['A.J.', 'A J'],
  [' (EVs)', ''], [' (IV)', ''], ['Ōtani', 'Oh-tah-nee'], ['Gimmighoul', 'Gimmy-ghoul'], ['Gholdengo', 'Gold-engo'], ['Pecharunt', 'Peh-cha-runt'],
  ['Koraidon', 'Kor-eye-don'], ['Miraidon', 'Mir-eye-don'], ['Fuecoco', 'Fway-coco'], ['Seismitoad', 'Size-muh-toad'], ['Lycanroc', 'Lie-can-rock'],
  ['Hydreigon', 'Hi-dry-gun'], ['Deino', 'Dye-no'], ['Reshiram', 'Resh-ih-ram'], ['Victini', 'Vik-tee-nee'], ['Chandelure', 'Shan-duh-loor'],
  ['Morpeko', 'Mor-peck-oh'], ['Solgaleo', 'Sol-gah-lay-oh'], ['Lunala', 'Loo-nah-lah'], ['Xerneas', 'Zer-nee-us'], ['Yveltal', 'Ee-vel-tal'],
  ['Zamazenta', 'Zah-mah-zen-tah'], ['Jangmo-o', 'Jang-moe-oh'], ['Hakamo-o', 'Hah-kah-moe-oh'], ['Kommo-o', 'Koh-moe-oh'], ['Tropius', 'Tro-pee-us'],
  ['Exeggutor', 'Egg-zeg-yoo-tor'], ['Kangaskhan', 'Kang-gas-con'], ['Maushold', 'Mouse-hold'], ['Togepi', 'Toe-geh-pee'], ['Wobbuffet', 'Wob-buh-fet'],
  ['Gladion', 'Glad-ee-on'], ['Arceus', 'Ar-kee-us'], ['Leon', 'Lee-on'], ['Charicific', 'Chair-ih-sif-ik']];
const forEar = t => { EAR.forEach(([a, b]) => { t = t.split(a).join(b); });      // words first (some contain symbols like ♀), then drop emoji
  t = t.replace(/#(\d)/g, 'number $1').replace(/(\d+)\/(\d+)/g, '$1 of $2');
  return t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B50}]/gu, '').replace(/\s+/g, ' ').trim(); };

/* ---------- the questions ----------
   l: 'e' easy (Little Trainer) | 'h' harder (Big Trainer).  True/False: a = true|false.  Picture choice: o = options, the FIRST one is right
   (they get shuffled on screen).  p = picture shown with the question.  f = the fact we say after the answer (always true).
   Picture codes: 'a:ID' card art · 'k:ID' whole card · 'e:🔥:Fire' emoji · 'c:#hex:Yellow' color · 't:60:60' big number · 'ball' a Poké Ball.
   Choices made of emoji, colors or numbers are read out loud; choices of Pokémon pictures are not (that's the game!). */
const BANK = [
  // ===== EASY: Little Trainer =====
  {l: 'e', q: 'Pikachu is yellow.', a: true, p: 'a:me55-23', f: 'Pikachu is yellow!'},
  {l: 'e', q: 'Snorlax loves to sleep.', a: true, p: 'a:me55-119', f: 'Snorlax sleeps a lot. Zzz!'},
  {l: 'e', q: 'Charizard is a Water type.', a: false, p: 'a:tcg-714372', f: 'Charizard is a Fire type. It breathes fire!'},
  {l: 'e', q: 'Which one is Pikachu?', o: ['a:me55-23', 'a:me55-119', 'a:me55-65'], f: "That's Pikachu!"},
  {l: 'e', q: 'What color is Pikachu?', o: ['c:#ffd21f:Yellow', 'c:#2a75bb:Blue', 'c:#2e9e44:Green'], p: 'a:me55-23', f: 'Pikachu is yellow!'},
  {l: 'e', q: 'Which one is a Fire type?', o: ['a:me55-9', 'a:me55-17', 'a:me55-67'], f: 'Vulpix is a Fire type!'},
  {l: 'e', q: 'Which one is a Water type?', o: ['a:me55-17', 'a:me55-9', 'a:me55-23'], f: 'Lapras is a Water type!'},
  {l: 'e', q: 'Pikachu says "Pika pika!"', a: true, p: 'a:me55-23', f: 'Pika pika!'},
  {l: 'e', q: 'What does Pikachu zap with?', o: ['e:⚡:Lightning', 'e:🔥:Fire', 'e:💧:Water'], p: 'a:me55-23', f: 'Pikachu zaps with lightning!'},
  {l: 'e', q: "Pikachu is Ash's best friend.", a: true, p: 'a:me55-23', f: "Pikachu is Ash's best friend!"},
  {l: 'e', q: "Who is Ash's best buddy?", o: ['a:me55-23', 'a:me55-90', 'a:me55-119'], f: "It's Pikachu! I choose you!"},
  {l: 'e', q: "Ash's Pikachu likes to stay inside its Poké Ball.", a: false, p: 'ball', f: "Ash's Pikachu doesn't like its Poké Ball. It rides on Ash's shoulder!"},
  {l: 'e', q: 'What color is the top of a Poké Ball?', o: ['c:#e3350d:Red', 'c:#8a4fd8:Purple', 'c:#2e9e44:Green'], p: 'ball', f: 'A Poké Ball is red on top and white on the bottom!'},
  {l: 'e', q: 'Trainers catch Pokémon with a Poké Ball.', a: true, p: 'ball', f: 'Yes! You catch Pokémon with a Poké Ball!'},
  {l: 'e', q: 'Which one is Meowth?', o: ['a:me55-113', 'a:me55-116', 'a:me55-9'], f: "That's Meowth!"},
  {l: 'e', q: "Team Rocket's Meowth can talk like a person.", a: true, p: 'a:me55-113', f: "Team Rocket's Meowth can talk!"},
  {l: 'e', q: 'What animal does Meowth look like?', o: ['e:🐱:Cat', 'e:🐶:Dog', 'e:🐟:Fish'], p: 'a:me55-113', f: 'Meowth is a cat Pokémon. Meow!'},
  {l: 'e', q: 'Team Rocket always wins.', a: false, p: 'e:🚀:Team Rocket', f: "Team Rocket doesn't win. They go blasting off again!"},
  {l: 'e', q: 'What color is Gengar?', o: ['c:#7b4fc4:Purple', 'c:#ffd21f:Yellow', 'c:#2e9e44:Green'], p: 'a:me55-90', f: 'Gengar is purple!'},
  {l: 'e', q: 'Gengar is a Ghost type.', a: true, p: 'a:me55-90', f: 'Gengar is a spooky Ghost type. Boo!'},
  {l: 'e', q: 'Which one is a ghost?', o: ['a:me55-90', 'a:me55-23', 'a:me55-116'], f: 'Gengar is a ghost. Boo!'},
  {l: 'e', q: 'Lapras can carry people across the water.', a: true, p: 'a:me55-17', f: 'Lapras gives people rides across the water!'},
  {l: 'e', q: 'Which one is a bird?', o: ['a:me55-55', 'a:me55-119', 'a:me55-16'], f: 'Zapdos is a bird. It can fly!'},
  {l: 'e', q: 'Eevee can grow into lots of different Pokémon.', a: true, p: 'a:me55-116', f: 'Eevee can evolve into lots of different Pokémon!'},
  {l: 'e', q: 'Which one is Eevee?', o: ['a:me55-116', 'a:me55-9', 'a:me55-113'], f: "That's Eevee!"},
  {l: 'e', q: 'Ninetales has nine tails.', a: true, p: 'a:me55-10', f: 'Ninetales has nine tails!'},
  {l: 'e', q: 'Slowpoke is super fast.', a: false, p: 'a:me55-16', f: 'Slowpoke is very, very slow!'},
  {l: 'e', q: "What is on the tip of Charizard's tail?", o: ['e:🔥:A fire', 'e:🌸:A flower', 'e:❄️:A snowflake'], p: 'a:tcg-714372', f: "Charizard's tail has a fire on the tip!"},
  {l: 'e', q: 'Water Pokémon are strong against Fire Pokémon.', a: true, p: 'e:💧:Water', f: 'Water beats Fire. Splash!'},
  {l: 'e', q: 'Which one beats Fire?', o: ['e:💧:Water', 'e:🍃:Grass', 'e:❄️:Ice'], p: 'e:🔥:Fire', f: 'Water beats Fire!'},
  {l: 'e', q: "Pikachu's tail looks like a lightning bolt.", a: true, p: 'a:me55-23', f: "Pikachu's tail looks like a lightning bolt!"},
  {l: 'e', q: "What color are Pikachu's cheeks?", o: ['c:#e3350d:Red', 'c:#2a75bb:Blue', 'c:#2e9e44:Green'], p: 'a:me55-23', f: "Pikachu's cheeks are red!"},
  {l: 'e', q: 'Mew is pink.', a: true, p: 'a:me55-65', f: 'Mew is pink!'},
  {l: 'e', q: 'Which one is Mew?', o: ['a:me55-65', 'a:me55-90', 'a:me55-17'], f: "That's Mew!"},
  {l: 'e', q: 'Which Pokémon is pink?', o: ['a:me55-120', 'a:me55-17', 'a:me55-90'], f: 'Igglybuff is pink!'},
  {l: 'e', q: 'Marill is blue.', a: true, p: 'a:me55-67', f: 'Marill is blue!'},
  {l: 'e', q: 'In the card game, Energy cards help your Pokémon attack.', a: true, p: 'k:me55-9', f: 'Energy cards help your Pokémon attack!'},
  {l: 'e', q: 'What do you play the Pokémon card game with?', o: ['e:🃏:Cards', 'e:⚽:A ball', 'e:🎨:Paint'], f: 'You play with cards!'},
  {l: 'e', q: 'Which Energy matches Pikachu?', o: ['e:⚡:Lightning', 'e:🔥:Fire', 'e:💧:Water'], p: 'k:me55-23', f: 'Pikachu matches Lightning Energy!'},
  {l: 'e', q: 'Which Energy matches Vulpix?', o: ['e:🔥:Fire', 'e:💧:Water', 'e:⚡:Lightning'], p: 'k:me55-9', f: 'Vulpix matches Fire Energy!'},
  {l: 'e', q: 'Ash always wears a cap.', a: true, p: 'e:🧢:Cap', f: 'Ash always wears his cap!'},
  {l: 'e', q: 'What does Ash wear on his head?', o: ['e:🧢:A cap', 'e:👑:A crown', 'e:🎩:A top hat'], f: 'Ash wears a cap!'},
  {l: 'e', q: 'Some Pokémon hatch from eggs.', a: true, p: 'e:🥚:Egg', f: 'Some Pokémon hatch from eggs!'},
  {l: 'e', q: 'Which Pokémon is big and sleepy?', o: ['a:me55-119', 'a:me55-23', 'a:me55-120'], f: 'Snorlax is big and sleepy!'},
  {l: 'e', q: "Jigglypuff's song makes everyone fall asleep.", a: true, p: 'e:🎤:Song', f: "Jigglypuff's song makes everyone sleepy!"},
  {l: 'e', q: 'Igglybuff is a baby Pokémon.', a: true, p: 'a:me55-120', f: 'Igglybuff is a baby Pokémon!'},
  {l: 'e', q: 'What color is Charizard?', o: ['c:#ff8a1f:Orange', 'c:#7b4fc4:Purple', 'c:#2e9e44:Green'], p: 'a:tcg-714372', f: 'Charizard is orange!'},
  {l: 'e', q: 'Ash wants to be a Pokémon Master.', a: true, p: 'e:🏆:Trophy', f: 'Ash wants to be a Pokémon Master!'},
  {l: 'e', q: 'Nurse Joy takes care of Pokémon at the Pokémon Center.', a: true, p: 'e:🏥:Pokémon Center', f: 'Nurse Joy helps Pokémon feel better!'},
  {l: 'e', q: 'Where does Lapras love to swim?', o: ['e:🌊:The water', 'e:🌋:A volcano', 'e:🏜️:The desert'], p: 'a:me55-17', f: 'Lapras swims in the water!'},

  // ===== HARDER: Big Trainer =====
  {l: 'h', q: "Ash's last name is Ketchum.", a: true, p: 'e:🧢:Ash', f: 'His name is Ash Ketchum!'},
  {l: 'h', q: 'Pikachu evolves into Raichu.', a: true, p: 'a:me55-23', f: 'Pikachu evolves into Raichu!'},
  {l: 'h', q: 'Professor Oak gave Ash his first Pokémon, Pikachu.', a: true, p: 'a:me55-23', f: 'Professor Oak gave Ash his Pikachu!'},
  {l: 'h', q: 'Ash comes from Pallet Town.', a: true, p: 'e:🏡:Home', f: 'Ash comes from Pallet Town!'},
  {l: 'h', q: 'Misty is a Gym Leader who loves Water types.', a: true, p: 'e:💧:Water', f: 'Misty loves Water Pokémon!'},
  {l: 'h', q: 'Brock is a Gym Leader who loves Rock types.', a: true, p: 'e:🪨:Rock', f: 'Brock loves Rock Pokémon!'},
  {l: 'h', q: 'What type of Pokémon does Misty love?', o: ['e:💧:Water', 'e:🔥:Fire', 'e:👻:Ghost'], f: 'Misty loves Water types!'},
  {l: 'h', q: 'What type of Pokémon does Brock love?', o: ['e:🪨:Rock', 'e:💧:Water', 'e:⚡:Electric'], f: 'Brock loves Rock types!'},
  {l: 'h', q: 'Team Rocket is Jessie, James, and Meowth.', a: true, p: 'a:me55-113', f: 'Jessie, James, and Meowth are Team Rocket!'},
  {l: 'h', q: 'Which Pokémon is in Team Rocket?', o: ['a:me55-113', 'a:me55-23', 'a:me55-116'], f: 'Meowth is in Team Rocket! Meowth, that\'s right!'},
  {l: 'h', q: 'Scientists made Mewtwo from Mew.', a: true, p: 'a:me55-63', f: 'Mewtwo was made from Mew!'},
  {l: 'h', q: 'Electric attacks are super strong against Water Pokémon.', a: true, p: 'e:⚡:Electric', f: 'Electric beats Water. Zap!'},
  {l: 'h', q: 'Which type beats Water?', o: ['e:⚡:Electric', 'e:🔥:Fire', 'e:🪨:Rock'], p: 'e:💧:Water', f: 'Electric beats Water!'},
  {l: 'h', q: 'Which type beats Grass?', o: ['e:🔥:Fire', 'e:💧:Water', 'e:🪨:Rock'], p: 'e:🍃:Grass', f: 'Fire beats Grass!'},
  {l: 'h', q: 'Fire attacks are super strong against Water Pokémon.', a: false, p: 'e:🔥:Fire', f: "Water beats Fire. Fire attacks don't do much to Water Pokémon."},
  {l: 'h', q: "Ground attacks can't hit Flying Pokémon.", a: true, p: 'a:me55-55', f: 'Flying Pokémon are up in the air, so Ground attacks miss!'},
  {l: 'h', q: 'Charmander evolves into Charmeleon, and then into Charizard.', a: true, p: 'a:tcg-714372', f: 'Charmander, Charmeleon, Charizard!'},
  {l: 'h', q: 'Eevee can evolve into Umbreon.', a: true, p: 'a:me55-91', f: 'Eevee can evolve into Umbreon!'},
  {l: 'h', q: 'Which one is an Eevee evolution?', o: ['a:me55-69', 'a:me55-9', 'a:me55-113'], f: 'Espeon is an Eevee evolution!'},
  {l: 'h', q: 'Which one is also an Eevee evolution?', o: ['a:me55-71', 'a:me55-120', 'a:me55-67'], f: 'Sylveon is an Eevee evolution!'},
  {l: 'h', q: 'Eevee has 8 different evolutions.', a: true, p: 'a:me55-116', f: 'Eevee has 8 evolutions!'},
  {l: 'h', q: 'What does Vulpix evolve into?', o: ['a:me55-10', 'a:me55-17', 'a:me55-90'], p: 'a:me55-9', f: 'Vulpix evolves into Ninetales!'},
  {l: 'h', q: 'What does Marill evolve into?', o: ['a:me55-68', 'a:me55-16', 'a:me55-116'], p: 'a:me55-67', f: 'Marill evolves into Azumarill!'},
  {l: 'h', q: 'What does Zorua evolve into?', o: ['a:me55-96', 'a:me55-93', 'a:me55-91'], p: 'a:me55-95', f: 'Zorua evolves into Zoroark!'},
  {l: 'h', q: 'Igglybuff evolves into Jigglypuff.', a: true, p: 'a:me55-120', f: 'Igglybuff evolves into Jigglypuff!'},
  {l: 'h', q: 'Toxel evolves into Toxtricity.', a: true, p: 'a:me55-58', f: 'Toxel evolves into Toxtricity!'},
  {l: 'h', q: 'Magikarp evolves into Gyarados.', a: true, p: 'e:🐟:Magikarp', f: 'Little Magikarp evolves into big Gyarados!'},
  {l: 'h', q: 'Which legendary bird is the Fire bird?', o: ['a:me55-11', 'a:me55-18', 'a:me55-55'], f: 'Moltres is the Fire bird!'},
  {l: 'h', q: 'Which legendary bird is the Ice bird?', o: ['a:me55-18', 'a:me55-11', 'a:me55-55'], f: 'Articuno is the Ice bird!'},
  {l: 'h', q: 'Which legendary bird is the Electric bird?', o: ['a:me55-55', 'a:me55-18', 'a:me55-11'], f: 'Zapdos is the Electric bird!'},
  {l: 'h', q: 'Which legendary Pokémon is a Water type?', o: ['a:me55-19', 'a:me55-82', 'a:me55-11'], f: 'Kyogre is a Water type!'},
  {l: 'h', q: 'Which one is a Dragon type?', o: ['a:me55-109', 'a:me55-23', 'a:me55-116'], f: 'Salamence is a Dragon type!'},
  {l: 'h', q: 'Which type is Gengar?', o: ['e:👻:Ghost', 'e:🔥:Fire', 'e:💧:Water'], p: 'a:me55-90', f: 'Gengar is a Ghost type!'},
  {l: 'h', q: 'Snorlax is a Normal type.', a: true, p: 'a:me55-119', f: 'Snorlax is a Normal type!'},
  {l: 'h', q: 'Sylveon is a Fairy type.', a: true, p: 'a:me55-71', f: 'Sylveon is a Fairy type!'},
  {l: 'h', q: "Umbreon's rings glow in the dark.", a: true, p: 'a:me55-91', f: "Umbreon's rings glow in the dark!"},
  {l: 'h', q: 'Zacian holds a sword in its mouth.', a: true, p: 'a:me55-106', f: 'Zacian holds a sword in its mouth!'},
  {l: 'h', q: 'Lucario can feel aura, the energy around people and Pokémon.', a: true, p: 'a:me55-83', f: 'Lucario can sense aura!'},
  {l: 'h', q: 'Jirachi sleeps for 1,000 years.', a: true, p: 'a:me55-102', f: 'Jirachi sleeps for 1,000 years!'},
  {l: 'h', q: 'Greninja is a ninja frog, and Ash had one.', a: true, p: 'a:me55-21', f: 'Greninja is a ninja frog. Ash had one!'},
  {l: 'h', q: 'Misty traveled with Ash because Pikachu zapped her bike.', a: true, p: 'e:🚲:Bike', f: 'Pikachu zapped Misty\'s bike, so she followed Ash!'},
  {l: 'h', q: 'Gary is Professor Oak\'s grandson.', a: true, p: 'e:👴:Professor Oak', f: "Gary is Professor Oak's grandson!"},
  {l: 'h', q: 'After many adventures, Ash became the Pokémon World Champion.', a: true, p: 'e:🏆:Trophy', f: 'Ash became the World Champion!'},
  {l: 'h', q: "What does Team Rocket's Meowth love?", o: ['e:🪙:Shiny coins', 'e:🥦:Broccoli', 'e:🧦:Socks'], p: 'a:me55-113', f: 'Meowth loves shiny coins!'},
  {l: 'h', q: 'Pikachu is number 25 in the Pokédex.', a: true, p: 'a:me55-23', f: 'Pikachu is number 25!'},
  {l: 'h', q: 'Mew is number 151 in the Pokédex.', a: true, p: 'a:me55-65', f: 'Mew is number 151!'},
  {l: 'h', q: 'Bulbasaur is number 1 in the Pokédex.', a: true, p: 'e:🌱:Bulbasaur', f: 'Bulbasaur is number 1!'},
  {l: 'h', q: 'In Pokémon Red and Blue, your first Pokémon can be Bulbasaur, Charmander, or Squirtle.', a: true, p: 'e:🎮:Game', f: 'You pick Bulbasaur, Charmander, or Squirtle!'},
  {l: 'h', q: 'In the games, a sleeping Snorlax blocks the road until you wake it with a Poké Flute.', a: true, p: 'a:me55-119', f: 'A Poké Flute wakes up Snorlax!'},
  {l: 'h', q: 'In the games, you battle Gym Leaders to win badges.', a: true, p: 'e:🏅:Badge', f: 'Beat a Gym Leader to win a badge!'},
  {l: 'h', q: 'How many Gym badges do you need for the Pokémon League?', o: ['t:8:8', 't:3:3', 't:50:50'], p: 'e:🏅:Badge', f: 'You need 8 badges!'},
  {l: 'h', q: 'Pokémon turns 30 years old in 2026.', a: true, p: 'e:🎂:Birthday', f: 'Happy 30th birthday, Pokémon!'},
  {l: 'h', q: 'How old is Pokémon turning in 2026?', o: ['t:30:30', 't:5:5', 't:100:100'], p: 'e:🎂:Birthday', f: 'Pokémon is turning 30!'},
  {l: 'h', q: 'Our 30th Celebration cards are a party for Pokémon\'s 30th birthday.', a: true, p: 'k:me55-23', f: '30th Celebration is for Pokémon\'s 30th birthday!'},
  {l: 'h', q: 'The 30th Celebration set has old-style cards called the Classic Collection.', a: true, p: 'a:tcg-714372', f: 'Our Classic Charizard is a Classic Collection card!'},
  {l: 'h', q: 'HP means Hit Points. It shows how much damage a Pokémon can take.', a: true, p: 'k:me55-10', f: 'HP means Hit Points!'},
  {l: 'h', q: 'Which card has more HP?', o: ['k:me55-10:Ninetales', 'k:me55-9:Vulpix'], ro: true, f: 'Ninetales has 110 HP. Vulpix has 70 HP.'},
  {l: 'h', q: 'You can attach one Energy card from your hand each turn.', a: true, p: 'e:🔥:Energy', f: 'One Energy card each turn!'},
  {l: 'h', q: 'A Stage 1 Pokémon evolves from a Basic Pokémon.', a: true, p: 'k:me55-10', f: 'Ninetales is Stage 1. It evolves from Basic Vulpix!'},
  {l: 'h', q: 'Knocking out a Pokémon ex gets you extra Prize cards.', a: true, p: 'a:me55-90', f: 'Pokémon ex are strong, so they give extra Prize cards!'},
  {l: 'h', q: 'In the real card game, each player sets out 10 Prize cards.', a: false, p: 'e:🎁:Prize cards', f: 'Each player sets out 6 Prize cards.'},
  {l: 'h', q: 'How many cards are in a Pokémon card game deck?', o: ['t:60:60', 't:10:10', 't:100:100'], p: 'e:🃏:Deck', f: 'A deck has 60 cards!'},
  {l: 'h', q: 'Your Bench can hold up to 5 Pokémon.', a: true, p: 'e:🪑:Bench', f: 'The Bench holds up to 5 Pokémon!'},
  {l: 'h', q: 'You win when you take all of your Prize cards.', a: true, p: 'e:🎁:Prize cards', f: 'Take all your Prize cards to win!'},
  {l: 'h', q: 'You can flip a coin to see who goes first.', a: true, p: 'e:🪙:Coin', f: 'Flip a coin to see who goes first!'},
  {l: 'h', q: 'Fire Pokémon like Vulpix are weak to Water.', a: true, p: 'k:me55-9', f: 'Look at the bottom of the card. Vulpix is weak to Water!'},
  // ===== EASY: more for Little Trainer =====
  {l: 'e', q: 'Drifloon looks like a balloon.', a: true, p: 'a:me55-73', f: 'Drifloon looks like a purple balloon. Float away!'},
  {l: 'e', q: 'Which one looks like a balloon?', o: ['a:me55-73', 'a:me55-119', 'a:me55-17'], f: 'Drifloon looks like a balloon!'},
  {l: 'e', q: 'Vivillon is a butterfly Pokémon.', a: true, p: 'a:me55-8', f: 'Vivillon is a pretty butterfly!'},
  {l: 'e', q: 'Which one is a butterfly?', o: ['a:me55-8', 'a:me55-114', 'a:me55-16'], f: 'Vivillon is a butterfly!'},
  {l: 'e', q: 'Fuecoco is a little fire crocodile.', a: true, p: 'a:me55-15', f: 'Fuecoco is a little fire crocodile. Chomp!'},
  {l: 'e', q: 'Which one is Fuecoco?', o: ['a:me55-15', 'a:me55-67', 'a:me55-116'], f: "That's Fuecoco!"},
  {l: 'e', q: 'Tropius has big leaves on its back, like wings.', a: true, p: 'a:me55-5', f: 'Tropius flies with its big leaves!'},
  {l: 'e', q: 'Alolan Exeggutor is super tall, with a long, long neck.', a: true, p: 'a:me55-129', f: 'Alolan Exeggutor is as tall as a palm tree!'},
  {l: 'e', q: 'Kangaskhan carries its baby in a pouch on its belly.', a: true, p: 'a:me55-114', f: 'Kangaskhan keeps its baby safe in its pouch!'},
  {l: 'e', q: 'What animal does Kangaskhan look like?', o: ['e:🦘:Kangaroo', 'e:🐘:Elephant', 'e:🐧:Penguin'], p: 'a:me55-114', f: 'Kangaskhan looks like a kangaroo!'},
  {l: 'e', q: 'Maushold is a family of little mice.', a: true, p: 'a:me55-125', f: 'Maushold is a mouse family. Squeak!'},
  {l: 'e', q: 'What animal is Maushold?', o: ['e:🐭:Mouse', 'e:🐸:Frog', 'e:🐻:Bear'], p: 'a:me55-125', f: 'Maushold is a family of mice!'},
  {l: 'e', q: 'Gimmighoul loves to collect coins.', a: true, p: 'a:me55-81', f: 'Gimmighoul loves coins!'},
  {l: 'e', q: 'Gholdengo is made of gold coins.', a: true, p: 'a:me55-108', f: 'Gholdengo is made of shiny gold coins!'},
  {l: 'e', q: 'What color is Gholdengo?', o: ['c:#e9b824:Gold', 'c:#7b4fc4:Purple', 'c:#2e9e44:Green'], p: 'a:me55-108', f: 'Gholdengo is gold!'},
  {l: 'e', q: 'Cosmog looks like a little cloud from outer space.', a: true, p: 'a:me55-78', f: 'Cosmog is a tiny space cloud!'},
  {l: 'e', q: 'What does Comfey carry?', o: ['e:🌸:Flowers', 'e:🍕:Pizza', 'e:⚽:A ball'], p: 'a:me55-77', f: 'Comfey carries flowers!'},
  {l: 'e', q: 'Which one has flowers?', o: ['a:me55-77', 'a:me55-97', 'a:me55-56'], f: 'Comfey has flowers!'},
  {l: 'e', q: 'What animal does Seismitoad look like?', o: ['e:🐸:Frog', 'e:🐱:Cat', 'e:🐦:Bird'], p: 'a:me55-84', f: 'Seismitoad is a big toad. Ribbit!'},
  {l: 'e', q: 'Lycanroc looks like a wolf.', a: true, p: 'a:me55-85', f: 'Lycanroc is a wolf Pokémon. Awoo!'},
  {l: 'e', q: 'What animal does Lycanroc look like?', o: ['e:🐺:Wolf', 'e:🐰:Bunny', 'e:🐢:Turtle'], p: 'a:me55-85', f: 'Lycanroc looks like a wolf!'},
  {l: 'e', q: 'Scraggy pulls up its skin like baggy pants.', a: true, p: 'a:me55-94', f: 'Scraggy wears its skin like baggy pants. Silly!'},
  {l: 'e', q: 'How many heads does Hydreigon have?', o: ['t:3:3', 't:1:1', 't:10:10'], p: 'a:me55-99', f: 'Hydreigon has 3 heads!'},
  {l: 'e', q: 'Reshiram is white.', a: true, p: 'a:me55-14', f: 'Reshiram is white!'},
  {l: 'e', q: 'What color is Zekrom?', o: ['c:#26262e:Black', 'c:#ff9fc8:Pink', 'c:#ffd21f:Yellow'], p: 'a:me55-56', f: 'Zekrom is black!'},
  {l: 'e', q: "Which letter do Victini's ears make?", o: ['t:V:V', 't:O:O', 't:X:X'], p: 'a:me55-13', f: "Victini's ears make a V. V is for victory!"},
  {l: 'e', q: 'Pikachu is a mouse Pokémon.', a: true, p: 'a:me55-23', f: 'Pikachu is an electric mouse!'},
  {l: 'e', q: 'What animal is Squirtle?', o: ['e:🐢:Turtle', 'e:🐙:Octopus', 'e:🐟:Fish'], p: 'e:💧:Squirtle', f: 'Squirtle is a little turtle!'},
  {l: 'e', q: 'Bulbasaur has a plant bulb on its back.', a: true, p: 'e:🌱:Bulbasaur', f: 'Bulbasaur has a plant on its back!'},
  {l: 'e', q: 'Psyduck often has a headache.', a: true, p: 'e:🦆:Psyduck', f: 'Poor Psyduck always has a headache!'},
  {l: 'e', q: 'Magikarp is a very strong fighter.', a: false, p: 'e:🐟:Magikarp', f: 'Magikarp just flops and splashes. But it grows up into big Gyarados!'},
  {l: 'e', q: 'Eevee is brown and fluffy.', a: true, p: 'a:me55-116', f: 'Eevee is brown and fluffy!'},
  {l: 'e', q: 'What color is Umbreon?', o: ['c:#26262e:Black', 'c:#ff9fc8:Pink', 'c:#ff8a1f:Orange'], p: 'a:me55-91', f: 'Umbreon is black, with yellow rings!'},
  {l: 'e', q: 'Ditto can change into other Pokémon.', a: true, p: 'e:🫠:Ditto', f: 'Ditto can copy other Pokémon!'},
  {l: 'e', q: 'What color is Ditto?', o: ['c:#b48ae0:Purple', 'c:#2e9e44:Green', 'c:#ff8a1f:Orange'], p: 'e:🫠:Ditto', f: 'Ditto is purple!'},
  {l: 'e', q: 'Zapdos is yellow.', a: true, p: 'a:me55-55', f: 'Zapdos is yellow, like lightning!'},
  {l: 'e', q: 'Articuno is red.', a: false, p: 'a:me55-18', f: 'Articuno is icy blue!'},
  {l: 'e', q: 'Kyogre lives in the sea.', a: true, p: 'a:me55-19', f: 'Kyogre lives deep in the sea!'},
  {l: 'e', q: 'Which one is red?', o: ['a:me55-82', 'a:me55-19', 'a:me55-17'], f: 'Groudon is red!'},
  {l: 'e', q: 'Chandelure has purple flames.', a: true, p: 'a:me55-75', f: 'Chandelure has spooky purple flames!'},
  {l: 'e', q: 'Morpeko loves to eat.', a: true, p: 'a:me55-61', f: 'Morpeko is always hungry!'},
  {l: 'e', q: 'Pokémon can be big or small.', a: true, p: 'ball', f: 'Some Pokémon are tiny and some are huge!'},
  {l: 'e', q: 'Snorlax is a tiny Pokémon.', a: false, p: 'a:me55-119', f: 'Snorlax is really, really big!'},
  {l: 'e', q: 'What do you use to catch a Pokémon?', o: ['e:🔴:A Poké Ball', 'e:🧺:A basket', 'e:🎣:A fishing net'], f: 'You use a Poké Ball!'},
  {l: 'e', q: 'Which one is Victini?', o: ['a:me55-13', 'a:me55-77', 'a:me55-15'], f: "That's Victini! V is for victory!"},

  // ===== HARDER: more for Big Trainer =====
  {l: 'h', q: 'Gengar evolves from Haunter.', a: true, p: 'a:me55-90', f: 'Gastly, Haunter, Gengar!'},
  {l: 'h', q: 'What does Deino grow up to be?', o: ['a:me55-99', 'a:me55-17', 'a:me55-77'], p: 'a:me55-97', f: 'Deino evolves into Zweilous, and then Hydreigon!'},
  {l: 'h', q: 'What does Jangmo-o grow up to be?', o: ['a:me55-112', 'a:me55-61', 'a:me55-13'], p: 'a:me55-110', f: 'Jangmo-o evolves into Hakamo-o, and then Kommo-o!'},
  {l: 'h', q: 'Little Cosmog can grow up into Solgaleo or Lunala.', a: true, p: 'a:me55-78', f: 'Cosmog grows into Cosmoem, then Solgaleo or Lunala!'},
  {l: 'h', q: 'Which one is linked to the sun?', o: ['a:me55-105', 'a:me55-80', 'a:me55-93'], f: 'Solgaleo is linked to the sun. Lunala is linked to the moon!'},
  {l: 'h', q: 'Gimmighoul evolves into Gholdengo.', a: true, p: 'a:me55-81', f: 'Collect lots of coins, and Gimmighoul evolves into Gholdengo!'},
  {l: 'h', q: 'Drifloon evolves into Drifblim.', a: true, p: 'a:me55-73', f: 'Drifloon evolves into Drifblim!'},
  {l: 'h', q: 'Nidoran♀ evolves into Nidorina.', a: true, p: 'a:me55-87', f: 'Nidoran♀ evolves into Nidorina, and then Nidoqueen!'},
  {l: 'h', q: 'Scraggy evolves into Scrafty.', a: true, p: 'a:me55-94', f: 'Scraggy evolves into Scrafty!'},
  {l: 'h', q: 'Which type is Lucario?', o: ['e:🥊:Fighting', 'e:🔥:Fire', 'e:💧:Water'], p: 'a:me55-83', f: 'Lucario is a Fighting and Steel type!'},
  {l: 'h', q: 'Which type is Yveltal?', o: ['e:🌙:Dark', 'e:🍃:Grass', 'e:💧:Water'], p: 'a:me55-100', f: 'Yveltal is a Dark and Flying type!'},
  {l: 'h', q: 'Xerneas is a Fairy type.', a: true, p: 'a:me55-76', f: 'Xerneas is a Fairy type!'},
  {l: 'h', q: 'Reshiram is a Dragon and Fire type.', a: true, p: 'a:me55-14', f: 'Reshiram is a Dragon and Fire type!'},
  {l: 'h', q: 'Zekrom is a Water type.', a: false, p: 'a:me55-56', f: 'Zekrom is a Dragon and Electric type!'},
  {l: 'h', q: 'Ice attacks are super strong against Dragon Pokémon.', a: true, p: 'e:❄️:Ice', f: 'Ice beats Dragon! Brrr!'},
  {l: 'h', q: 'Grass attacks are super strong against Water Pokémon.', a: true, p: 'e:🍃:Grass', f: 'Grass beats Water!'},
  {l: 'h', q: 'Which type beats Rock?', o: ['e:💧:Water', 'e:🔥:Fire', 'e:⚡:Electric'], p: 'e:🪨:Rock', f: 'Water beats Rock! Grass does too.'},
  {l: 'h', q: "Electric attacks can't hurt Ground Pokémon.", a: true, p: 'a:me55-82', f: 'Ground Pokémon like Groudon are safe from Electric attacks!'},
  {l: 'h', q: "Normal attacks can't hit Ghost Pokémon.", a: true, p: 'a:me55-90', f: 'Normal attacks go right through Ghost Pokémon. Spooky!'},
  {l: 'h', q: 'Fairy attacks are super strong against Dragon Pokémon.', a: true, p: 'a:me55-71', f: 'Fairy beats Dragon!'},
  {l: 'h', q: 'Which type beats Ghost?', o: ['e:🌙:Dark', 'e:🥊:Fighting', 'e:🍃:Grass'], p: 'a:me55-90', f: 'Dark beats Ghost! Ghost beats Ghost too.'},
  {l: 'h', q: 'Which one holds a shield?', o: ['a:me55-107', 'a:me55-106', 'a:me55-17'], f: 'Zamazenta holds a shield! Zacian has the sword.'},
  {l: 'h', q: 'Which one is linked to time?', o: ['a:me55-103', 'a:me55-20', 'a:me55-119'], f: 'Dialga is linked to time. Palkia is linked to space!'},
  {l: 'h', q: 'Groudon is linked to the land, and Kyogre is linked to the sea.', a: true, p: 'a:me55-82', f: 'Groudon made the land, and Kyogre made the sea!'},
  {l: 'h', q: 'Lugia sleeps deep under the sea.', a: true, p: 'a:me55-121', f: 'Lugia rests deep under the sea!'},
  {l: 'h', q: "Ho-Oh's wings shine with rainbow colors.", a: true, p: 'a:me55-12', f: "Ho-Oh's feathers shine like a rainbow!"},
  {l: 'h', q: 'In Scarlet and Violet, you can ride Koraidon or Miraidon.', a: true, p: 'a:me55-86', f: 'You can ride Koraidon or Miraidon!'},
  {l: 'h', q: "Ash's Caterpie evolved into Butterfree.", a: true, p: 'e:🦋:Butterfree', f: 'Caterpie became Metapod, and then Butterfree!'},
  {l: 'h', q: "Ash's Pikachu wanted to evolve into Raichu.", a: false, p: 'a:me55-23', f: 'Pikachu said no to the Thunder Stone. It likes being Pikachu!'},
  {l: 'h', q: 'Brock loves to cook for his friends.', a: true, p: 'e:🍳:Cooking', f: 'Brock is a great cook!'},
  {l: 'h', q: 'Misty has a Psyduck that often gets confused.', a: true, p: 'e:🦆:Psyduck', f: "Misty's Psyduck is always confused. Psy-yi-yi!"},
  {l: 'h', q: 'Togepi hatched from an egg, and Misty took care of it.', a: true, p: 'e:🥚:Egg', f: 'Togepi thought Misty was its mom!'},
  {l: 'h', q: 'Wobbuffet is on Team Rocket with Jessie.', a: true, p: 'e:🚀:Team Rocket', f: 'Wobbuffet! Jessie\'s Wobbuffet is always popping out!'},
  {l: 'h', q: 'Officer Jenny is a police officer.', a: true, p: 'e:👮:Officer Jenny', f: 'Officer Jenny keeps everyone safe!'},
  {l: 'h', q: "Ash's Squirtle was the leader of the Squirtle Squad.", a: true, p: 'e:🕶️:Squirtle Squad', f: 'Squirtle led the Squirtle Squad, with cool sunglasses!'},
  {l: 'h', q: "Ash's Charmander evolved all the way into Charizard.", a: true, p: 'a:tcg-714372', f: "Ash's Charmander became Charmeleon, and then Charizard!"},
  {l: 'h', q: 'In the games, you can bring 6 Pokémon with you.', a: true, p: 'ball', f: 'Your team can have 6 Pokémon!'},
  {l: 'h', q: 'How many Pokémon can be on your team in the games?', o: ['t:6:6', 't:2:2', 't:20:20'], p: 'ball', f: 'You can bring 6 Pokémon!'},
  {l: 'h', q: 'A Shiny Pokémon has different colors than normal.', a: true, p: 'e:✨:Shiny', f: 'Shiny Pokémon have special colors. They sparkle!'},
  {l: 'h', q: 'In the games, a Rare Candy makes a Pokémon go up a level.', a: true, p: 'e:🍬:Rare Candy', f: 'Rare Candy gives one level up!'},
  {l: 'h', q: 'In the games, Pokémon Centers heal your Pokémon.', a: true, p: 'e:🏥:Pokémon Center', f: 'Pokémon Centers make your Pokémon all better!'},
  {l: 'h', q: 'In Pokémon GO, you catch Pokémon by walking around outside with a phone.', a: true, p: 'e:📱:Phone', f: 'Pokémon GO gets you walking outside!'},
  {l: 'h', q: 'Pokémon is short for Pocket Monsters.', a: true, p: 'ball', f: 'Pokémon means Pocket Monsters!'},
  {l: 'h', q: 'Pokémon started in Japan.', a: true, p: 'e:🗾:Japan', f: 'Pokémon started in Japan!'},
  {l: 'h', q: 'In the card game, you start with 7 cards in your hand.', a: true, p: 'e:🃏:Cards', f: 'Draw 7 cards to start!'},
  {l: 'h', q: 'How many cards do you draw to start a card game?', o: ['t:7:7', 't:2:2', 't:20:20'], p: 'e:🃏:Cards', f: 'You draw 7 cards!'},
  {l: 'h', q: 'You draw a card at the start of every turn.', a: true, p: 'e:🃏:Cards', f: 'Draw a card each turn!'},
  {l: 'h', q: 'In the card game, Weakness makes an attack do double damage.', a: true, p: 'k:me55-9', f: 'Weakness means times 2 damage!'},
  {l: 'h', q: 'Retreat means you switch your Active Pokémon with one on your Bench.', a: true, p: 'e:🪑:Bench', f: 'Retreat to swap with a Pokémon on your Bench!'},
  {l: 'h', q: 'You can have 10 copies of the same card in your deck.', a: false, p: 'e:🃏:Deck', f: 'You can have up to 4 of the same card. Basic Energy is the exception!'},
  {l: 'h', q: 'Every 30th Celebration booster pack has a special Pikachu card.', a: true, p: 'k:me55-23', f: 'One Pikachu in every pack!'},
  {l: 'h', q: 'How many different Pikachu rare cards are in 30th Celebration?', o: ['t:30:30', 't:3:3', 't:100:100'], p: 'k:me55-23', f: 'There are 30 Pikachu rare cards to collect!'},
  {l: 'h', q: 'Classic Collection cards in 30th Celebration have a sparkly gold border.', a: true, p: 'a:tcg-714372', f: 'The Classic Collection cards shine with gold borders!'},
  {l: 'h', q: 'Mewtwo ex and Mew ex are stars of the 30th Celebration set.', a: true, p: 'a:me55-63', f: 'Mewtwo ex and Mew ex lead the 30th Celebration!'},
  {l: 'h', q: 'The 30th Celebration set came out on the same day all over the world.', a: true, p: 'e:🌍:World', f: 'Everyone got 30th Celebration on the same day!'},
  // ===== MASTER TRAINER (secret): grown-ups and superfans. Text answers, still read aloud. Facts checked on Bulbapedia. =====
  // Pokédex numbers
  {l: 'm', q: "What is Mewtwo's National Pokédex number?", o: ['x:#150', 'x:#151', 'x:#149', 'x:#132'], p: 'a:me55-63', f: 'Mewtwo is number 150, one before Mew.'},
  {l: 'm', q: "What is Gengar's National Pokédex number?", o: ['x:#94', 'x:#92', 'x:#93', 'x:#95'], p: 'a:me55-90', f: 'Gastly is 92, Haunter is 93, and Gengar is 94.'},
  {l: 'm', q: "What is Lucario's National Pokédex number?", o: ['x:#448', 'x:#447', 'x:#445', 'x:#493'], p: 'a:me55-83', f: 'Riolu is 447 and Lucario is 448.'},
  {l: 'm', q: 'Which Pokémon is National Pokédex #133?', o: ['x:Eevee', 'x:Ditto', 'x:Vaporeon', 'x:Porygon'], f: 'Eevee is 133. Ditto is 132, and Vaporeon is 134.'},
  {l: 'm', q: 'Which Pokémon is National Pokédex #143?', o: ['x:Snorlax', 'x:Aerodactyl', 'x:Articuno', 'x:Lapras'], f: 'Snorlax is 143, right between Aerodactyl and Articuno.'},
  {l: 'm', q: 'Which Pokémon is National Pokédex #493?', o: ['x:Arceus', 'x:Darkrai', 'x:Shaymin', 'x:Victini'], f: 'Arceus is 493, the last Pokémon of the Sinnoh generation.'},
  {l: 'm', q: 'Which Pokémon is National Pokédex #1025?', o: ['x:Pecharunt', 'x:Terapagos', 'x:Ogerpon', 'x:Koraidon'], f: 'Pecharunt is 1025. Terapagos is 1024.'},
  {l: 'm', q: 'Gimmighoul is National Pokédex #999.', a: true, p: 'a:me55-81', f: 'Gimmighoul is 999, and it needs 999 Gimmighoul Coins to evolve!'},
  {l: 'm', q: 'After Gold and Silver, how many Pokémon were in the National Pokédex?', o: ['x:251', 'x:250', 'x:386', 'x:300'], f: 'Gold and Silver brought the total to 251, ending with Celebi.'},
  // the anime
  {l: 'm', q: 'In the very first episode, what Pokémon does Ash see flying over a rainbow?', o: ['x:Ho-Oh', 'x:Lugia', 'x:Moltres', 'x:Pidgeot'], p: 'a:me55-12', f: 'Ash sees Ho-Oh at the end of "Pokémon, I Choose You!"'},
  {l: 'm', q: 'What was the first Pokémon Ash caught in the anime?', o: ['x:Caterpie', 'x:Pidgeotto', 'x:Bulbasaur', 'x:Metapod'], f: 'Caterpie, in episode 3. Pidgeotto came the next day.'},
  {l: 'm', q: 'Who knocked Ash out of the Indigo Plateau Conference?', o: ['x:Ritchie', 'x:Gary', 'x:A.J.', 'x:Brock'], f: 'Ash lost to Ritchie in the Top 16.'},
  {l: 'm', q: 'Which was the first Pokémon League that Ash won?', o: ['x:The Orange League', 'x:The Indigo League', 'x:The Alola League', 'x:The Johto League'], f: 'Ash beat Drake to win the Orange League.'},
  {l: 'm', q: 'Who did Ash face in the final of the Manalo Conference, the Alola League?', o: ['x:Gladion', 'x:Hau', 'x:Guzma', 'x:Kukui'], f: 'Ash beat Gladion in the final to become Alola’s first Champion.'},
  {l: 'm', q: 'Who did Ash beat to win the World Coronation Series?', o: ['x:Leon', 'x:Cynthia', 'x:Lance', 'x:Steven'], f: 'Ash beat Leon to become the World Monarch.'},
  {l: 'm', q: "Who abandoned Ash's Charmander in the rain?", o: ['x:Damian', 'x:Ritchie', 'x:Butch', 'x:Paul'], p: 'a:tcg-714372', f: 'Damian left Charmander waiting on a rock in the rain.'},
  {l: 'm', q: 'Where did Ash get his Bulbasaur?', o: ['x:The Hidden Village', 'x:Viridian Forest', 'x:Cerulean Cape', 'x:Pewter City'], f: 'Bulbasaur protected the Pokémon of the Hidden Village.'},
  {l: 'm', q: 'What did Ash\'s Pikachu refuse before the Vermilion Gym rematch?', o: ['x:A Thunder Stone', 'x:A Fire Stone', 'x:A Moon Stone', 'x:An Everstone'], p: 'a:me55-23', f: "Pikachu refused the Thunder Stone and beat Lt. Surge's Raichu as a Pikachu."},
  {l: 'm', q: 'Ash released his Pidgeot to protect a flock of Pidgey and Pidgeotto.', a: true, f: 'In "Pallet Party Panic," Pidgeot stayed to guard the flock from Fearow.'},
  {l: 'm', q: "Ash's Butterfree left to be with a pink Butterfree.", a: true, f: 'That was "Bye Bye Butterfree." Bring tissues!'},
  {l: 'm', q: "What is the special form of Ash's Greninja called?", o: ['x:Ash-Greninja', 'x:Mega Greninja', 'x:Gigantamax Greninja', 'x:Shadow Greninja'], p: 'a:me55-21', f: 'Ash-Greninja comes from the Bond Phenomenon.'},
  {l: 'm', q: "Team Rocket's Meowth taught himself to talk to impress a Meowth named Meowzie.", a: true, p: 'a:me55-113', f: 'Meowth learned to talk and walk for Meowzie. She still said no!'},
  {l: 'm', q: 'Who has voiced Pikachu since the very first episode?', o: ['x:Ikue Ōtani', 'x:Rica Matsumoto', 'x:Veronica Taylor', 'x:Sarah Natochenny'], p: 'a:me55-23', f: 'Ikue Ōtani has voiced Pikachu in Japanese and English.'},
  {l: 'm', q: 'Who was the original English voice of Ash?', o: ['x:Veronica Taylor', 'x:Sarah Natochenny', 'x:Rachael Lillis', 'x:Rica Matsumoto'], f: 'Veronica Taylor voiced Ash first. Sarah Natochenny took over in 2006.'},
  {l: 'm', q: 'Who are the main heroes of Pokémon Horizons?', o: ['x:Liko and Roy', 'x:Goh and Chloe', 'x:Serena and Clemont', 'x:Iris and Cilan'], f: 'Pokémon Horizons follows Liko and Roy.'},
  {l: 'm', q: "Ash's Charizard went to train at the Charicific Valley.", a: true, p: 'a:tcg-714372', f: 'Charizard trained at the Charicific Valley with Liza.'},
  // the video games
  {l: 'm', q: 'In what year did Pokémon Red and Green come out in Japan?', o: ['x:1996', 'x:1995', 'x:1998', 'x:1999'], f: 'February 27, 1996. That date is now Pokémon Day!'},
  {l: 'm', q: 'Pokémon Day is celebrated every year on February 27.', a: true, f: 'It marks the day Red and Green came out in Japan.'},
  {l: 'm', q: 'Pokémon Red and Blue came out in North America in 1998.', a: true, f: 'They came out in North America in September 1998.'},
  {l: 'm', q: 'Who created Pokémon and founded Game Freak?', o: ['x:Satoshi Tajiri', 'x:Ken Sugimori', 'x:Junichi Masuda', 'x:Shigeru Miyamoto'], f: 'Satoshi Tajiri created Pokémon. He loved collecting bugs as a kid!'},
  {l: 'm', q: 'What is the most Effort Values (EVs) a Pokémon can have in total?', o: ['x:510', 'x:252', 'x:255', 'x:600'], f: '510 in total, with 252 usually used to max one stat.'},
  {l: 'm', q: 'Since Generation 3, what is the highest an Individual Value (IV) can be?', o: ['x:31', 'x:15', 'x:63', 'x:100'], f: 'IVs go from 0 to 31.'},
  {l: 'm', q: 'How many different Natures are there?', o: ['x:25', 'x:18', 'x:20', 'x:30'], f: 'There are 25 Natures, and 5 of them change nothing.'},
  {l: 'm', q: 'Since Generation 6, what are the normal odds of finding a Shiny Pokémon?', o: ['x:1 in 4,096', 'x:1 in 8,192', 'x:1 in 1,024', 'x:1 in 65,536'], f: 'It went from 1 in 8,192 to 1 in 4,096 in X and Y.'},
  {l: 'm', q: 'Which games added the Fairy type?', o: ['x:X and Y', 'x:Black and White', 'x:Sun and Moon', 'x:Gold and Silver'], p: 'a:me55-71', f: 'The Fairy type arrived in X and Y.'},
  {l: 'm', q: 'Which games added the Dark and Steel types?', o: ['x:Gold and Silver', 'x:Ruby and Sapphire', 'x:Diamond and Pearl', 'x:Red and Blue'], f: 'Dark and Steel arrived in Gold and Silver.'},
  {l: 'm', q: 'Which games split moves into physical and special based on the move itself?', o: ['x:Diamond and Pearl', 'x:Ruby and Sapphire', 'x:Gold and Silver', 'x:Black and White'], f: 'The physical and special split came in Diamond and Pearl.'},
  {l: 'm', q: 'Which games first gave Pokémon Abilities?', o: ['x:Ruby and Sapphire', 'x:Gold and Silver', 'x:Diamond and Pearl', 'x:Red and Blue'], f: 'Abilities arrived in Ruby and Sapphire.'},
  {l: 'm', q: 'How many Gimmighoul Coins do you need to evolve Gimmighoul?', o: ['x:999', 'x:500', 'x:1,000', 'x:151'], p: 'a:me55-81', f: 'Level it up while you have 999 Gimmighoul Coins.'},
  {l: 'm', q: 'Trading Onix while it holds a Metal Coat evolves it into what?', o: ['x:Steelix', 'x:Golem', 'x:Rhydon', 'x:Scizor'], f: 'Onix becomes Steelix. Scyther becomes Scizor the same way.'},
  {l: 'm', q: 'Who do you battle at the top of Mt. Silver in Gold and Silver?', o: ['x:Red', 'x:Blue', 'x:Lance', 'x:Giovanni'], f: 'Red waits silently at the top of Mt. Silver.'},
  {l: 'm', q: 'In Red and Blue, who is the Champion?', o: ['x:Your rival', 'x:Lance', 'x:Professor Oak', 'x:Giovanni'], f: 'Your rival beats the Elite Four just before you do!'},
  {l: 'm', q: 'Who is the Gym Leader of Viridian City in Red and Blue?', o: ['x:Giovanni', 'x:Koga', 'x:Sabrina', 'x:Blaine'], f: 'Giovanni, the boss of Team Rocket, is the last Gym Leader.'},
  {l: 'm', q: 'Which company first made Pokémon GO in 2016?', o: ['x:Niantic', 'x:Game Freak', 'x:Creatures', 'x:HAL Laboratory'], f: 'Niantic made Pokémon GO.'},
  {l: 'm', q: 'Pokémon Legends: Arceus takes place in the Hisui region.', a: true, f: 'Hisui is what Sinnoh was called long ago.'},
  // the card game: history and rules
  {l: 'm', q: 'In what year did the English Base Set come out?', o: ['x:1999', 'x:1996', 'x:1998', 'x:2000'], p: 'a:tcg-714372', f: 'The English Base Set came out on January 9, 1999.'},
  {l: 'm', q: 'The Pokémon card game came out in Japan in 1996.', a: true, f: 'The first Japanese Expansion Pack came out on October 20, 1996.'},
  {l: 'm', q: 'How many cards are in the English Base Set?', o: ['x:102', 'x:151', 'x:130', 'x:64'], f: 'Base Set has 102 cards.'},
  {l: 'm', q: 'Who illustrated the Base Set Charizard?', o: ['x:Mitsuhiro Arita', 'x:Ken Sugimori', 'x:Atsuko Nishida', 'x:Kagemaru Himeno'], p: 'a:tcg-714372', f: 'Mitsuhiro Arita drew it. He drew the Base Set Pikachu too!'},
  {l: 'm', q: 'How much HP does the Base Set Charizard have?', o: ['x:120', 'x:100', 'x:150', 'x:200'], p: 'a:tcg-714372', f: 'Base Set Charizard has 120 HP.'},
  {l: 'm', q: "What is the Base Set Charizard's Pokémon Power called?", o: ['x:Energy Burn', 'x:Fire Spin', 'x:Rain Dance', 'x:Damage Swap'], p: 'a:tcg-714372', f: 'Energy Burn. Fire Spin is its 100 damage attack.'},
  {l: 'm', q: 'What is the card number of the Base Set Charizard?', o: ['x:4/102', 'x:6/102', 'x:1/102', 'x:2/102'], p: 'a:tcg-714372', f: 'Charizard is 4 of 102.'},
  {l: 'm', q: 'Which company published the first English Pokémon cards?', o: ['x:Wizards of the Coast', 'x:Nintendo', 'x:Hasbro', 'x:Topps'], f: 'Wizards of the Coast published them, starting with Base Set.'},
  {l: 'm', q: 'Which set introduced Dark Pokémon cards like Dark Charizard?', o: ['x:Team Rocket', 'x:Fossil', 'x:Jungle', 'x:Neo Genesis'], f: 'The Team Rocket set introduced Dark Pokémon.'},
  {l: 'm', q: 'Which set first added Darkness and Metal Energy?', o: ['x:Neo Genesis', 'x:Team Rocket', 'x:Base Set 2', 'x:EX Ruby & Sapphire'], f: 'Neo Genesis added Darkness and Metal Energy, plus Baby Pokémon.'},
  {l: 'm', q: 'Which set split Pokémon Powers into Poké-Powers and Poké-Bodies?', o: ['x:Expedition Base Set', 'x:EX Ruby & Sapphire', 'x:Neo Genesis', 'x:Diamond & Pearl'], f: 'Expedition Base Set brought Poké-Powers and Poké-Bodies.'},
  {l: 'm', q: 'Which set introduced the first Pokémon-ex cards?', o: ['x:EX Ruby & Sapphire', 'x:EX Dragon', 'x:Expedition Base Set', 'x:Diamond & Pearl'], f: 'EX Ruby & Sapphire, in 2003. Each one gave up 2 Prize cards.'},
  {l: 'm', q: 'Abilities first appeared on cards in the Black & White era.', a: true, f: 'Black & White renamed Poké-Powers and Poké-Bodies as Abilities.'},
  {l: 'm', q: 'Knocking out a Pokémon VMAX gives you how many Prize cards?', o: ['x:3', 'x:2', 'x:1', 'x:4'], f: 'A Pokémon VMAX gives up 3 Prize cards.'},
  {l: 'm', q: 'Under today\'s rules, the player who goes first cannot attack on their first turn.', a: true, f: 'Going first means no attack that turn.'},
  // 30th Celebration
  {l: 'm', q: 'How many cards are in the 30th Celebration Classic Collection?', o: ['x:30', 'x:25', 'x:20', 'x:50'], p: 'a:tcg-714372', f: '30 reprints, from Base Set to the modern day.'},
  {l: 'm', q: 'When did the 30th Celebration set come out?', o: ['x:September 16, 2026', 'x:February 27, 2026', 'x:October 20, 2026', 'x:January 9, 2026'], p: 'k:me55-23', f: 'September 16, 2026, on the same day worldwide.'},
  {l: 'm', q: 'Who illustrated the Futuristic rare and RGB rare cards in 30th Celebration?', o: ['x:YOSHIROTTEN', 'x:Mitsuhiro Arita', 'x:Ken Sugimori', 'x:Atsuko Nishida'], f: 'YOSHIROTTEN drew them, and the set\'s key art too.'},
  {l: 'm', q: 'Which Pokémon are the three RGB rare cards in 30th Celebration?', o: ['x:Mew', 'x:Mewtwo', 'x:Pikachu', 'x:Eevee'], p: 'a:me55-65', f: 'Red, green, and blue Mew!'},
  {l: 'm', q: '30th Celebration Classic Collection cards are legal in the Standard format.', a: false, p: 'a:tcg-714372', f: "They aren't Standard legal. You can play them where the original card is legal, like Expanded."},
  {l: 'm', q: 'Which Classic Collection reprint comes from the newest original set?', o: ['x:Magikarp (Paldea Evolved)', 'x:Arceus VSTAR (Brilliant Stars)', 'x:Mew VMAX (Fusion Strike)', 'x:Zacian V (Sword & Shield)'], f: 'Magikarp from Paldea Evolved is the newest one.'},
  {l: 'm', q: 'In which set did the Classic Collection first appear?', o: ['x:Celebrations', 'x:30th Celebration', 'x:Pokémon 151', 'x:Legendary Collection'], f: 'Classic Collection began in Celebrations, for the 25th anniversary.'},
  {l: 'm', q: 'How many cards are in the main English 30th Celebration list, before the secret rares?', o: ['x:128', 'x:102', 'x:158', 'x:165'], f: 'The main list goes to 128. The secret rares go past that.'},
  {l: 'm', q: 'Not counting the bonus Energy, how many cards are in a 30th Celebration booster pack?', o: ['x:5', 'x:10', 'x:3', 'x:11'], f: 'Five cards, including one Pikachu rare, plus a Basic Energy.'},
  {l: 'm', q: 'Which original set is the Classic Collection Shining Celebi from?', o: ['x:Neo Destiny', 'x:Neo Revelation', 'x:Aquapolis', 'x:Skyridge'], f: 'Shining Celebi is from Neo Destiny.'},
  {l: 'm', q: 'Which original set is the Classic Collection Palkia LV.X from?', o: ['x:Great Encounters', 'x:Diamond & Pearl', 'x:Legends Awakened', 'x:Platinum'], p: 'a:me55-20', f: 'Palkia LV.X is from Great Encounters.'},
  {l: 'm', q: 'The 30th Celebration Classic Collection includes a Darkrai & Cresselia LEGEND card.', a: true, p: 'a:me55-74', f: 'It is from Triumphant, and it takes 2 cards to make the full LEGEND.'}
];
const TIER = {little: 'e', big: 'h', master: 'm'};
const P = {little: {name: 'Little Trainer', art: 'me55-23', em: '⚡'}, big: {name: 'Big Trainer', art: 'tcg-714372', em: '🔥'},
  master: {name: 'Master Trainer', art: 'me55-63', em: '👑'}};
const CHEERS = ['Alright!', 'Awesome!', 'You got it!', 'Yes!', 'Great job!'];
let cheerN = 0; const cheer = () => CHEERS[cheerN++ % CHEERS.length];
const decks = {e: [], h: [], m: []};
let T = null;

/* ---------- picture helpers ---------- */
const parse = c => { if (c === 'ball') return {k: 'ball', label: 'Poké Ball'};
  if (c === 'mball') return {k: 'mball', label: 'Master Ball'};
  if (c.startsWith('x:')) return {k: 'x', label: c.slice(2)};       // plain text answer (Master Trainer)
  const [k, v, ...rest] = c.split(':'); const label = rest.join(':');
  if (k === 'a') return {k, id: v, label: PN[v] || ''};
  if (k === 'k') return {k, id: v, label: label || PN[v] || ''};
  return {k, v, label}; };
function picHTML(c, big) {
  const o = parse(c);
  if (o.k === 'a') return `<img class="tv-art" src="${ART(o.id)}" alt="${o.label}" draggable="false">`;
  if (o.k === 'k') return `<img class="tv-card" src="${CARD(o.id)}" alt="${o.label}" draggable="false">`;
  if (o.k === 'e') return `<span class="tv-emo" aria-hidden="true">${o.v}</span>`;
  if (o.k === 'c') return `<span class="tv-swatch" style="background:${o.v}" aria-hidden="true"></span>`;
  if (o.k === 't') return `<span class="tv-num" aria-hidden="true">${o.v}</span>`;
  if (o.k === 'x') return '';
  if (o.k === 'mball') return `<span class="tv-mball${big ? ' big' : ''}" aria-hidden="true"><b>M</b></span>`;
  return `<span class="tv-pball${big ? ' big' : ''}" aria-hidden="true"></span>`;
}
const readable = q => q.ro || q.o.every(c => /^[ectx]:/.test(c));
const listSay = l => (l = l.map((x, i) => i ? x.replace(/^(A|The) /, m => m.toLowerCase()) : x), l).length === 2 ? `${l[0]}, or ${l[1]}?` : l.slice(0, -1).join(', ') + ', or ' + l[l.length - 1] + '?';

/* ---------- pick who's playing ---------- */
const best = k => +(K().store('trivBest.' + k) || 0);
/* 🤫 Secret: tap the big "Pokémon Trivia!" title 7 times within 3 seconds on the Who's playing? screen.
   Nothing hints at it, and the title makes no sound or movement when tapped, so normal tapping around won't find it by accident. */
const unlocked = () => K().store('trivMaster') === '1';
let secretTaps = [];
function secretTap() {
  if (unlocked()) return;
  const now = performance.now();
  secretTaps = secretTaps.filter(t => now - t < 3000); secretTaps.push(now);
  if (secretTaps.length >= 7) { secretTaps = []; reveal(); }
}
function reveal() {
  K().store('trivMaster', '1');
  picker(true);                                   // the Master Trainer button is there now, under the reveal
  const ov = document.createElement('div');
  ov.className = 'tv-secret'; ov.id = 'tvSecret';
  ov.innerHTML = `<div class="tv-secretbox"><div class="tv-rays" aria-hidden="true"></div>
      <div class="tv-crown" aria-hidden="true">👑</div><span class="tv-mball big spin" aria-hidden="true"><b>M</b></span>
      <div class="tv-secretkicker">🤫 SECRET FOUND!</div><div class="tv-secretname">Master Trainer</div>
      <div class="tv-secretsub">Super-hard questions for grown-ups and Pokémon superfans</div>
      <div class="tc-winbtns"><button class="btn tv-goldbtn" id="tvSecretGo">👑 Play Master Trainer</button>
        <button class="btn blue" id="tvSecretLater">Not now</button></div></div>`;
  document.body.appendChild(ov);
  K().SFX.secret(); K().confetti(140); K().later(() => K().confetti(90), 900);
  K().say('Whoa! You found the secret Master Trainer mode! Only real Pokémon Masters can beat it!');
  const close = () => { const o = document.getElementById('tvSecret'); if (o) o.remove(); };
  document.getElementById('tvSecretGo').onclick = () => { close(); begin('master'); };
  document.getElementById('tvSecretLater').onclick = () => { K().SFX.tap(); close(); };
}
function picker(quiet) {
  K().clearTimers(); T = null; secretTaps = [];
  const old = document.getElementById('tvSecret'); if (old) old.remove();
  const tile = k => `<button class="tv-player ${k}" data-mode="${k}" aria-label="${P[k].name}">
      <span class="tv-pava"><img src="${ART(P[k].art)}" alt="" draggable="false"></span>
      <span class="tv-pname">${P[k].name}</span><span class="tv-psub">${k === 'little' ? 'easy questions' : 'harder questions'}</span>
      <span class="tv-best">🏆 Best: <b>${best(k)}</b> ⭐</span></button>`;
  K().frame('Pokémon Trivia', `<div class="tv-pick">
      <div class="tv-title" id="tvTitle"><span class="fg-bounce">❓</span> Pokémon Trivia! <span class="fg-bounce d2">⭐</span></div>
      <div class="tv-hello">Who's playing?</div>
      <div class="tv-players">${tile('little')}${tile('big')}
        <button class="tv-player turns" data-mode="turns" aria-label="Take turns, two players">
          <span class="tv-pava two"><img src="${ART(P.little.art)}" alt="" draggable="false"><img src="${ART(P.big.art)}" alt="" draggable="false"></span>
          <span class="tv-pname">Take Turns</span><span class="tv-psub">2 players · 5 questions each</span></button>
        ${unlocked() ? `<button class="tv-player master" data-mode="master" aria-label="Master Trainer, super hard questions">
          <span class="tv-pava"><img src="${ART(P.master.art)}" alt="" draggable="false"><i aria-hidden="true">👑</i></span>
          <span class="tv-mtext"><span class="tv-pname">Master Trainer</span><span class="tv-psub">super-hard questions · for superfans</span>
          <span class="tv-best">🏆 Best: <b>${best('master')}</b> ⭐</span></span></button>` : ''}
      </div></div>`, '<div class="tv-barfill"></div>');
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => begin(b.dataset.mode));
  document.getElementById('tvTitle').addEventListener('pointerdown', secretTap);
  if (!quiet) K().say("Pokémon Trivia! Who's playing? Pikachu is the Little Trainer. Charizard is the Big Trainer. Both of them, to take turns!" +
    (unlocked() ? ' Or Mewtwo, the Master Trainer, for super hard questions!' : ''));
}

/* ---------- a round ---------- */
function draw(tier, n) {                       // n questions, about half true/false, no repeats until the tier runs out
  const out = [];
  const want = {tf: Math.ceil(n / 2), mc: Math.floor(n / 2)};
  for (let pass = 0; pass < 2 && out.length < n; pass++) {
    if (decks[tier].length < n) decks[tier] = K().shuffle(BANK.filter(q => q.l === tier)).concat(decks[tier]);
    const keep = [];
    while (decks[tier].length && out.length < n) {
      const q = decks[tier].pop(), t = 'a' in q ? 'tf' : 'mc';
      if (pass === 0 && want[t] <= 0) { keep.push(q); continue; }
      want[t]--; out.push(q);
    }
    decks[tier].push(...keep);
  }
  return K().shuffle(out);
}
function begin(mode) {
  K().clearTimers(); K().SFX.match();
  const qs = mode === 'turns'
    ? (() => { const a = draw('e', 5), b = draw('h', 5); return a.flatMap((q, i) => [{q, who: 'little'}, {q: b[i], who: 'big'}]); })()
    : draw(TIER[mode], 10).map(q => ({q, who: mode}));
  T = {mode, qs, i: 0, stars: {little: 0, big: 0, master: 0}, res: [], tfTold: false, mcTold: false};
  const hi = mode === 'turns' ? "Alright, let's go! Little Trainer, I choose you!"
    : mode === 'master' ? "Alright, let's go! Master Trainer, I choose you! These are the hardest questions of all." : `Alright, let's go! ${P[mode].name}, I choose you!`;
  showQ(hi);
}
function scoreBar() {
  const box = k => `<div class="fg-starbox tv-score ${T.mode !== 'turns' ? (T.mode === 'master' ? 'master' : '') : T.qs[T.i].who === k ? 'on' : 'off'}" id="tvS_${k}" aria-label="${P[k].name}: ${T.stars[k]} stars">
      <img src="${ART(P[k].art)}" alt="" draggable="false"><span>⭐</span><b>${T.stars[k]}</b></div>`;
  const dots = T.qs.map((x, i) => `<i class="${i < T.res.length ? (T.res[i] ? 'ok' : 'no') : i === T.i ? 'now' : ''} ${T.mode === 'turns' ? x.who : ''}"></i>`).join('');
  return `<div class="tv-dots" aria-label="Question ${T.i + 1} of ${T.qs.length}">${dots}</div>` +
    (T.mode === 'turns' ? box('little') + box('big') : box(T.mode));
}
function questionLine(q, first) {             // first = add the how-to line (first time this round, and on 🔊 replay)
  if (T.mode === 'master') first = false;      // readers: no kid how-to lines
  if ('a' in q) return 'True or false? ' + q.q + (first ? ' Thumbs up for true. Thumbs down for false.' : '');
  if (readable(q)) return q.q + ' ' + listSay(T.opts.map(c => parse(c).label));
  return q.q + (first ? ' Tap the right picture.' : '');
}
function showQ(prefix = '') {
  const {q, who} = T.qs[T.i], tf = 'a' in q;
  T.answered = false;
  T.opts = tf ? [] : K().shuffle(q.o.slice());
  const turnTag = T.mode === 'turns' ? `<div class="tv-turn ${who}"><img src="${ART(P[who].art)}" alt="" draggable="false">${P[who].name}'s turn!</div>` : '';
  const pc = q.p || (T.mode === 'master' ? 'mball' : 'e:❓:Question');   // no picture: a big bouncing ❓ (a Master Ball in Master mode)
  const pic = `<div class="tv-pic ${parse(pc).k}${q.p ? '' : T.mode === 'master' ? ' mqmark' : ' qmark'}">${picHTML(pc, true)}</div>`;
  const opts = tf
    ? `<div class="tv-opts tf" id="tvOpts">
        <button class="tv-opt yes" data-v="1" aria-label="True"><span class="tv-thumb">👍</span><span class="tv-tfw">✅ TRUE</span></button>
        <button class="tv-opt no" data-v="0" aria-label="False"><span class="tv-thumb">👎</span><span class="tv-tfw">❌ FALSE</span></button></div>`
    : `<div class="tv-opts mc n${T.opts.length} ${readable(q) ? 'labeled' : 'pics'}" id="tvOpts">${T.opts.map(c => { const o = parse(c);
        return `<button class="tv-opt k-${o.k}" data-v="${q.o.indexOf(c)}" aria-label="${o.label}">${picHTML(c)}<span class="tv-lab">${o.label}</span></button>`; }).join('')}</div>`;
  K().frame('Pokémon Trivia', `<div class="tv ${T.mode}" id="tv">
      <div class="tv-q">${turnTag}${pic}
        <div class="tv-bubble"><button class="fg-icon tv-hear" id="tvHear" aria-label="Hear it again">🔊</button>
          <div class="tv-text">${tf ? '<span class="tv-tag">True or false?</span> ' : ''}${q.q}</div></div></div>
      ${opts}
      <div class="tv-nextrow"><button class="btn red tv-next" id="tvNext">${T.i + 1 < T.qs.length ? 'Next ▶' : '🏆 My stars!'}</button></div>
    </div><div class="fg-win" id="tvWin" hidden></div>`, scoreBar());
  const first = tf ? !T.tfTold : !T.mcTold; if (tf) T.tfTold = true; else if (!readable(q)) T.mcTold = true;
  T.line = (prefix ? prefix + ' ' : '') + (T.mode === 'turns' && !prefix ? P[who].name + ', your turn! ' : '') + questionLine(q, first);
  document.getElementById('tvHear').onclick = () => K().say(forEar(T.answered ? T.after : questionLine(q, true)));
  document.getElementById('tvOpts').addEventListener('click', e => { const b = e.target.closest('.tv-opt'); if (b) answer(b); });
  document.getElementById('tvNext').onclick = next;
  K().say(forEar(T.line));
}
function answer(b) {
  if (T.answered) return;
  const {q, who} = T.qs[T.i], tf = 'a' in q;
  const right = tf ? (b.dataset.v === '1') === q.a : b.dataset.v === '0';
  T.answered = true; T.res.push(right);
  const all = [...document.querySelectorAll('.tv-opt')];
  const good = tf ? all.find(o => (o.dataset.v === '1') === q.a) : all.find(o => o.dataset.v === '0');
  document.getElementById('tvOpts').classList.add('done');
  if (right) {
    T.stars[who]++; K().SFX.match();
    b.classList.add('right'); all.forEach(o => { if (o !== b) o.classList.add('gone'); });
    const s = document.getElementById('tvS_' + who); if (s) { s.querySelector('b').textContent = T.stars[who]; s.classList.remove('pop', 'lose', 'wobble'); void s.offsetWidth; s.classList.add('pop'); }
    T.after = cheer() + ' ' + q.f;
    K().confetti(50, b);
  } else {
    K().SFX.aww();
    b.classList.add('wrong'); b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle');
    good.classList.add('right', 'show'); all.forEach(o => { if (o !== good && o !== b) o.classList.add('gone'); });
    loseStar(who);
    T.after = T.mode === 'master'
      ? 'Not quite! ' + (tf ? `It's ${q.a ? 'true' : 'false'}. ` : `The answer is ${parse(q.o[0]).label}. `) + q.f
      : 'Oh no! ' + (tf ? `It's ${q.a ? 'true' : 'false'}. ` : "It's this one. ") + q.f;
  }
  const dots = document.querySelectorAll('.tv-dots i'); if (dots[T.i]) { dots[T.i].classList.remove('now'); dots[T.i].classList.add(right ? 'ok' : 'no'); }
  document.getElementById('tv').classList.add('answered');
  K().say(forEar(T.after));
  K().later(() => { const n = document.getElementById('tvNext'); if (n) n.classList.add('want'); }, 900);
}
function loseStar(who) {
  const box = document.getElementById('tvS_' + who); if (!box) return; const s = box.querySelector('b');
  box.classList.remove('pop', 'lose', 'wobble'); void box.offsetWidth;
  if (T.stars[who] <= 0) { box.classList.add('wobble'); return; }          // at 0: a gentle wobble, nothing taken away
  T.stars[who]--; s.textContent = T.stars[who]; box.classList.add('lose');
  const r = box.getBoundingClientRect(), f = document.createElement('div');  // big "−1 ⭐" that pops out and floats away
  f.className = 'fg-minus'; f.innerHTML = '−1 <span>⭐</span>'; f.setAttribute('aria-hidden', 'true');
  f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.bottom + 8) + 'px';
  document.body.appendChild(f); setTimeout(() => f.remove(), 1700);
}
function next() {
  if (!T || !T.answered) return;
  K().clearTimers();
  T.i++;
  if (T.i >= T.qs.length) return finish();          // the fanfare is this tap's one sound
  K().SFX.tap(); showQ(); scrollTo(0, 0);
}
const starRow = (n, of) => '⭐'.repeat(n) + `<span class="tv-dim">${'⭐'.repeat(Math.max(0, of - n))}</span>`;
const starWord = n => n === 1 ? '1 star' : n + ' stars';
function finish() {
  const w = document.getElementById('tvWin'); if (!w) return;
  let html, line;
  if (T.mode === 'turns') {
    const nb = {};
    ['little', 'big'].forEach(k => { const key = 'turns.' + k; nb[k] = T.stars[k] > best(key); if (nb[k]) K().store('trivBest.' + key, T.stars[k]); });
    html = `<div class="fg-big">Great job, trainers!</div>
      <div class="tv-both">${['little', 'big'].map(k => `<div class="tv-one ${k}"><img src="${ART(P[k].art)}" alt="" draggable="false">
        <div class="tv-oname">${P[k].name}</div><div class="tv-onum">${T.stars[k]} ⭐</div><div class="tv-orow">${starRow(T.stars[k], 5)}</div>
        ${nb[k] ? '<div class="tv-new">🏆 New best!</div>' : ''}</div>`).join('')}</div>`;
    line = `Little Trainer got ${starWord(T.stars.little)}! Big Trainer got ${starWord(T.stars.big)}! Great job, trainers!`;
  } else {
    const n = T.stars[T.mode], old = best(T.mode), nb = n > old; if (nb) K().store('trivBest.' + T.mode, n);
    html = `<div class="fg-pikas"><span class="fg-bounce">⭐</span><img class="fg-bounce d1" src="${ART(P[T.mode].art)}" alt="" draggable="false"><span class="fg-bounce d2">⭐</span></div>
      <div class="fg-big">You got ${starWord(n)}!</div><div class="tv-orow big">${starRow(n, 10)}</div>
      <div class="fg-sub">${nb ? '🏆 New best score!' : `🏆 Best: ${Math.max(old, n)} ⭐`}</div>`;
    line = `You got ${starWord(n)}! ` + (T.mode === 'master'
      ? (n >= 8 ? 'Incredible! You really are a Pokémon Master!' : n >= 4 ? 'Nice work, Master Trainer!' : 'These are tough ones! Try again!')
      : (n >= 8 ? "Awesome! You're a Pokémon Master!" : n >= 4 ? 'Great job, trainer!' : "That's okay! Let's play again!")) + (nb && n > 0 ? " That's your new best!" : '');
  }
  w.innerHTML = `<div class="fg-winbox tv-winbox ${T.mode === 'master' ? 'master' : ''}">${html}
    <div class="tc-winbtns"><button class="btn red fg-again" id="tvAgain">🔁 Play again</button><button class="btn blue fg-again" id="tvWho">👥 Who's playing?</button></div></div>`;
  w.hidden = false; K().SFX.win(); K().say(line); K().confetti(120); K().later(() => K().confetti(80), 1000);
  document.getElementById('tvAgain').onclick = () => begin(T.mode);
  document.getElementById('tvWho').onclick = () => { K().SFX.tap(); picker(); };
}

function render() { picker(); }
// test hooks for headless checks
return {render, BANK, forEar, _state: () => T, _count: () => ({easy: BANK.filter(q => q.l === 'e').length, harder: BANK.filter(q => q.l === 'h').length,
  master: BANK.filter(q => q.l === 'm').length})};
})();
