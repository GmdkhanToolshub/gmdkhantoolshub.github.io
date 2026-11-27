/* Daily Quran Ayat: one verified passage by the visitor's calendar date, with Arabic recitation and previous/next.
   Quran text is placed with textContent only and is shown only after its matching font has loaded.
   Audio streams from Al Quran Cloud only when it is played; nothing is requested from them before that. */
(function () {
  'use strict';
  var base = '../assets/quran/';
  var CDN = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/';
  var $ = function (id) { return document.getElementById(id); };
  function dayNumber(d) { return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }
  function pick(d, count) { return ((dayNumber(d) % count) + count) % count + 1; }
  var cache = {};
  function get(path) {
    return cache[path] || (cache[path] = fetch(base + path).then(function (r) { if (!r.ok) throw new Error(path); return r.json(); }).catch(function (e) { delete cache[path]; throw e; }));
  }
  var count = 0, current = 0, entry = null, shownDay = null, followToday = true, request = 0;

  /* ---------- text ---------- */
  function fail() {
    $('qa-body').hidden = true; $('qa-player').hidden = true;
    $('qa-status').hidden = false;
    $('qa-status').textContent = 'This ayah could not be loaded correctly, so it is not shown. Please check your connection and refresh the page.';
    $('qa-card').setAttribute('aria-busy', 'false');
  }
  function add(parent, tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; parent.appendChild(e); return e; }
  function render(data, n, now) {
    var arabic = $('qa-arabic'), urdu = $('qa-urdu'), notes = $('qa-notes-body'), any = false;
    arabic.textContent = ''; urdu.textContent = ''; notes.textContent = '';
    $('qa-surah').textContent = 'سورۃ ' + data.name;
    $('qa-num').textContent = 'Surah ' + data.surah + ', ayah ' + data.from + (data.to > data.from ? '–' + data.to : '');
    data.ayat.forEach(function (a) {
      add(arabic, 'span', 'qa-aya', a.arabic);
      arabic.appendChild(document.createTextNode(' '));
      var p = add(urdu, 'p'); add(p, 'bdi', 'qa-no', data.surah + ':' + a.n); p.appendChild(document.createTextNode(' ')); add(p, 'span', '', a.urdu);
      if (a.footnotes && a.footnotes.trim()) { any = true; var box = add(notes, 'div', 'qa-note'); add(box, 'bdi', 'qa-no', data.surah + ':' + a.n); add(box, 'p', '', a.footnotes); }
    });
    $('qa-notes').hidden = !any; $('qa-notes').open = false;
    var isToday = n === pick(now, count);
    $('qa-date').textContent = isToday ? 'Today, ' + now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'You are browsing the daily list.';
    $('qa-pos').textContent = 'Passage ' + n + ' of ' + count;
    $('qa-today').hidden = isToday;
    $('qa-status').hidden = true; $('qa-body').hidden = false; $('qa-player').hidden = false; $('qa-card').setAttribute('aria-busy', 'false');
    var body = $('qa-body'); body.style.animation = 'none'; void body.offsetWidth; body.style.animation = '';
  }

  /* ---------- recitation ---------- */
  var audio = new Audio(); audio.preload = 'none';
  var numbers = null, index = 0, loadedUrl = '', wanted = false, timer = 0, ahead = null;
  var player = function () { return $('qa-player'); };
  function clock(s) { if (!isFinite(s)) return '0:00'; s = Math.floor(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function say(text) { $('qa-say').textContent = text; }
  function mode(m) {
    player().setAttribute('data-state', m);
    var on = m === 'playing' || m === 'loading';
    $('qa-play').setAttribute('aria-label', on ? 'Pause recitation' : 'Play recitation');
    $('qa-play-text').textContent = on ? 'Pause' : 'Play';
  }
  function mark(i) {
    [].forEach.call(document.querySelectorAll('#qa-arabic .qa-aya'), function (e, k) { e.classList.toggle('is-playing', k === i); });
    [].forEach.call(document.querySelectorAll('#qa-urdu p'), function (e, k) { e.classList.toggle('is-playing', k === i); });
    if (i < 1) return; /* the first ayah never moves the page, so the player stays where the visitor pressed it */
    var el = document.querySelectorAll('#qa-arabic .qa-aya')[i];
    if (el) { var r = el.getBoundingClientRect(); if (r.top < 90 || r.bottom > window.innerHeight - 20) el.scrollIntoView({ block: 'nearest', behavior: window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
  }
  function label() { return entry ? 'Ayah ' + entry.surah + ':' + entry.ayat[index].n + (entry.ayat.length > 1 ? ' (' + (index + 1) + ' of ' + entry.ayat.length + ')' : '') : ''; }
  function bar() {
    var d = audio.duration, t = audio.currentTime || 0, part = isFinite(d) && d > 0 ? t / d : 0;
    var whole = entry ? (index + part) / entry.ayat.length : 0;
    $('qa-fill').style.transform = 'scaleX(' + Math.min(1, whole) + ')';
    $('qa-bar').setAttribute('aria-valuenow', Math.round(whole * 100));
    $('qa-time').textContent = clock(t) + ' / ' + clock(d);
  }
  function reset(message) {
    wanted = false; clearTimeout(timer); audio.pause(); audio.removeAttribute('src'); audio.load(); loadedUrl = ''; index = 0;
    mark(-1); $('qa-fill').style.transform = 'scaleX(0)'; $('qa-bar').setAttribute('aria-valuenow', '0'); $('qa-time').textContent = '0:00 / 0:00';
    mode('idle'); say(message || 'Press Play to listen to the Arabic recitation.');
  }
  function broken() {
    if (!wanted) return;
    wanted = false; clearTimeout(timer); loadedUrl = ''; mode('error');
    say('The recitation could not be loaded. Check your connection and press Play to try again.');
  }
  function slow() { clearTimeout(timer); timer = setTimeout(broken, 20000); }
  function play() {
    if (!entry) return;
    wanted = true; mode('loading'); say('Loading ' + label() + '…'); mark(index); slow();
    var start = function () {
      if (!wanted) return;
      var url = CDN + numbers[entry.surah + ':' + entry.ayat[index].n] + '.mp3';
      if (loadedUrl !== url) { audio.src = url; loadedUrl = url; }
      var p = audio.play();
      if (p && p.catch) p.catch(function (e) {
        if (!wanted) return;
        if (e && e.name === 'NotAllowedError') { wanted = false; clearTimeout(timer); mode('idle'); mark(-1); say('Tap Play to listen. Your browser does not allow sound to start by itself.'); }
        else if (!e || e.name !== 'AbortError') broken();
      });
    };
    /* when the list is already in memory, play inside the same tap, which phones require */
    if (numbers) start(); else get('data/audio.json').then(function (m) { numbers = m; start(); }).catch(broken);
  }
  function pause() { wanted = false; clearTimeout(timer); audio.pause(); mode('paused'); say('Paused at ' + label() + '.'); }
  audio.addEventListener('playing', function () {
    clearTimeout(timer); mode('playing'); say('Reciting ' + label()); mark(index);
    if (entry && index + 1 < entry.ayat.length && numbers) { ahead = new Audio(); ahead.preload = 'auto'; ahead.src = CDN + numbers[entry.surah + ':' + entry.ayat[index + 1].n] + '.mp3'; }
  });
  audio.addEventListener('waiting', function () { if (wanted) { mode('loading'); say('Loading ' + label() + '…'); slow(); } });
  audio.addEventListener('timeupdate', bar);
  audio.addEventListener('error', function () { if (audio.getAttribute('src')) broken(); });
  audio.addEventListener('ended', function () {
    if (!entry) return;
    if (index + 1 < entry.ayat.length) { index++; play(); return; }
    reset('Recitation finished. Press Replay to hear it again.');
    $('qa-fill').style.transform = 'scaleX(1)';
  });

  /* ---------- passages ---------- */
  function load(n, opts) {
    opts = opts || {};
    var mine = ++request, now = new Date();
    reset();
    var font = document.fonts && document.fonts.load ? document.fonts.load('32px "GM Hafs"') : Promise.reject(new Error('no font loading support'));
    return font.then(function (f) { if (!f || !f.length) throw new Error('Quran font did not load'); return get('data/' + n + '.json'); }).then(function (data) {
      if (mine !== request) return;
      entry = data; current = n; render(data, n, now);
      if (opts.play) play();
    }).catch(function () { if (mine === request) { entry = null; fail(); } });
  }
  function address(n) { return location.pathname + (n ? '?p=' + n : ''); }
  function go(n, toToday) {
    var resume = wanted;
    followToday = !!toToday;
    history.pushState(null, '', address(toToday ? 0 : n));
    load(n, { play: resume });
  }
  function start() {
    var q = new URLSearchParams(location.search), p = parseInt(q.get('p'), 10), now = new Date();
    var chosen = p >= 1 && p <= count ? p : 0;
    followToday = !chosen; shownDay = dayNumber(now);
    /* autoplay only when the visitor has just pressed the banner on this site */
    var fromBanner = q.get('play') === '1' && document.referrer.indexOf(location.origin + '/') === 0;
    if (q.has('play')) history.replaceState(null, '', address(chosen));
    load(chosen || pick(now, count), { play: fromBanner });
  }

  $('qa-play').addEventListener('click', function () { if (wanted) pause(); else play(); });
  $('qa-replay').addEventListener('click', function () { if (!entry) return; index = 0; if (loadedUrl) { loadedUrl = ''; } play(); });
  $('qa-stop').addEventListener('click', function () { reset(); });
  $('qa-prev').addEventListener('click', function () { if (current) go(current === 1 ? count : current - 1); });
  $('qa-next').addEventListener('click', function () { if (current) go(current === count ? 1 : current + 1); });
  $('qa-today').addEventListener('click', function () { go(pick(new Date(), count), true); });
  window.addEventListener('popstate', function () { var p = parseInt(new URLSearchParams(location.search).get('p'), 10); followToday = !(p >= 1 && p <= count); load(followToday ? pick(new Date(), count) : p); });
  /* a page left open moves to the new day, but never interrupts a recitation or someone browsing */
  function newDay() { var now = new Date(); if (count && followToday && !wanted && dayNumber(now) !== shownDay) { shownDay = dayNumber(now); load(pick(now, count)); } }
  setInterval(newDay, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) newDay(); });

  window.GM_AYAH = { pick: pick, audio: audio };
  /* fetched early so that a tap on Play can start sound straight away; this is our own file */
  get('data/audio.json').then(function (m) { numbers = m; }).catch(function () {});
  get('data/info.json').then(function (info) { count = info.count; start(); }).catch(fail);
})();
