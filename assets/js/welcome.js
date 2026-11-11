/* Welcome screen: an animated HUD ring with original robot characters. Shown once per browsing session on the home page (never to crawlers).
   The <head> snippet decides eligibility and adds html.wl; this file builds the overlay, runs the sequence and closes it.
   Timeline: ring spins from the start, flash and robots emerge at 0.5 s, the name types in, and after about 3 s the screen enters the home page by itself. Skip is always available.
   Only transform and opacity are animated. With reduced motion the screen is static. */
(function () {
  var d = document, h = d.documentElement;
  if (!h.classList.contains('wl')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var base = d.body.getAttribute('data-root') || './', NAME = 'GM AI Tools HUB';
  var T_GO = reduce ? 0 : 250, T_AUTO = reduce ? 1200 : 1600; /* robots emerge at 0.5 s, the screen enters the site by itself at 1.6 s, about 2 s in total */

  function robot(id, c1, c2) {
    return '<svg class="wl-bot" viewBox="0 0 120 170" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
      '<ellipse class="wl-shadow" cx="60" cy="163" rx="30" ry="4"/>' +
      '<line x1="60" y1="20" x2="60" y2="34" stroke="#c7d2fe" stroke-width="3" stroke-linecap="round"/>' +
      '<circle class="wl-bulb" cx="60" cy="15" r="6"/>' +
      '<rect x="22" y="50" width="8" height="16" rx="3" fill="#a5b4fc"/><rect x="90" y="50" width="8" height="16" rx="3" fill="#a5b4fc"/>' +
      '<rect x="28" y="34" width="64" height="48" rx="16" fill="url(#' + id + ')"/>' +
      '<rect x="36" y="43" width="48" height="28" rx="12" fill="#0b1b34"/>' +
      '<circle class="wl-eye" cx="50" cy="54" r="5"/><circle class="wl-eye" cx="70" cy="54" r="5"/>' +
      '<path d="M52 63 q8 5 16 0" stroke="#67e8f9" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '<rect x="52" y="82" width="16" height="7" fill="#a5b4fc"/>' +
      '<rect x="32" y="89" width="56" height="50" rx="14" fill="url(#' + id + ')"/>' +
      '<rect x="45" y="99" width="30" height="17" rx="5" fill="#0b1b34"/>' +
      '<circle class="wl-led" cx="53" cy="107.5" r="3" fill="#34d399"/><circle class="wl-led wl-led2" cx="67" cy="107.5" r="3" fill="#f472b6"/>' +
      '<rect x="16" y="94" width="12" height="34" rx="6" fill="#a5b4fc"/>' +
      '<g class="wl-arm"><rect x="92" y="62" width="12" height="36" rx="6" fill="#a5b4fc"/><circle cx="98" cy="60" r="7.5" fill="#c7d2fe"/></g>' +
      '<rect x="42" y="139" width="13" height="18" rx="5" fill="#a5b4fc"/><rect x="65" y="139" width="13" height="18" rx="5" fill="#a5b4fc"/>' +
      '</svg>';
  }

  var o = d.createElement('div');
  o.className = 'welcome' + (reduce ? ' still go' : '');
  o.setAttribute('role', 'dialog');
  o.setAttribute('aria-label', 'Welcome to ' + NAME);
  o.innerHTML =
    '<div class="wl-sparks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
    '<div class="wl-inner">' +
      '<div class="wl-stage">' +
        '<div class="wl-ring" aria-hidden="true"><i class="wl-glow"></i>' +
          '<img class="wl-ring-img" src="' + base + 'assets/img/ring.webp" alt="" width="688" height="688" decoding="async">' +
          '<svg class="wl-ticks wl-ticks-a" viewBox="-50 -50 100 100"><circle r="44.5" fill="none" stroke="rgba(125,211,252,.55)" stroke-width="2" stroke-dasharray="0.35 2.15"/></svg>' +
          '<svg class="wl-ticks wl-ticks-b" viewBox="-50 -50 100 100"><circle r="40" fill="none" stroke="rgba(244,114,182,.6)" stroke-width=".7" stroke-dasharray="14 40 5 28 9 52" stroke-linecap="round"/><circle r="37.5" fill="none" stroke="rgba(103,232,249,.55)" stroke-width=".5" stroke-dasharray="22 60 4 36"/></svg>' +
        '</div>' +
        '<i class="wl-flash" aria-hidden="true"></i>' +
        '<div class="wl-logo" aria-hidden="true"><svg viewBox="-2 0 42 22" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15.6 5.9A8 8 0 1 0 17.5 11H10.5"/><path d="M22.5 19V3.5l7 10 7-10V19"/></svg></div>' +
        '<div class="wl-bots">' +
          '<div class="wl-bot-wrap wl-a"><span class="wl-bubble" aria-hidden="true">Hi!</span>' + robot('wlg1', '#60a5fa', '#4f46e5') + '</div>' +
          '<div class="wl-bot-wrap wl-b"><span class="wl-bubble" aria-hidden="true">Welcome!</span>' + robot('wlg2', '#a78bfa', '#7c3aed') + '</div>' +
          '<div class="wl-bot-wrap wl-c"><span class="wl-bubble" aria-hidden="true">Let’s go!</span>' + robot('wlg3', '#22d3ee', '#2563eb') + '</div>' +
        '</div>' +
      '</div>' +
      '<p class="wl-kicker">Welcome to</p>' +
      '<h2 class="wl-title"><span class="wl-type" aria-hidden="true"></span><span class="wl-caret" aria-hidden="true"></span></h2>' +
      '<p class="wl-sub">58 free tools and gadgets for work, documents and everyday life</p>' +
      '<div class="wl-bar" aria-hidden="true"><i></i></div>' +
      '<p class="wl-tap" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>Tap anywhere to hear the welcome</p>' +
      '<div class="wl-actions"><button type="button" class="wl-skip">Skip</button></div>' +
    '</div>';
  o.style.setProperty('--wl-ready', T_AUTO + 'ms');
  d.body.appendChild(o);
  h.classList.remove('wl');
  h.classList.add('wl-open'); try { sessionStorage.setItem('gm.wl', '1'); } catch (e) { /* storage blocked: it may show again, which is harmless */ }

  /* robots start at the centre of the ring: tell each one how far away its final spot is */
  var stage = o.querySelector('.wl-stage'), sr = stage.getBoundingClientRect(), cx = sr.left + sr.width / 2, cy = sr.top + sr.height / 2;
  [].forEach.call(o.querySelectorAll('.wl-bot-wrap'), function (b) { var r = b.getBoundingClientRect(); b.style.setProperty('--ex', Math.round(cx - (r.left + r.width / 2)) + 'px'); b.style.setProperty('--ey', Math.round(cy - (r.top + r.height / 2)) + 'px'); });

  var timers = [], done = false, prev = d.activeElement;
  function later(f, ms) { timers.push(setTimeout(f, ms)); }
  function type() {
    var el = o.querySelector('.wl-type'), caret = o.querySelector('.wl-caret'), i = 0;
    if (reduce) { el.textContent = NAME; caret.style.display = 'none'; return; }
    (function step() { if (done) return; el.textContent = NAME.slice(0, ++i); if (i < NAME.length) later(step, 30); else later(function () { caret.style.display = 'none'; }, 300); })();
  }
  later(function () { o.classList.add('go'); }, T_GO);
  later(type, T_GO + 250);
  later(function () { close(true); }, T_AUTO);

  function remove() { if (o.parentNode) o.parentNode.removeChild(o); if (prev && prev.focus) try { prev.focus({ preventScroll: true }); } catch (e) {} }
  function close(entering) {
    if (done) return; done = true; timers.forEach(clearTimeout);
    d.removeEventListener('keydown', onKey);
    if (entering && !reduce) { o.classList.add('leaving'); later2(function () { o.classList.add('out'); h.classList.remove('wl-open'); }, 330); later2(remove, 650); }
    else { o.classList.add('out'); h.classList.remove('wl-open'); later2(remove, 600); }
  }
  function later2(f, ms) { setTimeout(f, ms); }
  function onKey(e) { if (e.key === 'Escape') close(false); }
  d.addEventListener('keydown', onKey);
  o.querySelector('.wl-skip').addEventListener('click', function () { close(false); });
})();
