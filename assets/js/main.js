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
  var analyticsLoaded = false, inKids = /\/kids\//.test(location.pathname);
  /* Analytics never runs in Kids Corner. Elsewhere it runs only after the visitor allows it, and only when a real ID is set in config.js. */
  var EEA = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'];
  function loadAnalytics() {
    if (inKids || !(C.gaMeasurementId || C.gtmContainerId)) return;
    if (analyticsLoaded) { if (window.gtag && consent === 'all') gtag('consent', 'update', { analytics_storage: 'granted' }); return; }
    analyticsLoaded = true; window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    /* Google Consent Mode v2: analytics cookies are denied by default in the EEA, UK and Switzerland until the visitor agrees; advertising signals are always denied for analytics. */
    gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', region: EEA, wait_for_update: 500 });
    gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
    if (consent === 'all') gtag('consent', 'update', { analytics_storage: 'granted' });
    if (C.gaMeasurementId) {
      gtag('js', new Date()); gtag('config', C.gaMeasurementId, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });
      loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(C.gaMeasurementId));
    }
    if (C.gtmContainerId) { dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' }); loadScript('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(C.gtmContainerId)); }
  }
  /* Conversion events: shop orders, affiliate clicks, tool views. They do nothing until analytics is allowed and configured. */
  function track(name, params) { if (!analyticsLoaded || consent === 'essential') return; try { if (window.gtag) gtag('event', name, params || {}); else if (window.dataLayer) dataLayer.push({ event: name, params: params || {} }); } catch (e) { /* ignore */ } }
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    if (a.hasAttribute('data-aff')) track('affiliate_click', { item: a.getAttribute('data-aff'), page: location.pathname });
    else if (/\/shop\/$/.test(location.pathname) && /wa\.me|^mailto:/.test(a.getAttribute('href') || '')) track('shop_order_click', { channel: /wa\.me/.test(a.href) ? 'whatsapp' : 'email', page: location.pathname });
    else if (a.classList.contains('shop-fab') || /shop\/#/.test(a.getAttribute('href') || '')) track('shop_cta_click', { page: location.pathname });
  });
  (function () { var t = $('#tool-root'); if (t && consent !== 'essential') setTimeout(function () { track('tool_view', { tool: t.getAttribute('data-tool-id') }); }, 1200); })();
  function slotId(key) { return (C.adSlots && C.adSlots[key]) || ''; }
  /* The AdSense loader itself is in <head> (see build.py). Ads are personalised unless the visitor opts out (or Google's EEA message says otherwise). */
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
    b.innerHTML = '<p>Ads keep these tools free. Choose whether ads may be personalised to your interests, or show only non-personalised ads based on the page you are viewing. See the <a href="' + base + 'cookie-policy/">Cookie Policy</a> and <a href="' + base + 'privacy-policy/">Privacy Policy</a>.</p><div class="btn-row"><button type="button" class="btn btn-primary btn-sm" id="c-all">Allow personalised ads</button><button type="button" class="btn btn-ghost btn-sm" id="c-ess">Non-personalised only</button></div>';
    doc.body.appendChild(b);
    $('#c-all').addEventListener('click', function () { var had = consent; consent = 'all'; save(CK, 'all'); closeBanner(); loadAnalytics(); if (had === 'essential') location.reload(); });
    $('#c-ess').addEventListener('click', function () { var had = consent; consent = 'essential'; save(CK, 'essential'); closeBanner(); if (had === 'all') location.reload(); });
  }
  var needsConsent = !!(C.gaMeasurementId || C.gtmContainerId || C.adsensePublisherId);
  initAds();
  if (consent !== 'essential') loadAnalytics();
  /* No banner pops up by itself. Visitors in the EEA, UK and Switzerland get Google's certified consent
     message through the AdSense tag; everyone else can choose from the "Cookie settings" link. */
  function openSettings() {
    var done = false;
    function own() { if (!done) { done = true; showBanner(); } }
    try {
      if (typeof window.__tcfapi === 'function') {
        window.__tcfapi('ping', 2, function (r) {
          if (done) return; done = true;
          if (r && r.gdprApplies) {
            var fc = window.googlefc = window.googlefc || {}; fc.callbackQueue = fc.callbackQueue || [];
            fc.callbackQueue.push(function () { window.googlefc.showRevocationMessage(); });
          } else showBanner();
        });
        setTimeout(own, 1000); return;
      }
    } catch (e) { /* fall back to the site's own choice panel */ }
    own();
  }
  $$('[data-open-consent]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); openSettings(); }); });
  if (!needsConsent) $$('[data-open-consent]').forEach(function (a) { var li = a.closest('li'); if (li) li.hidden = true; });

  /* ---------- tools data: favourites & recents ---------- */
  var TD = window.TOOLS_DATA || [];
  var FAV = 'niazi.favs', REC = 'niazi.recent';
  function toolBySlug(s) { return TD.filter(function (t) { return t.slug === s; })[0]; }
  function cardHTML(t, fav) {
    return '<article class="card tool-card hover" data-slug="' + t.slug + '" data-cat="' + esc(t.cat) + '"><button type="button" class="fav-btn" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Remove ' : 'Save ') + esc(t.name) + (fav ? ' from favourites' : ' to favourites') + '" data-fav="' + t.slug + '">' + (window.STAR_ICON || '') + '</button>' +
      '<div class="icon-chip ' + t.catClass + '" aria-hidden="true">' + t.icon + '</div><h3><a href="' + base + 'tools/' + t.slug + '/' + (location.protocol === 'file:' ? 'index.html' : '') + '" class="stretch">' + esc(t.name) + '</a></h3><p>' + esc(t.desc) + '</p><div class="meta"><span>' + esc(t.cat) + '</span><span>Free</span></div></article>';
  }
  /* Compact link used by the Favourites and Recently Used rows on the tools hub, so no tool card appears twice. */
  function chipHTML(t) {
    return '<a class="pop-chip" href="' + base + 'tools/' + t.slug + '/' + (location.protocol === 'file:' ? 'index.html' : '') + '"><span class="icon-chip ' + t.catClass + '" aria-hidden="true">' + t.icon + '</span>' + esc(t.name) + '</a>';
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
      fb.innerHTML = favs.map(function (t) { return fb.hasAttribute('data-compact') ? chipHTML(t) : cardHTML(t, true); }).join('');
      if (sec) sec.hidden = !favs.length;
    }
    if (rb) {
      // Skip tools already shown as cards elsewhere on this page, and any repeated ids, so no card appears twice.
      var shown = {}, seen = {}, compact = rb.hasAttribute('data-compact');
      if (!compact) $$('.tool-card[data-slug]').forEach(function (c) { if (!rb.contains(c)) shown[c.getAttribute('data-slug')] = 1; });
      var rec = store(REC, []).filter(function (s) { if (seen[s] || shown[s]) return false; seen[s] = 1; return true; })
        .map(toolBySlug).filter(Boolean).slice(0, 4), s2 = rb.closest('[data-list-section]');
      rb.innerHTML = rec.map(function (t) { return compact ? chipHTML(t) : cardHTML(t, store(FAV, []).indexOf(t.slug) >= 0); }).join('');
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
      // On the hub, hide whole category sections that have no matching tool, and the shortcut rows while filtering.
      $$('.hub-section').forEach(function (s) { s.hidden = !s.querySelector('.tool-card:not([hidden])'); });
      doc.documentElement.classList.toggle('hub-filtering', cat !== 'All' || !!q);
      var cnt = $('#result-count'); if (cnt) cnt.textContent = n + (n === 1 ? ' tool' : ' tools');
    };
    if (search) search.addEventListener('input', apply);
    // Press "/" anywhere outside a form field to jump to the tool search.
    if (search) doc.addEventListener('keydown', function (e) {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(input|textarea|select)$/i.test(e.target.tagName) && !e.target.isContentEditable) { e.preventDefault(); search.focus(); }
    });
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
    try { var qs = new URLSearchParams(location.search), pl = qs.get('plan'); if (pl) { form.elements['topic'].value = 'GM HCM early access or quotation'; if (!form.elements['message'].value) form.elements['message'].value = 'I would like early access to GM HCM (' + pl.slice(0, 40) + ' plan). Please tell me about availability and payment options.'; } } catch (x) { /* prefill is optional */ }
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
    // Deferred scripts run in order, so the tool script is already loaded here; start now instead of
    // waiting for images and ads (window 'load'), which delayed the tool and shifted the layout.
    var boot = function () {
      try {
        if (!window.NiaziTools || !NiaziTools[slug]) throw new Error('Tool script not found');
        tr.innerHTML = ''; NiaziTools[slug](tr, window.NiaziUtil);
      } catch (err) {
        tr.innerHTML = '<div class="empty-state"><b>This tool could not start</b>Please refresh the page. If the problem continues, contact us and mention “' + esc(slug) + '”.</div>';
        if (window.console) console.warn(err);
      }
      tr.setAttribute('data-ready', '');
    };
    // Let the browser paint the page header first (better FCP/LCP on slow phones), then start the tool.
    var later = function () { if (window.requestAnimationFrame) requestAnimationFrame(function () { setTimeout(boot, 0); }); else setTimeout(boot, 0); };
    if (window.NiaziTools && NiaziTools[slug] && window.NiaziUtil) later(); else document.addEventListener('DOMContentLoaded', later); // deferred tool scripts have all run by DOMContentLoaded
  }
})();

/* ---------- Motion: scroll reveal, counters, header shadow and progress bar ---------- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('.site-header');
  var bar = document.createElement('div'); bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, h.scrollTop / max) : 0) + ')';
      if (header) header.classList.toggle('scrolled', h.scrollTop > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  if (reduce || !('IntersectionObserver' in window)) return;
  var SEL = '.section-head, .card, .stat, .t-item, .trust li, .cta-band, details.faq, .side-card, .maker > div:first-child, .prose > h2, .prose > blockquote, .callout, ol.steps li';
  var els = [].slice.call(document.querySelectorAll(SEL)).filter(function (el) {
    return !el.closest('#tool-root, .hero, .page-hero, .site-footer, .consent, .ad-slot, [data-list-section]');
  });
  els = els.filter(function (el) { return !els.some(function (o) { return o !== el && o.contains(el); }); });
  els.forEach(function (el) {
    var sibs = [].filter.call(el.parentElement.children, function (c) { return els.indexOf(c) > -1; });
    var i = sibs.indexOf(el);
    el.classList.add('rv');
    if (i > 0) el.style.setProperty('--d', Math.min(i, 6) * 0.08 + 's');
  });
  var maker = document.querySelector('.maker > div:first-child.rv'); if (maker) maker.classList.add('rv-left');
  document.documentElement.classList.add('motion');
  var pending = els.slice();
  function reveal(el) {
    var k = pending.indexOf(el); if (k < 0) return;
    pending.splice(k, 1); io.unobserve(el); el.classList.add('in');
    // Hand control back to the normal hover styles once the entrance ends.
    setTimeout(function () { el.classList.remove('rv', 'in', 'rv-left'); el.style.removeProperty('--d'); }, 1300);
    if (el.classList.contains('stat')) count(el.querySelector('b'));
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) reveal(e.target); });
    // The huge top margin counts anything already scrolled past as "seen", so a fast fling never leaves it hidden.
  }, { rootMargin: '100000px 0px -6% 0px', threshold: 0.06 });
  els.forEach(function (el) { io.observe(el); });
  // A fast scroll or a jump link can skip past an element entirely: reveal anything already above the fold.
  var sweep = null;
  window.addEventListener('scroll', function () {
    if (sweep || !pending.length) return;
    sweep = setTimeout(function () {
      sweep = null;
      pending.slice().forEach(function (el) { if (el.offsetParent && el.getBoundingClientRect().top < innerHeight) reveal(el); });
    }, 150);
  }, { passive: true });

  function count(b) {
    if (!b) return;
    var m = b.textContent.match(/^(\d+)(.*)$/); if (!m) return;
    var end = +m[1], suffix = m[2], t0 = null, dur = 1300;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      b.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    b.textContent = '0' + suffix; requestAnimationFrame(step);
  }
})();

/* Floating "Shop Now" flip button (not on Kids Corner, the Shop itself, or the print view) */
(function () {
  var path = location.pathname; if (/\/kids\//.test(path) || /\/shop\//.test(path) || document.querySelector('.shop-fab')) return;
  var a = document.createElement('a'); a.className = 'shop-fab no-print'; a.href = (document.body.getAttribute('data-root') || './') + 'shop/'; a.setAttribute('aria-label', 'Shop now: premium Excel templates and printable PDFs');
  var bag = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
  a.innerHTML = '<span class="sf-inner"><span class="sf-face sf-front">' + bag + '<b>Shop Now</b></span><span class="sf-face sf-back"><b>Premium Templates</b><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg></span></span>';
  document.body.appendChild(a);
})();

/* Affiliate recommendations: shown only for items listed in config.js (SITE_CONFIG.affiliates). Always disclosed. */
(function () {
  var C = window.SITE_CONFIG || {}, L = C.affiliates || []; if (!L.length || /\/kids\//.test(location.pathname)) return;
  var root = document.getElementById('tool-root'), slug = root ? root.getAttribute('data-tool-id') : (location.pathname.match(/\/blog\/([^\/]+)\/?/) || [])[1]; if (!slug) return;
  var items = L.filter(function (x) { return x && x.url && /^https:\/\//.test(x.url) && (x.match || []).indexOf(slug) >= 0; }).slice(0, 3); if (!items.length) return;
  var box = document.createElement('aside'); box.className = 'aff-box no-print'; box.setAttribute('aria-label', 'Recommended resources');
  var base = document.body.getAttribute('data-root') || './', h = '<h2>Recommended resources</h2><p class="small muted">Affiliate disclosure: if you buy through these links, GM may earn a commission at no extra cost to you. <a href="' + base + 'affiliate-disclosure/">Read more</a>.</p><ul>';
  items.forEach(function (x) { var a = document.createElement('a'); a.textContent = x.name; h += '<li><a href="' + x.url.replace(/"/g, '%22') + '" target="_blank" rel="sponsored nofollow noopener noreferrer" data-aff="' + String(x.name).replace(/[<>"&]/g, '') + '">' + a.innerHTML + '</a>' + (x.note ? ' <span class="muted">– ' + String(x.note).replace(/[<>&]/g, '') + '</span>' : '') + '</li>'; });
  box.innerHTML = h + '</ul>';
  var anchor = root ? document.querySelector('.content-block') : document.querySelector('article.prose .share-row');
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor);
})();

/* Contextual "ready-made Excel template" offer on matching tools and articles */
(function () {
  var P = {
    'sales-target-calculator': ['Sales Target & Daily Run-Rate Tracker', 'Rs 1,999', 'Track the whole month day by day, with a team sheet and a chart.'],
    'kpi-performance-calculator': ['Team KPI Scorecard', 'Rs 2,499', 'Score up to 50 people on up to 8 weighted KPIs, with ratings and ranking.'],
    'profit-margin-calculator': ['Inventory & Sales Tracker', 'Rs 2,499', 'Stock, reorder alerts, profit per sale and monthly sales in one workbook.'],
    'business-report-generator': ['Team KPI Scorecard', 'Rs 2,499', 'A ready-made performance workbook for monthly team reviews.'],
    'salary-calculator': ['Personal Monthly Budget Planner', 'Rs 1,499', 'Plan your salary month by month and see where the money goes.'],
    'pakistan-salary-tax-calculator': ['Personal Monthly Budget Planner', 'Rs 1,499', 'Plan your take-home pay with a budget, savings rate and yearly overview.'],
    'loan-emi-calculator': ['Personal Monthly Budget Planner', 'Rs 1,499', 'Fit your instalments into a monthly budget and track what is left.'],
    'percentage-calculator': ['Personal Monthly Budget Planner', 'Rs 1,499', 'Track budget used and savings rate automatically.'],
    'sales-target-tracking': ['Sales Target & Daily Run-Rate Tracker', 'Rs 1,999', 'The method in this article, built into a ready-to-use Excel workbook.'],
    'weighted-kpi-scorecard': ['Team KPI Scorecard', 'Rs 2,499', 'The scorecard in this article, built into a ready-to-use Excel workbook.'],
    'profit-margin-vs-markup': ['Inventory & Sales Tracker', 'Rs 2,499', 'See profit and margin for every product you sell.']
  };
  var path = location.pathname; if (/\/kids\//.test(path) || /\/shop\//.test(path)) return;
  var root = document.getElementById('tool-root'), slug = root ? root.getAttribute('data-tool-id') : (path.match(/\/blog\/([^\/]+)\/?/) || [])[1], it = slug && P[slug]; if (!it) return;
  var base = document.body.getAttribute('data-root') || './', box = document.createElement('aside'); box.className = 'shop-promo no-print'; box.setAttribute('aria-label', 'Ready-made Excel template');
  box.innerHTML = '<div><span class="sp-tag">Ready-made template</span><h2>' + it[0] + '</h2><p>' + it[2] + ' Works in Microsoft Excel 2010 or later.</p></div><div class="sp-buy"><b>' + it[1] + '</b><a class="btn btn-primary btn-sm" href="' + base + 'shop/#excel">View in the shop</a></div>';
  var anchor = root ? document.querySelector('.content-block') : document.querySelector('article.prose .share-row');
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor);
})();

/* Photo pop-up: click or press Enter on a photo that has data-full. The photo grows from where it sits to a large view and shows the untouched original. */
(function () {
  var doc = document, box = null, big = null, from = null, last = null, busy = false, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function target(img) {
    var ratio = (img.naturalWidth || 3) / (img.naturalHeight || 4), vw = innerWidth, vh = innerHeight, maxW = Math.min(vw * 0.94, 920), maxH = vh * 0.82, w = Math.min(maxW, maxH * ratio), h = w / ratio;
    return { w: w, h: h, l: (vw - w) / 2, t: Math.max(12, (vh - h) / 2 - 18) };
  }
  function place(tg) { big.style.cssText = 'left:' + tg.l + 'px;top:' + tg.t + 'px;width:' + tg.w + 'px;height:' + tg.h + 'px;'; }
  function pose(r, tg) { return 'translate(' + (r.left - tg.l) + 'px,' + (r.top - tg.t) + 'px) scale(' + (r.width / tg.w) + ',' + (r.height / tg.h) + ')'; }
  function finish() { if (box) box.remove(); box = null; big = null; busy = false; doc.documentElement.classList.remove('lb-open'); if (last && last.focus) try { last.focus({ preventScroll: true }); } catch (e) { last.focus(); } }
  function close() {
    if (!box || busy) return; busy = true;
    if (reduce || !from) { finish(); return; }
    var r = from.getBoundingClientRect(), tg = target(from); box.classList.remove('lb-on'); big.style.transform = pose(r, tg); setTimeout(finish, 420);
  }
  function open(img) {
    var full = img.getAttribute('data-full'); if (!full || box) return; last = img; from = img; busy = true;
    var r = img.getBoundingClientRect(), tg = target(img);
    box = doc.createElement('div'); box.className = 'lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', img.alt || 'Photo');
    big = doc.createElement('img'); big.className = 'lb-img'; big.src = img.currentSrc || img.src; big.alt = img.alt || ''; place(tg);
    var x = doc.createElement('button'); x.type = 'button'; x.className = 'lb-close'; x.setAttribute('aria-label', 'Close photo'); x.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
    var cap = doc.createElement('p'); cap.className = 'lb-cap'; cap.textContent = img.alt || '';
    box.appendChild(big); box.appendChild(x); box.appendChild(cap); doc.body.appendChild(box); doc.documentElement.classList.add('lb-open');
    var hi = new Image(); hi.onload = function () { if (big) big.src = hi.src; }; hi.src = new URL(full, location.href).href; // sharp original replaces the small copy as soon as it loads
    if (reduce) { box.classList.add('lb-on'); busy = false; x.focus(); }
    else { big.style.transform = pose(r, tg); void big.offsetWidth; box.classList.add('lb-on'); big.style.transform = 'none'; setTimeout(function () { busy = false; x.focus(); }, 420); }
    box.addEventListener('click', function (e) { if (e.target !== big) close(); });
  }
  doc.addEventListener('click', function (e) { var im = e.target.closest && e.target.closest('img[data-full]'); if (im) { e.preventDefault(); open(im); } });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
    else if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.matches && e.target.matches('img[data-full]')) { e.preventDefault(); open(e.target); }
    else if (e.key === 'Tab' && box) { e.preventDefault(); var c = box.querySelector('.lb-close'); if (c) c.focus(); }
  });
  addEventListener('resize', function () { if (box && big && from && !busy) place(target(from)); });
})();

/* Voice (welcome + spoken tool names): starts straight away so the greeting is not late; skipped if Speech Synthesis is missing. */
(function () {
  var s = document.currentScript; if (!s || !('speechSynthesis' in window) || document.querySelector('script[src*="voice.js"]')) return;
  var v = document.createElement('script'); v.src = s.src.replace(/[^\/]*$/, 'voice.js?v=16435879'); v.async = true; document.head.appendChild(v);
})();
