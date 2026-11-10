/* Kids Corner: Puzzle World. Picture Swap and Sliding Puzzle with three levels. Runs in the browser only. */
(function () {
  'use strict';
  var G = window.GMK, el = G.el, rnd = G.rnd, shuf = G.shuf;
  var PAL = [['#7dd3fc', '#fde68a', '#ef4444', '#22c55e'], ['#fbcfe8', '#fef08a', '#6366f1', '#16a34a'], ['#a7f3d0', '#fdba74', '#f97316', '#0ea5e9'], ['#c7d2fe', '#fecaca', '#a855f7', '#65a30d']];
  /* A bright, simple scene drawn with shapes so every tile looks different. */
  function scene(S) {
    var cv = document.createElement('canvas'); cv.width = cv.height = S; var c = cv.getContext('2d'), p = PAL[rnd(PAL.length)], u = S / 100;
    var g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, p[0]); g.addColorStop(1, '#ffffff'); c.fillStyle = g; c.fillRect(0, 0, S, S);
    c.fillStyle = p[1]; c.beginPath(); c.arc(80 * u, 18 * u, 11 * u, 0, 7); c.fill();
    c.fillStyle = '#fff'; [[18, 16], [34, 24]].forEach(function (q) { c.beginPath(); c.arc(q[0] * u, q[1] * u, 7 * u, 0, 7); c.arc((q[0] + 8) * u, (q[1] + 2) * u, 6 * u, 0, 7); c.arc((q[0] - 7) * u, (q[1] + 2) * u, 5 * u, 0, 7); c.fill(); });
    c.fillStyle = p[3]; c.beginPath(); c.moveTo(0, 70 * u); c.quadraticCurveTo(30 * u, 48 * u, 60 * u, 68 * u); c.quadraticCurveTo(85 * u, 52 * u, S, 66 * u); c.lineTo(S, S); c.lineTo(0, S); c.fill();
    c.fillStyle = '#fef3c7'; c.fillRect(22 * u, 58 * u, 26 * u, 22 * u); c.fillStyle = p[2]; c.beginPath(); c.moveTo(18 * u, 59 * u); c.lineTo(35 * u, 42 * u); c.lineTo(52 * u, 59 * u); c.fill();
    c.fillStyle = '#92400e'; c.fillRect(31 * u, 68 * u, 8 * u, 12 * u); c.fillStyle = '#38bdf8'; c.fillRect(24 * u, 62 * u, 6 * u, 6 * u);
    c.fillStyle = '#92400e'; c.fillRect(72 * u, 62 * u, 4 * u, 18 * u); c.fillStyle = '#15803d'; c.beginPath(); c.arc(74 * u, 56 * u, 11 * u, 0, 7); c.fill();
    c.fillStyle = p[2]; for (var i = 0; i < 5; i++) { c.beginPath(); c.arc((8 + i * 7) * u, 90 * u, 2.4 * u, 0, 7); c.fill(); }
    return cv; }
  function tileCanvas(src, N, i, px) { var t = document.createElement('canvas'); t.width = t.height = px; var s = src.width / N; t.getContext('2d').drawImage(src, (i % N) * s, Math.floor(i / N) * s, s, s, 0, 0, px, px); return t; }

  function run(root) {
    root.innerHTML = ''; G.starBar(root, 'puzzles');
    var mode = 'swap', level = 'easy', moves = 0, board, info, msg, src, pick = -1, order = [], N = 3, won = false, TS = 96;
    var top = el('div', 'kc-top'), pills = el('div', 'kg-pills'); pills.setAttribute('role', 'group'); pills.setAttribute('aria-label', 'Choose a puzzle');
    [['swap', '🖼️ Picture Swap'], ['slide', '🔲 Sliding Puzzle']].forEach(function (m) { var b = el('button', 'pill', m[1]); b.type = 'button'; b.dataset.m = m[0]; b.addEventListener('click', function () { mode = m[0]; start(); }); pills.appendChild(b); });
    top.appendChild(pills); root.appendChild(top);
    G.levels(top, function (l) { level = l; start(); }, level);
    info = el('p', 'kc-info'); msg = el('p', 'kg-msg'); msg.setAttribute('role', 'status'); msg.setAttribute('aria-live', 'polite'); board = el('div', 'kc-board');
    var tools = el('div', 'kc-tools'); var nb = el('button', 'btn btn-primary btn-sm', 'New puzzle'); nb.type = 'button'; nb.addEventListener('click', start); var pv = el('button', 'btn btn-ghost btn-sm', 'Peek at the picture'); pv.type = 'button'; pv.addEventListener('click', peek); tools.appendChild(nb); tools.appendChild(pv);
    root.appendChild(info); root.appendChild(board); root.appendChild(msg); root.appendChild(tools);
    function peek() { var im = el('div', 'kc-peek'); im.appendChild(src.cloneNode()); var c = im.firstChild.getContext ? im.firstChild : null; im.firstChild.getContext('2d').drawImage(src, 0, 0); im.addEventListener('click', function () { im.remove(); }); document.body.appendChild(im); setTimeout(function () { im.remove(); }, 2500); }
    function paintPills() { [].forEach.call(pills.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.m === mode)); }); }
    function start() {
      won = false; moves = 0; pick = -1; msg.className = 'kg-msg'; msg.textContent = ''; paintPills(); src = scene(300);
      N = mode === 'swap' ? { easy: 2, medium: 3, hard: 4 }[level] : { easy: 3, medium: 3, hard: 4 }[level];
      var n = N * N, i;
      if (mode === 'swap') { order = shuf(Array.apply(null, Array(n)).map(function (_, k) { return k; })); var tries = 0; while (order.every(function (v, k) { return v === k; }) && tries++ < 5) order = shuf(order); }
      else { order = Array.apply(null, Array(n)).map(function (_, k) { return k; }); var blank = n - 1, steps = { easy: 14, medium: 70, hard: 140 }[level], last = -1; for (i = 0; i < steps; i++) { var nb = neighbours(blank, N).filter(function (x) { return x !== last; }); var m = nb[rnd(nb.length)]; order[blank] = order[m]; order[m] = n - 1; last = blank; blank = m; } if (order.every(function (v, k) { return v === k; })) { order[n - 1] = order[n - 2]; order[n - 2] = n - 1; } }
      board.style.gridTemplateColumns = 'repeat(' + N + ', 1fr)'; board.style.maxWidth = Math.min(420, N * 110) + 'px'; draw(); }
    function neighbours(i, n) { var r = Math.floor(i / n), c = i % n, a = []; if (r > 0) a.push(i - n); if (r < n - 1) a.push(i + n); if (c > 0) a.push(i - 1); if (c < n - 1) a.push(i + 1); return a; }
    function draw() {
      board.innerHTML = ''; info.textContent = (mode === 'swap' ? 'Tap two pieces to swap them. ' : 'Tap a piece next to the empty space to slide it. ') + 'Moves: ' + moves;
      order.forEach(function (v, i) {
        var b = el('button', 'kc-tile'); b.type = 'button'; b.dataset.pos = i; b.dataset.c = v; var blankTile = mode === 'slide' && v === N * N - 1;
        if (blankTile) { b.classList.add('empty'); b.setAttribute('aria-label', 'Empty space'); } else { b.appendChild(tileCanvas(src, N, v, TS)); b.setAttribute('aria-label', 'Piece ' + (v + 1) + ' in position ' + (i + 1)); if (mode === 'slide') b.appendChild(el('i', 'kc-num', String(v + 1))); }
        if (mode === 'swap' && pick === i) b.classList.add('sel');
        if (v === i && !blankTile) b.classList.add('ok');
        b.addEventListener('click', function () { tap(i); }); board.appendChild(b); }); }
    function tap(i) {
      if (won) return;
      if (mode === 'swap') { if (pick < 0) { pick = i; draw(); return; } if (pick !== i) { var t = order[pick]; order[pick] = order[i]; order[i] = t; moves++; } pick = -1; draw(); }
      else { var b = order.indexOf(N * N - 1); if (neighbours(b, N).indexOf(i) < 0) { msg.className = 'kg-msg no'; msg.textContent = 'Pick a piece next to the empty space.'; return; } msg.textContent = ''; msg.className = 'kg-msg'; order[b] = order[i]; order[i] = N * N - 1; moves++; draw(); }
      if (order.every(function (v, k) { return v === k; })) finish(); }
    function finish() { won = true; board.classList.add('done'); msg.className = 'kg-msg ok'; msg.textContent = 'Puzzle solved in ' + moves + ' moves!'; var st = { easy: 1, medium: 2, hard: 3 }[level]; G.award(st, 'puzzles', board, 'You solved it!'); }
    root._solve = function () { if (mode === 'swap') { order = order.map(function (_, k) { return k; }); moves++; draw(); finish(); } else { order = order.map(function (_, k) { return k; }); moves++; draw(); finish(); } };
    start(); }
  window.NiaziTools = window.NiaziTools || {}; NiaziTools['kids-puzzles'] = function (r) { run(r); };
})();
