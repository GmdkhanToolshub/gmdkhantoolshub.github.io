/* Kids Corner: Animal Kingdom. Names, homes, food, sounds and facts, plus a quiz. Browser only. */
(function () {
  'use strict';
  var G = window.GMK, el = G.el, rnd = G.rnd, shuf = G.shuf;
  var A = [
    { n: 'Cow', e: '🐄', g: 'Farm', h: 'Farm', d: 'Grass and hay', s: 'Moo', f: 'A cow has a stomach with four parts, which helps it digest grass.' },
    { n: 'Sheep', e: '🐑', g: 'Farm', h: 'Farm', d: 'Grass', s: 'Baa', f: 'A sheep grows thick wool that is cut and made into warm clothes.' },
    { n: 'Horse', e: '🐴', g: 'Farm', h: 'Farm and fields', d: 'Grass and hay', s: 'Neigh', f: 'Horses can sleep standing up.' },
    { n: 'Dog', e: '🐶', g: 'Farm', h: 'Homes and farms', d: 'Meat and dog food', s: 'Woof', f: 'A dog can smell far better than a person.' },
    { n: 'Cat', e: '🐱', g: 'Farm', h: 'Homes and farms', d: 'Meat', s: 'Meow', f: 'Cats sleep for about twelve to sixteen hours a day.' },
    { n: 'Hen', e: '🐔', g: 'Birds', h: 'Farm', d: 'Seeds and insects', s: 'Cluck', f: 'A hen turns her eggs several times a day to keep them warm.' },
    { n: 'Duck', e: '🦆', g: 'Birds', h: 'Ponds and rivers', d: 'Plants, insects and small fish', s: 'Quack', f: 'Duck feathers are waterproof, so water rolls right off.' },
    { n: 'Owl', e: '🦉', g: 'Birds', h: 'Forests', d: 'Mice and insects', s: 'Hoo hoo', f: 'An owl can turn its head a very long way to look behind it.' },
    { n: 'Penguin', e: '🐧', g: 'Birds', h: 'Cold lands and seas', d: 'Fish', s: 'Honk', f: 'Penguins cannot fly, but they are excellent swimmers.' },
    { n: 'Lion', e: '🦁', g: 'Wild', h: 'Grasslands', d: 'Meat', s: 'Roar', f: 'A lion\'s roar can be heard from many kilometres away.' },
    { n: 'Tiger', e: '🐯', g: 'Wild', h: 'Forests', d: 'Meat', s: 'Growl', f: 'Every tiger has its own pattern of stripes.' },
    { n: 'Elephant', e: '🐘', g: 'Wild', h: 'Grasslands and forests', d: 'Leaves, grass and fruit', s: 'Trumpet', f: 'The elephant is the biggest land animal. Its trunk works like a hand.' },
    { n: 'Giraffe', e: '🦒', g: 'Wild', h: 'Grasslands', d: 'Leaves', s: 'Hmmm', f: 'A giraffe is the tallest animal on land, and its tongue is dark purple.' },
    { n: 'Monkey', e: '🐵', g: 'Wild', h: 'Jungles', d: 'Fruit, leaves and insects', s: 'Ooh ooh', f: 'Monkeys use their hands and tails to climb through trees.' },
    { n: 'Bear', e: '🐻', g: 'Wild', h: 'Forests and mountains', d: 'Fruit, fish and plants', s: 'Grrr', f: 'Many bears sleep deeply through the cold winter.' },
    { n: 'Camel', e: '🐪', g: 'Wild', h: 'Deserts', d: 'Desert plants', s: 'Grunt', f: 'A camel\'s hump stores fat for energy, not water.' },
    { n: 'Frog', e: '🐸', g: 'Water', h: 'Ponds and wet places', d: 'Insects', s: 'Ribbit', f: 'Frogs start life as tadpoles that live in the water.' },
    { n: 'Dolphin', e: '🐬', g: 'Water', h: 'Oceans', d: 'Fish', s: 'Click click', f: 'Dolphins talk to each other with clicks and whistles.' },
    { n: 'Whale', e: '🐳', g: 'Water', h: 'Oceans', d: 'Tiny sea animals', s: 'Whooo', f: 'The blue whale is the biggest animal that has ever lived.' },
    { n: 'Bee', e: '🐝', g: 'Wild', h: 'Gardens and fields', d: 'Nectar from flowers', s: 'Buzz', f: 'Bees visit hundreds of flowers in a day and help plants grow.' }
  ];
  var GROUPS = ['All', 'Farm', 'Wild', 'Birds', 'Water'];
  function run(root) {
    root.innerHTML = ''; G.starBar(root, 'animals');
    var mode = 'learn', level = 'easy', grp = 'All', seen = {}, locked = false;
    var top = el('div', 'kc-top'), pills = el('div', 'kg-pills'); [['learn', '🐾 Meet the animals'], ['quiz', '❓ Animal quiz']].forEach(function (m) { var b = el('button', 'pill', m[1]); b.type = 'button'; b.dataset.m = m[0]; b.addEventListener('click', function () { mode = m[0]; view(); }); pills.appendChild(b); });
    top.appendChild(pills); root.appendChild(top); G.levels(top, function (l) { level = l; if (mode === 'quiz') view(); }, level);
    var area = el('div', 'kc-animals'); var msg = el('p', 'kg-msg'); msg.setAttribute('role', 'status'); msg.setAttribute('aria-live', 'polite'); root.appendChild(area); root.appendChild(msg);
    function paint() { [].forEach.call(pills.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.m === mode)); }); }
    function view() { paint(); msg.textContent = ''; msg.className = 'kg-msg'; locked = false; if (mode === 'learn') learn(); else quiz(); }
    function learn() {
      area.innerHTML = ''; var chips = el('div', 'kc-chips'); chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Animal groups'); GROUPS.forEach(function (g) { var b = el('button', 'pill', g); b.type = 'button'; b.setAttribute('aria-pressed', String(g === grp)); b.addEventListener('click', function () { grp = g; learn(); }); chips.appendChild(b); }); area.appendChild(chips);
      var grid = el('div', 'kc-agrid'), card = el('div', 'kc-card'); card.innerHTML = '<h3>Tap an animal</h3><p>Choose an animal to see where it lives, what it eats, and to hear its sound.</p>';
      A.filter(function (a) { return grp === 'All' || a.g === grp; }).forEach(function (a) { var b = el('button', 'kc-animal', '<span aria-hidden="true">' + a.e + '</span><b>' + a.n + '</b>'); b.type = 'button'; b.addEventListener('click', function () { show(a, card); }); grid.appendChild(b); });
      area.appendChild(grid); area.appendChild(card); }
    function show(a, card) {
      card.innerHTML = '<h3><span aria-hidden="true">' + a.e + '</span> ' + a.n + '</h3><p class="kc-tags"><span>Group: ' + a.g + '</span><span>Home: ' + a.h + '</span><span>Eats: ' + a.d + '</span></p><p>' + a.f + '</p><button type="button" class="btn btn-primary btn-sm kc-snd">🔊 Hear the sound</button><p class="small muted">The sound is said aloud by your device: &ldquo;' + a.s + '!&rdquo;</p>';
      card.querySelector('.kc-snd').addEventListener('click', function () { G.say(a.s + '! ' + a.s + '!'); }); G.say(a.n); card.className = 'kc-card pop'; setTimeout(function () { card.className = 'kc-card'; }, 400);
      if (!seen[a.n]) { seen[a.n] = 1; var c = Object.keys(seen).length; msg.className = 'kg-msg ok'; msg.textContent = 'Animals met: ' + c + ' of 3 for a star'; if (c >= 3) { seen = {}; msg.textContent = 'You met three animals!'; G.award(1, 'animals', card, 'Animal expert!'); } } }
    function quiz() {
      area.innerHTML = ''; var n = level === 'easy' ? 3 : level === 'medium' ? 4 : 6, a = A[rnd(A.length)], kinds = level === 'easy' ? ['sound'] : ['sound', 'home', 'eats'], k = kinds[rnd(kinds.length)], q, ans, pool;
      if (k === 'sound') { q = 'Which animal says "' + a.s + '"?'; } else if (k === 'home') { q = 'Which animal lives in this place: ' + a.h + '?'; } else { q = 'Which animal eats ' + a.d.toLowerCase() + '?'; }
      var same = A.filter(function (x) { return k === 'sound' ? x.s === a.s : k === 'home' ? x.h === a.h : x.d === a.d; }); var options = [a]; shuf(A).forEach(function (x) { if (options.length < n && options.indexOf(x) < 0 && same.indexOf(x) < 0) options.push(x); }); options = shuf(options);
      var box = el('div', 'kg-area'); box.appendChild(el('p', 'kg-q', q)); box.appendChild(el('div', 'kg-big', '🐾')); var g = el('div', 'kg-opts');
      options.forEach(function (o) { var b = el('button', 'kg-btn', '<span style="font-size:2rem">' + o.e + '</span><br><small>' + o.n + '</small>'); b.type = 'button'; b.dataset.n = o.n; b.addEventListener('click', function () { if (locked) return; if (o === a) { locked = true; b.classList.add('good'); msg.className = 'kg-msg ok'; msg.textContent = 'Yes! It is the ' + a.n + '.'; G.award({ easy: 1, medium: 2, hard: 3 }[level], 'animals', box, 'Wonderful!'); var nx = el('button', 'btn btn-primary kg-next', 'Next ▶'); nx.type = 'button'; nx.addEventListener('click', view); box.appendChild(nx); } else { b.classList.add('bad'); msg.className = 'kg-msg no'; msg.textContent = 'Not quite. Try again!'; } }); g.appendChild(b); });
      box.appendChild(g); area.appendChild(box); root._answer = a.n; }
    view(); }
  window.NiaziTools = window.NiaziTools || {}; NiaziTools['kids-animals'] = function (r) { run(r); };
})();
