/* Administrator console for members and permissions. The server checks the owner session on every request. */
(function () {
  var GMA = window.GMA, app = document.getElementById('gma-app'); if (!GMA || !app) return;
  var el = GMA.el, field = GMA.field, form = GMA.form, api = GMA.api;
  var csrf = '', view = 'users', filter = { status: 'pending', q: '', page: 1 };
  function card(kids, cls) { return el('div', { 'class': 'gma-card ' + (cls || '') }, kids); }
  function show() { app.textContent = ''; [].forEach.call(arguments, function (n) { if (n) app.appendChild(n); }); }
  if (!GMA.enabled) { show(card([el('h2', { text: 'Accounts are not switched on' }), el('p', { text: 'Deploy the accounts server, then set its address in assets/js/account-config.js.' })])); return; }
  function call(path, opt) { opt = opt || {}; if (opt.json !== undefined || (opt.method && opt.method !== 'GET')) opt.csrf = csrf; return api(path, opt).catch(function (e) { if (e.status === 401) { signIn('Your session has ended. Please sign in again.'); } throw e; }); }
  function day(s) { return s ? String(s).slice(0, 10) : '—'; }
  function when(s) { return s ? String(s).replace('T', ' ').slice(0, 16) + ' UTC' : '—'; }
  var note = el('p', { 'class': 'gma-msg', role: 'status', 'aria-live': 'polite' });
  function say(t, k) { note.className = 'gma-msg ' + (k || ''); note.textContent = t; }

  function signIn(message) {
    var f = form([field('Admin email', { name: 'email', type: 'email', autocomplete: 'username' }), field('Password', { name: 'password', type: 'password', autocomplete: 'current-password' })], 'Sign in', function (d) {
      return api('/api/admin/login', { json: d }).then(function (r) { csrf = r.csrf; render(); });
    });
    show(card([el('h2', { text: 'Administrator sign in' }), message ? el('p', { text: message }) : null, f], 'gma-narrow'));
  }

  function shell(body) {
    var bar = el('div', { 'class': 'gma-tabs', role: 'tablist' }, [['users', 'Members'], ['features', 'Free and Premium'], ['content', 'Premium content']].map(function (t) { return el('button', { type: 'button', role: 'tab', 'aria-selected': view === t[0] ? 'true' : 'false', text: t[1], onclick: function () { view = t[0]; say(''); render(); } }); }));
    var out = el('button', { type: 'button', 'class': 'btn btn-ghost btn-sm', text: 'Sign out', onclick: function () { call('/api/admin/logout', { json: {} }).then(function () { csrf = ''; signIn('You are signed out.'); }, function (e) { say(e.message, 'err'); }); } });
    show(el('div', { 'class': 'gma-top' }, [bar, out]), note, body);
  }

  function actionsFor(u) {
    var list = { pending: ['approve', 'reject'], approved: ['access', 'suspend', 'revoke'], suspended: ['reactivate', 'revoke'], rejected: ['approve'], revoked: ['access'], unverified: [] }[u.status] || [];
    var names = { approve: 'Approve', reject: 'Reject', access: 'Change access', suspend: 'Suspend', reactivate: 'Reactivate', revoke: 'Revoke access' };
    if (!list.length) return el('p', { 'class': 'muted', text: 'This person has not verified their email yet, so there is nothing to decide.' });
    var needsPlan = list.indexOf('approve') > -1 || list.indexOf('access') > -1;
    var plan = field('Access length', { name: 'plan', type: 'select' }), date = field('Ends on (custom only)', { name: 'ends_on', type: 'date' });
    [['lifetime', 'Lifetime'], ['monthly', 'One month'], ['annual', 'One year'], ['custom', 'Until a chosen date']].forEach(function (o) { plan.input.appendChild(el('option', { value: o[0], text: o[1] })); });
    date.hidden = true; plan.input.addEventListener('change', function () { date.hidden = plan.input.value !== 'custom'; });
    var confirmBox = el('div', { 'class': 'gma-confirm', hidden: true });
    var buttons = el('div', { 'class': 'btn-row' }, list.map(function (a) {
      return el('button', { type: 'button', 'class': 'btn btn-sm ' + (a === 'approve' || a === 'access' || a === 'reactivate' ? 'btn-primary' : 'btn-ghost'), text: names[a], onclick: function () {
        confirmBox.textContent = ''; confirmBox.hidden = false;
        var grants = a === 'approve' || a === 'access';
        var summary = names[a] + ' for ' + u.email + (grants ? ' (' + plan.input.options[plan.input.selectedIndex].text + (plan.input.value === 'custom' ? ' ' + (date.input.value || 'no date chosen') : '') + ')' : '') + '?';
        confirmBox.appendChild(el('p', { text: summary }));
        confirmBox.appendChild(el('button', { type: 'button', 'class': 'btn btn-primary btn-sm', text: 'Confirm', onclick: function () {
          this.disabled = true;
          var body = grants ? { plan: plan.input.value, ends_on: date.input.value } : {};
          call('/api/admin/users/' + u.id + '/' + a, { json: body }).then(function () { say(names[a] + ' done for ' + u.email + '.', 'ok'); detail(u.id); }, function (e) { confirmBox.hidden = true; say(e.message, 'err'); });
        } }));
        confirmBox.appendChild(el('button', { type: 'button', 'class': 'btn btn-ghost btn-sm', text: 'Cancel', onclick: function () { confirmBox.hidden = true; } }));
      } });
    }));
    return el('div', {}, [needsPlan ? el('div', { 'class': 'gma-row' }, [plan, date]) : null, buttons, confirmBox]);
  }

  function detail(id) {
    call('/api/admin/users/' + id).then(function (r) {
      var u = r.user;
      shell(el('div', {}, [
        el('button', { type: 'button', 'class': 'gma-link', text: '← Back to members', onclick: function () { say(''); render(); } }),
        card([el('h2', { text: u.name }), el('p', { text: u.email }), el('dl', { 'class': 'gma-facts' }, [['Status', u.status], ['Plan', u.plan || '—'], ['Access ends', u.plan === 'lifetime' ? 'No end date' : day(u.access_expires_at)], ['Signed up', when(u.created_at)], ['Email verified', when(u.email_verified_at)], ['Last decision', when(u.decided_at)]].reduce(function (all, p) { return all.concat([el('dt', { text: p[0] }), el('dd', { text: p[1] })]); }, [])), actionsFor(u)]),
        card([el('h3', { text: 'Registration and sign-in history' }), el('div', { 'class': 'gma-scroll' }, [el('table', {}, [el('thead', {}, [el('tr', {}, [el('th', { text: 'When' }), el('th', { text: 'What happened' }), el('th', { text: 'Detail' })])]), el('tbody', {}, r.history.map(function (h) { return el('tr', {}, [el('td', { text: when(h.at) }), el('td', { text: h.action }), el('td', { text: h.detail || '' })]); }))])])])
      ]));
    }, function (e) { say(e.message, 'err'); });
  }

  function users() {
    var q = '/api/admin/users?status=' + encodeURIComponent(filter.status) + '&q=' + encodeURIComponent(filter.q) + '&page=' + filter.page;
    return call(q).then(function (r) {
      var status = field('Show', { name: 'status', type: 'select' });
      [['pending', 'Waiting for approval'], ['approved', 'Approved'], ['suspended', 'Suspended'], ['revoked', 'Revoked'], ['rejected', 'Rejected'], ['unverified', 'Email not verified'], ['', 'Everyone']].forEach(function (o) { status.input.appendChild(el('option', { value: o[0], text: o[1] + (o[0] && r.counts[o[0]] ? ' (' + r.counts[o[0]] + ')' : '') })); });
      status.input.value = filter.status;
      status.input.addEventListener('change', function () { filter.status = status.input.value; filter.page = 1; render(); });
      var search = field('Search name or email', { name: 'q', type: 'search', value: filter.q });
      var f = form([search], 'Search', function (d) { filter.q = d.q; filter.page = 1; render(); });
      var pages = Math.max(1, Math.ceil(r.total / 25));
      shell(card([el('div', { 'class': 'gma-row' }, [status, f]),
        r.users.length ? el('div', { 'class': 'gma-scroll' }, [el('table', {}, [el('thead', {}, [el('tr', {}, ['Name', 'Email', 'Status', 'Plan', 'Signed up', ''].map(function (h) { return el('th', { text: h }); }))]), el('tbody', {}, r.users.map(function (u) { return el('tr', {}, [el('td', { text: u.name }), el('td', { text: u.email }), el('td', { text: u.status }), el('td', { text: u.plan || '—' }), el('td', { text: day(u.created_at) }), el('td', {}, [el('button', { type: 'button', 'class': 'btn btn-ghost btn-sm', text: 'Open', onclick: function () { say(''); detail(u.id); } })])]); }))])]) : el('p', { 'class': 'muted', text: 'No members match.' }),
        el('div', { 'class': 'btn-row' }, [filter.page > 1 ? el('button', { type: 'button', 'class': 'btn btn-ghost btn-sm', text: 'Previous', onclick: function () { filter.page--; render(); } }) : null, el('span', { text: 'Page ' + filter.page + ' of ' + pages }), filter.page < pages ? el('button', { type: 'button', 'class': 'btn btn-ghost btn-sm', text: 'Next', onclick: function () { filter.page++; render(); } }) : null])]));
    });
  }

  function features() {
    return call('/api/admin/features').then(function (r) {
      shell(card([el('h2', { text: 'Free, Premium or Admin' }), el('p', { text: 'Changes apply at once. "Server protected" features are enforced by the server. "Page lock" features run in the visitor’s browser, so the lock stops normal use but is not strong protection.' })].concat(r.features.map(function (f) {
        var s = el('select', { 'aria-label': 'Access for ' + f.name }, ['free', 'premium', 'admin'].map(function (t) { return el('option', { value: t, text: t.charAt(0).toUpperCase() + t.slice(1) }); }));
        s.value = f.tier;
        s.addEventListener('change', function () { s.disabled = true; call('/api/admin/features/' + f.id, { method: 'PUT', json: { tier: s.value } }).then(function () { f.tier = s.value; say(f.name + ' is now ' + s.value + '.', 'ok'); }, function (e) { s.value = f.tier; say(e.message, 'err'); }).then(function () { s.disabled = false; }); });
        return el('div', { 'class': 'gma-feature' }, [el('div', {}, [el('strong', { text: f.name }), el('small', { text: f.path + ' · ' + (f.enforcement === 'server' ? 'Server protected' : 'Page lock') })]), s]);
      }))));
    });
  }

  var contentFeature = 'report-packs';
  function content() {
    return call('/api/admin/content/' + contentFeature).then(function (r) {
      var pick = field('Section', { name: 'section', type: 'select' });
      [['report-packs', 'Report packs'], ['downloads', 'Premium downloads']].forEach(function (o) { pick.input.appendChild(el('option', { value: o[0], text: o[1] })); });
      pick.input.value = contentFeature; pick.input.addEventListener('change', function () { contentFeature = pick.input.value; render(); });
      var title = field('Title', { name: 'title', type: 'text', maxlength: 120 });
      var area = el('textarea', { name: 'body', rows: 6, 'aria-label': 'Text or private link', placeholder: 'Text, instructions or a private download link' });
      var add = form([title, area], 'Add item', function (d) { return call('/api/admin/content/' + contentFeature, { json: d }).then(function () { say('Item added.', 'ok'); render(); }); });
      shell(card([el('h2', { text: 'Private Premium content' }), el('p', { text: 'Stored on the server and shown only to members with active Premium. A link you paste here can be opened by anyone who has it, so use links that require access.' }), pick,
        el('div', {}, r.items.map(function (i) { return el('div', { 'class': 'gma-feature' }, [el('div', {}, [el('strong', { text: i.title }), el('small', { text: 'Updated ' + day(i.updated_at) })]), el('button', { type: 'button', 'class': 'btn btn-ghost btn-sm', text: 'Delete', onclick: function () { var b = this; if (b.textContent === 'Delete') { b.textContent = 'Click again to delete'; return; } call('/api/admin/content/' + contentFeature + '/' + i.id, { method: 'DELETE' }).then(function () { say('Item deleted.', 'ok'); render(); }, function (e) { say(e.message, 'err'); }); } })]); })), add]));
    });
  }

  function render() { var run = view === 'features' ? features : view === 'content' ? content : users; run().catch(function (e) { if (e.status !== 401) { shell(card([el('p', { text: e.message })])); } }); }
  api('/api/admin/me').then(function (r) { csrf = r.csrf; render(); }, function () { signIn(''); });
})();
