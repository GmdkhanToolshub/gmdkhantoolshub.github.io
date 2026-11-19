/* Gold rate pages: value of your gold using the estimated rate written into the page by the daily update. */
(function () {
  var d = document, meta = d.getElementById('gold-data'), form = d.getElementById('gd-form'); if (!meta || !form) return;
  var tola = parseFloat(meta.getAttribute('data-tola')), karat = meta.getAttribute('data-karat'); if (!(tola > 0)) return;
  var w = d.getElementById('gd-w'), u = d.getElementById('gd-u'), out = d.getElementById('gd-out'), note = d.getElementById('gd-note');
  var UNIT = { tola: 1, masha: 1 / 12, ratti: 1 / 96, gram: 1 / 11.6638 };
  var inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  function run() {
    var x = parseFloat(String(w.value).replace(/,/g, ''));
    if (isNaN(x) || x < 0) { out.textContent = 'Enter a weight'; return; }
    out.textContent = 'Rs ' + inr.format(Math.round(x * UNIT[u.value] * tola));
  }
  w.addEventListener('input', run); u.addEventListener('change', run); run();
  if (note) note.textContent = 'Uses the estimated ' + karat + ' karat price of Rs ' + inr.format(Math.round(tola)) + ' per tola recorded on ' + meta.getAttribute('data-date') + '. Making charges, wastage and a jeweller\'s own rate are not included.';
})();
