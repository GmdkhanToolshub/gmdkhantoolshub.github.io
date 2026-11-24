/* GM Reasoning Test: pattern-matrix puzzles (original). Practice mode scores in the browser and is not certifiable. Certified mode is scored on the server (needs the payments API).
   This is a reasoning quiz, NOT a clinical IQ test, and it does not output an IQ number. */
(function () {
  'use strict';
  var SH = ['circle', 'square', 'triangle'], FL = ['outlined', 'striped', 'solid'], SZ = ['small', 'medium', 'large'], MK = ['no marker', 'a dot', 'a bar'], uid = 0;
  var BANDS = [[90, 'Very high', 'You solved almost every puzzle, including the hardest ones.'], [75, 'High', 'You handled most of the hard puzzles well.'], [55, 'Above average for this test', 'You solved most of the medium puzzles and some hard ones.'], [35, 'Average for this test', 'You solved the easier puzzles and some medium ones.'], [0, 'Developing', 'Keep practising: look for what changes along each row.']];
  function band(p) { for (var i = 0; i < BANDS.length; i++) if (p >= BANDS[i][0]) return BANDS[i]; return BANDS[BANDS.length - 1]; }
  function describe(c) { return c[1] + ' ' + SZ[c[3]] + ' ' + FL[c[2]] + ' ' + SH[c[0]] + (c[1] > 1 ? 's' : '') + ', ' + MK[c[4]]; }
  function shapeEl(ns, s, x, y, r, fill, stroke, f, pid) {
    var e; if (s === 0) { e = document.createElementNS(ns, 'circle'); e.setAttribute('cx', x); e.setAttribute('cy', y); e.setAttribute('r', r); }
    else if (s === 1) { e = document.createElementNS(ns, 'rect'); e.setAttribute('x', x - r); e.setAttribute('y', y - r); e.setAttribute('width', 2 * r); e.setAttribute('height', 2 * r); }
    else { e = document.createElementNS(ns, 'polygon'); e.setAttribute('points', x + ',' + (y - r * 1.15) + ' ' + (x - r * 1.1) + ',' + (y + r * 0.85) + ' ' + (x + r * 1.1) + ',' + (y + r * 0.85)); }
    e.setAttribute('stroke', stroke); e.setAttribute('stroke-width', 2.2); e.setAttribute('fill', f === 2 ? fill : f === 1 ? 'url(#' + pid + ')' : 'none'); return e;
  }
  function cellSvg(c, size) {
    var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('width', size || 90); svg.setAttribute('height', size || 90); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    var pid = 'rp' + (++uid), defs = document.createElementNS(ns, 'defs'), pat = document.createElementNS(ns, 'pattern'); pat.setAttribute('id', pid); pat.setAttribute('width', 6); pat.setAttribute('height', 6); pat.setAttribute('patternUnits', 'userSpaceOnUse'); pat.setAttribute('patternTransform', 'rotate(45)');
    var ln = document.createElementNS(ns, 'line'); ln.setAttribute('x1', 0); ln.setAttribute('y1', 0); ln.setAttribute('x2', 0); ln.setAttribute('y2', 6); ln.setAttribute('stroke', '#0e7490'); ln.setAttribute('stroke-width', 3); pat.appendChild(ln); defs.appendChild(pat); svg.appendChild(defs);
    var r = [8, 11, 14][c[3]], pos = c[1] === 1 ? [[50, 50]] : c[1] === 2 ? [[32, 50], [68, 50]] : [[50, 28], [30, 70], [70, 70]], stroke = '#0b1b34';
    pos.forEach(function (p) {
      svg.appendChild(shapeEl(ns, c[0], p[0], p[1], r, '#0e7490', stroke, c[2], pid));
      if (c[4] === 1) { var d = document.createElementNS(ns, 'circle'); d.setAttribute('cx', p[0]); d.setAttribute('cy', p[1]); d.setAttribute('r', 2.6); d.setAttribute('fill', c[2] === 2 ? '#fff' : stroke); svg.appendChild(d); }
      if (c[4] === 2) { var b = document.createElementNS(ns, 'line'); b.setAttribute('x1', p[0] - 5); b.setAttribute('y1', p[1]); b.setAttribute('x2', p[0] + 5); b.setAttribute('y2', p[1]); b.setAttribute('stroke', c[2] === 2 ? '#fff' : stroke); b.setAttribute('stroke-width', 2.6); b.setAttribute('stroke-linecap', 'round'); svg.appendChild(b); }
    });
    return svg;
  }
  function el(t, cls, txt) { var n = document.createElement(t); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function mount(root, opt) {
    var P = window.GMPay, mode = opt.mode, qs = [], i = 0, answers = [], attempt = null, deadline = 0, tick = null;
    root.textContent = '';
    function intro() {
      root.textContent = ''; var c = el('div', 'rt-card');
      c.appendChild(el('h2', '', mode === 'certified' ? 'Certified reasoning test' : 'Free practice reasoning test'));
      var ul = el('ul'); [(mode === 'certified' ? '30' : '20') + ' pattern puzzles, from easy to hard. Find the piece that completes the 3 by 3 grid.', 'Look at what changes along each row: the shape, how many, the fill, the size or the marker.', mode === 'certified' ? 'You have 35 minutes once you start. The score is calculated on our server, so you can buy a verifiable certificate afterwards.' : 'Take your time. Your score is calculated in your browser and shown with the answers. It cannot be certified.', 'This is a reasoning quiz, not a clinical IQ test. It gives a score out of 100 and a level for this test only, never an IQ number.'].forEach(function (t) { ul.appendChild(el('li', '', t)); }); c.appendChild(ul);
      var b = el('button', 'btn btn-primary btn-lg', 'Start the test'); b.type = 'button'; c.appendChild(b); var m = el('p', 'small rt-err', ''); m.setAttribute('role', 'alert'); c.appendChild(m); root.appendChild(c);
      b.addEventListener('click', function () { b.disabled = true; load(m, b); });
    }
    function load(m, b) {
      fetch(opt.bankUrl).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { qs = j.questions; answers = new Array(qs.length).fill(null); if (mode === 'certified') return P.api('/api/quiz/start', { method: 'POST', json: { bank: 'certified' } }).then(function (a) { attempt = a; deadline = Date.now() + a.seconds * 1000; }); }).then(function () { i = 0; question(); }, function (e) { m.textContent = (e && e.message) || 'The test could not be loaded. Please refresh the page.'; b.disabled = false; });
    }
    function question() {
      root.textContent = ''; clearInterval(tick); var q = qs[i], c = el('div', 'rt-card'), top = el('div', 'rt-top');
      top.appendChild(el('strong', '', 'Question ' + (i + 1) + ' of ' + qs.length)); var timer = el('span', 'rt-timer', ''); if (mode === 'certified') { top.appendChild(timer); var upd = function () { var s = Math.max(0, Math.round((deadline - Date.now()) / 1000)); timer.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' left'; if (!s) { clearInterval(tick); finish(); } }; upd(); tick = setInterval(upd, 1000); }
      c.appendChild(top); var bar = el('div', 'rt-bar'), fill = el('span'); fill.style.width = (i / qs.length * 100) + '%'; bar.appendChild(fill); c.appendChild(bar);
      c.appendChild(el('p', 'rt-help', 'Which option completes the grid?'));
      var grid = el('div', 'rt-grid'); for (var k = 0; k < 9; k++) { var cell = el('div', 'rt-cell' + (k === 8 ? ' q' : '')); if (k < 8) cell.appendChild(cellSvg(q.grid[k], 78)); else cell.appendChild(el('span', '', '?')); grid.appendChild(cell); } c.appendChild(grid);
      var sr = el('ol', 'sr-only'); q.grid.forEach(function (g) { sr.appendChild(el('li', '', describe(g))); }); sr.appendChild(el('li', '', 'The missing piece, bottom right.')); c.appendChild(sr);
      var opts = el('div', 'rt-opts'); opts.setAttribute('role', 'radiogroup'); opts.setAttribute('aria-label', 'Answer options');
      q.options.forEach(function (o, n) { var b = el('button', 'rt-opt' + (answers[i] === n ? ' on' : '')); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', answers[i] === n ? 'true' : 'false'); b.setAttribute('aria-label', 'Option ' + (n + 1) + ': ' + describe(o)); b.appendChild(cellSvg(o, 70)); b.appendChild(el('span', 'rt-n', String(n + 1))); b.addEventListener('click', function () { answers[i] = n; [].forEach.call(opts.children, function (x, y) { x.classList.toggle('on', y === n); x.setAttribute('aria-checked', y === n ? 'true' : 'false'); }); nx.disabled = false; }); opts.appendChild(b); }); c.appendChild(opts);
      var row = el('div', 'rt-row'), skip = el('button', 'btn btn-ghost', 'Skip'); skip.type = 'button'; var nx = el('button', 'btn btn-primary', i === qs.length - 1 ? 'Finish' : 'Next'); nx.type = 'button'; nx.disabled = answers[i] == null; row.appendChild(skip); row.appendChild(nx); c.appendChild(row); root.appendChild(c);
      var go = function () { if (i === qs.length - 1) finish(); else { i++; question(); } };
      nx.addEventListener('click', go); skip.addEventListener('click', function () { answers[i] = answers[i]; go(); });
      c.addEventListener('keydown', function (e) { if (e.key >= '1' && e.key <= '8') { var b = opts.children[+e.key - 1]; if (b) b.click(); } else if (e.key === 'Enter' && !nx.disabled && document.activeElement && document.activeElement.tagName !== 'BUTTON') nx.click(); });
      var f = opts.children[0]; if (f && !window.matchMedia('(pointer: coarse)').matches) f.focus({ preventScroll: true });
    }
    function finish() {
      clearInterval(tick);
      if (mode === 'certified') { root.textContent = ''; root.appendChild(el('div', 'rt-card', 'Scoring…')); P.api('/api/quiz/' + attempt.attempt_id + '/finish', { method: 'POST', token: attempt.token, json: { answers: answers.map(function (a) { return a == null ? null : a; }) } }).then(function (r) { result(r); }, function (e) { root.textContent = ''; var c = el('div', 'rt-card'); c.appendChild(el('p', 'rt-err', e.message)); root.appendChild(c); }); return; }
      var w = [1, 2, 3, 4], got = 0, tot = 0, right = 0; qs.forEach(function (q, k) { tot += w[q.level - 1]; if (answers[k] === q.answer) { got += w[q.level - 1]; right++; } }); result({ raw: right, total: qs.length, pct: Math.round(got / tot * 100) });
    }
    function result(r) {
      root.textContent = ''; var b = band(r.pct), c = el('div', 'rt-card rt-result');
      c.appendChild(el('h2', '', mode === 'certified' ? 'Your certified result' : 'Your practice result'));
      var big = el('div', 'rt-big'); big.appendChild(el('strong', '', r.pct + '/100')); big.appendChild(el('span', '', 'Reasoning score')); c.appendChild(big);
      c.appendChild(el('p', '', r.raw + ' of ' + r.total + ' puzzles correct. Level: ' + b[1] + '. ' + b[2]));
      c.appendChild(el('p', 'small muted', 'The score weights harder puzzles more. The level describes this test only. It is not an IQ score, and no percentile is shown because we do not yet have enough results to compare you fairly.'));
      if (mode === 'practice') {
        var rv = el('details'); rv.appendChild(el('summary', '', 'Review your answers')); var ul = el('ul'); qs.forEach(function (q, k) { ul.appendChild(el('li', '', 'Puzzle ' + (k + 1) + ': ' + (answers[k] == null ? 'skipped' : answers[k] === q.answer ? 'correct' : 'your option ' + (answers[k] + 1) + ', correct option ' + (q.answer + 1)))); }); rv.appendChild(ul); c.appendChild(rv);
        var row = el('div', 'rt-row'), again = el('button', 'btn btn-ghost', 'Try again'); again.type = 'button'; again.addEventListener('click', intro); row.appendChild(again);
        var cert = el('a', 'btn btn-primary', 'Take the certified test'); cert.href = (opt.certUrl || '#'); row.appendChild(cert); c.appendChild(row);
      } else {
        var cta = el('div', 'rt-cert'); cta.appendChild(el('h3', '', 'Get your certificate')); cta.appendChild(el('p', 'small', 'A shareable Certificate of Completion with your name, score, level, date and a verification ID anyone can check. It states that this is not a clinical IQ assessment.')); var a = el('a', 'btn btn-primary', 'Buy the certificate'); a.href = '../../checkout/?product=reasoning-certificate&attempt=' + encodeURIComponent(r.attempt_id) + '#a=' + encodeURIComponent(attempt.token); cta.appendChild(a); c.appendChild(cta);
      }
      root.appendChild(c); if (window.GM_track) window.GM_track('reasoning_test_done', { mode: mode });
    }
    intro();
  }
  window.GMQuiz = { mount: mount, cellSvg: cellSvg, describe: describe };
})();
