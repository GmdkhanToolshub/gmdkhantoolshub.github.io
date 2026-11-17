/* Kids Corner: Mango the Talking Cat.
   An original cartoon cat. Everything runs on this device: no microphone, no accounts, nothing typed is stored or sent.
   Conversation = an on-device engine (intents, memory of this chat, games, generated stories). Voice = the browser's built-in speech. */
(function () {
  'use strict';
  window.NiaziTools = window.NiaziTools || {};

  /* ---------------------------------------------------------------- content */
  var BAD = /\b(fuck|shit|bitch|bastard|asshole|slut|whore|nigg|cunt|dick|idiot|stupid|moron|hate|rape|sex|porn)\w*/i;
  var SAFETY = /(hurt(s|ing)? me|hit(s|ting)? me|touch(ed|es)? me|abuse|bully|bullied|bullies|scared of (my|him|her)|want to die|kill myself|run away|nobody loves|no one loves|so lonely|feel unsafe|not safe)/i;
  var PERSONAL = /(\b\d{8,}\b|@[a-z0-9.-]+\.[a-z]{2,}|\bmy (home )?address\b|\bi live (at|on|in house)\b|\bphone number\b|\bpassword\b|\bmy school is\b)/i;

  var JOKES = ['Why did the cat sit on the computer? To keep an eye on the mouse!', 'What do you call a pile of kittens? A meow-ntain!', 'Why was the cat so good at video games? It had nine lives!', 'What do you get when you cross a cat and a lemon? A sour-puss!', 'What is a cat’s favourite colour? Purr-ple!', 'Why do bananas wear sunscreen? So they do not peel!', 'What did the ocean say to the beach? Nothing, it just waved!', 'Why can’t a bike stand up by itself? Because it is two-tired!', 'Why did the teddy bear say no to dessert? Because she was already stuffed!', 'What is a ghost’s favourite fruit? Boo-berries!', 'Why did the scarecrow win a prize? He was outstanding in his field!', 'Why was the math book sad? It had too many problems!', 'What do you call a sleeping dinosaur? A dino-snore!', 'Why did the cookie go to the doctor? It felt crumby!', 'Why do cows wear bells? Because their horns do not work!', 'What do you call a dog magician? A labra-cadabra-dor!', 'What did one wall say to the other wall? I will meet you at the corner!', 'What do you call a bear with no teeth? A gummy bear!', 'Why did the robot go on holiday? It needed to recharge its batteries!', 'What do elephants have that no other animal has? Baby elephants!'];
  var RIDDLES = [
    { q: 'I have hands but I cannot clap. What am I?', a: ['clock', 'watch'] }, { q: 'What has to be broken before you can use it?', a: ['egg'] },
    { q: 'I am tall when I am young and short when I am old. What am I?', a: ['candle'] }, { q: 'What has a neck but no head?', a: ['bottle', 'shirt'] },
    { q: 'What gets wetter the more it dries?', a: ['towel'] }, { q: 'I have keys but no locks. What am I?', a: ['keyboard', 'piano'] },
    { q: 'What can you catch but never throw?', a: ['cold', 'a cold'] }, { q: 'I am round, I am bright, and I come out at night. What am I?', a: ['moon'] },
    { q: 'What has one eye but cannot see?', a: ['needle'] }, { q: 'What building has the most stories?', a: ['library'] },
    { q: 'What has teeth but cannot bite?', a: ['comb'] }, { q: 'What is full of holes but can still hold water?', a: ['sponge'] },
    { q: 'I follow you everywhere, but I am not alive. What am I?', a: ['shadow'] }, { q: 'What can run but never walks?', a: ['water', 'river', 'tap', 'nose'] }
  ];
  var FACTS = {
    space: ['The Sun is a star, and it is so big that more than a million Earths could fit inside it.', 'A day on Venus is longer than a year on Venus!', 'Saturn is so light for its size that it would float in a giant bathtub of water.', 'Footprints on the Moon can stay for millions of years because there is no wind.'],
    dinosaur: ['The word dinosaur means terrible lizard.', 'Some dinosaurs had feathers, and birds are their living relatives.', 'Some Tyrannosaurus rex teeth were as big as bananas!', 'Many dinosaurs laid eggs, just like birds do today.'],
    ocean: ['An octopus has three hearts!', 'The blue whale is the biggest animal that has ever lived, bigger than any dinosaur.', 'Dolphins sleep with half of their brain awake.', 'Sharks have been around for longer than trees!'],
    cat: ['Cats sleep for 12 to 16 hours a day. I take it very seriously.', 'A cat’s whiskers help it feel the space around it, even in the dark.', 'Cats can make more than a hundred different sounds. Meow!', 'A cat can jump about five times its own height.'],
    animal: ['A giraffe has only seven neck bones, the same number as you!', 'A camel’s hump stores fat, not water.', 'Butterflies taste with their feet.', 'An elephant cannot jump, but it can swim very well.', 'Penguins have wings that work like flippers for swimming.'],
    body: ['Your heart is about as big as your fist.', 'A baby has about 300 bones, but a grown-up has 206.', 'Your skin is the biggest organ of your body.', 'You blink about 15 to 20 times every minute!'],
    weather: ['A lightning bolt is hotter than the surface of the Sun!', 'Every snowflake has six sides.', 'A rainbow is really a full circle, but from the ground we see only half.', 'Clouds can weigh as much as a hundred elephants.'],
    earth: ['K2, in Pakistan, is the second highest mountain in the world.', 'The Indus is one of the longest rivers in Asia, and it flows through Pakistan.', 'More than two thirds of our planet is covered by water.', 'Trees give us oxygen to breathe. Hug a tree today!'],
    sport: ['Cricket is a bat and ball game that millions of children in Pakistan love to play.', 'Football is played in almost every country in the world.', 'Running makes your heart stronger. Ready, steady, go!']
  };
  var FACT_KEYS = [[/space|planet|moon|sun\b|star|galaxy|rocket|astronaut|mars|jupiter|saturn|earth/, 'space'], [/dino|rex|fossil/, 'dinosaur'], [/ocean|sea\b|fish|shark|whale|dolphin|octopus|water/, 'ocean'], [/\bcats?\b|kitten|whisker|purr|meow/, 'cat'], [/animal|giraffe|camel|elephant|lion|tiger|bird|butterfly|penguin|zoo/, 'animal'], [/body|heart|bone|skin|brain|tooth|teeth/, 'body'], [/weather|rain|snow|cloud|lightning|rainbow|storm|wind/, 'weather'], [/pakistan|lahore|karachi|mountain|river|tree|forest|nature/, 'earth'], [/cricket|football|soccer|sport|game|run\b|running/, 'sport']];
  var ANIMALS = [
    { n: 'cat', big: 0, fly: 0, swim: 0, fur: 1, pet: 1, farm: 0, wild: 0, meat: 1, legs: 4, col: ['orange', 'black', 'white', 'grey'], wings: 0, stripes: 0 },
    { n: 'dog', big: 0, fly: 0, swim: 1, fur: 1, pet: 1, farm: 0, wild: 0, meat: 1, legs: 4, col: ['brown', 'black', 'white'], wings: 0, stripes: 0 },
    { n: 'cow', big: 1, fly: 0, swim: 0, fur: 1, pet: 0, farm: 1, wild: 0, meat: 0, legs: 4, col: ['black', 'white', 'brown'], wings: 0, stripes: 0 },
    { n: 'horse', big: 1, fly: 0, swim: 0, fur: 1, pet: 0, farm: 1, wild: 0, meat: 0, legs: 4, col: ['brown', 'black', 'white'], wings: 0, stripes: 0 },
    { n: 'elephant', big: 1, fly: 0, swim: 1, fur: 0, pet: 0, farm: 0, wild: 1, meat: 0, legs: 4, col: ['grey'], wings: 0, stripes: 0 },
    { n: 'lion', big: 1, fly: 0, swim: 0, fur: 1, pet: 0, farm: 0, wild: 1, meat: 1, legs: 4, col: ['yellow', 'brown'], wings: 0, stripes: 0 },
    { n: 'tiger', big: 1, fly: 0, swim: 1, fur: 1, pet: 0, farm: 0, wild: 1, meat: 1, legs: 4, col: ['orange', 'black'], wings: 0, stripes: 1 },
    { n: 'zebra', big: 1, fly: 0, swim: 0, fur: 1, pet: 0, farm: 0, wild: 1, meat: 0, legs: 4, col: ['black', 'white'], wings: 0, stripes: 1 },
    { n: 'giraffe', big: 1, fly: 0, swim: 0, fur: 1, pet: 0, farm: 0, wild: 1, meat: 0, legs: 4, col: ['yellow', 'brown'], wings: 0, stripes: 0 },
    { n: 'monkey', big: 0, fly: 0, swim: 0, fur: 1, pet: 0, farm: 0, wild: 1, meat: 0, legs: 2, col: ['brown'], wings: 0, stripes: 0 },
    { n: 'rabbit', big: 0, fly: 0, swim: 0, fur: 1, pet: 1, farm: 0, wild: 0, meat: 0, legs: 4, col: ['white', 'brown', 'grey'], wings: 0, stripes: 0 },
    { n: 'sheep', big: 0, fly: 0, swim: 0, fur: 1, pet: 0, farm: 1, wild: 0, meat: 0, legs: 4, col: ['white'], wings: 0, stripes: 0 },
    { n: 'camel', big: 1, fly: 0, swim: 0, fur: 1, pet: 0, farm: 1, wild: 0, meat: 0, legs: 4, col: ['brown', 'yellow'], wings: 0, stripes: 0 },
    { n: 'duck', big: 0, fly: 1, swim: 1, fur: 0, pet: 0, farm: 1, wild: 0, meat: 0, legs: 2, col: ['yellow', 'white', 'brown'], wings: 1, stripes: 0 },
    { n: 'parrot', big: 0, fly: 1, swim: 0, fur: 0, pet: 1, farm: 0, wild: 0, meat: 0, legs: 2, col: ['green', 'red', 'yellow'], wings: 1, stripes: 0 },
    { n: 'eagle', big: 0, fly: 1, swim: 0, fur: 0, pet: 0, farm: 0, wild: 1, meat: 1, legs: 2, col: ['brown', 'white'], wings: 1, stripes: 0 },
    { n: 'penguin', big: 0, fly: 0, swim: 1, fur: 0, pet: 0, farm: 0, wild: 1, meat: 1, legs: 2, col: ['black', 'white'], wings: 1, stripes: 0 },
    { n: 'dolphin', big: 1, fly: 0, swim: 1, fur: 0, pet: 0, farm: 0, wild: 1, meat: 1, legs: 0, col: ['grey'], wings: 0, stripes: 0 },
    { n: 'fish', big: 0, fly: 0, swim: 1, fur: 0, pet: 1, farm: 0, wild: 0, meat: 0, legs: 0, col: ['orange', 'yellow', 'blue'], wings: 0, stripes: 0 },
    { n: 'frog', big: 0, fly: 0, swim: 1, fur: 0, pet: 0, farm: 0, wild: 1, meat: 1, legs: 4, col: ['green'], wings: 0, stripes: 0 },
    { n: 'snake', big: 0, fly: 0, swim: 1, fur: 0, pet: 0, farm: 0, wild: 1, meat: 1, legs: 0, col: ['green', 'brown'], wings: 0, stripes: 0 },
    { n: 'butterfly', big: 0, fly: 1, swim: 0, fur: 0, pet: 0, farm: 0, wild: 1, meat: 0, legs: 6, col: ['orange', 'yellow', 'blue'], wings: 1, stripes: 0 },
    { n: 'panda', big: 1, fly: 0, swim: 0, fur: 1, pet: 0, farm: 0, wild: 1, meat: 0, legs: 4, col: ['black', 'white'], wings: 0, stripes: 0 },
    { n: 'owl', big: 0, fly: 1, swim: 0, fur: 0, pet: 0, farm: 0, wild: 1, meat: 1, legs: 2, col: ['brown', 'grey', 'white'], wings: 1, stripes: 0 }
  ];
  var WYR = [['be able to fly like a bird', 'be able to swim like a fish'], ['have a pet dinosaur', 'have a pet dragon'], ['live in a treehouse', 'live in a castle'], ['eat ice cream for every meal', 'eat pizza for every meal'], ['talk to animals', 'speak every language in the world'], ['have a robot best friend', 'have a magic paintbrush'], ['explore the deep sea', 'explore outer space'], ['be super fast', 'be super strong'], ['have a rainbow for a slide', 'have a cloud for a bed'], ['be the size of an ant for a day', 'be the size of a giant for a day']];
  var HEROES = ['a tiny kitten called Pip', 'a brave little puppy called Biscuit', 'a sleepy dragon called Ember', 'a curious robot called Bleep', 'a young explorer called Zara'];
  var PLACES = ['a glowing forest', 'a mountain made of marshmallows', 'a city in the clouds', 'a sparkling underwater cave', 'a desert full of singing sand', 'a garden where flowers could talk'];
  var GOALS = ['find the lost rainbow', 'bring back the missing moon', 'deliver a very important cake', 'find the friendliest star', 'teach the wind to whistle a song'];
  var TROUBLES = ['a bridge that giggled and kept moving', 'a grumpy cloud that would not let anyone pass', 'a riddle-loving owl who guarded the path', 'a river that only flowed backwards', 'a giant sneezing hedgehog'];
  var TWISTS = ['said thank you very politely', 'shared a snack with a new friend', 'told the funniest joke ever', 'sang a gentle song', 'simply asked for help'];
  var MORALS = ['And that is how kindness solves almost everything.', 'The lesson? Brave hearts ask for help when they need it.', 'The best adventures are the ones you share with friends.', 'Remember: being curious is a superpower!'];

  var GREET = ['Meow! Hello, friend! I am Mango. What shall we do today?', 'Purrr... hi there! I was just napping. Want to hear a joke?', 'Hello, hello! Mango the cat at your service. Ask me anything!', 'Hey you! Great to see you. Do you like riddles, jokes or games?'];
  var MISCHIEF = ['*knocks a pencil off the table* Oops. Not me!', 'I just saw a red dot on the floor. I must catch it!', 'Fish are my favourite. Do not tell them I said that.', 'I was going to take a nap, but chatting with you is better.', 'I can fit in any box. Even the small ones. Especially the small ones!'];
  var FALLBACK = ['Hmm, that is a tricky one! Shall we try a joke, a riddle or a guessing game instead?', 'Ooh, interesting! My cat brain wants to know more. Can you tell me a bit more?', 'Purr... I am not sure about that one. Want me to tell you a fun fact?', 'Meow? You make me curious! What is your favourite animal?', 'I love chatting with you! Should we play “guess the animal”?'];

  /* ---------------------------------------------------------------- helpers */
  var bags = {};
  function pick(arr, key) { // shuffled bag: no repeats until every item was used
    var b = bags[key]; if (!b || !b.length) { b = arr.map(function (_, i) { return i; }); for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = b[i]; b[i] = b[j]; b[j] = t; } bags[key] = b; }
    return arr[b.pop()];
  }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function norm(s) { return ' ' + String(s || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9؀-ۿ+\-*\/ ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' '; }
  var NUMW = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
  function num(s) { s = String(s).trim(); if (/^\d+$/.test(s)) return +s; return NUMW[s] !== undefined ? NUMW[s] : NaN; }

  /* ---------------------------------------------------------------- the cat */
  function catSVG() {
    var eye = function (x) { return '<g class="kc-pup"><circle cx="' + x + '" cy="150" r="23" fill="url(#kcIris)"/><circle cx="' + x + '" cy="151" r="12.5" fill="#1f1308"/><circle cx="' + (x - 8) + '" cy="140" r="7" fill="#fff"/><circle cx="' + (x + 8) + '" cy="160" r="3.4" fill="#fff" opacity=".9"/></g>'; };
    return '<svg id="kc-svg" class="kc-svg kc-happy" viewBox="0 0 340 400" role="img" aria-label="Mango, a friendly orange cartoon cat wearing a teal scarf"><defs>' +
      '<radialGradient id="kcFur" cx="45%" cy="30%" r="80%"><stop offset="0" stop-color="#fdba74"/><stop offset=".55" stop-color="#fb923c"/><stop offset="1" stop-color="#ea580c"/></radialGradient>' +
      '<radialGradient id="kcCream" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#fed7aa"/></radialGradient>' +
      '<radialGradient id="kcIris" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fde68a"/><stop offset=".6" stop-color="#f59e0b"/><stop offset="1" stop-color="#b45309"/></radialGradient>' +
      '<linearGradient id="kcScarf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#0d9488"/></linearGradient></defs><g class="kc-all">' +
      '<ellipse cx="170" cy="392" rx="120" ry="9" fill="#0f172a" opacity=".18"/>' +
      '<path class="kc-tail" d="M262 346 Q338 336 326 256 Q320 226 292 240" fill="none" stroke="url(#kcFur)" stroke-width="32" stroke-linecap="round"/><path class="kc-tail" d="M318 270 Q326 250 310 238 M308 304 Q324 296 330 280" fill="none" stroke="#9a3412" stroke-width="7" stroke-linecap="round" opacity=".5"/>' +
      '<ellipse cx="170" cy="328" rx="102" ry="64" fill="url(#kcFur)" stroke="#9a3412" stroke-width="5"/><ellipse data-zone="belly" cx="170" cy="342" rx="58" ry="42" fill="url(#kcCream)"/>' +
      '<g class="kc-armL" data-zone="paw"><ellipse cx="82" cy="326" rx="23" ry="44" transform="rotate(14 82 326)" fill="url(#kcFur)" stroke="#9a3412" stroke-width="5"/><ellipse cx="74" cy="364" rx="21" ry="15" fill="url(#kcCream)" stroke="#9a3412" stroke-width="4"/></g>' +
      '<g class="kc-armR" data-zone="paw"><ellipse cx="258" cy="326" rx="23" ry="44" transform="rotate(-14 258 326)" fill="url(#kcFur)" stroke="#9a3412" stroke-width="5"/><ellipse cx="266" cy="364" rx="21" ry="15" fill="url(#kcCream)" stroke="#9a3412" stroke-width="4"/></g>' +
      '<ellipse cx="128" cy="386" rx="34" ry="14" fill="url(#kcCream)" stroke="#9a3412" stroke-width="5"/><ellipse cx="212" cy="386" rx="34" ry="14" fill="url(#kcCream)" stroke="#9a3412" stroke-width="5"/>' +
      '<path d="M98 270 Q170 306 242 270 L238 298 Q170 330 102 298Z" fill="url(#kcScarf)" stroke="#0f766e" stroke-width="4" stroke-linejoin="round"/><path d="M120 286 L124 308 M150 296 L152 318 M190 296 L188 318 M220 286 L216 308" stroke="#99f6e4" stroke-width="5" stroke-linecap="round" opacity=".85"/>' +
      '<path d="M214 298 L252 296 L246 346 L206 336Z" fill="#2dd4bf" stroke="#0f766e" stroke-width="4" stroke-linejoin="round"/>' +
      '<g class="kc-head" data-zone="head">' +
      '<g class="kc-ear kc-earL"><polygon points="70,112 78,16 148,78" fill="url(#kcFur)" stroke="#9a3412" stroke-width="5" stroke-linejoin="round"/><polygon points="90,98 94,44 128,78" fill="#fda4af"/></g>' +
      '<g class="kc-ear kc-earR"><polygon points="270,112 262,16 192,78" fill="url(#kcFur)" stroke="#9a3412" stroke-width="5" stroke-linejoin="round"/><polygon points="250,98 246,44 212,78" fill="#fda4af"/></g>' +
      '<ellipse cx="170" cy="162" rx="126" ry="102" fill="url(#kcFur)" stroke="#9a3412" stroke-width="5"/>' +
      '<polygon points="58,178 20,186 54,198 26,212 64,218" fill="url(#kcFur)" stroke="#9a3412" stroke-width="4" stroke-linejoin="round"/><polygon points="282,178 320,186 286,198 314,212 276,218" fill="url(#kcFur)" stroke="#9a3412" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M170 62 L170 92 M138 68 L146 96 M202 68 L194 96" stroke="#c2410c" stroke-width="8" stroke-linecap="round" opacity=".75"/>' +
      '<ellipse cx="170" cy="214" rx="72" ry="46" fill="url(#kcCream)"/><ellipse class="kc-blush" cx="82" cy="200" rx="18" ry="12" fill="#fb7185"/><ellipse class="kc-blush" cx="258" cy="200" rx="18" ry="12" fill="#fb7185"/>' +
      '<g class="kc-eyes"><ellipse class="kc-white" cx="124" cy="148" rx="31" ry="36" fill="#fff" stroke="#9a3412" stroke-width="4"/><ellipse class="kc-white" cx="216" cy="148" rx="31" ry="36" fill="#fff" stroke="#9a3412" stroke-width="4"/>' + eye(124) + eye(216) +
      '<ellipse class="kc-lid" cx="124" cy="148" rx="33" ry="38" fill="#f9893a" stroke="#9a3412" stroke-width="4"/><ellipse class="kc-lid" cx="216" cy="148" rx="33" ry="38" fill="#f9893a" stroke="#9a3412" stroke-width="4"/></g>' +
      '<path class="kc-brow kc-bL" d="M90 106 Q124 88 156 106" fill="none" stroke="#9a3412" stroke-width="7" stroke-linecap="round"/><path class="kc-brow kc-bR" d="M184 106 Q216 88 250 106" fill="none" stroke="#9a3412" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M156 190 Q170 180 184 190 Q170 206 156 190Z" fill="#f472b6" stroke="#9d174d" stroke-width="3" stroke-linejoin="round"/><ellipse cx="164" cy="188" rx="4" ry="2.5" fill="#fff" opacity=".7"/>' +
      '<path id="kc-mc" d="M170 202 L170 212 M170 212 Q154 228 136 216 M170 212 Q186 228 204 216" fill="none" stroke="#7c2d12" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<g id="kc-mo" style="display:none"><ellipse id="kc-mo-e" cx="170" cy="224" rx="22" ry="12" fill="#7f1d1d" stroke="#7c2d12" stroke-width="4"/><ellipse id="kc-mo-t" cx="170" cy="231" rx="12" ry="5" fill="#f87171"/></g>' +
      '<path class="kc-tongue" d="M160 220 Q170 250 180 220Z" fill="#f87171" stroke="#7c2d12" stroke-width="3"/>' +
      '<g stroke="#9a3412" stroke-width="3" stroke-linecap="round" opacity=".75"><line x1="116" y1="210" x2="36" y2="194"/><line x1="116" y1="218" x2="30" y2="220"/><line x1="120" y1="226" x2="44" y2="246"/><line x1="224" y1="210" x2="304" y2="194"/><line x1="224" y1="218" x2="310" y2="220"/><line x1="220" y1="226" x2="296" y2="246"/></g></g>' +
      '<g class="kc-think" aria-hidden="true"><circle cx="300" cy="86" r="6"/><circle cx="318" cy="60" r="9"/><circle cx="330" cy="26" r="12"/></g></g></svg>';
  }

  function mount(root, U) {
    root.innerHTML = '<div class="kcat"><div class="kc-stage"><div class="kc-bubble" id="kc-bubble" aria-live="polite">Meow! Tap me, or type something below.</div>' + catSVG() +
      '<div class="kc-state" id="kc-state" role="status" aria-live="polite">Ready</div></div>' +
      '<div class="kc-chat"><div class="kc-log" id="kc-log" role="log" aria-live="polite" aria-label="Conversation with Mango"></div>' +
      '<form id="kc-form" class="kc-form" autocomplete="off"><label class="sr-only" for="kc-text">Type a message to Mango</label><input id="kc-text" maxlength="90" placeholder="Say something to Mango…" enterkeyhint="send"><button type="submit" class="btn btn-primary" id="kc-send">Send</button></form>' +
      '<div class="kc-chips" role="group" aria-label="Quick choices"><button type="button" class="pill" data-q="tell me a joke">😹 Joke</button><button type="button" class="pill" data-q="give me a riddle">🧩 Riddle</button><button type="button" class="pill" data-q="let us play guess the animal">🦁 Guess the animal</button><button type="button" class="pill" data-q="tell me a story">📖 Story</button><button type="button" class="pill" data-q="tell me a fun fact">💡 Fun fact</button><button type="button" class="pill" data-q="guess my number game">🔢 Number game</button><button type="button" class="pill" data-q="would you rather">🤔 Would you rather</button></div>' +
      '<div class="kc-tools"><button type="button" class="btn btn-ghost btn-sm" id="kc-mute" aria-pressed="false">🔊 Sound on</button><button type="button" class="btn btn-ghost btn-sm" id="kc-reset">New chat</button></div>' +
      '<p class="small muted kc-note">Mango cannot hear you. Type or tap! Please do not share your real name, address or phone number. Nothing you type is saved or sent anywhere.</p></div></div>';
    var $ = function (s) { return root.querySelector(s); };
    var svg = $('#kc-svg'), bubble = $('#kc-bubble'), logEl = $('#kc-log'), stateEl = $('#kc-state'), inp = $('#kc-text'), muteBtn = $('#kc-mute');
    var synth = window.speechSynthesis, canSpeak = !!(synth && typeof SpeechSynthesisUtterance !== 'undefined'), muted = false, busy = false, talking = false, mouthTimer = null, faceTimer = null, lastTouch = 0;
    var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var mc = $('#kc-mc'), mo = $('#kc-mo'), moe = $('#kc-mo-e'), mot = $('#kc-mo-t');
    var S; function resetState() { S = { likes: {}, game: null, turns: 0, topics: [], asked: {}, lastQ: null, jokes: 0 }; } resetState();

    /* ----- face + mouth ----- */
    function face(name, ms) {
      ['kc-happy', 'kc-surprised', 'kc-sleepy', 'kc-laugh', 'kc-silly', 'kc-sad', 'kc-thinking'].forEach(function (c) { svg.classList.remove(c); }); svg.classList.add('kc-' + name);
      clearTimeout(faceTimer); if (ms) faceTimer = setTimeout(function () { svg.classList.remove('kc-' + name); svg.classList.add('kc-happy'); }, ms);
    }
    function mouth(level) {
      if (!level) { mc.style.display = ''; mo.style.display = 'none'; return; }
      var rx = [0, 17, 22, 25, 12][level], ry = [0, 6, 12, 18, 14][level]; mc.style.display = 'none'; mo.style.display = ''; moe.setAttribute('rx', rx); moe.setAttribute('ry', ry); moe.setAttribute('cy', 212 + ry); mot.setAttribute('cy', 212 + ry * 1.6); mot.setAttribute('rx', Math.max(6, rx * .55)); mot.setAttribute('ry', Math.max(2, ry * .3));
    }
    function startTalk(est) {
      talking = true; svg.classList.add('kc-talk'); stateEl.textContent = 'Speaking…'; clearInterval(mouthTimer); var seq = [2, 1, 3, 2, 4, 1, 2, 0, 3, 1], i = 0;
      if (!reduced) mouthTimer = setInterval(function () { mouth(seq[i++ % seq.length]); }, 105); else mouth(2);
      if (est) setTimeout(function () { if (!canSpeak || muted) stopTalk(); }, est);
    }
    function stopTalk() { talking = false; svg.classList.remove('kc-talk'); clearInterval(mouthTimer); mouth(0); if (!busy) stateEl.textContent = 'Ready'; }

    /* ----- speech ----- */
    function clean(t) { return String(t).replace(/\*[^*]*\*/g, '').replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, '').replace(/\s+/g, ' ').trim(); }
    var voice = null; function pickVoice() { if (!canSpeak) return; var vs = synth.getVoices() || [], en = vs.filter(function (v) { return /^en/i.test(v.lang); }); voice = en.filter(function (v) { return /female|zira|samantha|google uk english female|aria|jenny|natural/i.test(v.name); })[0] || en.filter(function (v) { return v.localService; })[0] || en[0] || null; }
    if (canSpeak) { pickVoice(); if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice); }
    function speak(text) {
      var t = clean(text); if (!t) return;
      if (!canSpeak || muted) { startTalk(Math.min(6000, 700 + t.length * 55)); return; }
      try {
        synth.cancel(); var u = new SpeechSynthesisUtterance(t); if (voice) u.voice = voice; u.lang = 'en-US'; u.pitch = 1.55; u.rate = 1.04; u.volume = 1;
        u.onstart = function () { startTalk(); }; u.onboundary = function () { if (!reduced) mouth(3); }; u.onend = u.onerror = function () { stopTalk(); };
        synth.speak(u); setTimeout(function () { if (!talking && !synth.speaking) startTalk(Math.min(6000, 700 + t.length * 55)); }, 450);
      } catch (e) { startTalk(Math.min(6000, 700 + t.length * 55)); }
    }

    /* ----- chat log ----- */
    function add(who, text) {
      var d = document.createElement('div'); d.className = 'kc-msg kc-' + who; d.textContent = text; logEl.appendChild(d);
      while (logEl.children.length > 40) logEl.removeChild(logEl.firstChild); logEl.scrollTop = logEl.scrollHeight; return d;
    }
    function reply(text, fc, fms) {
      bubble.textContent = text; add('cat', text); face(fc || 'happy', fms || 0); speak(text); busy = false; if (!talking) stateEl.textContent = 'Ready'; try { inp.focus({ preventScroll: true }); } catch (e) { }
    }
    function respond(r) {
      busy = true; var dots = document.createElement('div'); dots.className = 'kc-msg kc-cat kc-typing'; dots.innerHTML = '<span></span><span></span><span></span>'; logEl.appendChild(dots); logEl.scrollTop = logEl.scrollHeight;
      svg.classList.add('kc-think-on'); face('thinking'); stateEl.textContent = 'Thinking…'; if (canSpeak) try { synth.cancel(); } catch (e) { } stopTalk(); stateEl.textContent = 'Thinking…';
      setTimeout(function () { svg.classList.remove('kc-think-on'); if (dots.parentNode) dots.parentNode.removeChild(dots); reply(r.t, r.f, r.ms); }, reduced ? 120 : 520 + Math.random() * 520);
    }

    /* ----- the conversation engine ----- */
    function R(t, f, ms) { return { t: t, f: f, ms: ms }; }
    function remember(text) {
      var m;
      if ((m = text.match(/(?:favou?rite colou?r is|i like the colou?r|my colou?r is) (\w+)/))) { S.likes.color = m[1]; return R(rnd(['Ooh, ' + m[1] + '! That is a lovely colour. I will remember it for this chat.', m[1] + ' is so pretty! I wish my fur was ' + m[1] + ' too.']), 'happy'); }
      if ((m = text.match(/(?:favou?rite animal is|i love|i like|i really like) (?:the |a |an )?([a-z ]{2,18})$/))) { var w = m[1].trim(); if (!/you|it|this|that|games?|chatting|talking/.test(w)) { S.likes.thing = w; var a = ANIMALS.filter(function (x) { return x.n === w || x.n + 's' === w; })[0]; return R(a ? 'A ' + a.n + '! Great choice. Cats and ' + a.n + 's could be friends... maybe. I will remember that you like ' + a.n + 's!' : 'You like ' + w + '? That sounds wonderful! Tell me more about why you like ' + w + '.', 'happy'); } }
      return null;
    }
    function startGuessAnimal() { var a = rnd(ANIMALS); S.game = { type: 'animal', a: a, q: 0 }; S.lastQ = null; return R('Let us play! I am thinking of an animal. You can ask me yes-or-no questions, like “can it fly?” or “is it big?”. When you know, say “is it a ...?”', 'silly', 1800); }
    function animalQuestion(a, t) {
      var ans = function (y, note) { return R((y ? rnd(['Yes!', 'Yep, it does!', 'Correct!']) : rnd(['No!', 'Nope!', 'Not that one!'])) + (note ? ' ' + note : ''), y ? 'happy' : 'surprised', 1500); };
      if (/\b(fly|flies|flying)\b/.test(t)) return ans(a.fly); if (/\b(wings?|feathers?)\b/.test(t)) return ans(a.wings);
      if (/\b(swim|swims|water|sea|ocean)\b/.test(t)) return ans(a.swim); if (/\b(fur|furry|hair|hairy)\b/.test(t)) return ans(a.fur);
      if (/\b(big|large|huge|giant|tall)\b/.test(t)) return ans(a.big); if (/\b(small|little|tiny)\b/.test(t)) return ans(!a.big);
      if (/\b(pet|home|house)\b/.test(t)) return ans(a.pet); if (/\bfarm\b/.test(t)) return ans(a.farm); if (/\b(wild|jungle|forest|zoo)\b/.test(t)) return ans(a.wild);
      if (/\b(meat|hunt|hunts|hunter)\b/.test(t)) return ans(a.meat); if (/\b(grass|plants?|vegetarian|leaves)\b/.test(t)) return ans(!a.meat);
      if (/\bstripe/.test(t)) return ans(a.stripes);
      var lm = t.match(/\b(four|4|two|2|six|6|no|zero|0) legs?\b/); if (lm) { var v = { four: 4, '4': 4, two: 2, '2': 2, six: 6, '6': 6, no: 0, zero: 0, '0': 0 }[lm[1]]; return ans(a.legs === v); }
      var cm = t.match(/\b(orange|black|white|grey|gray|brown|green|yellow|red|blue)\b/); if (cm) return ans(a.col.indexOf(cm[1] === 'gray' ? 'grey' : cm[1]) >= 0, 'Some animals have more than one colour!');
      return null;
    }
    function gameTurn(t, raw) {
      var g = S.game, m;
      if (/\b(stop|quit|enough|no more|end game|new game|something else)\b/.test(t) && !/\bstop it\b/.test(t)) { S.game = null; return R('Okay, game over! That was fun. What shall we do next? A joke, a story or a riddle?', 'happy'); }
      if (g.type === 'animal') {
        g.q++;
        if (/\b(give up|i give up|tell me|dont know|do not know|reveal)\b/.test(t)) { S.game = null; return R('It was a ' + g.a.n + '! Good try. Want to play again?', 'laugh', 1800); }
        var named = ANIMALS.filter(function (x) { return new RegExp('^\\s*(?:(?:is it|its|it is|maybe|i think it is|i think|i guess|my guess is|is|a|an|the)\\s+)*(?:a |an |the )?' + x.n + 's?\\s*$').test(t); })[0];
        if (named) {
          var nm = named.n; if (nm === g.a.n) { S.game = null; return R('YES! It was a ' + g.a.n + '! You got it in ' + g.q + (g.q === 1 ? ' question' : ' questions') + '. You are super clever! Want to play again?', 'laugh', 2200); }
          return R('Not a ' + nm + '! Keep asking me questions.', 'surprised', 1500);
        }
        var q = animalQuestion(g.a, t); if (q) { if (g.q === 8) q.t += ' (Hint: its name starts with the letter ' + g.a.n[0].toUpperCase() + '.)'; return q; }
        if (g.q > 14) { S.game = null; return R('That was a long one! It was a ' + g.a.n + '. Shall we play again?', 'laugh'); }
        return R('Try a yes-or-no question like “does it swim?” or “is it big?”, or say “I give up”.', 'happy');
      }
      if (g.type === 'riddle') {
        if (/\b(hint|clue)\b/.test(t)) return R('Hint: it starts with the letter “' + g.r.a[0][0].toUpperCase() + '”.', 'thinking', 1500);
        if (/\b(give up|dont know|do not know|tell me|answer)\b/.test(t)) { S.game = null; return R('The answer is: ' + g.r.a[0] + '! Want another riddle?', 'silly', 1800); }
        if (g.r.a.some(function (w) { return t.indexOf(' ' + w) >= 0 || t.indexOf(w + ' ') >= 0; })) { S.game = null; return R('Purr-fect! The answer is ' + g.r.a[0] + '! You are so smart. Another riddle?', 'laugh', 2200); }
        g.tries = (g.tries || 0) + 1; if (g.tries >= 3) return R('Not quite! Say “hint” for a clue, or “give up” to hear the answer.', 'happy'); return R(rnd(['Close, but not quite. Try again!', 'Hmm, nope! Think about it once more.', 'Not that one! You can do it!']), 'surprised', 1200);
      }
      if (g.type === 'number') {
        m = t.match(/\b(\d{1,2})\b/) || t.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/); if (!m) return R('Tell me a number from 1 to 10!', 'happy'); var n = num(m[1]); g.tries++;
        if (n === g.n) { S.game = null; return R('YES! It was ' + g.n + '! You found it in ' + g.tries + (g.tries === 1 ? ' try' : ' tries') + '. Hooray! Play again?', 'laugh', 2200); }
        if (g.tries >= 5) { S.game = null; return R('Oh no, out of tries! My number was ' + g.n + '. Want to try again?', 'silly', 1800); }
        return R(n < g.n ? 'Higher! Go up a bit.' : 'Lower! Go down a bit.', 'surprised', 1200);
      }
      if (g.type === 'wyr') { S.game = null; var which = /\b(first|1|one)\b/.test(t) ? 0 : /\b(second|2|two)\b/.test(t) ? 1 : -1; var pair = g.pair; var chosen = which >= 0 ? pair[which] : null; return R(chosen ? 'Great choice! I would ' + chosen + ' too... after a long nap. Want another one?' : 'Ha ha, I like your answer! Want another “would you rather”?', 'happy'); }
      S.game = null; return null;
    }
    function maths(t) {
      var m = t.match(/(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(\+|plus|and|minus|take away|-|times|multiplied by|x|\*|divided by|over|\/)\s*(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)/);
      if (!m || !/what|how|plus|minus|times|divided|\+|\*|\/|sum|equals?|=/.test(t)) return null; var a = num(m[1]), b = num(m[3]), o = m[2]; if (isNaN(a) || isNaN(b) || a > 9999 || b > 9999) return null;
      var r, s; if (/\+|plus|and/.test(o)) { r = a + b; s = '+'; } else if (/minus|take|^-$/.test(o) || o === '-') { r = a - b; s = '−'; } else if (/times|multi|x|\*/.test(o)) { r = a * b; s = '×'; } else { if (b === 0) return R('Dividing by zero? Even a cat cannot do that. The universe would go meow-boom!', 'surprised'); r = a / b; s = '÷'; r = Math.round(r * 100) / 100; }
      return R(a + ' ' + s + ' ' + b + ' = ' + r + '. Easy peasy, lemon squeezy!', 'happy', 1500);
    }
    function think(raw) {
      var t = norm(raw), p; S.turns++;
      if (!t.trim()) return R('Meow? Type something and I will answer!', 'happy');
      if (BAD.test(t)) return R('Oh no, let us use kind words, please. I am a gentle cat. Want to hear a joke?', 'sad', 1800);
      if (SAFETY.test(t)) return R('I am really sorry you feel that way. Please tell a grown-up you trust, like a parent, a teacher or a family member, right now. I am only a cartoon cat, but you matter a lot.', 'sad', 3500);
      if (PERSONAL.test(raw.toLowerCase())) return R('Whoa, let us keep personal things like names, addresses and phone numbers secret online. That is a super rule! What is your favourite animal instead?', 'surprised', 2200);
      if (S.game) { var gr = gameTurn(t, raw); if (gr) return gr; }
      if (/\b(my name is|i am called|call me)\b/.test(t)) return R('Nice to meet you! But it is best not to share your real name online, so I will call you Super Star. What do you like to do for fun?', 'happy');
      if (/\b(hello|hi|hey|hiya|salam|assalam|assalamualaikum|aoa|good morning|good afternoon|good evening|yo)\b/.test(t) && t.split(' ').length < 9) return R(/salam|assalam|aoa/.test(t) ? 'Walaikum assalam! Meow! How are you today?' : pick(GREET, 'greet'), 'happy');
      if (/\b(how are you|how r u|how do you feel|whats up|what is up|sup)\b/.test(t)) return R(rnd(['I am purr-fectly happy now that you are here! How are you?', 'Super! I just had a nap and a snack. How about you?', 'Fluffy and fantastic! And you?']), 'happy');
      if (/\b(i am fine|im fine|i am good|im good|i am great|im great|i am happy|im happy|good thanks|fine thanks|i am okay|im okay)\b/.test(t)) return R('Yay, I am so glad! Shall we play a game or hear a joke?', 'laugh', 1600);
      if (/\b(i am sad|im sad|i feel sad|i am upset|im upset|i am angry|im angry|i feel angry|i am scared|im scared|i am worried|im worried|i cry|crying)\b/.test(t)) return R('I am sorry you feel like that. Big feelings are okay. Try this: breathe in slowly, count to four, and breathe out. It also helps to tell a grown-up you trust. Want a silly joke to help?', 'sad', 3200);
      if (/\b(i am bored|im bored|bored|nothing to do)\b/.test(t)) return R('Bored? Not with Mango around! We can play “guess the animal”, solve a riddle, or I can tell you a story. Which one?', 'silly', 1800);
      if (/\b(i am tired|im tired|sleepy|i am sleepy|good night|goodnight|bedtime|going to bed)\b/.test(t)) return R('Good night! Sleep tight, and have sweet dreams. I will curl up for a nap too. Purrrr...', 'sleepy', 4000);
      if (/\b(bye|goodbye|see you|see ya|gotta go|i have to go|farewell|allah hafiz|khuda hafiz)\b/.test(t)) return R(rnd(['Bye bye, friend! Come back soon. Meow!', 'See you later! I will be here, probably napping.', 'Allah Hafiz, friend! It was lovely chatting with you!']), 'happy', 2000);
      if (/\b(thank you|thanks|thankyou|shukria)\b/.test(t)) return R(rnd(['You are very welcome! Purrrr.', 'Anytime, friend! That is what cats are for.']), 'happy', 1600);
      if (/\b(i love you|love you|you are the best|you are cute|you are funny|you are great|youre the best|youre cute|youre funny)\b/.test(t)) return R(rnd(['Aww, you are making me purr! I like you too!', 'Thank you! You are pretty great yourself!']), 'happy', 2000);
      if (/\b(who are you|your name|what are you called|who r u)\b/.test(t)) return R('I am Mango, an orange cartoon cat who lives right here in Kids Corner! I love jokes, riddles, games and naps.', 'happy');
      if (/\b(are you real|are you a real cat|are you alive|are you a robot|are you ai|are you a person|are you human)\b/.test(t)) return R('I am a cartoon cat made of pictures and code, so I am not a real cat, and I am not a person. But I am a very friendly pretend cat, and I am happy to chat!', 'silly', 2500);
      if (/\b(who made you|who created you|who built you|who is your (maker|owner|creator))\b/.test(t)) return R('A person named Gmd Khan Niazi made me for Kids Corner. He drew me and taught me my jokes!', 'happy');
      if (/\b(can you hear me|do you hear me|listen to me|can you listen|microphone|mic)\b/.test(t)) return R('I cannot hear you, because I do not use a microphone. That keeps you safe and private. Just type, or tap my buttons!', 'happy');
      if (/\b(where do you live|where are you from)\b/.test(t)) return R('I live inside this page, in a cozy corner with a basket, a ball of wool and a very comfy cushion!', 'happy');
      if (/\b(how old are you|your age)\b/.test(t)) return R('I am a cat, so I am nine years old, but I have nine lives, so I am really eighty-one!', 'silly');
      if (/\b(joke|funny|make me laugh|laugh)\b/.test(t)) { S.jokes++; return R(pick(JOKES, 'joke') + ' ' + rnd(['Ha ha ha!', 'Meow-ha-ha!', 'Get it?']), 'laugh', 2600); }
      if (/\b(riddle|puzzle|brain teaser)\b/.test(t)) { var r = pick(RIDDLES, 'riddle'); S.game = { type: 'riddle', r: r, tries: 0 }; return R('Here is a riddle: ' + r.q + ' (Say “hint” or “give up” any time.)', 'thinking', 2500); }
      if (/\b(guess the animal|guessing game|guess an animal|animal game|twenty questions|20 questions|play a game|lets play|let us play|play with me|game)\b/.test(t) && !/number/.test(t)) return startGuessAnimal();
      if (/\b(number game|guess my number|guess the number|number)\b/.test(t) && /\b(guess|game|play)\b/.test(t)) { S.game = { type: 'number', n: 1 + Math.floor(Math.random() * 10), tries: 0 }; return R('I am thinking of a number from 1 to 10. You have five tries. What is your guess?', 'silly', 1800); }
      if (/\b(would you rather|would u rather)\b/.test(t)) { var pr = pick(WYR, 'wyr'); S.game = { type: 'wyr', pair: pr }; return R('Would you rather ' + pr[0] + ', or ' + pr[1] + '? Say “first” or “second”, or tell me your own idea!', 'thinking', 2400); }
      if (/\b(story|tell me a tale|bedtime story)\b/.test(t)) {
        var hero = pick(HEROES, 'hero'), place = rnd(PLACES), goal = rnd(GOALS), trouble = rnd(TROUBLES), tw = rnd(TWISTS);
        var fav = S.likes.color ? ' It was a ' + S.likes.color + ' adventure, of course.' : '';
        return R('Once upon a time, ' + hero + ' set off for ' + place + ' to ' + goal + '. On the way, there was ' + trouble + '! So ' + hero.replace(/^an? /, 'the ').replace(/ called .*$/, '') + ' ' + tw + ', and everything turned out wonderfully.' + fav + ' ' + rnd(MORALS), 'happy', 2500);
      }
      p = maths(t); if (p) return p;
      var cnt = t.match(/\bcount (?:up )?to (\d+|ten|five|twenty)\b/); if (cnt) { var c = Math.min(num(cnt[1]) || (cnt[1] === 'twenty' ? 20 : 10), 20), out = []; for (var i = 1; i <= c; i++) out.push(i); return R(out.join(', ') + '! Great counting!', 'happy', 2500); }
      var sp = t.match(/\bspell (?:the word )?([a-z]{2,12})\b/); if (sp) return R(sp[1] + ' is spelled ' + sp[1].toUpperCase().split('').join(', ') + '.', 'happy', 2500);
      var snd = t.match(/what (?:does|do|sound does) (?:a |an |the )?([a-z]+)(?: say| make| sound)?/); if (snd) { var SND = { cat: 'meow', dog: 'woof woof', cow: 'moo', duck: 'quack', sheep: 'baa', horse: 'neigh', lion: 'roar', frog: 'ribbit', pig: 'oink', bird: 'tweet tweet', owl: 'hoo hoo', snake: 'hiss', monkey: 'ooh ooh ah ah', elephant: 'a big trumpet', goat: 'maa', rooster: 'cock-a-doodle-doo', chicken: 'cluck cluck', bee: 'buzz', mouse: 'squeak', donkey: 'hee-haw' }; if (SND[snd[1]]) return R('A ' + snd[1] + ' says ' + SND[snd[1]] + '!', 'happy', 1500); }
      var rm = remember(t); if (rm) return rm;
      if (/\b(do you like|do you love|whats your favou?rite|what is your favou?rite)\b/.test(t)) { if (/fish|tuna|salmon/.test(t)) return R('Fish? Yes, please! I love fish. Do not tell the fish.', 'silly'); if (/colou?r/.test(t)) return R('My favourite colour is orange, like my fur! What is yours?', 'happy'); if (/food|eat|snack/.test(t)) return R('I love fish, milk and crunchy treats. What is your favourite food?', 'happy'); if (/mice|mouse/.test(t)) return R('I chase mice, but only in cartoons. I am much too friendly to catch one!', 'silly'); if (/dog/.test(t)) return R('Dogs are fun! We argue sometimes, but I think we would be good friends.', 'happy'); return R('I like many things: naps, fish, boxes, and chatting with you! What do you like?', 'happy'); }
      if (/\b(fact|tell me about|teach me|did you know|learn|interesting|something cool)\b/.test(t) || /\bwhy\b|\bhow does\b|\bwhat is\b|\bwhat are\b/.test(t)) {
        for (var k = 0; k < FACT_KEYS.length; k++) if (FACT_KEYS[k][0].test(t)) { return R(pick(FACTS[FACT_KEYS[k][1]], 'f' + FACT_KEYS[k][1]) + ' ' + rnd(['Cool, right?', 'Isn’t that amazing?', 'Meow-velous!']), 'surprised', 2400); }
        if (/fact|teach|did you know|learn|cool|interesting/.test(t)) { var ks = Object.keys(FACTS), kk = rnd(ks); return R(pick(FACTS[kk], 'f' + kk) + ' ' + rnd(['Cool, right?', 'Wow!']), 'surprised', 2400); }
      }
      for (var z = 0; z < FACT_KEYS.length; z++) if (FACT_KEYS[z][0].test(t) && t.split(' ').length < 6) return R(pick(FACTS[FACT_KEYS[z][1]], 'f' + FACT_KEYS[z][1]) + ' Do you want to know more?', 'surprised', 2400);
      if (/\b(yes|yeah|yep|sure|ok|okay|please)\b/.test(t) && t.split(' ').length < 4) return R(rnd(['Great! What shall we do first: a joke, a riddle or a story?', 'Purr-fect! Pick one: joke, riddle, story or guess the animal!']), 'happy');
      if (/\b(no|nope|not now|nah)\b/.test(t) && t.split(' ').length < 4) return R(rnd(['That is okay! We can just chat. What is your favourite animal?', 'No problem, friend. Tell me what you would like to do!']), 'happy');
      if (/\b(meow|purr|miaow)\b/.test(t)) return R(rnd(['Meow meow! You speak cat so well!', 'Purrrr... we understand each other!']), 'laugh', 1600);
      if (/\?$/.test(String(raw).trim()) || /\b(what|why|how|when|where|who|can|do|does|is|are)\b/.test(t.trim().split(' ')[0] ? ' ' + t.trim().split(' ')[0] + ' ' : '')) {
        if (S.turns % 3 === 0) return R(rnd(MISCHIEF), 'silly', 2000);
        return R(rnd(['Great question! My cat brain says: ' + rnd(['I am not sure, but I love that you asked!', 'maybe you can ask a grown-up or look in a book too!']) + ' Want a fun fact instead?', 'Ooh, I wonder about that too! Let us find out together. Ask a grown-up, and then come tell me!']), 'thinking', 2000);
      }
      if (S.likes.color && S.turns % 4 === 0) return R('By the way, you told me you like ' + S.likes.color + '. I saw a ' + S.likes.color + ' butterfly today! Do you like butterflies?', 'happy');
      if (S.turns % 4 === 0) return R(rnd(MISCHIEF) + ' What about you, what did you do today?', 'silly', 2000);
      return R(rnd(FALLBACK), 'happy');
    }

    /* ----- wiring ----- */
    function send(text) {
      text = String(text || '').replace(/\s+/g, ' ').trim(); if (!text) { stateEl.textContent = 'Type a word or two first.'; return; } if (busy) return;
      add('me', text); inp.value = ''; respond(think(text));
    }
    $('#kc-form').addEventListener('submit', function (e) { e.preventDefault(); send(inp.value); });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-q]'); if (b && root.contains(b)) { send(b.dataset.q); return; }
      if (e.target.closest('#kc-svg')) {
        var now = Date.now(); if (now - lastTouch < 350) return; lastTouch = now;
        var zone = (e.target.closest('[data-zone]') || {}).getAttribute ? e.target.closest('[data-zone]').getAttribute('data-zone') : '';
        var Z = { head: [['Purrrrr... that feels lovely.', 'sleepy'], ['Mmm, right behind the ears!', 'sleepy'], ['Head pats? Yes, please!', 'happy']], belly: [['Hee hee hee! That tickles!', 'laugh'], ['Not the tummy! Ha ha ha!', 'laugh'], ['Belly rubs cost one fish. Just kidding!', 'silly']], paw: [['High five! Meow!', 'happy'], ['Nice to meet you, paw to paw!', 'happy'], ['Hello! Wave wave wave!', 'happy']] };
        var L = rnd(Z[zone] || [['Meow! You found me!', 'surprised'], ['Boing! I am a bouncy cat!', 'silly'], ['Hee hee, hello!', 'laugh']]);
        svg.classList.remove('kc-hop'); void svg.offsetWidth; if (zone !== 'head') svg.classList.add('kc-hop'); if (zone === 'paw') svg.classList.add('kc-wave'); setTimeout(function () { svg.classList.remove('kc-hop'); svg.classList.remove('kc-wave'); }, 1500);
        if (!busy) { bubble.textContent = L[0]; add('cat', L[0]); face(L[1], 1800); speak(L[0]); }
      }
    });
    muteBtn.addEventListener('click', function () { muted = !muted; muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false'); muteBtn.textContent = muted ? '🔇 Sound off' : '🔊 Sound on'; if (muted && canSpeak) try { synth.cancel(); } catch (e) { } if (muted) stopTalk(); });
    $('#kc-reset').addEventListener('click', function () { resetState(); logEl.innerHTML = ''; if (canSpeak) try { synth.cancel(); } catch (e) { } stopTalk(); busy = false; var g = pick(GREET, 'greet'); bubble.textContent = g; add('cat', g); face('happy'); });
    /* eyes follow the pointer */
    var pups = svg.querySelectorAll('.kc-pup');
    function look(dx, dy) { for (var i = 0; i < pups.length; i++) pups[i].style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; }
    if (!reduced) document.addEventListener('pointermove', function (e) { var r = svg.getBoundingClientRect(); if (!r.width) return; var cx = r.left + r.width * .5, cy = r.top + r.height * .4, dx = (e.clientX - cx) / Math.max(200, r.width), dy = (e.clientY - cy) / Math.max(200, r.height); look(Math.max(-1, Math.min(1, dx * 3)) * 7, Math.max(-1, Math.min(1, dy * 3)) * 6); }, { passive: true });
    /* life: blinking and ear twitches */
    (function loop() { svg.classList.add('kc-blink'); setTimeout(function () { svg.classList.remove('kc-blink'); }, 130); setTimeout(loop, 2200 + Math.random() * 2600); })();
    if (!reduced) (function twitch() { var e = svg.querySelector(Math.random() < .5 ? '.kc-earL' : '.kc-earR'); e.classList.add('kc-twitch'); setTimeout(function () { e.classList.remove('kc-twitch'); }, 420); setTimeout(twitch, 4500 + Math.random() * 5000); })();
    window.addEventListener('pagehide', function () { if (canSpeak) try { synth.cancel(); } catch (e) { } });
    var g0 = pick(GREET, 'greet'); bubble.textContent = g0; add('cat', g0);
    if (canSpeak) stateEl.textContent = 'Ready (tap Send to hear Mango)'; else stateEl.textContent = 'Ready (this browser cannot speak, so Mango shows words)';
  }
  window.NiaziTools['kids-talking-cat'] = mount;
})();
