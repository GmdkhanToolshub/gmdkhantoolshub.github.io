/* GM business quote request form. Builds a clear, structured message and lets the visitor send it by email or WhatsApp.
   Nothing is sent automatically and nothing is stored by this page. A reference code and a simple lead score help GM reply faster. */
(function () {
  'use strict';
  var EMAIL = 'asmarkniazi@gmail.com', WA = '923032246269';
  var COUNTRIES = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman', 'Bahrain', 'United Kingdom', 'Ireland', 'Germany', 'Netherlands', 'France', 'Spain', 'Italy', 'Sweden', 'United States', 'Canada', 'Australia', 'New Zealand', 'Singapore', 'Malaysia', 'South Africa', 'Pakistan', 'Other'];
  var SERVICES = ['Sales or distribution dashboard', 'KPI scorecard or performance reporting', 'HR attendance and leave system', 'Inventory or stock tracking', 'Monthly management reporting pack', 'Excel automation or cleanup', 'Simple business website or web tool', 'Customised version of a GM template', 'Something else'];
  var BUDGET = [['Under $300', 0], ['$300 to $1,000', 1], ['$1,000 to $3,000', 2], ['More than $3,000', 3], ['Not sure yet', 0]];
  var TIME = [['As soon as possible (under 2 weeks)', 2], ['2 to 4 weeks', 2], ['1 to 3 months', 1], ['Flexible', 0]];
  var SIZE = [['Just me (1 person)', 0], ['2 to 10 people', 1], ['11 to 50 people', 2], ['51 to 200 people', 2], ['More than 200 people', 2]];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function opts(list, first) { return (first ? '<option value="">' + first + '</option>' : '') + list.map(function (x) { var v = Array.isArray(x) ? x[0] : x; return '<option>' + esc(v) + '</option>'; }).join(''); }
  function ref() { var d = new Date(); return 'Q-' + String(d.getFullYear()).slice(2) + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }
  function pts(list, v) { for (var i = 0; i < list.length; i++) if (list[i][0] === v) return list[i][1]; return 0; }
  function score(f) { var s = pts(BUDGET, f.budget) + pts(TIME, f.timeline) + pts(SIZE, f.size) + (f.description.length >= 200 ? 2 : f.description.length >= 80 ? 1 : 0) + (/^(United Arab Emirates|Saudi Arabia|Qatar|Kuwait|Oman|Bahrain|United Kingdom|Ireland|Germany|Netherlands|France|Spain|Italy|Sweden|United States|Canada|Australia|New Zealand|Singapore)$/.test(f.country) ? 1 : 0); return Math.min(10, s); }
  function mount(host, o) {
    o = o || {}; var market = o.market || 'General';
    host.innerHTML = '<form class="quote-form card" novalidate autocomplete="on"><h3 style="margin:0 0 4px">Request a quote</h3><p class="muted" style="margin:0 0 12px">Tell us what you need. You will get a written, fixed-price quote, usually within one to two working days. Your message opens in your own email or WhatsApp app, so you stay in control of what is sent.</p>' +
      '<div class="grid grid-2"><label>Your name *<br><input name="name" required maxlength="80" autocomplete="name"></label><label>Company *<br><input name="company" required maxlength="100" autocomplete="organization"></label>' +
      '<label>Work email *<br><input name="email" type="email" required maxlength="120" autocomplete="email"></label><label>WhatsApp or phone (optional)<br><input name="phone" maxlength="30" autocomplete="tel"></label>' +
      '<label>Country *<br><select name="country" required>' + opts(COUNTRIES, 'Choose your country') + '</select></label><label>What do you need? *<br><select name="service" required>' + opts(SERVICES, 'Choose a service') + '</select></label>' +
      '<label>Budget (USD)<br><select name="budget">' + opts(BUDGET) + '</select></label><label>When do you need it?<br><select name="timeline">' + opts(TIME) + '</select></label>' +
      '<label>Team size<br><select name="size">' + opts(SIZE) + '</select></label><label>Preferred contact<br><select name="channel"><option>Email</option><option>WhatsApp</option></select></label></div>' +
      '<label style="display:block;margin-top:10px">Describe your project * <small class="muted">(what you track today, what you want to see, any deadline)</small><br><textarea name="description" required rows="5" maxlength="1500" style="width:100%"></textarea></label>' +
      '<div style="position:absolute;left:-9999px" aria-hidden="true"><label>Leave this empty <input name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<label style="display:flex;gap:8px;align-items:flex-start;margin-top:10px"><input type="checkbox" name="consent" required style="margin-top:4px"><span class="small">I agree that GM may use these details to reply to my request. See the <a href="' + (o.base || '../../') + 'privacy-policy/">privacy policy</a>.</span></label>' +
      '<p class="inline-error" role="alert" hidden style="color:#b91c1c;font-weight:700;margin:8px 0 0"></p><div class="btn-row" style="margin-top:12px"><button class="btn btn-primary" type="submit">Prepare my quote request</button></div></form><div class="quote-done" hidden></div>';
    var form = host.querySelector('form'), err = host.querySelector('.inline-error'), done = host.querySelector('.quote-done');
    form.addEventListener('submit', function (e) {
      e.preventDefault(); err.hidden = true; var fd = new FormData(form), f = {}; ['name', 'company', 'email', 'phone', 'country', 'service', 'budget', 'timeline', 'size', 'channel', 'description', 'website'].forEach(function (k) { f[k] = String(fd.get(k) || '').trim(); });
      if (f.website) return;
      var bad = !f.name ? 'Please enter your name.' : !f.company ? 'Please enter your company.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email) ? 'Please enter a valid email address.' : !f.country ? 'Please choose your country.' : !f.service ? 'Please choose a service.' : f.description.length < 40 ? 'Please describe your project in at least a couple of sentences (40 characters or more).' : !form.consent.checked ? 'Please tick the box to agree.' : '';
      if (bad) { err.textContent = bad; err.hidden = false; err.scrollIntoView({ block: 'center' }); return; }
      var r = ref(), sc = score(f), pr = sc >= 7 ? 'A (high)' : sc >= 4 ? 'B (medium)' : 'C (standard)';
      var msg = 'Quote request ' + r + '\n\nName: ' + f.name + '\nCompany: ' + f.company + '\nEmail: ' + f.email + '\nPhone: ' + (f.phone || '-') + '\nCountry: ' + f.country + '\nService: ' + f.service + '\nBudget: ' + f.budget + '\nTimeline: ' + f.timeline + '\nTeam size: ' + f.size + '\nPreferred contact: ' + f.channel + '\nMarket page: ' + market + '\n\nProject:\n' + f.description + '\n\n(Auto summary for GM: lead score ' + sc + '/10, priority ' + pr + ')';
      var mailto = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Quote request ' + r + ' - ' + f.company) + '&body=' + encodeURIComponent(msg), wa = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
      form.hidden = true; done.hidden = false;
      done.innerHTML = '<div class="card"><h3 style="margin:0 0 6px">Almost done. Your request ' + esc(r) + ' is ready.</h3><p>Choose how to send it. Your email or WhatsApp app opens with the message filled in. <b>Press Send there</b> to finish.</p><div class="btn-row"><a class="btn btn-primary" href="' + esc(mailto) + '">Send by email</a><a class="btn btn-ghost" href="' + esc(wa) + '" target="_blank" rel="noopener noreferrer">Send on WhatsApp</a><button class="btn btn-ghost" type="button" id="q-copy">Copy the message</button></div><p class="small muted" style="margin:10px 0 0">If neither opens, copy the message and email it to ' + EMAIL + '. Keep the reference ' + esc(r) + '.</p><details style="margin-top:10px"><summary>What happens next</summary><ol><li>GM reads your request and replies, usually within one to two working days.</li><li>You receive a written fixed-price quote with scope, timeline and payment terms.</li><li>Work starts only after you accept the quote.</li></ol></details><p><button class="btn btn-ghost btn-sm" type="button" id="q-again">Edit my request</button></p></div>';
      done.querySelector('#q-copy').addEventListener('click', function () { var b = this; (navigator.clipboard ? navigator.clipboard.writeText(msg) : Promise.reject()).then(function () { b.textContent = 'Copied'; }, function () { var t = document.createElement('textarea'); t.value = msg; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); b.textContent = 'Copied'; } catch (x) {} t.remove(); }); });
      done.querySelector('#q-again').addEventListener('click', function () { done.hidden = true; form.hidden = false; });
      window.GMQuoteLast = { ref: r, score: sc }; done.scrollIntoView({ block: 'start', behavior: 'smooth' });
      try { if (window.dataLayer || window.gtag) (window.gtag ? gtag('event', 'quote_request_prepared', { market: market, priority: pr }) : dataLayer.push({ event: 'quote_request_prepared', params: { market: market } })); } catch (x) { /* ignore */ }
    });
  }
  window.GMQuote = { mount: mount, score: score };
  var auto = document.querySelectorAll('[data-quote]'); [].forEach.call(auto, function (h) { mount(h, { market: h.getAttribute('data-quote'), base: (document.body.getAttribute('data-root') || './') }); });
})();
