/* Image Resizer: exact pixel size, percentage or common social sizes, in the browser. Nothing is uploaded. */
NiaziTools['image-resizer'] = function (root, U) {
  var items = [], busy = false, urls = [];
  var PRESETS = [['', 'Choose a common size…'], ['1080x1080', 'Instagram square 1080 × 1080'], ['1080x1920', 'Instagram or WhatsApp story 1080 × 1920'], ['1280x720', 'YouTube thumbnail 1280 × 720'], ['851x315', 'Facebook cover 851 × 315'], ['1584x396', 'LinkedIn banner 1584 × 396'], ['500x500', 'Profile picture 500 × 500'], ['413x531', 'Passport photo 35 × 45 mm at 300 DPI (413 × 531)'], ['1240x1754', 'A4 page at 150 DPI (1240 × 1754)']];
  root.innerHTML = GM.drop({ id: 'ir-files', accept: 'image/*', multiple: true, label: 'Drop images here or click to choose', hint: 'JPG, PNG, WebP, GIF, BMP or AVIF · up to 25 MB each · up to 50 images · processed on your device' }) +
    '<p class="form-error" id="ir-err" role="alert"></p><div id="ir-list" class="file-list"></div>' +
    '<div class="tabs" role="tablist" id="ir-modes" style="margin-top:14px"><button type="button" class="tab" role="tab" aria-selected="true" data-m="px">By pixels</button><button type="button" class="tab" role="tab" aria-selected="false" data-m="pct">By percentage</button><button type="button" class="tab" role="tab" aria-selected="false" data-m="preset">Common sizes</button></div>' +
    '<div class="form-grid"><div class="field" data-for="px preset"><label for="ir-w">Width (px)</label><input type="text" inputmode="numeric" id="ir-w" placeholder="e.g. 1200"></div>' +
    '<div class="field" data-for="px preset"><label for="ir-h">Height (px)</label><input type="text" inputmode="numeric" id="ir-h" placeholder="e.g. 800"></div>' +
    '<div class="field" data-for="pct"><label for="ir-p">Scale: <span id="ir-pv">50</span>%</label><input type="range" id="ir-p" min="5" max="300" value="50"></div>' +
    '<div class="field" data-for="preset"><label for="ir-pre">Size</label><select id="ir-pre">' + PRESETS.map(function (p) { return '<option value="' + p[0] + '">' + p[1] + '</option>'; }).join('') + '</select></div>' +
    '<div class="field check" data-for="px"><input type="checkbox" id="ir-lock" checked><label for="ir-lock">Keep the original proportions</label></div>' +
    '<div class="field" data-for="px preset" id="ir-fit-wrap"><label for="ir-fit">When the shape differs</label><select id="ir-fit"><option value="cover">Crop to fill the size</option><option value="contain">Fit inside, add background</option><option value="stretch">Stretch (distorts the picture)</option></select></div>' +
    '<div class="field"><label for="ir-fmt">Save as</label><select id="ir-fmt"><option value="same">Same as the original</option><option value="jpg">JPG</option><option value="png">PNG</option><option value="webp">WebP</option></select></div>' +
    '<div class="field"><label for="ir-q">Quality: <span id="ir-qv">90</span>%</label><input type="range" id="ir-q" min="40" max="100" value="90"></div>' +
    '<div class="field"><label for="ir-bg">Background colour</label><input type="color" id="ir-bg" value="#ffffff"></div></div>' +
    '<p class="small muted" id="ir-note"></p>' +
    '<div class="tool-actions"><button type="button" class="btn btn-primary" id="ir-go" disabled>Resize images</button><button type="button" class="btn btn-ghost" id="ir-clear" disabled>Clear</button></div>' +
    GM.progressHTML('ir-prog') + '<div class="tool-result" id="ir-out" aria-live="polite" hidden></div>';
  var $ = function (s) { return root.querySelector(s); }, err = $('#ir-err'), out = $('#ir-out'), prog = GM.progress($('#ir-prog')), mode = 'px';
  function render() {
    $('#ir-list').innerHTML = items.map(function (it, i) { return '<div class="file-row"><span class="file-n">' + (i + 1) + '</span><span class="file-name">' + U.esc(it.file.name) + '<small>' + GM.size(it.file.size) + (it.w ? ' · ' + it.w + ' × ' + it.h + ' px' : '') + '</small></span><span class="file-btns"><button type="button" class="btn btn-ghost btn-sm" data-del="' + i + '" aria-label="Remove ' + U.esc(it.file.name) + '">✕</button></span></div>'; }).join('');
    $('#ir-go').disabled = !items.length; $('#ir-clear').disabled = !items.length; note();
  }
  function showMode() {
    root.querySelectorAll('.tab').forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('data-m') === mode); });
    root.querySelectorAll('[data-for]').forEach(function (f) { f.hidden = f.getAttribute('data-for').split(' ').indexOf(mode) < 0; });
    if (mode === 'px') $('#ir-fit-wrap').hidden = $('#ir-lock').checked;
    note();
  }
  function target(it) {
    var w, h;
    if (mode === 'pct') { var k = +$('#ir-p').value / 100; return { w: Math.max(1, Math.round(it.w * k)), h: Math.max(1, Math.round(it.h * k)), fit: 'stretch' }; }
    var tw = parseInt($('#ir-w').value, 10), th = parseInt($('#ir-h').value, 10), fit = $('#ir-fit').value;
    if (mode === 'px' && $('#ir-lock').checked) {
      if (tw > 0 && th > 0) { var s = Math.min(tw / it.w, th / it.h); return { w: Math.max(1, Math.round(it.w * s)), h: Math.max(1, Math.round(it.h * s)), fit: 'stretch' }; }
      if (tw > 0) return { w: tw, h: Math.max(1, Math.round(it.h * tw / it.w)), fit: 'stretch' };
      if (th > 0) return { w: Math.max(1, Math.round(it.w * th / it.h)), h: th, fit: 'stretch' };
      return null;
    }
    if (tw > 0 && th > 0) return { w: tw, h: th, fit: fit };
    if (tw > 0) return { w: tw, h: Math.round(it.h * tw / it.w), fit: 'stretch' };
    if (th > 0) return { w: Math.round(it.w * th / it.h), h: th, fit: 'stretch' };
    return null;
  }
  function note() {
    var it = items[0], n = $('#ir-note'); if (!it || !it.w) { n.textContent = ''; return; }
    var t = target(it); n.textContent = t ? 'First image: ' + it.w + ' × ' + it.h + ' px → ' + t.w + ' × ' + t.h + ' px' + (t.w > it.w || t.h > it.h ? '. Enlarging a picture makes it look softer.' : '.') : 'Enter a width, a height, or both.';
  }
  function decode(file) {
    return new Promise(function (res, rej) { var url = URL.createObjectURL(file), img = new Image(); img.onload = function () { res({ img: img, url: url }); }; img.onerror = function () { URL.revokeObjectURL(url); rej(new Error(file.name + ' could not be opened. It may be damaged or in a format this browser cannot read.')); }; img.src = url; });
  }
  function resample(img, w, h, fit, bg, jpg) {
    var sw = img.naturalWidth, sh = img.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    if (jpg || fit === 'contain') { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
    var dx = 0, dy = 0, dw = w, dh = h, sx = 0, sy = 0, sW = sw, sH = sh;
    if (fit === 'cover') { var k = Math.max(w / sw, h / sh); sW = w / k; sH = h / k; sx = (sw - sW) / 2; sy = (sh - sH) / 2; }
    else if (fit === 'contain') { var k2 = Math.min(w / sw, h / sh); dw = Math.round(sw * k2); dh = Math.round(sh * k2); dx = Math.round((w - dw) / 2); dy = Math.round((h - dh) / 2); }
    // shrink in steps of at most half for a cleaner result
    var cur = img, cw = sw, ch = sh;
    if (sW / dw > 2 || sH / dh > 2) {
      var tmp = document.createElement('canvas'), tx = tmp.getContext('2d'); tx.imageSmoothingQuality = 'high';
      var w1 = sW, h1 = sH; tmp.width = Math.ceil(w1); tmp.height = Math.ceil(h1); tx.drawImage(img, sx, sy, sW, sH, 0, 0, tmp.width, tmp.height); sx = 0; sy = 0; cur = tmp; cw = tmp.width; ch = tmp.height; sW = cw; sH = ch;
      while (cw / dw > 2 || ch / dh > 2) {
        var nw = Math.max(dw, Math.ceil(cw / 2)), nh = Math.max(dh, Math.ceil(ch / 2)), t2 = document.createElement('canvas'); t2.width = nw; t2.height = nh;
        var c2 = t2.getContext('2d'); c2.imageSmoothingQuality = 'high'; c2.drawImage(cur, 0, 0, cw, ch, 0, 0, nw, nh); cur = t2; cw = nw; ch = nh; sW = cw; sH = ch;
      }
    }
    x.drawImage(cur, sx, sy, sW, sH, dx, dy, dw, dh); return c;
  }
  GM.wire(root, 'ir-files', function (fl) {
    err.textContent = ''; var skip = [];
    fl.forEach(function (f) {
      if (!/^image\//.test(f.type) || /svg/.test(f.type)) { skip.push(f.name + ' (not a supported image)'); return; }
      if (f.size > 25 * 1048576) { skip.push(f.name + ' (over 25 MB)'); return; }
      if (items.length >= 50) { skip.push(f.name + ' (limit of 50 images)'); return; }
      var it = { file: f }; items.push(it);
      decode(f).then(function (d) { it.w = d.img.naturalWidth; it.h = d.img.naturalHeight; URL.revokeObjectURL(d.url); render(); }).catch(function (e) { items.splice(items.indexOf(it), 1); err.textContent = e.message; render(); });
    });
    if (skip.length) err.textContent = 'Skipped: ' + skip.join(', '); out.hidden = true; render();
  });
  $('#ir-list').addEventListener('click', function (e) { var b = e.target.closest('[data-del]'); if (b) { items.splice(+b.getAttribute('data-del'), 1); out.hidden = true; render(); } });
  $('#ir-clear').addEventListener('click', function () { items = []; out.hidden = true; err.textContent = ''; render(); });
  $('#ir-modes').addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (b) { mode = b.getAttribute('data-m'); showMode(); } });
  $('#ir-pre').addEventListener('change', function () { var v = this.value.split('x'); if (v.length === 2) { $('#ir-w').value = v[0]; $('#ir-h').value = v[1]; } note(); });
  ['ir-w', 'ir-h', 'ir-fit'].forEach(function (id) { $('#' + id).addEventListener('input', note); }); $('#ir-lock').addEventListener('change', showMode);
  $('#ir-p').addEventListener('input', function () { $('#ir-pv').textContent = this.value; note(); }); $('#ir-q').addEventListener('input', function () { $('#ir-qv').textContent = this.value; });
  $('#ir-go').addEventListener('click', function () {
    if (busy || !items.length) return; err.textContent = '';
    if (!target(items[0])) { err.textContent = 'Enter a width, a height, or both.'; return; }
    busy = true; this.disabled = true; var btn = this; out.hidden = true; urls.forEach(URL.revokeObjectURL); urls = [];
    var fmt = $('#ir-fmt').value, q = +$('#ir-q').value / 100, bg = $('#ir-bg').value, results = [], chain = Promise.resolve();
    items.forEach(function (it, i) {
      chain = chain.then(function () {
        prog.set(i / items.length, 'Resizing ' + (i + 1) + ' of ' + items.length + '…');
        var t = target(it), type = fmt === 'jpg' ? 'image/jpeg' : fmt === 'png' ? 'image/png' : fmt === 'webp' ? 'image/webp' : (/^image\/(jpeg|png|webp)$/.test(it.file.type) ? it.file.type : 'image/png');
        if (t.w * t.h > 80e6) throw new Error('The requested size for ' + it.file.name + ' is too large (over 80 megapixels).');
        return decode(it.file).then(function (d) {
          var c = resample(d.img, t.w, t.h, t.fit, bg, type === 'image/jpeg'); URL.revokeObjectURL(d.url);
          return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error('Could not create the resized image.')); }, type, q); }).then(function (b) {
            var ext = type === 'image/jpeg' ? 'jpg' : type === 'image/png' ? 'png' : 'webp';
            results.push({ name: GM.stem(it.file.name, 'image') + '-' + t.w + 'x' + t.h + '.' + ext, blob: b, w: t.w, h: t.h, from: it.file.size }); return GM.nextFrame();
          });
        });
      });
    });
    chain.then(function () {
      prog.hide(); GM.dedupe(results); out.hidden = false; var after = results.reduce(function (s, r) { return s + r.blob.size; }, 0), before = results.reduce(function (s, r) { return s + r.from; }, 0);
      out.innerHTML = U.grid([U.box('Images resized', U.fmt(results.length, 0), '', true), U.box('New size', results[0].w + ' × ' + results[0].h + ' px'), U.box('File size', GM.size(before) + ' → ' + GM.size(after))]) +
        '<div class="tool-actions">' + (results.length > 1 ? '<button type="button" class="btn btn-primary" id="ir-zip">Download all (ZIP)</button>' : '') + '</div><div class="thumb-grid" id="ir-grid"></div>';
      var grid = $('#ir-grid');
      results.forEach(function (r, i) { var u = URL.createObjectURL(r.blob); urls.push(u); grid.insertAdjacentHTML('beforeend', '<figure class="thumb"><img src="' + u + '" alt="' + U.esc(r.name) + '" width="120" height="110" loading="lazy"><figcaption>' + U.esc(r.name) + '</figcaption><div class="thumb-btns"><button type="button" class="btn btn-ghost btn-sm" data-dl="' + i + '">' + r.w + '×' + r.h + ' ↓</button></div></figure>'); });
      grid.addEventListener('click', function (e) { var b = e.target.closest('[data-dl]'); if (b) { var r = results[+b.getAttribute('data-dl')]; U.download(r.name, r.blob); } });
      var z = $('#ir-zip'); if (z) z.onclick = function () { GM.zipBlobs(results).then(function (zb) { U.download('resized-images.zip', zb); }); };
      if (results.length === 1) U.download(results[0].name, results[0].blob);
    }).catch(function (e) { prog.hide(); err.textContent = e.message; })
      .then(function () { busy = false; btn.disabled = !items.length; });
  });
  showMode();
};
