/* Countdown Timer: a timer for hours, minutes and seconds, plus a countdown to a date and time.
   Uses the clock rather than counting ticks, so it stays accurate when the tab is in the background. */
NiaziTools['countdown-timer'] = function (root, U) {
  var title = document.title, endAt = 0, remaining = 0, total = 0, iv = 0, ac = null, ringIv = 0;
  var KEY = 'gm.countdown.v1', st = U.store.get(KEY, { target: '', label: '' });
  root.innerHTML = '<div id="ct-body"></div>';
  function audio() { try { var A = window.AudioContext || window.webkitAudioContext; if (!ac) ac = new A(); if (ac.state === 'suspended') ac.resume(); } catch (e) { ac = null; } return ac; }
  function beep() { var a = audio(); if (!a) return; [0, 0.3, 0.6].forEach(function (t) { var o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(0.0001, a.currentTime + t); g.gain.exponentialRampToValueAtTime(0.3, a.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t + 0.22); o.start(a.currentTime + t); o.stop(a.currentTime + t + 0.25); }); }
  function stopRing() { clearInterval(ringIv); ringIv = 0; var m = root.querySelector('.ring-modal'); if (m) m.remove(); document.title = title; }
  function ring(msg) {
    beep(); clearInterval(ringIv); ringIv = setInterval(beep, 1800);
    root.insertAdjacentHTML('beforeend', '<div class="ring-modal" role="alertdialog" aria-label="Time is up"><div><b>' + U.esc(msg) + '</b><button type="button" class="btn btn-primary" id="ct-stop">Stop</button></div></div>');
    root.querySelector('#ct-stop').onclick = stopRing; root.querySelector('#ct-stop').focus();
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification('GM Countdown Timer', { body: msg }); } catch (e) {}
  }
  function timerView() {
    var body = root.querySelector('#ct-body'); clearInterval(iv); stopRing(); endAt = 0;
    body.innerHTML = '<div class="pomo-wrap"><svg class="pomo-ring" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="98" class="pomo-track"/><circle cx="110" cy="110" r="98" class="pomo-bar" id="ct-bar"/></svg><div class="pomo-center"><div class="pomo-time" id="ct-time" role="timer" aria-live="off">05:00</div><div class="pomo-label" id="ct-state">Set the time</div></div></div>' +
      '<div class="chips" style="justify-content:center;margin:0 0 12px">' + [1, 5, 10, 15, 30, 60].map(function (m) { return '<button type="button" class="chip" data-m="' + m + '">' + m + ' min</button>'; }).join('') + '</div>' +
      '<div class="form-grid ct-inputs"><div class="field"><label for="ct-h">Hours</label><input type="text" inputmode="numeric" id="ct-h" value="0"></div><div class="field"><label for="ct-m">Minutes</label><input type="text" inputmode="numeric" id="ct-m" value="5"></div><div class="field"><label for="ct-s">Seconds</label><input type="text" inputmode="numeric" id="ct-s" value="0"></div></div>' +
      '<p class="form-error" id="ct-err" role="alert"></p><div class="tool-actions" style="justify-content:center"><button type="button" class="btn btn-primary" id="ct-go">Start</button><button type="button" class="btn btn-ghost" id="ct-reset">Reset</button></div>' +
      '<div class="field check"><input type="checkbox" id="ct-ntf"><label for="ct-ntf">Show a notification when time is up</label></div>';
    var $ = function (s) { return root.querySelector(s); }, bar = $('#ct-bar'), C = 2 * Math.PI * 98; bar.style.strokeDasharray = C;
    function read() { var h = parseInt($('#ct-h').value, 10) || 0, m = parseInt($('#ct-m').value, 10) || 0, s = parseInt($('#ct-s').value, 10) || 0; return (h * 3600 + m * 60 + s) * 1000; }
    function fmt(ms) { var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? U.pad2(h) + ':' : '') + U.pad2(m) + ':' + U.pad2(s % 60); }
    function paint() { var left = endAt ? endAt - Date.now() : remaining; $('#ct-time').textContent = fmt(left); bar.style.strokeDashoffset = total ? C * (1 - Math.max(0, left) / total) : 0; if (endAt) document.title = fmt(left) + ' · Timer'; }
    function pause() { if (!endAt) return; remaining = Math.max(0, endAt - Date.now()); endAt = 0; clearInterval(iv); $('#ct-go').textContent = 'Resume'; $('#ct-state').textContent = 'Paused'; document.title = title; paint(); }
    function loop() { if (endAt - Date.now() <= 0) { clearInterval(iv); endAt = 0; remaining = 0; $('#ct-go').textContent = 'Start'; $('#ct-state').textContent = 'Time is up'; paint(); document.title = title; ring('Time is up!'); } else paint(); }
    $('#ct-go').onclick = function () {
      $('#ct-err').textContent = '';
      if (endAt) { pause(); return; }
      audio();
      if (!remaining) { remaining = read(); total = remaining; if (remaining <= 0) { $('#ct-err').textContent = 'Set a time above zero.'; return; } if (remaining > 100 * 3600 * 1000) { $('#ct-err').textContent = 'The longest timer is 99 hours, 59 minutes and 59 seconds.'; remaining = 0; return; } }
      endAt = Date.now() + remaining; $('#ct-go').textContent = 'Pause'; $('#ct-state').textContent = 'Running'; iv = setInterval(loop, 200); paint();
    };
    $('#ct-reset').onclick = function () { clearInterval(iv); endAt = 0; remaining = 0; total = 0; stopRing(); $('#ct-go').textContent = 'Start'; $('#ct-state').textContent = 'Set the time'; $('#ct-time').textContent = fmt(read()); bar.style.strokeDashoffset = 0; };
    body.addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (!b) return; $('#ct-h').value = '0'; $('#ct-m').value = b.getAttribute('data-m'); $('#ct-s').value = '0'; if (!endAt) { remaining = 0; total = 0; $('#ct-time').textContent = fmt(read()); bar.style.strokeDashoffset = 0; } });
    ['ct-h', 'ct-m', 'ct-s'].forEach(function (id) { $('#' + id).addEventListener('input', function () { if (!endAt) { remaining = 0; total = 0; $('#ct-time').textContent = fmt(read()); bar.style.strokeDashoffset = 0; } }); });
    $('#ct-ntf').addEventListener('change', function () { var b = this; if (b.checked && 'Notification' in window && Notification.permission !== 'granted') Notification.requestPermission().then(function (p) { if (p !== 'granted') { b.checked = false; U.toast('Notifications are blocked in your browser settings'); } }); });
    $('#ct-time').textContent = fmt(read());
  }
  function dateView() {
    var body = root.querySelector('#ct-body'); clearInterval(iv); stopRing();
    var def = st.target || (function () { var d = new Date(Date.now() + 7 * 864e5); d.setHours(9, 0, 0, 0); return d.getFullYear() + '-' + U.pad2(d.getMonth() + 1) + '-' + U.pad2(d.getDate()) + 'T' + U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes()); })();
    body.innerHTML = '<div class="form-grid"><div class="field"><label for="cd-dt">Date and time</label><input type="datetime-local" id="cd-dt" value="' + U.esc(def) + '"></div><div class="field"><label for="cd-label">Event name (optional)</label><input type="text" id="cd-label" maxlength="60" value="' + U.esc(st.label) + '" placeholder="e.g. Eid, exam, launch"></div></div>' +
      '<div class="cd-title" id="cd-title"></div><div class="cd-boxes" id="cd-boxes" role="timer" aria-live="off"></div><p class="small muted" id="cd-note"></p>';
    var $ = function (s) { return root.querySelector(s); };
    function paint() {
      var v = $('#cd-dt').value, t = new Date(v).getTime(), lab = $('#cd-label').value.trim();
      $('#cd-title').textContent = lab; if (!v || isNaN(t)) { $('#cd-boxes').innerHTML = ''; $('#cd-note').textContent = 'Choose a date and time.'; return; }
      var diff = t - Date.now(), past = diff < 0, a = Math.abs(diff), d = Math.floor(a / 864e5), h = Math.floor(a % 864e5 / 36e5), m = Math.floor(a % 36e5 / 6e4), s = Math.floor(a % 6e4 / 1e3);
      $('#cd-boxes').innerHTML = [['Days', d], ['Hours', h], ['Minutes', m], ['Seconds', s]].map(function (x) { return '<div class="cd-box"><b>' + U.pad2(x[1]) + '</b><span>' + x[0] + '</span></div>'; }).join('');
      $('#cd-note').textContent = past ? (lab || 'This moment') + ' was ' + U.fmt(d, 0) + ' day' + (d === 1 ? '' : 's') + ' ago.' : 'Counting down to ' + new Date(t).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' }) + ' in your time zone.';
    }
    function save() { st.target = $('#cd-dt').value; st.label = $('#cd-label').value; U.store.set(KEY, st); paint(); }
    $('#cd-dt').addEventListener('input', save); $('#cd-label').addEventListener('input', save); paint(); iv = setInterval(function () { if (!document.body.contains(root)) clearInterval(iv); else paint(); }, 500);
  }
  var views = [timerView, dateView]; U.tabs(root, ['Timer', 'Countdown to a date'], function (i) { views[i](); }); timerView();
  window.addEventListener('pagehide', function () { document.title = title; });
};
