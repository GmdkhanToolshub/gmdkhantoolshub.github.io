/* Site-wide behaviour: theme, nav, consent, ads, analytics, favourites, recents, tool search, contact form. */
(function () {
  'use strict';
  var C = window.SITE_CONFIG || {};
  var doc = document, root = doc.documentElement;
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function store(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var base = (doc.body.getAttribute('data-root') || './');

  /* ---------- theme ---------- */
  var themeBtn = $('#theme-toggle');
  function applyThemeLabel() { if (themeBtn) themeBtn.setAttribute('aria-label', root.getAttribute('data-theme') === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); }
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next); save('niazi.theme', next); applyThemeLabel();
  });
  applyThemeLabel();

  /* ---------- mobile menu ---------- */
  var mt = $('#menu-toggle'), nl = $('#nav-links');
  if (mt && nl) {
    mt.addEventListener('click', function () { var o = nl.classList.toggle('open'); mt.setAttribute('aria-expanded', o); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nl.classList.contains('open')) { nl.classList.remove('open'); mt.setAttribute('aria-expanded', 'false'); mt.focus(); } });
  }

  /* ---------- opened straight from disk (double-click): folders need an explicit index.html ---------- */
  if (location.protocol === 'file:') {
    doc.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || a.protocol !== 'file:' || a.target) return;
      if (/\/$/.test(a.pathname)) { e.preventDefault(); location.href = a.pathname + 'index.html' + a.search + a.hash; }
    });
    doc.addEventListener('submit', function (e) {
      var f = e.target;
      if (f.method !== 'get' || !/\/$/.test(f.action)) return;
      e.preventDefault(); location.href = f.action + 'index.html?' + new URLSearchParams(new FormData(f)).toString();
    });
  }

  /* ---------- footer year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- consent, analytics, ads ---------- */
  var CK = 'niazi.consent';
  var consent = store(CK, null);
  function loadScript(src, attrs) { var s = doc.createElement('script'); s.async = true; s.src = src; for (var k in (attrs || {})) s.setAttribute(k, attrs[k]); doc.head.appendChild(s); return s; }
  var analyticsLoaded = false;
  function loadAnalytics() {
    if (analyticsLoaded || !C.gaMeasurementId) return; analyticsLoaded = true;
    window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', C.gaMeasurementId, { anonymize_ip: true });
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(C.gaMeasurementId));
  }
  function slotId(key) { return (C.adSlots && C.adSlots[key]) || ''; }
  /* The AdSense loader itself is in <head> (see build.py). Ads stay non-personalised until the visitor accepts. */
  function initAds() {
    var slots = $$('.ad-slot');
    if (/[?&]adpreview=1/.test(location.search)) {
      slots.forEach(function (s) { s.setAttribute('data-ad-state', 'on'); if (!$('.ad-ph', s)) { var d = doc.createElement('div'); d.className = 'ad-ph'; d.textContent = s.getAttribute('data-ad') + ' ad slot (preview)'; s.appendChild(d); } });
      return;
    }
    slots.forEach(function (s) {
      var id = slotId(s.getAttribute('data-ad'));
      if (!C.adsensePublisherId || !id) { s.setAttribute('data-ad-state', 'off'); return; }
      if (s.querySelector('ins')) return;
      var ins = doc.createElement('ins'); ins.className = 'adsbygoogle'; ins.style.display = 'block';
      ins.setAttribute('data-ad-client', C.adsensePublisherId); ins.setAttribute('data-ad-slot', id); ins.setAttribute('data-ad-format', 'auto'); ins.setAttribute('data-full-width-responsive', 'true');
      s.appendChild(ins); s.setAttribute('data-ad-state', 'on');
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* ad blocked or failed */ }
    });
  }
  function closeBanner() { var b = $('#consent'); if (b) b.remove(); }
  function showBanner() {
    if ($('#consent')) return;
    var b = doc.createElement('div'); b.className = 'consent'; b.id = 'consent'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Cookie preferences');
    b.innerHTML = '<p>Ads keep these tools free. Accept to allow analytics and personalised ads; choose Essential only and any ads you see are not personalised. See the <a href="' + base + 'cookie-policy/">Cookie Policy</a> and <a href="' + base + 'privacy-policy/">Privacy Policy</a>.</p><div class="btn-row"><button type="button" class="btn btn-primary btn-sm" id="c-all">Accept all</button><button type="button" class="btn btn-ghost btn-sm" id="c-ess">Essential only</button></div>';
    doc.body.appendChild(b);
    $('#c-all').addEventListener('click', function () { var had = consent; consent = 'all'; save(CK, 'all'); closeBanner(); loadAnalytics(); if (had === 'essential') location.reload(); });
    $('#c-ess').addEventListener('click', function () { var had = consent; consent = 'essential'; save(CK, 'essential'); closeBanner(); if (had === 'all') location.reload(); });
  }
  var needsConsent = !!(C.gaMeasurementId || C.adsensePublisherId);
  initAds();
  if (consent === 'all') loadAnalytics();
  if (consent == null && needsConsent) showBanner();
  $$('[data-open-consent]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); showBanner(); }); });
  if (!needsConsent) $$('[data-open-consent]').forEach(function (a) { var li = a.closest('li'); if (li) li.hidden = true; });

  /* ---------- tools data: favourites & recents ---------- */
  var TD = window.TOOLS_DATA || [];
  var FAV = 'niazi.favs', REC = 'niazi.recent';
  function toolBySlug(s) { return TD.filter(function (t) { return t.slug === s; })[0]; }
  function cardHTML(t, fav) {
    return '<article class="card tool-card hover" data-slug="' + t.slug + '" data-cat="' + esc(t.cat) + '"><button type="button" class="fav-btn" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Remove ' : 'Save ') + esc(t.name) + (fav ? ' from favourites' : ' to favourites') + '" data-fav="' + t.slug + '">' + (window.STAR_ICON || '') + '</button>' +
      '<div class="icon-chip ' + t.catClass + '" aria-hidden="true">' + t.icon + '</div><h3><a href="' + base + 'tools/' + t.slug + '/' + (location.protocol === 'file:' ? 'index.html' : '') + '" class="stretch">' + esc(t.name) + '</a></h3><p>' + esc(t.desc) + '</p><div class="meta"><span>' + esc(t.cat) + '</span><span>Free</span></div></article>';
  }
  function setFavUI() {
    var favs = store(FAV, []);
    $$('[data-fav]').forEach(function (b) {
      var on = favs.indexOf(b.getAttribute('data-fav')) >= 0; b.setAttribute('aria-pressed', on);
      if (b.classList.contains('fav-btn')) { var t = toolBySlug(b.getAttribute('data-fav')); if (t) b.setAttribute('aria-label', (on ? 'Remove ' : 'Save ') + t.name + (on ? ' from favourites' : ' to favourites')); }
      else { var l = $('[data-fav-label]', b); if (l) l.textContent = on ? 'Saved to favourites' : 'Save to favourites'; }
    });
  }
  function renderLists() {
    var fb = $('#fav-tools'), rb = $('#recent-tools');
    if (fb) {
      var favs = store(FAV, []).map(toolBySlug).filter(Boolean), sec = fb.closest('[data-list-section]');
      fb.innerHTML = favs.map(function (t) { return cardHTML(t, true); }).join('');
      if (sec) sec.hidden = !favs.length;
    }
    if (rb) {
      var rec = store(REC, []).map(toolBySlug).filter(Boolean).slice(0, 4), s2 = rb.closest('[data-list-section]');
      rb.innerHTML = rec.map(function (t) { return cardHTML(t, store(FAV, []).indexOf(t.slug) >= 0); }).join('');
      if (s2) s2.hidden = !rec.length;
    }
    setFavUI();
  }
  doc.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fav]'); if (!b) return;
    e.preventDefault(); var s = b.getAttribute('data-fav'), favs = store(FAV, []), i = favs.indexOf(s);
    if (i >= 0) favs.splice(i, 1); else favs.unshift(s);
    save(FAV, favs); renderLists();
  });
  var tp = doc.body.getAttribute('data-tool');
  if (tp) { var r = store(REC, []).filter(function (x) { return x !== tp; }); r.unshift(tp); save(REC, r.slice(0, 8)); }
  renderLists();

  /* ---------- tools directory search & filter ---------- */
  var search = $('#tool-search'), chips = $$('.chip[data-cat]');
  if (search || chips.length) {
    var cat = 'All', all = $$('#all-tools .tool-card'), empty = $('#no-results');
    var apply = function () {
      var q = (search ? search.value : '').trim().toLowerCase(), n = 0;
      all.forEach(function (c) {
        var hay = (c.getAttribute('data-search') || '').toLowerCase(), ok = (cat === 'All' || c.getAttribute('data-cat') === cat) && (!q || q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; }));
        c.hidden = !ok; if (ok) n++;
      });
      if (empty) empty.hidden = n > 0;
      var cnt = $('#result-count'); if (cnt) cnt.textContent = n + (n === 1 ? ' tool' : ' tools');
    };
    if (search) search.addEventListener('input', apply);
    chips.forEach(function (ch) { ch.addEventListener('click', function () { cat = ch.getAttribute('data-cat'); chips.forEach(function (x) { x.setAttribute('aria-pressed', x === ch); }); apply(); }); });
    var cl = $('#clear-search'); if (cl) cl.addEventListener('click', function () { if (search) search.value = ''; cat = 'All'; chips.forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-cat') === 'All'); }); apply(); if (search) search.focus(); });
    /* deep links from the home page: ?q=salary and ?cat=Career */
    var params = new URLSearchParams(location.search), pq = params.get('q'), pc = params.get('cat');
    if (pq && search) search.value = pq;
    if (pc && chips.some(function (x) { return x.getAttribute('data-cat') === pc; })) { cat = pc; chips.forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-cat') === pc); }); }
    apply();
  }

  /* ---------- share links ---------- */
  var shareRows = $$('[data-share]');
  if (shareRows.length) {
    var canon = ($('link[rel="canonical"]') || {}).href || '';
    var realUrl = location.protocol !== 'file:' && canon && !/example\.com/.test(canon);
    if (realUrl) {
      var h1 = $('h1'), title = h1 ? h1.textContent.trim() : doc.title, enc = encodeURIComponent;
      var targets = {
        whatsapp: 'https://wa.me/?text=' + enc(title + ' ' + canon),
        linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + enc(canon),
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + enc(canon)
      };
      shareRows.forEach(function (row) {
        $$('[data-net]', row).forEach(function (el) {
          var n = el.getAttribute('data-net');
          if (targets[n]) el.setAttribute('href', targets[n]);
          if (n === 'native') { if (navigator.share) el.hidden = false; else return; el.addEventListener('click', function () { navigator.share({ title: title, url: canon }).catch(function () {}); }); }
          if (n === 'copy') el.addEventListener('click', function () {
            var done = function () { var s = $('span', el); if (s) { s.textContent = 'Copied'; setTimeout(function () { s.textContent = 'Copy link'; }, 1800); } };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(canon).then(done, function () { window.prompt('Copy this link:', canon); });
            else window.prompt('Copy this link:', canon);
          });
        });
        row.hidden = false;
      });
    }
  }

  /* ---------- contact form ---------- */
  var form = $('#contact-form');
  if (form) {
    var msg = $('#form-msg');
    form.addEventListener('submit', function (e) {
      e.preventDefault(); msg.className = 'form-error'; msg.textContent = '';
      var el = form.elements; // note: form.name would be the form's own name attribute, so always use form.elements
      var d = { name: el['name'].value.trim(), email: el['email'].value.trim(), topic: el['topic'].value, message: el['message'].value.trim(), hp: el['company_website'] ? el['company_website'].value : '' };
      if (d.hp) return; // honeypot
      if (!d.name) return fail('Please enter your name.', el['name']);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return fail('Please enter a valid email address.', el['email']);
      if (d.message.length < 10) return fail('Please write a message of at least 10 characters.', el['message']);
      var subject = '[Website] ' + d.topic + ' — ' + d.name;
      var body = d.message + '\n\n— ' + d.name + ' (' + d.email + ')';
      if (C.formEndpoint) {
        var btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Sending…';
        fetch(C.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ name: d.name, email: d.email, topic: d.topic, message: d.message, _subject: subject }) })
          .then(function (r) { if (!r.ok) throw new Error('bad status'); msg.className = 'form-success'; msg.textContent = 'Thank you — your message has been sent.'; form.reset(); })
          .catch(function () { msg.className = 'form-error'; msg.textContent = 'Sending failed. Please email me directly at ' + C.contactEmail + '.'; })
          .then(function () { btn.disabled = false; btn.textContent = 'Send message'; });
      } else {
        location.href = 'mailto:' + C.contactEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        msg.className = 'form-success'; msg.textContent = 'Your email app should open with the message ready to send. If nothing happens, email ' + C.contactEmail + ' directly.';
      }
    });
    function fail(t, el) { msg.className = 'form-error'; msg.textContent = t; if (el) el.focus(); }
  }

  /* ---------- tool page boot ---------- */
  var tr = $('#tool-root');
  if (tr) {
    var slug = tr.getAttribute('data-tool-id');
    window.addEventListener('load', function () {
      try {
        if (!window.NiaziTools || !NiaziTools[slug]) throw new Error('Tool script not found');
        tr.innerHTML = ''; NiaziTools[slug](tr, window.NiaziUtil);
      } catch (err) {
        tr.innerHTML = '<div class="empty-state"><b>This tool could not start</b>Please refresh the page. If the problem continues, contact us and mention “' + esc(slug) + '”.</div>';
        if (window.console) console.warn(err);
      }
    });
  }
})();
