/* PDF Rotator: preview every page (pdf.js), rotate single pages or groups, save with pdf-lib. Nothing is uploaded. */
NiaziTools['pdf-rotator'] = function (root, U) {
  var file = null, pdf = null, rot = [], sel = [], busy = false, token = 0;
  root.innerHTML = GM.drop({ id: 'pr-file', accept: 'application/pdf,.pdf', label: 'Drop a PDF here or click to choose', hint: 'PDF files only · up to 100 MB · edited on your device' }) +
    '<p class="form-error" id="pr-err" role="alert"></p>' +
    '<div id="pr-pw" class="form-grid" hidden><div class="field"><label for="pr-pass">PDF password</label><input type="password" id="pr-pass" autocomplete="off"></div><div class="field" style="align-self:end"><button type="button" class="btn btn-ghost" id="pr-unlock">Unlock PDF</button></div></div>' +
    '<div id="pr-opts" hidden><div class="file-row"><span class="file-n">PDF</span><span class="file-name" id="pr-info"></span></div>' +
    '<div class="pr-bar"><span class="small muted">Rotate:</span><button type="button" class="btn btn-ghost btn-sm" data-all="-90">All ⟲ 90°</button><button type="button" class="btn btn-ghost btn-sm" data-all="90">All ⟳ 90°</button><button type="button" class="btn btn-ghost btn-sm" data-all="180">All 180°</button>' +
    '<span class="small muted">Selected:</span><button type="button" class="btn btn-ghost btn-sm" data-selrot="-90">⟲ 90°</button><button type="button" class="btn btn-ghost btn-sm" data-selrot="90">⟳ 90°</button>' +
    '<span class="small muted">Select:</span><button type="button" class="btn btn-ghost btn-sm" data-pick="all">All</button><button type="button" class="btn btn-ghost btn-sm" data-pick="odd">Odd</button><button type="button" class="btn btn-ghost btn-sm" data-pick="even">Even</button><button type="button" class="btn btn-ghost btn-sm" data-pick="none">None</button><button type="button" class="btn btn-ghost btn-sm" data-reset>Reset</button></div>' +
    '<div class="pr-grid" id="pr-grid"></div><div class="tool-actions"><button type="button" class="btn btn-primary" id="pr-go">Save rotated PDF</button></div></div>' +
    GM.progressHTML('pr-prog') + '<div class="tool-result" id="pr-out" aria-live="polite" hidden></div>';
  var $ = function (s) { return root.querySelector(s); }, err = $('#pr-err'), out = $('#pr-out'), prog = GM.progress($('#pr-prog'));
  function norm(a) { return ((a % 360) + 360) % 360; }
  function paintCard(i) { var c = $('#pr-c' + i); if (!c) return; c.querySelector('.pr-img').style.transform = 'rotate(' + rot[i] + 'deg)'; c.querySelector('.pr-deg').textContent = rot[i] ? norm(rot[i]) + '°' : ''; c.classList.toggle('sel', !!sel[i]); c.querySelector('input').checked = !!sel[i]; }
  function repaint() { for (var i = 0; i < rot.length; i++) paintCard(i); }
  function open(f, pw) {
    err.textContent = ''; out.hidden = true; token++; var my = token;
    return GM.openPdf(f, pw).then(function (d) {
      if (d.numPages > 500) throw new Error('This PDF has ' + d.numPages + ' pages. Please use a file with up to 500 pages.');
      pdf = d; file = f; rot = new Array(d.numPages).fill(0); sel = new Array(d.numPages).fill(false); $('#pr-pw').hidden = true; $('#pr-opts').hidden = false;
      $('#pr-info').innerHTML = U.esc(f.name) + '<small>' + GM.size(f.size) + ' · ' + d.numPages + ' page' + (d.numPages > 1 ? 's' : '') + '</small>';
      $('#pr-grid').innerHTML = Array.from({ length: d.numPages }, function (_, i) {
        return '<div class="pr-card" id="pr-c' + i + '"><label class="pr-sel"><input type="checkbox" data-sel="' + i + '" aria-label="Select page ' + (i + 1) + '"><span>' + (i + 1) + '</span></label><div class="pr-frame"><canvas class="pr-img" width="1" height="1" aria-label="Preview of page ' + (i + 1) + '"></canvas></div><div class="pr-ctl"><button type="button" class="btn btn-ghost btn-sm" data-r="-90,' + i + '" aria-label="Rotate page ' + (i + 1) + ' left">⟲</button><span class="pr-deg small"></span><button type="button" class="btn btn-ghost btn-sm" data-r="90,' + i + '" aria-label="Rotate page ' + (i + 1) + ' right">⟳</button></div></div>';
      }).join('');
      var chain = Promise.resolve();
      for (let p = 1; p <= Math.min(d.numPages, 200); p++) chain = chain.then(function () {
        if (my !== token) return; return pdf.getPage(p).then(function (page) {
          var vp1 = page.getViewport({ scale: 1 }), sc = 150 / Math.max(vp1.width, vp1.height), vp = page.getViewport({ scale: sc }), c = $('#pr-c' + (p - 1) + ' canvas');
          if (!c) return; c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height); var cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height);
          return page.render({ canvasContext: cx, viewport: vp }).promise.then(function () { var fr = c.parentNode; fr.classList.add('ready'); return GM.nextFrame(); });
        });
      });
      return chain;
    }).catch(function (e) { pdf = null; $('#pr-opts').hidden = true; if (e.needPassword) { $('#pr-pw').hidden = false; $('#pr-pass').focus(); file = f; } err.textContent = e.message; });
  }
  GM.wire(root, 'pr-file', function (fl) { var f = fl[0]; if (!f) return; var m = GM.checkFile(f, ['pdf'], 100); if (m) { err.textContent = m; return; } $('#pr-pw').hidden = true; open(f); });
  $('#pr-unlock').addEventListener('click', function () { if (file) open(file, $('#pr-pass').value); });
  $('#pr-opts').addEventListener('click', function (e) {
    var b = e.target.closest('button'), cb = e.target.closest('[data-sel]');
    if (cb) { sel[+cb.getAttribute('data-sel')] = cb.checked; paintCard(+cb.getAttribute('data-sel')); return; }
    if (!b) return;
    if (b.hasAttribute('data-r')) { var a = b.getAttribute('data-r').split(','); rot[+a[1]] += +a[0]; paintCard(+a[1]); }
    else if (b.hasAttribute('data-all')) { rot = rot.map(function (r) { return r + +b.getAttribute('data-all'); }); repaint(); }
    else if (b.hasAttribute('data-selrot')) { if (!sel.some(Boolean)) { err.textContent = 'Select some pages first (tick the box on each page).'; return; } err.textContent = ''; rot = rot.map(function (r, i) { return sel[i] ? r + +b.getAttribute('data-selrot') : r; }); repaint(); }
    else if (b.hasAttribute('data-pick')) { var k = b.getAttribute('data-pick'); sel = sel.map(function (_, i) { return k === 'all' || (k === 'odd' && i % 2 === 0) || (k === 'even' && i % 2 === 1); }); repaint(); }
    else if (b.hasAttribute('data-reset')) { rot = rot.map(function () { return 0; }); sel = sel.map(function () { return false; }); repaint(); }
  });
  $('#pr-go').addEventListener('click', function () {
    if (!file || busy) return; err.textContent = ''; out.hidden = true;
    if (!rot.some(function (r) { return norm(r) !== 0; })) { err.textContent = 'Rotate at least one page first.'; return; }
    busy = true; var btn = this; btn.disabled = true; prog.set(0.4, 'Saving…');
    Promise.all([GM.pdflib(), file.arrayBuffer()]).then(function (r) {
      var L = r[0]; return L.PDFDocument.load(r[1], { updateMetadata: false }).then(function (doc) {
        doc.getPages().forEach(function (pg, i) { if (norm(rot[i]) !== 0) pg.setRotation(L.degrees(norm(pg.getRotation().angle + rot[i]))); });
        return doc.save();
      });
    }).then(function (bytes) {
      prog.hide(); var blob = new Blob([bytes], { type: 'application/pdf' }), name = GM.stem(file.name, 'document') + '-rotated.pdf', n = rot.filter(function (r) { return norm(r) !== 0; }).length;
      out.hidden = false; out.innerHTML = U.grid([U.box('Pages rotated', U.fmt(n, 0) + ' of ' + rot.length, '', true), U.box('File size', GM.size(blob.size))]) + '<div class="tool-actions"><button type="button" class="btn btn-primary" id="pr-dl">Download rotated PDF</button></div>';
      $('#pr-dl').onclick = function () { U.download(name, blob); }; U.download(name, blob);
    }).catch(function (e) { prog.hide(); err.textContent = 'Could not save the PDF: ' + (/encrypt/i.test(e.message) ? 'it is password-protected.' : e.message); })
      .then(function () { busy = false; btn.disabled = false; });
  });
};
