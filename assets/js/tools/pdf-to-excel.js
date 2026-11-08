/* PDF to Excel (XLSX): finds tables in the text layer (pdf.js) by locating the empty vertical gaps between
   columns, then writes a real .xlsx. Runs in the browser. Best for text-based tables; scans need OCR (not included). */
NiaziTools['pdf-to-excel'] = function (root, U) {
  var pdf = null, file = null, busy = false;
  root.innerHTML = GM.drop({ id: 'px-file', accept: 'application/pdf,.pdf', label: 'Drop a PDF here or click to choose', hint: 'Text-based PDFs only · up to 100 MB · converted on your device' }) +
    '<p class="form-error" id="px-err" role="alert"></p>' +
    '<div id="px-pw" class="form-grid" hidden><div class="field"><label for="px-pass">PDF password</label><input type="password" id="px-pass" autocomplete="off"></div><div class="field" style="align-self:end"><button type="button" class="btn btn-ghost" id="px-unlock">Unlock PDF</button></div></div>' +
    '<div id="px-opts" hidden><div class="file-row"><span class="file-n">PDF</span><span class="file-name" id="px-info"></span></div>' +
    '<div class="form-grid" style="margin-top:14px"><div class="field"><label for="px-mode">Put the data in</label><select id="px-mode"><option value="one">One sheet (all pages together)</option><option value="each">One sheet per PDF page</option></select></div>' +
    '<div class="field"><label for="px-pages">Pages</label><input type="text" id="px-pages" placeholder="All pages, or e.g. 1-3, 5"></div>' +
    '<div class="field check"><input type="checkbox" id="px-num" checked><label for="px-num">Turn numbers into real Excel numbers</label></div></div>' +
    '<div class="tool-actions"><button type="button" class="btn btn-primary" id="px-go">Convert to Excel</button></div></div>' +
    GM.progressHTML('px-prog') + '<div class="tool-result" id="px-out" aria-live="polite" hidden></div>' +
    '<p class="small muted">Works best on PDFs made from spreadsheets, statements and reports that contain real text in a table. Complex layouts, merged cells and several differently shaped tables on one page are approximated. Scanned PDFs contain pictures of text and need OCR, which is not included.</p>';
  var $ = function (s) { return root.querySelector(s); }, err = $('#px-err'), out = $('#px-out'), prog = GM.progress($('#px-prog'));
  function open(f, pw) {
    err.textContent = ''; out.hidden = true; prog.hide();
    return GM.openPdf(f, pw).then(function (d) {
      pdf = d; file = f; $('#px-pw').hidden = true; $('#px-opts').hidden = false;
      $('#px-info').innerHTML = U.esc(f.name) + '<small>' + GM.size(f.size) + ' · ' + d.numPages + ' page' + (d.numPages > 1 ? 's' : '') + '</small>';
    }).catch(function (e) { pdf = null; $('#px-opts').hidden = true; if (e.needPassword) { $('#px-pw').hidden = false; $('#px-pass').focus(); file = f; } err.textContent = e.message; });
  }
  GM.wire(root, 'px-file', function (fl) { var f = fl[0]; if (!f) return; var m = GM.checkFile(f, ['pdf'], 100); if (m) { err.textContent = m; return; } $('#px-pw').hidden = true; open(f); });
  $('#px-unlock').addEventListener('click', function () { if (file) open(file, $('#px-pass').value); });

  /** Rows of cells for one page. Columns are the horizontal ranges covered by text in rows that have 2+ cells. */
  function pageRows(lines) {
    var tbl = lines.filter(function (l) { return l.cells.length >= 2; }), ivs = [];
    tbl.forEach(function (l) { l.cells.forEach(function (c) { if (c.x1 - c.x < 260) ivs.push([c.x, c.x1]); }); });
    ivs.sort(function (a, b) { return a[0] - b[0]; });
    var cols = [];
    ivs.forEach(function (iv) { var last = cols[cols.length - 1]; if (last && iv[0] <= last[1] + 1.5) last[1] = Math.max(last[1], iv[1]); else cols.push([iv[0], iv[1]]); });
    function colOf(x0, x1, single) {
      if (!cols.length) return 0;
      var cx = single ? x0 : (x0 + x1) / 2;
      for (var i = 0; i < cols.length; i++) if (cx >= cols[i][0] - 1.5 && cx <= cols[i][1] + 1.5) return i;
      var best = 0, bd = 1e9; cols.forEach(function (c, i) { var d = Math.min(Math.abs(cx - c[0]), Math.abs(cx - c[1])); if (d < bd) { bd = d; best = i; } }); return best;
    }
    return lines.map(function (l) {
      var row = [];
      l.cells.forEach(function (c) { var ci = colOf(c.x, c.x1, l.cells.length === 1); row[ci] = row[ci] ? row[ci] + ' ' + c.s.trim() : c.s.trim(); });
      return Array.from(row, function (v) { return v == null ? '' : v; });
    });
  }
  var NUM = /^\(?-?\d{1,3}(,\d{3})*(\.\d+)?\)?$|^\(?-?\d+(\.\d+)?\)?$/;
  function toNum(v) { if (!NUM.test(v)) return v; var neg = /^\(.*\)$/.test(v) || /^-/.test(v), n = parseFloat(v.replace(/[(),-]/g, '')); return isNaN(n) ? v : (neg ? -n : n); }
  $('#px-go').addEventListener('click', function () {
    if (!pdf || busy) return; err.textContent = ''; out.hidden = true;
    var pages; try { pages = GM.parseRanges($('#px-pages').value, pdf.numPages, true); } catch (e) { err.textContent = e.message; return; }
    busy = true; var btn = this; btn.disabled = true; var perPage = [], chars = 0, chain = Promise.resolve();
    pages.forEach(function (p, i) {
      chain = chain.then(function () {
        prog.set(i / pages.length, 'Reading page ' + p + ' (' + (i + 1) + ' of ' + pages.length + ')…');
        return pdf.getPage(p).then(GM.pageLines).then(function (lines) { chars += lines.reduce(function (s, l) { return s + l.text.length; }, 0); perPage.push({ n: p, rows: pageRows(lines) }); return GM.nextFrame(); });
      });
    });
    chain.then(function () {
      prog.hide();
      if (chars < 20) { err.textContent = 'This PDF has no readable text. It looks like a scan (pictures of text), which needs OCR to convert. Try “PDF to JPG” to turn the pages into images instead.'; return; }
      var conv = $('#px-num').checked, sheets;
      var fix = function (rows) { return rows.map(function (r) { return r.map(function (v) { return conv && typeof v === 'string' ? toNum(v) : v; }); }); };
      sheets = $('#px-mode').value === 'each' ? perPage.map(function (pp) { return { name: 'Page ' + pp.n, rows: fix(pp.rows) }; })
        : [{ name: GM.stem(file.name, 'Data').slice(0, 28), rows: fix([].concat.apply([], perPage.map(function (pp) { return pp.rows; }))) }];
      var blob = GM.xlsx(sheets), name = GM.stem(file.name, 'document') + '.xlsx', totalRows = sheets.reduce(function (s, x) { return s + x.rows.length; }, 0);
      var first = sheets[0].rows.slice(0, 12), w = Math.min(8, Math.max.apply(null, first.map(function (r) { return r.length; }).concat([1])));
      out.hidden = false;
      out.innerHTML = U.grid([U.box('Excel workbook ready', U.fmt(sheets.length, 0) + ' sheet' + (sheets.length > 1 ? 's' : ''), '', true), U.box('Rows', U.fmt(totalRows, 0)), U.box('File size', GM.size(blob.size))]) +
        '<div class="tool-actions"><button type="button" class="btn btn-primary" id="px-dl">Download .xlsx</button></div><p class="small muted" style="margin-bottom:6px">Preview of the first rows</p>' +
        U.table(Array.from({ length: w }, function (_, i) { return GM.colName(i); }), first.map(function (r) { return Array.from({ length: w }, function (_, i) { return U.esc(r[i] == null ? '' : r[i]); }); }), 99);
      $('#px-dl').onclick = function () { U.download(name, blob); };
      U.download(name, blob);
    }).catch(function (e) { prog.hide(); err.textContent = 'Could not convert this PDF: ' + e.message; })
      .then(function () { busy = false; btn.disabled = false; });
  });
};
