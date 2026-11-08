/* Typing Speed Test: original practice passages, live words per minute and accuracy. Best scores stay in this browser. */
NiaziTools['typing-speed-test'] = function (root, U) {
  var PASSAGES = {
    easy: ['The sun came up over the hills and the market began to wake. Shopkeepers lifted their shutters, children walked to school, and the smell of fresh bread drifted down the lane.',
      'A good habit is easier to keep when it is small. Read a page each day, walk for ten minutes, and drink a glass of water. Little steps add up to big changes over time.',
      'We planted a mango tree in the garden last spring. It is still small, but this morning I saw the first green leaves. Everyone in the family waters it, and we hope for fruit one day.'],
    medium: ['Good teams share their work early, even when it is not perfect. A rough draft invites useful questions, while a polished report that arrives too late can only be admired or ignored. Ask for feedback while there is still time to act on it.',
      'Planning a monthly budget does not need special software. List what comes in, write down what must be paid, and set a small amount aside before spending on anything else. At the end of the month, compare the plan with what really happened and adjust.',
      'When a calculator gives a surprising answer, check the inputs before blaming the formula. A misplaced decimal point, a number in the wrong unit, or a forgotten tax can change the result far more than any clever rounding rule.'],
    hard: ['Efficient operations depend on accurate, timely information: sales figures reconciled against distributor stock, forecasts revised when promotions change demand, and exceptions flagged before they become shortfalls. Dashboards help only when everyone trusts the numbers beneath them.',
      'The committee acknowledged that, although initial estimates were optimistic, the revised schedule (which accounts for procurement delays, seasonal weather, and staffing gaps) remains achievable provided that three conditions are met by the end of the quarter.',
      'Whether you are drafting a proposal, replying to a customer, or summarising a meeting, clarity beats cleverness: state the decision first, give the two or three facts that support it, and finish with the exact next step, the owner, and the date.']
  };
  var KEY = 'gm.typing.v1', best = U.store.get(KEY, { wpm: 0, acc: 0, runs: 0 }), run = null, text = '', timer = 0;
  root.innerHTML = '<div class="form-grid"><div class="field"><label for="ty-lvl">Difficulty</label><select id="ty-lvl"><option value="easy">Easy (everyday words)</option><option value="medium" selected>Medium (sentences with punctuation)</option><option value="hard">Hard (longer words and punctuation)</option></select></div>' +
    '<div class="field"><label for="ty-dur">Test length</label><select id="ty-dur"><option value="30">30 seconds</option><option value="60" selected>1 minute</option><option value="120">2 minutes</option><option value="0">Until I finish the passage</option></select></div></div>' +
    '<div class="ty-stats" aria-live="off"><div><b id="ty-wpm">0</b><span>WPM</span></div><div><b id="ty-acc">100%</b><span>Accuracy</span></div><div><b id="ty-time">–</b><span>Time</span></div><div><b id="ty-best">' + (best.wpm || '–') + '</b><span>Best WPM</span></div></div>' +
    '<div class="ty-text" id="ty-text" aria-label="Passage to type"></div><label for="ty-in" class="sr-only">Type the passage here</label><textarea id="ty-in" class="ty-in" rows="3" placeholder="Click here and start typing. The timer starts with your first key." autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>' +
    '<div class="tool-actions"><button type="button" class="btn btn-primary" id="ty-new">New passage</button><button type="button" class="btn btn-ghost" id="ty-restart">Restart</button></div><div class="tool-result" id="ty-out" aria-live="polite" hidden></div>' +
    '<p class="small muted">WPM counts every 5 correct characters as one word. Accuracy is the share of key presses that were correct, including ones you later fixed with Backspace.</p>';
  var $ = function (s) { return root.querySelector(s); }, inp = $('#ty-in');
  function pick() { var list = PASSAGES[$('#ty-lvl').value], t; do { t = list[Math.floor(Math.random() * list.length)]; } while (t === text && list.length > 1); return t; }
  function paint() {
    var v = inp.value, html = '';
    for (var i = 0; i < text.length; i++) { var ch = text[i] === ' ' ? ' ' : U.esc(text[i]), cls = i < v.length ? (v[i] === text[i] ? 'ok' : 'bad') : (i === v.length ? 'cur' : ''); html += '<span class="' + cls + '">' + ch + '</span>'; }
    $('#ty-text').innerHTML = html;
  }
  function stats() {
    if (!run) return { wpm: 0, acc: 100, correct: 0, elapsed: 0 };
    var v = inp.value, correct = 0; for (var i = 0; i < v.length; i++) if (v[i] === text[i]) correct++;
    var el = Math.max(1, (performance.now() - run.start)) / 1000, wpm = Math.round(correct / 5 / (el / 60)), acc = run.typed ? Math.max(0, Math.round((1 - run.errors / run.typed) * 100)) : 100;
    return { wpm: wpm, acc: acc, correct: correct, elapsed: el };
  }
  function live() {
    var s = stats(), d = +$('#ty-dur').value; $('#ty-wpm').textContent = s.wpm; $('#ty-acc').textContent = s.acc + '%';
    $('#ty-time').textContent = run ? (d ? Math.max(0, Math.ceil(d - s.elapsed)) + 's' : Math.floor(s.elapsed) + 's') : (d ? d + 's' : '–');
    if (run && d && s.elapsed >= d) finish();
  }
  function reset(newText) {
    clearInterval(timer); run = null; if (newText || !text) text = pick(); inp.value = ''; inp.disabled = false; $('#ty-out').hidden = true; paint(); live();
  }
  function finish() {
    if (!run) return; clearInterval(timer); var s = stats(), v = inp.value; inp.disabled = true; var done = run; run = null;
    var capped = s.wpm; best.runs++; var isBest = capped > best.wpm; if (isBest) { best.wpm = capped; best.acc = s.acc; } U.store.set(KEY, best); $('#ty-best').textContent = best.wpm || '–';
    var lvl = s.wpm < 20 ? 'Just starting out' : s.wpm < 40 ? 'Building speed' : s.wpm < 60 ? 'Comfortable typist' : s.wpm < 80 ? 'Fast typist' : 'Very fast typist';
    $('#ty-wpm').textContent = s.wpm; $('#ty-acc').textContent = s.acc + '%';
    var out = $('#ty-out'); out.hidden = false;
    out.innerHTML = U.grid([U.box('Your speed', s.wpm + ' WPM', s.acc >= 95 ? 'pos' : '', true), U.box('Accuracy', s.acc + '%', s.acc >= 95 ? 'pos' : s.acc >= 85 ? '' : 'warn'), U.box('Correct characters', U.fmt(s.correct, 0)), U.box('Mistakes made', U.fmt(done.errors, 0)), U.box('Time', U.fmt(s.elapsed, 1) + ' s')]) +
      '<p class="result-note"><strong>' + lvl + '.</strong> ' + (isBest ? 'That is your new best on this device. ' : '') + 'Accuracy matters as much as speed: slow down a little if you made many mistakes.</p>' +
      '<div class="tool-actions"><button type="button" class="btn btn-primary" id="ty-again">Try another passage</button></div>';
    out.querySelector('#ty-again').onclick = function () { reset(true); inp.focus(); };
  }
  inp.addEventListener('input', function (e) {
    if (!text) return; if (!run) run = { start: performance.now(), typed: 0, errors: 0, prev: 0 };
    var v = inp.value; if (v.length > run.prev) { for (var i = run.prev; i < v.length; i++) { run.typed++; if (v[i] !== text[i]) run.errors++; } } run.prev = v.length;
    if (!timer) timer = setInterval(live, 200);
    if (v.length >= text.length) { if (v.length > text.length) inp.value = v.slice(0, text.length); paint(); finish(); return; }
    paint(); live();
  });
  inp.addEventListener('paste', function (e) { e.preventDefault(); U.toast('Pasting is turned off in the typing test'); });
  inp.addEventListener('keydown', function (e) { if (e.key === 'Tab') { e.preventDefault(); reset(true); } });
  $('#ty-new').addEventListener('click', function () { reset(true); inp.focus(); }); $('#ty-restart').addEventListener('click', function () { reset(false); inp.focus(); });
  $('#ty-lvl').addEventListener('change', function () { reset(true); }); $('#ty-dur').addEventListener('change', function () { reset(false); });
  reset(true);
  NiaziTools['typing-speed-test'].api = { passages: PASSAGES };
};
