/* GM Tools Hub checkout page. Prices shown here are only for display; the server recomputes the price, coupon and total when the order is created. */
(function () {
  'use strict';
  var P = window.GMPay, root = P && P.$('ck-app'); if (!root) return;
  if (!P.live) { P.notLive(root); return; }
  var $ = P.$, el = P.el, q = new URLSearchParams(location.search), products = [], cfg = null, cur = null, quote = null, couponCode = '';
  root.textContent = ''; root.appendChild(P.steps(0));
  var wrap = el('div', 'ck-grid'); root.appendChild(wrap);
  var left = el('div', 'ck-left'), right = el('aside', 'ck-right'); wrap.appendChild(left); wrap.appendChild(right);
  left.innerHTML = '<p class="muted" id="ck-loading">Loading checkout…</p>';

  function planLine(p, t) {
    if (!p) return '';
    if (p.kind === 'one_time') return 'One-time purchase. Nothing renews.';
    var per = p.kind === 'monthly' ? 'month' : 'year', renew = new Date(); if (t) renew.setUTCDate(renew.getUTCDate() + p.trial_days); else if (p.kind === 'monthly') renew.setUTCMonth(renew.getUTCMonth() + 1); else renew.setUTCFullYear(renew.getUTCFullYear() + 1);
    return (t ? p.trial_days + '-day trial, then ' : '') + P.money(p.price_minor, p.currency) + ' every ' + per + '. First renewal: ' + P.date(renew.toISOString()) + '. Renewal is not charged automatically: we send you a reminder and you pay a new order.';
  }
  function summary() {
    right.textContent = ''; right.appendChild(el('h2', '', 'Order summary'));
    if (!cur) { right.appendChild(el('p', 'muted', 'Choose a product.')); return; }
    var list = quote ? quote.list_minor : cur.price_minor, disc = quote ? quote.discount_minor : 0, total = quote ? quote.total_minor : cur.price_minor, trial = cur.kind !== 'one_time' && cur.trial_days > 0;
    if (trial) total = 0;
    var rows = el('dl', 'ck-rows'); var add = function (k, v, cls) { rows.appendChild(el('dt', '', k)); rows.appendChild(el('dd', cls || '', v)); };
    add('Product', cur.name); add('Original price', P.money(list, cur.currency)); if (disc) add('Discount' + (couponCode ? ' (' + couponCode + ')' : ''), '- ' + P.money(disc, cur.currency), 'ck-save');
    add('Due today', P.money(total, cur.currency), 'ck-total'); right.appendChild(rows);
    right.appendChild(el('p', 'ck-plan', planLine(cur, trial)));
    right.appendChild(el('p', 'small muted', 'Currency: ' + cur.currency + '. No hidden charges: the amount above is the amount you pay.'));
    var sec = el('div', 'ck-secure'); sec.appendChild(el('strong', '', 'How payment is handled'));
    sec.appendChild(el('p', 'small', 'Bank transfer orders are marked paid only after we find your payment in our bank account. Uploading a screenshot alone never completes an order. If card or wallet payment is switched on later, you will pay on the provider’s own secure page and card numbers will never reach this site.'));
    right.appendChild(sec);
    var btn = $('ck-submit'); if (btn) btn.textContent = total === 0 ? 'Complete order' : 'Place order and continue to payment';
  }
  function recurringBox(on) { var b = $('ck-recur-wrap'); if (b) b.hidden = !on; }
  function build() {
    left.textContent = '';
    var f = el('form', 'ck-card'); f.noValidate = true; f.id = 'ck-form'; left.appendChild(f);
    f.appendChild(el('h2', '', '1. Your order'));
    var lab = el('label', '', 'Product'); var sel = el('select'); sel.id = 'ck-product'; products.forEach(function (p) { var o = el('option', '', p.name + ' (' + P.money(p.price_minor, p.currency) + (p.kind === 'one_time' ? '' : ' / ' + (p.kind === 'monthly' ? 'month' : 'year')) + ')'); o.value = p.id; sel.appendChild(o); }); lab.appendChild(sel); f.appendChild(lab);
    f.appendChild(el('h2', '', '2. Your details'));
    [['ck-name', 'Full name', 'text', 'name'], ['ck-email', 'Email address', 'email', 'email'], ['ck-phone', 'Phone or WhatsApp (optional)', 'tel', 'tel']].forEach(function (x) { var l = el('label', '', x[1]); var i = el('input'); i.id = x[0]; i.type = x[2]; i.autocomplete = x[3]; if (x[0] !== 'ck-phone') i.required = true; i.maxLength = 120; l.appendChild(i); f.appendChild(l); });
    f.appendChild(el('h2', '', '3. Coupon'));
    var cr = el('div', 'ck-coupon'); var ci = el('input'); ci.id = 'ck-coupon'; ci.placeholder = 'Promo code (optional)'; ci.maxLength = 30; ci.autocomplete = 'off'; var cb = el('button', 'btn btn-ghost', 'Apply'); cb.type = 'button'; cr.appendChild(ci); cr.appendChild(cb); f.appendChild(cr); var cm = el('p', 'small', ''); cm.id = 'ck-cmsg'; cm.setAttribute('aria-live', 'polite'); f.appendChild(cm);
    f.appendChild(el('h2', '', '4. Payment method'));
    var methods = el('div', 'ck-methods'); f.appendChild(methods);
    var defs = [['bank_transfer', 'Bank transfer', 'Pay from your bank app or branch, then upload your receipt. We verify it by hand.'], ['wallet', 'Mobile wallet', 'Pakistani wallet payment through the provider’s official merchant API.'], ['card', 'Debit / credit card', 'Visa and Mastercard on the provider’s secure hosted page.']];
    defs.forEach(function (d) { var on = cfg.methods.indexOf(d[0]) > -1; var l = el('label', 'ck-method' + (on ? '' : ' off')); var r = el('input'); r.type = 'radio'; r.name = 'ck-method'; r.value = d[0]; r.disabled = !on; if (d[0] === 'bank_transfer' && on) r.checked = true; l.appendChild(r); var s = el('span'); s.appendChild(el('strong', '', d[1])); s.appendChild(el('em', '', on ? d[2] : 'Not available yet. It needs a merchant account that has not been connected.')); l.appendChild(s); methods.appendChild(l); });
    var rw = el('label', 'ck-check'); rw.id = 'ck-recur-wrap'; rw.hidden = true; var rc = el('input'); rc.type = 'checkbox'; rc.id = 'ck-recur'; rw.appendChild(rc); rw.appendChild(el('span', '', 'I understand this is a subscription plan and how it renews, as shown in the order summary.')); f.appendChild(rw);
    var tw = el('label', 'ck-check'); var tc = el('input'); tc.type = 'checkbox'; tc.id = 'ck-terms'; tw.appendChild(tc); var ts = el('span'); ts.appendChild(document.createTextNode('I agree to the ')); [['Terms', '../terms-and-conditions/'], ['Refund Policy', '../refund-policy/'], ['Privacy Policy', '../privacy-policy/']].forEach(function (x, i) { var a = el('a', '', x[0]); a.href = x[1]; a.target = '_blank'; a.rel = 'noopener'; ts.appendChild(a); if (i < 2) ts.appendChild(document.createTextNode(i === 0 ? ', ' : ' and ')); }); tw.appendChild(ts); f.appendChild(tw);
    var msg = el('p', 'small ck-msg', ''); msg.id = 'ck-msg'; msg.setAttribute('role', 'alert'); f.appendChild(msg);
    var sb = el('button', 'btn btn-primary btn-lg', 'Place order and continue to payment'); sb.type = 'submit'; sb.id = 'ck-submit'; f.appendChild(sb);
    var want = q.get('product'); if (want && products.some(function (p) { return p.id === want; })) sel.value = want;
    function pick() { cur = products.filter(function (p) { return p.id === sel.value; })[0]; quote = null; couponCode = ''; cm.textContent = ''; recurringBox(cur && cur.kind !== 'one_time'); summary(); }
    sel.addEventListener('change', pick); pick();
    cb.addEventListener('click', function () { var code = ci.value.trim(); if (!code) { quote = null; couponCode = ''; cm.textContent = ''; summary(); return; } cb.disabled = true; P.api('/api/coupons/validate', { method: 'POST', json: { product_id: cur.id, code: code } }).then(function (r) { quote = r; couponCode = code.toUpperCase(); cm.textContent = 'Code applied.'; cm.className = 'small ck-ok'; summary(); }, function (e) { quote = null; couponCode = ''; cm.textContent = e.message; cm.className = 'small ck-err'; summary(); }).then(function () { cb.disabled = false; }); });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); msg.textContent = ''; msg.className = 'small ck-msg';
      var name = $('ck-name').value.trim(), email = $('ck-email').value.trim(), phone = $('ck-phone').value.trim(), m = f.querySelector('input[name=ck-method]:checked');
      if (name.length < 2) { msg.textContent = 'Please enter your name.'; $('ck-name').focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'Please enter a valid email address.'; $('ck-email').focus(); return; }
      if (!m) { msg.textContent = 'Please choose a payment method.'; return; }
      if (!$('ck-terms').checked) { msg.textContent = 'Please accept the terms and refund policy.'; return; }
      if (cur.kind !== 'one_time' && !$('ck-recur').checked) { msg.textContent = 'Please confirm you understand how this plan renews.'; return; }
      sb.disabled = true; sb.textContent = 'Creating your order…';
      P.api('/api/orders', { method: 'POST', json: { product_id: cur.id, method: m.value, name: name, email: email, phone: phone, coupon: couponCode || undefined, accept_terms: true, accept_recurring: cur.kind !== 'one_time' ? true : undefined } }).then(function (r) {
        P.saveOrder(r.order.ref, r.token, r.order.product); if (window.GM_track) window.GM_track('checkout_order_created', { page: location.pathname });
        location.href = 'status/?ref=' + encodeURIComponent(r.order.ref) + '#t=' + encodeURIComponent(r.token);
      }, function (e) { msg.textContent = e.message; sb.disabled = false; summary(); });
    });
  }
  Promise.all([P.api('/api/products'), P.api('/api/config')]).then(function (r) { products = r[0].products; cfg = r[1]; if (!products.length) { left.textContent = ''; left.appendChild(el('p', '', 'No products are available for checkout yet.')); return; } build(); }, function (e) { left.textContent = ''; left.appendChild(el('p', 'ck-err', e.message)); });
})();
