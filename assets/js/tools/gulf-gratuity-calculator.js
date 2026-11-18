/* End of service gratuity estimate for the UAE and Saudi Arabia, with an optional rupee value. */
NiaziTools['gulf-gratuity-calculator'] = function (root, U) {
  var API = (window.SITE_CONFIG && window.SITE_CONFIG.currencyApiUrl) || 'https://open.er-api.com/v6/latest/USD';
  var KEY = 'niazi.fx.v1', TTL = 6 * 3600 * 1000, rates = null;
  function load() {
    var cached = U.store.get(KEY, null);
    if (cached && Date.now() - cached.t < TTL) return Promise.resolve(cached.r);
    return fetch(API).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (j) {
      if (!j || !j.rates || !j.rates.USD || !j.rates.PKR) throw new Error('Unexpected response');
      var r = {}; Object.keys(j.rates).forEach(function (k) { var x = j.rates[k]; if (/^[A-Z]{3}$/.test(k) && typeof x === 'number' && isFinite(x) && x > 0) r[k] = x; });
      U.store.set(KEY, { t: Date.now(), r: r, u: j.time_last_update_utc || new Date().toUTCString() }); return r;
    }).catch(function (e) { if (cached) return cached.r; throw e; });
  }
  var inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  var ctx = U.mount(root, {
    fields: [
      { id: 'country', label: 'Country', type: 'select', value: 'ae', options: [{ value: 'ae', label: 'United Arab Emirates' }, { value: 'sa', label: 'Saudi Arabia' }] },
      { id: 'pay', label: 'Monthly pay', type: 'number', placeholder: 'e.g. 3000', hint: 'UAE: monthly basic salary in dirhams. Saudi Arabia: last monthly wage in riyals, including fixed allowances such as housing.' },
      { id: 'yrs', label: 'Years of service', type: 'number', value: '5' },
      { id: 'mos', label: 'Extra months', type: 'number', value: '0' },
      { id: 'why', label: 'How did the job end? (Saudi Arabia)', type: 'select', value: 'end', options: [{ value: 'end', label: 'Contract ended or employer ended it' }, { value: 'res', label: 'I resigned' }] },
      { id: 'pkr', label: 'Also show the amount in rupees', type: 'checkbox', value: true }
    ],
    onInput: function (v, c) {
      if (!v.pay.trim()) return c.empty('Enter your monthly pay and length of service.');
      var pay = U.num(v.pay), y = U.num(v.yrs || '0'), m = U.num(v.mos || '0');
      if (!U.isNum(pay) || pay <= 0) return c.error('Monthly pay must be greater than zero.');
      if (!U.isNum(y) || y < 0 || !U.isNum(m) || m < 0 || m > 11) return c.error('Years cannot be negative, and extra months must be between 0 and 11.');
      var ty = y + m / 12, cur = v.country === 'ae' ? 'AED' : 'SAR', amount = 0, note = '', rows = [];
      if (v.country === 'ae') {
        if (ty < 1) { note = 'The UAE generally requires at least one year of continuous service, so the estimate is zero.'; }
        else {
          var first = Math.min(ty, 5), rest = Math.max(ty - 5, 0), days = first * 21 + rest * 30, daily = pay / 30;
          amount = days * daily; var cap = pay * 24; var capped = amount > cap; if (capped) amount = cap;
          rows = [['Years counted', U.fmt(ty, 2)], ['Days of basic salary (21 per year to year 5, 30 after)', U.fmt(days, 1)], ['One day of basic salary', U.fmt(daily, 2) + ' ' + cur], ['Two-year cap', U.fmt(cap, 0) + ' ' + cur + (capped ? ' (applied)' : '')]];
        }
      } else {
        var months = Math.min(ty, 5) * 0.5 + Math.max(ty - 5, 0), full = months * pay, f = 1;
        if (v.why === 'res') f = ty < 2 ? 0 : ty < 5 ? 1 / 3 : ty < 10 ? 2 / 3 : 1;
        amount = full * f;
        rows = [['Years counted', U.fmt(ty, 2)], ['Months of wage (half a month per year to year 5, one after)', U.fmt(months, 2)], ['Award before any resignation reduction', U.fmt(full, 0) + ' ' + cur], ['Share paid', v.why === 'res' ? (f === 0 ? 'None (under 2 years)' : f === 1 ? 'Full (10 years or more)' : U.fmt(f * 100, 0) + '% (resignation)') : 'Full']];
      }
      var out = U.grid([U.box('Estimated gratuity', U.fmt(amount, 0) + ' ' + cur, '', true), U.box('Years of service', U.fmt(ty, 2))]);
      if (v.pkr && rates && rates[cur] && rates.PKR) out = out.replace('</div></div>', '</div><div class="result-box"><small>Worth in rupees</small><b>Rs ' + inr.format(Math.round(amount * rates.PKR / rates[cur])) + '</b></div></div>');
      if (rows.length) out += '<div style="margin-top:16px">' + U.table(['Step', 'Value'], rows) + '</div>';
      c.html(out + (note ? '<p class="result-note">' + note + '</p>' : '') + '<p class="result-note">An estimate only. Your contract, free-zone rules, unpaid leave and the exact wage definition can change the result. Confirm with your employer or the labour authority. Rupee values use the live mid-market rate.</p>');
    }
  });
  load().then(function (r) { rates = r; ctx.form.dispatchEvent(new Event('change')); }).catch(function () { /* rupee value is optional */ });
};
