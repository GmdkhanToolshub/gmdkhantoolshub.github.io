/* Reads visible sheets of an .xlsx file in the browser, using the site's GM.unzip. Nothing is sent anywhere. */
(function (g) {
  'use strict';
  var MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  var REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  function kids(el, n) { var r = []; for (var c = el && el.firstElementChild; c; c = c.nextElementSibling) if (c.localName === n) r.push(c); return r; }
  function colIndex(ref) { var m = /^([A-Z]+)/.exec(ref), n = 0; if (!m) return 0; for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64); return n - 1; }
  function isDateFormat(id, code) {
    if ((id >= 14 && id <= 17) || id === 22) return true;
    if (!code) return false;
    var s = code.replace(/"[^"]*"/g, '').replace(/\[[^\]]*\]/g, '').replace(/\\./g, '');
    return /[yd]/i.test(s) && !/general/i.test(s);
  }
  g.readXlsx = function (buf, limits) {
    var z = g.GM.unzip(buf);
    if (!z.has('xl/workbook.xml')) return Promise.reject(new Error('This does not look like an Excel (.xlsx) workbook.'));
    return Promise.all(['xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/sharedStrings.xml', 'xl/styles.xml'].map(z.text)).then(function (r) {
      var wb = g.GM.parseXml(r[0], 'workbook'), rels = {}, sst = [], fmts = {}, xfs = [];
      var date1904 = [].some.call(wb.getElementsByTagNameNS(MAIN, 'workbookPr'), function (e) { return /^(1|true)$/.test(e.getAttribute('date1904') || ''); });
      [].forEach.call(g.GM.parseXml(r[1], 'relationships').documentElement.children, function (e) { rels[e.getAttribute('Id')] = e.getAttribute('Target'); });
      if (r[2]) kids(g.GM.parseXml(r[2], 'strings').documentElement, 'si').forEach(function (si) { var s = ''; [].forEach.call(si.getElementsByTagNameNS(MAIN, 't'), function (t) { if (t.parentNode.localName !== 'rPh') s += t.textContent; }); sst.push(s); });
      if (r[3]) {
        var sd = g.GM.parseXml(r[3], 'styles');
        [].forEach.call(sd.getElementsByTagNameNS(MAIN, 'numFmt'), function (n) { fmts[n.getAttribute('numFmtId')] = n.getAttribute('formatCode'); });
        var cx = sd.getElementsByTagNameNS(MAIN, 'cellXfs')[0];
        if (cx) kids(cx, 'xf').forEach(function (x) { xfs.push(+(x.getAttribute('numFmtId') || 0)); });
      }
      var sheets = kids(kids(wb.documentElement, 'sheets')[0], 'sheet').filter(function (s) { return !/hidden/i.test(s.getAttribute('state') || ''); });
      return sheets.reduce(function (p, sh) {
        return p.then(function (list) {
          var target = rels[sh.getAttributeNS(REL, 'id')];
          if (!target) return list;
          return z.text(target.charAt(0) === '/' ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '')).then(function (xml) {
            if (!xml) return list;
            var d = g.GM.parseXml(xml, 'sheet'), rows = [], tooBig = false, number = 0;
            [].some.call(d.getElementsByTagNameNS(MAIN, 'row'), function (row) {
              number = +(row.getAttribute('r') || number + 1);
              var cells = [], next = 0, has = false;
              kids(row, 'c').forEach(function (c) {
                var ci = c.getAttribute('r') ? colIndex(c.getAttribute('r')) : next; next = ci + 1;
                var type = c.getAttribute('t'), vEl = kids(c, 'v')[0], v = vEl ? vEl.textContent : '', out = { v: '', t: 'text' };
                if (type === 's') out.v = sst[+v] || '';
                else if (type === 'inlineStr') out.v = [].map.call(c.getElementsByTagNameNS(MAIN, 't'), function (x) { return x.textContent; }).join('');
                else if (type === 'str' || type === 'e') out.v = v;
                else if (type === 'b') out.v = v === '1' ? 'TRUE' : 'FALSE';
                else if (v !== '') {
                  var n = Number(v), id = xfs[+(c.getAttribute('s') || 0)] || 0;
                  if (isDateFormat(id, fmts[id])) {
                    var day = new Date(Math.round((n + (date1904 ? 1462 : 0) - 25569) * 86400000));
                    out = { v: isNaN(day) ? v : day.toISOString().slice(0, 10), t: 'date' };
                  } else out = { v: String(parseFloat(n.toPrecision(15))), t: 'num' };
                }
                if (out.v === '' && type !== 'str' && kids(c, 'f').length) out.t = 'nores'; /* 'str' with no text is a real empty result */
                if (out.v !== '' || out.t === 'nores') { if (ci >= limits.cols) tooBig = true; else { cells[ci] = out; has = true; } }
              });
              if (has) rows.push({ n: number, c: cells });
              if (rows.length > limits.rows + 1) tooBig = true;
              return tooBig;
            });
            list.push({ name: sh.getAttribute('name') || 'Sheet', rows: rows, tooBig: tooBig });
            return list;
          });
        });
      }, Promise.resolve([]));
    });
  };
})(window);
