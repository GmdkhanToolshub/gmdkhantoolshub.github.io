/* Career readiness checklist: tick off the steps of a job application. Progress is saved only in this browser. */
(function () {
  'use strict';
  var d = document, K = 'gm.career.check.v1', boxes = [].slice.call(d.querySelectorAll('.cr-item input[type=checkbox]'));
  if (!boxes.length) return;
  var saved = {}; try { saved = JSON.parse(localStorage.getItem(K)) || {}; } catch (e) { saved = {}; }
  var bar = d.getElementById('cr-bar'), txt = d.getElementById('cr-txt');
  function paint() { var n = boxes.filter(function (b) { return b.checked; }).length, p = Math.round(n / boxes.length * 100); bar.style.width = p + '%'; bar.parentNode.setAttribute('aria-valuenow', String(p)); txt.textContent = n + ' of ' + boxes.length + ' steps done (' + p + '%)'; }
  boxes.forEach(function (b) {
    b.checked = !!saved[b.id];
    b.addEventListener('change', function () { saved[b.id] = b.checked; if (!b.checked) delete saved[b.id]; try { localStorage.setItem(K, JSON.stringify(saved)); } catch (e) { /* storage blocked */ } paint(); });
  });
  paint();
})();
