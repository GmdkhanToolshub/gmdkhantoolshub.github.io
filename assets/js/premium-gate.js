/* Shows a Premium lock over a page's working area. The page's explanations stay public for readers and search engines.
   Does nothing at all until accounts are switched on in account-config.js. These "page" locks stop normal use only; private
   Premium files and data are protected by the server. */
(function () {
  var GMA = window.GMA; if (!GMA || !GMA.enabled) return;
  var AREAS = {
    'bi-studio': { hide: '.bi-steps > li:not(#data) > dl', before: '.bi-steps > li#formulas', title: 'Steps 2 to 6 are part of Premium', perks: ['The guide, practice file and finish test for steps 2 to 6', 'The Business Calculator Lab', 'Cloud backup of your workspace and planner'] },
    'calculator-lab': { hide: 'form[data-calc], [id$="-out"]', before: '.bc-jump', title: 'The calculators are part of Premium', perks: ['All Business Calculator Lab calculators', 'BI Studio steps 2 to 6', 'Cloud backup of your workspace and planner'] }
  };
  var id = document.documentElement.getAttribute('data-premium-area') || (document.querySelector('[data-premium-area]') || {}).getAttribute && document.querySelector('[data-premium-area]').getAttribute('data-premium-area');
  var area = AREAS[id]; if (!area) return;
  var style = GMA.el('style', { text: area.hide.split(',').map(function (s) { return 'html.gm-locked ' + s.trim(); }).join(',') + '{display:none!important}' });
  document.head.appendChild(style);
  document.documentElement.classList.add('gm-locked');   /* hidden while checking, so nothing flashes open */

  function unlock() { document.documentElement.classList.remove('gm-locked'); var c = document.getElementById('gm-lock'); if (c) c.remove(); }
  function lock(state) {
    var el = GMA.el, anchor = document.querySelector(area.before); if (!anchor) return;
    var signedIn = state === 'no-access';
    var card = el('div', { id: 'gm-lock', 'class': 'gma-lock', role: 'region', 'aria-label': 'Premium feature' }, [
      el('span', { 'class': 'gma-badge', text: 'Premium' }),
      el('h2', { text: state === 'offline' ? 'We could not check your access' : area.title }),
      el('p', { text: state === 'offline' ? 'The account service did not answer. Check your connection and reload the page.' : signedIn ? 'You are signed in, but Premium is not active on this account yet. Your dashboard shows its status.' : 'Create an account, verify your email and wait for approval. All 74 free tools stay free.' }),
      state === 'offline' ? null : el('ul', {}, area.perks.map(function (p) { return el('li', { text: p }); })),
      el('div', { 'class': 'btn-row' }, state === 'offline' ? [el('button', { type: 'button', 'class': 'btn btn-primary', text: 'Try again', onclick: function () { location.reload(); } })] :
        signedIn ? [el('a', { 'class': 'btn btn-primary', href: GMA.root + 'premium/', text: 'See my status' })] :
          [el('a', { 'class': 'btn btn-primary', href: GMA.root + 'account/#signup', text: 'Sign up' }), el('a', { 'class': 'btn btn-ghost', href: GMA.root + 'account/#signin', text: 'Sign in' })])
    ]);
    if (anchor.tagName === 'LI') { var li = el('li', { 'class': 'gma-lock-item' }, [card]); anchor.parentNode.insertBefore(li, anchor); } else anchor.parentNode.insertBefore(card, anchor);
  }
  GMA.api('/api/features').then(function (d) {
    var f = d.features.filter(function (x) { return x.id === id; })[0];
    if (f && f.tier === 'free') return unlock();
    return GMA.api('/api/premium/access/' + id).then(unlock, function (e) { lock(e.status === 401 ? 'signed-out' : e.status === 403 ? 'no-access' : 'offline'); });
  }).catch(function () { lock('offline'); });
})();
