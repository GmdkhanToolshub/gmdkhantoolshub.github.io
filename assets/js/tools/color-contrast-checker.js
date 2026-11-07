/* Colour Contrast Checker: WCAG 2.2 contrast ratio with AA/AAA results and a suggested fix. */
NiaziTools['color-contrast-checker'] = function (root, U) {
  function parse(s) {
    s = String(s || '').trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-f]{6}$/i.test(s)) return null;
    return [0, 2, 4].map(function (i) { return parseInt(s.substr(i, 2), 16); });
  }
  function hex(rgb) { return '#' + rgb.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }
  function lum(rgb) {
    var a = rgb.map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function ratio(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  // Darken or lighten the text colour step by step until it reaches the target ratio against the background.
  function suggest(fg, bg, target) {
    var dark = lum(bg) > 0.18, c = fg.slice();
    for (var i = 0; i < 100; i++) {
      if (ratio(c, bg) >= target) return c;
      c = c.map(function (v) { return dark ? v * 0.95 : v + (255 - v) * 0.06; });
    }
    return dark ? [0, 0, 0] : [255, 255, 255];
  }
  root.innerHTML =
    '<div class="form-grid"><div class="field"><label for="cc-fg">Text colour</label><div class="cc-pick"><input type="color" id="cc-fg-p" value="#5b6b82" aria-label="Pick text colour"><input type="text" id="cc-fg" value="#5B6B82" maxlength="7" spellcheck="false"></div></div>' +
    '<div class="field"><label for="cc-bg">Background colour</label><div class="cc-pick"><input type="color" id="cc-bg-p" value="#ffffff" aria-label="Pick background colour"><input type="text" id="cc-bg" value="#FFFFFF" maxlength="7" spellcheck="false"></div></div></div>' +
    '<div class="tool-actions" style="margin-top:0"><button type="button" class="btn btn-ghost btn-sm" id="cc-swap">⇄ Swap colours</button></div>' +
    '<div class="cc-preview" id="cc-prev"><p class="cc-big">Large heading text</p><p>Normal body text looks like this. The quick brown fox jumps over the lazy dog.</p><p class="small">Small print and captions</p></div>' +
    '<p class="form-error" id="cc-err" role="alert"></p><div class="tool-result" id="cc-out" aria-live="polite"></div>';
  var fg = root.querySelector('#cc-fg'), bg = root.querySelector('#cc-bg'), fgp = root.querySelector('#cc-fg-p'), bgp = root.querySelector('#cc-bg-p');
  var out = root.querySelector('#cc-out'), err = root.querySelector('#cc-err'), prev = root.querySelector('#cc-prev');
  function badge(ok, label) { return '<span class="cc-badge ' + (ok ? 'ok' : 'no') + '">' + (ok ? '✓ Pass' : '✕ Fail') + '</span> ' + label; }
  function run() {
    var a = parse(fg.value), b = parse(bg.value); err.textContent = '';
    if (!a || !b) { err.textContent = 'Enter colours as hex codes, for example #1D5BD8 or #FFF.'; return; }
    fgp.value = hex(a); bgp.value = hex(b);
    prev.style.color = hex(a); prev.style.background = hex(b);
    var r = ratio(a, b), rr = Math.floor(r * 100) / 100;
    var rows = [['Normal text (AA)', '4.5 : 1', r >= 4.5], ['Large text (AA)', '3 : 1', r >= 3], ['Normal text (AAA)', '7 : 1', r >= 7], ['Large text (AAA)', '4.5 : 1', r >= 4.5], ['Icons and UI parts (AA)', '3 : 1', r >= 3]];
    var html = U.grid([U.box('Contrast ratio', U.fmt(rr, 2) + ' : 1', r >= 4.5 ? 'pos' : r >= 3 ? 'warn' : 'neg', true)]) +
      '<ul class="cc-list">' + rows.map(function (x) { return '<li>' + badge(x[2], x[0]) + ' <span class="muted small">needs ' + x[1] + '</span></li>'; }).join('') + '</ul>';
    if (r < 4.5) {
      var s = suggest(a, b, 4.5), sh = hex(s).toUpperCase();
      html += '<div class="callout"><p><strong>Suggestion:</strong> change the text colour to <code>' + sh + '</code> (' + U.fmt(Math.floor(ratio(s, b) * 100) / 100, 2) + ' : 1) to pass AA for normal text. <button type="button" class="btn btn-ghost btn-sm" id="cc-use" data-c="' + sh + '">Use this colour</button></p></div>';
    }
    html += '<p class="result-note">Large text means at least 24px regular or about 19px bold. Ratios follow the WCAG 2.2 formula.</p>';
    out.innerHTML = html;
    var use = out.querySelector('#cc-use'); if (use) use.onclick = function () { fg.value = use.getAttribute('data-c'); run(); };
  }
  fg.addEventListener('input', run); bg.addEventListener('input', run);
  fgp.addEventListener('input', function () { fg.value = fgp.value.toUpperCase(); run(); });
  bgp.addEventListener('input', function () { bg.value = bgp.value.toUpperCase(); run(); });
  root.querySelector('#cc-swap').addEventListener('click', function () { var t = fg.value; fg.value = bg.value; bg.value = t; run(); });
  run();
};
