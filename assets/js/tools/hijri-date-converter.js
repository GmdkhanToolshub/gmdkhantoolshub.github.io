NiaziTools['hijri-date-converter'] = function (root, U) {
  var MONTHS_EN = ['Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani", 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qa'dah", 'Dhu al-Hijjah'];
  var MONTHS_UR = ['محرم', 'صفر', 'ربیع الاول', 'ربیع الثانی', 'جمادی الاول', 'جمادی الثانی', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذوالقعدہ', 'ذوالحجہ'];
  var DAYS_UR = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];
  var fmt;
  try { fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }); } catch (e) { fmt = null; }
  function toHijri(date) {
    var p = {}; fmt.formatToParts(date).forEach(function (x) { if (x.type !== 'literal') p[x.type] = parseInt(x.value, 10); });
    return { y: p.year, m: p.month, d: p.day };
  }
  function utc(y, m, d) { return new Date(Date.UTC(y, m, d)); }
  function fromHijri(hy, hm, hd) {
    // Estimate, then search nearby days for the exact Umm al-Qura match.
    var est = Math.round((hy - 1) * 354.36707 + (hm - 1) * 29.530589 + hd + 227014);
    var base = utc(1970, 0, 1).getTime() + (est - 719163) * 86400000;
    for (var off = -40; off <= 40; off++) {
      var dt = new Date(base + off * 86400000), h = toHijri(dt);
      if (h.y === hy && h.m === hm && h.d === hd) return dt;
    }
    return null;
  }
  function longG(d) { return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  function hText(h) { return h.d + ' ' + MONTHS_EN[h.m - 1] + ' ' + h.y + ' AH'; }
  function hUrdu(h, dow) { return DAYS_UR[dow] + '، ' + h.d + ' ' + MONTHS_UR[h.m - 1] + ' ' + h.y + ' ہجری'; }
  var NOTE = '<p class="result-note">Uses the Umm al-Qura calendar. In Pakistan and many other countries, Islamic months begin after a local moon sighting, so the actual date can differ by 1 or 2 days. Confirm important dates such as Ramadan and Eid with your local announcement.</p>';
  if (!fmt) { root.innerHTML = '<p class="inline-error">Your browser doesn\'t support the Islamic calendar. Please update it, or try Chrome, Edge, Firefox or Safari.</p>'; return; }
  root.innerHTML = '<div id="hj-today" class="tool-result" style="margin-bottom:16px"></div><div id="hj-body"></div>';
  var now = new Date(), t0 = utc(now.getFullYear(), now.getMonth(), now.getDate()), th = toHijri(t0);
  root.querySelector('#hj-today').innerHTML = U.grid([U.box('Today (Hijri)', U.esc(hText(th)), '', true), U.box('آج کی تاریخ', '<span dir="rtl" lang="ur">' + U.esc(hUrdu(th, t0.getUTCDay())) + '</span>')]);
  var bodies = [
    function () {
      U.mount(root.querySelector('#hj-body'), {
        fields: [{ id: 'g', label: 'Gregorian date', type: 'date', value: U.today() }],
        onInput: function (v, c) {
          var d = U.parseDate(v.g); if (!d) return c.empty('Choose a date.');
          var g = utc(d.getFullYear(), d.getMonth(), d.getDate()), h = toHijri(g);
          if (!h.y) return c.error('That date is outside the supported range.');
          c.html(U.grid([U.box('Hijri date', U.esc(hText(h)), '', true), U.box('اردو میں', '<span dir="rtl" lang="ur">' + U.esc(hUrdu(h, g.getUTCDay())) + '</span>'), U.box('Gregorian', U.esc(longG(g)))]) + NOTE);
        }
      });
    },
    function () {
      var years = []; for (var y = th.y - 120; y <= th.y + 30; y++) years.push(String(y));
      U.mount(root.querySelector('#hj-body'), {
        fields: [{ id: 'd', label: 'Day', type: 'select', options: Array.from({ length: 30 }, function (_, i) { return String(i + 1); }), value: String(th.d) },
          { id: 'm', label: 'Month', type: 'select', options: MONTHS_EN.map(function (n, i) { return { value: String(i + 1), label: n + ' (' + MONTHS_UR[i] + ')' }; }), value: String(th.m) },
          { id: 'y', label: 'Year (AH)', type: 'select', options: years, value: String(th.y) }],
        onInput: function (v, c) {
          var hy = +v.y, hm = +v.m, hd = +v.d, g = fromHijri(hy, hm, hd);
          if (!g) return c.error('This month has 29 days in the Umm al-Qura calendar for that year. Choose day 29 or earlier.');
          c.html(U.grid([U.box('Gregorian date', U.esc(longG(g)), '', true), U.box('Hijri', U.esc(hd + ' ' + MONTHS_EN[hm - 1] + ' ' + hy + ' AH')), U.box('اردو میں', '<span dir="rtl" lang="ur">' + U.esc(hUrdu({ y: hy, m: hm, d: hd }, g.getUTCDay())) + '</span>')]) + NOTE);
        }
      });
    },
    function () {
      U.mount(root.querySelector('#hj-body'), {
        fields: [{ id: 'dob', label: 'Date of birth (Gregorian)', type: 'date', value: '' }],
        onInput: function (v, c) {
          var d = U.parseDate(v.dob); if (!d) return c.empty('Choose a date of birth to see the Hijri birth date and age in Hijri years.');
          var g = utc(d.getFullYear(), d.getMonth(), d.getDate()); if (g > t0) return c.error('The date of birth must be in the past.');
          var hb = toHijri(g), age = th.y - hb.y - ((th.m < hb.m || (th.m === hb.m && th.d < hb.d)) ? 1 : 0);
          var gAge = now.getFullYear() - d.getFullYear() - ((now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) ? 1 : 0);
          c.html(U.grid([U.box('Hijri birth date', U.esc(hText(hb)), '', true), U.box('Age in Hijri years', U.fmt(age, 0)), U.box('Age in Gregorian years', U.fmt(gAge, 0))]) +
            '<p class="result-note">A Hijri year is about 11 days shorter than a Gregorian year, so your Hijri age is usually higher.</p>' + NOTE);
        }
      });
    }
  ];
  U.tabs(root, ['Gregorian → Hijri', 'Hijri → Gregorian', 'Hijri birthday & age'], function (i) { bodies[i](); });
  bodies[0]();
  NiaziTools['hijri-date-converter'].api = { toHijri: toHijri, fromHijri: fromHijri };
};
