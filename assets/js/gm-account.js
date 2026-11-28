/* Shared helpers for accounts, Premium locks and the member admin console. All permission decisions are made by the server. */
(function () {
  var base = String((window.GM_ACCOUNT && window.GM_ACCOUNT.apiBase) || '').replace(/\/+$/, '');
  var root = (document.body && document.body.getAttribute('data-root')) || './';
  function api(path, opt) {
    opt = opt || {};
    var headers = {};
    if (opt.json !== undefined) headers['Content-Type'] = 'application/json';
    if (opt.csrf) headers['X-CSRF-Token'] = opt.csrf;
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 15000) : 0;
    return fetch(base + path, { method: opt.method || (opt.json !== undefined ? 'POST' : 'GET'), headers: headers, credentials: 'include', cache: 'no-store', signal: ctl ? ctl.signal : undefined, body: opt.json !== undefined ? JSON.stringify(opt.json) : undefined })
      .then(function (r) {
        clearTimeout(timer);
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok) { var e = new Error((d.error && d.error.message) || 'Something went wrong. Please try again.'); e.status = r.status; e.code = d.error && d.error.code; throw e; }
          return d;
        });
      }, function () { clearTimeout(timer); var e = new Error('We could not reach the account service. Check your connection and try again.'); e.status = 0; throw e; });
  }
  /* builds elements with text only, so names and other typed text can never run as code */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null && c !== false) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function field(label, attrs, hint) {
    var id = 'gmf-' + attrs.name + '-' + Math.random().toString(36).slice(2, 7);
    attrs.id = id;
    var input = el(attrs.type === 'select' ? 'select' : 'input', attrs.type === 'select' ? { id: id, name: attrs.name } : attrs);
    var box = el('div', { 'class': 'gma-field' }, [el('label', { 'for': id, text: label }), input, hint ? el('small', { text: hint }) : null]);
    box.input = input;
    return box;
  }
  /* a form that shows its own message, disables the button while working and never reloads the page */
  function form(fields, buttonText, send) {
    var msg = el('p', { 'class': 'gma-msg', role: 'status', 'aria-live': 'polite' });
    var btn = el('button', { type: 'submit', 'class': 'btn btn-primary', text: buttonText });
    var f = el('form', { 'class': 'gma-form', novalidate: true }, fields.concat([btn, msg]));
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {};
      [].forEach.call(f.elements, function (i) { if (i.name) data[i.name] = i.type === 'checkbox' ? i.checked : i.value; });
      btn.disabled = true; msg.className = 'gma-msg'; msg.textContent = 'Please wait…';
      Promise.resolve(send(data, f)).then(function (okText) { msg.className = 'gma-msg ok'; msg.textContent = okText || ''; }, function (err) { msg.className = 'gma-msg err'; msg.textContent = err.message; }).then(function () { btn.disabled = false; });
    });
    f.say = function (text, kind) { msg.className = 'gma-msg ' + (kind || ''); msg.textContent = text; };
    return f;
  }
  window.GMA = { enabled: !!base, root: root, api: api, el: el, field: field, form: form };
})();
