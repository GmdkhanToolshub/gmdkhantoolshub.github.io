/* Kids Corner: Space Explorer. An animated solar system with planet facts and a quiz. Browser only. */
(function () {
  'use strict';
  var G = window.GMK, el = G.el, rnd = G.rnd, shuf = G.shuf;
  var P = [
    { n: 'Mercury', c: '#a8a29e', r: 62, s: 5, y: 4, size: 'Smallest planet', moons: 'No moons', fact: 'Mercury is the closest planet to the Sun. A year there lasts only 88 Earth days, but it has no air to keep the heat in, so nights are freezing.' },
    { n: 'Venus', c: '#fcd34d', r: 88, s: 8, y: 7, size: 'About the size of Earth', moons: 'No moons', fact: 'Venus is the hottest planet, about 465 degrees Celsius, because its thick clouds trap heat. It spins backwards compared with most planets.' },
    { n: 'Earth', c: '#3b82f6', r: 116, s: 8.5, y: 10, size: 'Our home planet', moons: '1 moon', fact: 'Earth is the only place we know with life. About 71 percent of its surface is covered by water, which is why it looks blue from space.' },
    { n: 'Mars', c: '#ef4444', r: 144, s: 6, y: 14, size: 'About half the size of Earth', moons: '2 small moons', fact: 'Mars is the red planet because its dust is full of rust. It has Olympus Mons, the tallest volcano known in the Solar System.' },
    { n: 'Jupiter', c: '#fb923c', r: 186, s: 17, y: 24, size: 'The biggest planet', moons: 'More than 90 moons', fact: 'Jupiter is a giant ball of gas. Its Great Red Spot is a storm that has been raging for hundreds of years. A day there lasts only about 10 hours.' },
    { n: 'Saturn', c: '#fde68a', r: 228, s: 14, y: 32, size: 'Second biggest planet', moons: 'More than 100 moons', fact: 'Saturn has beautiful rings made of ice and rock. It is so light for its size that it would float in a giant bathtub of water.' },
    { n: 'Uranus', c: '#67e8f9', r: 262, s: 10, y: 42, size: 'A giant ice planet', moons: 'More than 25 moons', fact: 'Uranus spins on its side like a rolling ball. It looks pale blue-green and one year there lasts about 84 Earth years.' },
    { n: 'Neptune', c: '#2563eb', r: 290, s: 10, y: 52, size: 'A giant ice planet', moons: 'More than a dozen moons', fact: 'Neptune is the farthest planet. It is deep blue and has the fastest winds in the Solar System. One year there lasts about 165 Earth years.' }
  ];
  var SUN = { n: 'The Sun', c: '#facc15', fact: 'The Sun is a star, not a planet. It gives us light and heat, and about 109 Earths could fit side by side across it. Never look straight at the Sun.' };
  var Q = [['Which planet is the biggest?', 'Jupiter'], ['Which planet is closest to the Sun?', 'Mercury'], ['Which planet is called the red planet?', 'Mars'], ['Which planet has beautiful rings?', 'Saturn'], ['Which planet do we live on?', 'Earth'], ['Which planet is the hottest?', 'Venus'], ['Which planet spins on its side?', 'Uranus'], ['Which planet is the farthest from the Sun?', 'Neptune']];
  var HARD = [['How many planets are in our Solar System?', '8', ['6', '8', '9', '10', '7']], ['What is the Sun?', 'A star', ['A planet', 'A star', 'A moon', 'A comet', 'A cloud']], ['Which planet is third from the Sun?', 'Earth', ['Venus', 'Earth', 'Mars', 'Mercury', 'Jupiter']], ['Which is the smallest planet?', 'Mercury', ['Mars', 'Mercury', 'Venus', 'Earth', 'Neptune']]];
  function run(root) {
    root.innerHTML = ''; G.starBar(root, 'space');
    var seen = {}, mode = 'explore', level = 'easy', locked = false;
    var top = el('div', 'kc-top'), pills = el('div', 'kg-pills'); [['explore', '🪐 Explore'], ['quiz', '❓ Space quiz']].forEach(function (m) { var b = el('button', 'pill', m[1]); b.type = 'button'; b.dataset.m = m[0]; b.addEventListener('click', function () { mode = m[0]; view(); }); pills.appendChild(b); });
    top.appendChild(pills); root.appendChild(top); G.levels(top, function (l) { level = l; if (mode === 'quiz') view(); }, level);
    var stage = el('div', 'kc-space'); root.appendChild(stage); var msg = el('p', 'kg-msg'); msg.setAttribute('role', 'status'); msg.setAttribute('aria-live', 'polite'); root.appendChild(msg);
    function paint() { [].forEach.call(pills.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.m === mode)); }); }
    function view() { paint(); msg.textContent = ''; msg.className = 'kg-msg'; locked = false; if (mode === 'explore') explore(); else quiz(); }
    function explore() {
      stage.innerHTML = ''; var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 600 600'); svg.setAttribute('class', 'kc-solar'); svg.setAttribute('role', 'group'); svg.setAttribute('aria-label', 'The Solar System. Tap a planet to learn about it.');
      var bg = document.createElementNS(ns, 'rect'); bg.setAttribute('width', 600); bg.setAttribute('height', 600); bg.setAttribute('fill', '#0b1220'); bg.setAttribute('rx', 24); svg.appendChild(bg);
      for (var i = 0; i < 40; i++) { var st = document.createElementNS(ns, 'circle'); st.setAttribute('cx', Math.round(Math.random() * 600)); st.setAttribute('cy', Math.round(Math.random() * 600)); st.setAttribute('r', (Math.random() * 1.4 + 0.4).toFixed(1)); st.setAttribute('fill', '#fff'); st.setAttribute('opacity', (0.3 + Math.random() * 0.6).toFixed(2)); svg.appendChild(st); }
      var sun = document.createElementNS(ns, 'circle'); sun.setAttribute('cx', 300); sun.setAttribute('cy', 300); sun.setAttribute('r', 30); sun.setAttribute('fill', SUN.c); sun.setAttribute('class', 'kc-pl'); sun.setAttribute('tabindex', 0); sun.setAttribute('role', 'button'); sun.setAttribute('aria-label', 'The Sun'); sun.dataset.n = 'sun'; svg.appendChild(sun);
      P.forEach(function (p) {
        var o = document.createElementNS(ns, 'circle'); o.setAttribute('cx', 300); o.setAttribute('cy', 300); o.setAttribute('r', p.r); o.setAttribute('fill', 'none'); o.setAttribute('stroke', '#ffffff'); o.setAttribute('stroke-opacity', '0.15'); svg.appendChild(o);
        var g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'kc-orb'); g.style.animationDuration = (p.y * 6) + 's'; g.style.animationDelay = '-' + (Math.random() * p.y * 6).toFixed(1) + 's'; var c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', 300 + p.r); c.setAttribute('cy', 300); c.setAttribute('r', p.s); c.setAttribute('fill', p.c); c.setAttribute('class', 'kc-pl'); c.setAttribute('tabindex', 0); c.setAttribute('role', 'button'); c.setAttribute('aria-label', p.n); c.dataset.n = p.n; g.appendChild(c);
        if (p.n === 'Saturn') { var ring = document.createElementNS(ns, 'ellipse'); ring.setAttribute('cx', 300 + p.r); ring.setAttribute('cy', 300); ring.setAttribute('rx', 22); ring.setAttribute('ry', 5); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#fde68a'); ring.setAttribute('stroke-width', 2); ring.setAttribute('pointer-events', 'none'); g.appendChild(ring); }
        svg.appendChild(g); });
      stage.appendChild(svg);
      var card = el('div', 'kc-card'); card.innerHTML = '<h3>Tap a planet</h3><p>Tap the Sun or any planet to learn about it. Planets are not to scale, and they really are much farther apart.</p>'; stage.appendChild(card);
      var list = el('div', 'kc-chips'); list.setAttribute('role', 'group'); list.setAttribute('aria-label', 'Planets'); [SUN].concat(P).forEach(function (p) { var b = el('button', 'pill', p.n); b.type = 'button'; b.addEventListener('click', function () { show(p, card); }); list.appendChild(b); }); root.insertBefore(list, msg);
      var old = root.querySelectorAll('.kc-chips'); if (old.length > 1) old[0].remove();
      function pick(e) { var t = e.target.closest && e.target.closest('[data-n]'); if (!t) return; var p = t.dataset.n === 'sun' ? SUN : P.filter(function (x) { return x.n === t.dataset.n; })[0]; if (p) show(p, card); }
      svg.addEventListener('click', pick); svg.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(e); } }); }
    function show(p, card) {
      var order = P.indexOf(p) + 1; card.innerHTML = '<h3>' + p.n + '</h3>' + (p.size ? '<p class="kc-tags"><span>' + (order ? 'Planet number ' + order + ' from the Sun' : '') + '</span><span>' + p.size + '</span><span>' + p.moons + '</span></p>' : '') + '<p>' + p.fact + '</p>';
      card.className = 'kc-card pop'; setTimeout(function () { card.className = 'kc-card'; }, 400); G.say(p.n + '. ' + p.fact.split('. ')[0]);
      if (!seen[p.n]) { seen[p.n] = 1; var cnt = Object.keys(seen).length; msg.className = 'kg-msg ok'; msg.textContent = 'Planets learned: ' + cnt + ' of 3 for a star'; if (cnt >= 3) { seen = {}; msg.textContent = 'You learned three new things!'; G.award(1, 'space', card, 'Space explorer!'); } } }
    function quiz() {
      stage.innerHTML = ''; var old = root.querySelectorAll('.kc-chips'); [].forEach.call(old, function (o) { o.remove(); }); var n = level === 'easy' ? 3 : level === 'medium' ? 4 : 5, q, correct, options;
      if (level === 'hard' && Math.random() < 0.5) { var h = HARD[rnd(HARD.length)]; q = h[0]; correct = h[1]; options = shuf(h[2]).slice(0, 5); if (options.indexOf(correct) < 0) options[0] = correct; options = shuf(options); }
      else { var x = Q[rnd(Q.length)]; q = x[0]; correct = x[1]; options = [correct]; shuf(P.map(function (p) { return p.n; })).forEach(function (m) { if (options.length < n && options.indexOf(m) < 0) options.push(m); }); options = shuf(options); }
      var area = el('div', 'kg-area'); area.appendChild(el('p', 'kg-q', q)); area.appendChild(el('div', 'kg-big', '🚀')); var g = el('div', 'kg-opts'); options.forEach(function (o) { var b = el('button', 'kg-btn', o); b.type = 'button'; b.addEventListener('click', function () { if (locked) return; if (o === correct) { locked = true; b.classList.add('good'); msg.className = 'kg-msg ok'; msg.textContent = 'Correct! ' + o + ' is right.'; G.award({ easy: 1, medium: 2, hard: 3 }[level], 'space', area, 'Stellar!'); var nx = el('button', 'btn btn-primary kg-next', 'Next question ▶'); nx.type = 'button'; nx.addEventListener('click', view); area.appendChild(nx); } else { b.classList.add('bad'); msg.className = 'kg-msg no'; msg.textContent = 'Not quite. Try again!'; } }); g.appendChild(b); }); area.appendChild(g); stage.appendChild(area); }
    view(); }
  window.NiaziTools = window.NiaziTools || {}; NiaziTools['kids-space'] = function (r) { run(r); };
})();
