/* Excel to PDF: reads .xlsx (or .csv) in the browser and prints each sheet as a table with pdf-lib.
   Uses the values Excel saved (cached formula results). Latin-alphabet text only (standard PDF fonts). */
NiaziTools['excel-to-pdf'] = function (root, U) {
  var NS = { m: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships' };
  var busy = false, file = null, book = null;
  root.innerHTML = GM.drop({ id: 'xp-file', accept: '.xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Drop an Excel file (.xlsx) or CSV here, or click to choose', hint: '.xlsx or .csv · up to 30 MB · converted on your device' }) +
    '<p class="form-error" id="xp-err" role="alert"></p>' +
    '<div id="xp-opts" hidden><div class="file-row"><span class="file-n" id="xp-badge">XLSX</span><span class="file-name" id="xp-info"></span></div>' +
    '<div class="field" style="margin-top:14px"><label>Sheets to include</label><div id="xp-sheets" class="xp-sheets"></div></div>' +
    '<div class="form-grid"><div class="field"><label for="xp-size">Page size</label><select id="xp-size"><option value="a4">A4</option><option value="letter">US Letter</option></select></div>' +
    '<div class="field"><label for="xp-orient">Orientation</label><select id="xp-orient"><option value="auto">Automatic</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></div>' +
    '<div class="field"><label for="xp-fit">If columns are too wide</label><select id="xp-fit"><option value="shrink">Shrink text to fit the page width</option><option value="bands">Continue extra columns on more pages</option></select></div>' +
    '<div class="field"><label for="xp-fs">Text size</label><select id="xp-fs"><option value="10">Large (10 pt)</option><option value="9" selected>Normal (9 pt)</option><option value="8">Small (8 pt)</option></select></div>' +
    '<div class="field check"><input type="checkbox" id="xp-head" checked><label for="xp-head">Repeat the first row on every page</label></div>' +
    '<div class="field check"><input type="checkbox" id="xp-grid" checked><label for="xp-grid">Draw cell borders</label></div></div>' +
    '<div class="tool-actions"><button type="button" class="btn btn-primary" id="xp-go">Convert to PDF</button></div></div>' +
    GM.progressHTML('xp-prog') + '<div class="tool-result" id="xp-out" aria-live="polite" hidden></div>' +
    '<p class="small muted">Prints the values saved in the file, so formulas show their last calculated result. Not reproduced: charts, pictures, merged cells, fonts and colours. Dates are shown as year-month-day. Letters outside the Latin alphabet, such as Urdu or Arabic, cannot be drawn and appear as “?”. Old .xls files must be saved as .xlsx first.</p>';
  var $ = function (s) { return root.querySelector(s); }, err = $('#xp-err'), out = $('#xp-out'), prog = GM.progress($('#xp-prog'));

  /* ---------- readers ---------- */
  function kids(el, n) { var r = []; for (var c = el && el.firstElementChild; c; c = c.nextElementSibling) if (c.localName === n) r.push(c); return r; }
  function colIndex(ref) { var m = /^([A-Z]+)/.exec(ref), n = 0; if (!m) return 0; for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64); return n - 1; }
  var BUILTIN = { 1: '0', 2: '0.00', 3: '#,##0', 4: '#,##0.00', 9: '0%', 10: '0.00%', 14: 'yyyy-mm-dd', 15: 'd-mmm-yy', 16: 'd-mmm', 17: 'mmm-yy', 18: 'h:mm AM/PM', 19: 'h:mm:ss AM/PM', 20: 'h:mm', 21: 'h:mm:ss', 22: 'yyyy-mm-dd h:mm', 37: '#,##0', 38: '#,##0', 39: '#,##0.00', 40: '#,##0.00', 45: 'mm:ss', 46: '[h]:mm:ss', 47: 'mm:ss.0' };
  function isDateCode(c) { var s = String(c).replace(/"[^"]*"/g, '').replace(/\[[^\]]*\]/g, '').replace(/\\./g, ''); return /[ymdhs]/i.test(s) && !/^general$/i.test(s.trim()); }
  function fmtNumber(v, code) {
    if (!code || /^general$/i.test(code)) { var r = parseFloat(v.toPrecision(12)); return String(r); }
    var main = code.split(';')[0], pre = (/^"([^"]*)"/.exec(main) || [])[1] || '', suf = (/"([^"]*)"\s*$/.exec(main) || [])[1] || '';
    if (/^\[\$/.test(main)) pre = (/^\[\$([^\]-]*)/.exec(main) || [])[1] || '';
    var pct = main.indexOf('%') >= 0, dec = (/\.(0+)/.exec(main) || ['', ''])[1].length, th = /#,##|0,0/.test(main) || /,#/.test(main);
    var n = pct ? v * 100 : v, s = Math.abs(n).toFixed(dec);
    if (th) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (n < 0 ? '-' : '') + pre + s + (pct ? '%' : '') + suf;
  }
  function fmtDate(v, code) {
    var ms = Math.round((v - 25569) * 86400000), d = new Date(ms), p = function (n) { return ('0' + n).slice(-2); };
    var hasD = /[ymd]/i.test(code.replace(/\[[^\]]*\]/g, '')), hasT = /h|s/i.test(code.replace(/\[[^\]]*\]/g, '').replace(/"[^"]*"/g, ''));
    var ds = d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()), ts = p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + (/s/i.test(code) ? ':' + p(d.getUTCSeconds()) : '');
    return hasD && hasT ? ds + ' ' + ts : hasT && !hasD ? ts : ds;
  }
  function readXlsx(buf, name) {
    var z = GM.unzip(buf);
    if (!z.has('xl/workbook.xml')) throw new Error('This does not look like an Excel (.xlsx) workbook.');
    return Promise.all([z.text('xl/workbook.xml'), z.text('xl/_rels/workbook.xml.rels'), z.text('xl/sharedStrings.xml'), z.text('xl/styles.xml')]).then(function (r) {
      var wb = GM.parseXml(r[0], 'workbook'), rels = {}, sst = [], fmts = {}, xfs = [];
      [].forEach.call(GM.parseXml(r[1], 'relationships').documentElement.children, function (e) { rels[e.getAttribute('Id')] = e.getAttribute('Target'); });
      if (r[2]) kids(GM.parseXml(r[2], 'strings').documentElement, 'si').forEach(function (si) { var s = ''; [].forEach.call(si.getElementsByTagNameNS(NS.m, 't'), function (t) { if (!t.parentNode || t.parentNode.localName !== 'rPh') s += t.textContent; }); sst.push(s); });
      if (r[3]) { var sd = GM.parseXml(r[3], 'styles'); [].forEach.call(sd.getElementsByTagNameNS(NS.m, 'numFmt'), function (n) { fmts[n.getAttribute('numFmtId')] = n.getAttribute('formatCode'); }); var cx = sd.getElementsByTagNameNS(NS.m, 'cellXfs')[0]; if (cx) kids(cx, 'xf').forEach(function (x) { xfs.push(x.getAttribute('numFmtId') || '0'); }); }
      var sheets = kids(kid(wb.documentElement, 'sheets'), 'sheet').filter(function (s) { return s.getAttribute('state') !== 'hidden'; });
      function kid(e, n) { return kids(e, n)[0]; }
      return sheets.reduce(function (p, sh) {
        return p.then(function (list) {
          var t = rels[sh.getAttributeNS(NS.r, 'id')]; if (!t) return list; var path = t.charAt(0) === '/' ? t.slice(1) : 'xl/' + t.replace(/^\.\//, '');
          return z.text(path).then(function (xml) {
            if (!xml) return list; var d = GM.parseXml(xml, 'sheet'), hiddenCols = {}, rows = [];
            [].forEach.call(d.getElementsByTagNameNS(NS.m, 'col'), function (c) { if (c.getAttribute('hidden') === '1') for (var i = +c.getAttribute('min'); i <= +c.getAttribute('max'); i++) hiddenCols[i - 1] = 1; });
            [].forEach.call(d.getElementsByTagNameNS(NS.m, 'row'), function (row) {
              if (row.getAttribute('hidden') === '1') return;
              var cells = [], ri = +(row.getAttribute('r') || rows.length + 1) - 1, nxt = 0;
              kids(row, 'c').forEach(function (c) {
                var ci = c.getAttribute('r') ? colIndex(c.getAttribute('r')) : nxt; nxt = ci + 1; var t2 = c.getAttribute('t'), vEl = kid(c, 'v'), v = vEl ? vEl.textContent : '', val = '', num = false;
                if (t2 === 's') val = sst[+v] || ''; else if (t2 === 'inlineStr') val = [].map.call(c.getElementsByTagNameNS(NS.m, 't'), function (x) { return x.textContent; }).join('');
                else if (t2 === 'str' || t2 === 'e') val = v; else if (t2 === 'b') val = v === '1' ? 'TRUE' : 'FALSE';
                else if (v !== '') {
                  var n = parseFloat(v); if (isNaN(n)) val = v; else { var id = xfs[+(c.getAttribute('s') || 0)] || '0', code = fmts[id] || BUILTIN[id] || ''; num = true; val = (isDateCode(code) && (fmts[id] || (id >= 14 && id <= 22) || (id >= 45 && id <= 47))) ? fmtDate(n, code) : fmtNumber(n, code); }
                }
                if (!hiddenCols[ci]) cells[ci] = { v: val, num: num };
              });
              rows[ri] = cells;
            });
            var dense = []; rows.forEach(function (r) { if (r) dense.push(Array.from(r, function (c) { return c || { v: '', num: false }; })); else dense.push([]);});
            while (dense.length && !dense[dense.length - 1].some(function (c) { return c.v !== ''; })) dense.pop();
            list.push({ name: sh.getAttribute('name') || 'Sheet', rows: dense }); return list;
          });
        });
      }, Promise.resolve([]));
    });
  }
  function parseCsv(text) {
    var rows = [], row = [], cur = '', q = false, i = 0; text = text.replace(/^﻿/, '');
    var delim = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    for (; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true; else if (ch === delim) { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.map(function (r) { return r.map(function (v) { return { v: v, num: /^-?[\d,]*\.?\d+$/.test(v.trim()) && v.trim() !== '' }; }); });
  }

  GM.wire(root, 'xp-file', function (fl) {
    var f = fl[0]; if (!f) return; var ext = GM.ext(f.name);
    if (ext === 'xls') { err.textContent = 'Old .xls files are not supported. Open it in Excel and use Save As → Excel Workbook (.xlsx).'; return; }
    var m = GM.checkFile(f, ['xlsx', 'csv'], 30); if (m) { err.textContent = m; return; }
    err.textContent = ''; out.hidden = true; prog.set(0.2, 'Reading the file…');
    var p = ext === 'csv' ? f.text().then(function (t) { return [{ name: GM.stem(f.name, 'Sheet'), rows: parseCsv(t) }]; }) : f.arrayBuffer().then(function (b) { return readXlsx(b, f.name); });
    p.then(function (sheets) {
      prog.hide(); sheets = sheets.filter(function (s) { return s.rows.length; });
      if (!sheets.length) throw new Error('This file has no data to convert.');
      file = f; book = sheets; $('#xp-opts').hidden = false; $('#xp-badge').textContent = ext.toUpperCase();
      $('#xp-info').innerHTML = U.esc(f.name) + '<small>' + GM.size(f.size) + ' · ' + sheets.length + ' sheet' + (sheets.length > 1 ? 's' : '') + '</small>';
      $('#xp-sheets').innerHTML = sheets.map(function (s, i) { return '<label class="xp-sheet"><input type="checkbox" data-i="' + i + '" checked> ' + U.esc(s.name) + ' <small class="muted">(' + U.fmt(s.rows.length, 0) + ' rows)</small></label>'; }).join('');
    }).catch(function (e) { prog.hide(); book = null; $('#xp-opts').hidden = true; err.textContent = e.message; });
  });

  /* ---------- PDF output ---------- */
  function build(sheets, o) {
    return GM.pdflib().then(function (L) {
      return L.PDFDocument.create().then(function (doc) {
        var fonts = GM.pdfFonts(doc, L), reg = fonts.get('sans', false, false), bold = fonts.get('sans', true, false), pages = 0;
        var psz = o.size === 'letter' ? [612, 792] : [595.28, 841.89], M = 36, rowsTotal = 0;
        function wrap(text, font, size, w, maxLines) {
          var lines = [], words = text.split(/\s+/), line = '';
          words.forEach(function (wd) {
            var t = line ? line + ' ' + wd : wd;
            if (font.widthOfTextAtSize(t, size) <= w) { line = t; return; }
            if (line) lines.push(line);
            while (font.widthOfTextAtSize(wd, size) > w && wd.length > 1) { var k = Math.max(1, Math.floor(wd.length * w / font.widthOfTextAtSize(wd, size)) - 1); lines.push(wd.slice(0, k)); wd = wd.slice(k); }
            line = wd;
          });
          if (line) lines.push(line);
          if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,2}$/, '…'); }
          return lines;
        }
        sheets.forEach(function (sh) {
          var nCols = Math.max.apply(null, sh.rows.map(function (r) { return r.length; })), rows = sh.rows;
          rowsTotal += rows.length;
          var fs = o.fs, naturals;
          function measure(size) {
            return Array.from({ length: nCols }, function (_, c) {
              var mx = 0; for (var r = 0; r < Math.min(rows.length, 400); r++) { var cell = rows[r][c]; if (cell && cell.v) mx = Math.max(mx, reg.widthOfTextAtSize(fonts.clean(String(cell.v).split('\n')[0], reg), size)); }
              return Math.max(24, mx + 8);
            });
          }
          var landscape = o.orient === 'landscape', size0 = fs; naturals = measure(size0);
          var total = naturals.reduce(function (a, b) { return a + b; }, 0);
          if (o.orient === 'auto') landscape = total > psz[0] - 2 * M;
          var PW = landscape ? psz[1] : psz[0], PH = landscape ? psz[0] : psz[1], avail = PW - 2 * M;
          var capW = avail * 0.45, widths = naturals.map(function (w) { return Math.min(w, capW); });
          total = widths.reduce(function (a, b) { return a + b; }, 0);
          if (o.fit === 'shrink' && total > avail) { fs = Math.max(5.5, fs * avail / total); naturals = measure(fs); widths = naturals.map(function (w) { return Math.min(w, capW * fs / size0); }); total = widths.reduce(function (a, b) { return a + b; }, 0); if (total > avail) { var k = avail / total; widths = widths.map(function (w) { return w * k; }); } }
          // split columns into bands that each fit the page width
          var bands = [], cur = [], cw = 0;
          widths.forEach(function (w, i) { if (cw + w > avail && cur.length) { bands.push(cur); cur = []; cw = 0; } cur.push(i); cw += w; });
          if (cur.length) bands.push(cur);
          var lh = fs * 1.25, pad = 3;
          bands.forEach(function (band) {
            var page = null, y = 0, first = true;
            function np() { page = doc.addPage([PW, PH]); pages++; y = PH - M; if (first) { page.drawText(fonts.clean(sh.name, bold) + (bands.length > 1 ? '  (columns ' + GM.colName(band[0]) + '–' + GM.colName(band[band.length - 1]) + ')' : ''), { x: M, y: y - 10, size: 11, font: bold, color: L.rgb(0.1, 0.1, 0.2) }); y -= 24; } first = false; }
            function drawRow(r, isHead, lines, h) {
              var x = M;
              band.forEach(function (c) {
                var w = widths[c], cell = rows[r][c] || { v: '', num: false };
                if (isHead && o.head) page.drawRectangle({ x: x, y: y - h, width: w, height: h, color: L.rgb(0.93, 0.94, 0.98) });
                if (o.grid) page.drawRectangle({ x: x, y: y - h, width: w, height: h, borderColor: L.rgb(0.7, 0.7, 0.75), borderWidth: 0.4 });
                var ls = lines[c] || [], font = isHead && o.head ? bold : reg;
                ls.forEach(function (t, li) { var tw = font.widthOfTextAtSize(t, fs); page.drawText(t, { x: cell.num ? x + w - pad - tw : x + pad, y: y - pad - fs * 0.9 - li * lh, size: fs, font: font, color: L.rgb(0, 0, 0) }); });
                x += w;
              });
              y -= h;
            }
            function layoutRow(r) { var lines = {}, mx = 1; band.forEach(function (c) { var cell = rows[r][c]; if (cell && cell.v !== '') { var font = reg, t = fonts.clean(String(cell.v), font).replace(/\s*\n\s*/g, ' '); lines[c] = wrap(t, font, fs, widths[c] - 2 * pad, 6); mx = Math.max(mx, lines[c].length); } }); return { lines: lines, h: mx * lh + 2 * pad - 1 }; }
            np(); var head = o.head ? layoutRow(0) : null;
            rows.forEach(function (row, r) {
              var L2 = layoutRow(r);
              if (y - L2.h < M) { np(); if (head && r > 0) drawRow(0, true, head.lines, head.h); }
              drawRow(r, r === 0, L2.lines, L2.h);
            });
          });
        });
        doc.setTitle(GM.stem(file.name, 'workbook')); doc.setCreator('GM Free Tools & Gadgets');
        return doc.save().then(function (bytes) { return { bytes: bytes, pages: pages, rows: rowsTotal, lost: fonts.lost() }; });
      });
    });
  }
  $('#xp-go').addEventListener('click', function () {
    if (!book || busy) return; err.textContent = ''; out.hidden = true;
    var chosen = [].slice.call(root.querySelectorAll('#xp-sheets input:checked')).map(function (c) { return book[+c.getAttribute('data-i')]; });
    if (!chosen.length) { err.textContent = 'Choose at least one sheet.'; return; }
    var total = chosen.reduce(function (s, x) { return s + x.rows.length; }, 0); if (total > 20000) { err.textContent = 'That is a lot of rows (' + U.fmt(total, 0) + '). Please convert up to 20,000 rows at a time.'; return; }
    busy = true; var btn = this; btn.disabled = true; prog.set(0.3, 'Creating the PDF…');
    GM.nextFrame().then(function () { return build(chosen, { size: $('#xp-size').value, orient: $('#xp-orient').value, fit: $('#xp-fit').value, fs: +$('#xp-fs').value, head: $('#xp-head').checked, grid: $('#xp-grid').checked }); }).then(function (r) {
      prog.hide(); var blob = new Blob([r.bytes], { type: 'application/pdf' }), name = GM.stem(file.name, 'workbook') + '.pdf';
      out.hidden = false;
      out.innerHTML = U.grid([U.box('PDF ready', U.fmt(r.pages, 0) + ' page' + (r.pages > 1 ? 's' : ''), '', true), U.box('Rows printed', U.fmt(r.rows, 0)), U.box('File size', GM.size(blob.size))]) +
        '<div class="tool-actions"><button type="button" class="btn btn-primary" id="xp-dl">Download PDF</button></div>' + (r.lost ? '<p class="result-note">' + U.fmt(r.lost, 0) + ' character' + (r.lost > 1 ? 's' : '') + ' outside the Latin alphabet could not be drawn and appear as “?”.</p>' : '');
      $('#xp-dl').onclick = function () { U.download(name, blob); }; U.download(name, blob);
    }).catch(function (e) { prog.hide(); err.textContent = 'Could not convert this file: ' + e.message; if (window.console) console.warn(e); })
      .then(function () { busy = false; btn.disabled = false; });
  });
};
