/* GM shared library for document converters and gadgets.
   Everything runs in the browser: ZIP reader/writer (Office files), PDF loading (pdf.js, Apache-2.0),
   drag-and-drop zones, progress bars, and DOCX/XLSX writers. Nothing is uploaded. */
(function (global) {
  'use strict';
  var U = global.NiaziUtil, GM = {};
  var BASE = document.body.getAttribute('data-root') || '../../';
  var cc = String.fromCharCode;
  var RE_BAD_XML = new RegExp('[' + cc(0) + '-' + cc(8) + cc(11) + cc(12) + cc(14) + '-' + cc(31) + cc(0xfffe) + cc(0xffff) + ']', 'g');
  var RE_SPACES = new RegExp('[' + cc(0x2000) + '-' + cc(0x200a) + cc(0x202f) + ']', 'g');
  var RE_ZW = new RegExp('[' + cc(0x200b) + '-' + cc(0x200f) + cc(0x2028) + cc(0x2029) + cc(0xfeff) + ']', 'g');

  /* ---------- small helpers ---------- */
  GM.size = function (n) { return n >= 1048576 ? U.fmt(n / 1048576, 1) + ' MB' : n >= 1024 ? U.fmt(n / 1024, 0) + ' KB' : n + ' B'; };
  GM.stem = function (name, fallback) { return U.slug(String(name || fallback || 'file').replace(/\.[^.]+$/, '')); };
  GM.xml = function (s) {
    return String(s == null ? '' : s).replace(RE_BAD_XML, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  GM.bytesOf = function (blob) { return blob.arrayBuffer().then(function (b) { return new Uint8Array(b); }); };
  GM.ext = function (name) { var m = /\.([a-z0-9]+)$/i.exec(name || ''); return m ? m[1].toLowerCase() : ''; };
  /** Returns an error message, or '' when the file is acceptable. */
  GM.checkFile = function (f, exts, maxMB) {
    if (exts.indexOf(GM.ext(f.name)) < 0) return f.name + ': please choose a ' + exts.map(function (e) { return e.toUpperCase(); }).join(' or ') + ' file.';
    if (f.size > maxMB * 1048576) return f.name + ' is over ' + maxMB + ' MB.';
    if (!f.size) return f.name + ' is empty.';
    return '';
  };
  /** "1-3, 5" -> [1,2,3,5] (1-based). Empty text means every page. */
  GM.parseRanges = function (s, max, unique) {
    var parts = String(s || '').replace(/\s/g, '').split(',').filter(Boolean), out = [], seen = {};
    if (!parts.length) { for (var i = 1; i <= max; i++) out.push(i); return out; }
    parts.forEach(function (p) {
      var m = p.match(/^(\d+)(?:-(\d+))?$/); if (!m) throw new Error('“' + p + '” is not a valid page or range. Use numbers like 2 or 4-7.');
      var a = +m[1], b = m[2] ? +m[2] : a;
      if (a < 1 || b < 1 || a > max || b > max) throw new Error('This PDF has ' + max + ' page' + (max > 1 ? 's' : '') + ', so use page numbers from 1 to ' + max + '.');
      if (a > b) throw new Error('In “' + p + '” the first page must not be higher than the last.');
      for (var k = a; k <= b; k++) { if (unique && seen[k]) continue; seen[k] = 1; out.push(k); }
    });
    return out;
  };
  var loaded = {};
  GM.script = function (src) {
    if (!loaded[src]) loaded[src] = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = BASE + src; s.async = true; s.onload = res;
      s.onerror = function () { delete loaded[src]; rej(new Error('A required library could not be loaded. Please refresh the page.')); };
      document.head.appendChild(s);
    });
    return loaded[src];
  };
  GM.pdflib = function () { return GM.script('assets/vendor/pdf-lib.min.js').then(function () { return global.PDFLib; }); };

  /* ---------- drop zone and progress ---------- */
  GM.drop = function (o) {
    return '<label class="dropzone" id="' + o.id + '-zone" for="' + o.id + '"><b>' + o.label + '</b><span>' + o.hint + '</span>' +
      '<input type="file" id="' + o.id + '" accept="' + o.accept + '"' + (o.multiple ? ' multiple' : '') + ' class="sr-only"></label>';
  };
  GM.wire = function (root, id, onFiles) {
    var z = root.querySelector('#' + id + '-zone'), input = root.querySelector('#' + id);
    ['dragenter', 'dragover'].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); z.classList.add('drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); z.classList.remove('drag'); }); });
    z.addEventListener('drop', function (e) { onFiles([].slice.call(e.dataTransfer.files)); });
    input.addEventListener('change', function () { onFiles([].slice.call(input.files)); input.value = ''; });
  };
  GM.progressHTML = function (id) { return '<div class="gm-prog" id="' + id + '" hidden role="status" aria-live="polite"><div class="gm-prog-bar"><i></i></div><div class="gm-prog-txt"></div></div>'; };
  GM.progress = function (el) {
    return {
      set: function (p, t) { el.hidden = false; el.querySelector('i').style.width = Math.max(2, Math.min(100, Math.round(p * 100))) + '%'; el.querySelector('.gm-prog-txt').textContent = t || ''; },
      hide: function () { el.hidden = true; }
    };
  };
  GM.nextFrame = function () { return new Promise(function (r) { setTimeout(r, 0); }); };

  /* ---------- PDF reading (pdf.js) ---------- */
  GM.pdfjs = function () {
    return GM.script('assets/vendor/pdfjs/pdf.min.js').then(function () {
      var L = global.pdfjsLib; if (!L) throw new Error('The PDF engine could not start. Please refresh the page.');
      L.GlobalWorkerOptions.workerSrc = new URL(BASE + 'assets/vendor/pdfjs/pdf.worker.min.js', location.href).href;
      return L;
    });
  };
  GM.openPdf = function (file, password) {
    return Promise.all([GM.pdfjs(), file.arrayBuffer()]).then(function (r) {
      return r[0].getDocument({ data: new Uint8Array(r[1]), password: password || undefined, isEvalSupported: false }).promise;
    }).catch(function (e) {
      if (e && e.name === 'PasswordException') {
        var err = new Error(e.code === 2 ? 'That password is not correct. Try again.' : 'This PDF is password-protected. Enter its password to continue.'); err.needPassword = true; throw err;
      }
      if (e && (e.name === 'InvalidPDFException' || e.name === 'MissingPDFException')) throw new Error('This file is not a valid PDF, or it is damaged.');
      throw e;
    });
  };
  GM.renderPage = function (pdf, n, scale, type, quality) {
    return pdf.getPage(n).then(function (page) {
      var v1 = page.getViewport({ scale: 1 }), sc = Math.min(scale, 8000 / Math.max(v1.width, v1.height));
      var vp = page.getViewport({ scale: sc }), c = document.createElement('canvas');
      c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
        if (!type) return { canvas: c, w: c.width, h: c.height, pw: v1.width, ph: v1.height };
        return new Promise(function (res, rej) {
          c.toBlob(function (b) { b ? res({ blob: b, canvas: c, w: c.width, h: c.height, pw: v1.width, ph: v1.height }) : rej(new Error('Could not create the image.')); }, type, quality);
        });
      });
    });
  };
  /** Text lines of one page with positions: [{y,size,text,cells:[{x,x1,s}],x0,x1,rtl,table}] top to bottom. */
  GM.pageLines = function (page) {
    return page.getTextContent().then(function (tc) {
      var arr = tc.items.filter(function (it) { return typeof it.str === 'string' && it.str.trim() !== ''; }).map(function (it) {
        var t = it.transform; return { s: it.str, x: t[4], y: t[5], w: it.width || 0, size: Math.hypot(t[2], t[3]) || it.height || 10, rtl: it.dir === 'rtl' };
      });
      arr.sort(function (a, b) { return b.y - a.y || a.x - b.x; });
      var lines = [];
      arr.forEach(function (it) {
        var ln = lines[lines.length - 1];
        if (ln && Math.abs(ln.y - it.y) <= Math.max(2, it.size * 0.45)) ln.items.push(it); else lines.push({ y: it.y, items: [it] });
      });
      return lines.map(function (ln) {
        var rtl = ln.items.filter(function (i) { return i.rtl; }).length > ln.items.length / 2;
        ln.items.sort(function (a, b) { return rtl ? b.x - a.x : a.x - b.x; });
        var cells = [], cur = null, size = 0;
        ln.items.forEach(function (it) {
          size = Math.max(size, it.size);
          var gap = cur ? (rtl ? cur.x - (it.x + it.w) : it.x - cur.x1) : 0;
          if (cur && gap <= it.size * 0.9) {
            var sp = gap > it.size * 0.12 && !/\s$/.test(cur.s) && !/^\s/.test(it.s) ? ' ' : '';
            cur.s += sp + it.s; cur.x = Math.min(cur.x, it.x); cur.x1 = Math.max(cur.x1, it.x + it.w); cur.gaps.push(gap);
          } else { cur = { s: it.s, x: it.x, x1: it.x + it.w, gaps: [] }; cells.push(cur); }
        });
        var x0 = Math.min.apply(null, cells.map(function (c) { return c.x; })), x1 = Math.max.apply(null, cells.map(function (c) { return c.x1; }));
        return { y: ln.y, size: size, cells: cells, text: cells.map(function (c) { return c.s.trim(); }).join(cells.length > 1 ? '\t' : ''), x0: x0, x1: x1, rtl: rtl, table: cells.length > 1 };
      });
    });
  };

  /* ---------- ZIP reading (for .docx and .xlsx) ---------- */
  GM.unzip = function (buf) {
    var dv = new DataView(buf), u8 = new Uint8Array(buf), i = u8.length - 22, entries = {}, total = 0, dec = new TextDecoder();
    while (i >= 0 && dv.getUint32(i, true) !== 0x06054b50) i--;
    if (i < 0) throw new Error('This file is not a valid Office document. Save it as .docx or .xlsx and try again.');
    var count = dv.getUint16(i + 10, true), off = dv.getUint32(i + 16, true);
    for (var k = 0; k < count; k++) {
      if (dv.getUint32(off, true) !== 0x02014b50) throw new Error('The file structure is damaged.');
      var method = dv.getUint16(off + 10, true), cs = dv.getUint32(off + 20, true), us = dv.getUint32(off + 24, true);
      var nl = dv.getUint16(off + 28, true), el = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true), lo = dv.getUint32(off + 42, true);
      entries[dec.decode(u8.subarray(off + 46, off + 46 + nl))] = { method: method, cs: cs, lo: lo };
      total += us; off += 46 + nl + el + cl;
    }
    if (total > 400 * 1048576) throw new Error('This document expands to an unusually large size and was not opened.');
    function bytes(name) {
      var e = entries[name]; if (!e) return Promise.resolve(null);
      var start = e.lo + 30 + dv.getUint16(e.lo + 26, true) + dv.getUint16(e.lo + 28, true), raw = u8.subarray(start, start + e.cs);
      if (e.method === 0) return Promise.resolve(raw);
      if (e.method !== 8) return Promise.reject(new Error('This file uses a compression method that is not supported.'));
      if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('Your browser is too old to open this file type. Please update Chrome, Edge, Firefox or Safari.'));
      return new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function (b) { return new Uint8Array(b); });
    }
    return { names: Object.keys(entries), has: function (n) { return !!entries[n]; }, bytes: bytes, text: function (n) { return bytes(n).then(function (b) { return b ? dec.decode(b) : null; }); } };
  };
  GM.parseXml = function (text, what) {
    var d = new DOMParser().parseFromString(text, 'application/xml');
    if (d.getElementsByTagName('parsererror').length) throw new Error('The ' + (what || 'document') + ' contains unreadable content.');
    return d;
  };

  /* ---------- PDF output text helpers (pdf-lib standard fonts) ---------- */
  GM.pdfFonts = function (doc, L) {
    var S = L.StandardFonts, cache = {}, sets = {}, lost = 0;
    var names = { sans: [S.Helvetica, S.HelveticaBold, S.HelveticaOblique, S.HelveticaBoldOblique], serif: [S.TimesRoman, S.TimesRomanBold, S.TimesRomanItalic, S.TimesRomanBoldItalic], mono: [S.Courier, S.CourierBold, S.CourierOblique, S.CourierBoldOblique] };
    return {
      get: function (fam, bold, italic) {
        var key = fam + (bold ? 'b' : '') + (italic ? 'i' : '');
        if (!cache[key]) { cache[key] = doc.embedStandardFont(names[fam][(bold ? 1 : 0) + (italic ? 2 : 0)]); sets[key] = null; }
        var f = cache[key]; if (!sets[key]) sets[key] = new Set(f.getCharacterSet());
        f._key = key; return f;
      },
      /** Replace characters the standard fonts cannot draw. Counts how many were replaced. */
      clean: function (s, f) {
        var set = sets[f._key], out = '';
        s = String(s).split(String.fromCharCode(160)).join(' ').replace(RE_SPACES, ' ').replace(RE_ZW, '').replace(/	/g, '    ');
        for (var ch of s) { var cp = ch.codePointAt(0); if (cp < 32) continue; if (set.has(cp)) out += ch; else { out += '?'; lost++; } }
        return out;
      },
      lost: function () { return lost; }
    };
  };

  /* ---------- DOCX and XLSX writers ---------- */
  var HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  var REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
  function pack(files, mime) {
    var enc = new TextEncoder();
    return U.zip(files.map(function (f) { return { name: f[0], data: enc.encode(f[1]) }; })).slice(0, undefined, mime);
  }
  /** paras: [{t, style ('Title'|'Heading1'|'Heading2'), bold, rtl, pb}] */
  GM.docx = function (paras) {
    var body = paras.map(function (p) {
      var pr = (p.style ? '<w:pStyle w:val="' + p.style + '"/>' : '') + (p.pb ? '<w:pageBreakBefore/>' : '') + (p.rtl ? '<w:bidi/>' : '');
      var runs = String(p.t).split('\n').map(function (l, i) {
        var rp = (p.bold ? '<w:b/>' : '') + (p.rtl ? '<w:rtl/>' : '');
        var parts = l.split('\t').map(function (seg, j) { return (j ? '<w:r><w:tab/></w:r>' : '') + '<w:r>' + (rp ? '<w:rPr>' + rp + '</w:rPr>' : '') + '<w:t xml:space="preserve">' + GM.xml(seg) + '</w:t></w:r>'; }).join('');
        return (i ? '<w:r><w:br/></w:r>' : '') + parts;
      }).join('');
      return '<w:p>' + (pr ? '<w:pPr>' + pr + '</w:pPr>' : '') + runs + '</w:p>';
    }).join('');
    var W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
    var style = function (id, name, sz, bold, after) { return '<w:style w:type="paragraph" w:styleId="' + id + '"><w:name w:val="' + name + '"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="' + after + '"/></w:pPr><w:rPr>' + (bold ? '<w:b/>' : '') + '<w:sz w:val="' + sz + '"/></w:rPr></w:style>'; };
    var styles = HEAD + '<w:styles ' + W + '><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Arial"/><w:sz w:val="22"/><w:lang w:val="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' + style('Title', 'Title', 40, true, 200) + style('Heading1', 'heading 1', 32, true, 120) + style('Heading2', 'heading 2', 26, true, 80) + '</w:styles>';
    return pack([
      ['[Content_Types].xml', HEAD + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'],
      ['_rels/.rels', HEAD + '<Relationships xmlns="' + REL_NS + '"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
      ['word/_rels/document.xml.rels', HEAD + '<Relationships xmlns="' + REL_NS + '"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['word/styles.xml', styles],
      ['word/document.xml', HEAD + '<w:document ' + W + '><w:body>' + body + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>']
    ], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  };
  function colName(i) { var s = ''; for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + (i - 1) % 26) + s; return s; }
  GM.colName = colName;
  /** sheets: [{name, rows:[[string|number|''...]]}] */
  GM.xlsx = function (sheets) {
    var used = {};
    sheets = sheets.map(function (s, i) {
      var n = String(s.name || 'Sheet' + (i + 1)).replace(/[\[\]:*?\/\\]/g, ' ').trim().slice(0, 31) || 'Sheet' + (i + 1), base = n, k = 2;
      while (used[n.toLowerCase()]) n = base.slice(0, 28) + ' ' + k++;
      used[n.toLowerCase()] = 1; return { name: n, rows: s.rows };
    });
    var files = [], NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
    sheets.forEach(function (s, si) {
      var widths = [];
      var rows = s.rows.map(function (r, ri) {
        var cells = r.map(function (v, ci) {
          if (v === '' || v == null) return '';
          var len = String(v).length; widths[ci] = Math.max(widths[ci] || 8, Math.min(60, len + 2));
          var ref = colName(ci) + (ri + 1);
          return typeof v === 'number' && isFinite(v) ? '<c r="' + ref + '"><v>' + v + '</v></c>' : '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + GM.xml(v) + '</t></is></c>';
        }).join('');
        return '<row r="' + (ri + 1) + '">' + cells + '</row>';
      }).join('');
      var cols = widths.length ? '<cols>' + widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (w || 8) + '" customWidth="1"/>'; }).join('') + '</cols>' : '';
      files.push(['xl/worksheets/sheet' + (si + 1) + '.xml', HEAD + '<worksheet ' + NS + '>' + cols + '<sheetData>' + rows + '</sheetData></worksheet>']);
    });
    var R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    files.unshift(
      ['[Content_Types].xml', HEAD + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets.map(function (s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>'],
      ['_rels/.rels', HEAD + '<Relationships xmlns="' + REL_NS + '"><Relationship Id="rId1" Type="' + R + '/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', HEAD + '<workbook ' + NS + ' xmlns:r="' + R + '"><sheets>' + sheets.map(function (s, i) { return '<sheet name="' + GM.xml(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', HEAD + '<Relationships xmlns="' + REL_NS + '">' + sheets.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="' + R + '/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
        '<Relationship Id="rId' + (sheets.length + 1) + '" Type="' + R + '/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', HEAD + '<styleSheet ' + NS + '><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']
    );
    return pack(files, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  /* ---------- download helpers ---------- */
  /** Make names unique ("a.webp", "a (2).webp") so two files never overwrite each other in a ZIP. Changes items in place. */
  GM.dedupe = function (items) {
    var seen = {};
    items.forEach(function (it) {
      var m = /^(.*?)(\.[^.]*)?$/.exec(it.name), stem = m[1], ext = m[2] || '', n = it.name, k = 2;
      while (seen[n.toLowerCase()]) n = stem + ' (' + k++ + ')' + ext;
      seen[n.toLowerCase()] = 1; it.name = n;
    });
    return items;
  };
  GM.zipBlobs = function (items) { // [{name, blob}] -> Promise<Blob>
    return Promise.all(items.map(function (it) { return GM.bytesOf(it.blob).then(function (b) { return { name: it.name, data: b }; }); })).then(function (files) { return U.zip(files); });
  };

  global.GM = GM;
})(typeof window !== 'undefined' ? window : globalThis);
