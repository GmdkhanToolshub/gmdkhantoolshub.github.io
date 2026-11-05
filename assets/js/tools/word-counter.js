NiaziTools['word-counter'] = function (root, U) {
  var STOP = 'the a an and or but of to in on at for with by from as is are was were be been it this that these those i you he she we they my your our their its not no so if then than too very can will just'.split(' ');
  root.innerHTML = '<div class="field"><label for="wc-text">Type or paste your text</label><textarea id="wc-text" rows="10" placeholder="Start typing or paste your text here…"></textarea></div>' +
    '<div class="tool-actions"><button type="button" class="btn btn-ghost btn-sm" id="wc-copy">Copy text</button><button type="button" class="btn btn-ghost btn-sm" id="wc-dl">Download .txt</button><button type="button" class="btn btn-ghost btn-sm" id="wc-clear">Clear</button></div>' +
    '<div class="tool-result" id="tool-result" aria-live="polite"></div>';
  var ta = root.querySelector('#wc-text'), out = root.querySelector('#tool-result');
  function run() {
    var t = ta.value;
    if (!t.trim()) { out.innerHTML = '<div class="result-empty">Your word, character, sentence and reading-time counts appear here as you type.</div>'; return; }
    var words = (t.trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu) || []);
    var chars = t.length, noSpace = t.replace(/\s/g, '').length;
    var sentences = (t.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || []).filter(function (s) { return /[\p{L}\p{N}]/u.test(s); }).length;
    var paras = t.split(/\n\s*\n/).filter(function (p) { return p.trim(); }).length;
    var lines = t.split(/\n/).length;
    var mins = words.length / 238, speak = words.length / 130;
    function dur(m) { if (m < 1) return Math.max(1, Math.round(m * 60)) + ' sec'; var mm = Math.floor(m), ss = Math.round((m - mm) * 60); return mm + ' min' + (ss ? ' ' + ss + ' sec' : ''); }
    var freq = {};
    words.forEach(function (w) { var k = w.toLowerCase().replace(/^['’\-]+|['’\-]+$/g, ''); if (k.length > 2 && STOP.indexOf(k) < 0) freq[k] = (freq[k] || 0) + 1; });
    var top = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a] || a.localeCompare(b); }).slice(0, 8);
    var avg = words.length ? U.fmt(words.reduce(function (s, w) { return s + w.length; }, 0) / words.length, 1) : '0';
    out.innerHTML = U.grid([U.box('Words', U.fmt(words.length, 0), '', true), U.box('Characters', U.fmt(chars, 0)), U.box('Characters (no spaces)', U.fmt(noSpace, 0)), U.box('Sentences', U.fmt(sentences, 0)), U.box('Paragraphs', U.fmt(paras, 0)), U.box('Lines', U.fmt(lines, 0)), U.box('Reading time', dur(mins)), U.box('Speaking time', dur(speak)), U.box('Avg. word length', avg)]) +
      (top.length ? '<h3 style="margin-top:20px;font-size:1rem">Most used words</h3>' + U.table(['Word', 'Count', 'Density'], top.map(function (k) { return [U.esc(k), freq[k], U.pct(freq[k] / words.length * 100, 1)]; })) : '') +
      '<p class="result-note">Reading time uses 238 words/min (silent reading); speaking time uses 130 words/min.</p>';
  }
  ta.addEventListener('input', U.debounce(run, 60)); run();
  root.querySelector('#wc-copy').addEventListener('click', function () { if (ta.value) U.copy(ta.value); else U.toast('Nothing to copy'); });
  root.querySelector('#wc-dl').addEventListener('click', function () { if (ta.value) U.download('text.txt', ta.value); else U.toast('Nothing to download'); });
  root.querySelector('#wc-clear').addEventListener('click', function () { ta.value = ''; run(); ta.focus(); });
};
