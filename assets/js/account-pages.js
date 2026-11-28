/* Sign up, sign in, verify email, reset password and the Premium dashboard. */
(function () {
  var GMA = window.GMA, app = document.getElementById('gma-app'); if (!GMA || !app) return;
  var el = GMA.el, field = GMA.field, form = GMA.form, api = GMA.api, page = app.getAttribute('data-page'), root = GMA.root;
  var SYNC_KEYS = ['gm.notes', 'gm.saved', 'gm.tasks.v1', 'gm.planner.v1', 'niazi.favs', 'niazi.recent', 'gm.scores', 'gm.vocab.known'];
  var PERKS = ['BI Studio steps 2 to 6', 'Business Calculator Lab', 'Cloud backup of My Workspace and Planner', 'Premium downloads and report packs as they are added'];
  function show() { app.textContent = ''; [].forEach.call(arguments, function (n) { if (n) app.appendChild(n); }); }
  function card(kids, cls) { return el('div', { 'class': 'gma-card ' + (cls || '') }, kids); }
  function perks() { return el('ul', { 'class': 'gma-perks' }, PERKS.map(function (p) { return el('li', { text: p }); })); }
  function pitch(extra) { return el('aside', { 'class': 'gma-pitch' }, [el('span', { 'class': 'gma-badge', text: 'GM Tools Hub Premium' }), el('h2', { text: 'More for your reporting work' }), perks(), el('p', { text: 'All 74 free tools stay free and need no account.' })].concat(extra || [])); }

  if (!GMA.enabled) { show(card([el('h2', { text: 'Premium accounts are not open yet' }), el('p', { text: 'Everything you use today stays free and open. This page will start working when accounts are switched on.' }), el('a', { 'class': 'btn btn-primary', href: root + 'tools/', text: 'Use the free tools' })])); return; }

  var linkToken = window.__gmToken || '';

  function verifyPage() {
    if (!linkToken) { show(card([el('h2', { text: 'Open the link from your email' }), el('p', { text: 'This page works with the verification link we sent you.' }), el('a', { 'class': 'btn btn-ghost', href: root + 'account/', text: 'Go to sign in' })])); return; }
    var pw = field('The password you chose when signing up', { name: 'password', type: 'password', autocomplete: 'current-password', required: true });
    var f = form([pw], 'Verify my email', function (d) { return api('/api/auth/verify', { json: { token: linkToken, password: d.password } }).then(function (r) { show(card([el('h2', { text: 'Email verified' }), el('p', { text: r.message }), el('a', { 'class': 'btn btn-primary', href: root + 'account/', text: 'Go to sign in' })])); }); });
    show(card([el('h2', { text: 'Confirm your email' }), el('p', { text: 'For your safety we ask for your password as well as the link. If you did not choose this password, use "Forgot password" on the sign-in page.' }), f]));
  }

  function resetPage() {
    if (!linkToken) { show(card([el('h2', { text: 'Open the link from your email' }), el('a', { 'class': 'btn btn-ghost', href: root + 'account/#forgot', text: 'Ask for a new link' })])); return; }
    var a = field('New password', { name: 'password', type: 'password', autocomplete: 'new-password', minlength: 10, required: true }, 'At least 10 characters.');
    var b = field('New password again', { name: 'again', type: 'password', autocomplete: 'new-password', required: true });
    var f = form([a, b], 'Save new password', function (d) {
      if (d.password !== d.again) return Promise.reject(new Error('The two passwords are not the same.'));
      return api('/api/auth/reset', { json: { token: linkToken, password: d.password } }).then(function (r) { show(card([el('h2', { text: 'Password changed' }), el('p', { text: r.message }), el('a', { 'class': 'btn btn-primary', href: root + 'account/', text: 'Sign in' })])); });
    });
    show(card([el('h2', { text: 'Choose a new password' }), f]));
  }

  function signForms(start) {
    var tabs = [['signin', 'Sign in'], ['signup', 'Sign up'], ['forgot', 'Forgot password']], holder = el('div', {}), bar = el('div', { 'class': 'gma-tabs', role: 'tablist' });
    function open(name) {
      [].forEach.call(bar.children, function (b) { b.setAttribute('aria-selected', b.getAttribute('data-t') === name ? 'true' : 'false'); });
      var f;
      if (name === 'signup') {
        var terms = el('label', { 'class': 'gma-check' }, [el('input', { type: 'checkbox', name: 'accept_terms' }), el('span', {}, ['I accept the ', el('a', { href: root + 'terms-and-conditions/', text: 'terms' }), ' and ', el('a', { href: root + 'privacy-policy/', text: 'privacy policy' }), '.'])]);
        f = form([field('Your name', { name: 'name', type: 'text', autocomplete: 'name', maxlength: 60 }), field('Email', { name: 'email', type: 'email', autocomplete: 'email' }), field('Password', { name: 'password', type: 'password', autocomplete: 'new-password' }, 'At least 10 characters. It is never sent by email.'), terms], 'Create account', function (d) {
          return api('/api/auth/register', { json: d }).then(function (r) { return r.message + ' Next: verify your email, then wait for approval.'; });
        });
      } else if (name === 'forgot') {
        f = form([field('Email', { name: 'email', type: 'email', autocomplete: 'email' })], 'Email me a link', function (d) { return api('/api/auth/forgot', { json: d }).then(function (r) { return r.message; }); });
      } else {
        var again = el('button', { type: 'button', 'class': 'gma-link', hidden: true, text: 'Send the verification email again' });
        f = form([field('Email', { name: 'email', type: 'email', autocomplete: 'username' }), field('Password', { name: 'password', type: 'password', autocomplete: 'current-password' })], 'Sign in', function (d) {
          return api('/api/auth/login', { json: d }).then(function () { location.href = root + 'premium/'; return 'Signed in.'; }, function (e) {
            if (e.code === 'email_not_verified') { again.hidden = false; again.onclick = function () { api('/api/auth/resend', { json: { email: d.email } }).then(function (r) { f.say(r.message, 'ok'); }, function (x) { f.say(x.message, 'err'); }); }; }
            throw e;
          });
        });
        f.appendChild(again);
      }
      holder.textContent = ''; holder.appendChild(f);
    }
    tabs.forEach(function (t) { bar.appendChild(el('button', { type: 'button', role: 'tab', 'data-t': t[0], text: t[1], onclick: function () { open(t[0]); } })); });
    var box = card([bar, holder]); open(start);
    window.addEventListener('hashchange', function () { var h = location.hash.slice(1); if (/^(signin|signup|forgot)$/.test(h)) open(h); });
    return box;
  }

  var STATUS = {
    pending: ['Waiting for approval', 'Your email is verified. You will get an email when your request has been decided.'],
    approved: ['Premium is active', ''],
    expired: ['Premium has ended', 'Your access period is over. Contact us if you want it renewed.'],
    rejected: ['Request not approved', 'All free tools stay available to you.'],
    suspended: ['Premium is paused', 'Contact us if you think this is a mistake.'],
    revoked: ['Premium access removed', 'All free tools stay available to you.']
  };
  function statusCard(me) {
    var u = me.user, s = STATUS[u.status] || [u.status, ''];
    var detail = u.premium ? (u.access_expires_at ? 'Your ' + u.plan + ' access ends on ' + u.access_expires_at.slice(0, 10) + '. Nothing renews or charges automatically.' : 'Your access has no end date.') : s[1];
    return card([el('p', { 'class': 'gma-who', text: 'Signed in as ' + u.name + ' (' + u.email + ')' }), el('h2', {}, [el('span', { 'class': 'gma-dot ' + (u.premium ? 'on' : '') }), s[0]]), el('p', { text: detail }),
      el('button', { type: 'button', 'class': 'btn btn-ghost btn-sm', text: 'Sign out', onclick: function () { api('/api/auth/logout', { json: {}, csrf: me.csrf }).then(function () { location.href = root + 'account/'; }, function (e) { alertLine(e.message); }); } })], 'gma-status');
  }
  function alertLine(t) { var p = el('p', { 'class': 'gma-msg err', role: 'alert', text: t }); app.insertBefore(p, app.firstChild); }

  function localData() { var o = {}; SYNC_KEYS.forEach(function (k) { try { var v = localStorage.getItem(k); if (v != null) o[k] = v; } catch (e) { /* storage blocked */ } }); return o; }
  function syncCard(me) {
    var msg = el('p', { 'class': 'gma-msg', role: 'status', 'aria-live': 'polite' }), confirmBox = el('div', { 'class': 'gma-confirm', hidden: true });
    function say(t, k) { msg.className = 'gma-msg ' + (k || ''); msg.textContent = t; }
    function backup() {
      var d = localData(); if (!Object.keys(d).length) return say('There is nothing saved on this device yet.', 'err');
      say('Saving…'); api('/api/premium/data/workspace', { method: 'PUT', json: { value: { savedFrom: 'web', items: d } }, csrf: me.csrf }).then(function () { say('Backup saved to your account.', 'ok'); }, function (e) { say(e.message, 'err'); });
    }
    function restore() {
      say('Checking your backup…');
      api('/api/premium/data/workspace').then(function (r) {
        if (!r.value || !r.value.items) return say('There is no backup in your account yet.', 'err');
        say(''); confirmBox.textContent = ''; confirmBox.hidden = false;
        confirmBox.appendChild(el('p', { text: 'Replace the workspace data on this device with the backup saved on ' + String(r.updated_at).slice(0, 10) + '? A copy of what is here now is kept first.' }));
        confirmBox.appendChild(el('button', { type: 'button', 'class': 'btn btn-primary btn-sm', text: 'Yes, restore', onclick: function () {
          try {
            localStorage.setItem('gm.sync.before-restore', JSON.stringify({ at: new Date().toISOString(), items: localData() }));
            SYNC_KEYS.forEach(function (k) { if (typeof r.value.items[k] === 'string') localStorage.setItem(k, r.value.items[k]); });
            confirmBox.hidden = true; say('Backup restored on this device.', 'ok');
          } catch (e) { say('This browser did not allow saving the data.', 'err'); }
        } }));
        confirmBox.appendChild(el('button', { type: 'button', 'class': 'btn btn-ghost btn-sm', text: 'Cancel', onclick: function () { confirmBox.hidden = true; } }));
      }, function (e) { say(e.message, 'err'); });
    }
    return card([el('h3', { text: 'Cloud backup' }), el('p', { text: 'Save your notes, planner, tasks and favourites to your account, then restore them on another device. Nothing is uploaded until you press Back up.' }), el('div', { 'class': 'btn-row' }, [el('button', { type: 'button', 'class': 'btn btn-primary btn-sm', text: 'Back up this device', onclick: backup }), el('button', { type: 'button', 'class': 'btn btn-ghost btn-sm', text: 'Restore from backup', onclick: restore })]), confirmBox, msg]);
  }
  function packsCard(title, id) {
    var list = el('div', {}, [el('p', { 'class': 'muted', text: 'Loading…' })]);
    api('/api/premium/content/' + id).then(function (r) {
      list.textContent = '';
      if (!r.items.length) return list.appendChild(el('p', { 'class': 'muted', text: 'Nothing has been added here yet.' }));
      r.items.forEach(function (i) { list.appendChild(el('details', { 'class': 'faq' }, [el('summary', { text: i.title }), el('p', { 'class': 'gma-pre', text: i.body })])); });
    }, function (e) { list.textContent = e.message; });
    return card([el('h3', { text: title }), list]);
  }
  function linkCard(title, text, href) { return card([el('h3', { text: title }), el('p', { text: text }), el('a', { 'class': 'btn btn-primary btn-sm', href: href, text: 'Open' })]); }

  function dashboard(me) {
    if (!me) { show(el('div', { 'class': 'gma-split' }, [pitch([el('div', { 'class': 'btn-row' }, [el('a', { 'class': 'btn btn-primary', href: root + 'account/#signup', text: 'Sign up' }), el('a', { 'class': 'btn btn-ghost', href: root + 'account/#signin', text: 'Sign in' })])]), card([el('h2', { text: 'How you get access' }), el('ol', {}, ['Create your account.', 'Verify your email.', 'Wait for the administrator to approve your request.', 'Sign in and use Premium.'].map(function (t) { return el('li', { text: t }); }))])])); return; }
    if (!me.user.premium) { show(statusCard(me), pitch([])); return; }
    show(statusCard(me), el('div', { 'class': 'gma-grid' }, [
      linkCard('BI Studio', 'All six steps from raw data to a report people can trust.', root + 'bi-studio/'),
      linkCard('Business Calculator Lab', 'Sales growth, inventory turnover, productivity and attendance.', root + 'business-calculators/'),
      syncCard(me), packsCard('Report packs', 'report-packs'), packsCard('Premium downloads', 'downloads')]));
  }

  if (page === 'verify') return verifyPage();
  if (page === 'reset') return resetPage();
  show(card([el('p', { 'class': 'muted', text: 'Checking your account…' })]));
  api('/api/auth/me').then(function (me) {
    if (page === 'premium') return dashboard(me);
    show(statusCard(me), el('p', {}, [el('a', { 'class': 'btn btn-primary', href: root + 'premium/', text: 'Open my Premium dashboard' })]));
  }, function (e) {
    if (e.status !== 401) return show(card([el('h2', { text: 'We could not reach your account' }), el('p', { text: e.message }), el('button', { type: 'button', 'class': 'btn btn-primary', text: 'Try again', onclick: function () { location.reload(); } })]));
    if (page === 'premium') return dashboard(null);
    var h = location.hash.slice(1);
    show(el('div', { 'class': 'gma-split' }, [signForms(/^(signin|signup|forgot)$/.test(h) ? h : 'signin'), pitch([])]));
  });
})();
