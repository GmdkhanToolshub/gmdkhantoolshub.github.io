/* PDF to Word (DOCX): extracts the text layer with pdf.js and builds an editable .docx. Runs in the browser.
   Text only: images, columns and exact layout are not reproduced, and scanned PDFs need OCR (not included). */
NiaziTools['pdf-to-word'] = function (root, U) {
  var pdf = null, file = null, busy = false;
  root.innerHTML = GM.drop({ id: 'pw-file', accept: 'application/pdf,.pdf', label: 'Drop a PDF here or click to choose', hint: 'Text-based PDFs only · up to 100 MB · converted on your device' }) +
    '<p class="form-error" id="pw-err" role="alert"></p>' +
    '<div id="pw-pw" class="form-grid" hidden><div class="field"><label for="pw-pass">PDF password</label><input type="password" id="pw-pass" autocomplete="off"></div><div class="field" style="align-self:end"><button type="button" class="btn btn-ghost" id="pw-unlock">Unlock PDF</button></div></div>' +
    '<div id="pw-opts" hidden><div class="file-row"><span class="file-n">PDF</span><span class="file-name" id="pw-info"></span></div>' +
    '<div class="form-grid" style="margin-top:14px"><div class="field check"><input type="checkbox" id="pw-head" checked><label for="pw-head">Detect headings (larger text becomes a heading)</label></div>' +
    '<div class="field check"><input type="checkbox" id="pw-pb"><label for="pw-pb">Start each PDF page on a new Word page</label></div></div>' +
    '<div class="tool-actions"><button type="button" class="btn btn-primary" id="pw-go">Convert to Word</button></div></div>' +
    GM.progressHTML('pw-prog') + '<div class="tool-result" id="pw-out" aria-live="polite" hidden></div>' +
    '<p class="small muted">Best for text documents such as letters, reports and articles. Images, tables, columns and exact page layout are not reproduced. Scanned PDFs contain pictures of text rather than real text, so they cannot be converted without OCR.</p>';
  var $ = function (s) { return root.querySelector(s); }, err = $('#pw-err'), out = $('#pw-out'), prog = GM.progress($('#pw-prog'));
  function open(f, pw) {
    err.textContent = ''; out.hidden = true; prog.hide();
    return GM.openPdf(f, pw).then(function (d) {
      pdf = d; file = f; $('#pw-pw').hidden = true; $('#pw-opts').hidden = false;
      $('#pw-info').innerHTML = U.esc(f.name) + '<small>' + GM.size(f.size) + ' · ' + d.numPages + ' page' + (d.numPages > 1 ? 's' : '') + '</small>';
    }).catch(function (e) { pdf = null; $('#pw-opts').hidden = true; if (e.needPassword) { $('#pw-pw').hidden = false; $('#pw-pass').focus(); file = f; } err.textContent = e.message; });
  }
  GM.wire(root, 'pw-file', function (fl) { var f = fl[0]; if (!f) return; var m = GM.checkFile(f, ['pdf'], 100); if (m) { err.textContent = m; return; } $('#pw-pw').hidden = true; open(f); });
  $('#pw-unlock').addEventListener('click', function () { if (file) open(file, $('#pw-pass').value); });

  function median(a) { a = a.slice().sort(function (x, y) { return x - y; }); return a.length ? a[Math.floor(a.length / 2)] : 11; }
  /** Turn the positioned lines of all pages into paragraphs. */
  function build(pagesLines, detectHeads, pageBreaks) {
    var sizes = []; pagesLines.forEach(function (pl) { pl.forEach(function (l) { for (var i = 0; i < Math.min(l.text.length, 80); i += 8) sizes.push(l.size); }); });
    var body = median(sizes), paras = [], chars = 0, rtlCount = 0;
    pagesLines.forEach(function (lines, pi) {
      var maxR = Math.max.apply(null, lines.map(function (l) { return l.x1; }).concat([0])), minL = Math.min.apply(null, lines.map(function (l) { return l.x0; }).concat([1e9]));
      var cur = null, prev = null, first = true;
      function flush() { if (cur) { paras.push(cur); cur = null; } }
      lines.forEach(function (l) {
        chars += l.text.length; if (l.rtl) rtlCount++;
        var big = l.size >= body * 1.25 && l.text.length < 140, head = detectHeads && big && !l.table;
        var join = cur && prev && !l.table && !prev.table && !head && !cur.style && (prev.y - l.y) <= prev.size * 1.65 && Math.abs(prev.size - l.size) < 1.5 &&
          !(prev.x1 < maxR - 0.22 * (maxR - minL) && /[.!?:;]$/.test(prev.text.trim()));
        if (join) cur.t += (cur.rtl ? ' ' : ' ') + l.text.trim();
        else {
          flush();
          cur = { t: l.text, rtl: l.rtl, bold: head, style: head ? (l.size >= body * 1.6 ? 'Heading1' : 'Heading2') : undefined, pb: pageBreaks && pi > 0 && first };
          first = false;
          if (l.table) { paras.push(cur); cur = null; }
        }
        prev = l;
      });
      flush();
      if (pageBreaks && pi > 0 && !paras.length) paras.push({ t: '', pb: true });
    });
    return { paras: paras, chars: chars, rtl: rtlCount };
  }
  $('#pw-go').addEventListener('click', function () {
    if (!pdf || busy) return; busy = true; err.textContent = ''; out.hidden = true; var btn = this; btn.disabled = true;
    var all = [], chain = Promise.resolve(), n = pdf.numPages;
    for (let p = 1; p <= n; p++) chain = chain.then(function () {
      prog.set((p - 1) / n, 'Reading page ' + p + ' of ' + n + '…');
      return pdf.getPage(p).then(GM.pageLines).then(function (l) { all.push(l); return GM.nextFrame(); });
    });
    chain.then(function () {
      var r = build(all, $('#pw-head').checked, $('#pw-pb').checked);
      prog.hide();
      if (r.chars < 20) { err.textContent = 'This PDF has no readable text. It looks like a scan (pictures of text), which needs OCR to convert. Try “PDF to JPG” to turn the pages into images instead.'; return; }
      prog.set(0.95, 'Creating the Word document…');
      var blob = GM.docx(r.paras), name = GM.stem(file.name, 'document') + '.docx'; prog.hide();
      var preview = r.paras.slice(0, 6).map(function (p) { return p.t.replace(/\t/g, '    '); }).join('\n\n').slice(0, 900);
      out.hidden = false;
      out.innerHTML = U.grid([U.box('Word document ready', U.fmt(r.paras.length, 0) + ' paragraphs', '', true), U.box('Characters', U.fmt(r.chars, 0)), U.box('File size', GM.size(blob.size))]) +
        '<div class="tool-actions"><button type="button" class="btn btn-primary" id="pw-dl">Download .docx</button></div>' +
        (r.rtl ? '<p class="result-note">This PDF contains right-to-left text (such as Urdu or Arabic). Extracted text can come out in a different order, so check it carefully in Word.</p>' : '') +
        '<label for="pw-prev" style="margin-top:12px">Preview of the start of the document</label><textarea id="pw-prev" class="output-text" rows="6" readonly dir="auto">' + U.esc(preview) + '</textarea>';
      $('#pw-dl').onclick = function () { U.download(name, blob); };
      U.download(name, blob);
    }).catch(function (e) { prog.hide(); err.textContent = 'Could not convert this PDF: ' + e.message; })
      .then(function () { busy = false; btn.disabled = false; });
  });
};
