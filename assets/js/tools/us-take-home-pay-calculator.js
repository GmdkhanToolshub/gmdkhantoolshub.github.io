/* US take-home pay for 2026: federal income tax (standard deduction), Social Security, Medicare, optional 401(k) and flat state tax. */
NiaziTools['us-take-home-pay-calculator'] = function (root, U) {
  var BR = {
    s: [[12400, .10], [50400, .12], [105700, .22], [201775, .24], [256225, .32], [640600, .35], [Infinity, .37]],
    m: [[24800, .10], [100800, .12], [211400, .22], [403550, .24], [512450, .32], [768700, .35], [Infinity, .37]]
  };
  var SD = { s: 16100, m: 32200 }, SS_BASE = 184500, ADDL = { s: 200000, m: 250000 };
  function usd(n) { return '$' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n)); }
  function fedTax(ti, st) { var t = 0, lo = 0; BR[st].forEach(function (b) { if (ti > lo) t += (Math.min(ti, b[0]) - lo) * b[1]; lo = b[0]; }); return t; }
  function marginal(ti, st) { var lo = 0; for (var i = 0; i < BR[st].length; i++) { if (ti <= BR[st][i][0]) return BR[st][i][1]; } return .37; }
  U.mount(root, {
    fields: [
      { id: 'g', label: 'Gross yearly salary ($)', type: 'number', placeholder: 'e.g. 80000' },
      { id: 'st', label: 'Filing status', type: 'select', value: 's', options: [{ value: 's', label: 'Single' }, { value: 'm', label: 'Married filing jointly' }] },
      { id: 'k', label: 'Pre-tax 401(k) (% of salary, optional)', type: 'number', placeholder: '0' },
      { id: 'sx', label: 'State income tax (flat %, optional)', type: 'number', placeholder: '0', hint: 'States differ and some have none. Type your own estimate.' }
    ],
    onInput: function (v, c) {
      if (!v.g.trim()) return c.empty('Enter your gross yearly salary to see your take-home pay.');
      var g = U.num(v.g), k = v.k.trim() ? U.num(v.k) : 0, sx = v.sx.trim() ? U.num(v.sx) : 0;
      if (!U.isNum(g) || g <= 0) return c.error('Salary must be a number greater than zero.');
      if (!U.isNum(k) || k < 0 || k > 100 || !U.isNum(sx) || sx < 0 || sx > 20) return c.error('401(k) must be 0 to 100 percent and state tax 0 to 20 percent.');
      var st = v.st, k401 = g * k / 100, ti = Math.max(0, g - k401 - SD[st]), fed = fedTax(ti, st);
      var ss = Math.min(g, SS_BASE) * 0.062, med = g * 0.0145 + Math.max(0, g - ADDL[st]) * 0.009, state = Math.max(0, g - k401) * sx / 100;
      var net = g - k401 - fed - ss - med - state;
      var out = U.grid([U.box('Take-home pay per year', usd(net), '', true), U.box('Per month', usd(net / 12)), U.box('Every two weeks', usd(net / 26))]);
      out += '<div style="margin-top:16px">' + U.table(['', 'Per year', 'Per month'], [
        ['Gross salary', usd(g), usd(g / 12)], ['401(k)', usd(k401), usd(k401 / 12)], ['Federal income tax', usd(fed), usd(fed / 12)],
        ['Social Security (6.2%)', usd(ss), usd(ss / 12)], ['Medicare', usd(med), usd(med / 12)], ['State income tax', usd(state), usd(state / 12)], ['Take-home pay', usd(net), usd(net / 12)]]) + '</div>';
      c.html(out + '<p class="result-note">2026 federal rules. Taxable income after the standard deduction: ' + usd(ti) + '. Your top federal rate is ' + U.fmt(marginal(ti, st) * 100, 0) + '%, and you keep ' + U.fmt(net / g * 100, 1) + '% of gross pay overall. Credits, itemised deductions, other income and local taxes are not included. An estimate: confirm with the IRS or a tax professional.</p>');
    }
  });
};
