/* Rate pages: a two-way converter that uses the rate written into the page by the daily update. */
(function () {
  var d = document, meta = d.getElementById('rate-data'), form = d.getElementById('rt-form'); if (!meta || !form) return;
  var rate = parseFloat(meta.getAttribute('data-rate')), code = meta.getAttribute('data-code'), a = d.getElementById('rt-a'), b = d.getElementById('rt-b'), note = d.getElementById('rt-note');
  if (!(rate > 0)) return;
  var nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });
  function fmt(n) { return isFinite(n) ? nf.format(Math.round(n * 10000) / 10000) : ''; }
  function fromA() { var x = parseFloat(String(a.value).replace(/,/g, '')); b.value = isNaN(x) ? '' : fmt(x * rate); }
  function fromB() { var x = parseFloat(String(b.value).replace(/,/g, '')); a.value = isNaN(x) ? '' : fmt(x / rate); }
  a.addEventListener('input', fromA); b.addEventListener('input', fromB); fromA();
  if (note) note.textContent = 'Uses 1 ' + code + ' = ' + nf.format(Math.round(rate * 100) / 100) + ' PKR, the mid-market rate recorded on ' + meta.getAttribute('data-date') + '.';
})();
