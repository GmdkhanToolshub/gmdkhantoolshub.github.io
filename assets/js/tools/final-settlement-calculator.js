NiaziTools['final-settlement-calculator'] = function (root, U) {
  /* Daily rate = gross monthly salary / 30 (calendar-month basis) or / 26 (working-day basis). Everything else is days x daily rate. */
  var CUR = ['PKR', 'USD', 'AED', 'SAR', 'GBP', 'EUR', 'INR', 'QAR', 'KWD', 'OMR', 'BHD', 'CAD', 'AUD'];
  var last = null;
  function build(v, ctx) {
    var gross = U.num(v.gross), div = v.basis === '26' ? 26 : 30;
    if (String(v.gross).trim() === '') { ctx.empty('Enter the gross monthly salary to see the final settlement.'); return null; }
    var worked = U.num(v.worked || '0'), leave = U.num(v.leave || '0'), notice = U.num(v.notice || '0'), short = U.num(v.short || '0'), add = U.num(v.add || '0'), ded = U.num(v.ded || '0');
    if (!(gross >= 0)) { ctx.error('Gross monthly salary must be a number of zero or more.'); return null; }
    var checks = [['Days worked in the last month', worked, 0, 31], ['Unused leave days', leave, 0, 365], ['Notice pay days owed by the employer', notice, 0, 365], ['Notice days not served', short, 0, 365]];
    for (var i = 0; i < checks.length; i++) { var c = checks[i]; if (!(c[1] >= c[2] && c[1] <= c[3])) { ctx.error(c[0] + ' must be between ' + c[2] + ' and ' + c[3] + '.'); return null; } }
    if (!(add >= 0) || !(ded >= 0)) { ctx.error('Other additions and deductions must be zero or more.'); return null; }
    var rate = gross / div, cur = v.currency, m = function (n) { return U.money(n, cur); };
    var rows = [
      { k: 'Salary for ' + U.fmt(worked, 2) + ' days worked', amt: worked * rate, type: 'earn' },
      { k: 'Leave encashment (' + U.fmt(leave, 2) + ' days)', amt: leave * rate, type: 'earn' },
      { k: 'Notice pay owed by the employer (' + U.fmt(notice, 2) + ' days)', amt: notice * rate, type: 'earn' },
      { k: 'Other additions (bonus, allowance and so on)', amt: add, type: 'earn' },
      { k: 'Notice not served by the employee (' + U.fmt(short, 2) + ' days)', amt: short * rate, type: 'ded' },
      { k: 'Other deductions (advance, loan and so on)', amt: ded, type: 'ded' }
    ];
    var earn = 0, dd = 0; rows.forEach(function (r) { if (r.type === 'earn') earn += r.amt; else dd += r.amt; });
    var net = earn - dd;
    last = { cur: cur, div: div, gross: gross, rate: rate, rows: rows, earn: earn, ded: dd, net: net, name: (v.name || '').trim() };
    var body = rows.map(function (r) { return ['<span>' + U.esc(r.k) + '</span>', (r.type === 'ded' ? '&minus; ' : '') + m(r.amt)]; });
    ctx.html(U.grid([U.box('Net final settlement', m(net), net < 0 ? 'neg' : '', true), U.box('Daily rate (' + (div === 30 ? 'gross / 30' : 'gross / 26') + ')', m(rate)), U.box('Total earnings', m(earn)), U.box('Total deductions', m(dd))]) +
      '<div style="margin-top:16px">' + U.table(['Item', 'Amount'], body) + '</div>' +
      '<p class="result-note">Daily rate = ' + m(gross) + ' &divide; ' + div + ' = ' + m(rate) + '. ' + (div === 30 ? 'The 30-day basis treats every month as 30 days.' : 'The 26-day basis counts working days only (a six-day week).') +
      (net < 0 ? ' The deductions are larger than the earnings, so the employee owes the difference.' : '') + '</p>');
    return last;
  }
  function summary() {
    if (!last) return '';
    var m = function (n) { return U.money(n, last.cur); }, L = [];
    L.push('Final settlement' + (last.name ? ' for ' + last.name : ''));
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
      { id: 'worked', label: 'Days worked in the last month', type: 'number', value: '0', hint: 'Days since the last salary period up to the last working day.' },
      { id: 'leave', label: 'Unused leave days to pay out', type: 'number', value: '0' },
      { id: 'notice', label: 'Notice pay days owed by the employer', type: 'number', value: '0', hint: 'Only if the employer pays in place of notice.' },
      { id: 'short', label: 'Notice days not served by the employee', type: 'number', value: '0', hint: 'Deducted at the same daily rate.' },
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
