/* Pomodoro Timer: focus and break sessions with a progress ring, sound and optional notification.
   Uses timestamps, so it stays accurate even when the tab is in the background. Settings stay in this browser. */
NiaziTools['pomodoro-timer'] = function (root, U) {
  var KEY = 'gm.pomodoro.v1';
  var cfg = U.store.get(KEY, { work: 25, short: 5, long: 15, every: 4, sound: true, notify: false });
  var MODES = { work: 'Focus', short: 'Short break', long: 'Long break' };
  var mode = 'work', remaining = cfg.work * 60000, endAt = 0, timer = 0, done = 0, title = document.title;
  root.innerHTML =
    '<div class="pomo-modes" role="tablist" aria-label="Session type">' + Object.keys(MODES).map(function (m) { return '<button type="button" class="chip" role="tab" data-m="' + m + '" aria-pressed="' + (m === 'work') + '">' + MODES[m] + '</button>'; }).join('') + '</div>' +
    '<div class="pomo-wrap"><svg class="pomo-ring" viewBox="0 0 220 220" aria-hidden="true"><circle cx="110" cy="110" r="98" class="pomo-track"/><circle cx="110" cy="110" r="98" class="pomo-bar" id="pm-bar"/></svg>' +
    '<div class="pomo-center"><div class="pomo-time" id="pm-time" role="timer" aria-live="off">25:00</div><div class="pomo-label" id="pm-label">Focus</div></div></div>' +
    '<div class="tool-actions" style="justify-content:center"><button type="button" class="btn btn-primary" id="pm-start">Start</button><button type="button" class="btn btn-ghost" id="pm-reset">Reset</button><button type="button" class="btn btn-ghost" id="pm-skip">Skip</button></div>' +
    '<p class="small muted" style="text-align:center" id="pm-count" aria-live="polite"></p>' +
    '<details class="faq"><summary>Timer settings</summary><div class="form-grid" style="padding:4px 0 14px">' +
    '<div class="field"><label for="pm-w">Focus (minutes)</label><input type="text" inputmode="numeric" id="pm-w" value="' + cfg.work + '"></div>' +
    '<div class="field"><label for="pm-s">Short break (minutes)</label><input type="text" inputmode="numeric" id="pm-s" value="' + cfg.short + '"></div>' +
    '<div class="field"><label for="pm-l">Long break (minutes)</label><input type="text" inputmode="numeric" id="pm-l" value="' + cfg.long + '"></div>' +
    '<div class="field"><label for="pm-e">Long break after</label><select id="pm-e">' + [2, 3, 4, 5, 6].map(function (n) { return '<option value="' + n + '"' + (n === cfg.every ? ' selected' : '') + '>' + n + ' focus sessions</option>'; }).join('') + '</select></div>' +
    '<div class="field check"><input type="checkbox" id="pm-snd"' + (cfg.sound ? ' checked' : '') + '><label for="pm-snd">Play a sound when time is up</label></div>' +
    '<div class="field check"><input type="checkbox" id="pm-ntf"' + (cfg.notify ? ' checked' : '') + '><label for="pm-ntf">Show a notification when time is up</label></div></div></details>';
  var $ = function (s) { return root.querySelector(s); };
  var bar = $('#pm-bar'), C = 2 * Math.PI * 98;
  bar.style.strokeDasharray = C;
  function total() { return cfg[mode] * 60000; }
  function fmt(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); return U.pad2(Math.floor(s / 60)) + ':' + U.pad2(s % 60); }
  function paint() {
    var ms = endAt ? endAt - Date.now() : remaining;
    $('#pm-time').textContent = fmt(ms);
    bar.style.strokeDashoffset = C * (1 - Math.max(0, ms) / total());
    $('#pm-label').textContent = MODES[mode];
    root.setAttribute('data-mode', mode);
    document.title = endAt ? fmt(ms) + ' · ' + MODES[mode] : title;
    $('#pm-count').textContent = done ? 'Focus sessions completed: ' + done : 'Complete ' + cfg.every + ' focus sessions to earn a long break.';
  }
  function beep() {
    if (!cfg.sound) return;
    try {
      var A = window.AudioContext || window.webkitAudioContext, ac = new A();
      [0, 0.25, 0.5].forEach(function (t) {
        var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.0001, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(0.25, ac.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + 0.2); o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.22);
      });
      setTimeout(function () { ac.close(); }, 1200);
    } catch (e) { /* sound not available */ }
  }
  function notify(msg) {
    if (!cfg.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
    try { new Notification('GM Pomodoro Timer', { body: msg }); } catch (e) {}
  }
  function setMode(m, keepDone) {
    pause(); mode = m; remaining = total();
    root.querySelectorAll('.pomo-modes .chip').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-m') === m); });
    if (!keepDone && m === 'work') { /* manual switch keeps the count */ }
    paint();
  }
  function finish() {
    pause(); beep();
    if (mode === 'work') { done++; var next = done % cfg.every === 0 ? 'long' : 'short'; notify('Focus session done. Time for a ' + MODES[next].toLowerCase() + '.'); setMode(next, true); }
    else { notify('Break over. Ready to focus?'); setMode('work', true); }
    U.toast(mode === 'work' ? 'Break over — time to focus' : 'Great work — take a break');
  }
  function loop() { var left = endAt - Date.now(); if (left <= 0) { finish(); return; } paint(); }
  function start() { if (endAt) return; endAt = Date.now() + remaining; timer = setInterval(loop, 250); $('#pm-start').textContent = 'Pause'; paint(); }
  function pause() { if (!endAt) return; remaining = Math.max(0, endAt - Date.now()); endAt = 0; clearInterval(timer); $('#pm-start').textContent = 'Start'; paint(); }
  $('#pm-start').addEventListener('click', function () { endAt ? pause() : start(); });
  $('#pm-reset').addEventListener('click', function () { pause(); remaining = total(); paint(); });
  // Skipping moves on without counting the session as completed.
  $('#pm-skip').addEventListener('click', function () { setMode(mode === 'work' ? 'short' : 'work', true); });
  root.querySelector('.pomo-modes').addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (b) setMode(b.getAttribute('data-m')); });
  function readSettings() {
    var n = function (id, def, max) { var v = parseInt($(id).value, 10); return v >= 1 && v <= max ? v : def; };
    cfg.work = n('#pm-w', 25, 180); cfg.short = n('#pm-s', 5, 60); cfg.long = n('#pm-l', 15, 90); cfg.every = +$('#pm-e').value;
    cfg.sound = $('#pm-snd').checked; cfg.notify = $('#pm-ntf').checked; U.store.set(KEY, cfg);
    if (!endAt) { remaining = total(); paint(); }
  }
  ['#pm-w', '#pm-s', '#pm-l'].forEach(function (id) { $(id).addEventListener('change', readSettings); });
  $('#pm-e').addEventListener('change', readSettings); $('#pm-snd').addEventListener('change', readSettings);
  $('#pm-ntf').addEventListener('change', function () {
    var box = this;
    if (box.checked && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then(function (p) { if (p !== 'granted') { box.checked = false; U.toast('Notifications are blocked in your browser settings'); } readSettings(); });
    } else readSettings();
  });
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && !/input|textarea|select|button/i.test(e.target.tagName)) { e.preventDefault(); endAt ? pause() : start(); }
  });
  window.addEventListener('pagehide', function () { document.title = title; });
  paint();
};
