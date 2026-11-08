/* PDF to JPG: renders each page with pdf.js in the browser. Nothing is uploaded. */
NiaziTools['pdf-to-jpg'] = function (root, U) {
  var pdf = null, file = null, urls = [], busy = false, results = [];
  root.innerHTML = GM.drop({ id: 'pj-file', accept: 'application/pdf,.pdf', label: 'Drop a PDF here or click to choose', hint: 'PDF files only · up to 100 MB · converted on your device' }) +
    '<p class="form-error" id="pj-err" role="alert"></p>' +
    '<div id="pj-pw" class="form-grid" hidden><div class="field"><label for="pj-pass">PDF password</label><input type="password" id="pj-pass" autocomplete="off"></div><div class="field" style="align-self:end"><button type="button" class="btn btn-ghost" id="pj-unlock">Unlock PDF</button></div></div>' +
    '<div id="pj-opts" hidden><div class="file-row"><span class="file-n">PDF</span><span class="file-name" id="pj-info"></span></div>' +
    '<div class="form-grid" style="margin-top:14px"><div class="field"><label for="pj-fmt">Image format</label><select id="pj-fmt"><option value="image/jpeg">JPG (smaller files)</option><option value="image/png">PNG (lossless, larger)</option></select></div>' +
    '<div class="field"><label for="pj-dpi">Resolution</label><select id="pj-dpi"><option value="1">72 DPI · screen, smallest</option><option value="1.5">108 DPI · web</option><option value="2" selected>144 DPI · sharp on screens</option><option value="3">216 DPI · high quality</option><option value="4.1667">300 DPI · print quality</option></select></div>' +
    '<div class="field"><label for="pj-q">JPG quality: <span id="pj-qv">90</span>%</label><input type="range" id="pj-q" min="50" max="100" value="90"></div>' +
    '<div class="field"><label for="pj-pages">Pages</label><input type="text" id="pj-pages" placeholder="All pages, or e.g. 1-3, 5"><small class="hint">Leave empty to convert every page.</small></div></div>' +
    '<div class="tool-actions"><button type="button" class="btn btn-primary" id="pj-go">Convert to images</button></div></div>' +
    GM.progressHTML('pj-prog') + '<div class="tool-result" id="pj-out" aria-live="polite" hidden></div>';
  var $ = function (s) { return root.querySelector(s); }, err = $('#pj-err'), out = $('#pj-out'), prog = GM.progress($('#pj-prog'));
  function clearOut() { urls.forEach(URL.revokeObjectURL); urls = []; results = []; out.innerHTML = ''; out.hidden = true; }
  function open(f, pw) {
    err.textContent = ''; prog.hide(); clearOut();
    return GM.openPdf(f, pw).then(function (d) {
      pdf = d; file = f; $('#pj-pw').hidden = true; $('#pj-opts').hidden = false;
      $('#pj-info').innerHTML = U.esc(f.name) + '<small>' + GM.size(f.size) + ' · ' + d.numPages + ' page' + (d.numPages > 1 ? 's' : '') + '</small>';
    }).catch(function (e) {
      pdf = null; $('#pj-opts').hidden = true;
      if (e.needPassword) { $('#pj-pw').hidden = false; $('#pj-pass').focus(); file = f; }
      err.textContent = e.message;
    });
  }
  GM.wire(root, 'pj-file', function (fl) {
    var f = fl[0]; if (!f) return; var m = GM.checkFile(f, ['pdf'], 100); if (m) { err.textContent = m; return; }
    $('#pj-pw').hidden = true; open(f);
  });
  $('#pj-unlock').addEventListener('click', function () { if (file) open(file, $('#pj-pass').value); });
  $('#pj-q').addEventListener('input', function () { $('#pj-qv').textContent = this.value; });
  $('#pj-fmt').addEventListener('change', function () { $('#pj-q').disabled = this.value === 'image/png'; });
  $('#pj-go').addEventListener('click', function () {
    if (!pdf || busy) return; err.textContent = '';
    var pages; try { pages = GM.parseRanges($('#pj-pages').value, pdf.numPages, true); } catch (e) { err.textContent = e.message; return; }
    var type = $('#pj-fmt').value, ext = type === 'image/png' ? 'png' : 'jpg', scale = +$('#pj-dpi').value, q = +$('#pj-q').value / 100, name = GM.stem(file.name, 'document');
    busy = true; this.disabled = true; clearOut(); var btn = this;
    var chain = Promise.resolve();
    pages.forEach(function (n, i) {
      chain = chain.then(function () {
        prog.set(i / pages.length, 'Converting page ' + n + ' (' + (i + 1) + ' of ' + pages.length + ')…');
        return GM.renderPage(pdf, n, scale, type, q).then(function (r) { results.push({ n: n, blob: r.blob, w: r.w, h: r.h, name: name + '-page-' + n + '.' + ext }); return GM.nextFrame(); });
      });
    });
    chain.then(function () {
      prog.set(1, 'Done'); setTimeout(prog.hide, 600);
      var total = results.reduce(function (s, r) { return s + r.blob.size; }, 0);
      out.hidden = false;
      out.innerHTML = U.grid([U.box('Images created', U.fmt(results.length, 0), '', true), U.box('Total size', GM.size(total)), U.box('Size per image', results[0].w + ' × ' + results[0].h + ' px')]) +
        '<div class="tool-actions"><button type="button" class="btn btn-primary" id="pj-zip">Download all (ZIP)</button></div><div class="thumb-grid" id="pj-grid"></div>';
      var grid = $('#pj-grid');
      results.forEach(function (r, i) {
        var u = URL.createObjectURL(r.blob); urls.push(u);
        grid.insertAdjacentHTML('beforeend', '<figure class="thumb"><img src="' + u + '" alt="Page ' + r.n + ' as an image" width="120" height="160" loading="lazy"><figcaption><span class="file-n">' + r.n + '</span>' + GM.size(r.blob.size) + '</figcaption><div class="thumb-btns"><button type="button" class="btn btn-ghost btn-sm" data-dl="' + i + '">Download</button></div></figure>');
      });
      grid.addEventListener('click', function (e) { var b = e.target.closest('[data-dl]'); if (b) { var r = results[+b.getAttribute('data-dl')]; U.download(r.name, r.blob); } });
      $('#pj-zip').onclick = function () { GM.zipBlobs(results.map(function (r) { return { name: r.name, blob: r.blob }; })).then(function (z) { U.download(name + '-images.zip', z); }); };
      if (results.length === 1) U.download(results[0].name, results[0].blob);
    }).catch(function (e) { err.textContent = 'Could not convert this PDF: ' + e.message; prog.hide(); })
      .then(function () { busy = false; btn.disabled = false; });
  });
};
