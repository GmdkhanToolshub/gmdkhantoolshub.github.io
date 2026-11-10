/* Kids Corner shared helpers: stars, badges, daily challenge, celebrations, levels, certificate.
   Everything stays in this browser (localStorage). No accounts, no names, no tracking, no adverts. */
(function () {
  'use strict';
  var SK = 'gm.kids.stars', DK = 'gm.kids.done', YK = 'gm.kids.daily', GOAL = 20;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TOOLS = { games: 'Learning Games', puzzles: 'Puzzle World', brain: 'Brain Booster', cartoon: 'Cartoon Maker', space: 'Space Explorer', animals: 'Animal Kingdom', music: 'Music Studio', blocks: 'Building Blocks', science: 'Little Scientist', draw: 'Drawing Studio' };
  var BADGES = [[5, 'Sparkle', '✨'], [20, 'Star Collector', '⭐'], [50, 'Super Learner', '🚀'], [100, 'Champion', '🏆'], [200, 'Legend', '👑']];
  var DAILY = [['puzzles', 'Finish 2 puzzles'], ['brain', 'Win 2 brain games'], ['space', 'Learn about 3 planets'], ['animals', 'Meet 3 animals'], ['science', 'Try 2 experiments'], ['games', 'Answer 5 questions'], ['music', 'Play a tune'], ['blocks', 'Build something and save it'], ['cartoon', 'Make a cartoon character']];
  function $(s, r) { return (r || document).querySelector(s); }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function gj(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function sj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function stars() { try { return Math.max(0, parseInt(localStorage.getItem(SK), 10) || 0); } catch (e) { return 0; } }
  function today() { return new Date().toISOString().slice(0, 10); }
  function dailyFor(d) { var n = 0; for (var i = 0; i < d.length; i++) n = (n * 31 + d.charCodeAt(i)) % 9973; return DAILY[n % DAILY.length]; }
  function say(t) { try { var s = window.speechSynthesis; if (!s) return; s.cancel(); var u = new SpeechSynthesisUtterance(t); u.rate = 0.85; u.pitch = 1.2; s.speak(u); } catch (e) {} }
  function badges() { var n = stars(), done = gj(DK, {}), kinds = Object.keys(done).length, out = [];
    BADGES.forEach(function (b) { out.push({ name: b[1], icon: b[2], need: b[0] + ' stars', got: n >= b[0] }); });
    out.push({ name: 'Explorer', icon: '🧭', need: 'Try 3 gadgets', got: kinds >= 3 }); out.push({ name: 'Adventurer', icon: '🗺️', need: 'Try 6 gadgets', got: kinds >= 6 }); out.push({ name: 'Master Explorer', icon: '🌍', need: 'Try 9 gadgets', got: kinds >= 9 }); return out; }
  function daily() { var t = today(), d = gj(YK, {}); if (d.date !== t) d = { date: t, count: 0, paid: false }; var c = dailyFor(t); return { tool: c[0], text: c[1], count: d.count, paid: d.paid, goal: 1, date: t }; }
  function toast(msg) { var t = el('div', 'kc-toast', msg); t.setAttribute('role', 'status'); document.body.appendChild(t); setTimeout(function () { t.classList.add('out'); }, 2300); setTimeout(function () { t.remove(); }, 2800); }
  function confetti(at) { if (reduce) return; var box = el('div', 'kc-confetti'); box.setAttribute('aria-hidden', 'true'); var r = at ? at.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 3, width: 0 }; box.style.left = (r.left + r.width / 2) + 'px'; box.style.top = r.top + 'px';
    var em = ['⭐', '🎉', '✨', '🌟', '🎈'];
    for (var i = 0; i < 10; i++) { var s = el('span', '', em[rnd(5)]); s.style.setProperty('--dx', (rnd(200) - 100) + 'px'); s.style.setProperty('--dy', (-60 - rnd(110)) + 'px'); s.style.animationDelay = (i * 25) + 'ms'; box.appendChild(s); }
    document.body.appendChild(box); setTimeout(function () { box.remove(); }, 1400); }
  /* Award stars for a finished activity. toolId counts towards badges and the daily challenge. */
  function award(n, toolId, anchor, note) {
    var before = stars(), after = before + (n || 1); try { localStorage.setItem(SK, String(after)); } catch (e) {}
    var done = gj(DK, {}); if (toolId) { done[toolId] = (done[toolId] || 0) + 1; sj(DK, done); }
    var d = daily(), extra = 0; if (toolId && toolId === d.tool && !d.paid) { sj(YK, { date: d.date, count: d.count + 1, paid: true }); extra = 3; try { localStorage.setItem(SK, String(after + extra)); } catch (e) {} }
    confetti(anchor); var msg = (note || 'Great job!') + ' +' + (n + extra) + ' ⭐' + (extra ? ' (daily challenge done!)' : '');
    BADGES.forEach(function (b) { if (before < b[0] && after + extra >= b[0]) msg += '  New badge: ' + b[2] + ' ' + b[1] + '!'; });
    toast(msg); refresh(); return after + extra; }
  var bars = [];
  function refresh() { bars.forEach(function (b) { b(); }); }
  /* Star bar shown at the top of each gadget. */
  function starBar(host, toolId) {
    var bar = el('div', 'kc-bar'); host.insertBefore(bar, host.firstChild);
    function paint() { var n = stars(), inl = n % GOAL, dl = daily(); bar.innerHTML = '<span class="kc-star" aria-hidden="true">⭐</span><b>' + n + ' stars</b><span class="kc-track" role="progressbar" aria-valuemin="0" aria-valuemax="' + GOAL + '" aria-valuenow="' + inl + '" aria-label="Progress to the next certificate"><i style="width:' + (inl / GOAL * 100) + '%"></i></span><span class="kc-day' + (dl.paid ? ' ok' : '') + '">' + (dl.paid ? '✅ Daily challenge done' : '🎯 Daily: ' + dl.text + ' in ' + TOOLS[dl.tool]) + '</span>'; }
    paint(); bars.push(paint); return bar; }
  /* Beginner / Intermediate / Advanced selector. cb(level) with 'easy' | 'medium' | 'hard'. */
  function levels(host, cb, start) { var cur = start || 'easy', w = el('div', 'kc-levels'); w.setAttribute('role', 'group'); w.setAttribute('aria-label', 'Level');
    [['easy', 'Beginner'], ['medium', 'Intermediate'], ['hard', 'Advanced']].forEach(function (l) { var b = el('button', 'pill', l[1]); b.type = 'button'; b.dataset.level = l[0]; b.setAttribute('aria-pressed', String(l[0] === cur)); b.addEventListener('click', function () { cur = l[0]; [].forEach.call(w.children, function (x) { x.setAttribute('aria-pressed', String(x.dataset.level === cur)); }); cb(cur); }); w.appendChild(b); });
    host.appendChild(w); return { get: function () { return cur; } }; }
  function certificate(n, name) {
    var cv = document.createElement('canvas'); cv.width = 1200; cv.height = 850; var x = cv.getContext('2d');
    x.fillStyle = '#fffdf5'; x.fillRect(0, 0, 1200, 850); x.strokeStyle = '#4f46e5'; x.lineWidth = 14; x.strokeRect(30, 30, 1140, 790); x.strokeStyle = '#facc15'; x.lineWidth = 4; x.strokeRect(54, 54, 1092, 742);
    x.textAlign = 'center'; x.fillStyle = '#1e1b4b'; x.font = '800 62px Arial, sans-serif'; x.fillText('Certificate of Achievement', 600, 200); x.font = '30px Arial, sans-serif'; x.fillStyle = '#475569'; x.fillText('This certificate is proudly given to', 600, 290);
    x.font = '800 70px Georgia, serif'; x.fillStyle = '#4f46e5'; x.fillText(name || '____________________', 600, 400); x.font = '32px Arial, sans-serif'; x.fillStyle = '#1e1b4b'; x.fillText('for collecting ' + n + ' stars in learning and play', 600, 490); x.fillText('at GM Kids Corner', 600, 540);
    x.font = '110px Arial, sans-serif'; x.fillText('⭐ ⭐ ⭐', 600, 690); x.font = '24px Arial, sans-serif'; x.fillStyle = '#64748b'; x.fillText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '  ·  gmdkhantoolshub.github.io', 600, 775);
    cv.toBlob(function (b) { download(b, 'GM-Kids-Certificate.jpg'); }, 'image/jpeg', 0.92); }
  function download(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 600); }
  /* Save an SVG element or canvas as PNG. */
  function savePng(src, name, w, h) {
    function out(cv) { cv.toBlob(function (b) { download(b, name); }, 'image/png'); }
    if (src.tagName && src.tagName.toLowerCase() === 'canvas') { out(src); return; }
    var xml = new XMLSerializer().serializeToString(src), img = new Image(), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    img.onload = function () { var c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.drawImage(img, 0, 0, w, h); out(cv); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml); }
  window.GMK = { $: $, el: el, rnd: rnd, shuf: shuf, say: say, stars: stars, award: award, starBar: starBar, levels: levels, badges: badges, daily: daily, TOOLS: TOOLS, certificate: certificate, download: download, savePng: savePng, toast: toast, confetti: confetti, GOAL: GOAL, reduce: reduce };
  window.NiaziTools = window.NiaziTools || {};
})();
