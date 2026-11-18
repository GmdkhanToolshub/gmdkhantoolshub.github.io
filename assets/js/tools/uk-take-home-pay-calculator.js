/* UK take-home pay, tax year 2026-27, England, Wales and Northern Ireland. */
NiaziTools['uk-take-home-pay-calculator'] = function (root, U) {
  var PA = 12570, BASIC = 37700, ADD = 125140, NI_LO = 12570, NI_HI = 50270;
  function gbp(n) { return '£' + new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(Math.round(n)); }
  function calc(gross, pensionPct) {
    var pension = gross * pensionPct / 100, pay = gross - pension;
    var pa = pay <= 100000 ? PA : Math.max(0, PA - (pay - 100000) / 2), taxable = Math.max(0, pay - pa);
    var b = Math.min(taxable, BASIC), h = Math.min(Math.max(taxable - BASIC, 0), ADD - BASIC), a = Math.max(taxable - ADD, 0);
    var tax = b * 0.2 + h * 0.4 + a * 0.45;
    var ni = Math.max(0, Math.min(gross, NI_HI) - NI_LO) * 0.08 + Math.max(0, gross - NI_HI) * 0.02;
    return { pension: pension, pa: pa, taxable: taxable, tax: tax, ni: ni, net: gross - pension - tax - ni, b: b, h: h, a: a };
  }
  U.mount(root, {
    fields: [
      { id: 'g', label: 'Gross pay (£)', type: 'number', placeholder: 'e.g. 35000' },
      { id: 'per', label: 'This amount is', type: 'select', value: 'y', options: [{ value: 'y', label: 'Per year' }, { value: 'm', label: 'Per month' }] },
      { id: 'pn', label: 'Workplace pension (% of pay, optional)', type: 'number', placeholder: '0', hint: 'Treated as a net-pay arrangement: taken before income tax, not before National Insurance.' }
    ],
    onInput: function (v, c) {
      if (!v.g.trim()) return c.empty('Enter your gross pay to see your take-home pay.');
      var g = U.num(v.g), p = v.pn.trim() ? U.num(v.pn) : 0;
      if (!U.isNum(g) || g <= 0) return c.error('Pay must be a number greater than zero.');
      if (!U.isNum(p) || p < 0 || p > 100) return c.error('Pension must be between 0 and 100 percent.');
      var gross = v.per === 'm' ? g * 12 : g, r = calc(gross, p);
      var out = U.grid([U.box('Take-home pay per year', gbp(r.net), '', true), U.box('Per month', gbp(r.net / 12)), U.box('Per week', gbp(r.net / 52))]);
      out += '<div style="margin-top:16px">' + U.table(['', 'Per year', 'Per month'], [
        ['Gross pay', gbp(gross), gbp(gross / 12)], ['Pension', gbp(r.pension), gbp(r.pension / 12)], ['Income tax', gbp(r.tax), gbp(r.tax / 12)],
        ['National Insurance', gbp(r.ni), gbp(r.ni / 12)], ['Take-home pay', gbp(r.net), gbp(r.net / 12)]]) + '</div>';
      out += '<div style="margin-top:16px">' + U.table(['Tax band', 'Taxed income', 'Tax'], [
        ['Personal Allowance (0%)', gbp(r.pa), '£0'], ['Basic rate (20%)', gbp(r.b), gbp(r.b * 0.2)], ['Higher rate (40%)', gbp(r.h), gbp(r.h * 0.4)], ['Additional rate (45%)', gbp(r.a), gbp(r.a * 0.45)]]) + '</div>';
      c.html(out + '<p class="result-note">Tax year 2026-27 for England, Wales and Northern Ireland. Scottish rates, student loans, benefits in kind and unusual tax codes are not included. An estimate: check GOV.UK or your payslip for exact figures. Overall you keep ' + U.fmt(r.net / gross * 100, 1) + '% of your gross pay.</p>');
    }
  });
};
