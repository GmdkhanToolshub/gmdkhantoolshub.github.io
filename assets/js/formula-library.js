/* Excel formula library: search, category filter and copy buttons. The formulas are in the page itself, so they are readable without JavaScript. */
(function () {
  'use strict';
  var q = document.getElementById('fx-q');
  if (!q) return;
  var cards = [].slice.call(document.querySelectorAll('.fx-card')), groups = [].slice.call(document.querySelectorAll('.fx-group')), chips = [].slice.call(document.querySelectorAll('.fx-chip')), cat = '';
  var text = cards.map(function (c) { return c.textContent.toLowerCase(); });
  function apply() {
    var words = q.value.toLowerCase().split(/\s+/).filter(Boolean), n = 0;
    cards.forEach(function (c, i) {
      var show = (!cat || c.getAttribute('data-cat') === cat) && words.every(function (w) { return text[i].indexOf(w) >= 0; });
      c.hidden = !show; if (show) n++;
    });
    groups.forEach(function (g) { g.hidden = !g.querySelector('.fx-card:not([hidden])'); });
    document.getElementById('fx-none').hidden = n > 0;
    document.getElementById('fx-count').textContent = n + (n === 1 ? ' formula' : ' formulas');
  }
  q.addEventListener('input', apply);
  chips.forEach(function (b) { b.addEventListener('click', function () { cat = b.getAttribute('data-cat'); chips.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); apply(); }); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.fx-copy'); if (!b) return;
    var value = b.getAttribute('data-copy'), done = function (label) { b.textContent = label; setTimeout(function () { b.textContent = 'Copy'; }, 1800); };
    var select = function () { var r = document.createRange(); r.selectNodeContents(b.parentNode.querySelector('code')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); done('Press Ctrl+C'); };
    if (navigator.clipboard) navigator.clipboard.writeText(value).then(function () { done('Copied'); if (window.GM_track) window.GM_track('formula_copy', { formula: b.closest('.fx-card').id }); }, select); else select();
  });
  if (location.hash && document.getElementById(location.hash.slice(1))) document.getElementById(location.hash.slice(1)).scrollIntoView();
})();
