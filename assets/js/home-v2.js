/* Home page: live tool demo (salary tax, gold value, percentage), embed code copy and currency switch. Everything runs in the browser; nothing typed is sent anywhere. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) { return 'Rs ' + Math.round(n).toLocaleString('en-IN'); };
  var num = function (v) { var n = parseFloat(String(v).replace(/,/g, '')); return isFinite(n) && n >= 0 ? n : NaN; };
  var demo = $('v2-demo');
  if (demo) {
    var tabs = [].slice.call(demo.querySelectorAll('[role=tab]'));
    var pick = function (t) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1; $(x.getAttribute('aria-controls')).hidden = !on; }); if (t.id === 'v2-t-gold') loadGold(); };
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { pick(t); }); t.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); pick(n); } }); });
    /* Slabs mirror assets/js/tools/pakistan-salary-tax-calculator.js, tax year 2026-27: [upper limit, rate, tax below, band start] */
    var B = [[600000, 0, 0, 0], [1200000, 1, 0, 600000], [2200000, 11, 6000, 1200000], [3200000, 20, 116000, 2200000], [4100000, 25, 316000, 3200000], [5600000, 29, 541000, 4100000], [7000000, 32, 976000, 5600000], [Infinity, 35, 1424000, 7000000]];
    var tax = function (a) { for (var i = 0; i < B.length; i++) if (a <= B[i][0]) return B[i][2] + (a - B[i][3]) * B[i][1] / 100; return 0; };
    var salary = function () { var m = num($('v2-salary').value); if (isNaN(m)) { $('v2-s-main').textContent = '—'; $('v2-s-sub').textContent = 'Enter a monthly salary.'; return; } var t = tax(m * 12); $('v2-s-main').textContent = money(m - t / 12); $('v2-s-sub').textContent = 'Monthly income tax ' + money(t / 12) + ' · yearly ' + money(t) + '. Estimate, tax year 2026-27.'; };
    $('v2-salary').addEventListener('input', salary); salary();
    var rate = null, rateDate = '', asked = false;
    var gold = function () { var w = num($('v2-weight').value), per = $('v2-unit').value === 'tola' ? 1 : 1 / 11.6638; if (rate === null || isNaN(w)) { $('v2-g-main').textContent = '—'; $('v2-g-sub').textContent = rate === null ? 'Loading today’s estimate…' : 'Enter a weight.'; return; } $('v2-g-main').textContent = money(w * per * rate); $('v2-g-sub').textContent = '24K estimate dated ' + rateDate + ', not a jeweller’s quote.'; };
    var loadGold = function () { if (asked) return; asked = true; fetch('./data/gold.json').then(function (r) { return r.json(); }).then(function (j) { var l = j.history[j.history.length - 1]; rate = l.t24; rateDate = l.d; gold(); }).catch(function () { asked = false; $('v2-g-sub').textContent = 'The rate could not be loaded. Open the full tool.'; }); };
    $('v2-weight').addEventListener('input', gold); $('v2-unit').addEventListener('change', gold);
    var pct = function () { var p = num($('v2-pct').value), of = num($('v2-of').value); if (isNaN(p) || isNaN(of)) { $('v2-p-main').textContent = '—'; $('v2-p-sub').textContent = 'Enter both numbers.'; return; } var r = p * of / 100; $('v2-p-main').textContent = r.toLocaleString('en-IN', { maximumFractionDigits: 2 }); $('v2-p-sub').textContent = p + '% of ' + of.toLocaleString('en-IN') + '. Add it: ' + (of + r).toLocaleString('en-IN', { maximumFractionDigits: 2 }) + '.'; };
    $('v2-pct').addEventListener('input', pct); $('v2-of').addEventListener('input', pct); pct();
  }
  var cp = $('v2-copy');
  if (cp) cp.addEventListener('click', function () { var t = $('v2-snippet').textContent, done = function () { cp.textContent = 'Copied'; setTimeout(function () { cp.textContent = 'Copy'; }, 1600); }; if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () { cp.textContent = 'Select and copy'; }); else cp.textContent = 'Select and copy'; });
  var cur = document.querySelector('.v2-cur');
  if (cur) cur.addEventListener('click', function (e) { var b = e.target.closest('button[data-cur]'); if (!b) return; var c = b.getAttribute('data-cur'); cur.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); document.querySelectorAll('[data-usd]').forEach(function (n) { n.textContent = c === 'pkr' ? n.getAttribute('data-pkr') : n.getAttribute('data-usd'); }); });
})();
