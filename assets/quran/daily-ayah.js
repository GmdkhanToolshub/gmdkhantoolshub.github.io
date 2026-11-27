/* Daily Quran Ayat. Chooses one verified passage by the visitor's calendar date. Text is placed with textContent only.
   The Arabic is shown only after its matching font has loaded; it is never drawn with a substitute font. */
(function () {
  'use strict';
  var base = '../assets/quran/';
  var $ = function (id) { return document.getElementById(id); };
  function dayNumber(d) { return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }
  function pick(d, count) { return ((dayNumber(d) % count) + count) % count + 1; }
  var shownDay = null;
  function get(path) { return fetch(base + path).then(function (r) { if (!r.ok) throw new Error(path); return r.json(); }); }
  function fail() {
    $('qa-body').hidden = true;
    $('qa-status').hidden = false;
    $('qa-status').textContent = 'Today’s ayah could not be loaded correctly, so it is not shown. Please check your connection and refresh the page.';
    $('qa-card').setAttribute('aria-busy', 'false');
  }
  function add(parent, tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; parent.appendChild(e); return e; }
  function render(entry, now) {
    var arabic = $('qa-arabic'), urdu = $('qa-urdu'), notes = $('qa-notes-body'), any = false;
    arabic.textContent = ''; urdu.textContent = ''; notes.textContent = '';
    $('qa-surah').textContent = 'سورۃ ' + entry.name;
    $('qa-num').textContent = 'Surah ' + entry.surah + ', ayah ' + entry.from + (entry.to > entry.from ? '–' + entry.to : '');
    entry.ayat.forEach(function (a) {
      add(arabic, 'span', 'qa-aya', a.arabic);
      arabic.appendChild(document.createTextNode(' '));
      var p = add(urdu, 'p'); add(p, 'bdi', 'qa-no', entry.surah + ':' + a.n); p.appendChild(document.createTextNode(' ')); add(p, 'span', '', a.urdu);
      if (a.footnotes && a.footnotes.trim()) { any = true; var box = add(notes, 'div', 'qa-note'); add(box, 'bdi', 'qa-no', entry.surah + ':' + a.n); add(box, 'p', '', a.footnotes); }
    });
    $('qa-notes').hidden = !any;
    $('qa-date').textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('qa-status').hidden = true; $('qa-body').hidden = false; $('qa-card').setAttribute('aria-busy', 'false');
  }
  function show() {
    var now = new Date(), day = dayNumber(now);
    if (day === shownDay) return;
    var font = document.fonts && document.fonts.load ? document.fonts.load('32px "GM Hafs"') : Promise.reject(new Error('no font loading support'));
    Promise.all([get('data/info.json'), font]).then(function (r) {
      if (!r[1] || !r[1].length) throw new Error('Quran font did not load');
      return get('data/' + pick(now, r[0].count) + '.json');
    }).then(function (entry) { render(entry, now); shownDay = day; }).catch(fail);
  }
  window.GM_AYAH = { pick: pick, render: render };
  show();
  /* a page left open moves to the new day */
  setInterval(show, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) show(); });
})();
