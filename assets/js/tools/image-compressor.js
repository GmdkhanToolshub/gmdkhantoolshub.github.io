NiaziTools['image-compressor'] = function (root, U) {
  var items = [], MAX = 25 * 1024 * 1024;
  root.innerHTML = '<div class="dropzone" id="ic-drop" tabindex="0" role="button" aria-label="Choose images to compress"><b>Drop images here or click to choose</b><span>JPEG, PNG or WebP · up to 25 MB each · processed in your browser, never uploaded</span><input type="file" id="ic-file" accept="image/jpeg,image/png,image/webp" multiple hidden></div>' +
    '<div class="form-grid" style="margin-top:20px"><div class="field"><label for="ic-q">Quality: <span id="ic-qv">75</span>%</label><input type="range" id="ic-q" min="10" max="100" value="75"></div>' +
    '<div class="field"><label for="ic-fmt">Output format</label><select id="ic-fmt"><option value="image/jpeg">JPEG (smallest for photos)</option><option value="image/webp">WebP (modern, very small)</option></select></div>' +
    '<div class="field"><label for="ic-w">Max width (px, optional)</label><input id="ic-w" inputmode="numeric" placeholder="e.g. 1600"><small class="hint">Leave blank to keep the original size.</small></div></div>' +
    '<div class="form-error" id="tool-error" role="alert"></div><div class="tool-actions"><button type="button" class="btn btn-primary" id="ic-zip" disabled>Download all (ZIP)</button><button type="button" class="btn btn-ghost" id="ic-clear">Clear</button></div><div class="tool-result" id="tool-result" aria-live="polite"></div>';
  var err = root.querySelector('#tool-error'), out = root.querySelector('#tool-result'), drop = root.querySelector('#ic-drop'), file = root.querySelector('#ic-file');
  function fmtSize(b) { return b < 1024 ? b + ' B' : b < 1048576 ? U.fmt(b / 1024, 1) + ' KB' : U.fmt(b / 1048576, 2) + ' MB'; }
  function ext(m) { return m === 'image/webp' ? 'webp' : 'jpg'; }
  function compress(it) {
    var q = parseInt(root.querySelector('#ic-q').value, 10) / 100, mime = root.querySelector('#ic-fmt').value, mw = U.num(root.querySelector('#ic-w').value);
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(it.file);
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        if (U.isNum(mw) && mw > 0 && w > mw) { h = Math.round(h * mw / w); w = Math.round(mw); }
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h; var g = cv.getContext('2d');
        if (mime === 'image/jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
        g.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
        cv.toBlob(function (b) { if (!b) return rej(new Error('Your browser could not encode this format.')); it.blob = b; it.w = w; it.h = h; it.mime = mime; res(); }, mime, q);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('Could not read this image.')); };
      img.src = url;
    });
  }
  function outName(it) { return it.file.name.replace(/\.[^.]+$/, '') + '-compressed.' + ext(it.mime || root.querySelector('#ic-fmt').value); }
  function draw() {
    root.querySelector('#ic-zip').disabled = !items.some(function (i) { return i.blob; });
    if (!items.length) { out.innerHTML = '<div class="result-empty">Compressed images will be listed here with before/after sizes.</div>'; return; }
    var tb = 0, ta = 0;
    items.forEach(function (i) { if (i.blob) { tb += i.file.size; ta += i.blob.size; } });
    out.innerHTML = (ta ? U.grid([U.box('Total saved', U.pct(Math.max(0, (1 - ta / tb) * 100), 0), 'pos', true), U.box('Before', fmtSize(tb)), U.box('After', fmtSize(ta))]) + '<div style="height:14px"></div>' : '') +
      items.map(function (i, k) {
        if (i.error) return '<div class="out-card"><p>' + U.esc(i.file.name) + '<small class="neg">' + U.esc(i.error) + '</small></p></div>';
        if (!i.blob) return '<div class="out-card"><p>' + U.esc(i.file.name) + '<small>Compressing…</small></p></div>';
        var saved = (1 - i.blob.size / i.file.size) * 100;
        return '<div class="out-card"><p>' + U.esc(i.file.name) + '<small>' + fmtSize(i.file.size) + ' → ' + fmtSize(i.blob.size) + ' · ' + i.w + '×' + i.h + ' px · <span class="' + (saved > 0 ? 'pos' : 'warn') + '">' + (saved > 0 ? U.fmt(saved, 0) + '% smaller' : 'no saving — the original is already well optimised') + '</span></small></p><button type="button" class="btn btn-ghost btn-sm" data-dl="' + k + '">Download</button></div>';
      }).join('');
  }
  function runAll() { err.textContent = ''; var ps = items.filter(function (i) { return !i.error; }).map(function (i) { i.blob = null; return compress(i).catch(function (e) { i.error = e.message; }); }); draw(); Promise.all(ps).then(draw); }
  function add(list) {
    err.textContent = ''; var rejected = [];
    Array.prototype.forEach.call(list, function (f) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { rejected.push(f.name + ' (unsupported type)'); return; }
      if (f.size > MAX) { rejected.push(f.name + ' (over 25 MB)'); return; }
      if (items.length >= 30) { rejected.push(f.name + ' (limit of 30 images)'); return; }
      items.push({ file: f });
    });
    runAll();
    if (rejected.length) err.textContent = 'Skipped: ' + rejected.join(', ');
  }
  drop.addEventListener('click', function () { file.click(); });
  drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
  file.addEventListener('change', function () { add(file.files); file.value = ''; });
  ['dragenter', 'dragover'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.add('drag'); }); });
  ['dragleave', 'drop'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.remove('drag'); }); });
  drop.addEventListener('drop', function (e) { add(e.dataTransfer.files); });
  var rerun = U.debounce(function () { if (items.length) runAll(); }, 250);
  root.querySelector('#ic-q').addEventListener('input', function (e) { root.querySelector('#ic-qv').textContent = e.target.value; rerun(); });
  root.querySelector('#ic-fmt').addEventListener('change', rerun); root.querySelector('#ic-w').addEventListener('input', rerun);
  out.addEventListener('click', function (e) { var b = e.target.closest('[data-dl]'); if (b) { var it = items[+b.getAttribute('data-dl')]; if (it && it.blob) U.download(outName(it), it.blob); } });
  root.querySelector('#ic-clear').addEventListener('click', function () { items = []; err.textContent = ''; draw(); });
  root.querySelector('#ic-zip').addEventListener('click', function () {
    var done = items.filter(function (i) { return i.blob; }); if (!done.length) return;
    Promise.all(done.map(function (i) { return i.blob.arrayBuffer().then(function (b) { return { name: outName(i), data: new Uint8Array(b) }; }); })).then(function (files) {
      var seen = {}; files.forEach(function (f) { if (seen[f.name]) { var n = ++seen[f.name]; f.name = f.name.replace(/(\.\w+)$/, '-' + n + '$1'); } else seen[f.name] = 1; });
      U.download('compressed-images.zip', U.zip(files));
    });
  });
  draw();
};
