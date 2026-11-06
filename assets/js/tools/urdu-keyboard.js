NiaziTools['urdu-keyboard'] = function (root, U) {
  /* Phonetic Urdu layout: each English key types the Urdu letter that sounds most like it. */
  var MAP = {
    a: 'ا', b: 'ب', c: 'چ', d: 'د', e: 'ع', f: 'ف', g: 'گ', h: 'ح', i: 'ی', j: 'ج', k: 'ک', l: 'ل', m: 'م', n: 'ن', o: 'ہ', p: 'پ', q: 'ق', r: 'ر', s: 'س', t: 'ت', u: 'ء', v: 'ط', w: 'و', x: 'ش', y: 'ے', z: 'ز',
    A: 'آ', B: 'ً', C: 'ث', D: 'ڈ', E: 'ٰ', F: 'ّ', G: 'غ', H: 'ھ', I: 'ِ', J: 'ض', K: 'خ', L: 'ٖ', M: 'ٌ', N: 'ں', O: 'ۃ', P: 'ُ', Q: 'ٗ', R: 'ڑ', S: 'ص', T: 'ٹ', U: 'ئ', V: 'ظ', W: 'ؤ', X: 'ژ', Y: 'َ', Z: 'ذ',
    ',': '،', '.': '۔', '?': '؟', ';': '؛', '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴', '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  var ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  root.innerHTML = '<div class="field"><label for="uk-text">Type in Urdu</label>' +
    '<textarea id="uk-text" rows="7" dir="rtl" lang="ur" placeholder="یہاں اردو لکھیں…" style="font-size:1.4rem;line-height:2.1;font-family:\'Noto Nastaliq Urdu\',\'Jameel Noori Nastaleeq\',\'Urdu Typesetting\',serif"></textarea>' +
    '<small class="hint">Type on your keyboard: each key gives the Urdu letter that sounds like it (a = ا, b = ب, s = س). Hold Shift for more letters (T = ٹ, D = ڈ, R = ڑ, N = ں, A = آ). Or tap the keys below.</small></div>' +
    '<div class="tool-actions" style="margin-top:0"><label class="chip" style="display:inline-flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" id="uk-on" checked> Urdu typing on</label>' +
    '<label class="chip" style="display:inline-flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" id="uk-shift"> Show Shift letters</label>' +
    '<label class="chip" style="display:inline-flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" id="uk-digits" checked> Urdu digits (۱۲۳)</label></div>' +
    '<div id="uk-keys" dir="ltr" style="margin:12px 0;display:grid;gap:6px"></div>' +
    '<div class="tool-actions"><button type="button" class="btn btn-primary btn-sm" id="uk-copy">Copy text</button><button type="button" class="btn btn-ghost btn-sm" id="uk-dl">Download .txt</button><button type="button" class="btn btn-ghost btn-sm" id="uk-back">⌫ Backspace</button><button type="button" class="btn btn-ghost btn-sm" id="uk-clear">Clear</button></div>' +
    '<div class="tool-result" id="uk-stats" aria-live="polite"></div>';
  var ta = root.querySelector('#uk-text'), on = root.querySelector('#uk-on'), shift = root.querySelector('#uk-shift'), digits = root.querySelector('#uk-digits'), keys = root.querySelector('#uk-keys'), stats = root.querySelector('#uk-stats');
  function insert(s) {
    var a = ta.selectionStart, b = ta.selectionEnd;
    ta.value = ta.value.slice(0, a) + s + ta.value.slice(b);
    ta.selectionStart = ta.selectionEnd = a + s.length; ta.focus(); count();
  }
  function count() {
    var t = ta.value, words = (t.trim().match(/\S+/g) || []).length;
    stats.innerHTML = U.grid([U.box('Words', U.fmt(words, 0), '', true), U.box('Characters', U.fmt(t.length, 0)), U.box('Characters (no spaces)', U.fmt(t.replace(/\s/g, '').length, 0))]);
  }
  function draw() {
    var up = shift.checked;
    keys.innerHTML = ROWS.map(function (row) {
      return '<div style="display:flex;gap:4px;justify-content:center">' + row.split('').map(function (k) {
        var key = up ? k.toUpperCase() : k, ch = MAP[key] || '';
        return '<button type="button" class="btn btn-ghost" data-ch="' + U.esc(ch) + '" style="min-width:30px;flex:1 1 30px;max-width:52px;padding:6px 2px;display:grid;line-height:1.1" aria-label="' + U.esc(ch + ' (' + key + ')') + '"><span style="font-size:1.35rem">' + U.esc(ch) + '</span><small class="muted" style="font-size:.7rem">' + key + '</small></button>';
      }).join('') + '</div>';
    }).join('') + '<div style="display:flex;gap:4px;justify-content:center"><button type="button" class="btn btn-ghost" data-ch="،">،</button><button type="button" class="btn btn-ghost" data-ch=" " style="flex:1 1 auto;max-width:240px">Space</button><button type="button" class="btn btn-ghost" data-ch="۔">۔</button><button type="button" class="btn btn-ghost" data-ch="؟">؟</button></div>';
  }
  keys.addEventListener('click', function (e) { var b = e.target.closest('[data-ch]'); if (b) insert(b.getAttribute('data-ch')); });
  ta.addEventListener('keydown', function (e) {
    if (!on.checked || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    if (/[0-9]/.test(e.key) && !digits.checked) return;
    var ch = MAP[e.key]; if (!ch) return;
    e.preventDefault(); insert(ch);
  });
  ta.addEventListener('input', count);
  shift.addEventListener('change', draw);
  root.querySelector('#uk-copy').addEventListener('click', function () { if (ta.value) U.copy(ta.value, 'Urdu text copied'); else U.toast('Nothing to copy yet'); });
  root.querySelector('#uk-dl').addEventListener('click', function () { if (ta.value) U.download('urdu-text.txt', ta.value, 'text/plain;charset=utf-8'); else U.toast('Nothing to download yet'); });
  root.querySelector('#uk-back').addEventListener('click', function () { var a = ta.selectionStart, b = ta.selectionEnd; if (a === b && a > 0) a--; ta.value = ta.value.slice(0, a) + ta.value.slice(b); ta.selectionStart = ta.selectionEnd = a; ta.focus(); count(); });
  root.querySelector('#uk-clear').addEventListener('click', function () { ta.value = ''; ta.focus(); count(); });
  draw(); count();
  NiaziTools['urdu-keyboard'].MAP = MAP;
};
