NiaziTools['pakistan-salary-tax-calculator'] = function (root, U) {
  /* Each band: [upper limit, marginal rate, tax on income below this band, band start]. */
  var YEARS = {
    '2026-27': {
      label: '2026-27 (tax year 2027)',
      bands: [[600000, 0, 0, 0], [1200000, 1, 0, 600000], [2200000, 11, 6000, 1200000], [3200000, 20, 116000, 2200000], [4100000, 25, 316000, 3200000], [5600000, 29, 541000, 4100000], [7000000, 32, 976000, 5600000], [Infinity, 35, 1424000, 7000000]],
      surcharge: 0
    },
    '2025-26': {
      label: '2025-26 (tax year 2026)',
      bands: [[600000, 0, 0, 0], [1200000, 1, 0, 600000], [2200000, 11, 6000, 1200000], [3200000, 23, 116000, 2200000], [4100000, 30, 346000, 3200000], [Infinity, 35, 616000, 4100000]],
      surcharge: 9
    }
  };
  function taxFor(income, y) {
    var b = YEARS[y].bands, base = 0;
    for (var i = 0; i < b.length; i++) {
      if (income <= b[i][0]) { base = b[i][2] + (income - b[i][3]) * b[i][1] / 100; break; }
    }
    var sur = YEARS[y].surcharge && income > 10000000 ? base * YEARS[y].surcharge / 100 : 0;
    return { base: base, surcharge: sur, total: base + sur };
  }
  U.mount(root, {
    fields: [
      { id: 'pay', label: 'Gross salary', type: 'number', placeholder: 'e.g. 150000', value: '' },
      { id: 'period', label: 'This salary is…', type: 'select', options: [{ value: 'monthly', label: 'Per month' }, { value: 'annual', label: 'Per year' }], value: 'monthly' },
      { id: 'year', label: 'Tax year', type: 'select', options: Object.keys(YEARS).map(function (k) { return { value: k, label: YEARS[k].label }; }), value: '2026-27' },
      { id: 'bonus', label: 'Annual bonus (optional)', type: 'number', value: '0', hint: 'Added to your taxable income for the year.' },
      { id: 'exempt', label: 'Exempt allowances per month (optional)', type: 'number', value: '0', hint: 'For example, an exempt medical allowance. Check with payroll.' },
      { id: 'other', label: 'Other deductions per month (optional)', type: 'number', value: '0', hint: 'For example, provident fund or EOBI. Reduces take-home pay, not tax.' }
    ],
    onInput: function (v, ctx) {
      if (!v.pay.trim()) return ctx.empty('Enter your gross salary to see your income tax and take-home pay.');
      var pay = U.num(v.pay), bonus = U.num(v.bonus || '0'), exempt = U.num(v.exempt || '0'), other = U.num(v.other || '0');
      if (!(pay >= 0)) return ctx.error('Salary must be a number of zero or more.');
      if (!(bonus >= 0)) return ctx.error('Bonus must be zero or more.');
      if (!(exempt >= 0)) return ctx.error('Exempt allowances must be zero or more.');
      if (!(other >= 0)) return ctx.error('Other deductions must be zero or more.');
      var gross = (v.period === 'annual' ? pay : pay * 12) + bonus;
      if (exempt * 12 > gross) return ctx.error('Exempt allowances cannot be more than your total pay.');
      var taxable = gross - exempt * 12, res = taxFor(taxable, v.year), m = function (n) { return U.money(n, 'PKR', 0); };
      var net = (gross - res.total - other * 12) / 12, rate = gross > 0 ? res.total / gross * 100 : 0;
      var bands = YEARS[v.year].bands, top = 0, rows = [];
      bands.forEach(function (b) {
        var part = Math.min(taxable, b[0]) - b[3];
        if (part > 0) {
          top = b[1];
          rows.push([U.fmt(b[3], 0) + (b[0] === Infinity ? ' and above' : ' to ' + U.fmt(b[0], 0)), b[1] + '%', m(part), m(part * b[1] / 100)]);
        }
      });
      var otherYear = v.year === '2026-27' ? '2025-26' : '2026-27', cmp = taxFor(taxable, otherYear).total;
      var diff = v.year === '2026-27' ? cmp - res.total : res.total - cmp;
      var cmpText = diff > 0.5 ? 'Tax year 2027 rates save ' + m(diff) + ' a year on this income, compared with 2025-26.' : 'Annual tax on this income is the same under the 2025-26 and 2026-27 rates.';
      ctx.html(U.grid([U.box('Monthly income tax', m(res.total / 12), '', true), U.box('Monthly take-home pay', m(net), 'pos'), U.box('Annual income tax', m(res.total)), U.box('Annual taxable income', m(taxable)), U.box('Tax as a share of pay', U.pct(rate, 2)), U.box('Top slab rate reached', top + '%')]) +
        '<h3 style="margin-top:20px;font-size:1rem">How your tax is worked out</h3>' + U.table(['Income band (Rs)', 'Rate', 'Your income in band', 'Tax'], rows) +
        (res.surcharge ? '<p class="result-note">Includes a 9% surcharge of ' + m(res.surcharge) + ', which applied to taxable income above Rs 10 million in 2025-26.</p>' : '') +
        '<p class="result-note">' + U.esc(cmpText) + (bonus > 0 ? ' Monthly figures spread your bonus evenly across 12 months.' : '') + '</p>' +
        '<p class="result-note">This is an estimate for full-year salaried income. Your payroll figure can differ because of mid-year changes, tax credits and how each allowance is treated.</p>');
    }
  });
};
