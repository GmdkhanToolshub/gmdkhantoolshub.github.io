/* Image Converter: JPG, PNG and WebP in any direction (and GIF, BMP, AVIF in), in the browser. Nothing is uploaded. */
NiaziTools['image-converter'] = function (root, U) {
  var items = [], busy = false, urls = [];
  var TYPES = { jpg: ['image/jpeg', 'jpg'], png: ['image/png', 'png'], webp: ['image/webp', 'webp'] };
  root.innerHTML = GM.drop({ id: 'ic-files', accept: 'image/*', multiple: true, label: 'Drop images here or click to choose', hint: 'JPG, PNG, WebP, GIF, BMP or AVIF · up to 25 MB each · up to 50 images · converted on your device' }) +
    '<p class="form-error" id="ic-err" role="alert"></p><div id="ic-list" class="file-list"></div>' +
    '<div class="form-grid" style="margin-top:14px"><div class="field"><label for="ic-to">Convert to</label><select id="ic-to"><option value="jpg">JPG</option><option value="png">PNG</option><option value="webp">WebP</option></select></div>' +
    '<div class="field" id="ic-q-wrap"><label for="ic-q">Quality: <span id="ic-qv">90</span>%</label><input type="range" id="ic-q" min="40" max="100" value="90"></div>' +
    '<div class="field" id="ic-bg-wrap"><label for="ic-bg">Background for transparent areas</label><input type="color" id="ic-bg" value="#ffffff"><small class="hint">JPG has no transparency, so transparent areas are filled with this colour.</small></div></div>' +
    '<div class="tool-actions"><button type="button" class="btn btn-primary" id="ic-go" disabled>Convert images</button><button type="button" class="btn btn-ghost" id="ic-clear" disabled>Clear</button></div>' +
    GM.progressHTML('ic-prog') + '<div class="tool-result" id="ic-out" aria-live="polite" hidden></div>';
  var $ = function (s) { return root.querySelector(s); }, err = $('#ic-err'), out = $('#ic-out'), prog = GM.progress($('#ic-prog'));
  function render() {
    $('#ic-list').innerHTML = items.map(function (it, i) {
      return '<div class="file-row"><span class="file-n">' + (i + 1) + '</span><span class="file-name">' + U.esc(it.file.name) + '<small>' + GM.size(it.file.size) + (it.w ? ' · ' + it.w + ' × ' + it.h + ' px' : '') + '</small></span><span class="file-btns"><button type="button" class="btn btn-ghost btn-sm" data-del="' + i + '" aria-label="Remove ' + U.esc(it.file.name) + '">✕</button></span></div>';
    }).join('');
    $('#ic-go').disabled = !items.length; $('#ic-clear').disabled = !items.length;
  }
  function sync() { var to = $('#ic-to').value; $('#ic-q-wrap').hidden = to === 'png'; $('#ic-bg-wrap').hidden = to !== 'jpg'; }
  function decode(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { res({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error(file.name + ' could not be opened. It may be damaged or in a format this browser cannot read (for example HEIC).')); };
      img.src = url;
    });
  }
  GM.wire(root, 'ic-files', function (fl) {
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
  $('#ic-list').addEventListener('click', function (e) { var b = e.target.closest('[data-del]'); if (b) { items.splice(+b.getAttribute('data-del'), 1); out.hidden = true; render(); } });
  $('#ic-clear').addEventListener('click', function () { items = []; out.hidden = true; err.textContent = ''; render(); });
  $('#ic-to').addEventListener('change', sync); $('#ic-q').addEventListener('input', function () { $('#ic-qv').textContent = this.value; });
  $('#ic-go').addEventListener('click', function () {
    if (busy || !items.length) return; busy = true; this.disabled = true; var btn = this; err.textContent = ''; out.hidden = true;
    urls.forEach(URL.revokeObjectURL); urls = [];
    var to = $('#ic-to').value, type = TYPES[to][0], ext = TYPES[to][1], q = +$('#ic-q').value / 100, bg = $('#ic-bg').value, results = [], chain = Promise.resolve();
    items.forEach(function (it, i) {
      chain = chain.then(function () {
        prog.set(i / items.length, 'Converting ' + (i + 1) + ' of ' + items.length + '…');
        return decode(it.file).then(function (d) {
          var c = document.createElement('canvas'); c.width = d.img.naturalWidth; c.height = d.img.naturalHeight; var x = c.getContext('2d');
          if (to === 'jpg') { x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); }
          x.drawImage(d.img, 0, 0); URL.revokeObjectURL(d.url);
          return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error('Your browser could not create a ' + ext.toUpperCase() + ' file.')); }, type, q); });
        }).then(function (b) {
          if (b.type !== type) throw new Error('Your browser does not support saving as ' + ext.toUpperCase() + '. Choose JPG or PNG instead.');
          results.push({ name: GM.stem(it.file.name, 'image') + '.' + ext, blob: b, from: it.file.size }); return GM.nextFrame();
        });
      });
    });
    chain.then(function () {
      prog.hide(); GM.dedupe(results);
      var before = results.reduce(function (s, r) { return s + r.from; }, 0), after = results.reduce(function (s, r) { return s + r.blob.size; }, 0);
      out.hidden = false;
      out.innerHTML = U.grid([U.box('Images converted', U.fmt(results.length, 0) + ' to ' + ext.toUpperCase(), '', true), U.box('Before', GM.size(before)), U.box('After', GM.size(after), after <= before ? 'pos' : 'warn')]) +
        '<div class="tool-actions">' + (results.length > 1 ? '<button type="button" class="btn btn-primary" id="ic-zip">Download all (ZIP)</button>' : '') + '</div><div class="thumb-grid" id="ic-grid"></div>' +
        (to === 'png' && after > before ? '<p class="result-note">PNG keeps every pixel exactly, so files are usually larger than JPG or WebP.</p>' : '');
      var grid = $('#ic-grid');
      results.forEach(function (r, i) {
        var u = URL.createObjectURL(r.blob); urls.push(u);
        grid.insertAdjacentHTML('beforeend', '<figure class="thumb"><img src="' + u + '" alt="' + U.esc(r.name) + '" width="120" height="110" loading="lazy"><figcaption>' + U.esc(r.name) + '</figcaption><div class="thumb-btns"><button type="button" class="btn btn-ghost btn-sm" data-dl="' + i + '">' + GM.size(r.blob.size) + ' ↓</button></div></figure>');
      });
      grid.addEventListener('click', function (e) { var b = e.target.closest('[data-dl]'); if (b) { var r = results[+b.getAttribute('data-dl')]; U.download(r.name, r.blob); } });
      var z = $('#ic-zip'); if (z) z.onclick = function () { GM.zipBlobs(results).then(function (zb) { U.download('converted-images.zip', zb); }); };
      if (results.length === 1) U.download(results[0].name, results[0].blob);
    }).catch(function (e) { prog.hide(); err.textContent = e.message; })
      .then(function () { busy = false; btn.disabled = !items.length; });
  });
  sync();
};
