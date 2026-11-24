/* GM Tools Hub checkout: shared helpers. apiBase is set in checkout-config.js after the payments API is deployed. Nothing secret lives in the browser. */
(function () {
  'use strict';
  var cfg = window.GM_PAY || {}, base = String(cfg.apiBase || '').replace(/\/+$/, '');
  var P = window.GMPay = {
    live: /^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(base) || /^http:\/\/localhost(:\d+)?$/i.test(base),
    $: function (id) { return document.getElementById(id); },
    el: function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; },
    money: function (minor, cur) { return (cur === 'PKR' ? 'Rs ' : (cur || '') + ' ') + (minor / 100).toLocaleString('en-IN', { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 }); },
    date: function (iso) { try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } },
    dateTime: function (iso) { try { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } },
    api: function (path, opt) {
      opt = opt || {}; var h = opt.headers || {}; var init = { method: opt.method || 'GET', headers: h, credentials: opt.credentials || 'omit' };
      if (opt.json !== undefined) { h['Content-Type'] = 'application/json'; init.body = JSON.stringify(opt.json); } else if (opt.body) init.body = opt.body;
      if (opt.token) h['X-Order-Token'] = opt.token; if (opt.csrf) h['X-CSRF-Token'] = opt.csrf;
      return fetch(base + path, init).then(function (r) { var ct = r.headers.get('Content-Type') || ''; if (opt.raw) return r.ok ? r : r.json().then(function (j) { throw { status: r.status, message: j.error && j.error.message }; }); return r.json().then(function (j) { if (!r.ok) throw { status: r.status, code: j.error && j.error.code, message: (j.error && j.error.message) || 'Something went wrong.' }; return j; }, function () { throw { status: r.status, message: 'Unexpected response from the server.' }; }); }, function () { throw { status: 0, message: 'Could not reach the payment server. Check your connection and try again.' }; });
    },
    notLive: function (box) {
      box.textContent = ''; var n = P.el('div', 'ck-card');
      n.appendChild(P.el('h2', '', 'Online checkout is not switched on yet'));
      n.appendChild(P.el('p', '', 'The secure payment system is built but has not been connected to its server. Nothing can be bought here yet, and no payment details are taken on this page.'));
      var a = P.el('a', 'btn btn-primary', 'Order on WhatsApp instead'); a.href = 'https://wa.me/923158935101?text=' + encodeURIComponent('Hello, I would like to order from GM Tools Hub.'); a.target = '_blank'; a.rel = 'noopener noreferrer'; n.appendChild(a);
      n.appendChild(document.createTextNode(' ')); var s = P.el('a', 'btn btn-ghost', 'Browse the shop'); s.href = '../shop/'; n.appendChild(s); box.appendChild(n);
    },
    saveOrder: function (ref, token, product) { try { var l = JSON.parse(localStorage.getItem('gm.orders') || '[]').filter(function (o) { return o.ref !== ref; }); l.unshift({ ref: ref, token: token, product: product, at: new Date().toISOString() }); localStorage.setItem('gm.orders', JSON.stringify(l.slice(0, 30))); } catch (e) { /* storage unavailable */ } },
    orders: function () { try { return JSON.parse(localStorage.getItem('gm.orders') || '[]'); } catch (e) { return []; } },
    steps: function (active) {
      var names = ['Order details', 'Payment', 'Verification', 'Confirmation'], ol = P.el('ol', 'ck-steps'); ol.setAttribute('aria-label', 'Checkout progress');
      names.forEach(function (n, i) { var li = P.el('li', i < active ? 'done' : i === active ? 'on' : '', n); if (i === active) li.setAttribute('aria-current', 'step'); ol.appendChild(li); }); return ol;
    },
    copy: function (text, msg) { var done = function () { msg.textContent = 'Copied'; setTimeout(function () { msg.textContent = ''; }, 1500); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { msg.textContent = 'Select and copy'; }); else msg.textContent = 'Select and copy'; }
  };
})();
