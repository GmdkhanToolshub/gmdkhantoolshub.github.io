/* Kids Corner home: friendly mascot greeting, stars, badges, daily challenge and certificate. Browser only, nothing is sent anywhere. */
(function () {
  'use strict';
  function go() {
    var G = window.GMK; if (!G) return; var el = G.el;
    var greet = document.getElementById('kc-greet'), mas = document.getElementById('kc-mascot'), host = document.getElementById('kids-rewards');
    if (mas) mas.innerHTML = '<svg viewBox="0 0 160 170" class="kc-bolo" role="img" aria-label="Bolo, a friendly cartoon robot waving hello"><ellipse cx="80" cy="160" rx="40" ry="6" fill="rgba(0,0,0,.12)"/><rect x="40" y="70" width="80" height="70" rx="26" fill="#6366f1"/><rect x="58" y="96" width="44" height="26" rx="10" fill="#c7d2fe"/><circle cx="72" cy="109" r="5" fill="#4338ca"/><circle cx="88" cy="109" r="5" fill="#4338ca"/><rect x="34" y="14" width="92" height="66" rx="30" fill="#818cf8"/><rect x="48" y="30" width="64" height="34" rx="16" fill="#eef2ff"/><g class="kc-eyes"><circle cx="66" cy="47" r="7" fill="#1e1b4b"/><circle cx="94" cy="47" r="7" fill="#1e1b4b"/></g><path d="M68 58 Q80 68 92 58" fill="none" stroke="#1e1b4b" stroke-width="4" stroke-linecap="round"/><line x1="80" y1="14" x2="80" y2="2" stroke="#818cf8" stroke-width="4"/><circle cx="80" cy="4" r="6" fill="#facc15"/><g class="kc-wave"><rect x="118" y="78" width="14" height="44" rx="7" fill="#818cf8"/></g><rect x="28" y="78" width="14" height="44" rx="7" fill="#818cf8"/></svg>';
    var h = new Date().getHours(), part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening', n = G.stars(), d = G.daily();
    var msgs = [part + '! I am Bolo. Pick something fun to play and learn today.', n ? 'Welcome back! You have ' + n + ' stars. Let us collect more!' : 'You can earn stars by playing. Ready for your first one?', d.paid ? 'You finished today\'s challenge. Amazing! Try something new.' : 'Today\'s challenge: ' + d.text + ' in ' + G.TOOLS[d.tool] + '.'], i = 0;
    if (greet) { greet.textContent = msgs[0]; if (!G.reduce) setInterval(function () { i = (i + 1) % msgs.length; greet.classList.add('swap'); setTimeout(function () { greet.textContent = msgs[i]; greet.classList.remove('swap'); }, 250); }, 6000); }
    var hello = document.getElementById('kc-hello'); if (hello) hello.addEventListener('click', function () { G.say(msgs[i]); });
    if (!host) return;
    function paint() {
      var n = G.stars(), inl = n % G.GOAL, d = G.daily(), b = G.badges(); host.innerHTML = '';
      var top = el('div', 'kc-rw-top'); top.innerHTML = '<div class="kc-rw-stars"><span aria-hidden="true">⭐</span><b>' + n + '</b><small>stars</small></div><div class="kc-rw-prog"><span class="kc-track" role="progressbar" aria-valuemin="0" aria-valuemax="' + G.GOAL + '" aria-valuenow="' + inl + '" aria-label="Progress to the next certificate"><i style="width:' + (inl / G.GOAL * 100) + '%"></i></span><small>' + (G.GOAL - inl) + ' stars to your next certificate</small></div>'; host.appendChild(top);
      var dc = el('div', 'kc-daily' + (d.paid ? ' ok' : '')); dc.innerHTML = '<b>' + (d.paid ? '✅ Daily challenge complete' : '🎯 Daily challenge') + '</b><span>' + d.text + ' in ' + G.TOOLS[d.tool] + (d.paid ? '. Come back tomorrow for a new one.' : '. Finish it for 3 bonus stars.') + '</span>'; host.appendChild(dc);
      var bg = el('ul', 'kc-badges'); bg.setAttribute('aria-label', 'Badges'); b.forEach(function (x) { var li = el('li', x.got ? 'got' : '', '<span aria-hidden="true">' + x.icon + '</span><b>' + x.name + '</b><small>' + (x.got ? 'Earned!' : x.need) + '</small>'); bg.appendChild(li); }); host.appendChild(bg);
      var cert = el('div', 'kc-cert'); if (n >= G.GOAL) { cert.innerHTML = '<label>Name for the certificate (optional, not saved)<br><input type="text" maxlength="30" id="kc-name" autocomplete="off" placeholder="Type a name or leave blank"></label> <button type="button" class="btn btn-primary btn-sm" id="kc-dl">Download my certificate</button>'; } else cert.innerHTML = '<small class="muted">Collect ' + G.GOAL + ' stars to unlock your certificate.</small>'; host.appendChild(cert);
      var dl = cert.querySelector('#kc-dl'); if (dl) dl.addEventListener('click', function () { var nm = cert.querySelector('#kc-name').value.replace(/[^\p{L}\p{N} .'-]/gu, '').trim(); G.certificate(G.stars(), nm); }); }
    paint(); window.addEventListener('storage', paint);
  }

  /* Animated background and card entrances for the Kids Corner home page. Light, GPU-friendly, off when motion is reduced. */
  (function () {
    if (!document.getElementById('kids-rewards')) return; var b = document.body; b.classList.add('kc-page');
    var bg = document.createElement('div'); bg.className = 'kc-bg'; bg.setAttribute('aria-hidden', 'true'); var h = '<i class="blob b1"></i><i class="blob b2"></i><i class="blob b3"></i><i class="blob b4"></i>';
    var em = ['⭐', '🎈', '🚀', '🎨', '🪐', '🧩', '🦋', '🌈', '🎵', '✨', '🐾', '🔤']; for (var i = 0; i < em.length; i++) h += '<span class="fl" style="left:' + (4 + Math.round(i * 8.1)) + '%;font-size:' + (1.5 + (i % 3) * 0.45) + 'rem;animation-duration:' + (16 + (i * 7) % 13) + 's;animation-delay:-' + ((i * 5) % 17) + 's;--sx:' + ((i % 2 ? 1 : -1) * (24 + (i * 11) % 40)) + 'px">' + em[i] + '</span>';
    bg.innerHTML = h; b.insertBefore(bg, b.firstChild);
    var tiles = [].slice.call(document.querySelectorAll('.kc-tl')); tiles.forEach(function (t, k) { t.style.setProperty('--i', k % 5); });
    if (!('IntersectionObserver' in window)) { tiles.forEach(function (t) { t.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.12 }); tiles.forEach(function (t) { io.observe(t); });
  })();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
