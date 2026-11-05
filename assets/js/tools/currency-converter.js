NiaziTools['currency-converter'] = function (root, U) {
  var API = (window.SITE_CONFIG && window.SITE_CONFIG.currencyApiUrl) || 'https://open.er-api.com/v6/latest/USD';
  var KEY = 'niazi.fx.v1', TTL = 6 * 3600 * 1000, rates = null, updated = '', stale = false, ctx;
  var POP = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD', 'AUD', 'JPY', 'CNY', 'CHF', 'TRY', 'SGD', 'MYR', 'BDT', 'ZAR', 'NGN', 'KES', 'QAR'];
  root.innerHTML = '<div id="fx-status" class="small muted" role="status">Loading latest exchange rates…</div><div id="fx-body"></div>';
  var status = root.querySelector('#fx-status');
  function name(c) { try { return new Intl.DisplayNames(['en'], { type: 'currency' }).of(c) || c; } catch (e) { return c; } }
  function opts() {
    var codes = Object.keys(rates).sort(), pop = POP.filter(function (c) { return rates[c]; }), rest = codes.filter(function (c) { return pop.indexOf(c) < 0; });
    return pop.concat(rest).map(function (c) { return { value: c, label: c + ' — ' + name(c) }; });
  }
  function fetchRates() {
    var cached = U.store.get(KEY, null);
    if (cached && Date.now() - cached.t < TTL) { rates = cached.r; updated = cached.u; return Promise.resolve(); }
    return fetch(API).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (j) {
      if (!j || !j.rates || (j.result && j.result !== 'success')) throw new Error('Unexpected response');
      rates = j.rates; updated = j.time_last_update_utc || new Date().toUTCString(); U.store.set(KEY, { t: Date.now(), r: rates, u: updated });
    }).catch(function (e) {
      if (cached) { rates = cached.r; updated = cached.u; stale = true; return; }
      throw e;
    });
  }
  function ui(manual) {
    var fields = [{ id: 'amt', label: 'Amount', type: 'number', value: '100' }, { id: 'from', label: 'From', type: 'select', options: manual ? ['—'] : opts(), value: 'USD' }, { id: 'to', label: 'To', type: 'select', options: manual ? ['—'] : opts(), value: 'PKR' }];
    if (manual) fields = [{ id: 'amt', label: 'Amount', type: 'number', value: '100' }, { id: 'rate', label: 'Exchange rate (1 unit of source = ? target)', type: 'number', value: '', hint: 'Rates could not be loaded, so enter a rate from your bank or exchange.' }];
    ctx = U.mount(root.querySelector('#fx-body'), {
      fields: fields,
      actions: manual ? [] : [{ id: 'swap', label: '⇄ Swap currencies', kind: 'ghost', onClick: function (v, c) { c.set('from', v.to); c.set('to', v.from); c.form.dispatchEvent(new Event('change')); } }],
      onInput: function (v, c) {
        var a = U.num(v.amt); if (!v.amt.trim()) return c.empty('Enter an amount to convert.');
        if (!(a >= 0)) return c.error('Amount must be a number of zero or more.');
        if (manual) { var r = U.num(v.rate); if (!v.rate.trim()) return c.empty('Enter an exchange rate to convert.'); if (!(r > 0)) return c.error('Exchange rate must be greater than zero.'); return c.html(U.grid([U.box('Converted amount', U.fmt(a * r, 4), '', true)])); }
        var rf = rates[v.from], rt = rates[v.to]; if (!rf || !rt) return c.error('One of the selected currencies has no rate available.');
        var rate = rt / rf;
        c.html(U.grid([U.box(v.from + ' → ' + v.to, U.fmt(a * rate, 4, 2) + ' ' + v.to, '', true), U.box('1 ' + v.from, U.fmt(rate, 6) + ' ' + v.to), U.box('1 ' + v.to, U.fmt(1 / rate, 6) + ' ' + v.from)]) +
          '<p class="result-note">Rates are mid-market reference rates and exclude bank or card fees' + (stale ? ' · showing saved rates because the live feed could not be reached' : '') + '. Last update: ' + U.esc(updated) + '.</p>');
      }
    });
  }
  fetchRates().then(function () {
    status.innerHTML = (stale ? '⚠ Offline — using saved rates. ' : '') + 'Rates by <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">Exchange Rate API</a>. Updated: ' + U.esc(updated);
    ui(false);
  }).catch(function () {
    status.innerHTML = '<span class="warn">Live rates are unavailable right now (you may be offline). You can still convert with a rate you enter manually.</span> <button type="button" class="btn btn-ghost btn-sm" id="fx-retry">Retry</button>';
    ui(true);
    root.querySelector('#fx-retry').addEventListener('click', function () { NiaziTools['currency-converter'](root, U); });
  });
};
