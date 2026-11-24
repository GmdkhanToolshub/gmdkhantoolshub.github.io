/* GM Tools Hub order page: payment instructions, receipt upload, verification status, confirmation, and this browser's order history. */
(function () {
  'use strict';
  var P = window.GMPay, root = P && P.$('ck-status'); if (!root) return;
  if (!P.live) { P.notLive(root); return; }
  var el = P.el, q = new URLSearchParams(location.search), ref = (q.get('ref') || '').toUpperCase(), hm = location.hash.match(/t=([A-Za-z0-9_-]+)/), token = hm ? hm[1] : '', timer = null;
  if (ref && !token) { var f = P.orders().filter(function (o) { return o.ref === ref; })[0]; if (f) token = f.token; }
  function history() {
    root.textContent = ''; root.appendChild(el('h2', '', 'Your orders on this device'));
    var l = P.orders(); if (!l.length) { root.appendChild(el('p', 'muted', 'No orders found in this browser. Open the link you were shown after checkout, or start a new order.')); var a = el('a', 'btn btn-primary', 'Go to checkout'); a.href = '../'; root.appendChild(a); return; }
    var ul = el('ul', 'ck-orders'); l.forEach(function (o) { var li = el('li'); var a = el('a', '', o.ref); a.href = '?ref=' + encodeURIComponent(o.ref) + '#t=' + encodeURIComponent(o.token); li.appendChild(a); li.appendChild(document.createTextNode(' ' + (o.product || '') + ' · ' + P.date(o.at))); ul.appendChild(li); }); root.appendChild(ul);
    root.appendChild(el('p', 'small muted', 'This list is stored only in this browser. Keep your order link safe: it is the key to your order page.'));
  }
  if (!ref || !/^GM-[A-Z0-9]{8}$/.test(ref)) { history(); return; }
  if (!token) { root.textContent = ''; root.appendChild(el('p', '', 'This order link is incomplete. Please open the full link you were shown after checkout, or look in your browser’s order list.')); var b = el('a', 'btn btn-ghost', 'See my orders'); b.href = './'; root.appendChild(b); return; }

  var STEP = { pending_payment: 1, awaiting_verification: 2, paid: 3, partially_refunded: 3, refunded: 3, rejected: 2, expired: 1, cancelled: 1 };
  function row(dl, k, v, cls) { dl.appendChild(el('dt', '', k)); dl.appendChild(el('dd', cls || '', v)); }
  function render(o) {
    clearTimeout(timer); root.textContent = '';
    var step = STEP[o.status] != null ? STEP[o.status] : 1, failed = ['rejected', 'expired', 'cancelled'].indexOf(o.status) > -1; root.appendChild(P.steps(step));
    var grid = el('div', 'ck-grid'), main = el('div', 'ck-left'), side = el('aside', 'ck-right'); grid.appendChild(main); grid.appendChild(side); root.appendChild(grid);
    side.appendChild(el('h2', '', 'Order ' + o.ref)); var dl = el('dl', 'ck-rows'); row(dl, 'Product', o.product); row(dl, 'Original price', P.money(o.list_minor, o.currency)); if (o.discount_minor) row(dl, 'Discount' + (o.coupon ? ' (' + o.coupon + ')' : ''), '- ' + P.money(o.discount_minor, o.currency), 'ck-save'); row(dl, 'Amount', P.money(o.total_minor, o.currency), 'ck-total'); row(dl, 'Placed', P.dateTime(o.created_at)); if (o.paid_at) row(dl, 'Paid', P.dateTime(o.paid_at)); side.appendChild(dl);
    if (o.kind !== 'one_time') side.appendChild(el('p', 'ck-plan', (o.trial_days ? o.trial_days + '-day trial. ' : '') + 'Renews at ' + P.money(o.recurring_minor, o.currency) + ' every ' + (o.kind === 'monthly' ? 'month' : 'year') + (o.renews_at ? ', next renewal ' + P.date(o.renews_at) : '') + '. Not charged automatically: you will get a reminder.'));
    if (o.refunded_minor) side.appendChild(el('p', 'small', 'Refunded so far: ' + P.money(o.refunded_minor, o.currency)));
    var card = el('div', 'ck-card'); main.appendChild(card);
    if (o.status === 'paid' || o.status === 'partially_refunded' || o.status === 'refunded') {
      card.appendChild(el('h2', 'ck-ok', o.status === 'paid' ? (o.total_minor ? 'Payment verified. Thank you!' : 'Your order is confirmed') : o.status === 'refunded' ? 'This order was refunded' : 'This order was partly refunded'));
      card.appendChild(el('p', '', 'Keep this order number for support: ' + o.ref + '. We deliver your purchase to the email address you gave at checkout, and we will contact you if anything is missing.'));
    } else if (failed) {
      card.appendChild(el('h2', 'ck-err', o.status === 'expired' ? 'This order has expired' : o.status === 'cancelled' ? 'This order was cancelled' : 'We could not verify this payment'));
      card.appendChild(el('p', '', o.status === 'expired' ? 'Orders are held for a limited time. If you already paid, contact support with your reference and receipt. Otherwise you can start a new order.' : 'No payment has been accepted for this order. You can contact support with your reference, or place a new order.'));
      var n = el('a', 'btn btn-primary', 'Start a new order'); n.href = '../'; card.appendChild(n);
    } else {
      if (o.status === 'awaiting_verification') { card.appendChild(el('h2', '', 'Receipt received: verification in progress')); card.appendChild(el('p', '', 'Your order is not paid yet. We will mark it paid after we find your payment in our bank account. This page updates by itself.')); timer = setTimeout(load, 20000); }
      else card.appendChild(el('h2', '', 'Pay by bank transfer'));
      var i = o.instructions;
      if (i) {
        var box = el('div', 'ck-bank'); card.appendChild(box); var msg = el('span', 'small ck-ok'); msg.setAttribute('aria-live', 'polite');
        var line = function (k, v) { if (!v) return; var r = el('div', 'ck-line'); r.appendChild(el('span', 'k', k)); r.appendChild(el('strong', '', v)); var c = el('button', 'btn btn-ghost btn-sm', 'Copy'); c.type = 'button'; c.addEventListener('click', function () { P.copy(v, msg); }); r.appendChild(c); box.appendChild(r); };
        line('Amount to pay', P.money(o.total_minor, o.currency)); line('Bank', i.bank_name); line('Account title', i.account_title); line('Account number', i.account_number); line('IBAN', i.iban); line('Branch', i.branch); line('Wallet', i.wallet_details); line('Payment reference', o.ref);
        box.appendChild(msg); card.appendChild(el('p', 'small', 'Send exactly the amount shown and write ' + o.ref + ' in the payment description. Then upload your receipt below.' + (i.support_email ? ' Questions: ' + i.support_email : '')));
        card.appendChild(el('p', 'small muted', 'Order held until ' + P.dateTime(o.expires_at) + '.'));
      }
      if (o.payments.length) { var ul = el('ul', 'ck-orders'); o.payments.forEach(function (p) { ul.appendChild(el('li', '', 'Receipt ' + (p.txn_reference || '') + ': ' + (p.status === 'submitted' ? 'waiting for verification' : p.status) + (p.note ? ' (' + p.note + ')' : ''))); }); card.appendChild(ul); }
      var f = el('form', 'ck-upload'); f.noValidate = true; f.appendChild(el('h3', '', o.status === 'awaiting_verification' ? 'Upload another receipt (optional)' : 'Upload your receipt'));
      var mk = function (lbl, id, type, extra) { var l = el('label', '', lbl); var inp = el('input'); inp.id = id; inp.type = type; if (extra) for (var k in extra) inp[k] = extra[k]; l.appendChild(inp); f.appendChild(l); return inp; };
      var txn = mk('Transaction or reference number from your bank', 'ck-txn', 'text', { maxLength: 64, autocomplete: 'off' }), who = mk('Name on the payment (optional)', 'ck-payer', 'text', { maxLength: 80 }), file = mk('Receipt (JPG, PNG, WEBP or PDF, up to 3 MB)', 'ck-file', 'file', { accept: 'image/jpeg,image/png,image/webp,application/pdf' });
      var um = el('p', 'small', ''); um.setAttribute('role', 'alert'); var ub = el('button', 'btn btn-primary', 'Submit receipt'); ub.type = 'submit'; f.appendChild(um); f.appendChild(ub); card.appendChild(f);
      f.addEventListener('submit', function (ev) { ev.preventDefault(); um.className = 'small ck-err'; if (!file.files[0]) { um.textContent = 'Please choose your receipt file.'; return; } if (file.files[0].size > 3000000) { um.textContent = 'The file is larger than 3 MB.'; return; } if (txn.value.trim().length < 3) { um.textContent = 'Please enter the transaction reference.'; return; } ub.disabled = true; um.textContent = 'Uploading…'; var fd = new FormData(); fd.append('file', file.files[0]); fd.append('txn_reference', txn.value.trim()); fd.append('payer_name', who.value.trim()); P.api('/api/orders/' + ref + '/receipt', { method: 'POST', body: fd, token: token }).then(function (r) { render(r.order); }, function (e) { um.textContent = e.message; ub.disabled = false; }); });
      if (o.status === 'pending_payment') { var cb = el('button', 'btn btn-ghost btn-sm', 'Cancel this order'); cb.type = 'button'; cb.addEventListener('click', function () { P.api('/api/orders/' + ref + '/cancel', { method: 'POST', token: token }).then(load, function (e) { um.textContent = e.message; }); }); card.appendChild(cb); }
    }
    var more = el('p', 'small'); var a = el('a', '', 'See all orders on this device'); a.href = './'; more.appendChild(a); main.appendChild(more);
  }
  function load() { P.api('/api/orders/' + ref, { token: token }).then(function (r) { render(r.order); }, function (e) { root.textContent = ''; root.appendChild(el('p', 'ck-err', e.status === 404 ? 'We could not find this order. Check that you opened the full link.' : e.message)); }); }
  load();
})();
