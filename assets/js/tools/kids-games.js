/* Kids Corner: learning games (alphabet, counting, maths, spelling, memory, shapes and colours, quiz) with stars and a printable certificate.
   Runs entirely in the browser. Only a star count is kept, on this device. No names, accounts, chat or adverts. */
(function () {
  'use strict';
  var KEY = 'gm.kids.stars', GOAL = 20, BREAK_AFTER = 15;
  var ABC = [['A', 'Apple', '🍎'], ['B', 'Ball', '⚽'], ['C', 'Cat', '🐱'], ['D', 'Dog', '🐶'], ['E', 'Elephant', '🐘'], ['F', 'Fish', '🐠'], ['G', 'Grapes', '🍇'], ['H', 'House', '🏠'], ['I', 'Ice cream', '🍦'], ['J', 'Juice', '🧃'], ['K', 'Kite', '🪁'], ['L', 'Lion', '🦁'], ['M', 'Moon', '🌙'], ['N', 'Nose', '👃'], ['O', 'Orange', '🍊'], ['P', 'Pizza', '🍕'], ['Q', 'Queen', '👑'], ['R', 'Rainbow', '🌈'], ['S', 'Sun', '☀️'], ['T', 'Tree', '🌳'], ['U', 'Umbrella', '☂️'], ['V', 'Van', '🚐'], ['W', 'Watch', '⌚'], ['X', 'Xylophone', '🎹'], ['Y', 'Yacht', '⛵'], ['Z', 'Zebra', '🦓']];
  var WORDS = [['CAT', '🐱'], ['DOG', '🐶'], ['SUN', '☀️'], ['FISH', '🐠'], ['BIRD', '🐦'], ['STAR', '⭐'], ['TREE', '🌳'], ['MOON', '🌙'], ['CAKE', '🎂'], ['BOOK', '📖'], ['BALL', '⚽'], ['FROG', '🐸'], ['DUCK', '🦆'], ['BEAR', '🐻'], ['APPLE', '🍎'], ['HOUSE', '🏠']];
  var COLS = [['Red', '#ef4444'], ['Blue', '#3b82f6'], ['Green', '#22c55e'], ['Yellow', '#facc15'], ['Orange', '#f97316'], ['Purple', '#a855f7'], ['Pink', '#ec4899'], ['Brown', '#92400e']];
  var SHAPES = { Circle: '<circle cx="50" cy="50" r="40"/>', Square: '<rect x="12" y="12" width="76" height="76"/>', Triangle: '<polygon points="50,10 92,88 8,88"/>', Rectangle: '<rect x="6" y="26" width="88" height="48"/>', Star: '<polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38"/>', Heart: '<path d="M50 88C10 58 8 28 28 20c10-4 18 2 22 10 4-8 12-14 22-10 20 8 18 38-22 68Z"/>' };
  var QUIZ = [['How many days are in a week?', '7', ['5', '7', '10']], ['Which animal says “moo”?', 'Cow', ['Cow', 'Cat', 'Duck']], ['What colour is the sky on a clear day?', 'Blue', ['Green', 'Blue', 'Red']], ['Which one is a fruit?', 'Banana', ['Carrot', 'Banana', 'Potato']], ['What do bees make?', 'Honey', ['Milk', 'Honey', 'Bread']], ['How many legs does a dog have?', '4', ['2', '4', '6']], ['Which planet do we live on?', 'Earth', ['Mars', 'Earth', 'Moon']], ['What do we use to see?', 'Eyes', ['Ears', 'Eyes', 'Hands']], ['Which one can fly?', 'Bird', ['Fish', 'Bird', 'Cow']], ['What comes after Monday?', 'Tuesday', ['Sunday', 'Tuesday', 'Friday']], ['Which one is cold?', 'Ice', ['Fire', 'Ice', 'Sun']], ['What do we drink when we are thirsty?', 'Water', ['Sand', 'Water', 'Paper']], ['How many months are in a year?', '12', ['10', '12', '20']], ['Which one is a vehicle?', 'Bus', ['Bus', 'Tree', 'Chair']], ['What shines at night?', 'Moon', ['Moon', 'Rain', 'Cloud']], ['We brush our teeth to keep them…', 'Clean', ['Dirty', 'Clean', 'Wet']]];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function get() { try { return Math.max(0, parseInt(localStorage.getItem(KEY), 10) || 0); } catch (e) { return 0; } }
  function put(n) { try { localStorage.setItem(KEY, String(n)); } catch (e) {} }
  function say(t) { try { var s = window.speechSynthesis; if (!s) return; s.cancel(); var u = new SpeechSynthesisUtterance(t); u.rate = 0.85; u.pitch = 1.2; s.speak(u); } catch (e) {} }
  function options(correct, pool, n) { var o = [correct]; shuf(pool).forEach(function (x) { if (o.length < n && o.indexOf(x) < 0) o.push(x); }); return shuf(o); }

  function game(root) {
    var stars = get(), answered = 0, mode = 'abc', level = 'easy', area, bar, msg, nextBtn, locked = false;
    var MODES = [['abc', '🔤 Alphabet'], ['count', '🔢 Counting'], ['math', '➕ Maths'], ['spell', '✏️ Spelling'], ['memory', '🃏 Memory'], ['shape', '🔷 Shapes'], ['colour', '🎨 Colours'], ['quiz', '❓ Quiz']];
    root.innerHTML = '';
    var top = el('div', 'kg-top'), pills = el('div', 'kg-pills'); pills.setAttribute('role', 'group'); pills.setAttribute('aria-label', 'Choose a game');
    MODES.forEach(function (m) { var b = el('button', 'pill', m[1]); b.type = 'button'; b.dataset.m = m[0]; b.addEventListener('click', function () { mode = m[0]; paintPills(); round(); }); pills.appendChild(b); });
    bar = el('div', 'kg-bar'); area = el('div', 'kg-area'); msg = el('p', 'kg-msg'); msg.setAttribute('role', 'status'); msg.setAttribute('aria-live', 'polite');
    nextBtn = el('button', 'btn btn-primary kg-next', 'Next ▶'); nextBtn.type = 'button'; nextBtn.hidden = true; nextBtn.addEventListener('click', round);
    var foot = el('div', 'kg-foot');
    foot.innerHTML = '<label class="small muted">Level <select id="kg-level"><option value="easy">Beginner</option><option value="medium">Intermediate</option><option value="hard">Advanced</option></select></label> <button type="button" class="btn btn-ghost btn-sm" id="kg-cert">Get my certificate</button> <button type="button" class="btn btn-ghost btn-sm" id="kg-reset">Reset my stars</button><p class="small muted" style="margin:8px 0 0">Stars are saved only on this device. No names or personal details are collected.</p>';
    top.appendChild(pills); root.appendChild(top); root.appendChild(bar); root.appendChild(area); root.appendChild(msg); root.appendChild(nextBtn); root.appendChild(foot);
    $('#kg-level', foot).addEventListener('change', function (e) { level = e.target.value; round(); });
    $('#kg-reset', foot).addEventListener('click', function (e) { if (e.target.dataset.sure) { stars = 0; put(0); e.target.textContent = 'Reset my stars'; delete e.target.dataset.sure; paintBar(); } else { e.target.dataset.sure = 1; e.target.textContent = 'Tap again to reset'; } });
    $('#kg-cert', foot).addEventListener('click', certificate);

    function paintPills() { [].forEach.call(pills.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.m === mode)); }); }
    function paintBar() { var inLevel = stars % GOAL, done = Math.floor(stars / GOAL); bar.innerHTML = '<span class="kg-star" aria-hidden="true">⭐</span><b>' + stars + ' stars</b><span class="kg-track" role="progressbar" aria-valuemin="0" aria-valuemax="' + GOAL + '" aria-valuenow="' + inLevel + '" aria-label="Progress to the next certificate"><i style="width:' + (inLevel / GOAL * 100) + '%"></i></span><span class="small muted">' + (GOAL - inLevel) + ' to the next certificate' + (done ? ' · ' + done + ' earned' : '') + '</span>'; }
    function win(n, text) {
      if (window.GMK) { GMK.award(n || 1, 'games', area, text); stars = GMK.stars(); } else { stars += n || 1; put(stars); } answered++; paintBar(); locked = true; nextBtn.hidden = false;
      msg.className = 'kg-msg ok'; msg.textContent = text || ['Great job!', 'Well done!', 'Super!', 'Brilliant!'][rnd(4)];
      if (stars % GOAL === 0) msg.textContent += ' You earned a certificate! Press “Get my certificate”.';
      if (answered > 0 && answered % BREAK_AFTER === 0) msg.textContent += ' Time for a little break: stretch, drink water and look away from the screen for a minute.';
    }
    function oops() { msg.className = 'kg-msg no'; msg.textContent = 'Not quite. Try again!'; }
    function choices(prompt, big, opts, correct, speak, render) {
      area.innerHTML = ''; area.appendChild(el('p', 'kg-q', prompt)); if (big) { var b = el('div', 'kg-big', big); area.appendChild(b); if (speak) { b.tabIndex = 0; b.setAttribute('role', 'button'); b.setAttribute('aria-label', 'Hear it'); var f = function () { say(speak); }; b.addEventListener('click', f); b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } }); } }
      var g = el('div', 'kg-opts'); opts.forEach(function (o) { var bt = el('button', 'kg-btn', render ? render(o) : String(o)); bt.type = 'button'; bt.addEventListener('click', function () { if (locked) return; if (String(o) === String(correct)) { bt.classList.add('good'); win(); } else { bt.classList.add('bad'); oops(); } }); g.appendChild(bt); }); area.appendChild(g);
    }
    function round() {
      locked = false; nextBtn.hidden = true; msg.className = 'kg-msg'; msg.textContent = ''; paintPills(); paintBar();
      var max = level === 'easy' ? 10 : level === 'medium' ? 20 : 50;
      if (mode === 'abc') { var it = ABC[rnd(26)]; choices('Which letter does this word start with?', '<span class="kg-emoji">' + it[2] + '</span><span class="kg-word">' + it[1] + '</span>', options(it[0], ABC.map(function (x) { return x[0]; }), 4), it[0], it[1]); }
      else if (mode === 'count') { var n = 1 + rnd(level === 'easy' ? 6 : 10), e = ['🍎', '⭐', '🐟', '🎈', '🐥', '🌸'][rnd(6)]; choices('How many can you count?', '<span class="kg-emoji">' + new Array(n + 1).join(e + ' ') + '</span>', options(n, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4).sort(function (a, b) { return a - b; }), n); }
      else if (mode === 'math') { var a = 1 + rnd(max), b = 1 + rnd(max), plus = Math.random() < 0.6; if (!plus && b > a) { var t = a; a = b; b = t; } var ans = plus ? a + b : a - b, pool = []; for (var d = -3; d <= 3; d++) if (d && ans + d >= 0) pool.push(ans + d); choices('Solve it', a + ' ' + (plus ? '+' : '−') + ' ' + b + ' = ?', options(ans, pool, 4).sort(function (x, y) { return x - y; }), ans); }
      else if (mode === 'shape') { var names = Object.keys(SHAPES), s = names[rnd(names.length)]; choices('What shape is this?', '<svg viewBox="0 0 100 100" width="120" height="120" aria-hidden="true" fill="' + COLS[rnd(8)][1] + '" stroke="#111827" stroke-width="3">' + SHAPES[s] + '</svg>', options(s, names, 4), s, s); }
      else if (mode === 'colour') { var c = COLS[rnd(8)]; choices('What colour is this?', '<span class="kg-swatch" style="background:' + c[1] + '"></span>', options(c[0], COLS.map(function (x) { return x[0]; }), 4), c[0], c[0]); }
      else if (mode === 'quiz') { var q = QUIZ[rnd(QUIZ.length)]; choices(q[0], '', shuf(q[2]), q[1]); }
      else if (mode === 'spell') spell();
      else memory();
    }
    function spell() {
      var w = WORDS[rnd(WORDS.length)], word = w[0], got = '', letters = shuf(word.split(''));
      area.innerHTML = ''; area.appendChild(el('p', 'kg-q', 'Tap the letters in the right order to spell the word')); area.appendChild(el('div', 'kg-big', '<span class="kg-emoji">' + w[1] + '</span>'));
      var slot = el('div', 'kg-slot', ''), g = el('div', 'kg-opts'); area.appendChild(slot); area.appendChild(g);
      function draw() { slot.textContent = (got + new Array(word.length - got.length + 1).join('_')).split('').join(' '); }
      draw();
      letters.forEach(function (L) { var bt = el('button', 'kg-btn', L); bt.type = 'button'; bt.addEventListener('click', function () { if (locked || bt.disabled) return; if (word.charAt(got.length) === L) { got += L; bt.disabled = true; draw(); if (got === word) { say(word.toLowerCase()); win(1, 'You spelled ' + word + '!'); } } else { bt.classList.add('bad'); oops(); setTimeout(function () { bt.classList.remove('bad'); }, 500); } }); g.appendChild(bt); });
    }
    function memory() {
      var pool = shuf(['🐱', '🐶', '🐰', '🦊', '🐸', '🐼', '🦁', '🐧', '🐢', '🐠']).slice(0, level === 'easy' ? 6 : level === 'medium' ? 8 : 10), cards = shuf(pool.concat(pool)), open = [], matched = 0;
      area.innerHTML = ''; area.appendChild(el('p', 'kg-q', 'Find the matching pairs')); var g = el('div', 'kg-mem'); area.appendChild(g);
      cards.forEach(function (c) { var bt = el('button', 'kg-card', '<span>?</span>'); bt.type = 'button'; bt.setAttribute('aria-label', 'Hidden card'); bt.addEventListener('click', function () {
        if (locked || bt.classList.contains('up') || open.length === 2) return; bt.classList.add('up'); bt.innerHTML = '<span>' + c + '</span>'; bt.setAttribute('aria-label', 'Card ' + c); open.push([bt, c]);
        if (open.length === 2) { var A = open[0], B = open[1]; if (A[1] === B[1]) { A[0].classList.add('done'); B[0].classList.add('done'); open = []; matched++; if (matched === pool.length) win(3, 'You found every pair!'); } else setTimeout(function () { [A, B].forEach(function (x) { x[0].classList.remove('up'); x[0].innerHTML = '<span>?</span>'; x[0].setAttribute('aria-label', 'Hidden card'); }); open = []; }, 800); }
      }); g.appendChild(bt); });
    }
    function certificate() {
      if (stars < GOAL) { msg.className = 'kg-msg no'; msg.textContent = 'Collect ' + (GOAL - stars) + ' more stars to unlock your first certificate.'; return; }
      area.innerHTML = '';
      var box = el('div', 'kg-certbox', '<p class="kg-q">Your certificate</p><label>Name to print (optional, not saved)<br><input type="text" maxlength="30" id="kg-name" autocomplete="off" placeholder="Type a name or leave blank"></label><div class="btn-row" style="margin-top:12px"><button type="button" class="btn btn-primary" id="kg-dl">Download certificate</button><button type="button" class="btn btn-ghost" id="kg-back">Back to games</button></div>');
      area.appendChild(box); nextBtn.hidden = true;
      $('#kg-back', box).addEventListener('click', round);
      $('#kg-dl', box).addEventListener('click', function () {
        var nm = $('#kg-name', box).value.replace(/[^\p{L}\p{N} .'-]/gu, '').trim(), cv = document.createElement('canvas'); cv.width = 1200; cv.height = 850; var x = cv.getContext('2d');
        x.fillStyle = '#fffdf5'; x.fillRect(0, 0, 1200, 850); x.strokeStyle = '#4f46e5'; x.lineWidth = 14; x.strokeRect(30, 30, 1140, 790); x.strokeStyle = '#facc15'; x.lineWidth = 4; x.strokeRect(54, 54, 1092, 742);
        x.textAlign = 'center'; x.fillStyle = '#1e1b4b'; x.font = '800 62px Arial, sans-serif'; x.fillText('Certificate of Achievement', 600, 200);
        x.font = '30px Arial, sans-serif'; x.fillStyle = '#475569'; x.fillText('This certificate is proudly given to', 600, 290);
        x.font = '800 70px Georgia, serif'; x.fillStyle = '#4f46e5'; x.fillText(nm || '____________________', 600, 400);
        x.font = '32px Arial, sans-serif'; x.fillStyle = '#1e1b4b'; x.fillText('for collecting ' + stars + ' stars in learning games', 600, 490); x.fillText('at GM Kids Corner', 600, 540);
        x.font = '110px Arial, sans-serif'; x.fillText('⭐ ⭐ ⭐', 600, 690);
        x.font = '24px Arial, sans-serif'; x.fillStyle = '#64748b'; x.fillText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '  ·  gmdkhantoolshub.github.io', 600, 775);
        cv.toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'GM-Kids-Certificate.jpg'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }, 'image/jpeg', 0.92);
      });
    }
    var hm = (location.hash || '').slice(1); if (MODES.some(function (m) { return m[0] === hm; })) mode = hm;
    paintPills(); round();
  }
  window.NiaziTools = window.NiaziTools || {};
  NiaziTools['kids-games'] = function (r) { game(r); };
})();
