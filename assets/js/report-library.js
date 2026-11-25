/* Report library: show one kind of item. All items are in the page, so it works without JavaScript too. */
(function () {
  'use strict';
  var chips = [].slice.call(document.querySelectorAll('.rl-chip'));
  if (!chips.length) return;
  var cards = [].slice.call(document.querySelectorAll('.rl-card')), areas = [].slice.call(document.querySelectorAll('.rl-area'));
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var type = chip.getAttribute('data-type'), n = 0;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      cards.forEach(function (card) { var show = !type || card.getAttribute('data-type') === type; card.hidden = !show; if (show) n++; });
      areas.forEach(function (a) { a.hidden = !a.querySelector('.rl-card:not([hidden])'); });
      document.getElementById('rl-count').textContent = n + (n === 1 ? ' item' : ' items');
    });
  });
})();
