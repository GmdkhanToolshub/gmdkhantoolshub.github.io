/* Send money to Pakistan: compares up to three transfer quotes the user types in, against the live mid-market rate. */
NiaziTools['send-money-to-pakistan-calculator'] = function (root, U) {
  var API = (window.SITE_CONFIG && window.SITE_CONFIG.currencyApiUrl) || 'https://open.er-api.com/v6/latest/USD';
  var KEY = 'niazi.fx.v1', TTL = 6 * 3600 * 1000, rates = null, ctx, lastCur = '';
  var CUR = ['USD', 'GBP', 'AED', 'SAR', 'EUR', 'CAD', 'AUD', 'QAR', 'KWD', 'OMR', 'SGD', 'MYR'];
  function load() {
    var cached = U.store.get(KEY, null);
    if (cached && Date.now() - cached.t < TTL) return Promise.resolve(cached.r);
    return fetch(API).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (j) {
      if (!j || !j.rates || !j.rates.USD || !j.rates.PKR) throw new Error('Unexpected response');
      var r = {}; Object.keys(j.rates).forEach(function (k) { var x = j.rates[k]; if (/^[A-Z]{3}$/.test(k) && typeof x === 'number' && isFinite(x) && x > 0) r[k] = x; });
      U.store.set(KEY, { t: Date.now(), r: r, u: j.time_last_update_utc || new Date().toUTCString() }); return r;
    }).catch(function (e) { if (cached) return cached.r; throw e; });
  }
  function mid(cur) { return rates && rates[cur] && rates.PKR ? rates.PKR / rates[cur] : NaN; }
  function pk(n) { return 'Rs ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n)); }
  var status = document.createElement('div'); status.className = 'small muted'; status.setAttribute('role', 'status'); status.textContent = 'Loading the live mid-market rate…';
  root.innerHTML = ''; root.appendChild(status); var body = document.createElement('div'); root.appendChild(body);
  function fields() {
    var f = [
      { id: 'amt', label: 'Amount you send', type: 'number', value: '1000' },
      { id: 'cur', label: 'Sending currency', type: 'select', value: 'USD', options: CUR },
      { id: 'mid', label: 'Mid-market rate (Rs per 1 unit)', type: 'number', hint: 'Filled in from the live feed. Type your own if it could not load.' }
    ];
    ['A', 'B', 'C'].forEach(function (k) {
      f.push({ id: 'n' + k, label: 'Service ' + k + ' name (optional)', type: 'text', placeholder: 'e.g. Bank or app name' });
      f.push({ id: 'r' + k, label: 'Service ' + k + ' rate (Rs per 1 unit)', type: 'number', placeholder: 'The rate in its quote' });
      f.push({ id: 'f' + k, label: 'Service ' + k + ' fixed fee (in your currency)', type: 'number', placeholder: '0' });
      f.push({ id: 'p' + k, label: 'Service ' + k + ' percentage fee (%)', type: 'number', placeholder: '0' });
    });
    return f;
  }
  function start() {
    ctx = U.mount(body, {
      fields: fields(),
      onInput: function (v, c) {
        if (v.cur !== lastCur) { lastCur = v.cur; var m = mid(v.cur); if (U.isNum(m)) c.set('mid', U.fmt(m, 4).replace(/,/g, '')); v.mid = c.vals().mid; }
        var a = U.num(v.amt), m0 = U.num(v.mid);
        if (!v.amt.trim()) return c.empty('Enter the amount you want to send.');
        if (!U.isNum(a) || a <= 0) return c.error('Amount must be a number greater than zero.');
        var rows = [];
        ['A', 'B', 'C'].forEach(function (k) {
          var r = U.num(v['r' + k]); if (!v['r' + k].trim()) return;
          var fee = v['f' + k].trim() ? U.num(v['f' + k]) : 0, pct = v['p' + k].trim() ? U.num(v['p' + k]) : 0;
          if (!U.isNum(r) || r <= 0 || !U.isNum(fee) || fee < 0 || !U.isNum(pct) || pct < 0) { rows.push({ bad: k }); return; }
          var total = a + fee + a * pct / 100, got = a * r;
          rows.push({ name: v['n' + k].trim() || 'Service ' + k, total: total, got: got, per: got / total, cost: U.isNum(m0) && m0 > 0 ? (1 - (got / total) / m0) * 100 : NaN });
        });
        if (rows.some(function (x) { return x.bad; })) return c.error('Check the rate and fees for each service. Rates must be above zero and fees cannot be negative.');
        if (!rows.length) return c.empty('Enter the rate from at least one service to compare.' + (U.isNum(m0) ? ' At the mid-market rate, ' + U.fmt(a, 2) + ' ' + v.cur + ' is about ' + pk(a * m0) + '.' : ''));
        var best = rows.reduce(function (b, x) { return x.per > b.per ? x : b; }, rows[0]);
        var out = U.grid([U.box('Most rupees for your money', U.esc(best.name), '', true), U.box('Family receives', pk(best.got)), U.box('You pay in total', U.fmt(best.total, 2) + ' ' + v.cur)]);
        out += '<div style="margin-top:16px">' + U.table(['Service', 'You pay', 'Family gets', 'Rs per 1 ' + v.cur + ' paid', 'Cost vs mid-market'], rows.map(function (x) {
          return [U.esc(x.name) + (x === best && rows.length > 1 ? ' (best)' : ''), U.fmt(x.total, 2) + ' ' + v.cur, pk(x.got), U.fmt(x.per, 2), U.isNum(x.cost) ? U.fmt(x.cost, 2) + '%' : '–'];
        })) + '</div>';
        if (rows.length > 1) { var worst = rows.reduce(function (b, x) { return x.per < b.per ? x : b; }, rows[0]); out += '<p class="result-note">Choosing ' + U.esc(best.name) + ' over ' + U.esc(worst.name) + ' gives your family about ' + pk((best.per - worst.per) * best.total) + ' more for this transfer.</p>'; }
        c.html(out + '<p class="result-note">Based on the rates and fees you typed in. Cost vs mid-market shows how much of your money goes to fees and rate margin. Always confirm the final amount in the service before you send.</p>');
      }
    });
  }
  load().then(function (r) { rates = r; status.textContent = 'Live mid-market rates loaded. Type each service\'s own rate and fees from its quote.'; start(); })
    .catch(function () { status.textContent = 'The live rate could not be loaded. Type a mid-market rate yourself, or use the rate from your bank.'; start(); });
};
