/* Page behaviour. All file content is written with textContent, never as HTML. */
(function () {
  'use strict';
  var LIMITS = { mb: 5, rows: 20000, cols: 60 }, SHOW = 300;
  var TYPES = [['repeat', 'Possible repeated rows'], ['missing', 'Missing values'], ['total', 'Totals that do not match'], ['datemix', 'Mixed date styles'], ['textnum', 'Numbers saved as text'], ['spelling', 'Spelling variations'], ['unreadable', 'Unreadable values'], ['header', 'Repeated headings'], ['totalrow', 'Total or note rows'], ['blank', 'Empty rows']];
  var NAME = {}; TYPES.forEach(function (t) { NAME[t[0]] = t[1]; });
  function $(id) { return document.getElementById(id); }
  function el(tag, text, cls) { var e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }
  function option(select, value, text) { var o = el('option', text); o.value = value; select.appendChild(o); }
  var sheets = [], result = null, job = 0;

  function reset() { sheets = []; result = null; $('setup').hidden = true; $('results').hidden = true; $('err').textContent = ''; $('status').textContent = ''; }

  function load(file) {
    if (!file) return;
    reset();
    var mine = ++job, ext = (/\.([a-z0-9]+)$/i.exec(file.name) || ['', ''])[1].toLowerCase();
    if (ext === 'xls') return fail('Old .xls files are not supported. In Excel, use Save As and choose Excel Workbook (.xlsx).');
    if (ext !== 'xlsx' && ext !== 'csv') return fail('Please choose an .xlsx or .csv file.');
    if (!file.size) return fail('That file is empty.');
    if (file.size > LIMITS.mb * 1048576) return fail('That file is over ' + LIMITS.mb + ' MB.');
    $('status').textContent = 'Checking...';
    var reading = ext === 'csv'
      ? file.text().then(function (t) { var rows = SheetCheck.parseCsv(t).filter(function (r) { return r.c.some(function (c) { return c.v.trim() !== ''; }); }); return [{ name: 'CSV file', rows: rows, tooBig: rows.length > LIMITS.rows + 1 || rows.some(function (r) { return r.c.length > LIMITS.cols; }) }]; })
      : file.arrayBuffer().then(function (b) { return readXlsx(b, LIMITS); });
    reading.then(function (list) {
      if (mine !== job) return;
      sheets = list.filter(function (s) { return s.rows.length; });
      if (!sheets.length) throw new Error('No data was found in this file.');
      $('sheet').textContent = '';
      sheets.forEach(function (s, i) { option($('sheet'), i, s.name); });
      var widest = 0;
      sheets.forEach(function (s, i) { if (s.rows.length > sheets[widest].rows.length) widest = i; });
      $('sheet').value = widest;
      run(null);
    }).catch(function (e) { if (mine === job) fail(e.message || 'This file could not be read.'); });
  }
  function fail(message) { $('status').textContent = ''; $('results').hidden = true; $('err').textContent = message; }

  function run(roles) {
    var sheet = sheets[+$('sheet').value];
    $('err').textContent = ''; $('setup').hidden = false;
    try {
      if (sheet.tooBig) throw new Error('This sheet is over ' + LIMITS.rows.toLocaleString('en') + ' rows or ' + LIMITS.cols + ' columns. Check a smaller part of it.');
      result = SheetCheck.analyse(sheet.rows, roles ? { roles: roles } : {});
    } catch (e) { result = null; return fail(e.message); }
    ['qty', 'rate', 'total'].forEach(function (id) {
      var s = $(id); s.textContent = ''; option(s, -1, 'Not in this sheet');
      result.heads.forEach(function (h, i) { option(s, i, h); });
      s.value = result.roles[id];
    });
    render();
  }

  function render() {
    var f = result.findings, counts = {};
    f.forEach(function (x) { counts[x.type] = (counts[x.type] || 0) + 1; });
    $('headline').textContent = f.length ? f.length + (f.length === 1 ? ' item to check' : ' items to check') : 'These checks found nothing to flag';
    $('summary').textContent = 'Headings read from row ' + result.headerRow + '. ' + result.dataRows + ' data rows checked. Totals compared on ' + result.compared + ' rows. One row can have more than one item; a spelling group counts as one item.';
    $('tiles').textContent = ''; $('filter').textContent = '';
    option($('filter'), '', 'All items (' + f.length + ')');
    TYPES.forEach(function (t) {
      var n = counts[t[0]] || 0, tile = el('div', undefined, n ? 'sc-tile found' : 'sc-tile');
      tile.appendChild(el('b', String(n))); tile.appendChild(el('span', t[1])); $('tiles').appendChild(tile);
      if (n) option($('filter'), t[0], t[1] + ' (' + n + ')');
    });
    $('notes').textContent = '';
    result.notes.forEach(function (n) { $('notes').appendChild(el('li', n)); });
    $('listcard').hidden = !f.length;
    drawList();
    $('results').hidden = false;
    $('status').textContent = 'Check finished. ' + $('headline').textContent + '.';
  }

  function drawList() {
    var type = $('filter').value, order = TYPES.map(function (t) { return t[0]; });
    var items = result.findings.filter(function (x) { return !type || x.type === type; })
      .sort(function (a, b) { return order.indexOf(a.type) - order.indexOf(b.type) || a.row - b.row; }); /* repeats, gaps and totals come first */
    $('list').textContent = '';
    items.slice(0, SHOW).forEach(function (x) {
      var tr = el('tr');
      [String(x.row), NAME[x.type], x.col, x.value, x.note].forEach(function (v, i) { tr.appendChild(el('td', v, i === 3 ? 'val' : undefined)); });
      $('list').appendChild(tr);
    });
    $('more').textContent = items.length > SHOW ? 'Showing the first ' + SHOW + ' of ' + items.length + '. The CSV download has them all.' : '';
  }

  $('file').addEventListener('change', function () { load(this.files[0]); this.value = ''; });
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (ev) {
    $('drop').addEventListener(ev, function (e) { e.preventDefault(); $('drop').classList.toggle('drag', ev === 'dragenter' || ev === 'dragover'); if (ev === 'drop') load(e.dataTransfer.files[0]); });
  });
  ['dragover', 'drop'].forEach(function (ev) { window.addEventListener(ev, function (e) { e.preventDefault(); }); });
  $('sheet').addEventListener('change', function () { run(null); });
  ['qty', 'rate', 'total'].forEach(function (id) { $(id).addEventListener('change', function () { run({ qty: +$('qty').value, rate: +$('rate').value, total: +$('total').value }); }); });
  $('filter').addEventListener('change', drawList);
  $('download').addEventListener('click', function () {
    var lines = [['Row', 'Problem', 'Column', 'What is written', 'Why it was flagged']].concat(result.findings.map(function (x) { return [x.row, NAME[x.type], x.col, x.value, x.note]; }));
    var blob = new Blob(['﻿' + lines.map(function (l) { return l.map(SheetCheck.csvSafe).join(','); }).join('\r\n')], { type: 'text/csv' });
    var a = el('a'); a.href = URL.createObjectURL(blob); a.download = 'sheet-check-list.csv'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
})();
