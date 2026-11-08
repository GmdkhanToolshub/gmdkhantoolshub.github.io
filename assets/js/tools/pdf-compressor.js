/* PDF Compressor: "Light" re-saves the PDF with pdf-lib (keeps text), "Strong" redraws every page as a compressed
   picture (large savings, but text can no longer be selected). Runs in the browser. Shows real before and after sizes. */
NiaziTools['pdf-compressor'] = function (root, U) {
  var file = null, pdfjsDoc = null, busy = false;
  var LEVELS = { low: { dpi: 100, q: 0.55 }, medium: { dpi: 130, q: 0.7 }, high: { dpi: 170, q: 0.82 } };
  root.innerHTML = GM.drop({ id: 'pc-file', accept: 'application/pdf,.pdf', label: 'Drop a PDF here or click to choose', hint: 'PDF files only · up to 100 MB · compressed on your device' }) +
    '<p class="form-error" id="pc-err" role="alert"></p>' +
    '<div id="pc-opts" hidden><div class="file-row"><span class="file-n">PDF</span><span class="file-name" id="pc-info"></span></div>' +
    '<div class="form-grid" style="margin-top:14px"><div class="field"><label for="pc-mode">Method</label><select id="pc-mode"><option value="strong">Strong: turn pages into compressed pictures (biggest savings)</option><option value="light">Light: keep text and links (small savings)</option></select></div>' +
    '<div class="field" id="pc-lvl-wrap"><label for="pc-lvl">Picture quality</label><select id="pc-lvl"><option value="low">Smallest file (100 DPI, lower quality)</option><option value="medium" selected>Balanced (130 DPI)</option><option value="high">Best quality (170 DPI)</option></select></div></div>' +
    '<p class="small muted" id="pc-hint"></p><div class="tool-actions"><button type="button" class="btn btn-primary" id="pc-go">Compress PDF</button></div></div>' +
    GM.progressHTML('pc-prog') + '<div class="tool-result" id="pc-out" aria-live="polite" hidden></div>';
  var $ = function (s) { return root.querySelector(s); }, err = $('#pc-err'), out = $('#pc-out'), prog = GM.progress($('#pc-prog'));
  function hint() { var s = $('#pc-mode').value === 'strong'; $('#pc-lvl-wrap').hidden = !s; $('#pc-hint').textContent = s ? 'Strong mode redraws each page as a picture. The page looks the same, but text can no longer be selected, searched or copied, and links stop working.' : 'Light mode keeps text, links and quality exactly as they are and only tidies the file structure. PDFs that are already optimised may not shrink at all.'; }
  hint(); $('#pc-mode').addEventListener('change', hint);
  GM.wire(root, 'pc-file', function (fl) {
    var f = fl[0]; if (!f) return; var m = GM.checkFile(f, ['pdf'], 100); if (m) { err.textContent = m; return; }
    err.textContent = ''; out.hidden = true; prog.hide();
    GM.openPdf(f).then(function (d) { pdfjsDoc = d; file = f; $('#pc-opts').hidden = false; $('#pc-info').innerHTML = U.esc(f.name) + '<small>' + GM.size(f.size) + ' · ' + d.numPages + ' page' + (d.numPages > 1 ? 's' : '') + '</small>'; })
      .catch(function (e) { file = null; $('#pc-opts').hidden = true; err.textContent = e.needPassword ? 'This PDF is password-protected. Remove the password first, then compress it.' : e.message; });
  });
  function strong(lv) {
    return Promise.all([GM.pdflib(), file.arrayBuffer()]).then(function (r) {
      var L = r[0]; return L.PDFDocument.create().then(function (doc) {
        var n = pdfjsDoc.numPages, chain = Promise.resolve(), scale = lv.dpi / 72;
        for (let p = 1; p <= n; p++) chain = chain.then(function () {
          prog.set((p - 1) / n * 0.95, 'Compressing page ' + p + ' of ' + n + '…');
          return GM.renderPage(pdfjsDoc, p, scale, 'image/jpeg', lv.q).then(function (res) {
            return GM.bytesOf(res.blob).then(function (b) { return doc.embedJpg(b); }).then(function (im) { var pg = doc.addPage([res.pw, res.ph]); pg.drawImage(im, { x: 0, y: 0, width: res.pw, height: res.ph }); return GM.nextFrame(); });
          });
        });
        return chain.then(function () { doc.setCreator('GM Free Tools & Gadgets'); return doc.save({ useObjectStreams: true }); });
      });
    });
  }
  function light() {
    return Promise.all([GM.pdflib(), file.arrayBuffer()]).then(function (r) {
      return r[0].PDFDocument.load(r[1], { updateMetadata: false }).then(function (doc) { prog.set(0.6, 'Optimising the file structure…'); return doc.save({ useObjectStreams: true }); });
    });
  }
  $('#pc-go').addEventListener('click', function () {
    if (!file || busy) return; busy = true; err.textContent = ''; out.hidden = true; var btn = this; btn.disabled = true; var mode = $('#pc-mode').value;
    prog.set(0.02, 'Starting…');
    (mode === 'strong' ? strong(LEVELS[$('#pc-lvl').value]) : light()).then(function (bytes) {
      prog.hide(); var before = file.size, after = bytes.length, saved = before - after, name = GM.stem(file.name, 'document') + '-compressed.pdf';
      out.hidden = false;
      if (saved <= 0) {
        out.innerHTML = U.grid([U.box('Result', 'No size saved', 'warn', true), U.box('Original', GM.size(before)), U.box('After compressing', GM.size(after))]) +
          '<p class="result-note">This PDF is already well optimised' + (mode === 'light' ? ', so Light mode could not make it smaller. Try Strong mode if you can accept pictures instead of text.' : ', so converting its pages to pictures made it larger. Keep your original file.') + '</p>';
        return;
      }
      var blob = new Blob([bytes], { type: 'application/pdf' });
      out.innerHTML = U.grid([U.box('Smaller by', U.fmt(saved / before * 100, 0) + '%', 'pos', true), U.box('Original', GM.size(before)), U.box('Compressed', GM.size(after))]) +
        '<div class="tool-actions"><button type="button" class="btn btn-primary" id="pc-dl">Download compressed PDF</button></div>' + (mode === 'strong' ? '<p class="result-note">Text in this version is part of the page pictures, so it cannot be selected or searched. Keep your original if you need that.</p>' : '');
      $('#pc-dl').onclick = function () { U.download(name, blob); }; U.download(name, blob);
    }).catch(function (e) { prog.hide(); err.textContent = 'Could not compress this PDF: ' + e.message; })
      .then(function () { busy = false; btn.disabled = false; });
  });
};
