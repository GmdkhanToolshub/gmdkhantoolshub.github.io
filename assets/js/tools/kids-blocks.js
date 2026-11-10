/* Kids Corner: Creative Building Blocks. A grid builder with blocks, shapes, undo, challenges and PNG saving. Browser only. */
(function () {
  'use strict';
  var G = window.GMK, el = G.el;
  var COLS = 16, ROWS = 12, CS = 30, W = COLS * CS, H = ROWS * CS;
  var COLORS = [['red', '#ef4444'], ['orange', '#f97316'], ['yellow', '#facc15'], ['green', '#22c55e'], ['blue', '#3b82f6'], ['purple', '#a855f7'], ['pink', '#ec4899'], ['brown', '#92400e'], ['grey', '#9ca3af'], ['white', '#f8fafc']];
  var SHAPES = [['block', '🟦 Block'], ['roof', '🔺 Roof'], ['window', '🪟 Window'], ['door', '🚪 Door'], ['wheel', '⚫ Wheel'], ['tree', '🌳 Tree'], ['sun', '☀️ Sun'], ['star', '⭐ Star'], ['erase', '🧽 Rub out']];
  var TASKS = { easy: ['Build a small house', 'Build a tall tower', 'Build a tree and a sun'], medium: ['Build a car with two wheels', 'Build a house with a roof, door and window', 'Build a rocket'], hard: ['Build a castle with towers', 'Build a town with three houses', 'Build a bridge'] };
  function run(root) {
    root.innerHTML = ''; G.starBar(root, 'blocks');
    var color = '#ef4444', shape = 'block', grid = [], hist = [], down = false, level = 'easy', saved = false, cv, c, taskI = 0;
    for (var r = 0; r < ROWS; r++) { grid.push([]); for (var q = 0; q < COLS; q++) grid[r].push(null); }
    var top = el('div', 'kc-top'); var sp = el('div', 'kg-pills'); sp.setAttribute('role', 'group'); sp.setAttribute('aria-label', 'Shapes');
    SHAPES.forEach(function (s) { var b = el('button', 'pill', s[1]); b.type = 'button'; b.dataset.s = s[0]; b.setAttribute('aria-pressed', String(s[0] === shape)); b.addEventListener('click', function () { shape = s[0]; [].forEach.call(sp.children, function (x) { x.setAttribute('aria-pressed', String(x.dataset.s === shape)); }); }); sp.appendChild(b); });
    top.appendChild(sp); var cp = el('div', 'kc-colors'); cp.setAttribute('role', 'group'); cp.setAttribute('aria-label', 'Colours');
    COLORS.forEach(function (k, i) { var b = el('button', 'kc-swatch', ''); b.type = 'button'; b.style.background = k[1]; b.setAttribute('aria-label', k[0]); b.setAttribute('aria-pressed', String(k[1] === color)); b.addEventListener('click', function () { color = k[1]; [].forEach.call(cp.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); cp.appendChild(b); });
    top.appendChild(cp); root.appendChild(top);
    var wrap = el('div', 'kc-canvas'); cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Building area. Tap or drag to place blocks.'); wrap.appendChild(cv); root.appendChild(wrap); c = cv.getContext('2d');
    function draw() {
      var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#bae6fd'); g.addColorStop(1, '#e0f2fe'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.fillStyle = '#86efac'; c.fillRect(0, H - CS, W, CS);
      c.strokeStyle = 'rgba(15,23,42,.07)'; c.lineWidth = 1; for (var i = 1; i < COLS; i++) { c.beginPath(); c.moveTo(i * CS, 0); c.lineTo(i * CS, H); c.stroke(); } for (var j = 1; j < ROWS; j++) { c.beginPath(); c.moveTo(0, j * CS); c.lineTo(W, j * CS); c.stroke(); }
      for (var r = 0; r < ROWS; r++) for (var q = 0; q < COLS; q++) { var cell = grid[r][q]; if (cell) piece(cell, q * CS, r * CS); } }
    function piece(cell, x, y) {
      var s = cell.s, k = cell.c, m = 2;
      if (s === 'block') { c.fillStyle = k; c.fillRect(x + 1, y + 1, CS - 2, CS - 2); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x + 1, y + 1, CS - 2, 5); c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(x + 1, y + CS - 6, CS - 2, 5); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.arc(x + CS / 2, y + CS / 2, 4, 0, 7); c.fill(); }
      else if (s === 'roof') { c.fillStyle = k; c.beginPath(); c.moveTo(x, y + CS - m); c.lineTo(x + CS / 2, y + m); c.lineTo(x + CS, y + CS - m); c.closePath(); c.fill(); }
      else if (s === 'window') { c.fillStyle = '#7dd3fc'; c.fillRect(x + 4, y + 4, CS - 8, CS - 8); c.strokeStyle = k === '#f8fafc' ? '#475569' : k; c.lineWidth = 3; c.strokeRect(x + 4, y + 4, CS - 8, CS - 8); c.beginPath(); c.moveTo(x + CS / 2, y + 4); c.lineTo(x + CS / 2, y + CS - 4); c.moveTo(x + 4, y + CS / 2); c.lineTo(x + CS - 4, y + CS / 2); c.stroke(); }
      else if (s === 'door') { c.fillStyle = k; c.fillRect(x + 5, y + 2, CS - 10, CS - 2); c.fillStyle = '#fde68a'; c.beginPath(); c.arc(x + CS - 11, y + CS / 2 + 2, 2.5, 0, 7); c.fill(); }
      else if (s === 'wheel') { c.fillStyle = '#1f2937'; c.beginPath(); c.arc(x + CS / 2, y + CS / 2, CS / 2 - 3, 0, 7); c.fill(); c.fillStyle = k; c.beginPath(); c.arc(x + CS / 2, y + CS / 2, 6, 0, 7); c.fill(); }
      else if (s === 'tree') { c.fillStyle = '#92400e'; c.fillRect(x + CS / 2 - 3, y + CS * 0.55, 6, CS * 0.45); c.fillStyle = '#16a34a'; c.beginPath(); c.arc(x + CS / 2, y + CS * 0.4, CS * 0.36, 0, 7); c.fill(); }
      else if (s === 'sun') { c.fillStyle = '#facc15'; c.beginPath(); c.arc(x + CS / 2, y + CS / 2, CS * 0.32, 0, 7); c.fill(); c.strokeStyle = '#f59e0b'; c.lineWidth = 2; for (var a = 0; a < 8; a++) { c.beginPath(); c.moveTo(x + CS / 2 + Math.cos(a * 0.785) * CS * 0.38, y + CS / 2 + Math.sin(a * 0.785) * CS * 0.38); c.lineTo(x + CS / 2 + Math.cos(a * 0.785) * CS * 0.48, y + CS / 2 + Math.sin(a * 0.785) * CS * 0.48); c.stroke(); } }
      else if (s === 'star') { c.fillStyle = k; c.beginPath(); for (var i = 0; i < 10; i++) { var R = i % 2 ? CS * 0.2 : CS * 0.46, an = -1.5708 + i * 0.6283; c.lineTo(x + CS / 2 + Math.cos(an) * R, y + CS / 2 + Math.sin(an) * R); } c.closePath(); c.fill(); } }
    function cell(e) { var r = cv.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * COLS), y = Math.floor((e.clientY - r.top) / r.height * ROWS); return (x >= 0 && x < COLS && y >= 0 && y < ROWS) ? [x, y] : null; }
    function put(p) { if (!p) return; var cur = grid[p[1]][p[0]], nv = shape === 'erase' ? null : { s: shape, c: color }; if ((cur && nv && cur.s === nv.s && cur.c === nv.c) || (!cur && !nv)) return; grid[p[1]][p[0]] = nv; draw(); }
    function snap() { hist.push(JSON.stringify(grid)); if (hist.length > 40) hist.shift(); }
    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); down = true; snap(); put(cell(e)); try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    cv.addEventListener('pointermove', function (e) { if (down) put(cell(e)); }); cv.addEventListener('pointerup', function () { down = false; }); cv.addEventListener('pointercancel', function () { down = false; });
    root._place = function (x, y, s, k) { snap(); grid[y][x] = s === 'erase' ? null : { s: s, c: k || color }; draw(); };
    var tools = el('div', 'kc-tools'); function mk(t, cls, fn) { var b = el('button', 'btn ' + cls + ' btn-sm', t); b.type = 'button'; b.addEventListener('click', fn); tools.appendChild(b); return b; }
    mk('↩ Undo', 'btn-ghost', function () { if (hist.length) { grid = JSON.parse(hist.pop()); draw(); } });
    mk('🗑 Clear all', 'btn-ghost', function () { snap(); grid = grid.map(function (r) { return r.map(function () { return null; }); }); draw(); });
    mk('💾 Save picture', 'btn-primary', function () { G.savePng(cv, 'my-building.png', W, H); if (!saved) { saved = true; G.award(1, 'blocks', cv, 'Nice building!'); } });
    root.appendChild(tools);
    var ch = el('div', 'kg-area'); ch.style.marginTop = '14px'; ch.innerHTML = '<p class="kg-q">Building challenge</p>'; var lv = el('div'); G.levels(lv, function (l) { level = l; taskI = 0; task(); }, level); ch.appendChild(lv);
    var tt = el('p', 'kg-big'); tt.style.fontSize = '1.3rem'; var done = el('button', 'btn btn-primary btn-sm', 'I built it!'); done.type = 'button'; var nx = el('button', 'btn btn-ghost btn-sm', 'Another idea'); nx.type = 'button'; var m = el('p', 'kg-msg'); m.setAttribute('role', 'status'); m.setAttribute('aria-live', 'polite');
    ch.appendChild(tt); ch.appendChild(done); ch.appendChild(document.createTextNode(' ')); ch.appendChild(nx); ch.appendChild(m); root.appendChild(ch);
    function task() { tt.textContent = TASKS[level][taskI % 3]; m.textContent = ''; m.className = 'kg-msg'; }
    done.addEventListener('click', function () { var n = 0; grid.forEach(function (r) { r.forEach(function (x) { if (x) n++; }); }); if (n < 4) { m.className = 'kg-msg no'; m.textContent = 'Add a few more pieces first, then tap again.'; return; } m.className = 'kg-msg ok'; m.textContent = 'Amazing building!'; G.award({ easy: 1, medium: 2, hard: 3 }[level], 'blocks', ch, 'Great builder!'); });
    nx.addEventListener('click', function () { taskI++; task(); });
    task(); draw(); }
  window.NiaziTools = window.NiaziTools || {}; NiaziTools['kids-blocks'] = function (r) { run(r); };
})();
