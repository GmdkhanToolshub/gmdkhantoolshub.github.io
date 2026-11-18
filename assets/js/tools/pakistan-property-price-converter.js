/* Pakistan property price in rupees shown in other currencies, with price per marla and per square foot. */
NiaziTools['pakistan-property-price-converter'] = function (root, U) {
  var API = (window.SITE_CONFIG && window.SITE_CONFIG.currencyApiUrl) || 'https://open.er-api.com/v6/latest/USD';
  var KEY = 'niazi.fx.v1', TTL = 6 * 3600 * 1000, rates = null, ctx, SQFT = 272.25;
  var SHOW = ['USD', 'GBP', 'AED', 'SAR', 'EUR', 'CAD', 'AUD', 'QAR'];
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
  function rs(n) { return 'Rs ' + inr.format(Math.round(n)); }
  function words(n) { return n >= 1e7 ? U.fmt(n / 1e7, 2) + ' crore' : n >= 1e5 ? U.fmt(n / 1e5, 2) + ' lakh' : U.fmt(n, 0); }
  var status = document.createElement('div'); status.className = 'small muted'; status.setAttribute('role', 'status'); status.textContent = 'Loading live exchange rates…';
  root.innerHTML = ''; root.appendChild(status); var body = document.createElement('div'); root.appendChild(body);
  function start() {
    ctx = U.mount(body, {
      fields: [
        { id: 'sz', label: 'Plot size', type: 'number', value: '10' },
        { id: 'un', label: 'Size unit', type: 'select', value: 'marla', options: [{ value: 'marla', label: 'Marla' }, { value: 'kanal', label: 'Kanal (20 marla)' }] },
        { id: 'basis', label: 'The price you have is', type: 'select', value: 'total', options: [{ value: 'total', label: 'Total price' }, { value: 'marla', label: 'Price per marla' }] },
        { id: 'pr', label: 'Price (Rs)', type: 'number', placeholder: 'e.g. 12500000' },
        { id: 'ex', label: 'Extra costs (%, optional)', type: 'number', placeholder: '0', hint: 'Transfer, registration and agent costs differ by city. Enter your own estimate.' },
        { id: 'ms', label: 'Square feet in one marla', type: 'number', value: '272.25', hint: 'Standard is 272.25. Some housing societies use a different size.' }
      ],
      onInput: function (v, c) {
        if (!v.pr.trim()) return c.empty('Enter the price in rupees to convert it.');
        var sz = U.num(v.sz), pr = U.num(v.pr), ex = v.ex.trim() ? U.num(v.ex) : 0, ms = U.num(v.ms);
        if (!U.isNum(sz) || sz <= 0 || !U.isNum(pr) || pr <= 0) return c.error('Plot size and price must be numbers greater than zero.');
        if (!U.isNum(ex) || ex < 0 || ex > 100 || !U.isNum(ms) || ms <= 0) return c.error('Extra costs must be 0 to 100 percent and the marla size must be above zero.');
        var marla = v.un === 'kanal' ? sz * 20 : sz, base = v.basis === 'marla' ? pr * marla : pr, total = base * (1 + ex / 100), sqft = marla * ms;
        var out = U.grid([U.box('Total in rupees', rs(total), '', true), U.box('In words', words(total)), U.box('Plot size', U.fmt(marla, 2) + ' marla · ' + U.fmt(sqft, 0) + ' sq ft')]);
        out += '<div style="margin-top:16px">' + U.table(['Measure', 'Rupees'], [
          ['Price before extra costs', rs(base)], ['Extra costs (' + U.fmt(ex, 2) + '%)', rs(total - base)], ['Per marla (with extra costs)', rs(total / marla)], ['Per square foot (with extra costs)', rs(total / sqft)]]) + '</div>';
        if (rates && rates.PKR) {
          out += '<div style="margin-top:16px">' + U.table(['Currency', 'Total', 'Per marla', 'Rate (Rs per 1)'], SHOW.filter(function (x) { return rates[x]; }).map(function (x) {
            var rate = rates.PKR / rates[x]; return [x, U.fmt(total / rate, 0), U.fmt(total / rate / marla, 0), U.fmt(rate, 2)];
          })) + '</div>';
        } else out += '<p class="result-note">Live exchange rates could not be loaded, so only rupee figures are shown. Try again later.</p>';
        c.html(out + '<p class="result-note">Currency values use the live mid-market rate, which excludes the margin a bank or transfer service adds. Planning only: this is not a valuation, and not legal or tax advice. Check the title and society approval before you pay.</p>');
      }
    });
  }
  load().then(function (r) { rates = r; status.textContent = 'Live mid-market rates loaded.'; start(); }).catch(function () { rates = null; status.textContent = 'Live rates could not be loaded. Rupee figures still work.'; start(); });
};
