/* Smart Spreadsheet Checker rules. Fixed rules, no AI. No network, no storage.
   A sheet is [{n: spreadsheetRowNumber, c: [{v: 'text', t: 'text'|'num'|'date'|'nores'}]}]. */
(function (g) {
  'use strict';
  var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  var EMPTY = { v: '', t: 'text' };

  function cell(row, i) { return row.c[i] || EMPTY; }
  function blank(x) { return String(x.v).trim() === '' && x.t !== 'nores'; }
  function tidy(s) { return String(s).trim().replace(/\s+/g, ' '); }
  function key(s) { return String(s).toLowerCase().replace(/[^\p{L}\p{M}\p{N}.]+/gu, '').replace(/\.(?!\d)/g, ''); }

  /** Returns a number, or null when the text is not clearly a number. */
  function parseNumber(s) {
    var t = String(s).trim(), neg = false;
    if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1); }
    t = t.replace(/^(rs\.?|pkr|usd|aed|sar|gbp|eur|[$£€₨])\s*/i, '').replace(/\s*(\/-|pcs|pc|units|rs\.?|pkr)$/i, '').replace(/\s*\/-$/, '').trim();
    if (!/^[-+]?(\d+|\d{1,3}(,\d{3})+|\d{1,2}(,\d{2})*,\d{3})(\.\d+)?$/.test(t)) return null;
    var n = Number(t.replace(/,/g, ''));
    return isFinite(n) ? (neg ? -n : n) : null;
  }

  function validDate(y, m, d) { if (y < 100) y += 2000; var x = new Date(Date.UTC(y, m - 1, d)); return x.getUTCMonth() === m - 1 && x.getUTCDate() === d; }

  /** Describes how a date is written: {style, ambiguous} or null when it cannot be read. */
  function dateStyle(x) {
    if (x.t === 'date') return { style: 'Excel date', ambiguous: false };
    var s = tidy(x.v), m;
    if ((m = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/.exec(s))) return validDate(+m[1], +m[2], +m[3]) ? { style: 'year first', ambiguous: false } : null;
    if ((m = /^(\d{1,2})([-\/.])(\d{1,2})\2(\d{2}|\d{4})$/.exec(s))) {
      var a = +m[1], b = +m[3], y = +m[4], dm = validDate(y, b, a), md = validDate(y, a, b);
      if (!dm && !md) return null;
      return { style: 'numbers with "' + m[2] + '", ' + m[4].length + '-digit year' + (dm && !md ? ' (day first)' : md && !dm ? ' (month first)' : ''),
        shape: 'numbers with "' + m[2] + '", ' + m[4].length + '-digit year', order: dm && !md ? 'dmy' : md && !dm ? 'mdy' : '', ambiguous: dm && md && a !== b };
    }
    if ((m = /^(\d{1,2})[ \-\/]([A-Za-z]{3,9})[ \-\/,]+(\d{2}|\d{4})$/.exec(s))) { var mm = MONTHS[m[2].slice(0, 3).toLowerCase()]; return mm && validDate(+m[3], mm, +m[1]) ? { style: 'day, month name, year', ambiguous: false } : null; }
    if ((m = /^([A-Za-z]{3,9}) (\d{1,2}),? (\d{4})$/.exec(s))) { var mn = MONTHS[m[1].slice(0, 3).toLowerCase()]; return mn && validDate(+m[3], mn, +m[2]) ? { style: 'month name first', ambiguous: false } : null; }
    return null;
  }

  function findHeader(rows) {
    var best = -1, bestCount = 1;
    for (var i = 0; i < Math.min(rows.length, 15); i++) {
      var k = rows[i].c.filter(function (x) { return x && x.t === 'text' && !blank(x) && parseNumber(x.v) === null; }).length;
      if (k > bestCount) { best = i; bestCount = k; }
    }
    return best;
  }

  /** Picks the quantity, rate and total columns from the headings. -1 means not found. */
  function guessRoles(heads) {
    function find(list) {
      for (var p = 0; p < list.length; p++) for (var i = 0; i < heads.length; i++) if (list[p].test(heads[i].toLowerCase())) return i;
      return -1;
    }
    return {
      qty: find([/^(qty|quantity)\.?$/, /\b(qty|quantity)\b/, /^(units|pcs|pieces)$/]),
      rate: find([/^(rate|price|unit price|unit rate)$/, /unit (price|rate|cost)/, /\b(rate|price)\b/]),
      total: find([/^(total|amount|line total)$/, /\bline (total|amount)\b/, /\b(total|amount)\b/])
    };
  }

  function analyse(rows, options) {
    options = options || {};
    var findings = [], notes = [];
    function add(type, row, col, value, note) { findings.push({ type: type, row: row, col: col, value: value, note: note }); }
    var h = findHeader(rows);
    if (h < 0) throw new Error('No heading row was found. Put column names in one row above the data, then try again.');
    var width = rows.reduce(function (w, r) { return Math.max(w, r.c.length); }, 0);
    var heads = [], i;
    for (i = 0; i < width; i++) heads.push(tidy(cell(rows[h], i).v) || 'Column ' + (i + 1));
    var headKey = heads.map(key).join('|');
    var roles = options.roles || guessRoles(heads);

    var body = [];
    var after = rows.slice(h + 1);
    var last = after.length - 1;
    while (last >= 0 && after[last].c.every(function (x) { return !x || blank(x); })) last--;
    var previous = rows[h].n;
    after.slice(0, last + 1).forEach(function (r) {
      for (var gap = previous + 1; gap < r.n; gap++) add('blank', gap, '', '', 'Empty row inside the data.');
      previous = r.n;
      var filled = [];
      for (var c = 0; c < width; c++) if (!blank(cell(r, c))) filled.push(c);
      if (!filled.length) { add('blank', r.n, '', '', 'Empty row inside the data.'); return; }
      var same = 0;
      filled.forEach(function (c) { if (cell(rows[h], c).v && key(cell(r, c).v) === key(heads[c])) same++; });
      if (heads.map(function (_, c) { return key(cell(r, c).v || 'Column ' + (c + 1)); }).join('|') === headKey || (same >= 3 && same === filled.length)) { add('header', r.n, '', '', 'The headings appear again inside the data.'); return; }
      var label = filled.some(function (c) { return /^(grand |sub ?)?totals?\b/i.test(tidy(cell(r, c).v)); });
      if (label && filled.length <= Math.max(2, Math.floor(width / 2))) { add('totalrow', r.n, '', filled.map(function (c) { return cell(r, c).v; }).join(' | '), 'Looks like a total or note row mixed into the data.'); return; }
      body.push(r);
    });

    var seen = new Map();
    body.forEach(function (r) {
      var sig = JSON.stringify(heads.map(function (_, c) { var x = cell(r, c), n = x.t === 'date' ? null : parseNumber(x.v); return n !== null ? n : tidy(x.v).toLowerCase(); }));
      if (width > 1 && seen.has(sig)) add('repeat', r.n, '', '', 'All values match row ' + seen.get(sig) + ' (ignoring capitals, extra spaces and number style). Check whether it is a second real entry.');
      else seen.set(sig, r.n);
    });

    var formulas = 0;
    heads.forEach(function (name, c) {
      var cells = body.map(function (r) { return { r: r.n, x: cell(r, c) }; });
      var filled = cells.filter(function (o) { return !blank(o.x); });
      cells.forEach(function (o) { if (o.x.t === 'nores') formulas++; });
      if (!filled.length) return;
      if (filled.length >= cells.length * 0.8) cells.forEach(function (o) { if (blank(o.x)) add('missing', o.r, name, '', 'Empty in a column that is usually filled.'); });
      var usable = filled.filter(function (o) { return o.x.t !== 'nores'; });
      if (!usable.length) return;
      var chosen = c === roles.qty || c === roles.rate || c === roles.total;
      var idLike = /\b(id|no|number|code|phone|mobile|contact|cnic|account|sku|barcode|zip|postal)\b|#/i.test(name);

      var styled = usable.map(function (o) { return { o: o, d: dateStyle(o.x) }; });
      var readable = styled.filter(function (s) { return s.d; });
      var dateColumn = !chosen && (readable.length >= usable.length * 0.7 || (/\bdate\b/i.test(name) && readable.length >= usable.length * 0.4));
      if (dateColumn) {
        var count = {};
        readable.forEach(function (s) { var k = s.d.shape || s.d.style; count[k] = (count[k] || 0) + 1; });
        var kinds = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; });
        var base = count['Excel date'] ? 'Excel date' : kinds[0]; /* real dates are never the ones flagged */
        if (kinds.length > 1) readable.forEach(function (s) {
          var k = s.d.shape || s.d.style;
          if (k !== base) add('datemix', s.o.r, name, s.o.x.v, base === 'Excel date' ? 'Typed as text (' + k + '), while other cells hold real Excel dates.' : 'Written as ' + k + '; the most common style here is ' + base + '.');
        });
        var orders = {};
        readable.forEach(function (s) { if (s.d.order) orders[s.d.order] = 1; });
        if (orders.dmy && orders.mdy) notes.push('"' + name + '" has dates that can only be day-first and others that can only be month-first.');
        var unclear = readable.filter(function (s) { return s.d.ambiguous; }).length;
        if (unclear) notes.push(unclear + ' text date(s) in "' + name + '" could be day-first or month-first, for example 04/10. Check which was meant.');
        styled.forEach(function (s) { if (!s.d) add('unreadable', s.o.r, name, s.o.x.v, 'Could not be read as a date.'); });
        return;
      }

      var numeric = usable.filter(function (o) { return o.x.t !== 'date' && parseNumber(o.x.v) !== null; });
      var leadingZero = usable.some(function (o) { return /^\s*0\d/.test(o.x.v); });
      if (chosen || (!idLike && !leadingZero && numeric.length >= usable.length * 0.7)) {
        usable.forEach(function (o) {
          if (o.x.t === 'num') return;
          if (o.x.t === 'date' || parseNumber(o.x.v) === null) add('unreadable', o.r, name, o.x.v, 'Could not be read as a number.');
          else add('textnum', o.r, name, o.x.v, 'A number saved as text. Excel totals may skip it.');
        });
        return;
      }

      var groups = new Map(), distinct = new Set();
      usable.forEach(function (o) {
        if (o.x.t !== 'text') return;
        var k = key(o.x.v); if (!k) return;
        var sorted = tidy(o.x.v).toLowerCase().split(' ');
        var group = sorted.length > 1 ? 'w:' + sorted.map(key).sort().join('|') : 'k:' + k;
        distinct.add(group);
        if (!groups.has(k)) groups.set(k, { forms: new Map(), words: group });
        var f = groups.get(k).forms;
        if (!f.has(o.x.v)) f.set(o.x.v, []);
        f.get(o.x.v).push(o.r);
      });
      if (idLike || distinct.size > usable.length * 0.5) return; /* mostly unique values: names, notes, IDs */
      var merged = new Map(), byWords = new Map();
      groups.forEach(function (g2, k) {
        var target = byWords.has(g2.words) ? byWords.get(g2.words) : k;
        byWords.set(g2.words, target);
        if (!merged.has(target)) merged.set(target, new Map());
        g2.forms.forEach(function (list, form) { merged.get(target).set(form, list); });
      });
      merged.forEach(function (forms) {
        if (forms.size < 2) return;
        var ordered = Array.from(forms.keys()).sort(function (a, b) { return forms.get(b).length - forms.get(a).length; });
        var first = Math.min.apply(null, [].concat.apply([], Array.from(forms.values())));
        add('spelling', first, name, ordered.map(function (f) { return '[' + f + '] x' + forms.get(f).length; }).join(', '), forms.size + ' ways of writing what may be the same thing.');
      });
    });
    if (formulas) notes.push(formulas + ' formula cell(s) have no saved result, so their values were not checked. Open the file in Excel, save it, and try again.');

    var q = roles.qty, p = roles.rate, t = roles.total, compared = 0;
    if (q >= 0 && p >= 0 && t >= 0 && q !== p && p !== t && q !== t) {
      body.forEach(function (r) {
        var v = [q, p, t].map(function (c) { var x = cell(r, c); return x.t === 'date' ? null : parseNumber(x.v); });
        if (v.indexOf(null) >= 0) return;
        compared++;
        var expected = v[0] * v[1];
        if (Math.abs(expected - v[2]) > 0.51) add('total', r.n, heads[t], cell(r, t).v, heads[q] + ' x ' + heads[p] + ' = ' + (Math.round(expected * 100) / 100) + '. A discount, tax or charge may explain the difference.');
      });
    } else notes.push('Totals were not compared. Choose the quantity, rate and total columns to compare them.');

    findings.sort(function (a, b) { return a.row - b.row; });
    return { headerRow: rows[h].n, heads: heads, roles: roles, dataRows: body.length, compared: compared, findings: findings, notes: notes };
  }

  function parseCsv(text) {
    text = text.replace(/^﻿/, '');
    var firstLine = text.slice(0, text.indexOf('\n') < 0 ? text.length : text.indexOf('\n'));
    var delim = [',', ';', '\t'].sort(function (a, b) { return firstLine.split(b).length - firstLine.split(a).length; })[0];
    var rows = [], row = [], cur = '', quoted = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (quoted) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else quoted = false; } else cur += ch; }
      else if (ch === '"' && cur === '') quoted = true;
      else if (ch === delim) { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    /* CSV has no cell types: plain digits count as numbers, formatted ones as text. */
    return rows.map(function (r, n) { return { n: n + 1, c: r.map(function (v) { return { v: v, t: /^\s*-?(0|[1-9]\d*)(\.\d+)?\s*$/.test(v) ? 'num' : 'text' }; }) }; });
  }

  /** Quotes a value for CSV and stops spreadsheet programs treating file content as a formula. */
  function csvSafe(v) { var s = String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }

  var api = { analyse: analyse, parseCsv: parseCsv, parseNumber: parseNumber, dateStyle: dateStyle, csvSafe: csvSafe, guessRoles: guessRoles };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else g.SheetCheck = api;
})(typeof window !== 'undefined' ? window : globalThis);
