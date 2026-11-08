/* Learn & Grow tools: vocabulary, grammar, general knowledge, computer basics, daily inspiration, interview practice,
   personal workspace and feedback. Everything runs in the browser; progress and notes are stored only on this device. */
(function () {
  'use strict';
  var L = window.GM_LEARN, T = window.NiaziTools = window.NiaziTools || {};
  function rnd(n) { var b = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n; do { crypto.getRandomValues(b); } while (b[0] >= lim); return b[0] % n; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ls(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function score(id, pts, total) { var s = ls('gm.scores', {}); var o = s[id] || { best: 0, plays: 0 }; o.plays++; o.last = pts + '/' + total; o.date = new Date().toISOString().slice(0, 10); if (pts / total > o.best) { o.best = pts / total; o.bestText = pts + '/' + total; } s[id] = o; lsSet('gm.scores', s); return o; }

  /* ----- generic multiple-choice quiz ----- */
  function quiz(root, U, cfg) {
    var esc = U.esc, items = cfg.items, cats = cfg.cats || null, cat = 'All', round = [], i = 0, pts = 0, answered = false;
    function pool() { return items.filter(function (q) { return cat === 'All' || q.cat === cat; }); }
    function start() { round = shuffle(pool()).slice(0, cfg.count || 10).map(function (q) { var order = shuffle(q.opts.map(function (o, k) { return k; })); return { q: q.q, why: q.why, cat: q.cat, opts: order.map(function (k) { return q.opts[k]; }), a: order.indexOf(q.a) }; }); i = 0; pts = 0; show(); }
    function head() { return (cats ? '<div class="pill-row" role="group" aria-label="Topic">' + ['All'].concat(cats).map(function (c) { return '<button type="button" class="pill" data-cat="' + esc(c) + '" aria-pressed="' + (c === cat) + '">' + esc(c) + '</button>'; }).join('') + '</div>' : ''); }
    function show() {
      var q = round[i]; answered = false;
      if (!q) { root.innerHTML = head() + '<div class="qz"><p>No questions are available for this topic yet.</p></div>'; return; }
      root.innerHTML = head() + '<div class="qz"><div class="qz-bar"><span>Question ' + (i + 1) + ' of ' + round.length + (q.cat ? ' · ' + esc(q.cat) : '') + '</span><span>Score: ' + pts + '</span></div><div class="qz-meter" aria-hidden="true"><i style="width:' + (i / round.length * 100) + '%"></i></div><p class="qz-q" id="qz-q">' + esc(q.q) + '</p><div class="qz-opts" role="group" aria-labelledby="qz-q">' + q.opts.map(function (o, k) { return '<button type="button" class="qz-opt" data-k="' + k + '">' + esc(o) + '</button>'; }).join('') + '</div><div id="qz-fb" aria-live="polite"></div></div>';
    }
    function finish() {
      var o = score(cfg.id, pts, round.length), pct = Math.round(pts / round.length * 100), msg = pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good effort. Practise again to improve.' : 'Keep practising. Every round helps.';
      root.innerHTML = head() + '<div class="qz"><div class="qz-score"><b>' + pts + ' / ' + round.length + '</b><p>' + msg + '</p><p class="small muted">Best on this device: ' + esc(o.bestText || '') + ' · Rounds played: ' + o.plays + '</p></div><div class="row-btns"><button type="button" class="btn btn-primary" id="qz-again">Play another round</button></div></div>';
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !root.contains(b)) return;
      if (b.dataset.cat !== undefined) { cat = b.dataset.cat; start(); return; }
      if (b.id === 'qz-again') { start(); return; }
      if (b.id === 'qz-next') { i++; if (i >= round.length) finish(); else show(); return; }
      if (b.classList.contains('qz-opt') && !answered) {
        answered = true; var q = round[i], k = +b.dataset.k, ok = k === q.a; if (ok) pts++;
        U.$$('.qz-opt', root).forEach(function (x, n) { x.disabled = true; if (n === q.a) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
        root.querySelector('#qz-fb').innerHTML = '<p class="qz-note"><b>' + (ok ? 'Correct! ' : 'Not quite. ') + '</b>' + esc(q.why) + '</p><button type="button" class="btn btn-primary qz-next" id="qz-next">' + (i + 1 >= round.length ? 'See my score' : 'Next question') + '</button>';
        root.querySelector('#qz-next').focus();
      }
    });
    start();
  }

  T['learn-grammar'] = function (r, U) { quiz(r, U, { id: 'grammar', count: 10, items: L.grammar.map(function (g) { return { q: g[0], opts: g[1], a: g[2], why: g[3], cat: '' }; }) }); };
  T['learn-general-knowledge'] = function (r, U) { var c = []; L.gk.forEach(function (g) { if (c.indexOf(g[0]) < 0) c.push(g[0]); }); quiz(r, U, { id: 'gk', count: 10, cats: c, items: L.gk.map(function (g) { return { cat: g[0], q: g[1], opts: g[2], a: g[3], why: g[4] }; }) }); };

  T['learn-computer-basics'] = function (r, U) {
    var esc = U.esc; r.innerHTML = '<div id="cb-tabs"></div><div id="cb-body"></div>';
    var body = r.querySelector('#cb-body');
    var cbSel = function (n) {
      if (n === 0) body.innerHTML = L.computer.lessons.map(function (l) { return '<article class="lesson"><h3>' + esc(l[0]) + '</h3><p>' + esc(l[1]) + '</p></article>'; }).join('');
      else { body.innerHTML = ''; var host = document.createElement('div'); body.appendChild(host); quiz(host, U, { id: 'computer', count: 10, items: L.computer.quiz.map(function (g) { return { q: g[0], opts: g[1], a: g[2], why: g[3], cat: '' }; }) }); }
 };
    U.tabs(r.querySelector('#cb-tabs'), ['Lessons', 'Quick quiz'], cbSel); cbSel(0);
  };

  /* ----- vocabulary: flashcards + quiz ----- */
  T['learn-vocabulary'] = function (r, U) {
    var esc = U.esc, level = 'All', deck = [], i = 0, flipped = false;
    r.innerHTML = '<div id="vc-tabs"></div><div id="vc-body"></div>'; var body = r.querySelector('#vc-body');
    function levels() { return '<div class="pill-row" role="group" aria-label="Level">' + ['All', 'Beginner', 'Intermediate', 'Advanced'].map(function (l) { return '<button type="button" class="pill" data-lv="' + l + '" aria-pressed="' + (l === level) + '">' + l + '</button>'; }).join('') + '</div>'; }
    function cards() {
      deck = L.vocab.filter(function (v) { return level === 'All' || v[1] === level; }); if (i >= deck.length) i = 0; var v = deck[i], known = ls('gm.vocab.known', []);
      body.innerHTML = levels() + '<p class="small muted" style="text-align:center">Card ' + (i + 1) + ' of ' + deck.length + ' · ' + esc(v[1]) + ' · Words you know: ' + known.length + '</p><div class="fc"><button type="button" class="fc-card" id="fc-flip" aria-live="polite">' + (flipped ? '<span class="fc-def">' + esc(v[2]) + '</span><span class="fc-ex">“' + esc(v[3]) + '”</span>' : '<span class="fc-word">' + esc(v[0]) + '</span><span class="small muted">Tap to see the meaning</span>') + '</button></div><div class="row-btns"><button type="button" class="btn btn-ghost" data-a="prev">← Previous</button><button type="button" class="btn btn-ghost" data-a="know">' + (known.indexOf(v[0]) >= 0 ? '✓ Marked as known' : 'I know this word') + '</button><button type="button" class="btn btn-primary" data-a="next">Next →</button><button type="button" class="btn btn-ghost" data-a="shuffle">🔀 Shuffle</button></div>';
    }
    function qz() {
      body.innerHTML = ''; var host = document.createElement('div'); body.appendChild(host);
      var pool = L.vocab, items = pool.map(function (v) { var wrong = shuffle(pool.filter(function (x) { return x[0] !== v[0]; })).slice(0, 3).map(function (x) { return x[2]; }); var opts = shuffle([v[2]].concat(wrong)); return { q: 'What does “' + v[0] + '” mean?', opts: opts, a: opts.indexOf(v[2]), why: '“' + v[0] + '” — ' + v[2] + ' Example: ' + v[3], cat: v[1] }; });
      quiz(host, U, { id: 'vocab', count: 10, cats: ['Beginner', 'Intermediate', 'Advanced'], items: items });
    }
    var vcSel = function (n) { flipped = false; if (n === 0) cards(); else qz(); };
    U.tabs(r.querySelector('#vc-tabs'), ['Flashcards', 'Word quiz'], vcSel); vcSel(0);
    r.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.lv) { level = b.dataset.lv; i = 0; flipped = false; cards(); }
      else if (b.id === 'fc-flip') { flipped = !flipped; cards(); r.querySelector('#fc-flip').focus(); }
      else if (b.dataset.a === 'next') { i = (i + 1) % deck.length; flipped = false; cards(); }
      else if (b.dataset.a === 'prev') { i = (i - 1 + deck.length) % deck.length; flipped = false; cards(); }
      else if (b.dataset.a === 'shuffle') { L.vocab = shuffle(L.vocab); i = 0; flipped = false; cards(); }
      else if (b.dataset.a === 'know') { var k = ls('gm.vocab.known', []), w = deck[i][0], p = k.indexOf(w); if (p >= 0) k.splice(p, 1); else k.push(w); lsSet('gm.vocab.known', k); cards(); }
    });
  };

  /* ----- daily inspiration ----- */
  T['daily-inspiration'] = function (r, U) {
    var esc = U.esc, day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000), cur = L.thoughts[day % L.thoughts.length], tip = L.tips[day % L.tips.length], pos = L.positive[(day * 7) % L.positive.length], les = L.lessons[day % L.lessons.length];
    function saved() { return ls('gm.saved', []); }
    function paint() {
      var s = saved();
      r.innerHTML = '<div class="dq"><p class="dq-text" id="dq-text">“' + esc(cur) + '”</p><p class="dq-by">Thought of the day · ' + esc(U.longDate ? U.longDate(U.today()) : U.today()) + '</p><div class="row-btns"><button type="button" class="btn btn-ghost" data-a="another">🔄 Another thought</button><button type="button" class="btn btn-ghost" data-a="copy">📋 Copy</button><button type="button" class="btn btn-ghost" data-a="save">' + (s.indexOf(cur) >= 0 ? '★ Saved' : '☆ Save') + '</button></div></div>' +
        '<div class="tip-grid"><div class="tip"><h3>Productivity tip</h3><p>' + esc(tip) + '</p></div><div class="tip"><h3>Positive message</h3><p>' + esc(pos) + '</p></div><div class="tip"><h3>Success lesson: ' + esc(les[0]) + '</h3><p>' + esc(les[1]) + '</p></div></div>' +
        (s.length ? '<h3 style="margin-top:26px">Your saved thoughts</h3><ul class="ws-list">' + s.map(function (t, k) { return '<li><span>' + esc(t) + '</span><button type="button" class="btn btn-ghost btn-sm" data-rm="' + k + '">Remove</button></li>'; }).join('') + '</ul><p class="small muted">Saved only in this browser. See them anytime in <a href="../workspace/">My workspace</a>.</p>' : '');
    }
    r.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'another') { var n; do { n = L.thoughts[rnd(L.thoughts.length)]; } while (n === cur && L.thoughts.length > 1); cur = n; paint(); }
      else if (b.dataset.a === 'copy') U.copy(cur, 'Copied to clipboard');
      else if (b.dataset.a === 'save') { var s = saved(), p = s.indexOf(cur); if (p >= 0) s.splice(p, 1); else s.unshift(cur); lsSet('gm.saved', s); paint(); }
      else if (b.dataset.rm !== undefined) { var s2 = saved(); s2.splice(+b.dataset.rm, 1); lsSet('gm.saved', s2); paint(); }
    });
    paint();
  };

  /* ----- interview practice ----- */
  T['interview-practice'] = function (r, U) {
    var esc = U.esc, cats = ['All', 'Common', 'Behavioural', 'Situational', 'Strengths', 'Your questions'], cat = 'All', mode = 'practice', cur = null, show = false, tm = null, left = 0, mock = [], mi = 0, ratings = [];
    function pick() { var p = L.interview.filter(function (q) { return cat === 'All' || q[0] === cat; }), n; if (!p.length) return null; do { n = p[rnd(p.length)]; } while (n === cur && p.length > 1); return n; }
    function notes() { return ls('gm.interview', {}); }
    function stopT() { if (tm) { clearInterval(tm); tm = null; } }
    function timerHTML() { return '<div class="ks-ch-timer"><button type="button" class="btn btn-ghost btn-sm" data-a="timer">' + (tm ? '⏹️ Stop timer' : '⏱️ Start 2-minute answer timer') + '</button><span id="iv-t" aria-live="off"></span></div>'; }
    function tick() { left--; var t = document.getElementById('iv-t'); if (t) t.textContent = Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2) + ' left'; if (left <= 0) { stopT(); if (t) t.textContent = 'Time is up. A good answer is usually 1–2 minutes.'; } }
    function qBlock(q) {
      var n = notes()[q[1]] || '';
      return '<p class="qz-q">' + esc(q[1]) + '</p><p class="small muted">' + esc(q[0]) + '</p>' + timerHTML() + '<label class="small" for="iv-notes" style="display:block;margin-top:12px"><b>Your answer notes</b> (saved on this device only)</label><textarea class="note-area" id="iv-notes" maxlength="1500" placeholder="Write your key points here. For behavioural questions use Situation, Task, Action, Result.">' + esc(n) + '</textarea>' +
        '<div class="row-btns" style="margin-top:12px"><button type="button" class="btn btn-ghost" data-a="tip">' + (show ? 'Hide' : 'Show') + ' how to answer</button></div>' + (show ? '<p class="qz-note"><b>How to answer: </b>' + esc(q[2]) + '</p>' : '');
    }
    function paint() {
      stopT(); var q = mode === 'practice' ? cur : mock[mi];
      var tabs = '<div class="pill-row"><button type="button" class="pill" data-mode="practice" aria-pressed="' + (mode === 'practice') + '">Practice</button><button type="button" class="pill" data-mode="mock" aria-pressed="' + (mode === 'mock') + '">Mock round (5 questions)</button></div>';
      if (mode === 'practice') { r.innerHTML = tabs + '<div class="pill-row" role="group" aria-label="Question type">' + cats.map(function (c) { return '<button type="button" class="pill" data-cat="' + esc(c) + '" aria-pressed="' + (c === cat) + '">' + esc(c) + '</button>'; }).join('') + '</div><div class="qz">' + qBlock(q) + '<div class="row-btns" style="margin-top:14px"><button type="button" class="btn btn-primary" data-a="new">🎲 New question</button></div></div>'; }
      else if (mi >= mock.length) { var avg = ratings.reduce(function (a, b) { return a + b; }, 0) / (ratings.length || 1); r.innerHTML = tabs + '<div class="qz"><div class="qz-score"><b>' + avg.toFixed(1) + ' / 5</b><p>Your average self-rating for this round.</p><p class="small muted">Review the questions you rated lowest and practise them again.</p></div><div class="row-btns"><button type="button" class="btn btn-primary" data-a="newmock">Start another mock round</button></div></div>'; }
      else { r.innerHTML = tabs + '<div class="qz"><div class="qz-bar"><span>Mock question ' + (mi + 1) + ' of ' + mock.length + '</span></div><div class="qz-meter"><i style="width:' + (mi / mock.length * 100) + '%"></i></div>' + qBlock(q) + '<p class="small" style="margin-top:14px"><b>How well did you answer?</b></p><div class="row-btns">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" class="btn btn-ghost" data-rate="' + n + '" aria-label="Rate ' + n + ' out of 5">' + n + '</button>'; }).join('') + '</div></div>'; }
    }
    r.addEventListener('input', function (e) { if (e.target.id !== 'iv-notes') return; var q = mode === 'practice' ? cur : mock[mi]; if (!q) return; var n = notes(); if (e.target.value) n[q[1]] = e.target.value; else delete n[q[1]]; lsSet('gm.interview', n); });
    r.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.mode) { mode = b.dataset.mode; show = false; if (mode === 'mock') { mock = shuffle(L.interview).slice(0, 5); mi = 0; ratings = []; } paint(); }
      else if (b.dataset.cat !== undefined) { cat = b.dataset.cat; cur = pick(); show = false; paint(); }
      else if (b.dataset.a === 'new') { cur = pick(); show = false; paint(); }
      else if (b.dataset.a === 'newmock') { mock = shuffle(L.interview).slice(0, 5); mi = 0; ratings = []; show = false; paint(); }
      else if (b.dataset.a === 'tip') { show = !show; var keep = document.getElementById('iv-notes'); var v = keep ? keep.value : ''; paint(); var ta = document.getElementById('iv-notes'); if (ta) ta.value = v; }
      else if (b.dataset.rate) { ratings.push(+b.dataset.rate); mi++; show = false; paint(); }
      else if (b.dataset.a === 'timer') { if (tm) { stopT(); b.textContent = '⏱️ Start 2-minute answer timer'; var t0 = document.getElementById('iv-t'); if (t0) t0.textContent = ''; } else { left = 120; tm = setInterval(tick, 1000); b.textContent = '⏹️ Stop timer'; var t1 = document.getElementById('iv-t'); if (t1) t1.textContent = '2:00 left'; } }
    });
    cur = pick(); paint();
  };

  /* ----- personal workspace ----- */
  T['my-workspace'] = function (r, U) {
    var esc = U.esc, TD = window.TOOLS_DATA || [];
    function tool(s) { return TD.filter(function (t) { return t.slug === s; })[0]; }
    function toolList(arr, empty) { var items = (arr || []).map(tool).filter(Boolean); return items.length ? '<ul class="ws-list">' + items.map(function (t) { return '<li><a href="../tools/' + t.slug + '/">' + esc(t.name) + '</a><span class="small muted">' + esc(t.cat) + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">' + empty + '</p>'; }
    function notes() { return ls('gm.notes', []); }
    function paint() {
      var sc = ls('gm.scores', {}), names = { vocab: 'Vocabulary quiz', grammar: 'Grammar quiz', gk: 'General knowledge quiz', computer: 'Computer basics quiz' }, saved = ls('gm.saved', []);
      r.innerHTML =
        '<section class="content-block"><h2>Favourite tools</h2>' + toolList(ls('niazi.favs', []), 'No favourites yet. Open any tool and press “Save to favourites”.') + '</section>' +
        '<section class="content-block"><h2>Recently used tools</h2>' + toolList(ls('niazi.recent', []), 'Tools you open will appear here.') + '</section>' +
        '<section class="content-block"><h2>My notes</h2><p class="small muted">Private notes stored only in this browser.</p><div id="ws-notes"></div><div class="row-btns" style="justify-content:flex-start;margin-top:10px"><button type="button" class="btn btn-primary btn-sm" data-a="addnote">+ New note</button></div></section>' +
        '<section class="content-block"><h2>My drawings</h2><p id="ws-art" class="muted">Checking your gallery…</p><p><a class="btn btn-ghost btn-sm" href="../kids/gallery/">Open my gallery</a> <a class="btn btn-ghost btn-sm" href="../kids/drawing-studio/">Draw something</a></p></section>' +
        '<section class="content-block"><h2>My learning progress</h2>' + (Object.keys(sc).length ? '<ul class="ws-list">' + Object.keys(sc).map(function (k) { return '<li><span>' + esc(names[k] || k) + '</span><span class="small muted">Best ' + esc(sc[k].bestText || '–') + ' · played ' + sc[k].plays + '×</span></li>'; }).join('') + '</ul>' : '<p class="muted">Take a quiz in <a href="../learn/">Learn &amp; Grow</a> and your best scores will appear here.</p>') + '</section>' +
        '<section class="content-block"><h2>Saved thoughts</h2>' + (saved.length ? '<ul class="ws-list">' + saved.map(function (t) { return '<li><span>' + esc(t) + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">Save a thought from <a href="../inspiration/">Daily Inspiration</a> to keep it here.</p>') + '</section>' +
        '<section class="content-block"><h2>Your data and privacy</h2><p>Everything on this page is stored only in your browser, never on our servers. You can download a copy or erase it at any time.</p><div class="row-btns" style="justify-content:flex-start"><button type="button" class="btn btn-ghost" data-a="export">⬇️ Download my data (JSON)</button><button type="button" class="btn btn-ghost" data-a="wipe">🗑️ Delete all my workspace data</button></div><p class="ks-msg" id="ws-msg" role="status" aria-live="polite"></p></section>';
      renderNotes();
      if (window.GMKids) GMKids.DB.all().then(function (a) { var e = document.getElementById('ws-art'); if (e) e.textContent = a.length ? a.length + ' picture' + (a.length === 1 ? '' : 's') + ' saved privately on this device.' : 'No saved drawings yet.'; }).catch(function () { var e = document.getElementById('ws-art'); if (e) e.textContent = 'Drawing storage is not available in this browser.'; });
    }
    function renderNotes() {
      var n = notes(), h = r.querySelector('#ws-notes'); if (!h) return;
      h.innerHTML = n.length ? n.map(function (x) { return '<div class="ws-note" data-id="' + esc(x.id) + '"><label class="small muted">Updated ' + new Date(x.t).toLocaleString() + '</label><textarea maxlength="5000" aria-label="Note text">' + esc(x.text) + '</textarea><button type="button" class="btn btn-ghost btn-sm" data-del="' + esc(x.id) + '">Delete note</button></div>'; }).join('') : '<p class="muted">No notes yet.</p>';
    }
    var timers = {};
    r.addEventListener('input', function (e) {
      var box = e.target.closest('.ws-note'); if (!box || e.target.tagName !== 'TEXTAREA') return;
      var id = box.dataset.id; clearTimeout(timers[id]); timers[id] = setTimeout(function () { var n = notes(); n.forEach(function (x) { if (x.id === id) { x.text = e.target.value; x.t = Date.now(); } }); lsSet('gm.notes', n); }, 400);
    });
    r.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var msg = function (t) { var m = r.querySelector('#ws-msg'); if (m) m.textContent = t; };
      if (b.dataset.a === 'addnote') { var n = notes(); n.unshift({ id: 'n' + Date.now().toString(36), text: '', t: Date.now() }); lsSet('gm.notes', n); renderNotes(); var ta = r.querySelector('.ws-note textarea'); if (ta) ta.focus(); }
      else if (b.dataset.del) { if (confirm('Delete this note?')) { lsSet('gm.notes', notes().filter(function (x) { return x.id !== b.dataset.del; })); renderNotes(); } }
      else if (b.dataset.a === 'export') { var data = { exportedAt: new Date().toISOString(), favourites: ls('niazi.favs', []), recent: ls('niazi.recent', []), notes: notes(), savedThoughts: ls('gm.saved', []), scores: ls('gm.scores', {}), interviewNotes: ls('gm.interview', {}), knownWords: ls('gm.vocab.known', []) }; U.download('gm-workspace-' + U.today() + '.json', JSON.stringify(data, null, 2), 'application/json'); msg('Downloaded. Saved drawings can be downloaded one by one from your gallery.'); }
      else if (b.dataset.a === 'wipe') {
        if (!confirm('Delete all your notes, saved thoughts, scores, favourites and saved drawings from this browser? This cannot be undone.')) return;
        ['gm.notes', 'gm.saved', 'gm.scores', 'gm.interview', 'gm.vocab.known', 'niazi.favs', 'niazi.recent'].forEach(function (k) { try { localStorage.removeItem(k); } catch (x) { /* ignore */ } });
        var done = function () { paint(); var m = r.querySelector('#ws-msg'); if (m) m.textContent = 'All workspace data was deleted.'; };
        if (window.GMKids) GMKids.DB.clear().then(done, done); else done();
      }
    });
    paint();
  };

  /* ----- Men & Women Corner: moderated story submission (nothing is published automatically) ----- */
  T['community-submit'] = function (r, U) {
    var C = window.SITE_CONFIG || {};
    var BAD = /\b(fuck|shit|bitch|bastard|asshole|slut|whore|nigg|cunt|dick|idiot|stupid|moron|kill yourself|rape)\w*/i;
    r.innerHTML = '<form class="form-stack" id="cs" novalidate><label>Type of story<select id="cs-type"><option>Achievement</option><option>Career experience</option><option>Professional journey</option><option>Inspiration and lessons learned</option><option>Positive review or recommendation</option></select></label><label>Name to show (first name or initials)<input id="cs-name" maxlength="30" required></label><label>Your story<textarea id="cs-text" maxlength="1500" required placeholder="Tell us what happened, what you learned, and how it can help others. Please leave out phone numbers, emails, links and other people’s private details."></textarea></label><label>Your email, only so we can reach you about your story (not published)<input id="cs-mail" type="email" maxlength="120" autocomplete="email"></label><label class="small" style="display:flex;gap:8px;align-items:flex-start;font-weight:400"><input id="cs-ok" type="checkbox" style="margin-top:4px"><span>I wrote this story myself, it is true, and I agree to it being published with the name above if it is approved. I understand I can ask for it to be removed.</span></label><div class="hp" aria-hidden="true"><label>Leave empty<input id="cs-hp" tabindex="-1" autocomplete="off"></label></div><div><button class="btn btn-primary" type="submit">Send for review</button></div><p class="ks-msg" id="cs-out" role="status" aria-live="polite"></p></form>';
    var out = r.querySelector('#cs-out'); function say(t, bad) { out.textContent = t; out.className = 'ks-msg' + (bad ? ' bad' : ''); }
    r.querySelector('#cs').addEventListener('submit', function (e) {
      e.preventDefault(); if (r.querySelector('#cs-hp').value) return;
      var name = r.querySelector('#cs-name').value.trim(), text = r.querySelector('#cs-text').value.trim(), mail = r.querySelector('#cs-mail').value.trim();
      if (name.length < 2) return say('Please enter a first name or initials to show.', true);
      if (text.length < 50) return say('Please write at least 50 characters so the story is useful to others.', true);
      if (BAD.test(text) || BAD.test(name)) return say('Please remove abusive or offensive language. Our guidelines require respectful writing.', true);
      if (/https?:\/\/|www\.|\.com\b|\.pk\b/i.test(text)) return say('Please remove links. Stories cannot include web addresses.', true);
      if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text) || /(\+?\d[\s-]?){9,}/.test(text)) return say('Please remove email addresses and phone numbers from the story.', true);
      if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return say('That email address does not look right. Fix it or leave it empty.', true);
      if (!r.querySelector('#cs-ok').checked) return say('Please tick the box to confirm the story is yours and may be published if approved.', true);
      var log = ls('gm.cs.times', []).filter(function (t) { return Date.now() - t < 3600000; }); if (log.length >= 3) return say('You have sent several stories recently. Please wait before sending another.', true);
      log.push(Date.now()); lsSet('gm.cs.times', log);
      var data = { section: 'People & Success Hub', type: r.querySelector('#cs-type').value, name: name, story: text, email: mail, sent: new Date().toISOString() };
      if (C.formEndpoint && /^https:\/\//.test(C.formEndpoint)) { say('Sending…'); fetch(C.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) }).then(function (res) { if (!res.ok) throw new Error('x'); say('Thank you. Your story was sent for review. It will appear only if it is approved.'); r.querySelector('#cs').reset(); }).catch(function () { say('Sorry, it could not be sent. Please try again later or use the contact page.', true); }); }
      else { var body = 'Section: ' + data.section + '\nType: ' + data.type + '\nShow name: ' + name + '\nReply email: ' + (mail || '-') + '\n\n' + text; location.href = 'mailto:' + (C.contactEmail || '') + '?subject=' + encodeURIComponent('Story for review: People & Success Hub') + '&body=' + encodeURIComponent(body); say('Your email app should open with the story ready. Press Send there to submit it for review.'); }
    });
  };

  /* ----- feedback form ----- */
  T['feedback-form'] = function (r, U) {
    var esc = U.esc, rating = 0, C = window.SITE_CONFIG || {};
    r.innerHTML = '<form class="form-stack" id="fb" novalidate><label>What would you like to tell us?<select id="fb-type"><option>Suggestion to improve the website</option><option>Report a technical issue</option><option>Compliment or review</option><option>Other</option></select></label><div><b id="fb-r-l" style="font-size:.94rem">How satisfied are you? (optional)</b><div class="rate" role="radiogroup" aria-labelledby="fb-r-l">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" role="radio" aria-checked="false" data-n="' + n + '" aria-label="' + n + ' out of 5 stars">★</button>'; }).join('') + '</div></div><label>Your message<textarea id="fb-msg" maxlength="2000" required placeholder="Tell us what happened or what you would like to see. For a technical issue, mention the page and what you clicked."></textarea></label><label>Page address (optional)<input id="fb-page" type="text" maxlength="200" placeholder="For example: /tools/pdf-to-word/"></label><label>Your email, only if you want a reply (optional)<input id="fb-mail" type="email" maxlength="120" autocomplete="email"></label><div class="hp" aria-hidden="true"><label>Leave this empty<input id="fb-hp" tabindex="-1" autocomplete="off"></label></div><div><button type="submit" class="btn btn-primary">Send feedback</button></div><p class="ks-msg" id="fb-out" role="status" aria-live="polite"></p><p class="small muted">We use your message only to improve the site. Please do not include passwords or private information. See our <a href="../privacy-policy/">privacy policy</a>. ' + (C.formEndpoint ? 'Your message is sent securely to our form service.' : 'Pressing Send opens your email app with your message ready to send.') + '</p></form>';
    var out = r.querySelector('#fb-out');
    function say(t, bad) { out.textContent = t; out.className = 'ks-msg' + (bad ? ' bad' : ''); }
    r.querySelector('.rate').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; rating = +b.dataset.n; U.$$('.rate button', r).forEach(function (x) { var on = +x.dataset.n <= rating; x.classList.toggle('on', on); x.setAttribute('aria-checked', +x.dataset.n === rating); }); });
    r.querySelector('#fb').addEventListener('submit', function (e) {
      e.preventDefault();
      if (r.querySelector('#fb-hp').value) return; // honeypot: bots fill hidden fields
      var msg = r.querySelector('#fb-msg').value.trim(), mail = r.querySelector('#fb-mail').value.trim();
      if (msg.length < 10) return say('Please write at least a short sentence (10 characters) so we can understand.', true);
      if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return say('That email address does not look right. Fix it or leave it empty.', true);
      var log = ls('gm.fb.times', []).filter(function (t) { return Date.now() - t < 3600000; });
      if (log.length >= 3) return say('You have sent several messages recently. Please wait a little before sending another.', true);
      var data = { type: r.querySelector('#fb-type').value, rating: rating || 'not given', page: r.querySelector('#fb-page').value.trim(), email: mail, message: msg, sent: new Date().toISOString() };
      log.push(Date.now()); lsSet('gm.fb.times', log);
      if (C.formEndpoint && /^https:\/\//.test(C.formEndpoint)) {
        say('Sending…'); fetch(C.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) }).then(function (res) { if (!res.ok) throw new Error('bad'); say('Thank you! Your feedback was sent.'); r.querySelector('#fb').reset(); }).catch(function () { say('Sorry, the message could not be sent. Please try again later or use the contact page.', true); });
      } else {
        var body = 'Type: ' + data.type + '\nRating: ' + data.rating + '\nPage: ' + (data.page || '-') + '\nReply email: ' + (data.email || '-') + '\n\n' + data.message;
        location.href = 'mailto:' + (C.contactEmail || '') + '?subject=' + encodeURIComponent('GM website feedback: ' + data.type) + '&body=' + encodeURIComponent(body);
        say('Your email app should open with the message ready. Press Send there to finish.');
      }
    });
  };
})();
