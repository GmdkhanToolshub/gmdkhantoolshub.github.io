/* Blog page: topic filter and search over the article cards already on the page. Nothing is sent anywhere. */
(function () {
  var tools = document.getElementById('bl-tools');
  if (!tools) return;
  var cards = [].slice.call(document.querySelectorAll('.post-card'));
  var chips = [].slice.call(tools.querySelectorAll('.rl-chip'));
  var box = document.getElementById('bl-q'), count = document.getElementById('bl-count'), none = document.getElementById('bl-none');
  var topic = '';
  var text = cards.map(function (c) { return c.textContent.toLowerCase(); });
  function show() {
    var words = box.value.toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
    cards.forEach(function (c, i) {
      var ok = (!topic || (' ' + c.getAttribute('data-topics') + ' ').indexOf(' ' + topic + ' ') >= 0) &&
        words.every(function (w) { return text[i].indexOf(w) >= 0; });
      c.hidden = !ok;
      if (ok) shown++;
    });
    count.textContent = shown + (shown === 1 ? ' article' : ' articles');
    none.hidden = shown > 0;
  }
  chips.forEach(function (b) {
    b.addEventListener('click', function () {
      topic = b.getAttribute('data-topic');
      chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      show();
    });
  });
  box.addEventListener('input', show);
  tools.hidden = false;
  show();
})();
