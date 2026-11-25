/* Business calculator lab. The calculations are plain functions (also tested in Node by build/test-calc-lab.mjs). Nothing typed leaves the browser. */
(function (global) {
  'use strict';
  /* Each returns { error } or { rows: [[label, value, kind]], note }. Inputs are numbers; NaN means empty. */
  var has = function (v) { return typeof v === 'number' && !isNaN(v); };
  var bad = function (v) { return !isFinite(v) || v < 0; };
  var any = function (list) { return list.some(function (v) { return has(v) && bad(v); }); };
  var CHECK = 'Use numbers that are zero or more.';
  var math = {
    growth: function (i) {
      if (any([i.old, i.now, i.n])) return { error: CHECK };
      if (!has(i.old) || !has(i.now)) return null;
      var change = i.now - i.old, rows = [['Change', change, 'num']], note = '';
      if (i.old === 0) note = 'The earlier figure is zero, so a percentage change cannot be calculated.';
      else {
        rows.unshift(['Growth', change / i.old * 100, 'pct']);
        if (has(i.n)) { if (!(i.n > 0)) return { error: 'Periods must be more than zero.' }; rows.push(['Compound rate per period', (Math.pow(i.now / i.old, 1 / i.n) - 1) * 100, 'pct']); }
      }
      return { rows: rows, note: note };
    },
    turnover: function (i) {
      if (any([i.cogs, i.open, i.close, i.days])) return { error: CHECK };
      if (!has(i.cogs) || !has(i.open) || !has(i.close)) return null;
      var avg = (i.open + i.close) / 2;
      if (avg === 0) return { error: 'Average stock is zero, so turnover cannot be calculated.' };
      var t = i.cogs / avg, rows = [['Inventory turnover', t, 'times'], ['Average stock', avg, 'num']];
      if (has(i.days) && i.days > 0 && t > 0) rows.push(['Days of stock', i.days / t, 'days']);
      return { rows: rows, note: t === 0 ? 'No goods were sold in this period.' : '' };
    },
    productivity: function (i) {
      if (any([i.out, i.hours, i.people, i.prev])) return { error: CHECK };
      if (!has(i.out) || !has(i.hours)) return null;
      if (i.hours === 0) return { error: 'Hours worked must be more than zero.' };
      if (has(i.people) && (i.people === 0 || i.people % 1 !== 0)) return { error: 'Number of people must be a whole number above zero.' };
      var per = i.out / i.hours, rows = [['Output per hour', per, 'num']];
      if (has(i.people)) rows.push(['Output per person', i.out / i.people, 'num'], ['Hours per person', i.hours / i.people, 'num']);
      if (has(i.prev)) { if (i.prev > 0) rows.push(['Change in output per hour', (per - i.prev) / i.prev * 100, 'pct']); }
      return { rows: rows, note: has(i.prev) && i.prev === 0 ? 'The earlier figure is zero, so a percentage change cannot be calculated.' : '' };
    },
    attendance: function (i) {
      if (any([i.days, i.present, i.leave, i.goal])) return { error: CHECK };
      if (!has(i.days) || !has(i.present)) return null;
      var leave = has(i.leave) ? i.leave : 0;
      if (i.days === 0) return { error: 'Working days must be more than zero.' };
      if (i.present > i.days) return { error: 'Days present cannot be more than working days.' };
      if (i.present + leave > i.days) return { error: 'Days present plus approved leave cannot be more than working days.' };
      if (has(i.goal) && i.goal > 100) return { error: 'The required attendance cannot be more than 100%.' };
      var rows = [['Attendance', i.present / i.days * 100, 'pct']], note = '';
      if (leave > 0 && i.days > leave) rows.push(['Excluding approved leave', i.present / (i.days - leave) * 100, 'pct']);
      rows.push(['Days absent', i.days - i.present, 'num']);
      if (has(i.goal)) {
        var need = Math.ceil(i.goal * i.days / 100 - 1e-9);
        rows.push(['Days needed for ' + i.goal + '%', need, 'num']);
        note = i.present >= need ? 'The requirement is met, based on all working days.' : 'Short by ' + (Math.round((need - i.present) * 100) / 100) + ' day(s), based on all working days.';
      }
      return { rows: rows, note: note };
    }
  };
  /* "1,200,000" -> 1200000. Empty -> NaN. Anything else that is not a number -> -Infinity, which the checks reject. */
  function parse(s) { var t = String(s).replace(/[,\s]/g, ''); if (t === '') return NaN; return /^-?(\d+(\.\d*)?|\.\d+)$/.test(t) ? Number(t) : -Infinity; }
  function format(v, kind) {
    var n = v.toLocaleString('en-US', { maximumFractionDigits: kind === 'days' ? 1 : 2 });
    return kind === 'pct' ? n + '%' : kind === 'times' ? n + ' times' : kind === 'days' ? n + ' days' : n;
  }
  global.GMCalcLab = { math: math, parse: parse, format: format };
  if (typeof document === 'undefined') return;
  var MAP = { growth: { old: 'gr-old', now: 'gr-new', n: 'gr-n' }, turnover: { cogs: 'it-cogs', open: 'it-open', close: 'it-close', days: 'it-days' }, productivity: { out: 'ep-out', hours: 'ep-hours', people: 'ep-people', prev: 'ep-prev' }, attendance: { days: 'at-days', present: 'at-present', leave: 'at-leave', goal: 'at-goal' } };
  [].forEach.call(document.querySelectorAll('form[data-calc]'), function (form) {
    var key = form.getAttribute('data-calc'), out = document.getElementById(key + '-out'), empty = out.innerHTML;
    function run() {
      var input = {}; Object.keys(MAP[key]).forEach(function (k) { input[k] = parse(document.getElementById(MAP[key][k]).value); });
      var r = math[key](input);
      out.textContent = '';
      if (!r) { out.innerHTML = empty; return; }
      var add = function (tag, cls, text, to) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; (to || out).appendChild(e); return e; };
      if (r.error) { add('p', 'bc-error', r.error); return; }
      var dl = add('dl', 'bc-rows');
      r.rows.forEach(function (row, i) { var d = add('div', i === 0 ? 'bc-main' : '', undefined, dl); add('dt', '', row[0], d); add('dd', '', format(row[1], row[2]), d); });
      if (r.note) add('p', 'bc-note', r.note);
    }
    form.addEventListener('input', run);
    form.addEventListener('reset', function () { setTimeout(run, 0); });
    run();
  });
})(typeof window !== 'undefined' ? window : globalThis);
