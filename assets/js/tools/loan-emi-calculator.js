NiaziTools['loan-emi-calculator'] = function (root, U) {
  var csv = '';
  var ctx = U.mount(root, {
    fields: [
      { id: 'p', label: 'Loan amount', type: 'number', placeholder: 'e.g. 2,500,000' },
      { id: 'r', label: 'Annual interest rate (%)', type: 'number', placeholder: 'e.g. 12.5' },
      { id: 't', label: 'Loan term', type: 'number', value: '5' },
      { id: 'tu', label: 'Term unit', type: 'select', options: ['years', 'months'], value: 'years' },
      { id: 'cur', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD', 'AUD'], value: 'PKR' },
      { id: 'sd', label: 'First payment date (for schedule)', type: 'date', value: '' }
    ],
    actions: [{ id: 'csv', label: 'Download schedule (CSV)', kind: 'ghost', onClick: function (v, c) { if (csv) U.download('loan-schedule.csv', csv, 'text/csv;charset=utf-8'); else c.error('Enter loan details first.'); } }],
    onInput: function (v, c) {
      csv = '';
      if (!v.p.trim() && !v.r.trim()) return c.empty('Enter the loan amount, interest rate and term to see your EMI and full repayment schedule.');
      var P = U.num(v.p), rate = U.num(v.r), t = U.num(v.t);
      if (!(P > 0)) return c.error('Loan amount must be greater than zero.');
      if (!(rate >= 0 && rate <= 100)) return c.error('Interest rate must be between 0 and 100.');
      if (!(t > 0)) return c.error('Loan term must be greater than zero.');
      var n = Math.round(v.tu === 'years' ? t * 12 : t);
      if (n < 1 || n > 600) return c.error('Term must be between 1 and 600 months (50 years).');
      var i = rate / 12 / 100, emi = i === 0 ? P / n : P * i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1);
      var total = emi * n, interest = total - P, m = function (x) { return U.money(x, v.cur); };
      var bal = P, rows = [], yearly = {}, start = U.parseDate(v.sd), lines = ['Month,Date,Payment,Principal,Interest,Balance'];
      for (var k = 1; k <= n; k++) {
        var ip = bal * i, pp = Math.min(emi - ip, bal); bal = Math.max(0, bal - pp); if (k === n) bal = 0;
        var yr = Math.ceil(k / 12); yearly[yr] = yearly[yr] || { p: 0, i: 0, b: 0 }; yearly[yr].p += pp; yearly[yr].i += ip; yearly[yr].b = bal;
        var dt = null;
        if (start) { var mm = start.getMonth() + k - 1, yy = start.getFullYear() + Math.floor(mm / 12); mm = mm % 12; dt = new Date(yy, mm, Math.min(start.getDate(), U.daysInMonth(yy, mm))); }
        lines.push([k, dt ? dt.getFullYear() + '-' + U.pad2(dt.getMonth() + 1) + '-' + U.pad2(dt.getDate()) : '', emi.toFixed(2), pp.toFixed(2), ip.toFixed(2), bal.toFixed(2)].join(','));
      }
      csv = lines.join('\n');
      var yrs = Object.keys(yearly).map(Number);
      var ratio = P / total * 100;
      c.html(U.grid([U.box('Monthly EMI', m(emi), '', true), U.box('Total interest', m(interest)), U.box('Total payment', m(total)), U.box('Number of payments', U.fmt(n, 0))]) +
        '<div style="margin:16px 0 6px;font-size:.85rem;color:var(--text-soft)">Principal ' + U.fmt(ratio, 1) + '% · Interest ' + U.fmt(100 - ratio, 1) + '%</div><div class="progress" aria-hidden="true"><i style="width:' + ratio + '%"></i></div>' +
        '<h3 style="margin-top:20px;font-size:1rem">Year-by-year summary</h3>' + U.table(['Year', 'Principal paid', 'Interest paid', 'Closing balance'], yrs.map(function (y) { return ['Year ' + y, m(yearly[y].p), m(yearly[y].i), m(yearly[y].b)]; })) +
        '<p class="result-note">EMI = P × r × (1+r)ⁿ ÷ ((1+r)ⁿ − 1), where r is the monthly rate. Actual lender figures may differ because of fees, rounding or day-count rules.</p>');
    }
  });
};
