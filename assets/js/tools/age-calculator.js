NiaziTools['age-calculator'] = function (root, U) {
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  U.mount(root, {
    fields: [{ id: 'dob', label: 'Date of birth', type: 'date', value: '' }, { id: 'asof', label: 'Age at date', type: 'date', value: U.today(), hint: 'Defaults to today. Change it to find age on any date.' }],
    onInput: function (v, ctx) {
      if (!v.dob) return ctx.empty('Select a date of birth to calculate age.');
      var b = U.parseDate(v.dob), a = U.parseDate(v.asof);
      if (!b) return ctx.error('Please enter a valid date of birth.');
      if (!a) return ctx.error('Please enter a valid "age at" date.');
      if (b > a) return ctx.error('Date of birth must be on or before the "age at" date.');
      var d = U.ymd(b, a), days = U.dayDiff(b, a);
      var next = new Date(a.getFullYear(), b.getMonth(), b.getDate());
      if (b.getMonth() === 1 && b.getDate() === 29 && U.daysInMonth(a.getFullYear(), 1) === 28) next = new Date(a.getFullYear(), 1, 28);
      if (next < a) { var y = a.getFullYear() + 1; next = new Date(y, b.getMonth(), b.getDate()); if (b.getMonth() === 1 && b.getDate() === 29 && U.daysInMonth(y, 1) === 28) next = new Date(y, 1, 28); }
      var until = U.dayDiff(a, next);
      ctx.html(U.grid([U.box('Age', d.y + ' years, ' + d.m + ' months, ' + d.d + ' days', '', true), U.box('Total months', U.fmt(d.y * 12 + d.m, 0)), U.box('Total weeks', U.fmt(Math.floor(days / 7), 0)), U.box('Total days', U.fmt(days, 0)), U.box('Total hours', U.fmt(days * 24, 0)),
        U.box('Born on a', DAYS[b.getDay()]), U.box('Next birthday', until === 0 ? 'Today!' : 'in ' + U.fmt(until, 0) + ' day' + (until === 1 ? '' : 's')), U.box('Turning', String(d.y + (until === 0 ? 0 : 1)))]) +
        '<p class="result-note">Next birthday falls on ' + next.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '.</p>');
    }
  });
};
