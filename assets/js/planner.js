/* Tasks & Planner: a task manager and a daily time-block planner. Data stays in this browser (localStorage); nothing is sent anywhere. */
(function () {
  'use strict';
  var d = document, $ = function (id) { return d.getElementById(id); };
  var TK = 'gm.tasks.v1', PK = 'gm.planner.v1';
  function rd(k, f) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch (e) { return f; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { $('pl-warn').textContent = 'Your browser is blocking storage, so changes will be lost when you close this page.'; return false; } }
  function el(t, c, x) { var n = d.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function today() { var n = new Date(); return n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2); }

  /* ---------- tasks ---------- */
  var tasks = rd(TK, []); if (!Array.isArray(tasks)) tasks = [];
  var filter = 'open';
  function saveT() { wr(TK, tasks); }
  function drawT() {
    var ul = $('tk-list'); ul.textContent = '';
    var order = { high: 0, normal: 1, low: 2 }, t0 = today();
    var list = tasks.filter(function (t) { return filter === 'all' || (filter === 'done' ? t.done : !t.done); }).sort(function (a, b) { return (a.done - b.done) || ((a.due || '9') < (b.due || '9') ? -1 : (a.due || '9') > (b.due || '9') ? 1 : 0) || (order[a.pri] - order[b.pri]); });
    list.forEach(function (t) {
      var li = el('li', 'tk-item' + (t.done ? ' done' : ''));
      var cb = el('input'); cb.type = 'checkbox'; cb.checked = t.done; cb.setAttribute('aria-label', 'Mark "' + t.text + '" as done');
      cb.addEventListener('change', function () { t.done = cb.checked; saveT(); drawT(); });
      var tx = el('span', 'tk-text', t.text), meta = el('span', 'tk-meta');
      meta.textContent = (t.pri !== 'normal' ? t.pri + ' priority' : '') + (t.due ? (t.pri !== 'normal' ? ' · ' : '') + 'due ' + t.due : '');
      if (!t.done && t.due && t.due < t0) { li.classList.add('late'); meta.textContent += ' · overdue'; }
      var del = el('button', 'tk-del', '×'); del.type = 'button'; del.setAttribute('aria-label', 'Delete task "' + t.text + '"');
      del.addEventListener('click', function () { tasks = tasks.filter(function (x) { return x !== t; }); saveT(); drawT(); });
      var box = el('span', 'tk-body'); box.appendChild(tx); if (meta.textContent) box.appendChild(meta);
      li.appendChild(cb); li.appendChild(box); li.appendChild(del); ul.appendChild(li);
    });
    $('tk-empty').hidden = list.length > 0;
    var open = tasks.filter(function (t) { return !t.done; }).length;
    $('tk-count').textContent = open + ' open · ' + (tasks.length - open) + ' done';
  }
  $('tk-form').addEventListener('submit', function (e) {
    e.preventDefault(); var v = $('tk-new').value.trim().slice(0, 200); if (!v) return;
    tasks.push({ id: Date.now(), text: v, done: false, pri: $('tk-pri').value, due: $('tk-due').value || '' });
    $('tk-new').value = ''; saveT(); drawT();
  });
  [].forEach.call(d.querySelectorAll('[data-tkf]'), function (b) { b.addEventListener('click', function () { filter = b.getAttribute('data-tkf'); [].forEach.call(d.querySelectorAll('[data-tkf]'), function (o) { o.setAttribute('aria-pressed', String(o === b)); }); drawT(); }); });
  $('tk-clear').addEventListener('click', function () { tasks = tasks.filter(function (t) { return !t.done; }); saveT(); drawT(); });
  $('tk-export').addEventListener('click', function () {
    var csv = 'Task,Priority,Due,Done\n' + tasks.map(function (t) { return [t.text, t.pri, t.due, t.done ? 'yes' : 'no'].map(function (c) { c = String(c); if (/^[=+\-@]/.test(c)) c = "'" + c; return '"' + c.replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = d.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'tasks.csv'; d.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  /* ---------- daily planner ---------- */
  var plan = rd(PK, {}); if (typeof plan !== 'object' || Array.isArray(plan)) plan = {};
  var day = $('pl-date'); day.value = today();
  function drawP() {
    var box = $('pl-slots'); box.textContent = ''; var cur = plan[day.value] || {};
    for (var h = 6; h <= 22; h++) {
      var row = el('div', 'pl-row'), lab = el('label', 'pl-time', (h < 10 ? '0' : '') + h + ':00'), inp = el('input'); inp.type = 'text'; inp.maxLength = 120; inp.value = cur[h] || ''; inp.id = 'pl-' + h; lab.setAttribute('for', inp.id);
      inp.addEventListener('input', (function (hh, i) { return function () { var c = plan[day.value] || (plan[day.value] = {}); if (i.value) c[hh] = i.value; else delete c[hh]; if (!Object.keys(c).length) delete plan[day.value]; wr(PK, plan); }; })(h, inp));
      row.appendChild(lab); row.appendChild(inp); box.appendChild(row);
    }
  }
  day.addEventListener('change', drawP); $('pl-today').addEventListener('click', function () { day.value = today(); drawP(); });
  $('pl-clearday').addEventListener('click', function () { delete plan[day.value]; wr(PK, plan); drawP(); });
  drawT(); drawP();
})();
