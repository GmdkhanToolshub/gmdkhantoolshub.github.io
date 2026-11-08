/* World Clock: live time in many cities, with the difference from your own time. Cities are saved in this browser. */
NiaziTools['world-clock'] = function (root, U) {
  var CITIES = [['Karachi', 'Asia/Karachi'], ['Lahore', 'Asia/Karachi'], ['Islamabad', 'Asia/Karachi'], ['Dubai', 'Asia/Dubai'], ['Riyadh', 'Asia/Riyadh'], ['Makkah', 'Asia/Riyadh'], ['Doha', 'Asia/Qatar'], ['Kuwait City', 'Asia/Kuwait'], ['Tehran', 'Asia/Tehran'], ['Istanbul', 'Europe/Istanbul'], ['Cairo', 'Africa/Cairo'], ['Lagos', 'Africa/Lagos'], ['Nairobi', 'Africa/Nairobi'], ['Johannesburg', 'Africa/Johannesburg'], ['London', 'Europe/London'], ['Dublin', 'Europe/Dublin'], ['Paris', 'Europe/Paris'], ['Berlin', 'Europe/Berlin'], ['Madrid', 'Europe/Madrid'], ['Rome', 'Europe/Rome'], ['Moscow', 'Europe/Moscow'], ['New Delhi', 'Asia/Kolkata'], ['Mumbai', 'Asia/Kolkata'], ['Dhaka', 'Asia/Dhaka'], ['Colombo', 'Asia/Colombo'], ['Kathmandu', 'Asia/Kathmandu'], ['Bangkok', 'Asia/Bangkok'], ['Kuala Lumpur', 'Asia/Kuala_Lumpur'], ['Singapore', 'Asia/Singapore'], ['Jakarta', 'Asia/Jakarta'], ['Hong Kong', 'Asia/Hong_Kong'], ['Beijing', 'Asia/Shanghai'], ['Seoul', 'Asia/Seoul'], ['Tokyo', 'Asia/Tokyo'], ['Perth', 'Australia/Perth'], ['Sydney', 'Australia/Sydney'], ['Auckland', 'Pacific/Auckland'], ['Honolulu', 'Pacific/Honolulu'], ['Anchorage', 'America/Anchorage'], ['Los Angeles', 'America/Los_Angeles'], ['Vancouver', 'America/Vancouver'], ['Denver', 'America/Denver'], ['Chicago', 'America/Chicago'], ['Toronto', 'America/Toronto'], ['New York', 'America/New_York'], ['Mexico City', 'America/Mexico_City'], ['Sao Paulo', 'America/Sao_Paulo'], ['Buenos Aires', 'America/Argentina/Buenos_Aires'], ['UTC', 'UTC']];
  var KEY = 'gm.worldclock.v1', saved = U.store.get(KEY, ['Karachi', 'London', 'New York', 'Dubai', 'Tokyo', 'Sydney']);
  function city(n) { return CITIES.filter(function (c) { return c[0] === n; })[0]; }
  root.innerHTML = '<div class="form-grid"><div class="field"><label for="wc-add">Add a city</label><select id="wc-add"></select></div><div class="field" style="align-self:end"><button type="button" class="btn btn-primary" id="wc-btn">Add city</button></div></div>' +
    '<div class="wc-grid" id="wc-grid"></div><p class="small muted" id="wc-me"></p>';
  var $ = function (s) { return root.querySelector(s); };
  function offsetMin(tz, d) {
    var a = new Date(d.toLocaleString('en-US', { timeZone: tz })), b = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
    return Math.round((a - b) / 60000);
  }
  function fillSelect() { $('#wc-add').innerHTML = CITIES.filter(function (c) { return saved.indexOf(c[0]) < 0; }).map(function (c) { return '<option>' + U.esc(c[0]) + '</option>'; }).join('') || '<option value="">All cities added</option>'; }
  function draw() {
    $('#wc-grid').innerHTML = saved.map(function (n) {
      var c = city(n); if (!c) return '';
      return '<div class="wc-card" data-city="' + U.esc(n) + '"><button type="button" class="wc-x" data-del="' + U.esc(n) + '" aria-label="Remove ' + U.esc(n) + '">✕</button><div class="wc-name">' + U.esc(n) + '</div><div class="wc-time" data-t></div><div class="wc-date small muted" data-d></div><div class="wc-off small" data-o></div></div>';
    }).join('');
    fillSelect(); tick();
  }
  function tick() {
    var d = new Date(), me = -d.getTimezoneOffset();
    $('#wc-me').textContent = 'Your device time zone: ' + Intl.DateTimeFormat().resolvedOptions().timeZone + ' (now ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ')';
    [].forEach.call(root.querySelectorAll('.wc-card'), function (el) {
      var c = city(el.getAttribute('data-city')); if (!c) return;
      var hr = +new Intl.DateTimeFormat('en-GB', { timeZone: c[1], hour: '2-digit', hour12: false }).format(d) % 24;
      el.querySelector('[data-t]').textContent = new Intl.DateTimeFormat('en-GB', { timeZone: c[1], hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d);
      el.querySelector('[data-d]').textContent = new Intl.DateTimeFormat('en-GB', { timeZone: c[1], weekday: 'short', day: 'numeric', month: 'short' }).format(d);
      var diff = offsetMin(c[1], d) - me, ah = Math.abs(diff) / 60, txt = diff === 0 ? 'Same time as you' : (Number.isInteger(ah) ? ah : ah.toFixed(1)) + ' h ' + (diff > 0 ? 'ahead of you' : 'behind you');
      el.querySelector('[data-o]').textContent = (hr >= 6 && hr < 18 ? '☀ Day · ' : '☾ Night · ') + txt;
      el.classList.toggle('night', !(hr >= 6 && hr < 18));
    });
  }
  $('#wc-btn').addEventListener('click', function () { var v = $('#wc-add').value; if (!v) return; saved.push(v); U.store.set(KEY, saved); draw(); });
  $('#wc-grid').addEventListener('click', function (e) { var b = e.target.closest('[data-del]'); if (!b) return; saved = saved.filter(function (n) { return n !== b.getAttribute('data-del'); }); U.store.set(KEY, saved); draw(); });
  draw(); var iv = setInterval(function () { if (!document.body.contains(root)) clearInterval(iv); else tick(); }, 1000);
};
