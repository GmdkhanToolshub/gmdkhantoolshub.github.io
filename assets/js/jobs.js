/* GM live jobs: two independent vertical tickers (Pakistan and International) and a searchable list.
   Data comes from data/jobs.json, which a scheduled job refreshes from permitted job APIs. This script applies the strict date
   filter again in the visitor's browser, so a vacancy disappears as soon as its closing date passes. Nothing is invented. */
(function () {
  'use strict';
  var d = document, base = d.body.getAttribute('data-root') || './', URL_ = base + 'data/jobs.json', CK = 'gm.jobs.v1', TTL = 15 * 60 * 1000, DAY = 864e5;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SRC = { arbeitnow: ['Arbeitnow', 'https://www.arbeitnow.com/'], remotive: ['Remotive', 'https://remotive.com/'], jobicy: ['Jobicy', 'https://jobicy.com/'], jooble: ['Jooble', 'https://jooble.org/'], adzuna: ['Adzuna', 'https://www.adzuna.com/'], careerjet: ['Careerjet', 'https://www.careerjet.com.pk/'] };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* Simple vector flags. Countries without one show a globe. */
  var F = {
    'Pakistan': '<rect width="24" height="16" fill="#01411c"/><rect width="6" height="16" fill="#fff"/><circle cx="15" cy="8" r="4" fill="#fff"/><circle cx="16.3" cy="7.2" r="3.4" fill="#01411c"/><path d="m17.5 5.2.5 1.3 1.3.1-1 .9.4 1.3-1.2-.8-1.1.8.4-1.3-1-.9 1.3-.1z" fill="#fff"/>',
    'United Arab Emirates': '<rect width="24" height="16" fill="#fff"/><rect width="24" height="5.4" fill="#00732f"/><rect y="10.6" width="24" height="5.4" fill="#000"/><rect width="6.5" height="16" fill="#ff0000"/>',
    'Saudi Arabia': '<rect width="24" height="16" fill="#006c35"/><rect x="5" y="5.5" width="14" height="1.6" fill="#fff"/><rect x="6" y="10.6" width="12" height="1" fill="#fff"/>',
    'Qatar': '<rect width="24" height="16" fill="#8d1b3d"/><path d="M0 0h8l3 1.8-3 1.8 3 1.8-3 1.8 3 1.8-3 1.8 3 1.8-3 1.8H0z" fill="#fff"/>',
    'Oman': '<rect width="24" height="16" fill="#fff"/><rect y="5.3" width="24" height="5.4" fill="#db161b"/><rect y="10.7" width="24" height="5.3" fill="#008000"/><rect width="7" height="16" fill="#db161b"/>',
    'Bahrain': '<rect width="24" height="16" fill="#ce1126"/><path d="M0 0h8l3 2-3 2 3 2-3 2 3 2-3 2 3 2H0z" fill="#fff"/>',
    'Kuwait': '<rect width="24" height="16" fill="#fff"/><rect width="24" height="5.4" fill="#007a3d"/><rect y="10.6" width="24" height="5.4" fill="#ce1126"/><path d="M0 0l7 5.4v5.2L0 16z" fill="#000"/>',
    'United Kingdom': '<rect width="24" height="16" fill="#012169"/><path d="M0 0l24 16M24 0L0 16" stroke="#fff" stroke-width="3"/><path d="M0 0l24 16M24 0L0 16" stroke="#c8102e" stroke-width="1.2"/><path d="M12 0v16M0 8h24" stroke="#fff" stroke-width="5"/><path d="M12 0v16M0 8h24" stroke="#c8102e" stroke-width="3"/>',
    'United States': '<rect width="24" height="16" fill="#fff"/><path d="M0 1h24M0 4.2h24M0 7.4h24M0 10.6h24M0 13.8h24" stroke="#b22234" stroke-width="1.6"/><rect width="10.5" height="8.6" fill="#3c3b6e"/>',
    'Canada': '<rect width="24" height="16" fill="#fff"/><rect width="6" height="16" fill="#d52b1e"/><rect x="18" width="6" height="16" fill="#d52b1e"/><path d="M12 3.5l1 2 1.8-.4-.6 2 1.6 1-2 .6.2 1.8-2-.4V13h-.0V9.6l-2 .4.2-1.8-2-.6 1.6-1-.6-2 1.8.4z" fill="#d52b1e"/>',
    'Australia': '<rect width="24" height="16" fill="#00008b"/><rect width="12" height="8" fill="#012169"/><path d="M0 0l12 8M12 0L0 8" stroke="#fff" stroke-width="1.6"/><path d="M6 0v8M0 4h12" stroke="#fff" stroke-width="2.4"/><path d="M6 0v8M0 4h12" stroke="#c8102e" stroke-width="1.3"/><circle cx="18" cy="12" r="1" fill="#fff"/><circle cx="20" cy="5" r=".8" fill="#fff"/><circle cx="16" cy="6" r=".8" fill="#fff"/><circle cx="21" cy="10" r=".8" fill="#fff"/>',
    'Germany': '<rect width="24" height="16" fill="#ffce00"/><rect width="24" height="10.7" fill="#d00"/><rect width="24" height="5.3" fill="#000"/>',
    'France': '<rect width="24" height="16" fill="#fff"/><rect width="8" height="16" fill="#0055a4"/><rect x="16" width="8" height="16" fill="#ef4135"/>',
    'Netherlands': '<rect width="24" height="16" fill="#fff"/><rect width="24" height="5.3" fill="#ae1c28"/><rect y="10.7" width="24" height="5.3" fill="#21468b"/>',
    'Ireland': '<rect width="24" height="16" fill="#fff"/><rect width="8" height="16" fill="#169b62"/><rect x="16" width="8" height="16" fill="#ff883e"/>',
    'Switzerland': '<rect width="24" height="16" fill="#d52b1e"/><path d="M12 3.5v9M7.5 8h9" stroke="#fff" stroke-width="3"/>',
    'Spain': '<rect width="24" height="16" fill="#aa151b"/><rect y="4" width="24" height="8" fill="#f1bf00"/>',
    'Italy': '<rect width="24" height="16" fill="#fff"/><rect width="8" height="16" fill="#009246"/><rect x="16" width="8" height="16" fill="#ce2b37"/>',
    'Singapore': '<rect width="24" height="16" fill="#fff"/><rect width="24" height="8" fill="#ed2939"/><circle cx="6" cy="4" r="2.4" fill="#fff"/><circle cx="7" cy="4" r="2.2" fill="#ed2939"/>'
  };
  function flag(c) { var g = F[c]; if (!g) return '<svg class="jt-flag" viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="16" rx="2" fill="#dbe4f3"/><circle cx="12" cy="8" r="5" fill="none" stroke="#3b5ea8" stroke-width="1.2"/><path d="M7 8h10M12 3c-2 2-2 8 0 10M12 3c2 2 2 8 0 10" fill="none" stroke="#3b5ea8" stroke-width=".9"/></svg>'; return '<svg class="jt-flag" viewBox="0 0 24 16" aria-hidden="true"><g>' + g + '</g></svg>'; }
  function live(j, now) { var p = Date.parse(j.p); if (!p || p > now + DAY) return false; if (j.d) return Date.parse(j.d) + DAY > now; return now - p <= (j.maxAge || 30) * DAY; }
  function when(p, now) { var t = new Date(p), n = new Date(now), a = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()), b = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()), k = Math.round((b - a) / DAY); return k <= 0 ? 'Today' : k === 1 ? 'Yesterday' : k + ' days ago'; }
  function fmt(p) { try { return new Date(p).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return String(p).slice(0, 10); } }
  function initials(n) { return esc(String(n).replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase() || 'J'); }
  function card(j, now, tag) {
    var fresh = when(j.p, now) === 'Today', place = (j.ci ? j.ci + ', ' : '') + (j.co || (j.remote ? '' : '')), loc = j.remote && !j.ci ? j.loc : (place || j.loc || 'Location not stated');
    var visa = j.v === 'yes' ? '<span class="jt-b jt-visa" title="The source lists visa sponsorship for this vacancy. Please confirm with the employer.">Visa sponsorship: listed by employer</span>' : '<span class="jt-b jt-nv" title="Visa sponsorship is not stated in the listing.">Visa: not specified</span>';
    var logo = j.l ? '<img src="' + esc(j.l) + '" alt="" loading="lazy" decoding="async" width="44" height="44" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{textContent:\'' + initials(j.c) + '\'}))">' : '<span>' + initials(j.c) + '</span>';
    return '<li class="jt-card"><div class="jt-logo">' + logo + '</div><div class="jt-body"><a class="jt-title" href="' + esc(j.u) + '" target="_blank" rel="nofollow noopener noreferrer" data-job="' + esc(j.src) + '">' + esc(j.t) + '</a><div class="jt-co">' + esc(j.c) + '</div>' +
      '<div class="jt-meta">' + flag(j.co) + '<span>' + esc(loc) + '</span>' + (j.ty ? '<span class="jt-dot">' + esc(j.ty) + '</span>' : '') + (j.s ? '<span class="jt-sal" title="Salary as listed by the source">' + esc(j.s) + '</span>' : '') + '</div>' +
      '<div class="jt-dates"><span>Published ' + esc(fmt(j.p)) + ' (' + when(j.p, now) + ')</span><span>' + (j.d ? 'Apply by ' + esc(fmt(j.d)) : 'Closing date not provided') + '</span></div>' +
      '<div class="jt-badges">' + (fresh ? '<span class="jt-b jt-new">New today</span>' : '') + (tag ? '<span class="jt-b jt-tag">' + esc(tag) + '</span>' : '') + visa + '<span class="jt-b jt-src">via ' + esc((SRC[j.src] || [j.src])[0]) + '</span></div></div>' +
      '<a class="jt-apply" href="' + esc(j.u) + '" target="_blank" rel="nofollow noopener noreferrer" data-job="' + esc(j.src) + '" aria-label="Apply now: ' + esc(j.t) + ' at ' + esc(j.c) + '">Apply now</a></li>'; }
  var inflight = null;
  function fetchJobs() { return inflight || (inflight = fetchJobs0()); }
  function fetchJobs0() {
    return new Promise(function (res) {
      var c = null; try { c = JSON.parse(sessionStorage.getItem(CK)); } catch (e) { c = null; }
      if (c && Date.now() - c.t < TTL) return res(c.d);
      fetch(URL_, { cache: 'default' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { try { sessionStorage.setItem(CK, JSON.stringify({ t: Date.now(), d: j })); } catch (e) {} res(j); }).catch(function () { res(c ? c.d : null); });
    });
  }
  function prep(data) {
    var now = Date.now(), md = (data && data.maxAgeDays) || 30, f = function (a) { return (a || []).map(function (j) { j.maxAge = md; return j; }).filter(function (j) { return live(j, now); }).sort(function (a, b) { return Date.parse(b.p) - Date.parse(a.p); }); };
    return { now: now, pk: f(data && data.pk), pkr: f(data && data.pkr), intl: f(data && data.intl), updated: data && data.updated, sources: (data && data.sources) || [] };
  }
  /* ---------- vertical ticker ---------- */
  function ticker(title, sub, flagC, items, now, tag, note) {
    var p = d.createElement('section'); p.className = 'jt-panel'; p.setAttribute('aria-label', title);
    p.innerHTML = '<header class="jt-head"><span class="jt-hflag">' + flag(flagC) + '</span><div><h3>' + esc(title) + '</h3><p>' + esc(sub) + '</p></div><span class="jt-count">' + items.length + ' live</span><button type="button" class="jt-pause" aria-pressed="false" aria-label="Pause scrolling">Pause</button></header>' + (note ? '<p class="jt-note">' + esc(note) + '</p>' : '');
    var vp = d.createElement('div'); vp.className = 'jt-vp'; vp.tabIndex = 0; vp.setAttribute('role', 'region'); vp.setAttribute('aria-label', title + ' list. It scrolls automatically. Use the Pause button or hover to stop it.');
    if (!items.length) { vp.className += ' jt-empty'; vp.innerHTML = '<div class="jt-none"><b>No live vacancies to show right now.</b><br>The feed is checked every few hours. Please check again soon.</div>'; p.appendChild(vp); return p; }
    var ul = d.createElement('ul'); ul.className = 'jt-list'; ul.innerHTML = items.map(function (j) { return card(j, now, tag && j.remote ? tag : ''); }).join('');
    var track = d.createElement('div'); track.className = 'jt-track'; track.appendChild(ul); vp.appendChild(track); p.appendChild(vp);
    if (!reduce && items.length >= 4) {
      var clone = ul.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); [].forEach.call(clone.querySelectorAll('a'), function (a) { a.tabIndex = -1; }); track.appendChild(clone); vp.classList.add('jt-anim');
      requestAnimationFrame(function () { var h = ul.offsetHeight || items.length * 150; track.style.setProperty('--jt-dur', Math.max(30, Math.round(h / 26)) + 's'); });
      var btn = p.querySelector('.jt-pause'), hold = null; btn.addEventListener('click', function () { var on = vp.classList.toggle('jt-paused'); btn.setAttribute('aria-pressed', String(on)); btn.textContent = on ? 'Play' : 'Pause'; btn.setAttribute('aria-label', on ? 'Resume scrolling' : 'Pause scrolling'); });
      vp.addEventListener('touchstart', function () { vp.classList.add('jt-touch'); clearTimeout(hold); }, { passive: true }); vp.addEventListener('touchend', function () { hold = setTimeout(function () { vp.classList.remove('jt-touch'); }, 5000); }, { passive: true });
    } else { p.querySelector('.jt-pause').hidden = true; vp.classList.add('jt-static'); }
    return p;
  }
  function footer(m) {
    var f = d.createElement('div'); f.className = 'jt-foot'; var up = m.updated ? new Date(m.updated) : null, srcs = m.sources.filter(function (s) { return s.ok; }).map(function (s) { var x = SRC[s.id]; return x ? '<a href="' + x[1] + '" target="_blank" rel="nofollow noopener noreferrer">' + x[0] + '</a>' : esc(s.name); });
    var mins = up ? Math.max(0, Math.round((m.now - up.getTime()) / 60000)) : null, ago = mins == null ? '' : mins < 90 ? mins + ' minutes ago' : mins < 2880 ? Math.round(mins / 60) + ' hours ago' : Math.round(mins / 1440) + ' days ago';
    f.innerHTML = '<span>' + (up ? 'Last successful update: ' + esc(up.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })) + ' UTC (' + ago + ').' : 'Last update unknown.') + '</span><span>Sources: ' + (srcs.join(', ') || 'none available') + '. Listings open on the original site. Always verify an employer and never pay to apply.</span>';
    return f;
  }
  function band(host, data) {
    var m = prep(data), pkList = m.pk.length >= 5 ? m.pk : m.pk.concat(m.pkr), pkNote = m.pk.length >= 5 ? '' : 'Pakistan-based vacancies appear when the licensed Pakistan job feed is connected. Until then this panel shows remote roles that are open to candidates in Pakistan.';
    host.innerHTML = ''; host.classList.remove('jt-loading');
    if (!data) { host.innerHTML = '<div class="jt-fallback"><b>The live job feed is temporarily unavailable.</b><p>Please check again in a little while. You can also search official employer career pages directly. We never show made-up vacancies.</p></div>'; return; }
    var wrap = d.createElement('div'); wrap.className = 'jt-grid';
    wrap.appendChild(ticker('Pakistan jobs', pkList === m.pk ? 'Vacancies in Pakistani cities' : 'Open to candidates in Pakistan', 'Pakistan', pkList, m.now, 'Remote', pkNote));
    wrap.appendChild(ticker('International jobs', 'Gulf, Europe, UK, USA, Canada, Australia and remote', 'World', m.intl, m.now, '', ''));
    host.appendChild(wrap); host.appendChild(footer(m));
  }
  /* ---------- compact side panel (Home, Free Tools, GM HCM): one ticker per side ---------- */
  function side(host, data, kind) {
    host.innerHTML = '';
    if (!data) { host.innerHTML = '<div class="jt-fallback"><b>Live jobs are temporarily unavailable.</b><p>Please check again soon.</p></div>'; return; }
    var m = prep(data), p;
    if (kind === 'side-pk') { var pl = m.pk.length >= 5 ? m.pk : m.pk.concat(m.pkr); p = ticker('Pakistan jobs', pl === m.pk ? 'Vacancies in Pakistani cities' : 'Open to candidates in Pakistan', 'Pakistan', pl, m.now, 'Remote', ''); }
    else p = ticker('International jobs', 'Gulf, Europe, UK, USA, Canada, Australia, remote', 'World', m.intl, m.now, '', '');
    p.classList.add('jt-side');
    var f = d.createElement('div'); f.className = 'jt-sidefoot'; f.innerHTML = '<a href="' + base + 'jobs/">See all jobs and search</a><span>Listings open on the original site. Never pay to apply.</span>'; p.appendChild(f);
    host.appendChild(p);
  }
  /* ---------- searchable list ---------- */
  function browse(host, data) {
    var m = prep(data), all = m.pk.concat(m.pkr, m.intl).sort(function (a, b) { return Date.parse(b.p) - Date.parse(a.p); }), shown = 0, STEP = 24;
    if (!data) { host.innerHTML = '<div class="jt-fallback"><b>The live job feed is temporarily unavailable.</b><p>Please check again soon.</p></div>'; return; }
    var cs = {}, ts = {}; all.forEach(function (j) { if (j.co) cs[j.co] = 1; if (j.ty) ts[j.ty] = 1; });
    host.innerHTML = '<form class="jt-filters" role="search" aria-label="Filter jobs"><label>Search<input type="search" name="q" placeholder="Job title or company" maxlength="60"></label><label>Country<select name="co"><option value="">All countries</option><option value="__remote">Remote only</option>' + Object.keys(cs).sort().map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></label><label>Type<select name="ty"><option value="">All types</option>' + Object.keys(ts).sort().map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></label><label class="jt-chk"><input type="checkbox" name="visa"> Visa sponsorship listed</label><label class="jt-chk"><input type="checkbox" name="today"> Published today</label></form><p class="jt-result" role="status" aria-live="polite"></p><ul class="jt-grid2"></ul><p><button type="button" class="btn btn-ghost" hidden>Show more</button></p>';
    var f = host.querySelector('form'), ul = host.querySelector('.jt-grid2'), more = host.querySelector('button'), res = host.querySelector('.jt-result');
    function list() { var q = f.q.value.trim().toLowerCase(), co = f.co.value, ty = f.ty.value; return all.filter(function (j) { return (!q || (j.t + ' ' + j.c).toLowerCase().indexOf(q) >= 0) && (!co || (co === '__remote' ? j.remote : j.co === co)) && (!ty || j.ty === ty) && (!f.visa.checked || j.v === 'yes') && (!f.today.checked || when(j.p, m.now) === 'Today'); }); }
    function paint(reset) { var l = list(); if (reset) { shown = 0; ul.innerHTML = ''; } var part = l.slice(shown, shown + STEP); ul.insertAdjacentHTML('beforeend', part.map(function (j) { return card(j, m.now, ''); }).join('')); shown += part.length; more.hidden = shown >= l.length; res.textContent = l.length ? l.length + ' live vacancies' + (l.length > shown ? ', showing ' + shown : '') : 'No vacancies match. Try fewer filters.'; }
    f.addEventListener('input', function () { paint(true); }); f.addEventListener('submit', function (e) { e.preventDefault(); }); more.addEventListener('click', function () { paint(false); }); paint(true);
  }
  /* The stylesheet loads only when a jobs section is about to appear, so it never delays the first paint of a page. */
  var cssReady = null;
  function css() { if (cssReady) return cssReady; cssReady = new Promise(function (res) { var l = d.createElement('link'); l.rel = 'stylesheet'; l.href = base + 'assets/css/jobs.css?v=' + '043e231b'; l.onload = l.onerror = function () { res(); }; d.head.appendChild(l); setTimeout(res, 3000); }); return cssReady; }
  function mount(host) {
    var kind = host.getAttribute('data-jobs') || 'ticker'; host.setAttribute('aria-busy', 'true');
    function go() { Promise.all([css(), fetchJobs()]).then(function (r) { var data = r[1]; host.removeAttribute('aria-busy'); host.style.minHeight = ''; if (kind === 'browse') browse(host, data); else if (kind.indexOf('side-') === 0) side(host, data, kind); else band(host, data); }); }
    if (kind.indexOf('side-') === 0 && window.matchMedia && matchMedia('(min-width:1440px)').matches) { /* side panels are visible straight away on wide screens: wait until the page has finished loading so they never compete with the first paint */
      var later = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(go); };
      if (d.readyState === 'complete') later(); else window.addEventListener('load', later); return;
    }
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); go(); } }, { rootMargin: '400px 0px' }); io.observe(host); } else go();
  }
  [].forEach.call(d.querySelectorAll('[data-jobs]'), mount);
  window.GMJobs = { live: live, prep: prep, when: when };
})();
