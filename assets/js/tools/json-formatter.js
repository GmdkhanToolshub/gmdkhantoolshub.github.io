/* JSON Formatter & Validator: format, minify, sort keys and find errors with line and column. */
NiaziTools['json-formatter'] = function (root, U) {
  var SAMPLE = '{"name":"GM Free Tools","tools":["PDF Merge","Zakat Calculator"],"free":true,"version":1.2,"owner":{"country":"PK"}}';
  root.innerHTML =
    '<div class="field"><label for="jf-in">JSON input</label><textarea id="jf-in" rows="10" class="mono" spellcheck="false" placeholder="Paste JSON here"></textarea></div>' +
    '<div class="form-grid"><div class="field"><label for="jf-ind">Indentation</label><select id="jf-ind"><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="tab">Tabs</option></select></div>' +
    '<div class="field check" style="align-self:end"><input type="checkbox" id="jf-sort"><label for="jf-sort">Sort keys A–Z</label></div></div>' +
    '<div class="tool-actions" style="margin-top:0"><button type="button" class="btn btn-primary" id="jf-fmt">Format</button><button type="button" class="btn btn-ghost" id="jf-min">Minify</button><button type="button" class="btn btn-ghost" id="jf-val">Validate</button><button type="button" class="btn btn-ghost" id="jf-sample">Load sample</button></div>' +
    '<div class="tool-result" id="jf-out" aria-live="polite"></div>';
  var $ = function (s) { return root.querySelector(s); }, out = $('#jf-out');
  function sortKeys(v) {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v && typeof v === 'object') { var o = {}; Object.keys(v).sort().forEach(function (k) { o[k] = sortKeys(v[k]); }); return o; }
    return v;
  }
  function locate(text, msg) {
    var m = String(msg).match(/position (\d+)/i), pos = m ? +m[1] : -1, lc = String(msg).match(/line (\d+) column (\d+)/i);
    if (lc) return { line: +lc[1], col: +lc[2] };
    if (pos < 0) return null;
    var before = text.slice(0, pos).split('\n'); return { line: before.length, col: before[before.length - 1].length + 1, pos: pos };
  }
  function parse() {
    var t = $('#jf-in').value;
    if (!t.trim()) { out.innerHTML = '<div class="result-empty">Paste some JSON first.</div>'; return null; }
    try { var v = JSON.parse(t); return $('#jf-sort').checked ? sortKeys(v) : v; }
    catch (e) {
      var where = locate(t, e.message), lines = t.split('\n'), snip = '';
      if (where) { var ln = lines[where.line - 1] || ''; snip = '<pre class="jf-snip">' + U.esc(ln.slice(Math.max(0, where.col - 40), where.col + 40)) + '\n' + ' '.repeat(Math.min(where.col - 1, 40)) + '^</pre>'; }
      out.innerHTML = U.grid([U.box('Invalid JSON', where ? 'Line ' + where.line + ', column ' + where.col : 'Syntax error', 'neg', true)]) +
        '<p class="result-note">' + U.esc(e.message) + '</p>' + snip + '<p class="small muted">Common causes: a trailing comma, single quotes instead of double quotes, or a missing bracket.</p>';
      return null;
    }
  }
  function show(text, note) {
    out.innerHTML = '<label for="jf-res">' + note + '</label><textarea id="jf-res" class="output-text mono" rows="12" readonly spellcheck="false">' + U.esc(text) + '</textarea>' +
      '<div class="tool-actions"><button type="button" class="btn btn-primary btn-sm" id="jf-copy">Copy</button><button type="button" class="btn btn-ghost btn-sm" id="jf-dl">Download .json</button><button type="button" class="btn btn-ghost btn-sm" id="jf-use">Replace input</button></div>' +
      '<p class="small muted">' + U.fmt(text.length, 0) + ' characters</p>';
    $('#jf-copy').onclick = function () { U.copy(text); };
    $('#jf-dl').onclick = function () { U.download('data.json', text, 'application/json'); };
    $('#jf-use').onclick = function () { $('#jf-in').value = text; U.toast('Input replaced'); };
  }
  function indent() { var v = $('#jf-ind').value; return v === 'tab' ? '\t' : +v; }
  $('#jf-fmt').addEventListener('click', function () { var v = parse(); if (v !== null) show(JSON.stringify(v, null, indent()), 'Formatted JSON'); });
  $('#jf-min').addEventListener('click', function () { var v = parse(); if (v !== null) show(JSON.stringify(v), 'Minified JSON'); });
  $('#jf-val').addEventListener('click', function () {
    var v = parse(); if (v === null) return;
    var type = Array.isArray(v) ? 'Array with ' + v.length + ' items' : v && typeof v === 'object' ? 'Object with ' + Object.keys(v).length + ' keys' : typeof v;
    var depth = (function d(x) { return x && typeof x === 'object' ? 1 + Math.max(0, ...Object.values(x).map(d)) : 0; })(v);
    out.innerHTML = U.grid([U.box('Valid JSON', '✓ No errors', 'pos', true), U.box('Top level', U.esc(type)), U.box('Nesting depth', String(depth))]);
  });
  $('#jf-sample').addEventListener('click', function () { $('#jf-in').value = SAMPLE; $('#jf-fmt').click(); });
};
