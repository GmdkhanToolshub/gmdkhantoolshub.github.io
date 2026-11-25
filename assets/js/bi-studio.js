/* BI Studio self-check: suggests the earliest step with an unticked statement. Answers are not sent or stored. */
(function () {
  'use strict';
  var form = document.getElementById('bi-form');
  if (!form) return;
  var out = document.getElementById('bi-result');
  var boxes = [].slice.call(form.querySelectorAll('input[type=checkbox]'));
  var steps = [].slice.call(document.querySelectorAll('.bi-steps > li[id]'));
  function clear() { out.textContent = ''; steps.forEach(function (s) { s.classList.remove('bi-start'); }); }
  form.addEventListener('submit', function (e) {
    e.preventDefault(); clear();
    var open = boxes.filter(function (b) { return !b.checked; });
    var p = document.createElement('p'); p.className = 'bi-answer';
    if (!open.length) { p.textContent = 'You ticked every statement. Keep testing the report: ask a reader what is unclear, and recheck the totals against the source each period.'; out.appendChild(p); return; }
    /* steps are listed in order, so the first one with a gap is the earliest */
    var first = steps.filter(function (s) { return open.some(function (b) { return b.getAttribute('data-step') === s.id; }); })[0];
    var gaps = open.filter(function (b) { return b.getAttribute('data-step') === first.id; }).length;
    var a = document.createElement('a'); a.href = '#' + first.id; a.textContent = first.getAttribute('data-name');
    p.appendChild(document.createTextNode('Start with ')); p.appendChild(a);
    p.appendChild(document.createTextNode('. It has ' + gaps + (gaps === 1 ? ' open statement' : ' open statements') + ', and ' + open.length + ' of ' + boxes.length + ' are open in total.'));
    out.appendChild(p); first.classList.add('bi-start');
  });
  form.addEventListener('reset', function () { setTimeout(clear, 0); });
})();
