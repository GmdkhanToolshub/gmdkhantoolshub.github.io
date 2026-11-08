/* Alarm Clock: alarms with labels, repeat days and snooze. Alarms ring only while this page is open in a browser
   tab (browsers cannot ring a closed page). Alarms are saved in this browser. */
NiaziTools['alarm-clock'] = function (root, U) {
  var KEY = 'gm.alarms.v1', alarms = U.store.get(KEY, []), ac = null, ringIv = 0, ringing = null, title = document.title, fired = {};
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], TONES = { beep: ['Beep', [880], 'sine'], chime: ['Soft chime', [660, 880, 1100], 'sine'], siren: ['Siren', [600, 900], 'square'] };
  root.innerHTML = '<div class="alarm-now" id="al-now" aria-hidden="true"></div>' +
    '<div class="form-grid"><div class="field"><label for="al-time">Alarm time</label><input type="time" id="al-time" value="07:00"></div><div class="field"><label for="al-label">Label (optional)</label><input type="text" id="al-label" maxlength="40" placeholder="e.g. Wake up, Fajr, Meeting"></div>' +
    '<div class="field"><label for="al-tone">Sound</label><select id="al-tone">' + Object.keys(TONES).map(function (k) { return '<option value="' + k + '">' + TONES[k][0] + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>Repeat</label><div class="chips" id="al-days" style="margin:0">' + DAYS.map(function (d, i) { return '<button type="button" class="chip" data-d="' + i + '" aria-pressed="false">' + d + '</button>'; }).join('') + '</div><small class="hint">Leave all off to ring once.</small></div></div>' +
    '<div class="tool-actions"><button type="button" class="btn btn-primary" id="al-add">Add alarm</button><button type="button" class="btn btn-ghost" id="al-test">Test sound</button></div>' +
    '<p class="form-error" id="al-err" role="alert"></p><div id="al-list"></div>' +
    '<p class="small muted">Keep this page open in a browser tab for alarms to ring. Browsers cannot ring a closed page, and a phone that sleeps or locks may pause the tab. Sound needs you to have used the page once (for example by pressing Add alarm or Test sound).</p>';
  var $ = function (s) { return root.querySelector(s); }, days = {};
  function audio() { try { var A = window.AudioContext || window.webkitAudioContext; if (!ac) ac = new A(); if (ac.state === 'suspended') ac.resume(); } catch (e) { ac = null; } return ac; }
  function tone(kind) {
    var a = audio(); if (!a) return; var t = TONES[kind] || TONES.beep;
    t[1].forEach(function (f, i) { var o = a.createOscillator(), g = a.createGain(); o.type = t[2]; o.frequency.value = f; o.connect(g); g.connect(a.destination); var s = a.currentTime + i * 0.28; g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.25, s + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.26); o.start(s); o.stop(s + 0.3); });
  }
  function save() { U.store.set(KEY, alarms); }
  function fmt12(t) { var p = t.split(':'), h = +p[0]; return (h % 12 || 12) + ':' + p[1] + ' ' + (h < 12 ? 'AM' : 'PM'); }
  function list() {
    $('#al-list').innerHTML = alarms.length ? alarms.map(function (a, i) {
      return '<div class="al-row' + (a.on ? '' : ' off') + '"><label class="al-sw"><input type="checkbox" data-on="' + i + '"' + (a.on ? ' checked' : '') + ' aria-label="Turn alarm ' + fmt12(a.time) + ' on or off"><span></span></label><div class="al-info"><b>' + fmt12(a.time) + '</b><small>' + U.esc(a.label || 'Alarm') + ' · ' + (a.days.length ? a.days.map(function (d) { return DAYS[d]; }).join(', ') : 'Once') + '</small></div><button type="button" class="btn btn-ghost btn-sm" data-del="' + i + '" aria-label="Delete alarm ' + fmt12(a.time) + '">Delete</button></div>';
    }).join('') : '<div class="result-empty">No alarms yet. Set a time above and press Add alarm.</div>';
  }
  function stop() { clearInterval(ringIv); ringIv = 0; ringing = null; var m = root.querySelector('.ring-modal'); if (m) m.remove(); document.title = title; }
  function ring(a, i) {
    ringing = a; tone(a.tone); clearInterval(ringIv); ringIv = setInterval(function () { tone(a.tone); document.title = document.title === title ? '⏰ ' + (a.label || 'Alarm') : title; }, 1500);
    root.insertAdjacentHTML('beforeend', '<div class="ring-modal" role="alertdialog" aria-label="Alarm"><div><b>⏰ ' + U.esc(a.label || 'Alarm') + '</b><span>' + fmt12(a.time) + '</span><div class="btn-row" style="justify-content:center"><button type="button" class="btn btn-ghost" id="al-snooze">Snooze 5 min</button><button type="button" class="btn btn-primary" id="al-stop">Stop</button></div></div></div>');
    root.querySelector('#al-stop').onclick = stop; root.querySelector('#al-stop').focus();
    root.querySelector('#al-snooze').onclick = function () { stop(); var d = new Date(Date.now() + 5 * 60000); alarms.push({ time: U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes()), label: (a.label || 'Alarm') + ' (snoozed)', days: [], tone: a.tone, on: true }); save(); list(); };
    if (!a.days.length) { a.on = false; save(); list(); }
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification('GM Alarm Clock', { body: a.label || 'Alarm' }); } catch (e) {}
  }
  function check() {
    var d = new Date(), hm = U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes()), key = d.toDateString() + hm;
    $('#al-now').textContent = hm + ':' + U.pad2(d.getSeconds());
    if (ringing) return;
    alarms.forEach(function (a, i) {
      if (!a.on || a.time !== hm || (a.days.length && a.days.indexOf(d.getDay()) < 0) || fired[i + key]) return;
      fired[i + key] = 1; ring(a, i);
    });
  }
  $('#al-days').addEventListener('click', function (e) { var b = e.target.closest('[data-d]'); if (!b) return; var d = +b.getAttribute('data-d'); days[d] = !days[d]; b.setAttribute('aria-pressed', !!days[d]); });
  $('#al-add').addEventListener('click', function () {
    var t = $('#al-time').value; if (!/^\d\d:\d\d$/.test(t)) { $('#al-err').textContent = 'Choose an alarm time.'; return; }
    if (alarms.length >= 20) { $('#al-err').textContent = 'You can keep up to 20 alarms. Delete one first.'; return; }
    $('#al-err').textContent = ''; audio();
    alarms.push({ time: t, label: $('#al-label').value.trim(), days: Object.keys(days).filter(function (k) { return days[k]; }).map(Number).sort(), tone: $('#al-tone').value, on: true });
    save(); list(); $('#al-label').value = ''; U.toast('Alarm set for ' + fmt12(t)); check();
  });
  $('#al-test').addEventListener('click', function () { tone($('#al-tone').value); });
  $('#al-list').addEventListener('click', function (e) { var b = e.target.closest('[data-del]'); if (b) { alarms.splice(+b.getAttribute('data-del'), 1); save(); list(); } });
  $('#al-list').addEventListener('change', function (e) { var c = e.target.closest('[data-on]'); if (c) { alarms[+c.getAttribute('data-on')].on = c.checked; save(); list(); } });
  list(); check(); var iv = setInterval(function () { if (!document.body.contains(root)) clearInterval(iv); else check(); }, 1000);
  window.addEventListener('pagehide', function () { document.title = title; });
};
