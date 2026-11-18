/* GM Tools Hub: premium interaction layer (bundled into core.js after main.js).
   Modules: theme (system preference + smooth switch), ambient background, navigation (dropdown, sliding indicator, mobile),
   global search palette, back-to-top, pointer spotlight, hero particles, link prefetch.
   No libraries, no network calls except loading the local search index on first search. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  var base = body.getAttribute('data-root') || './';
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var finePointer = !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function store(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  root.classList.add('gx-js');
  var path = location.pathname, isKids = /\/kids\//.test(path), isEmbed = /\/embed\//.test(path);

  /* ---------- theme: follow the system until the visitor chooses, animate the switch, sync between tabs ---------- */
  (function () {
    var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
    var sw = $('#theme-toggle');
    function sync() { if (sw) sw.setAttribute('aria-checked', root.getAttribute('data-theme') === 'dark' ? 'true' : 'false'); }
    function apply(t) { if (root.getAttribute('data-theme') !== t) root.setAttribute('data-theme', t); sync(); }
    sync(); new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    function saved() { var t = store('niazi.theme', null); return t === 'light' || t === 'dark' ? t : null; }
    if (!saved() && mq) apply(mq.matches ? 'dark' : 'light');
    if (mq) { var onSys = function (e) { if (!saved()) apply(e.matches ? 'dark' : 'light'); }; if (mq.addEventListener) mq.addEventListener('change', onSys); else if (mq.addListener) mq.addListener(onSys); }
    doc.addEventListener('click', function (e) {
      if (!(e.target.closest && e.target.closest('#theme-toggle'))) return;
      if (!reduce) { root.classList.add('gx-theme-anim'); clearTimeout(root._gxT); root._gxT = setTimeout(function () { root.classList.remove('gx-theme-anim'); }, 700); }
    }, true);
    window.addEventListener('storage', function (e) { if (e.key === 'niazi.theme') { var t = saved(); if (t) apply(t); } });
  })();

  /* ---------- ambient background (not on Kids Corner, which has its own scenery) ---------- */
  if (!isKids && !isEmbed && !$('.gm-ambient')) {
    var amb = doc.createElement('div'); amb.className = 'gm-ambient'; amb.setAttribute('aria-hidden', 'true');
    amb.innerHTML = '<div class="gridlines"></div><i class="orb orb-1"></i><i class="orb orb-2"></i><i class="orb orb-3"></i><div class="vignette"></div>';
    body.insertBefore(amb, body.firstChild);
  }

  /* ---------- navigation: dropdown, sliding indicator, mobile menu ---------- */
  (function () {
    var ul = $('#nav-links'); if (!ul) return;
    var mq = matchMedia('(max-width: 1100px)');
    var ind = doc.createElement('li'); ind.className = 'nav-ind'; ind.setAttribute('aria-hidden', 'true'); ind.setAttribute('role', 'presentation'); ul.insertBefore(ind, ul.firstChild);
    function activeLi() { var a = $('a[aria-current="page"], .nav-drop.is-current', ul); return a ? a.closest('li') : null; }
    function moveTo(li) {
      if (!li || mq.matches) { ind.classList.remove('on'); return; }
      ul.style.setProperty('--ix', li.offsetLeft + 'px'); ul.style.setProperty('--iw', li.offsetWidth + 'px'); ind.classList.add('on');
    }
    function rest() { moveTo(activeLi()); }
    var items = $$('#nav-links > li:not(.nav-ind)');
    items.forEach(function (li) {
      li.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') moveTo(li); });
      li.addEventListener('focusin', function () { moveTo(li); });
    });
    ul.addEventListener('pointerleave', rest); ul.addEventListener('focusout', function (e) { if (!ul.contains(e.relatedTarget)) rest(); });
    window.addEventListener('resize', function () { rest(); }); if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(rest);
    setTimeout(rest, 60); requestAnimationFrame(rest);

    /* dropdown */
    var drops = $$('.has-menu', ul);
    function setOpen(li, open) {
      var b = $('.nav-drop', li); if (!b) return;
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function closeAll(except) { drops.forEach(function (li) { if (li !== except) setOpen(li, false); }); }
    drops.forEach(function (li) {
      var b = $('.nav-drop', li), menu = $('.nav-menu', li), t = null;
      b.addEventListener('click', function (e) { e.stopPropagation(); var o = b.getAttribute('aria-expanded') !== 'true'; closeAll(li); setOpen(li, o); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); closeAll(li); setOpen(li, true); var f = $('a', menu); if (f) f.focus(); }
      });
      menu.addEventListener('keydown', function (e) {
        var links = $$('a', menu), i = links.indexOf(doc.activeElement);
        if (e.key === 'Escape') { setOpen(li, false); b.focus(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); (links[i + 1] || links[0]).focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); (links[i - 1] || links[links.length - 1]).focus(); }
      });
      if (finePointer) {
        li.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'mouse' || mq.matches) return; clearTimeout(t); t = setTimeout(function () { closeAll(li); setOpen(li, true); }, 90); });
        li.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'mouse' || mq.matches) return; clearTimeout(t); t = setTimeout(function () { setOpen(li, false); }, 200); });
      }
      $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setOpen(li, false); }); });
    });
    doc.addEventListener('click', function (e) { if (!e.target.closest('.has-menu')) closeAll(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });

    /* mobile menu: lock page scroll while open, close after choosing a link or when the window grows */
    var mt = $('#menu-toggle');
    function sync() { root.classList.toggle('gx-nav-open', ul.classList.contains('open') && mq.matches); }
    new MutationObserver(sync).observe(ul, { attributes: true, attributeFilter: ['class'] });
    mq.addEventListener ? mq.addEventListener('change', function () { ul.classList.remove('open'); if (mt) mt.setAttribute('aria-expanded', 'false'); closeAll(); sync(); rest(); }) : null;
    ul.addEventListener('click', function (e) { var a = e.target.closest('a[href]'); if (a && mq.matches) { ul.classList.remove('open'); if (mt) mt.setAttribute('aria-expanded', 'false'); } });
  })();

  /* ---------- global search palette (Ctrl/Cmd+K, "/", or the Search button) ---------- */
  (function () {
    var pal = null, input, bodyEl, list = [], sel = -1, lastFocus = null, loadingCb = [], hasQuery = false;
    var SUGGEST = ['Pakistan salary tax', 'PDF merge', 'Resume builder', 'Zakat calculator', 'QR code', 'Marla converter', 'Electricity bill', 'Word counter'];
    var JUMP = [['Free Tools & Gadgets', 'tools/'], ['AI Smart Assistant', 'assistant/'], ['Kids Corner', 'kids/'], ['Project Manager Portfolio', 'portfolio/'], ['Hire me', 'services/'], ['Contact', 'contact/']];
    function day() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
    function loadData(cb) {
      if (window.GM_INDEX) return cb();
      loadingCb.push(cb); if (loadingCb.length > 1) return;
      var s = doc.createElement('script'); s.src = base + 'assets/js/assistant-data.js?d=' + day(); s.async = true;
      s.onload = function () { var q = loadingCb.slice(); loadingCb = []; q.forEach(function (f) { f(); }); };
      s.onerror = function () { window.GM_INDEX = []; var q = loadingCb.slice(); loadingCb = []; q.forEach(function (f) { f(); }); };
      doc.head.appendChild(s);
    }
    function build() {
      pal = doc.createElement('div'); pal.className = 'gx-pal'; pal.hidden = true; pal.setAttribute('role', 'dialog'); pal.setAttribute('aria-modal', 'true'); pal.setAttribute('aria-label', 'Search tools, guides and pages');
      pal.innerHTML = '<div class="gx-pal-backdrop" data-close></div><div class="gx-pal-box"><div class="gx-pal-input"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" placeholder="Search tools, guides and pages" aria-label="Search" autocomplete="off" spellcheck="false" aria-controls="gx-pal-body"><kbd>Esc</kbd></div><div class="gx-pal-body" id="gx-pal-body" aria-live="polite"></div><div class="gx-pal-foot"><span><kbd>&uarr;</kbd><kbd>&darr;</kbd> to move</span><span><kbd>Enter</kbd> to open</span><span><kbd>Esc</kbd> to close</span></div></div>';
      body.appendChild(pal); input = $('input', pal); bodyEl = $('#gx-pal-body', pal);
      pal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); var chip = e.target.closest('[data-q]'); if (chip) { input.value = chip.getAttribute('data-q'); run(); input.focus(); } });
      input.addEventListener('input', run);
      pal.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
        else if (e.key === 'Enter') { var a = $$('.gx-pal-item a', pal)[Math.max(sel, 0)]; if (a) { e.preventDefault(); remember(); location.href = a.href; } }
        else if (e.key === 'Tab') { e.preventDefault(); input.focus(); }
      });
    }
    function move(d) { var as = $$('.gx-pal-item a', pal); if (!as.length) return; sel = (sel + d + as.length) % as.length; as.forEach(function (a, i) { a.setAttribute('aria-selected', i === sel ? 'true' : 'false'); }); as[sel].scrollIntoView({ block: 'nearest' }); }
    function remember() { var q = input.value.trim(); if (q.length < 2) return; var r = store('gm.recentq', []).filter(function (x) { return x !== q; }); r.unshift(q); save('gm.recentq', r.slice(0, 5)); }
    function score(e, toks) {
      if (!e._t) { e._t = (e.t || '').toLowerCase(); e._k = (e.k || '').toLowerCase(); e._d = (e.d || '').toLowerCase(); }
      var s = 0;
      for (var i = 0; i < toks.length; i++) {
        var w = toks[i], hit = false;
        if (e._t.indexOf(w) >= 0) { s += 8 + (e._t.indexOf(w) === 0 || e._t.indexOf(' ' + w) >= 0 ? 4 : 0); hit = true; }
        if (e._k.indexOf(w) >= 0) { s += 3; hit = true; }
        if (e._d.indexOf(w) >= 0) { s += 1; hit = true; }
        if (!hit) return 0;
      }
      return s + (e.g === 'Tool' ? 2 : 0);
    }
    function hl(t, toks) { var out = esc(t); toks.forEach(function (w) { if (w.length < 2) return; out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); }); return out; }
    function item(e, i, toks) {
      return '<li class="gx-pal-item"><a href="' + base + esc(e.u) + '" style="--i:' + i + '" role="option" aria-selected="false"><span class="gi" aria-hidden="true">' + esc((e.t || '?').charAt(0).toUpperCase()) + '</span><span><b>' + hl(e.t || '', toks) + '</b><span class="d">' + esc((e.d || '').slice(0, 110)) + '</span></span><span class="gg">' + esc(e.g || 'Page') + '</span></a></li>';
    }
    function bySlugs(slugs) { var G = window.GM_INDEX || []; return slugs.map(function (s) { return G.filter(function (e) { return e.u === 'tools/' + s + '/'; })[0]; }).filter(Boolean); }
    function run() {
      var q = input.value.trim().toLowerCase(), toks = q.split(/\s+/).filter(Boolean); sel = -1;
      if (!window.GM_INDEX) { bodyEl.innerHTML = '<div class="gx-skel"></div><div class="gx-skel"></div><div class="gx-skel"></div>'; loadData(run); return; }
      if (!toks.length) {
        var h = '<p class="gx-pal-h">Quick searches</p><div class="gx-pal-chips">' + SUGGEST.map(function (s) { return '<button type="button" data-q="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>';
        var rq = store('gm.recentq', []); if (rq.length) h += '<p class="gx-pal-h">Recent searches</p><div class="gx-pal-chips">' + rq.map(function (s) { return '<button type="button" data-q="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>';
        var rec = bySlugs(store('niazi.recent', []).slice(0, 4)); if (rec.length) h += '<p class="gx-pal-h">Recently used</p><ul class="gx-pal-list">' + rec.map(function (e, i) { return item(e, i, []); }).join('') + '</ul>';
        var fav = bySlugs(store('niazi.favs', []).slice(0, 4)); if (fav.length) h += '<p class="gx-pal-h">Favourites</p><ul class="gx-pal-list">' + fav.map(function (e, i) { return item(e, i, []); }).join('') + '</ul>';
        h += '<p class="gx-pal-h">Jump to</p><ul class="gx-pal-list">' + JUMP.map(function (j, i) { return item({ t: j[0], u: j[1], d: '', g: 'Go' }, i, []); }).join('') + '</ul>';
        bodyEl.innerHTML = h; return;
      }
      var res = window.GM_INDEX.map(function (e) { return [score(e, toks), e]; }).filter(function (x) { return x[0] > 0; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, 12);
      if (!res.length) { bodyEl.innerHTML = '<div class="gx-pal-empty"><b>No results for &ldquo;' + esc(input.value.trim()) + '&rdquo;</b><br>Try a shorter word, or browse <a href="' + base + 'tools/">all free tools</a>.</div>'; return; }
      bodyEl.innerHTML = '<p class="gx-pal-h">' + res.length + (res.length === 1 ? ' result' : ' results') + '</p><ul class="gx-pal-list" role="listbox">' + res.map(function (x, i) { return item(x[1], i, toks); }).join('') + '</ul>';
      sel = 0; var f = $('.gx-pal-item a', pal); if (f) f.setAttribute('aria-selected', 'true');
    }
    function open() {
      if (!pal) build();
      if (!pal.hidden) { input.focus(); return; }
      lastFocus = doc.activeElement; pal.classList.remove('closing'); pal.hidden = false; root.classList.add('gx-pal-open'); input.value = ''; run(); setTimeout(function () { input.focus(); }, 30);
      var b = $('#gx-search-btn'); if (b) b.setAttribute('aria-expanded', 'true'); loadData(run);
    }
    function close() {
      if (!pal || pal.hidden) return; var done = function () { pal.hidden = true; pal.classList.remove('closing'); root.classList.remove('gx-pal-open'); var b = $('#gx-search-btn'); if (b) b.setAttribute('aria-expanded', 'false'); if (lastFocus && lastFocus.focus) lastFocus.focus(); };
      if (reduce) done(); else { pal.classList.add('closing'); setTimeout(done, 190); }
    }
    window.GMSearch = { open: open, close: close };
    doc.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#gx-search-btn, [data-open-search]')) { e.preventDefault(); open(); } });
    doc.addEventListener('keydown', function (e) {
      var typing = /^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (pal && !pal.hidden) close(); else open(); }
      else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !$('#tool-search')) { e.preventDefault(); open(); }
    });
    /* hero search on the home page: Enter opens the palette results instantly, the button still goes to the tools list */
    var hs = $('#gx-home-search');
    if (hs) hs.addEventListener('focus', function () { loadData(function () { /* warm the index so the first search is instant */ }); }, { once: true });
  })();

  /* ---------- back to top with progress ring ---------- */
  (function () {
    if (isEmbed || $('.gx-top')) return;
    var b = doc.createElement('button'); b.type = 'button'; b.className = 'gx-top no-print'; b.setAttribute('aria-label', 'Back to top');
    b.innerHTML = '<svg viewBox="0 0 44 44" aria-hidden="true"><circle class="trk" cx="22" cy="22" r="20"/><circle class="bar" cx="22" cy="22" r="20"/></svg><svg class="arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="transform:none"><path d="m5 15 7-7 7 7"/></svg>';
    body.appendChild(b); var bar = $('.bar', b), tick = false;
    function upd() { tick = false; var h = root, max = h.scrollHeight - h.clientHeight, p = max > 0 ? Math.min(1, h.scrollTop / max) : 0; bar.style.strokeDashoffset = String(126 - 126 * p); b.classList.toggle('show', h.scrollTop > 700); }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
    b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  })();

  /* ---------- pointer spotlight on cards, and a gentle tilt on the hero console ---------- */
  (function () {
    if (!finePointer || reduce) return;
    var pending = null, el = null, x = 0, y = 0;
    doc.addEventListener('pointermove', function (e) {
      el = e.target.closest ? e.target.closest('.card, .hc-card, .gm-card, .gx-card, .stat, .gx-console') : null; if (!el) return; x = e.clientX; y = e.clientY;
      if (!pending) pending = requestAnimationFrame(function () { pending = null; var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (x - r.left) + 'px'); el.style.setProperty('--my', (y - r.top) + 'px'); });
    }, { passive: true });
    var hero = $('.gx-hero'), con = $('.gx-console');
    if (hero && con) {
      hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; con.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg'); con.style.setProperty('--rx', (-py * 6).toFixed(2) + 'deg'); }, { passive: true });
      hero.addEventListener('pointerleave', function () { con.style.setProperty('--rx', '0deg'); con.style.setProperty('--ry', '0deg'); });
    }
  })();

  /* ---------- hero particles: a few soft drifting points, paused when off-screen or hidden ---------- */
  (function () {
    var hero = $('.gx-hero'); if (!hero || reduce || saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4 && innerWidth < 700)) return;
    var cv = doc.createElement('canvas'); cv.className = 'gx-particles'; cv.setAttribute('aria-hidden', 'true'); hero.insertBefore(cv, hero.firstChild);
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0, pts = [], N = innerWidth < 700 ? 24 : 46, run = true, raf = 0, col = '108,149,255';
    function readCol() { var a = getComputedStyle(root).getPropertyValue('--glow-a').trim(); if (a) col = a.replace(/\s/g, ''); }
    function size() { var r = hero.getBoundingClientRect(); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function seed() { pts = []; for (var i = 0; i < N; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28, r: Math.random() * 1.6 + .6 }); }
    function frame() {
      if (!run) return; ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]; p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.fillStyle = 'rgba(' + col + ',.7)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        for (var j = i + 1; j < pts.length; j++) { var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy; if (d < 11000) { ctx.strokeStyle = 'rgba(' + col + ',' + (0.18 * (1 - d / 11000)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); } }
      }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!run) { run = true; raf = requestAnimationFrame(frame); } } function stop() { run = false; cancelAnimationFrame(raf); }
    size(); seed(); readCol(); raf = requestAnimationFrame(frame);
    window.addEventListener('resize', function () { size(); seed(); });
    new MutationObserver(readCol).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-accent'] });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) stop(); else start(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { if (en[0].isIntersecting) start(); else stop(); }).observe(hero);
  })();

  /* ---------- prefetch internal pages on hover or touch, so navigation feels instant ---------- */
  (function () {
    if (saveData || isEmbed) return; var seen = {}, n = 0;
    function pf(e) {
      var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target === '_blank' || a.origin !== location.origin || a.hash && a.pathname === location.pathname) return;
      if (!/(\/|\.html)$/.test(a.pathname) || a.pathname === location.pathname || seen[a.pathname] || n > 24) return;
      seen[a.pathname] = 1; n++; var l = doc.createElement('link'); l.rel = 'prefetch'; l.href = a.pathname; l.as = 'document'; doc.head.appendChild(l);
    }
    doc.addEventListener('pointerover', function (e) { if (e.pointerType === 'mouse') pf(e); }, { passive: true });
    doc.addEventListener('touchstart', pf, { passive: true });
  })();
})();
