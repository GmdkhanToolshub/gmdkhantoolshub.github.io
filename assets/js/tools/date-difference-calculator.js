NiaziTools['date-difference-calculator'] = function (root, U) {
  root.innerHTML = '<div id="dd-body"></div>';
  var bodies = [
    function () {
      U.mount(root.querySelector('#dd-body'), {
        fields: [{ id: 's', label: 'Start date', type: 'date', value: '' }, { id: 'e', label: 'End date', type: 'date', value: U.today() }, { id: 'inc', label: 'Count the end date as a day (inclusive)', type: 'checkbox', value: false, wide: true }],
        onInput: function (v, ctx) {
          if (!v.s || !v.e) return ctx.empty('Choose a start date and an end date.');
          var a = U.parseDate(v.s), b = U.parseDate(v.e); if (!a || !b) return ctx.error('Please enter valid dates.');
          var rev = a > b; if (rev) { var t = a; a = b; b = t; }
          var days = U.dayDiff(a, b) + (v.inc ? 1 : 0), ymd = U.ymd(a, b);
          var wd = 0, cur = new Date(a.getTime()), end = U.dayDiff(a, b) + (v.inc ? 1 : 0);
          for (var i = 0; i < end; i++) { var dow = new Date(a.getFullYear(), a.getMonth(), a.getDate() + i).getDay(); if (dow !== 0 && dow !== 6) wd++; }
          ctx.html(U.grid([U.box('Difference', ymd.y + ' years, ' + ymd.m + ' months, ' + ymd.d + ' days', '', true), U.box('Total days', U.fmt(days, 0)), U.box('Total weeks', U.fmt(days / 7, 1)), U.box('Weekdays (Mon–Fri)', U.fmt(wd, 0)), U.box('Weekend days', U.fmt(days - wd, 0)), U.box('Total hours', U.fmt(days * 24, 0))]) +
            (rev ? '<p class="result-note">Your start date was after the end date, so the dates were swapped for this calculation.</p>' : '') + '<p class="result-note">Weekdays exclude Saturdays and Sundays but do not account for public holidays.</p>');
        }
      });
    },
    function () {
      U.mount(root.querySelector('#dd-body'), {
        fields: [{ id: 's', label: 'Start date', type: 'date', value: U.today() }, { id: 'op', label: 'Operation', type: 'select', options: [{ value: 'add', label: 'Add' }, { value: 'sub', label: 'Subtract' }], value: 'add' }, { id: 'n', label: 'Amount', type: 'number', value: '30' }, { id: 'u', label: 'Unit', type: 'select', options: ['days', 'weeks', 'months', 'years', 'business days'], value: 'days' }],
        onInput: function (v, ctx) {
          var s = U.parseDate(v.s); if (!s) return ctx.error('Please enter a valid start date.');
          var n = U.num(v.n); if (!U.isNum(n) || n < 0 || Math.floor(n) !== n || n > 100000) return ctx.error('Amount must be a whole number from 0 to 100,000.');
          var sign = v.op === 'add' ? 1 : -1, r;
          if (v.u === 'days') r = new Date(s.getFullYear(), s.getMonth(), s.getDate() + sign * n);
          else if (v.u === 'weeks') r = new Date(s.getFullYear(), s.getMonth(), s.getDate() + sign * n * 7);
          else if (v.u === 'months' || v.u === 'years') {
            var months = v.u === 'years' ? n * 12 : n, tm = s.getMonth() + sign * months, y = s.getFullYear() + Math.floor(tm / 12), m = ((tm % 12) + 12) % 12;
            r = new Date(y, m, Math.min(s.getDate(), U.daysInMonth(y, m)));
          } else { r = new Date(s.getFullYear(), s.getMonth(), s.getDate()); var left = n; while (left > 0) { r.setDate(r.getDate() + sign); if (r.getDay() !== 0 && r.getDay() !== 6) left--; } }
          if (isNaN(r)) return ctx.error('That produces a date outside the supported range.');
          ctx.html(U.grid([U.box('Resulting date', r.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), '', true), U.box('ISO format', r.getFullYear() + '-' + U.pad2(r.getMonth() + 1) + '-' + U.pad2(r.getDate()))]));
        }
      });
    }
  ];
  U.tabs(root, ['Difference between dates', 'Add / subtract time'], function (i) { bodies[i](); });
  bodies[0]();
};
