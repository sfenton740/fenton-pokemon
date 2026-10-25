/* Pokémon Trivia - true/false + picture questions for little trainers (#/games/trivia).
   🐣 Little Trainer = easy questions (age 4), 🔥 Big Trainer = harder ones (age 6), 👥 Take Turns = both, 5 questions each.
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
  'tcg-714372': 'Charizard', 'me55-58': 'Toxel', 'me55-109': 'Salamence', 'me55-106': 'Zacian'};
// How speech should say tricky words (the screen shows the real word). Longest first.
const EAR = [['Poké Balls', 'Pokay Balls'], ['Poké Ball', 'Pokay Ball'], ['Poké Flute', 'Pokay Flute'], ['Pokédex', 'Pokay-dex'],
  ['Pokémon ex', 'Pokémon E X'], ['HP', 'H P'], ['Ninetales', 'Nine-tails'], ['Meowth', 'Mee-owth'], ['Gengar', 'Ghen-gar'],
  ['Lapras', 'Lap-rus'], ['Mewtwo', 'Mew two'], ['Espeon', 'Ess-pee-on'], ['Umbreon', 'Um-bree-on'], ['Sylveon', 'Sil-vee-on'],
  ['Lucario', 'Loo-car-ee-oh'], ['Zoroark', 'Zor-oh-ark'], ['Zorua', 'Zor-oo-uh'], ['Lugia', 'Loo-gee-uh'], ['Ho-Oh', 'Ho Oh'],
  ['Zapdos', 'Zap-dose'], ['Articuno', 'Ar-tih-coo-no'], ['Moltres', 'Mol-tress'], ['Kyogre', 'Kai-oh-ger'], ['Groudon', 'Grow-don'],
  ['Greninja', 'Greh-nin-juh'], ['Jirachi', 'Jih-rah-chee'], ['Toxtricity', 'Tox-trih-city'], ['Toxel', 'Tox-ell'], ['Salamence', 'Sal-uh-mence'],
  ['Zacian', 'Zah-see-an'], ['Azumarill', 'Ah-zoo-marill'], ['Raichu', 'Rye-choo'], ['Charmeleon', 'Char-meal-ee-un'], ['Gyarados', 'Gyare-uh-dose'],
  ['Murkrow', 'Murk-row'], ['Ketchum', 'Ketch-um']];
const forEar = t => { t = t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B50}]/gu, '').replace(/\s+/g, ' ').trim(); EAR.forEach(([a, b]) => { t = t.split(a).join(b); }); return t; };

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
  {l: 'h', q: 'Fire Pokémon like Vulpix are weak to Water.', a: true, p: 'k:me55-9', f: 'Look at the bottom of the card. Vulpix is weak to Water!'}
];
const TIER = {little: 'e', big: 'h'};
const P = {little: {name: 'Little Trainer', art: 'me55-23', em: '⚡'}, big: {name: 'Big Trainer', art: 'tcg-714372', em: '🔥'}};
const CHEERS = ['Alright!', 'Awesome!', 'You got it!', 'Yes!', 'Great job!'];
let cheerN = 0; const cheer = () => CHEERS[cheerN++ % CHEERS.length];
const decks = {e: [], h: []};
let T = null;

/* ---------- picture helpers ---------- */
const parse = c => { if (c === 'ball') return {k: 'ball', label: 'Poké Ball'};
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
  return `<span class="tv-pball${big ? ' big' : ''}" aria-hidden="true"></span>`;
}
const readable = q => q.ro || q.o.every(c => /^[ect]:/.test(c));
const listSay = l => (l = l.map((x, i) => i ? x.replace(/^(A|The) /, m => m.toLowerCase()) : x), l).length === 2 ? `${l[0]}, or ${l[1]}?` : l.slice(0, -1).join(', ') + ', or ' + l[l.length - 1] + '?';

/* ---------- pick who's playing ---------- */
const best = k => +(K().store('trivBest.' + k) || 0);
function picker() {
  K().clearTimers(); T = null;
  const tile = k => `<button class="tv-player ${k}" data-mode="${k}" aria-label="${P[k].name}">
      <span class="tv-pava"><img src="${ART(P[k].art)}" alt="" draggable="false"></span>
      <span class="tv-pname">${P[k].name}</span><span class="tv-psub">${k === 'little' ? 'easy questions' : 'harder questions'}</span>
      <span class="tv-best">🏆 Best: <b>${best(k)}</b> ⭐</span></button>`;
  K().frame('Pokémon Trivia', `<div class="tv-pick">
      <div class="tv-title"><span class="fg-bounce">❓</span> Pokémon Trivia! <span class="fg-bounce d2">⭐</span></div>
      <div class="tv-hello">Who's playing?</div>
      <div class="tv-players">${tile('little')}${tile('big')}
        <button class="tv-player turns" data-mode="turns" aria-label="Take turns, two players">
          <span class="tv-pava two"><img src="${ART(P.little.art)}" alt="" draggable="false"><img src="${ART(P.big.art)}" alt="" draggable="false"></span>
          <span class="tv-pname">Take Turns</span><span class="tv-psub">2 players · 5 questions each</span></button>
      </div></div>`, '<div class="tv-barfill"></div>');
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => begin(b.dataset.mode));
  K().say("Pokémon Trivia! Who's playing? Pikachu is the Little Trainer. Charizard is the Big Trainer. Both of them, to take turns!");
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
  T = {mode, qs, i: 0, stars: {little: 0, big: 0}, res: [], tfTold: false, mcTold: false};
  const hi = mode === 'turns' ? "Alright, let's go! Little Trainer, I choose you!" : `Alright, let's go! ${P[mode].name}, I choose you!`;
  showQ(hi);
}
function scoreBar() {
  const box = k => `<div class="fg-starbox tv-score ${T.mode !== 'turns' ? '' : T.qs[T.i].who === k ? 'on' : 'off'}" id="tvS_${k}" aria-label="${P[k].name}: ${T.stars[k]} stars">
      <img src="${ART(P[k].art)}" alt="" draggable="false"><span>⭐</span><b>${T.stars[k]}</b></div>`;
  const dots = T.qs.map((x, i) => `<i class="${i < T.res.length ? (T.res[i] ? 'ok' : 'no') : i === T.i ? 'now' : ''} ${T.mode === 'turns' ? x.who : ''}"></i>`).join('');
  return `<div class="tv-dots" aria-label="Question ${T.i + 1} of ${T.qs.length}">${dots}</div>` +
    (T.mode === 'turns' ? box('little') + box('big') : box(T.mode));
}
function questionLine(q, first) {             // first = add the how-to line (first time this round, and on 🔊 replay)
  if ('a' in q) return 'True or false? ' + q.q + (first ? ' Thumbs up for true. Thumbs down for false.' : '');
  if (readable(q)) return q.q + ' ' + listSay(T.opts.map(c => parse(c).label));
  return q.q + (first ? ' Tap the right picture.' : '');
}
function showQ(prefix = '') {
  const {q, who} = T.qs[T.i], tf = 'a' in q;
  T.answered = false;
  T.opts = tf ? [] : K().shuffle(q.o.slice());
  const turnTag = T.mode === 'turns' ? `<div class="tv-turn ${who}"><img src="${ART(P[who].art)}" alt="" draggable="false">${P[who].name}'s turn!</div>` : '';
  const pc = q.p || 'e:❓:Question';            // no picture with the question: a big bouncing ❓
  const pic = `<div class="tv-pic ${parse(pc).k}${q.p ? '' : ' qmark'}">${picHTML(pc, true)}</div>`;
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
    T.after = 'Oh no! ' + (tf ? `It's ${q.a ? 'true' : 'false'}. ` : "It's this one. ") + q.f;
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
    line = `You got ${starWord(n)}! ` + (n >= 8 ? "Awesome! You're a Pokémon Master!" : n >= 4 ? 'Great job, trainer!' : "That's okay! Let's play again!") + (nb && n > 0 ? " That's your new best!" : '');
  }
  w.innerHTML = `<div class="fg-winbox tv-winbox">${html}
    <div class="tc-winbtns"><button class="btn red fg-again" id="tvAgain">🔁 Play again</button><button class="btn blue fg-again" id="tvWho">👥 Who's playing?</button></div></div>`;
  w.hidden = false; K().SFX.win(); K().say(line); K().confetti(120); K().later(() => K().confetti(80), 1000);
  document.getElementById('tvAgain').onclick = () => begin(T.mode);
  document.getElementById('tvWho').onclick = () => { K().SFX.tap(); picker(); };
}

function render() { picker(); }
// test hooks for headless checks
return {render, BANK, _state: () => T, _count: () => ({easy: BANK.filter(q => q.l === 'e').length, harder: BANK.filter(q => q.l === 'h').length})};
})();
