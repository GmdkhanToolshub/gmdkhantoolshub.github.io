/* Welcome screen: two friendly robots greet visitors on every load of the home page (including refresh).
   The <head> snippet decides eligibility and adds html.wl; this file builds the overlay and closes it. */
(function () {
  var d = document, h = d.documentElement;
  if (!h.classList.contains('wl')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUR = reduce ? 1000 : 2200; // shown once per browsing session, never on refresh; Skip closes it at once

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
  o.className = 'welcome' + (reduce ? ' still' : '');
  o.setAttribute('role', 'dialog');
  o.setAttribute('aria-label', 'Welcome to GM Free Tools & Gadgets');
  o.style.setProperty('--wl-dur', DUR + 'ms');
  o.innerHTML =
    '<div class="wl-sparks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
    '<div class="wl-inner">' +
      '<div class="wl-bots">' +
        '<div class="wl-bot-wrap wl-a"><span class="wl-bubble" aria-hidden="true">Hi!</span>' + robot('wlg1', '#60a5fa', '#4f46e5') + '</div>' +
        '<div class="wl-bot-wrap wl-b"><span class="wl-bubble" aria-hidden="true">Welcome!</span>' + robot('wlg2', '#a78bfa', '#7c3aed') + '</div>' +
      '</div>' +
      '<div class="wl-logo" aria-hidden="true"><svg viewBox="-2 0 42 22" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15.6 5.9A8 8 0 1 0 17.5 11H10.5"/><path d="M22.5 19V3.5l7 10 7-10V19"/></svg></div>' +
      '<p class="wl-kicker">Hello, and welcome to</p>' +
      '<h2 class="wl-title">Free Tools <span>&amp; Gadgets</span></h2>' +
      '<p class="wl-sub">58 free tools and gadgets for work, documents and everyday life</p>' +
      '<div class="wl-bar" aria-hidden="true"><i></i></div>' +
      '<button type="button" class="wl-skip">Skip intro</button>' +
    '</div>';
  d.body.appendChild(o);
  h.classList.remove('wl');
  h.classList.add('wl-open'); try { sessionStorage.setItem('gm.wl', '1'); } catch (e) { /* storage blocked: it may show again, which is harmless */ }

  var done = false, prev = d.activeElement;
  function close() {
    if (done) return; done = true;
    o.classList.add('out');
    h.classList.remove('wl-open');
    d.removeEventListener('keydown', onKey);
    setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); if (prev && prev.focus) try { prev.focus({ preventScroll: true }); } catch (e) {} }, 600);
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  d.addEventListener('keydown', onKey);
  o.querySelector('.wl-skip').addEventListener('click', close);
  o.addEventListener('click', function (e) { if (!e.target.closest('.wl-skip, .wl-bots')) close(); });
  setTimeout(close, DUR);
})();
