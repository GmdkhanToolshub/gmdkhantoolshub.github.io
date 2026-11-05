/* Minimal dependency-free PDF writer (Helvetica / Helvetica-Bold, WinAnsi text).
   Used by resume builder, cover letter, report and minutes tools. */
(function (global) {
  'use strict';
  var W = { h: [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,761,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500], b: [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,761,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556] };
  var MAP = { 8364:128, 8218:130, 8222:132, 8230:133, 8216:145, 8217:146, 8220:147, 8221:148, 8226:149, 8211:150, 8212:151, 8482:153 };

  function enc(str) {
    var out = '';
    str = String(str == null ? '' : str).replace(/\t/g, '    ');
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i), code;
      if (c >= 32 && c <= 126) code = c;
      else if (c >= 160 && c <= 255) code = c;
      else if (MAP[c]) code = MAP[c];
      else code = 63; // '?'
      out += String.fromCharCode(code);
    }
    return out;
  }
  function esc(s) {
    var o = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c === 40 || c === 41 || c === 92) o += '\\' + s[i];
      else if (c > 126) o += '\\' + ('00' + c.toString(8)).slice(-3);
      else o += s[i];
    }
    return o;
  }
  function width(s, size, bold) {
    var t = bold ? W.b : W.h, w = 0;
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i) - 32; w += (t[c] || 0); }
    return w * size / 1000;
  }
  function wrap(text, maxW, size, bold) {
    var lines = [], paras = enc(text).split('\n');
    paras.forEach(function (p) {
      if (p.trim() === '') { lines.push(''); return; }
      var words = p.split(' '), line = '';
      words.forEach(function (wd) {
        var test = line ? line + ' ' + wd : wd;
        if (width(test, size, bold) <= maxW) { line = test; return; }
        if (line) lines.push(line);
        // break very long words
        while (width(wd, size, bold) > maxW) {
          var cut = wd.length;
          while (cut > 1 && width(wd.slice(0, cut), size, bold) > maxW) cut--;
          lines.push(wd.slice(0, cut)); wd = wd.slice(cut);
        }
        line = wd;
      });
      lines.push(line);
    });
    return lines;
  }
  function rgb(c) { c = c || [0, 0, 0]; return c.map(function (v) { return (v / 255).toFixed(3); }).join(' '); }
  function hex2rgb(h) {
    h = String(h || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return [47, 107, 255];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function PDF(opts) {
    opts = opts || {};
    this.pw = 595.28; this.ph = 841.89;       // A4 in points
    this.m = opts.margin || 54;
    this.base = opts.size || 10.5;
    this.lh = opts.lineHeight || 1.38;
    this.title = opts.title || 'Document';
    this.pages = []; this.cur = null; this.y = 0;
    this._newPage();
  }
  PDF.hex2rgb = hex2rgb;
  PDF.prototype._newPage = function () {
    this.cur = []; this.pages.push(this.cur); this.y = this.ph - this.m;
  };
  PDF.prototype._need = function (h) { if (this.y - h < this.m) this._newPage(); };
  PDF.prototype.space = function (n) { this.y -= n; if (this.y < this.m) this._newPage(); return this; };
  PDF.prototype._line = function (txt, x, size, bold, color) {
    this.cur.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' + rgb(color) + ' rg ' + x.toFixed(2) + ' ' + this.y.toFixed(2) + ' Td (' + esc(txt) + ') Tj ET');
  };
  PDF.prototype.text = function (text, o) {
    o = o || {};
    var size = o.size || this.base, bold = !!o.bold, indent = o.indent || 0;
    var maxW = this.pw - this.m * 2 - indent, lh = size * this.lh;
    var lines = wrap(text, maxW, size, bold), self = this;
    lines.forEach(function (ln) {
      self._need(lh); self.y -= size;
      var x = self.m + indent;
      if (o.align === 'center') x = (self.pw - width(ln, size, bold)) / 2;
      else if (o.align === 'right') x = self.pw - self.m - width(ln, size, bold);
      if (ln) self._line(ln, x, size, bold, o.color);
      self.y -= (lh - size);
    });
    if (o.after) this.space(o.after);
    return this;
  };
  PDF.prototype.heading = function (text, o) {
    o = o || {};
    this.space(o.before == null ? 10 : o.before);
    this._need(30);
    this.text(String(text).toUpperCase(), { size: o.size || 10, bold: true, color: o.color || [47, 107, 255] });
    this.rule(o.color || [47, 107, 255], 1.2);
    this.space(5);
    return this;
  };
  PDF.prototype.rule = function (color, wd) {
    this._need(6);
    this.y -= 2;
    this.cur.push(rgb(color || [200, 200, 200]) + ' RG ' + (wd || 0.6) + ' w ' + this.m + ' ' + this.y.toFixed(2) + ' m ' + (this.pw - this.m) + ' ' + this.y.toFixed(2) + ' l S');
    this.y -= 3;
    return this;
  };
  PDF.prototype.bullets = function (items, o) {
    o = o || {};
    var size = o.size || this.base, self = this, ind = (o.indent || 0) + 12;
    (items || []).forEach(function (it) {
      if (!String(it).trim()) return;
      var lines = wrap(it, self.pw - self.m * 2 - ind, size, false), lh = size * self.lh;
      lines.forEach(function (ln, i) {
        self._need(lh); self.y -= size;
        if (i === 0) self._line(String.fromCharCode(149), self.m + (o.indent || 0) + 2, size, false, o.color);
        if (ln) self._line(ln, self.m + ind, size, false, o.color);
        self.y -= (lh - size);
      });
    });
    return this;
  };
  PDF.prototype.pair = function (left, right, o) {
    o = o || {};
    var size = o.size || this.base, lh = size * this.lh;
    this._need(lh); this.y -= size;
    this._line(enc(left), this.m, size, true, o.color);
    var r = enc(right || '');
    if (r) this._line(r, this.pw - this.m - width(r, size, false), size, false, [90, 90, 90]);
    this.y -= (lh - size);
    return this;
  };
  PDF.prototype.table = function (headers, rows, widths, o) {
    o = o || {};
    var size = o.size || this.base - 0.5, pad = 4, self = this;
    var total = this.pw - this.m * 2, sum = widths.reduce(function (a, b) { return a + b; }, 0);
    var cw = widths.map(function (w) { return w / sum * total; });
    function drawRow(cells, bold, fill) {
      var cl = cells.map(function (c, i) { return wrap(c, cw[i] - pad * 2, size, bold); });
      var n = Math.max.apply(null, cl.map(function (l) { return l.length; })), lh = size * self.lh, h = n * lh + pad * 2;
      self._need(h);
      var top = self.y;
      if (fill) self.cur.push(rgb(fill) + ' rg ' + self.m + ' ' + (top - h).toFixed(2) + ' ' + total.toFixed(2) + ' ' + h.toFixed(2) + ' re f');
      var x = self.m;
      cl.forEach(function (lines, i) {
        lines.forEach(function (ln, j) {
          if (!ln) return;
          self.cur.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf 0.1 0.1 0.1 rg ' + (x + pad).toFixed(2) + ' ' + (top - pad - size - j * lh).toFixed(2) + ' Td (' + esc(ln) + ') Tj ET');
        });
        x += cw[i];
      });
      self.cur.push('0.8 0.8 0.8 RG 0.5 w ' + self.m + ' ' + (top - h).toFixed(2) + ' m ' + (self.m + total).toFixed(2) + ' ' + (top - h).toFixed(2) + ' l S');
      self.y = top - h;
    }
    if (headers) drawRow(headers, true, [235, 240, 252]);
    rows.forEach(function (r) { drawRow(r, false, null); });
    this.space(6);
    return this;
  };
  PDF.prototype.build = function () {
    var objs = [], self = this, n = this.pages.length;
    // 1 catalog, 2 pages, 3 F1, 4 F2, then per page: content, page
    objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    var kids = [];
    for (var i = 0; i < n; i++) kids.push((7 + i * 2) + ' 0 R');
    objs[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>';
    objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    objs[5] = '<< /Title (' + esc(enc(this.title)) + ') /Producer (Niazi Tools) >>';
    this.pages.forEach(function (ops, i) {
      var stream = ops.join('\n');
      objs[5 + i * 2 + 1] = '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream';
      objs[5 + i * 2 + 2] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + self.pw + ' ' + self.ph + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + (5 + i * 2 + 1) + ' 0 R >>';
    });
    var out = '%PDF-1.4\n%âãÏÓ\n', offs = [];
    var total = objs.length - 1;
    for (var k = 1; k <= total; k++) {
      offs[k] = out.length;
      out += k + ' 0 obj\n' + objs[k] + '\nendobj\n';
    }
    var xref = out.length;
    out += 'xref\n0 ' + (total + 1) + '\n0000000000 65535 f \n';
    for (var j = 1; j <= total; j++) out += ('0000000000' + offs[j]).slice(-10) + ' 00000 n \n';
    out += 'trailer\n<< /Size ' + (total + 1) + ' /Root 1 0 R /Info 5 0 R >>\nstartxref\n' + xref + '\n%EOF';
    var bytes = new Uint8Array(out.length);
    for (var b = 0; b < out.length; b++) bytes[b] = out.charCodeAt(b) & 255;
    return bytes;
  };
  PDF.prototype.toBlob = function () { return new Blob([this.build()], { type: 'application/pdf' }); };

  global.NiaziPDF = PDF;
})(typeof window !== 'undefined' ? window : globalThis);
