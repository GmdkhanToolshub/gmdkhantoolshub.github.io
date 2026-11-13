NiaziTools['final-settlement-calculator'] = function (root, U) {
  /* Daily rate = gross monthly salary / 30 (calendar-month basis) or / 26 (working-day basis). Everything else is days x daily rate.
     The joining, resignation and last working dates only supply the day counts (service period, days worked in the last month, notice served); they add no other rule. */
  var CUR = ['PKR', 'USD', 'AED', 'SAR', 'GBP', 'EUR', 'INR', 'QAR', 'KWD', 'OMR', 'BHD', 'CAD', 'AUD'];
  var MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var last = null;
  function pd(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim()); if (!m) return null; var d = new Date(+m[1], +m[2] - 1, +m[3]); return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null; }
  function fd(d) { return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function diffDays(a, b) { return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000); }
  /* length of service from the joining date to the day after the last working day (so both days count) as years, months, days */
  function span(a, b) {
    var y = b.getFullYear() - a.getFullYear(), m = b.getMonth() - a.getMonth(), d = b.getDate() - a.getDate();
    if (d < 0) { m--; d += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    return { y: y, m: m, d: d };
  }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  /* count days from a to b inclusive; with a weekly off day set (26-day basis) those days are skipped */
  function countDays(a, b, off) { var n = 0; for (var d = a; d <= b; d = addDays(d, 1)) { if (off >= 0 && d.getDay() === off) continue; n++; } return n; }

  function build(v, ctx) {
    ctx.html('');
    if (String(v.gross).trim() === '') { ctx.empty('Enter the gross monthly salary to see the final settlement.'); return null; }
    var gross = U.num(v.gross), div = v.basis === '26' ? 26 : 30;
    if (!(gross >= 0)) { ctx.error('Gross monthly salary must be a number of zero or more.'); return null; }
    var J = pd(v.join), RS = pd(v.resign), L = pd(v.last);
    if (v.join && !J) { ctx.error('Enter the joining date as a valid date.'); return null; }
    if (v.resign && !RS) { ctx.error('Enter the resignation date as a valid date.'); return null; }
    if (v.last && !L) { ctx.error('Enter the last working day as a valid date.'); return null; }
    if (J && L && L < J) { ctx.error('The last working day cannot be before the joining date.'); return null; }
    if (J && RS && RS < J) { ctx.error('The resignation date cannot be before the joining date.'); return null; }
    if (RS && L && L < RS) { ctx.error('The last working day cannot be before the resignation date.'); return null; }
    var offDay = div === 26 && v.off !== 'none' ? +v.off : -1;
    var notes = [], workedAuto = false, shortAuto = false, worked, short, service = null;
    if (String(v.worked).trim() === '') {
      if (L) { var first = new Date(L.getFullYear(), L.getMonth(), 1), start = J && J > first ? J : first; worked = countDays(start, L, offDay); workedAuto = true; } else worked = 0;
    } else worked = U.num(v.worked);
    var leave = U.num(v.leave || '0'), notice = U.num(v.notice || '0'), add = U.num(v.add || '0'), ded = U.num(v.ded || '0'), req = U.num(v.req || '0');
    var served = null;
    if (RS && L) served = diffDays(RS, L);
    if (String(v.short).trim() === '') {
      if (req > 0 && served != null) { short = Math.max(0, req - served); shortAuto = true; } else short = 0;
    } else short = U.num(v.short);
    var checks = [['Days worked in the last month', worked, 0, 31], ['Unused leave days', leave, 0, 365], ['Notice pay days owed by the employer', notice, 0, 365], ['Notice days not served', short, 0, 365], ['Required notice period', req, 0, 365]];
    for (var i = 0; i < checks.length; i++) { var c = checks[i]; if (!(c[1] >= c[2] && c[1] <= c[3])) { ctx.error(c[0] + ' must be between ' + c[2] + ' and ' + c[3] + '.'); return null; } }
    if (!(add >= 0) || !(ded >= 0)) { ctx.error('Other additions and deductions must be zero or more.'); return null; }
    if (J && L) service = span(J, addDays(L, 1));
    var gmult = U.num(v.gmult === '' || v.gmult == null ? '1' : v.gmult);
    if (!(gmult >= 0 && gmult <= 12)) { ctx.error('Gratuity months of gross salary per year must be between 0 and 12.'); return null; }
    /* gratuity = gross monthly salary x gratuity months per year x (years + months / 12 + days / 360 of service) */
    var gratYears = service ? service.y + service.m / 12 + service.d / 360 : 0, gratuity = 0, gratNote = '';
    if (v.grat !== 'no') {
      if (service) gratuity = gross * gmult * gratYears; else gratNote = ' Enter the joining date and the last working day to calculate gratuity.';
    }
    var rate = gross / div, cur = v.currency, m = function (n) { return U.money(n, cur); };
    var rows = [
      { k: 'Salary for ' + U.fmt(worked, 2) + ' days worked' + (workedAuto ? ' (from the dates)' : ''), amt: worked * rate, type: 'earn' },
      { k: 'Leave encashment (' + U.fmt(leave, 2) + ' days)', amt: leave * rate, type: 'earn' },
      { k: 'Gratuity (' + (service ? plural(service.y, 'year') + ', ' + plural(service.m, 'month') + ', ' + plural(service.d, 'day') + ' of service' : 'needs the dates') + (gmult !== 1 ? ' at ' + U.fmt(gmult, 2) + ' month(s) of gross per year' : '') + ')', amt: gratuity, type: 'earn' },
      { k: 'Notice pay owed by the employer (' + U.fmt(notice, 2) + ' days)', amt: notice * rate, type: 'earn' },
      { k: 'Other additions (bonus, allowance and so on)', amt: add, type: 'earn' },
      { k: 'Notice not served by the employee (' + U.fmt(short, 2) + ' days' + (shortAuto ? ', from the dates' : '') + ')', amt: short * rate, type: 'ded' },
      { k: 'Other deductions (advance, loan and so on)', amt: ded, type: 'ded' }
    ];
    if (v.grat === 'no') rows = rows.filter(function (r) { return r.k.indexOf('Gratuity') !== 0; });
    var earn = 0, dd = 0; rows.forEach(function (r) { if (r.type === 'earn') earn += r.amt; else dd += r.amt; });
    var net = earn - dd;
    last = { cur: cur, div: div, gross: gross, rate: rate, rows: rows, earn: earn, ded: dd, net: net, name: (v.name || '').trim(), J: J, RS: RS, L: L, service: service, served: served, req: req };
    var body = rows.map(function (r) { return ['<span>' + U.esc(r.k) + '</span>', (r.type === 'ded' ? '&minus; ' : '') + m(r.amt)]; });
    var info = [];
    if (J) info.push(['Joining date', U.esc(fd(J))]);
    if (RS) info.push(['Resignation date', U.esc(fd(RS))]);
    if (L) info.push(['Last working day', U.esc(fd(L))]);
    if (service) info.push(['Length of service', U.esc(plural(service.y, 'year') + ', ' + plural(service.m, 'month') + ', ' + plural(service.d, 'day'))]);
    if (served != null) info.push(['Notice served (resignation to last day)', U.esc(plural(served, 'day')) + (req > 0 ? ' of ' + U.esc(String(req)) + ' required' : '')]);
    var gratText = v.grat !== 'no' && service ? ' Gratuity = ' + m(gross) + (gmult !== 1 ? ' × ' + U.fmt(gmult, 2) : '') + ' × (' + service.y + ' years + ' + service.m + '/12 + ' + service.d + '/360) = ' + m(gratuity) + '.' : gratNote;
    var dayNote = gratText + (workedAuto ? ' Days worked are counted from ' + (J && L && J > new Date(L.getFullYear(), L.getMonth(), 1) ? 'the joining date' : '1 ' + MON[L.getMonth()]) + ' to the last working day' + (offDay >= 0 ? ', skipping the weekly off day' : '') + ', both days included.' : '');
    ctx.html(U.grid([U.box('Net final settlement', m(net), net < 0 ? 'neg' : '', true), U.box('Daily rate (' + (div === 30 ? 'gross / 30' : 'gross / 26') + ')', m(rate)), U.box('Total earnings', m(earn)), U.box('Total deductions', m(dd))]) +
      (info.length ? '<div style="margin-top:16px">' + U.table(['Service details', 'Date or period'], info, 9) + '</div>' : '') +
      '<div style="margin-top:16px">' + U.table(['Settlement item', 'Amount'], body) + '</div>' +
      '<p class="result-note">Daily rate = ' + m(gross) + ' &divide; ' + div + ' = ' + m(rate) + '. ' + (div === 30 ? 'The 30-day basis treats every month as 30 days.' : 'The 26-day basis counts working days only.') + U.esc(dayNote) +
      (net < 0 ? ' The deductions are larger than the earnings, so the employee owes the difference.' : '') + '</p>');
    return last;
  }
  function summary() {
    if (!last) return '';
    var m = function (n) { return U.money(n, last.cur); }, L = [];
    L.push('Final settlement' + (last.name ? ' for ' + last.name : ''));
    if (last.J) L.push('Joining date: ' + fd(last.J)); if (last.RS) L.push('Resignation date: ' + fd(last.RS)); if (last.L) L.push('Last working day: ' + fd(last.L));
    if (last.service) L.push('Length of service: ' + plural(last.service.y, 'year') + ', ' + plural(last.service.m, 'month') + ', ' + plural(last.service.d, 'day'));
    if (last.service) L.push('Service for gratuity: ' + last.service.y + ' years, ' + last.service.m + ' months, ' + last.service.d + ' days');
    L.push('Gross monthly salary: ' + m(last.gross) + ' | Divisor: ' + last.div + ' days | Daily rate: ' + m(last.rate));
    last.rows.forEach(function (r) { if (r.amt) L.push((r.type === 'ded' ? '- ' : '+ ') + r.k + ': ' + m(r.amt)); });
    L.push('Total earnings: ' + m(last.earn)); L.push('Total deductions: ' + m(last.ded)); L.push('Net final settlement: ' + m(last.net));
    return L.join('\n');
  }
  U.mount(root, {
    fields: [
      { id: 'name', label: 'Employee name (optional)', type: 'text', placeholder: 'For the printed or copied summary', value: '' },
      { id: 'gross', label: 'Gross monthly salary', type: 'number', placeholder: 'e.g. 90000', value: '' },
      { id: 'currency', label: 'Currency', type: 'select', options: CUR, value: 'PKR' },
      { id: 'basis', label: 'Divide gross salary by', type: 'select', options: [{ value: '30', label: '30 days (calendar month)' }, { value: '26', label: '26 days (working days)' }], value: '30', hint: 'Daily rate = gross salary divided by 30 or 26. Use what your contract or company policy says.' },
      { id: 'join', label: 'Joining date', type: 'date', value: '' },
      { id: 'resign', label: 'Resignation date (notice given)', type: 'date', value: '', hint: 'Optional. Used to count the notice served.' },
      { id: 'last', label: 'Last working day', type: 'date', value: '', hint: 'The last day the employee works.' },
      { id: 'req', label: 'Notice period required (days)', type: 'number', placeholder: 'e.g. 30', value: '', hint: 'From the contract. Used with the dates to find any notice not served.' },
      { id: 'off', label: 'Weekly off day (26-day basis only)', type: 'select', options: [{ value: '0', label: 'Sunday' }, { value: '5', label: 'Friday' }, { value: '6', label: 'Saturday' }, { value: 'none', label: 'None' }], value: '0', hint: 'Skipped when days worked are counted from the dates.' },
      { id: 'grat', label: 'Include gratuity', type: 'select', options: [{ value: 'yes', label: 'Yes: gross salary for each year of service' }, { value: 'no', label: 'No gratuity' }], value: 'yes', hint: 'Gratuity = gross monthly salary x the years, months and days of service, from the joining date to the last working day.' },
      { id: 'gmult', label: 'Gratuity: months of gross salary per year', type: 'number', value: '1', hint: '1 means one month of gross salary for each year of service. Change it if your policy differs.' },
      { id: 'worked', label: 'Days worked in the last month', type: 'number', placeholder: 'Leave blank to count from the dates', value: '', hint: 'Type a number to override the count from the dates.' },
      { id: 'leave', label: 'Unused leave days to pay out', type: 'number', value: '0' },
      { id: 'notice', label: 'Notice pay days owed by the employer', type: 'number', value: '0', hint: 'Only if the employer pays in place of notice.' },
      { id: 'short', label: 'Notice days not served by the employee', type: 'number', placeholder: 'Leave blank to count from the dates', value: '', hint: 'Deducted at the same daily rate. Type a number to override.' },
      { id: 'add', label: 'Other additions (optional)', type: 'number', value: '0', hint: 'A fixed amount such as a bonus or allowance.' },
      { id: 'ded', label: 'Other deductions (optional)', type: 'number', value: '0', hint: 'A fixed amount such as an advance or loan balance.' }
    ],
    actions: [
      { id: 'copy', label: 'Copy summary', kind: 'ghost', onClick: function (v, ctx) { if (!build(v, ctx)) { U.toast('Enter the salary first'); return; } U.copy(summary(), 'Summary copied'); } },
      { id: 'print', label: 'Print', kind: 'ghost', onClick: function (v, ctx) { if (!build(v, ctx)) { U.toast('Enter the salary first'); return; } window.print(); } }
    ],
    onInput: function (v, ctx) { build(v, ctx); }
  });
};
