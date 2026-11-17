/* Amount in words: converts a number into words for cheques, vouchers and invoices.
   Pakistani/Indian system (thousand, lakh, crore, arab, kharab) or international (million, billion). English words. */
NiaziTools['amount-in-words'] = function (root, U) {
  var ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  var CUR = { pkr: ['Rupees', 'Paisa', 'Rupee'], usd: ['Dollars', 'Cents', 'Dollar'], gbp: ['Pounds', 'Pence', 'Pound'], eur: ['Euros', 'Cents', 'Euro'], aed: ['Dirhams', 'Fils', 'Dirham'], sar: ['Riyals', 'Halalas', 'Riyal'], none: ['', '', ''] };
  function two(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''); }
  function three(n) { var h = Math.floor(n / 100), r = n % 100; return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : ''); }
  function words(digits, sys) {
    digits = digits.replace(/^0+(?=\d)/, '');
    if (/^0+$/.test(digits)) return 'Zero';
    var parts = [], n = digits, i;
    if (sys === 'pk') {
      var names = ['', 'Thousand', 'Lakh', 'Crore', 'Arab', 'Kharab', 'Neel'], last3 = parseInt(n.slice(-3), 10); n = n.slice(0, -3);
      var groups = []; while (n.length) { groups.push(parseInt(n.slice(-2), 10)); n = n.slice(0, -2); }
      for (i = groups.length - 1; i >= 0; i--) if (groups[i]) parts.push(two(groups[i]) + ' ' + names[i + 1]);
      if (last3) parts.push(three(last3));
    } else {
      var nm = ['', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion'], gs = [];
      while (n.length) { gs.push(parseInt(n.slice(-3), 10)); n = n.slice(0, -3); }
      for (i = gs.length - 1; i >= 0; i--) if (gs[i]) parts.push(three(gs[i]) + (nm[i] ? ' ' + nm[i] : ''));
    }
    return parts.join(' ');
  }
  function group(digits, sys) {
    if (sys === 'pk') { var l3 = digits.slice(-3), rest = digits.slice(0, -3); return (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + l3; }
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  U.mount(root, {
    fields: [
      { id: 'amt', label: 'Amount', type: 'text', placeholder: 'e.g. 125000.50', wide: true, autocomplete: 'off' },
      { id: 'cur', label: 'Currency', type: 'select', value: 'pkr', options: [{ value: 'pkr', label: 'Pakistani Rupees (Rs)' }, { value: 'usd', label: 'US Dollars' }, { value: 'gbp', label: 'British Pounds' }, { value: 'eur', label: 'Euros' }, { value: 'aed', label: 'UAE Dirhams' }, { value: 'sar', label: 'Saudi Riyals' }, { value: 'none', label: 'No currency, numbers only' }] },
      { id: 'sys', label: 'Number system', type: 'select', value: 'pk', options: [{ value: 'pk', label: 'Lakh and crore (Pakistan, India)' }, { value: 'int', label: 'Million and billion (international)' }] },
      { id: 'style', label: 'Style', type: 'select', value: 'cheque', options: [{ value: 'cheque', label: 'Cheque style: "Rupees … Only"' }, { value: 'plain', label: 'Plain words' }] }
    ],
    onInput: function (v, c) {
      var raw = v.amt.trim().replace(/,/g, '').replace(/^rs\.?\s*/i, '');
      if (!raw) return c.empty('Type an amount to see it written in words.');
      if (!/^\d+(\.\d{1,2})?$/.test(raw)) return c.error('Use digits only, with up to two decimal places, for example 125000.50.');
      var p = raw.split('.'), whole = p[0].replace(/^0+(?=\d)/, ''), dec = p[1] ? (p[1] + '0').slice(0, 2) : '00';
      if (whole.length > 15) return c.error('That number is too large. Please use 15 digits or fewer.');
      var cu = CUR[v.cur], sys = v.sys, main = words(whole, sys), cents = parseInt(dec, 10), txt;
      var major = whole === '1' ? cu[2] : cu[0], tail = cents ? ' and ' + words(String(cents), sys) + ' ' + cu[1] : '';
      if (v.cur === 'none') txt = main + (cents ? ' point ' + dec.split('').map(function (d) { return d === '0' ? 'Zero' : ONES[+d]; }).join(' ') : '');
      else if (v.style === 'cheque') txt = major + ' ' + main + tail + ' Only';
      else txt = main + ' ' + major + tail;
      if (v.cur === 'none' && v.style === 'cheque') txt += ' Only';
      var lakh = group(whole, 'pk') + (cents ? '.' + dec : ''), intl = group(whole, 'int') + (cents ? '.' + dec : '');
      c.html('<div class="result-box big" style="text-align:left"><small>In words</small><b id="aw-out" style="font-size:1.25rem;line-height:1.5;display:block">' + U.esc(txt) + '</b></div>' +
        '<div class="btn-row" style="margin-top:12px"><button type="button" class="btn btn-primary btn-sm" id="aw-copy">Copy words</button></div>' +
        '<div style="margin-top:16px">' + U.table(['Format', 'Number'], [['Lakh / crore grouping', lakh], ['International grouping', intl]], 1) + '</div>' +
        '<p class="result-note">Check the words against the figures before you write them on a cheque. Banks reject a cheque when the two do not match.</p>');
      var b = root.querySelector('#aw-copy'); if (b) b.onclick = function () { U.copy(txt, 'Copied'); };
    }
  });
};
