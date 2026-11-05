NiaziTools['salary-calculator'] = function (root, U) {
  var CUR = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD', 'AUD', 'SGD', 'JPY', 'CNY', 'CHF', 'ZAR', 'NGN', 'KES', 'BDT', 'TRY', 'MYR', 'QAR'];
  var PER = { hourly: 'Hourly', daily: 'Daily', weekly: 'Weekly', biweekly: 'Bi-weekly (every 2 weeks)', monthly: 'Monthly', annual: 'Annual' };
  U.mount(root, {
    fields: [
      { id: 'amount', label: 'Salary amount', type: 'number', placeholder: 'e.g. 150000', value: '' },
      { id: 'period', label: 'This amount is…', type: 'select', options: Object.keys(PER).map(function (k) { return { value: k, label: PER[k] }; }), value: 'monthly' },
      { id: 'currency', label: 'Currency', type: 'select', options: CUR, value: 'PKR' },
      { id: 'hours', label: 'Hours per week', type: 'number', value: '40', hint: 'Used for hourly and daily conversions.' },
      { id: 'days', label: 'Working days per week', type: 'number', value: '5' },
      { id: 'weeks', label: 'Paid weeks per year', type: 'number', value: '52', hint: 'Use 52 for a standard year.' },
      { id: 'tax', label: 'Estimated tax / deductions (%)', type: 'number', value: '0', hint: 'Optional flat percentage. This is an estimate, not tax advice.' },
      { id: 'bonus', label: 'Annual bonus (optional)', type: 'number', value: '0', hint: 'Added to gross annual pay.' }
    ],
    onInput: function (v, ctx) {
      var amt = U.num(v.amount);
      if (v.amount.trim() === '') return ctx.empty('Enter a salary amount to see monthly, annual, weekly, daily and hourly figures.');
      var hours = U.num(v.hours), days = U.num(v.days), weeks = U.num(v.weeks), tax = U.num(v.tax || '0'), bonus = U.num(v.bonus || '0');
      if (!(amt >= 0)) return ctx.error('Salary amount must be a number of zero or more.');
      if (!(hours > 0 && hours <= 168)) return ctx.error('Hours per week must be between 1 and 168.');
      if (!(days > 0 && days <= 7)) return ctx.error('Working days per week must be between 1 and 7.');
      if (!(weeks > 0 && weeks <= 53)) return ctx.error('Paid weeks per year must be between 1 and 53.');
      if (!(tax >= 0 && tax < 100)) return ctx.error('Tax percentage must be from 0 to under 100.');
      if (!(bonus >= 0)) return ctx.error('Bonus must be zero or more.');
      var annualBase;
      switch (v.period) {
        case 'hourly': annualBase = amt * hours * weeks; break;
        case 'daily': annualBase = amt * days * weeks; break;
        case 'weekly': annualBase = amt * weeks; break;
        case 'biweekly': annualBase = amt * (weeks / 2); break;
        case 'monthly': annualBase = amt * 12; break;
        default: annualBase = amt;
      }
      var gross = annualBase + bonus, net = gross * (1 - tax / 100);
      var c = v.currency, m = function (n) { return U.money(n, c); };
      var rows = [
        ['Annual', m(gross), m(net)],
        ['Monthly', m(gross / 12), m(net / 12)],
        ['Bi-weekly', m(gross / (weeks / 2)), m(net / (weeks / 2))],
        ['Weekly', m(gross / weeks), m(net / weeks)],
        ['Daily', m(gross / (weeks * days)), m(net / (weeks * days))],
        ['Hourly', m(gross / (weeks * hours)), m(net / (weeks * hours))]
      ];
      ctx.html(U.grid([U.box('Gross annual', m(gross), '', true), U.box('Gross monthly', m(gross / 12)), U.box(tax > 0 ? 'Net monthly (est.)' : 'Net monthly', m(net / 12))]) +
        '<div style="margin-top:16px">' + U.table(['Period', 'Gross', 'After ' + U.fmt(tax, 2) + '% deduction'], rows) + '</div>' +
        '<p class="result-note">Assumes ' + U.fmt(hours) + ' hours/week, ' + U.fmt(days) + ' days/week and ' + U.fmt(weeks) + ' paid weeks/year. Bonus of ' + m(bonus) + ' is included in annual figures.</p>');
    }
  });
};
