/* Text Case Converter & Cleaner: change case and tidy text in the browser. */
NiaziTools['text-case-converter'] = function (root, U) {
  var SMALL = /^(a|an|and|as|at|but|by|for|in|nor|of|on|or|per|the|to|vs?\.?|via|with)$/i;
  function words(s) { return s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[^A-Za-z0-9À-￿]+/).filter(Boolean); }
  var CASE = {
    upper: ['UPPER CASE', function (s) { return s.toUpperCase(); }],
    lower: ['lower case', function (s) { return s.toLowerCase(); }],
    title: ['Title Case', function (s) {
      return s.toLowerCase().replace(/[^\s-]+/g, function (w, i) { return i > 0 && SMALL.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1); })
        .replace(/(^|[.!?:]\s+)([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
    }],
    sentence: ['Sentence case', function (s) { return s.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-zà-ÿ])/g, function (m, a, b) { return a + b.toUpperCase(); }).replace(/\bi\b/g, 'I'); }],
    toggle: ['tOGGLE cASE', function (s) { return s.replace(/./g, function (ch) { var u = ch.toUpperCase(); return ch === u ? ch.toLowerCase() : u; }); }],
    camel: ['camelCase', function (s) { return s.split('\n').map(function (l) { return words(l).map(function (w, i) { w = w.toLowerCase(); return i ? w.charAt(0).toUpperCase() + w.slice(1) : w; }).join(''); }).join('\n'); }],
    pascal: ['PascalCase', function (s) { return s.split('\n').map(function (l) { return words(l).map(function (w) { w = w.toLowerCase(); return w.charAt(0).toUpperCase() + w.slice(1); }).join(''); }).join('\n'); }],
    snake: ['snake_case', function (s) { return s.split('\n').map(function (l) { return words(l).join('_').toLowerCase(); }).join('\n'); }],
    kebab: ['kebab-case', function (s) { return s.split('\n').map(function (l) { return words(l).join('-').toLowerCase(); }).join('\n'); }],
    constant: ['CONSTANT_CASE', function (s) { return s.split('\n').map(function (l) { return words(l).join('_').toUpperCase(); }).join('\n'); }]
  };
  var CLEAN = {
    spaces: ['Remove extra spaces', function (s) { return s.split('\n').map(function (l) { return l.replace(/[ \t]+/g, ' ').trim(); }).join('\n'); }],
    breaks: ['Join lines into one', function (s) { return s.replace(/\s*\n+\s*/g, ' ').trim(); }],
    empty: ['Remove empty lines', function (s) { return s.split('\n').filter(function (l) { return l.trim(); }).join('\n'); }],
    dupes: ['Remove duplicate lines', function (s) { var seen = {}; return s.split('\n').filter(function (l) { var k = l.trim(); if (seen[k]) return false; seen[k] = 1; return true; }).join('\n'); }],
    sort: ['Sort lines A–Z', function (s) { return s.split('\n').sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }); }).join('\n'); }],
    sortd: ['Sort lines Z–A', function (s) { return s.split('\n').sort(function (a, b) { return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }); }).join('\n'); }],
    reverse: ['Reverse line order', function (s) { return s.split('\n').reverse().join('\n'); }],
    quotes: ['Straighten quotes', function (s) { return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"'); }],
    numbers: ['Number the lines', function (s) { var n = 0; return s.split('\n').map(function (l) { return l.trim() ? (++n) + '. ' + l : l; }).join('\n'); }]
  };
  function btns(map, kind) { return Object.keys(map).map(function (k) { return '<button type="button" class="btn btn-ghost btn-sm" data-' + kind + '="' + k + '">' + U.esc(map[k][0]) + '</button>'; }).join(''); }
  root.innerHTML = '<div class="field"><label for="tc-in">Your text</label><textarea id="tc-in" rows="9" placeholder="Paste or type text here, then choose a case or clean-up option."></textarea></div>' +
    '<p class="small muted" style="margin:0 0 6px"><strong>Change case</strong></p><div class="btn-row tc-btns">' + btns(CASE, 'case') + '</div>' +
    '<p class="small muted" style="margin:14px 0 6px"><strong>Clean up</strong></p><div class="btn-row tc-btns">' + btns(CLEAN, 'clean') + '</div>' +
    '<div class="tool-actions"><button type="button" class="btn btn-primary" id="tc-copy">Copy text</button><button type="button" class="btn btn-ghost" id="tc-dl">Download .txt</button><button type="button" class="btn btn-ghost" id="tc-undo" disabled>Undo</button><button type="button" class="btn btn-ghost" id="tc-clear">Clear</button></div>' +
    '<p class="small muted" id="tc-stats" aria-live="polite"></p>';
  var ta = root.querySelector('#tc-in'), hist = [], undo = root.querySelector('#tc-undo');
  function stats() { var t = ta.value; root.querySelector('#tc-stats').textContent = (t.trim() ? (t.trim().match(/\S+/g) || []).length : 0) + ' words · ' + t.length + ' characters · ' + (t ? t.split('\n').length : 0) + ' lines'; }
  function apply(fn, label) {
    if (!ta.value) return U.toast('Add some text first');
    hist.push(ta.value); if (hist.length > 30) hist.shift(); undo.disabled = false;
    ta.value = fn(ta.value.replace(/\r\n/g, '\n')); stats(); U.toast(label + ' applied');
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-case],[data-clean]'); if (!b) return;
    var k = b.getAttribute('data-case'), m = k ? CASE : CLEAN; k = k || b.getAttribute('data-clean');
    apply(m[k][1], m[k][0]);
  });
  undo.addEventListener('click', function () { if (hist.length) { ta.value = hist.pop(); stats(); } undo.disabled = !hist.length; });
  root.querySelector('#tc-copy').addEventListener('click', function () { ta.value ? U.copy(ta.value) : U.toast('Nothing to copy yet'); });
  root.querySelector('#tc-dl').addEventListener('click', function () { ta.value ? U.download('text.txt', ta.value) : U.toast('Nothing to download yet'); });
  root.querySelector('#tc-clear').addEventListener('click', function () { if (ta.value) { hist.push(ta.value); undo.disabled = false; } ta.value = ''; stats(); ta.focus(); });
  ta.addEventListener('input', stats); stats();
};
