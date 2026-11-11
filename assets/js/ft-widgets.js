/* Free Tools & Gadgets dashboard: live clock and date, weather, currency, tool of the day, trending carousel and quick gadgets.
   Vanilla JS, no dependencies. Weather comes from Open-Meteo and rates from open.er-api.com (both keyless, cached in this browser).
   The QR library is loaded only when someone makes a QR code. Nothing here sends personal data anywhere. */
(function () {
  'use strict';
  var d = document, root = d.getElementById('ft-dashboard'); if (!root) return;
  var $ = function (s, r) { return (r || root).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || root).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n, l) { n = String(n); while (n.length < (l || 2)) n = '0' + n; return n; }

  /* ---------- clock and date ---------- */
  var tEl = $('#fw-time'), dEl = $('#fw-date'), hEl = $('#fw-hijri'), zEl = $('#fw-zone'), wEl = $('#fw-week');
  function tick() {
    var n = new Date();
    tEl.textContent = pad(n.getHours()) + ':' + pad(n.getMinutes()) + ':' + pad(n.getSeconds());
    var key = n.getFullYear() * 400 + n.getMonth() * 31 + n.getDate();
    if (tick.k !== key) {
      tick.k = key;
      dEl.textContent = n.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      var start = new Date(n.getFullYear(), 0, 1), day = Math.floor((n - start) / 864e5) + 1;
      wEl.textContent = 'Day ' + day + ' of the year';
      try { hEl.textContent = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(n); } catch (e) { hEl.textContent = ''; }
      try { zEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' '); } catch (e) { zEl.textContent = ''; }
    }
  }
  tick(); setInterval(function () { if (!d.hidden) tick(); }, 1000);

  /* ---------- weather (Open-Meteo, no key) ---------- */
  var CITIES = { 'Lahore': [31.55, 74.34], 'Karachi': [24.86, 67.01], 'Islamabad': [33.68, 73.05], 'Dubai': [25.2, 55.27], 'Riyadh': [24.71, 46.68], 'London': [51.51, -0.13], 'New York': [40.71, -74.01], 'Toronto': [43.65, -79.38] };
  var WX = function (c) { return c === 0 ? ['Clear sky', 'sun'] : c <= 2 ? ['Partly cloudy', 'cloud-sun'] : c === 3 ? ['Overcast', 'cloud'] : c <= 48 ? ['Fog', 'fog'] : c <= 57 ? ['Drizzle', 'rain'] : c <= 67 ? ['Rain', 'rain'] : c <= 77 ? ['Snow', 'snow'] : c <= 82 ? ['Showers', 'rain'] : c <= 86 ? ['Snow showers', 'snow'] : ['Thunderstorm', 'storm']; };
  var ICONS = { sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 'cloud-sun': '<path d="M12 2v2M4.9 4.9l1.4 1.4M2 12h2M20 12h2M17.7 6.3l1.4-1.4"/><path d="M8 17a4 4 0 1 1 1.3-7.8A5 5 0 0 1 18 11a3.5 3.5 0 0 1-.5 7z"/>', cloud: '<path d="M7 18a4.5 4.5 0 1 1 1-8.9A6 6 0 0 1 19.5 11 3.5 3.5 0 0 1 18 18z"/>', fog: '<path d="M4 8h16M3 12h18M6 16h12M9 20h6"/>', rain: '<path d="M7 14a4.5 4.5 0 1 1 1-8.9A6 6 0 0 1 19.5 7 3.5 3.5 0 0 1 18 14z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>', snow: '<path d="M7 14a4.5 4.5 0 1 1 1-8.9A6 6 0 0 1 19.5 7 3.5 3.5 0 0 1 18 14z"/><path d="M8 18h.01M12 18h.01M16 18h.01M10 21h.01M14 21h.01"/>', storm: '<path d="M7 13a4.5 4.5 0 1 1 1-8.9A6 6 0 0 1 19.5 6 3.5 3.5 0 0 1 18 13z"/><path d="m12 11-2 4h3l-2 4"/>' };
  var wSel = $('#fw-city'), wBody = $('#fw-wx'), place = get('gm.wx.city') || 'Lahore', coords = null;
  wSel.innerHTML = Object.keys(CITIES).map(function (c) { return '<option>' + c + '</option>'; }).join('');
  if (!CITIES[place]) place = 'Lahore'; wSel.value = place;
  function showWx(j, label) {
    var c = j.current, w = WX(c.weather_code);
    wBody.innerHTML = '<div class="ftd-wx-main"><svg class="ftd-wx-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[w[1]] + '</svg><div><div class="ftd-big">' + Math.round(c.temperature_2m) + '°C</div><div class="ftd-sub">' + w[0] + ' in ' + esc(label) + '</div></div></div><div class="ftd-wx-row"><span>Humidity ' + Math.round(c.relative_humidity_2m) + '%</span><span>Wind ' + Math.round(c.wind_speed_10m) + ' km/h</span></div>';
  }
  function loadWx() {
    var lat, lon, label, key;
    if (coords) { lat = coords[0]; lon = coords[1]; label = 'your location'; key = 'gm.wx.me'; } else { lat = CITIES[place][0]; lon = CITIES[place][1]; label = place; key = 'gm.wx.' + place; }
    var c = get(key); if (c && Date.now() - c.t < 30 * 60 * 1000) return showWx(c.j, label);
    wBody.innerHTML = '<div class="ftd-sub">Loading weather...</div>';
    fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      if (!j || !j.current || typeof j.current.temperature_2m !== 'number') throw 0; put(key, { t: Date.now(), j: { current: j.current } }); showWx(j, label);
    }).catch(function () { if (c) showWx(c.j, label); else wBody.innerHTML = '<div class="ftd-sub">Weather is unavailable right now. Please try again later.</div>'; });
  }
  wSel.addEventListener('change', function () { place = wSel.value; coords = null; put('gm.wx.city', place); loadWx(); });
  $('#fw-geo').addEventListener('click', function () {
    if (!navigator.geolocation) return; var b = this; b.disabled = true;
    navigator.geolocation.getCurrentPosition(function (p) { coords = [Math.round(p.coords.latitude * 100) / 100, Math.round(p.coords.longitude * 100) / 100]; b.disabled = false; loadWx(); }, function () { b.disabled = false; wBody.innerHTML = '<div class="ftd-sub">Location was not shared, so the city list is used.</div>'; }, { timeout: 8000, maximumAge: 600000 });
  });

  /* ---------- currency (open.er-api.com, cached 6 hours) ---------- */
  var FX = null, FXC = ['USD', 'PKR', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'CAD', 'AUD', 'CNY', 'JPY', 'TRY'];
  var fa = $('#fx-amt'), ff = $('#fx-from'), ft = $('#fx-to'), fr = $('#fx-res'), fn = $('#fx-note');
  ff.innerHTML = ft.innerHTML = FXC.map(function (c) { return '<option>' + c + '</option>'; }).join(''); ff.value = 'USD'; ft.value = 'PKR';
  function fxCalc() {
    if (!FX) return; var a = parseFloat(fa.value); if (!isFinite(a)) { fr.textContent = '-'; return; }
    var v = a / FX.r[ff.value] * FX.r[ft.value]; fr.textContent = v.toLocaleString('en-US', { maximumFractionDigits: v < 1 ? 4 : 2 }) + ' ' + ft.value;
    fn.textContent = '1 ' + ff.value + ' = ' + (FX.r[ft.value] / FX.r[ff.value]).toLocaleString('en-US', { maximumFractionDigits: 4 }) + ' ' + ft.value;
  }
  function fxLoad() {
    var c = get('gm.fx.mini'); if (c && Date.now() - c.t < 6 * 3600 * 1000) { FX = c; return fxCalc(); }
    fetch('https://open.er-api.com/v6/latest/USD').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      if (!j || !j.rates) throw 0; var r = {}; FXC.forEach(function (k) { if (typeof j.rates[k] === 'number' && j.rates[k] > 0) r[k] = j.rates[k]; }); if (!r.USD || !r.PKR) throw 0;
      FX = { t: Date.now(), r: r }; put('gm.fx.mini', FX); fxCalc();
    }).catch(function () { if (c) { FX = c; fxCalc(); fn.textContent = 'Showing saved rates (offline).'; } else fr.textContent = 'Rates unavailable'; });
  }
  [fa, ff, ft].forEach(function (e) { e.addEventListener('input', fxCalc); });
  $('#fx-swap').addEventListener('click', function () { var t = ff.value; ff.value = ft.value; ft.value = t; fxCalc(); });

  /* ---------- tool of the day and trending carousel (built from the tool cards already on this page) ---------- */
  var cards = {}; $$('.tool-card[data-slug]', d).forEach(function (a) { var h = a.querySelector('h3 a'); if (!h) return; cards[a.getAttribute('data-slug')] = { slug: a.getAttribute('data-slug'), name: h.textContent.trim(), href: h.getAttribute('href'), desc: (a.querySelector('p') || {}).textContent || '', cat: a.getAttribute('data-cat') || '', chip: (a.querySelector('.icon-chip') || {}).outerHTML || '' }; });
  function short(s, n) { s = String(s).replace(/\s+/g, ' ').trim(); var i = s.indexOf('. '); if (i > 20 && i < n) s = s.slice(0, i + 1); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }
  var DAYS = ['pdf-merge-split', 'image-converter', 'pakistan-salary-tax-calculator', 'resume-builder', 'qr-code-generator', 'password-generator', 'loan-emi-calculator', 'ats-resume-checker', 'unit-converter', 'pdf-compressor', 'word-counter', 'zakat-calculator', 'pdf-to-word', 'image-resizer', 'typing-speed-test', 'cover-letter-generator', 'json-formatter', 'bmi-calculator'].filter(function (s) { return cards[s]; });
  if (DAYS.length) {
    var n0 = new Date(), idx = (n0.getFullYear() * 366 + Math.floor((n0 - new Date(n0.getFullYear(), 0, 0)) / 864e5)) % DAYS.length, t = cards[DAYS[idx]];
    $('#fw-totd').innerHTML = '<div class="ftd-totd-head">' + t.chip.replace('icon-chip', 'icon-chip ftd-chip') + '<div><span class="ftd-eyebrow">Tool of the day</span><h3>' + esc(t.name) + '</h3></div></div><p>' + esc(short(t.desc, 120)) + '</p><a class="btn btn-primary btn-sm" href="' + esc(t.href) + '">Open tool</a>';
  }
  var TREND = ['pdf-to-word', 'pdf-merge-split', 'image-converter', 'pakistan-salary-tax-calculator', 'resume-builder', 'qr-code-generator', 'unit-converter', 'ats-resume-checker', 'loan-emi-calculator', 'password-generator'].filter(function (s) { return cards[s]; });
  var track = $('#ftd-track'); track.innerHTML = TREND.map(function (s) { var t = cards[s]; return '<a class="ftd-tcard" href="' + esc(t.href) + '">' + t.chip.replace('icon-chip', 'icon-chip ftd-chip') + '<b>' + esc(t.name) + '</b><span>' + esc(short(t.desc, 84)) + '</span><em>' + esc(t.cat) + '</em></a>'; }).join('');
  function step(dir) { var w = (track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width : 260) + 16; track.scrollBy({ left: dir * w * 2, behavior: reduce ? 'auto' : 'smooth' }); }
  $('#ftd-prev').addEventListener('click', function () { step(-1); }); $('#ftd-next').addEventListener('click', function () { step(1); });

  /* ---------- stopwatch ---------- */
  var swD = $('#sw-disp'), swB = $('#sw-go'), swL = $('#sw-laps'), swT = 0, swS = 0, swR = false, swF = 0;
  function fmt(ms) { var c = Math.floor(ms / 10) % 100, s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000); return pad(m) + ':' + pad(s) + '.' + pad(c); }
  function swLoop() { if (!swR) return; swD.textContent = fmt(swT + performance.now() - swS); swF = requestAnimationFrame(swLoop); }
  swB.addEventListener('click', function () {
    if (swR) { swT += performance.now() - swS; swR = false; cancelAnimationFrame(swF); swB.textContent = 'Start'; swD.textContent = fmt(swT); }
    else { swS = performance.now(); swR = true; swB.textContent = 'Stop'; swLoop(); }
  });
  $('#sw-lap').addEventListener('click', function () { var v = swR ? swT + performance.now() - swS : swT; if (v > 0) { var li = d.createElement('li'); li.textContent = 'Lap ' + (swL.children.length + 1) + '  ' + fmt(v); swL.insertBefore(li, swL.firstChild); while (swL.children.length > 3) swL.removeChild(swL.lastChild); } });
  $('#sw-reset').addEventListener('click', function () { swR = false; cancelAnimationFrame(swF); swT = 0; swB.textContent = 'Start'; swD.textContent = '00:00.00'; swL.innerHTML = ''; });

  /* ---------- countdown ---------- */
  var cdM = $('#cd-min'), cdS = $('#cd-sec'), cdD = $('#cd-disp'), cdB = $('#cd-go'), cdLeft = 0, cdEnd = 0, cdI = 0, cdOn = false;
  function cdShow(ms) { var s = Math.ceil(ms / 1000); cdD.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
  function beep() { try { var A = window.AudioContext || window.webkitAudioContext, c = new A(), o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = 880; g.gain.value = 0.15; o.connect(g); g.connect(c.destination); o.start(); setTimeout(function () { o.stop(); c.close(); }, 500); } catch (e) {} }
  function cdTick() { var l = cdEnd - Date.now(); if (l <= 0) { clearInterval(cdI); cdOn = false; cdLeft = 0; cdD.textContent = '00:00'; cdB.textContent = 'Start'; cdD.classList.add('ftd-done'); beep(); return; } cdShow(l); }
  function cdPrep() { cdLeft = Math.max(0, (parseInt(cdM.value, 10) || 0) * 60 + (parseInt(cdS.value, 10) || 0)) * 1000; cdShow(cdLeft); cdD.classList.remove('ftd-done'); }
  [cdM, cdS].forEach(function (e) { e.addEventListener('input', function () { if (!cdOn) cdPrep(); }); }); cdPrep();
  cdB.addEventListener('click', function () {
    if (cdOn) { cdLeft = cdEnd - Date.now(); clearInterval(cdI); cdOn = false; cdB.textContent = 'Resume'; return; }
    if (cdLeft <= 0) cdPrep(); if (cdLeft <= 0) return; cdD.classList.remove('ftd-done'); cdEnd = Date.now() + cdLeft; cdOn = true; cdB.textContent = 'Pause'; cdI = setInterval(cdTick, 200); cdTick();
  });
  $('#cd-reset').addEventListener('click', function () { clearInterval(cdI); cdOn = false; cdB.textContent = 'Start'; cdPrep(); });

  /* ---------- unit converter ---------- */
  var U = { Length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 }, Weight: { kg: 1, g: 0.001, mg: 1e-6, lb: 0.45359237, oz: 0.028349523125 }, Temperature: { '°C': 1, '°F': 1, K: 1 } };
  var uc = $('#un-cat'), ua = $('#un-amt'), uf = $('#un-from'), ut = $('#un-to'), ur = $('#un-res');
  uc.innerHTML = Object.keys(U).map(function (k) { return '<option>' + k + '</option>'; }).join('');
  function uFill() { var o = Object.keys(U[uc.value]).map(function (k) { return '<option>' + k + '</option>'; }).join(''); uf.innerHTML = ut.innerHTML = o; uf.selectedIndex = 0; ut.selectedIndex = 1; uCalc(); }
  function toC(v, u) { return u === '°F' ? (v - 32) * 5 / 9 : u === 'K' ? v - 273.15 : v; }
  function fromC(v, u) { return u === '°F' ? v * 9 / 5 + 32 : u === 'K' ? v + 273.15 : v; }
  function uCalc() { var a = parseFloat(ua.value); if (!isFinite(a)) { ur.textContent = '-'; return; } var r = uc.value === 'Temperature' ? fromC(toC(a, uf.value), ut.value) : a * U[uc.value][uf.value] / U[uc.value][ut.value]; ur.textContent = (Math.abs(r) >= 1e9 || (r !== 0 && Math.abs(r) < 1e-4) ? r.toExponential(4) : (Math.round(r * 1e6) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 6 })) + ' ' + ut.value; }
  uc.addEventListener('change', uFill); [ua, uf, ut].forEach(function (e) { e.addEventListener('input', uCalc); }); uFill();

  /* ---------- QR code (library loaded on first use) ---------- */
  var qi = $('#qr-in'), qo = $('#qr-out'), qd = $('#qr-dl'), qCanvas = null, qLoad = null;
  function loadLib() { return qLoad || (qLoad = new Promise(function (res, rej) { if (window.qrcode) return res(); var s = d.createElement('script'); s.src = (d.body.getAttribute('data-root') || './') + 'assets/vendor/qrcode.js?v=fbb6b69b'; s.onload = res; s.onerror = rej; d.head.appendChild(s); })); }
  function qrMake() {
    var v = qi.value.trim(); if (!v) { qo.innerHTML = '<span class="ftd-sub">Type a link or text</span>'; qd.disabled = true; return; }
    loadLib().then(function () {
      qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8']; var q = qrcode(0, 'M'); q.addData(v); q.make();
      var im = new Image(); im.onload = function () { var c = d.createElement('canvas'); c.width = c.height = 240; var x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#fff'; x.fillRect(0, 0, 240, 240); x.drawImage(im, 0, 0, 240, 240); qCanvas = c; qo.innerHTML = ''; c.className = 'ftd-qrc'; c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'QR code'); qo.appendChild(c); qd.disabled = false; };
      im.src = q.createDataURL(8, 2);
    }).catch(function () { qo.innerHTML = '<span class="ftd-sub">QR library could not load.</span>'; });
  }
  var qT = 0; qi.addEventListener('input', function () { clearTimeout(qT); qT = setTimeout(qrMake, 350); });
  qi.addEventListener('focus', function () { loadLib(); }, { once: true });
  qd.addEventListener('click', function () { if (!qCanvas) return; qCanvas.toBlob(function (b) { var a = d.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'qr-code.png'; d.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500); }, 'image/png'); });
  qrMake();

  /* weather and rates load when the dashboard is about to be seen */
  function start() { loadWx(); fxLoad(); }
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); start(); } }, { rootMargin: '300px' }); io.observe(root); } else start();
})();
