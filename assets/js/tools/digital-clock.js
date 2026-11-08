/* Digital Clock: live time and date in any time zone, 12 or 24 hour, with a full-screen mode. */
NiaziTools['digital-clock'] = function (root, U) {
  var KEY = 'gm.clock.v1', st = U.store.get(KEY, { h24: false, sec: true, date: true, tz: 'local', theme: 'night' });
  var ZONES = [['local', 'My device time zone'], ['UTC', 'UTC'], ['Asia/Karachi', 'Karachi, Lahore, Islamabad'], ['Asia/Dubai', 'Dubai'], ['Asia/Riyadh', 'Riyadh, Makkah'], ['Europe/London', 'London'], ['Europe/Paris', 'Paris, Berlin'], ['Europe/Istanbul', 'Istanbul'], ['America/New_York', 'New York'], ['America/Chicago', 'Chicago'], ['America/Los_Angeles', 'Los Angeles'], ['Asia/Kolkata', 'India'], ['Asia/Dhaka', 'Dhaka'], ['Asia/Singapore', 'Singapore'], ['Asia/Shanghai', 'China'], ['Asia/Tokyo', 'Tokyo'], ['Australia/Sydney', 'Sydney'], ['Pacific/Auckland', 'Auckland']];
  root.innerHTML = '<div class="clock-face" id="dc-face" data-theme-name="' + st.theme + '"><div class="clock-time" id="dc-time" role="timer" aria-live="off">--:--:--</div><div class="clock-date" id="dc-date"></div><div class="clock-zone small" id="dc-zone"></div></div>' +
    '<div class="tool-actions" style="justify-content:center"><button type="button" class="btn btn-primary" id="dc-full">Full screen</button></div>' +
    '<div class="form-grid" style="margin-top:6px"><div class="field"><label for="dc-tz">Time zone</label><select id="dc-tz">' + ZONES.map(function (z) { return '<option value="' + z[0] + '"' + (z[0] === st.tz ? ' selected' : '') + '>' + U.esc(z[1]) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label for="dc-theme">Colour</label><select id="dc-theme">' + [['night', 'Night (dark)'], ['day', 'Day (light)'], ['neon', 'Neon green'], ['amber', 'Amber']].map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === st.theme ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select></div>' +
    '<div class="field check"><input type="checkbox" id="dc-24"' + (st.h24 ? ' checked' : '') + '><label for="dc-24">24-hour format</label></div>' +
    '<div class="field check"><input type="checkbox" id="dc-sec"' + (st.sec ? ' checked' : '') + '><label for="dc-sec">Show seconds</label></div>' +
    '<div class="field check"><input type="checkbox" id="dc-dt"' + (st.date ? ' checked' : '') + '><label for="dc-dt">Show date</label></div></div>';
  var $ = function (s) { return root.querySelector(s); }, face = $('#dc-face');
  function zoneOpt() { return st.tz === 'local' ? {} : { timeZone: st.tz }; }
  function tick() {
    var d = new Date(), o = zoneOpt();
    var t = new Intl.DateTimeFormat('en-GB', Object.assign({ hour: '2-digit', minute: '2-digit', second: st.sec ? '2-digit' : undefined, hour12: !st.h24 }, o)).format(d);
    $('#dc-time').textContent = t.toUpperCase().replace(/\s?(AM|PM)$/, ' $1');
    $('#dc-date').textContent = st.date ? new Intl.DateTimeFormat('en-GB', Object.assign({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, o)).format(d) : '';
    var zn = st.tz === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : st.tz;
    $('#dc-zone').textContent = zn + ' · ' + new Intl.DateTimeFormat('en-GB', Object.assign({ timeZoneName: 'short' }, o)).formatToParts(d).filter(function (p) { return p.type === 'timeZoneName'; }).map(function (p) { return p.value; }).join('');
  }
  function save() { U.store.set(KEY, st); }
  $('#dc-tz').addEventListener('change', function () { st.tz = this.value; save(); tick(); });
  $('#dc-theme').addEventListener('change', function () { st.theme = this.value; face.setAttribute('data-theme-name', st.theme); save(); });
  $('#dc-24').addEventListener('change', function () { st.h24 = this.checked; save(); tick(); });
  $('#dc-sec').addEventListener('change', function () { st.sec = this.checked; save(); tick(); });
  $('#dc-dt').addEventListener('change', function () { st.date = this.checked; save(); tick(); });
  $('#dc-full').addEventListener('click', function () {
    var el = face; if (document.fullscreenElement) { document.exitFullscreen(); return; }
    (el.requestFullscreen || el.webkitRequestFullscreen || function () { U.toast('Full screen is not available in this browser'); }).call(el);
  });
  tick(); var iv = setInterval(function () { if (!document.body.contains(root)) clearInterval(iv); else tick(); }, 250);
};
