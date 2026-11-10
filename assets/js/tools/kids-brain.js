/* Kids Corner: Brain Booster. Patterns, odd one out, memory sequence and riddles, in three levels. Browser only. */
(function () {
  'use strict';
  var G = window.GMK, el = G.el, rnd = G.rnd, shuf = G.shuf;
  var SETS = { Animals: ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵'], Fruits: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🍒', '🥝'], Vehicles: ['🚗', '🚌', '🚲', '✈️', '🚂', '🚢', '🚁', '🛵'], Sports: ['⚽', '🏀', '🎾', '🏏', '🏐', '🏈', '🏓', '🥅'], Weather: ['☀️', '🌧️', '❄️', '⛈️', '🌈', '☁️', '🌪️', '💨'], Tools: ['🔨', '🔧', '🪚', '✂️', '📏', '🪛', '🧲', '🔦'] };
  var RIDDLES = [['I have hands but cannot clap. What am I?', 'A clock', ['A clock', 'A bird', 'A tree'], 1], ['What has to be broken before you can use it?', 'An egg', ['An egg', 'A stone', 'A book'], 1], ['I am tall when I am young and short when I am old. What am I?', 'A candle', ['A candle', 'A tree', 'A boy'], 1], ['What gets wetter the more it dries?', 'A towel', ['A towel', 'A sponge', 'The sea'], 2], ['What has keys but cannot open doors?', 'A piano', ['A piano', 'A lock', 'A map'], 1], ['What goes up but never comes down?', 'Your age', ['Your age', 'A ball', 'Rain'], 2], ['I have a face and two hands but no arms or legs. What am I?', 'A clock', ['A clock', 'A doll', 'A cat'], 2], ['What can you catch but not throw?', 'A cold', ['A cold', 'A ball', 'A fish'], 2], ['What has many teeth but cannot bite?', 'A comb', ['A comb', 'A dog', 'A shark'], 2], ['The more you take, the more you leave behind. What are they?', 'Footsteps', ['Footsteps', 'Apples', 'Coins'], 3], ['What building has the most stories?', 'A library', ['A library', 'A castle', 'A shop'], 3], ['What can travel around the world while staying in one corner?', 'A stamp', ['A stamp', 'A plane', 'A ship'], 3]];
  function opts(correct, pool, n) { var o = [correct]; shuf(pool).forEach(function (x) { if (o.length < n && o.indexOf(x) < 0) o.push(x); }); return shuf(o); }
  function run(root) {
    root.innerHTML = ''; G.starBar(root, 'brain');
    var mode = 'pattern', level = 'easy', locked = false, area, msg, nextBtn, seq = [], pos = 0, turn = 'show';
    var top = el('div', 'kc-top'), pills = el('div', 'kg-pills'); pills.setAttribute('role', 'group'); pills.setAttribute('aria-label', 'Choose a brain game');
    [['pattern', '🔁 What comes next?'], ['odd', '🧐 Odd one out'], ['simon', '🎵 Copy the colours'], ['riddle', '❓ Riddles']].forEach(function (m) { var b = el('button', 'pill', m[1]); b.type = 'button'; b.dataset.m = m[0]; b.addEventListener('click', function () { mode = m[0]; round(); }); pills.appendChild(b); });
    top.appendChild(pills); root.appendChild(top); G.levels(top, function (l) { level = l; round(); }, level);
    area = el('div', 'kg-area'); msg = el('p', 'kg-msg'); msg.setAttribute('role', 'status'); msg.setAttribute('aria-live', 'polite'); nextBtn = el('button', 'btn btn-primary kg-next', 'Next ▶'); nextBtn.type = 'button'; nextBtn.hidden = true; nextBtn.addEventListener('click', round);
    root.appendChild(area); root.appendChild(msg); root.appendChild(nextBtn);
    function paintPills() { [].forEach.call(pills.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.m === mode)); }); }
    function win(n, t) { locked = true; nextBtn.hidden = false; msg.className = 'kg-msg ok'; msg.textContent = t || 'Brilliant!'; G.award(n, 'brain', area, t || 'Brilliant!'); }
    function oops() { msg.className = 'kg-msg no'; msg.textContent = 'Not quite. Try again!'; }
    function choices(prompt, big, options, correct, pts, render) {
      area.innerHTML = ''; area.appendChild(el('p', 'kg-q', prompt)); if (big) area.appendChild(el('div', 'kg-big', big));
      var g = el('div', 'kg-opts'); options.forEach(function (o) { var b = el('button', 'kg-btn', render ? render(o) : String(o)); b.type = 'button'; b.addEventListener('click', function () { if (locked) return; if (String(o) === String(correct)) { b.classList.add('good'); win(pts); } else { b.classList.add('bad'); oops(); } }); g.appendChild(b); }); area.appendChild(g); }
    function round() {
      locked = false; nextBtn.hidden = true; msg.className = 'kg-msg'; msg.textContent = ''; paintPills(); var pts = { easy: 1, medium: 2, hard: 3 }[level];
      if (mode === 'pattern') pattern(pts); else if (mode === 'odd') odd(pts); else if (mode === 'simon') simon(pts); else riddle(pts); }
    function pattern(pts) {
      var all = [].concat.apply([], Object.keys(SETS).map(function (k) { return SETS[k]; })), a, b, c, row, ans;
      if (level === 'hard') { var step = 2 + rnd(5), s = 1 + rnd(8), mul = Math.random() < 0.3; row = []; for (var i = 0; i < 5; i++) row.push(mul ? s * Math.pow(2, i) : s + step * i); ans = row.pop(); choices('What number comes next?', row.join(',  ') + ',  ?', opts(ans, [ans + 1, ans - 1, ans + step, ans - step, ans + 2], 4).sort(function (x, y) { return x - y; }), ans, pts); return; }
      var pick = shuf(all); a = pick[0]; b = pick[1]; c = pick[2]; var pat = level === 'easy' ? [a, b] : (Math.random() < 0.5 ? [a, a, b] : [a, b, c]);
      row = []; for (var j = 0; j < pat.length * 2 + 1; j++) row.push(pat[j % pat.length]); ans = row.pop(); choices('What comes next?', row.join(' ') + ' ❓', opts(ans, [a, b, c, pick[3], pick[4]], 4), ans, pts); }
    function odd(pts) {
      var names = Object.keys(SETS), k = shuf(names), main = SETS[k[0]], other = SETS[k[1]], n = level === 'easy' ? 4 : level === 'medium' ? 5 : 6, same = shuf(main).slice(0, n - 1), oneOut = other[rnd(other.length)], items = shuf(same.concat([oneOut]));
      choices('Which one does not belong?', '', items, oneOut, pts, function (x) { return '<span style="font-size:2rem">' + x + '</span>'; }); }
    function riddle(pts) { var tier = { easy: [1], medium: [1, 2], hard: [2, 3] }[level], pool = RIDDLES.filter(function (r) { return tier.indexOf(r[3]) >= 0; }), r = pool[rnd(pool.length)]; choices(r[0], '🤔', shuf(r[2]), r[1], pts); }
    function simon(pts) {
      var C = [['#ef4444', 'Red'], ['#22c55e', 'Green'], ['#3b82f6', 'Blue'], ['#facc15', 'Yellow']], goal = { easy: 4, medium: 6, hard: 8 }[level], len = 2, speed = { easy: 750, medium: 600, hard: 450 }[level];
      seq = []; area.innerHTML = ''; var q = el('p', 'kg-q', 'Watch the colours, then copy them!'), g = el('div', 'kc-simon'), btns = C.map(function (c, i) { var b = el('button', 'kc-pad', ''); b.type = 'button'; b.style.background = c[0]; b.setAttribute('aria-label', c[1]); b.disabled = true; b.addEventListener('click', function () { press(i); }); g.appendChild(b); return b; });
      var st = el('button', 'btn btn-primary', 'Start'); st.type = 'button'; area.appendChild(q); area.appendChild(g); var sc = el('p', 'small muted', 'Reach ' + goal + ' colours to win.'); area.appendChild(sc); area.appendChild(st);
      function flash(i, ms) { btns[i].classList.add('lit'); setTimeout(function () { btns[i].classList.remove('lit'); }, ms); }
      function play() { seq = []; for (var i = 0; i < len; i++) seq.push(rnd(4)); root._seq = seq; pos = 0; turn = 'show'; btns.forEach(function (b) { b.disabled = true; }); q.textContent = 'Watch...'; seq.forEach(function (v, i) { setTimeout(function () { flash(v, speed * 0.6); }, 500 + i * speed); }); setTimeout(function () { turn = 'you'; q.textContent = 'Your turn! Copy the colours.'; btns.forEach(function (b) { b.disabled = false; }); }, 500 + seq.length * speed); }
      function press(i) { if (turn !== 'you' || locked) return; flash(i, 200); if (seq[pos] !== i) { turn = 'show'; msg.className = 'kg-msg no'; msg.textContent = 'Oops! Let us try that one again.'; btns.forEach(function (b) { b.disabled = true; }); setTimeout(function () { msg.textContent = ''; msg.className = 'kg-msg'; play(); }, 1200); return; } pos++; if (pos === seq.length) { if (len >= goal) { btns.forEach(function (b) { b.disabled = true; }); win(pts + 1, 'You remembered ' + len + ' colours!'); return; } len++; turn = 'show'; msg.className = 'kg-msg ok'; msg.textContent = 'Great! One more colour...'; setTimeout(function () { msg.textContent = ''; msg.className = 'kg-msg'; play(); }, 900); } }
      st.addEventListener('click', function () { st.hidden = true; len = 2; play(); }); }
    round(); }
  window.NiaziTools = window.NiaziTools || {}; NiaziTools['kids-brain'] = function (r) { run(r); };
})();
