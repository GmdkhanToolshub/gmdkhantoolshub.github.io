/* Colour Picker & Converter: HEX, RGB, HSL, HSV and CMYK in both directions, an eyedropper, picking from an image,
   palette ideas and saved colours. Everything stays in your browser. */
NiaziTools['color-picker'] = function (root, U) {
  var KEY = 'gm.colors.v1', saved = U.store.get(KEY, []), cur = [29, 91, 216];
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function hex2rgb(h) { h = String(h).trim().replace(/^#/, ''); if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map(function (c) { return c + c; }).join(''); return /^[0-9a-f]{6}$/i.test(h) ? [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }) : null; }
  function rgb2hex(c) { return '#' + c.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('').toUpperCase(); }
  function rgb2hsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2, d = mx - mn;
    if (d) { s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s * 100, l * 100];
  }
  function hsl2rgb(h, s, l) { h = ((h % 360) + 360) % 360; s /= 100; l /= 100; var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l), f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); }; return [f(0) * 255, f(8) * 255, f(4) * 255].map(Math.round); }
  function rgb2hsv(c) { var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = rgb2hsl(c)[0]; return [h, mx ? d / mx * 100 : 0, mx * 100]; }
  function hsv2rgb(h, s, v) { s /= 100; v /= 100; var f = function (n) { var k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return [f(5) * 255, f(3) * 255, f(1) * 255].map(Math.round); }
  function rgb2cmyk(c) { var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, k = 1 - Math.max(r, g, b); if (k === 1) return [0, 0, 0, 100]; return [(1 - r - k) / (1 - k) * 100, (1 - g - k) / (1 - k) * 100, (1 - b - k) / (1 - k) * 100, k * 100]; }
  function cmyk2rgb(c, m, y, k) { c /= 100; m /= 100; y /= 100; k /= 100; return [255 * (1 - c) * (1 - k), 255 * (1 - m) * (1 - k), 255 * (1 - y) * (1 - k)].map(Math.round); }
  function lum(c) { var a = c.map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  var r0 = function (n) { return Math.round(n); };
  var FORMATS = [
    ['hex', 'HEX', function (c) { return rgb2hex(c); }, function (s) { return hex2rgb(s); }, 'e.g. #1D5BD8'],
    ['rgb', 'RGB', function (c) { return 'rgb(' + c.join(', ') + ')'; }, function (s) { var m = /(\d+)\D+(\d+)\D+(\d+)/.exec(s); return m && [+m[1], +m[2], +m[3]].every(function (v) { return v <= 255; }) ? [+m[1], +m[2], +m[3]] : null; }, 'e.g. rgb(29, 91, 216)'],
    ['hsl', 'HSL', function (c) { var h = rgb2hsl(c); return 'hsl(' + r0(h[0]) + ', ' + r0(h[1]) + '%, ' + r0(h[2]) + '%)'; }, function (s) { var m = /(-?[\d.]+)\D+([\d.]+)\D+([\d.]+)/.exec(s); return m && +m[2] <= 100 && +m[3] <= 100 ? hsl2rgb(+m[1], +m[2], +m[3]) : null; }, 'e.g. hsl(220, 77%, 47%)'],
    ['hsv', 'HSV', function (c) { var h = rgb2hsv(c); return 'hsv(' + r0(h[0]) + ', ' + r0(h[1]) + '%, ' + r0(h[2]) + '%)'; }, function (s) { var m = /(-?[\d.]+)\D+([\d.]+)\D+([\d.]+)/.exec(s); return m && +m[2] <= 100 && +m[3] <= 100 ? hsv2rgb(+m[1], +m[2], +m[3]) : null; }, 'e.g. hsv(220, 87%, 85%)'],
    ['cmyk', 'CMYK (approximate)', function (c) { var k = rgb2cmyk(c); return 'cmyk(' + k.map(function (v) { return r0(v) + '%'; }).join(', ') + ')'; }, function (s) { var m = /([\d.]+)\D+([\d.]+)\D+([\d.]+)\D+([\d.]+)/.exec(s); return m && [+m[1], +m[2], +m[3], +m[4]].every(function (v) { return v <= 100; }) ? cmyk2rgb(+m[1], +m[2], +m[3], +m[4]) : null; }, 'e.g. cmyk(87%, 58%, 0%, 15%)']
  ];
  root.innerHTML = '<div class="cp-top"><div class="cp-swatch" id="cp-sw"><input type="color" id="cp-native" aria-label="Pick a colour" value="#1d5bd8"></div><div class="cp-fields" id="cp-fields">' +
    FORMATS.map(function (f) { return '<div class="field cp-row"><label for="cp-' + f[0] + '">' + f[1] + '</label><div class="cp-in"><input type="text" id="cp-' + f[0] + '" spellcheck="false" placeholder="' + f[4] + '"><button type="button" class="btn btn-ghost btn-sm" data-copy="' + f[0] + '">Copy</button></div></div>'; }).join('') + '</div></div>' +
    '<p class="form-error" id="cp-err" role="alert"></p><div class="tool-actions"><button type="button" class="btn btn-ghost btn-sm" id="cp-eye" hidden>Pick from screen</button><label class="btn btn-ghost btn-sm" for="cp-img" style="cursor:pointer">Pick from an image</label><input type="file" id="cp-img" accept="image/*" class="sr-only"><button type="button" class="btn btn-ghost btn-sm" id="cp-save">Save this colour</button></div>' +
    '<div id="cp-imgwrap" hidden><p class="small muted" style="margin:10px 0 4px">Click the image to pick a colour.</p><canvas id="cp-canvas" class="cp-canvas" aria-label="Image to pick a colour from"></canvas></div>' +
    '<p class="small muted" id="cp-contrast"></p><h3 style="font-size:1rem;margin:18px 0 8px">Colour ideas</h3><div id="cp-pal"></div><h3 style="font-size:1rem;margin:18px 0 8px">Saved colours</h3><div id="cp-saved"></div>';
  var $ = function (s) { return root.querySelector(s); }, err = $('#cp-err');
  function swatch(c, label) { var h = rgb2hex(c); return '<button type="button" class="cp-chip" style="background:' + h + ';color:' + (lum(c) > 0.4 ? '#111' : '#fff') + '" data-c="' + h + '" title="Use ' + h + '" aria-label="Use colour ' + h + '"><span>' + (label || h) + '</span></button>'; }
  function palette() {
    var hs = rgb2hsl(cur), g = function (d) { return hsl2rgb(hs[0] + d, hs[1], hs[2]); }, sec = function (name, arr) { return '<div class="cp-pal"><span class="small muted">' + name + '</span><div class="cp-chips">' + arr.map(function (c) { return swatch(c); }).join('') + '</div></div>'; };
    $('#cp-pal').innerHTML = sec('Complementary', [cur, g(180)]) + sec('Analogous', [g(-30), cur, g(30)]) + sec('Triadic', [cur, g(120), g(240)]) + sec('Square', [cur, g(90), g(180), g(270)]) +
      sec('Shades and tints', [88, 70, 55, 40, 25].map(function (l) { return hsl2rgb(hs[0], hs[1], l); }));
  }
  function drawSaved() { $('#cp-saved').innerHTML = saved.length ? '<div class="cp-chips">' + saved.map(function (h) { return swatch(hex2rgb(h)); }).join('') + '</div><button type="button" class="btn btn-ghost btn-sm" id="cp-clr" style="margin-top:8px">Clear saved colours</button>' : '<div class="result-empty">Press “Save this colour” to keep colours here.</div>'; }
  function apply(rgb, from) {
    cur = rgb.map(function (v) { return clamp(Math.round(v), 0, 255); }); err.textContent = '';
    FORMATS.forEach(function (f) { if (f[0] !== from) $('#cp-' + f[0]).value = f[2](cur); });
    $('#cp-sw').style.background = rgb2hex(cur); $('#cp-native').value = rgb2hex(cur).toLowerCase();
    var w = ratio(cur, [255, 255, 255]), b = ratio(cur, [0, 0, 0]);
    $('#cp-contrast').textContent = 'Text contrast: ' + U.fmt(w, 2) + ' : 1 with white, ' + U.fmt(b, 2) + ' : 1 with black. ' + (Math.max(w, b) >= 4.5 ? (w >= b ? 'White text is readable on this colour.' : 'Black text is readable on this colour.') : 'Neither white nor black text reaches the 4.5 : 1 AA level on this colour.');
    palette();
  }
  FORMATS.forEach(function (f) { $('#cp-' + f[0]).addEventListener('input', function () { var v = f[3](this.value); if (v) apply(v, f[0]); else if (this.value.trim()) err.textContent = 'That ' + f[1].split(' ')[0] + ' value is not valid yet. ' + f[4] + '.'; }); });
  $('#cp-native').addEventListener('input', function () { apply(hex2rgb(this.value)); });
  root.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]'), ch = e.target.closest('[data-c]');
    if (c) U.copy($('#cp-' + c.getAttribute('data-copy')).value, 'Copied');
    if (ch) apply(hex2rgb(ch.getAttribute('data-c')));
    if (e.target.id === 'cp-clr') { saved = []; U.store.set(KEY, saved); drawSaved(); }
  });
  $('#cp-save').addEventListener('click', function () { var h = rgb2hex(cur); if (saved.indexOf(h) < 0) { saved.unshift(h); saved = saved.slice(0, 16); U.store.set(KEY, saved); drawSaved(); } U.toast('Saved ' + h); });
  if ('EyeDropper' in window) { $('#cp-eye').hidden = false; $('#cp-eye').addEventListener('click', function () { new window.EyeDropper().open().then(function (r) { apply(hex2rgb(r.sRGBHex)); }).catch(function () {}); }); }
  $('#cp-img').addEventListener('change', function () {
    var f = this.files[0]; this.value = ''; if (!f || !/^image\//.test(f.type)) return; var url = URL.createObjectURL(f), im = new Image();
    im.onload = function () { var cv = $('#cp-canvas'), k = Math.min(1, 640 / im.naturalWidth); cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k); cv.getContext('2d', { willReadFrequently: true }).drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); $('#cp-imgwrap').hidden = false; };
    im.onerror = function () { URL.revokeObjectURL(url); err.textContent = 'That image could not be opened.'; }; im.src = url;
  });
  $('#cp-canvas').addEventListener('click', function (e) { var r = this.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) * this.width / r.width), y = Math.floor((e.clientY - r.top) * this.height / r.height), d = this.getContext('2d').getImageData(x, y, 1, 1).data; apply([d[0], d[1], d[2]]); });
  apply(cur); drawSaved();
  NiaziTools['color-picker'].api = { hex2rgb: hex2rgb, rgb2hsl: rgb2hsl, rgb2hsv: rgb2hsv, rgb2cmyk: rgb2cmyk, hsl2rgb: hsl2rgb };
};
