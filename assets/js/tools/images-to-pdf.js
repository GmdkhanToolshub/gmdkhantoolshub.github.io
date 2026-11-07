/* Images to PDF: JPG, PNG and WebP into one PDF, in the browser with pdf-lib (MIT). Nothing is uploaded. */
NiaziTools['images-to-pdf'] = function (root, U) {
  if (!window.PDFLib) { root.innerHTML = '<p class="inline-error">The PDF engine could not load. Please refresh the page.</p>'; return; }
  var L = window.PDFLib, MAX = 25 * 1024 * 1024, items = [];
  var SIZES = { a4: [595.28, 841.89], letter: [612, 792] };
  root.innerHTML =
    '<label class="dropzone" id="ip-zone" for="ip-files"><b>Drop images here or click to choose</b><span>JPG, PNG or WebP · up to 25 MB each · processed on your device</span>' +
    '<input type="file" id="ip-files" accept="image/jpeg,image/png,image/webp" multiple class="sr-only"></label>' +
    '<p class="form-error" id="ip-err" role="alert"></p><div id="ip-list" class="thumb-grid"></div>' +
    '<div class="form-grid" style="margin-top:14px"><div class="field"><label for="ip-size">Page size</label><select id="ip-size"><option value="a4">A4</option><option value="letter">US Letter</option><option value="fit">Same as each image</option></select></div>' +
    '<div class="field"><label for="ip-orient">Orientation</label><select id="ip-orient"><option value="auto">Automatic (match each image)</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></div>' +
    '<div class="field"><label for="ip-margin">Margin</label><select id="ip-margin"><option value="0">None</option><option value="18" selected>Small</option><option value="36">Medium</option><option value="54">Large</option></select></div>' +
    '<div class="field"><label for="ip-name">File name</label><input type="text" id="ip-name" value="images" maxlength="60"></div></div>' +
    '<div class="tool-actions"><button type="button" class="btn btn-primary" id="ip-go" disabled>Create PDF</button><button type="button" class="btn btn-ghost" id="ip-clear" disabled>Clear</button></div>' +
    '<div class="tool-result" id="ip-out" aria-live="polite"></div>';
  var list = root.querySelector('#ip-list'), err = root.querySelector('#ip-err'), out = root.querySelector('#ip-out'), zone = root.querySelector('#ip-zone'), input = root.querySelector('#ip-files');
  function render() {
    list.innerHTML = items.map(function (it, i) {
      return '<figure class="thumb"><img src="' + it.url + '" alt="' + U.esc(it.file.name) + '" width="120" height="120" loading="lazy"><figcaption><span class="file-n">' + (i + 1) + '</span>' + U.esc(it.file.name) + '</figcaption>' +
        '<div class="thumb-btns"><button type="button" class="btn btn-ghost btn-sm" data-up="' + i + '" aria-label="Move image ' + (i + 1) + ' earlier"' + (i ? '' : ' disabled') + '>←</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-down="' + i + '" aria-label="Move image ' + (i + 1) + ' later"' + (i < items.length - 1 ? '' : ' disabled') + '>→</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-del="' + i + '" aria-label="Remove image ' + (i + 1) + '">✕</button></div></figure>';
    }).join('');
    root.querySelector('#ip-go').disabled = !items.length;
    root.querySelector('#ip-clear').disabled = !items.length;
  }
  function add(files) {
    err.textContent = ''; var skipped = [];
    files.forEach(function (f) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { skipped.push(f.name + ' (unsupported type)'); return; }
      if (f.size > MAX) { skipped.push(f.name + ' (over 25 MB)'); return; }
      if (items.length >= 100) { skipped.push(f.name + ' (limit of 100 images)'); return; }
      items.push({ file: f, url: URL.createObjectURL(f) });
    });
    if (skipped.length) err.textContent = 'Skipped: ' + skipped.join(', ');
    out.innerHTML = ''; render();
  }
  ['dragenter', 'dragover'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('drag'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('drag'); }); });
  zone.addEventListener('drop', function (e) { add([].slice.call(e.dataTransfer.files)); });
  input.addEventListener('change', function () { add([].slice.call(input.files)); input.value = ''; });
  list.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; var t;
    var up = b.getAttribute('data-up'), dn = b.getAttribute('data-down'), del = b.getAttribute('data-del');
    if (up != null) { up = +up; t = items[up - 1]; items[up - 1] = items[up]; items[up] = t; }
    if (dn != null) { dn = +dn; t = items[dn + 1]; items[dn + 1] = items[dn]; items[dn] = t; }
    if (del != null) { URL.revokeObjectURL(items[+del].url); items.splice(+del, 1); }
    out.innerHTML = ''; render();
  });
  root.querySelector('#ip-clear').addEventListener('click', function () { items.forEach(function (i) { URL.revokeObjectURL(i.url); }); items = []; out.innerHTML = ''; render(); });

  // WebP (and anything else) is redrawn as a high-quality JPEG, because PDF can only embed JPEG or PNG directly.
  function toJpeg(it) {
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0);
        c.toBlob(function (b) { b ? b.arrayBuffer().then(res, rej) : rej(new Error('Could not convert ' + it.file.name)); }, 'image/jpeg', 0.92);
      };
      img.onerror = function () { rej(new Error(it.file.name + ' could not be read as an image.')); };
      img.src = it.url;
    });
  }
  root.querySelector('#ip-go').addEventListener('click', function () {
    var btn = this; btn.disabled = true; btn.textContent = 'Creating…'; err.textContent = '';
    var sz = root.querySelector('#ip-size').value, orient = root.querySelector('#ip-orient').value, margin = +root.querySelector('#ip-margin').value;
    var name = U.slug(root.querySelector('#ip-name').value || 'images');
    L.PDFDocument.create().then(function (doc) {
      return items.reduce(function (p, it) {
        return p.then(function () {
          var get = it.file.type === 'image/webp' ? toJpeg(it).then(function (b) { return doc.embedJpg(b); })
            : it.file.arrayBuffer().then(function (b) { return it.file.type === 'image/png' ? doc.embedPng(b) : doc.embedJpg(b); });
          return get.then(function (img) {
            var iw = img.width, ih = img.height, pw, ph;
            if (sz === 'fit') { pw = iw * 0.75 + margin * 2; ph = ih * 0.75 + margin * 2; }
            else {
              pw = SIZES[sz][0]; ph = SIZES[sz][1];
              var land = orient === 'landscape' || (orient === 'auto' && iw > ih);
              if (land) { var t = pw; pw = ph; ph = t; }
            }
            var page = doc.addPage([pw, ph]), aw = pw - margin * 2, ah = ph - margin * 2, s = Math.min(aw / iw, ah / ih);
            page.drawImage(img, { x: (pw - iw * s) / 2, y: (ph - ih * s) / 2, width: iw * s, height: ih * s });
          });
        });
      }, Promise.resolve()).then(function () { doc.setTitle(name); doc.setCreator('GM Free Tools'); return doc.save(); });
    }).then(function (bytes) {
      var blob = new Blob([bytes], { type: 'application/pdf' });
      out.innerHTML = U.grid([U.box('PDF created', U.fmt(items.length, 0) + ' page' + (items.length > 1 ? 's' : ''), '', true), U.box('File size', blob.size > 1048576 ? U.fmt(blob.size / 1048576, 1) + ' MB' : U.fmt(blob.size / 1024, 0) + ' KB')]) +
        '<div class="tool-actions"><button type="button" class="btn btn-primary" id="ip-dl">Download PDF</button></div>';
      out.querySelector('#ip-dl').onclick = function () { U.download(name + '.pdf', blob); };
      U.download(name + '.pdf', blob);
    }).catch(function (e) { err.textContent = 'Could not create the PDF: ' + e.message; })
      .then(function () { btn.disabled = !items.length; btn.textContent = 'Create PDF'; });
  });
};
