/* GM HCM pricing table. Reads plans from assets/js/hcm-plans.js (monthly / annual toggle). */
NiaziTools['hcm-pricing'] = function (root, U) {
  var P = window.GM_HCM_PLANS, esc = U.esc, yearly = false;
  function price(p) {
    if (p.monthly === null) return '<span class="pr-amt">Custom</span><span class="pr-per">quotation</span>';
    if (p.monthly === 0) return '<span class="pr-amt">' + P.currency + ' 0</span><span class="pr-per">demo only</span>';
    var v = yearly ? p.monthly * P.annualMonthsBilled : p.monthly, uv = yearly ? Math.round(p.usd * P.annualMonthsBilled * 100) / 100 : p.usd;
    return '<span class="pr-amt">' + P.usdCurrency + uv.toLocaleString('en-US', { minimumFractionDigits: 2 }) + '</span><span class="pr-per">per ' + (yearly ? 'year' : 'month') + ' &middot; ' + P.currency + ' ' + v.toLocaleString('en-US') + '</span>' + (yearly ? '<span class="pr-save small">Equivalent to ' + P.currency + ' ' + Math.round(v / 12).toLocaleString('en-US') + ' per month</span>' : '');
  }
  function paint() {
    root.innerHTML = '<div class="pill-row" role="group" aria-label="Billing period" style="justify-content:center"><button type="button" class="pill" data-y="0" aria-pressed="' + !yearly + '">Monthly</button><button type="button" class="pill" data-y="1" aria-pressed="' + yearly + '">Annual (' + (12 - P.annualMonthsBilled) + ' months free)</button></div><div class="pr-grid">' +
      P.plans.map(function (p) {
        var href = p.href ? p.href : '#', req = '';
        if (!p.href) { var ref = 'HCM-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(), pricetxt = p.monthly === null ? 'custom quotation' : (yearly ? '$' + (Math.round(p.usd * P.annualMonthsBilled * 100) / 100).toFixed(2) + ' per year (Rs ' + (p.monthly * P.annualMonthsBilled).toLocaleString('en-US') + ')' : '$' + p.usd.toFixed(2) + ' per month (Rs ' + p.monthly.toLocaleString('en-US') + ')'), msg = 'GM HCM request ' + ref + '\n\nPlan: ' + p.name + ' (' + p.capacity + ')\nBilling: ' + (yearly ? 'Annual' : 'Monthly') + '\nPrice: ' + pricetxt + '\nCompany:\nNumber of employees:\nCountry:\nPreferred payment: Bank transfer / JazzCash (Pakistan only)\n\nPlease confirm availability and send the payment details.';
          href = 'https://wa.me/923032246269?text=' + encodeURIComponent(msg); req = '<a class="small" style="display:block;margin-top:8px" href="mailto:asmarkniazi@gmail.com?subject=' + encodeURIComponent('GM HCM request ' + ref + ' - ' + p.name) + '&body=' + encodeURIComponent(msg) + '">Or request by email</a>'; }
        return '<article class="pr-card' + (p.featured ? ' pr-feat' : '') + '">' + (p.featured ? '<span class="pr-tag">Most complete</span>' : '') + '<h3>' + esc(p.name) + '</h3><p class="small muted">' + esc(p.capacity) + '</p><div class="pr-price">' + price(p) + '</div><p>' + esc(p.blurb) + '</p><ul>' + p.features.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul><a class="btn ' + (p.featured ? 'btn-primary' : 'btn-ghost') + '" href="' + href + '"' + (p.href ? '' : ' target="_blank" rel="noopener noreferrer"') + '>' + esc(p.cta) + '</a>' + req + '</article>';
      }).join('') + '</div>';
  }
  root.addEventListener('click', function (e) { var b = e.target.closest('[data-y]'); if (b) { yearly = b.dataset.y === '1'; paint(); } });
  paint();
};
