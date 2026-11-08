/* Word to PDF: reads a .docx (a ZIP of XML) in the browser and lays it out as a PDF with pdf-lib.
   Supports text styles, headings, lists, tables and PNG/JPG images. Latin-alphabet text only (standard PDF fonts). */
NiaziTools['word-to-pdf'] = function (root, U) {
  var NS = { w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main', r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships', a: 'http://schemas.openxmlformats.org/drawingml/2006/main', wp: 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing' };
  var busy = false, file = null;
  root.innerHTML = GM.drop({ id: 'wd-file', accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Drop a Word document (.docx) here or click to choose', hint: '.docx files only · up to 50 MB · converted on your device' }) +
    '<p class="form-error" id="wd-err" role="alert"></p>' +
    '<div id="wd-opts" hidden><div class="file-row"><span class="file-n">DOCX</span><span class="file-name" id="wd-info"></span></div>' +
    '<div class="form-grid" style="margin-top:14px"><div class="field"><label for="wd-size">Page size</label><select id="wd-size"><option value="doc">As set in the document</option><option value="a4">A4</option><option value="letter">US Letter</option></select></div></div>' +
    '<div class="tool-actions"><button type="button" class="btn btn-primary" id="wd-go">Convert to PDF</button></div></div>' +
    GM.progressHTML('wd-prog') + '<div class="tool-result" id="wd-out" aria-live="polite" hidden></div>' +
    '<p class="small muted">Supports headings, bold and italic text, colours, bullet and numbered lists, tables and PNG or JPG pictures. Not reproduced: headers and footers, text boxes, shapes, footnotes and exact fonts (standard PDF fonts are used). Letters outside the Latin alphabet, such as Urdu, Arabic or Chinese, cannot be drawn and appear as “?”. Older .doc files must be saved as .docx in Word first.</p>';
  var $ = function (s) { return root.querySelector(s); }, err = $('#wd-err'), out = $('#wd-out'), prog = GM.progress($('#wd-prog'));
  GM.wire(root, 'wd-file', function (fl) {
    var f = fl[0]; if (!f) return; var m = GM.checkFile(f, ['docx'], 50);
    if (m) { err.textContent = GM.ext(f.name) === 'doc' ? 'Old .doc files are not supported. Open it in Word and use Save As → Word Document (.docx).' : m; return; }
    err.textContent = ''; out.hidden = true; file = f; $('#wd-opts').hidden = false;
    $('#wd-info').innerHTML = U.esc(f.name) + '<small>' + GM.size(f.size) + '</small>';
  });

  /* ---------- XML helpers ---------- */
  function kids(el, name) { var r = []; for (var c = el && el.firstElementChild; c; c = c.nextElementSibling) if (c.localName === name) r.push(c); return r; }
  function kid(el, name) { return kids(el, name)[0] || null; }
  function wv(el, name, attr) { var k = kid(el, name); if (!k) return null; var v = k.getAttributeNS(NS.w, attr || 'val'); return v === '' || v == null ? (k ? 'true' : null) : v; }
  function onoff(el, name) { var k = kid(el, name); if (!k) return null; var v = k.getAttributeNS(NS.w, 'val'); return !(v === '0' || v === 'false' || v === 'off'); }
  function famOf(n) { n = n || ''; return /times|georgia|garamond|cambria|palatino|book|serif(?!.*sans)/i.test(n) && !/sans/i.test(n) ? 'serif' : /courier|consolas|mono|menlo/i.test(n) ? 'mono' : 'sans'; }
  function roman(n, upper) { var m = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']], s = ''; m.forEach(function (p) { while (n >= p[0]) { s += p[1]; n -= p[0]; } }); return upper ? s.toUpperCase() : s; }
  function letters(n, upper) { var s = ''; for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(97 + (n - 1) % 26) + s; return upper ? s.toUpperCase() : s; }

  function readStyles(xml) {
    var map = {}, def = { sz: 22, fam: 'sans', after: 0, line: 240 };
    if (!xml) return { map: map, def: def };
    var d = GM.parseXml(xml, 'styles'), dd = d.getElementsByTagNameNS(NS.w, 'docDefaults')[0];
    if (dd) {
      var rp = kid(kid(dd, 'rPrDefault'), 'rPr'), pp = kid(kid(dd, 'pPrDefault'), 'pPr');
      if (rp) { var s = wv(rp, 'sz'); if (s) def.sz = +s; var rf = kid(rp, 'rFonts'); if (rf) def.fam = famOf(rf.getAttributeNS(NS.w, 'ascii') || rf.getAttributeNS(NS.w, 'hAnsi')); }
      if (pp) { var sp = kid(pp, 'spacing'); if (sp) { def.after = +(sp.getAttributeNS(NS.w, 'after') || 0); def.line = +(sp.getAttributeNS(NS.w, 'line') || 240); } }
    }
    kids(d.documentElement, 'style').forEach(function (st) {
      var id = st.getAttributeNS(NS.w, 'styleId'), pp = kid(st, 'pPr'), rp = kid(st, 'rPr'), o = { based: wv(st, 'basedOn'), name: (wv(st, 'name') || '').toLowerCase() };
      if (pp) { o.jc = wv(pp, 'jc'); var snp = kid(pp, 'numPr'); if (snp) { o.numId = wv(snp, 'numId'); o.ilvl = wv(snp, 'ilvl'); } var sp = kid(pp, 'spacing'); if (sp) { o.before = sp.getAttributeNS(NS.w, 'before'); o.after = sp.getAttributeNS(NS.w, 'after'); o.line = sp.getAttributeNS(NS.w, 'line'); o.lineRule = sp.getAttributeNS(NS.w, 'lineRule'); } var ind = kid(pp, 'ind'); if (ind) { o.left = ind.getAttributeNS(NS.w, 'left') || ind.getAttributeNS(NS.w, 'start'); o.hanging = ind.getAttributeNS(NS.w, 'hanging'); o.first = ind.getAttributeNS(NS.w, 'firstLine'); } }
      if (rp) { o.sz = wv(rp, 'sz'); o.b = onoff(rp, 'b'); o.i = onoff(rp, 'i'); var c = wv(rp, 'color'); if (c && c !== 'auto') o.color = c; var rf = kid(rp, 'rFonts'); if (rf) o.fam = famOf(rf.getAttributeNS(NS.w, 'ascii') || rf.getAttributeNS(NS.w, 'hAnsi')); }
      map[id] = o;
    });
    return { map: map, def: def };
  }
  function chain(styles, id) { var list = [], guard = 0; while (id && styles.map[id] && guard++ < 12) { list.unshift(styles.map[id]); id = styles.map[id].based; } return list; }
  function pick(list, key) { var v; list.forEach(function (o) { if (o[key] != null && o[key] !== '' && o[key] !== undefined) v = o[key]; }); return v; }

  function readNumbering(xml) {
    var nums = {}, abs = {};
    if (!xml) return nums;
    var d = GM.parseXml(xml, 'numbering');
    kids(d.documentElement, 'abstractNum').forEach(function (a) {
      var lv = {}; kids(a, 'lvl').forEach(function (l) { var ind = kid(kid(l, 'pPr'), 'ind'); lv[+l.getAttributeNS(NS.w, 'ilvl')] = { fmt: wv(l, 'numFmt') || 'decimal', text: wv(l, 'lvlText') || '%1.', start: +(wv(l, 'start') || 1), left: ind ? +(ind.getAttributeNS(NS.w, 'left') || ind.getAttributeNS(NS.w, 'start') || 0) : null, hanging: ind ? +(ind.getAttributeNS(NS.w, 'hanging') || 0) : null }; });
      abs[a.getAttributeNS(NS.w, 'abstractNumId')] = lv;
    });
    kids(d.documentElement, 'num').forEach(function (n) { nums[n.getAttributeNS(NS.w, 'numId')] = abs[wv(n, 'abstractNumId')] || {}; });
    return nums;
  }

  /* ---------- conversion ---------- */
  function convert(f, sizeChoice) {
    var warn = { images: 0, tables: 0 };
    return f.arrayBuffer().then(function (buf) {
      var z = GM.unzip(buf);
      if (!z.has('word/document.xml')) throw new Error('This does not look like a Word (.docx) document.');
      return Promise.all([z.text('word/document.xml'), z.text('word/styles.xml'), z.text('word/numbering.xml'), z.text('word/_rels/document.xml.rels'), GM.pdflib()]).then(function (r) { return { z: z, docXml: r[0], stylesXml: r[1], numXml: r[2], relsXml: r[3], L: r[4] }; });
    }).then(function (ctx) {
      prog.set(0.1, 'Reading the document…');
      var L = ctx.L, dom = GM.parseXml(ctx.docXml, 'document'), body = dom.getElementsByTagNameNS(NS.w, 'body')[0];
      var styles = readStyles(ctx.stylesXml), nums = readNumbering(ctx.numXml), rels = {};
      if (ctx.relsXml) { var rd = GM.parseXml(ctx.relsXml, 'relationships'); [].forEach.call(rd.documentElement.children, function (e) { rels[e.getAttribute('Id')] = e.getAttribute('Target'); }); }
      // page setup from the final section
      var sect = null; kids(body, 'sectPr').forEach(function (s) { sect = s; }); if (!sect) { var ss = body.getElementsByTagNameNS(NS.w, 'sectPr'); sect = ss[ss.length - 1] || null; }
      var pgSz = sect && kid(sect, 'pgSz'), pgMar = sect && kid(sect, 'pgMar'), PW = 595.28, PH = 841.89;
      if (sizeChoice === 'letter') { PW = 612; PH = 792; }
      else if (sizeChoice === 'doc' && pgSz) { var w = +pgSz.getAttributeNS(NS.w, 'w'), h = +pgSz.getAttributeNS(NS.w, 'h'); if (w > 2000 && h > 2000) { PW = w / 20; PH = h / 20; } }
      var mar = function (n, d) { var v = pgMar ? +pgMar.getAttributeNS(NS.w, n) : 0; return v ? Math.max(28, Math.min(150, v / 20)) : d; };
      var M = { t: mar('top', 72), r: mar('right', 72), b: mar('bottom', 72), l: mar('left', 72) };
      var CW = PW - M.l - M.r;
      return L.PDFDocument.create().then(function (doc) {
        var fonts = GM.pdfFonts(doc, L), pages = [], page = null, y = 0, counters = {};
        function newPage() { page = doc.addPage([PW, PH]); pages.push(page); y = PH - M.t; }
        function ensure(h) { if (!page || y - h < M.b) newPage(); }
        var imgs = {};
        // embed pictures up front
        var rids = []; [].forEach.call(body.getElementsByTagNameNS(NS.a, 'blip'), function (b) { var id = b.getAttributeNS(NS.r, 'embed'); if (id && rids.indexOf(id) < 0) rids.push(id); });
        return rids.reduce(function (p, id) {
          return p.then(function () {
            var t = rels[id]; if (!t) return; var path = t.charAt(0) === '/' ? t.slice(1) : 'word/' + t.replace(/^\.\//, ''), ext = GM.ext(path);
            if (['png', 'jpg', 'jpeg'].indexOf(ext) < 0) return;
            return ctx.z.bytes(path).then(function (b) { if (!b) return; return (ext === 'png' ? doc.embedPng(b) : doc.embedJpg(b)).then(function (im) { imgs[id] = im; }); }).catch(function () {});
          });
        }, Promise.resolve()).then(function () {
          /* ----- paragraph model ----- */
          function runProps(rp, base) {
            var o = { sz: base.sz, b: base.b, i: base.i, color: base.color, fam: base.fam };
            if (rp) {
              var s = wv(rp, 'sz'); if (s) o.sz = +s; var b = onoff(rp, 'b'); if (b != null) o.b = b; var i = onoff(rp, 'i'); if (i != null) o.i = i;
              var c = wv(rp, 'color'); if (c && c !== 'auto') o.color = c; var rf = kid(rp, 'rFonts'); if (rf) o.fam = famOf(rf.getAttributeNS(NS.w, 'ascii') || rf.getAttributeNS(NS.w, 'hAnsi'));
              var va = wv(rp, 'vertAlign'); if (va === 'superscript' || va === 'subscript') o.sz = Math.round(o.sz * 0.7);
              if (kid(rp, 'caps') && onoff(rp, 'caps') !== false) o.caps = true;
            }
            return o;
          }
          function collect(node, base, out) {
            for (var c = node.firstElementChild; c; c = c.nextElementSibling) {
              var n = c.localName;
              if (n === 'r') {
                var rp = runProps(kid(c, 'rPr'), base);
                for (var e = c.firstElementChild; e; e = e.nextElementSibling) {
                  if (e.localName === 't') out.push({ k: 't', s: e.textContent, o: rp });
                  else if (e.localName === 'tab') out.push({ k: 'tab', o: rp });
                  else if (e.localName === 'br' || e.localName === 'cr') out.push({ k: e.getAttributeNS(NS.w, 'type') === 'page' ? 'pb' : 'br', o: rp });
                  else if (e.localName === 'noBreakHyphen') out.push({ k: 't', s: '-', o: rp });
                  else if (e.localName === 'drawing' || e.localName === 'pict') {
                    var bl = e.getElementsByTagNameNS(NS.a, 'blip')[0], ext = e.getElementsByTagNameNS(NS.wp, 'extent')[0];
                    if (bl) out.push({ k: 'img', id: bl.getAttributeNS(NS.r, 'embed'), cx: ext ? +ext.getAttribute('cx') / 12700 : 0, cy: ext ? +ext.getAttribute('cy') / 12700 : 0 });
                  }
                }
              } else if (n === 'hyperlink' || n === 'smartTag' || n === 'sdt' || n === 'sdtContent' || n === 'ins' || n === 'fldSimple' || n === 'customXml') collect(c, base, out);
              else if (n === 'AlternateContent') { var ch = kid(c, 'Choice') || kid(c, 'Fallback'); if (ch) collect(ch, base, out); }
            }
            return out;
          }
          function paraInfo(p) {
            var pPr = kid(p, 'pPr'), sid = pPr ? wv(pPr, 'pStyle') : null, list = chain(styles, sid || 'Normal'), P = {};
            var sp = pPr && kid(pPr, 'spacing'), ind = pPr && kid(pPr, 'ind'), rp0 = pPr && kid(pPr, 'rPr');
            P.jc = (pPr && wv(pPr, 'jc')) || pick(list, 'jc') || 'left';
            P.before = sp && sp.getAttributeNS(NS.w, 'before') !== '' ? +sp.getAttributeNS(NS.w, 'before') : +(pick(list, 'before') || 0);
            P.after = sp && sp.getAttributeNS(NS.w, 'after') !== '' ? +sp.getAttributeNS(NS.w, 'after') : (pick(list, 'after') != null ? +pick(list, 'after') : styles.def.after);
            var line = sp && sp.getAttributeNS(NS.w, 'line') !== '' ? +sp.getAttributeNS(NS.w, 'line') : (pick(list, 'line') != null ? +pick(list, 'line') : styles.def.line), rule = (sp && sp.getAttributeNS(NS.w, 'lineRule')) || pick(list, 'lineRule') || 'auto';
            P.mult = rule === 'auto' ? Math.max(0.8, line / 240) : 1; P.exact = rule !== 'auto' ? line / 20 : 0;
            var g = function (k, a) { var v = ind && (ind.getAttributeNS(NS.w, a) || (a === 'left' ? ind.getAttributeNS(NS.w, 'start') : '')); return v ? +v : (pick(list, k) != null ? +pick(list, k) : 0); };
            P.left = g('left', 'left') / 20; P.hang = g('hanging', 'hanging') / 20; P.first = g('first', 'firstLine') / 20;
            var base = { sz: +(pick(list, 'sz') || styles.def.sz), b: !!pick(list, 'b'), i: !!pick(list, 'i'), color: pick(list, 'color'), fam: pick(list, 'fam') || styles.def.fam };
            if (/^(heading|title)/i.test(sid || '') || /^(heading|title)/.test((styles.map[sid] || {}).name || '')) { if (pick(list, 'b') == null) base.b = true; }
            P.base = base; P.rpMark = rp0;
            // List numbering can be set on the paragraph itself or come from its style (for example "List Bullet").
            var np = pPr && kid(pPr, 'numPr');
            if (np) P.num = { id: wv(np, 'numId'), lvl: +(wv(np, 'ilvl') || 0) };
            else if (pick(list, 'numId') != null) P.num = { id: pick(list, 'numId'), lvl: +(pick(list, 'ilvl') || 0) };
            else P.num = null;
            P.pb = !!(pPr && kid(pPr, 'pageBreakBefore'));
            return P;
          }
          function marker(P) {
            if (!P.num || P.num.id === '0') return null; var def = nums[P.num.id] && nums[P.num.id][P.num.lvl]; if (!def) return null;
            var key = P.num.id; counters[key] = counters[key] || {};
            counters[key][P.num.lvl] = (counters[key][P.num.lvl] == null ? def.start - 1 : counters[key][P.num.lvl]) + 1;
            Object.keys(counters[key]).forEach(function (l) { if (+l > P.num.lvl) delete counters[key][l]; });
            if (def.fmt === 'bullet') return { text: '•', left: def.left, hang: def.hanging };
            var fmtN = function (lv) { var d2 = nums[P.num.id][lv] || def, n = counters[key][lv] != null ? counters[key][lv] : d2.start; return d2.fmt === 'lowerLetter' ? letters(n) : d2.fmt === 'upperLetter' ? letters(n, true) : d2.fmt === 'lowerRoman' ? roman(n) : d2.fmt === 'upperRoman' ? roman(n, true) : String(n); };
            return { text: def.text.replace(/%(\d)/g, function (m, d) { return fmtN(+d - 1); }), left: def.left, hang: def.hanging };
          }
          /* ----- layout ----- */
          function hex(c) { return c && /^[0-9a-f]{6}$/i.test(c) ? L.rgb(parseInt(c.substr(0, 2), 16) / 255, parseInt(c.substr(2, 2), 16) / 255, parseInt(c.substr(4, 2), 16) / 255) : L.rgb(0, 0, 0); }
          function layout(toks, P, width, mk) {
            var left = P.left, lines = [], line = null, size0 = P.base.sz / 2;
            var indentFirst = mk ? 0 : P.first - P.hang, avail = function () { return width - left - (lines.length || line && line.items.length ? 0 : indentFirst); };
            function start() { line = { items: [], w: 0, size: size0, img: null }; }
            function end() { if (line) { lines.push(line); line = null; } }
            start();
            function addWord(txt, o, space) {
              var size = o.sz / 2, font = fonts.get(o.fam, o.b, o.i), text = fonts.clean(o.caps ? txt.toUpperCase() : txt, font);
              var w = font.widthOfTextAtSize(text, size), sw = space ? font.widthOfTextAtSize(' ', size) : 0, max = width - left - (lines.length ? 0 : indentFirst);
              if (line.w + w > max && line.items.length) { end(); start(); }
              if (w > width - left) { // break very long words
                var cut = Math.max(1, Math.floor(text.length * (width - left) / w) - 1);
                while (text.length > cut) { addWord(text.slice(0, cut), o, false); end(); start(); text = text.slice(cut); }
                w = font.widthOfTextAtSize(text, size);
              }
              line.items.push({ text: text, x: line.w, font: font, size: size, color: hex(o.color) }); line.w += w + sw; line.size = Math.max(line.size, size);
            }
            toks.forEach(function (t) {
              if (t.k === 't') {
                var parts = t.s.split(/(\s+)/);
                parts.forEach(function (s) { if (!s) return; if (/^\s+$/.test(s)) { if (line.items.length) line.w += fonts.get(t.o.fam, t.o.b, t.o.i).widthOfTextAtSize(' ', t.o.sz / 2); } else addWord(s, t.o, false); });
                // keep a space after the last word of this run
              } else if (t.k === 'tab') { line.w = (Math.floor(line.w / 36) + 1) * 36; }
              else if (t.k === 'br') { end(); start(); }
              else if (t.k === 'pb') { end(); lines.push({ pb: true, items: [], w: 0, size: size0 }); start(); }
              else if (t.k === 'img') {
                var im = imgs[t.id]; if (!im) { warn.images++; return; }
                var iw = t.cx || im.width * 0.75, ih = t.cy || im.height * 0.75, k = Math.min(1, (width - left) / iw, (PH - M.t - M.b - 10) / ih);
                end(); lines.push({ img: im, w: iw * k, h: ih * k, items: [], size: 0 }); start();
              }
            });
            if (line && (line.items.length || !lines.length)) end();
            return lines;
          }
          function lineH(l, P) { if (l.img) return l.h + 4; return P.exact ? P.exact : l.size * 1.2 * P.mult; }
          function drawLines(pg, lines, P, x0, ytop, width, left, mk) {
            var yy = ytop;
            lines.forEach(function (l, li) {
              var h = lineH(l, P);
              if (l.img) { pg.drawImage(l.img, { x: x0 + left + (P.jc === 'center' ? (width - left - l.w) / 2 : P.jc === 'right' || P.jc === 'end' ? width - left - l.w : 0), y: yy - l.h, width: l.w, height: l.h }); yy -= h; return; }
              var off = li === 0 && !mk ? P.first - P.hang : 0, room = width - left - off;
              var shift = P.jc === 'center' ? Math.max(0, (room - l.w) / 2) : (P.jc === 'right' || P.jc === 'end') ? Math.max(0, room - l.w) : 0;
              var base = yy - Math.max(l.size * 0.95, h - l.size * 0.25);
              if (li === 0 && mk) { var mf = fonts.get(P.base.fam, false, false); pg.drawText(fonts.clean(mk.text, mf), { x: x0 + (mk.left != null ? Math.max(0, (mk.left - (mk.hang || 0)) / 20) : Math.max(0, left - 18)), y: base, size: l.size, font: mf, color: L.rgb(0, 0, 0) }); }
              l.items.forEach(function (it) { if (it.text) pg.drawText(it.text, { x: x0 + left + off + shift + it.x, y: base, size: it.size, font: it.font, color: it.color }); });
              yy -= h;
            });
            return yy;
          }
          /* ----- block emitters ----- */
          function emitPara(p, x0, width, inCell) {
            var P = paraInfo(p), mk = marker(P), toks = collect(p, P.base, []);
            if (mk) { var ml = mk.left != null ? mk.left / 20 : 36; P.left = Math.max(P.left, ml); }
            var lines = layout(toks, P, width, mk), before = P.before / 20, after = P.after / 20;
            if (P.pb && !inCell) newPage();
            if (!inCell) { if (!lines.length || (lines.length === 1 && !lines[0].items.length && !lines[0].img)) { ensure(P.base.sz / 2 * 1.2); y -= P.base.sz / 2 * 1.2 * P.mult + after; return; } y -= (page && y < PH - M.t - 1 ? before : 0); }
            var idx = 0, first = true;
            while (idx < lines.length) {
              if (lines[idx].pb) { newPage(); idx++; continue; }
              var h = lineH(lines[idx], P); ensure(h);
              // draw as many lines as fit on this page, then continue on the next
              var take = [], used = 0; while (idx < lines.length && !lines[idx].pb && y - used - lineH(lines[idx], P) >= M.b - 0.01) { take.push(lines[idx]); used += lineH(lines[idx], P); idx++; }
              if (!take.length) { take.push(lines[idx]); used = h; idx++; }
              drawLines(page, take, P, x0, y, width, P.left, first ? mk : null); first = false; y -= used;
            }
            y -= after;
          }
          function cellParas(tc) { return kids(tc, 'p'); }
          function emitTable(tbl) {
            warn.tables++;
            var grid = kids(kid(tbl, 'tblGrid'), 'gridCol').map(function (g) { return +g.getAttributeNS(NS.w, 'w') / 20; }), total = grid.reduce(function (a, b) { return a + b; }, 0);
            var rows = kids(tbl, 'tr'); if (!rows.length) return;
            if (!grid.length) { var nc = Math.max.apply(null, rows.map(function (r) { return kids(r, 'tc').length; })); grid = Array(nc).fill(CW / nc); total = CW; }
            var k = total > CW ? CW / total : 1; grid = grid.map(function (g) { return g * k; });
            rows.forEach(function (tr) {
              var cells = kids(tr, 'tc'), col = 0, laid = [], rowH = 0;
              cells.forEach(function (tc) {
                var span = +(wv(kid(tc, 'tcPr'), 'gridSpan') || 1), w = 0; for (var s = 0; s < span; s++) w += grid[col + s] || 0;
                var ps = cellParas(tc), blocks = ps.map(function (p) { var P = paraInfo(p), toks = collect(p, P.base, []), mk = marker(P); if (mk) P.left = Math.max(P.left, 14); var ls = layout(toks, P, w - 8, mk); return { P: P, mk: mk, lines: ls, h: ls.reduce(function (a, l) { return a + lineH(l, P); }, 0) + P.after / 40 }; });
                var h = blocks.reduce(function (a, b) { return a + b.h; }, 0) + 6; laid.push({ x: grid.slice(0, col).reduce(function (a, b) { return a + b; }, 0), w: w, blocks: blocks, h: h }); rowH = Math.max(rowH, h, 14); col += span;
              });
              ensure(Math.min(rowH, PH - M.t - M.b)); var top = y;
              laid.forEach(function (c) {
                page.drawRectangle({ x: M.l + c.x, y: top - rowH, width: c.w, height: rowH, borderColor: L.rgb(0.55, 0.55, 0.55), borderWidth: 0.5 });
                var yy = top - 3; c.blocks.forEach(function (b) { yy = drawLines(page, b.lines, b.P, M.l + c.x + 4, yy, c.w - 8, b.P.left, b.mk) - b.P.after / 40; });
              });
              y = top - rowH;
            });
            y -= 8;
          }
          /* ----- run ----- */
          var blocks = [].filter.call(body.children, function (c) { return c.localName === 'p' || c.localName === 'tbl' || c.localName === 'sdt'; });
          var flat = []; blocks.forEach(function (b) { if (b.localName === 'sdt') { var sc = kid(b, 'sdtContent'); if (sc) [].forEach.call(sc.children, function (x) { if (x.localName === 'p' || x.localName === 'tbl') flat.push(x); }); } else flat.push(b); });
          newPage(); var chainP = Promise.resolve(), n = flat.length;
          flat.forEach(function (b, i) {
            chainP = chainP.then(function () {
              if (i % 25 === 0) { prog.set(0.15 + 0.8 * i / n, 'Laying out the document (' + Math.round(100 * i / n) + '%)…'); return GM.nextFrame(); }
            }).then(function () { if (b.localName === 'p') emitPara(b, M.l, CW, false); else emitTable(b); });
          });
          return chainP.then(function () {
            doc.setTitle(GM.stem(f.name, 'document')); doc.setCreator('GM Free Tools & Gadgets');
            var lost = fonts.lost(); prog.set(0.97, 'Creating the PDF…');
            return doc.save().then(function (bytes) { return { bytes: bytes, pages: pages.length, lost: lost, warn: warn, blocks: n }; });
          });
        });
      });
    });
  }
  $('#wd-go').addEventListener('click', function () {
    if (!file || busy) return; busy = true; err.textContent = ''; out.hidden = true; var btn = this; btn.disabled = true; prog.set(0.03, 'Opening the document…');
    convert(file, $('#wd-size').value).then(function (r) {
      prog.hide(); var blob = new Blob([r.bytes], { type: 'application/pdf' }), name = GM.stem(file.name, 'document') + '.pdf', notes = [];
      if (r.lost) notes.push(U.fmt(r.lost, 0) + ' character' + (r.lost > 1 ? 's' : '') + ' outside the Latin alphabet could not be drawn and appear as “?”.');
      if (r.warn.images) notes.push(U.fmt(r.warn.images, 0) + ' picture' + (r.warn.images > 1 ? 's' : '') + ' in an unsupported format (not PNG or JPG) ' + (r.warn.images > 1 ? 'were' : 'was') + ' left out.');
      out.hidden = false;
      out.innerHTML = U.grid([U.box('PDF ready', U.fmt(r.pages, 0) + ' page' + (r.pages > 1 ? 's' : ''), '', true), U.box('File size', GM.size(blob.size)), U.box('Tables found', U.fmt(r.warn.tables, 0))]) +
        '<div class="tool-actions"><button type="button" class="btn btn-primary" id="wd-dl">Download PDF</button></div>' + notes.map(function (n) { return '<p class="result-note">' + U.esc(n) + '</p>'; }).join('');
      $('#wd-dl').onclick = function () { U.download(name, blob); }; U.download(name, blob);
    }).catch(function (e) { prog.hide(); err.textContent = 'Could not convert this document: ' + e.message; if (window.console) console.warn(e); })
      .then(function () { busy = false; btn.disabled = false; });
  });
};
