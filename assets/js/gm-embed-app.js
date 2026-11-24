/* GM Embed: widget library, embed generator, My Embeds prototype and enquiry form. Runs only in the visitor's browser.
   Saved embeds live in this browser's localStorage only; there are no accounts, no server and no tracking of widget views yet. */
(function () {
  'use strict';
  var BASE = 'https://gmtoolshub.com', root = document.getElementById('gm-app');
  if (!root) return;
  var page = root.getAttribute('data-page'), REL = '../../embed/';
  var $ = function (id) { return document.getElementById(id); };
  var SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads';
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function load() { return fetch(REL + 'widgets.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { return j.widgets; }); }
  function store(get, set) { try { if (set !== undefined) { localStorage.setItem('gm.embeds', JSON.stringify(set)); return set; } return JSON.parse(localStorage.getItem('gm.embeds') || '[]'); } catch (e) { return get === 'w' ? null : []; } }
  function hex(v) { return /^[0-9a-fA-F]{6}$/.test(v || ''); }
  function params(w, o) {
    var p = [], has = function (k) { return w.params.indexOf(k) > -1; };
    if (has('theme')) p.push('theme=' + (o.theme === 'dark' ? 'dark' : 'light'));
    if (has('accent') && o.accentOn && hex(o.accent)) p.push('accent=' + o.accent);
    if (has('bg') && o.bgMode === 'transparent') p.push('bg=transparent'); else if (has('bg') && o.bgMode === 'color' && hex(o.bg)) p.push('bg=' + o.bg);
    if (has('radius') && o.radius !== '' && o.radius != null && o.radius >= 0 && o.radius <= 32 && String(o.radius) !== '14') p.push('radius=' + parseInt(o.radius, 10));
    if (has('font') && ['serif', 'mono', 'rounded'].indexOf(o.font) > -1) p.push('font=' + o.font);
    if (has('title') && o.title) p.push('title=1');
    if (has('footer') && o.footer === false) p.push('footer=0');
    if (has('lang') && o.lang === 'ur') p.push('lang=ur');
    if (has('show') && o.show && o.show.length && o.show.length < 3) p.push('show=' + o.show.join(','));
    return p;
  }
  function codes(w, o) {
    var q = params(w, o), qs = q.length ? '?' + q.join('&') : '', url = BASE + w.route + qs;
    var h = o.autoHeight === false ? (parseInt(o.height, 10) || w.minHeight) : w.minHeight, mw = parseInt(o.maxWidth, 10) || 760;
    var iframe = '<iframe src="' + url + '" width="100%" height="' + h + '" loading="lazy" title="' + w.name.replace(/"/g, '') + ' by GM Tools Hub" style="border:0;max-width:' + mw + 'px;display:block" sandbox="' + SANDBOX + '" allow="clipboard-write"></iframe>';
    var attrs = ' data-gm-embed="' + w.id + '"' + q.map(function (x) { var kv = x.split('='); return ' data-' + kv[0] + '="' + kv[1] + '"'; }).join('') + (o.autoHeight === false ? ' data-height="' + h + '"' : '') + (mw !== 760 ? ' data-max-width="' + mw + '"' : '');
    var js = '<div' + attrs + '></div>\n<script src="' + BASE + '/embed/gm-embed.js" async><\/script>';
    return { url: url, iframe: iframe, js: js, qs: qs };
  }
  function copy(text, msgEl) {
    var done = function () { msgEl.textContent = 'Copied.'; setTimeout(function () { msgEl.textContent = ''; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { msgEl.textContent = 'Select the code and press Ctrl+C.'; }); else msgEl.textContent = 'Select the code and press Ctrl+C.';
  }
  function testedLine(w) {
    if (!w.tested) return 'Not yet tested: not listed as compatible.';
    return 'Tested ' + w.tested.date + ' in ' + w.tested.browsers.join(', ') + '. Not tested in: ' + w.tested.notTested.join(', ') + '.';
  }

  /* ---------- Widget library ---------- */
  if (page === 'library') {
    var grid = $('gm-grid'), search = $('gm-search'), cat = $('gm-cat'), count = $('gm-count');
    load().then(function (list) {
      var cats = {}; list.forEach(function (w) { cats[w.category] = 1; }); Object.keys(cats).sort().forEach(function (c) { var o = el('option', '', c); o.value = c; cat.appendChild(o); });
      function render() {
        var q = search.value.trim().toLowerCase(), c = cat.value, n = 0; grid.textContent = '';
        list.forEach(function (w) {
          if (!w.tested) return;
          if (c && w.category !== c) return;
          if (q && (w.name + ' ' + w.description + ' ' + w.category + ' ' + w.features.join(' ')).toLowerCase().indexOf(q) < 0) return;
          n++; var card = el('article', 'ep-card');
          card.appendChild(el('span', 'ep-pill-s', w.category));
          card.appendChild(el('h3', '', w.name));
          card.appendChild(el('p', 'muted', w.description));
          var ul = el('ul'); w.features.forEach(function (f) { ul.appendChild(el('li', '', f)); }); card.appendChild(ul);
          card.appendChild(el('p', 'small', 'Customisation: ' + w.params.join(', ') + '.'));
          card.appendChild(el('p', 'small muted', 'Responsive: no sideways scrolling at 340px width. ' + testedLine(w)));
          var row = el('div', 'btn-row'); var gen = el('a', 'btn btn-primary btn-sm', 'Embed this widget'); gen.href = '../generator/?widget=' + encodeURIComponent(w.id); row.appendChild(gen);
          var pv = el('button', 'btn btn-ghost btn-sm', 'Preview'); pv.type = 'button';
          pv.addEventListener('click', function () {
            var ex = card.querySelector('iframe'); if (ex) { ex.remove(); pv.textContent = 'Preview'; return; }
            var f = document.createElement('iframe'); f.src = REL + w.id + '/?id=pv-' + w.id; f.title = 'Preview of ' + w.name; f.style.cssText = 'border:0;width:100%;margin-top:10px;height:' + w.minHeight + 'px'; f.setAttribute('sandbox', SANDBOX); card.appendChild(f); pv.textContent = 'Hide preview';
          });
          row.appendChild(pv); card.appendChild(row); grid.appendChild(card);
        });
        count.textContent = n + ' widget' + (n === 1 ? '' : 's') + ' shown';
        if (!n) grid.appendChild(el('p', 'muted', 'No widget matches your search.'));
      }
      search.addEventListener('input', render); cat.addEventListener('change', render); render();
      addEventListener('message', function (e) { if (e.origin !== location.origin || !e.data || e.data.source !== 'gm-embed') return; document.querySelectorAll('.ep-card iframe').forEach(function (f) { if (f.contentWindow === e.source && e.data.height >= 120 && e.data.height <= 4000) f.style.height = e.data.height + 'px'; }); });
    }).catch(function () { grid.textContent = 'The widget list could not be loaded. Please refresh the page.'; });
  }

  /* ---------- Embed generator ---------- */
  if (page === 'generator') {
    var W = [], cur = null, sel = $('g-widget'), prev = $('g-prev'), msg = $('g-msg');
    var ctl = { theme: $('g-theme'), accentOn: $('g-accent-on'), accent: $('g-accent'), bgMode: $('g-bg-mode'), bg: $('g-bg'), radius: $('g-radius'), font: $('g-font'), title: $('g-title'), footer: $('g-footer'), maxWidth: $('g-maxw'), autoHeight: $('g-auto'), height: $('g-height'), lang: $('g-lang') };
    function opts() { return { theme: ctl.theme.value, accentOn: ctl.accentOn.checked, accent: ctl.accent.value.replace('#', ''), bgMode: ctl.bgMode.value, bg: ctl.bg.value.replace('#', ''), radius: ctl.radius.value, font: ctl.font.value, title: ctl.title.checked, footer: ctl.footer.checked, maxWidth: ctl.maxWidth.value, autoHeight: ctl.autoHeight.checked, height: ctl.height.value, lang: ctl.lang.value, show: ['gold', 'silver', 'usd'].filter(function (k) { return $('g-show-' + k).checked; }) }; }
    function setOpts(o) {
      if (!o) return; ctl.theme.value = o.theme || 'light'; ctl.accentOn.checked = !!o.accentOn; if (o.accent) ctl.accent.value = '#' + o.accent; ctl.bgMode.value = o.bgMode || 'default'; if (o.bg) ctl.bg.value = '#' + o.bg;
      ctl.radius.value = o.radius == null ? 14 : o.radius; ctl.font.value = o.font || 'system'; ctl.title.checked = !!o.title; ctl.footer.checked = o.footer !== false; ctl.maxWidth.value = o.maxWidth || 760; ctl.autoHeight.checked = o.autoHeight !== false; ctl.height.value = o.height || ''; ctl.lang.value = o.lang || 'en';
      ['gold', 'silver', 'usd'].forEach(function (k) { $('g-show-' + k).checked = !o.show || !o.show.length || o.show.indexOf(k) > -1; });
    }
    function show(id, on) { var n = $(id); if (n) n.hidden = !on; }
    function update() {
      if (!cur) return; var o = opts(), c = codes(cur, o), has = function (k) { return cur.params.indexOf(k) > -1; };
      ['theme', 'accent', 'bg', 'radius', 'font', 'title', 'footer', 'lang', 'show'].forEach(function (k) { show('row-' + k, has(k)); });
      $('g-radius-v').textContent = ctl.radius.value + 'px'; ctl.height.disabled = ctl.autoHeight.checked;
      $('g-code-iframe').value = c.iframe; $('g-code-js').value = c.js; $('g-url').value = c.url;
      prev.src = REL + cur.id + '/' + c.qs + (c.qs ? '&' : '?') + 'id=gen'; prev.title = 'Live preview of ' + cur.name;
      $('g-tested').textContent = testedLine(cur); prev.style.height = (ctl.autoHeight.checked ? cur.minHeight : (parseInt(ctl.height.value, 10) || cur.minHeight)) + 'px';
    }
    addEventListener('message', function (e) { if (e.origin !== location.origin || !e.data || e.data.source !== 'gm-embed' || e.data.id !== 'gen' || prev.contentWindow !== e.source) return; if (ctl.autoHeight.checked && e.data.height >= 120 && e.data.height <= 4000) prev.style.height = e.data.height + 'px'; });
    load().then(function (list) {
      W = list.filter(function (w) { return w.tested; });
      W.forEach(function (w) { var o = el('option', '', w.name); o.value = w.id; sel.appendChild(o); });
      var q = new URLSearchParams(location.search), edit = q.get('edit'), want = q.get('widget');
      if (edit) { var rec = store('l').filter(function (r) { return r.id === edit; })[0]; if (rec) { want = rec.widget; $('g-name').value = rec.name; setOpts(rec.opts); $('g-edit').value = rec.id; } }
      if (want && W.some(function (w) { return w.id === want; })) sel.value = want;
      cur = W.filter(function (w) { return w.id === sel.value; })[0]; update();
    }).catch(function () { msg.textContent = 'The widget list could not be loaded. Please refresh the page.'; });
    sel.addEventListener('change', function () { cur = W.filter(function (w) { return w.id === sel.value; })[0]; update(); });
    Object.keys(ctl).forEach(function (k) { ctl[k].addEventListener('input', update); ctl[k].addEventListener('change', update); });
    ['gold', 'silver', 'usd'].forEach(function (k) { $('g-show-' + k).addEventListener('change', update); });
    $('g-copy-iframe').addEventListener('click', function () { copy($('g-code-iframe').value, $('g-copy-msg')); });
    $('g-copy-js').addEventListener('click', function () { copy($('g-code-js').value, $('g-copy-msg')); });
    $('g-copy-url').addEventListener('click', function () { copy($('g-url').value, $('g-copy-msg')); });
    $('g-save').addEventListener('click', function () {
      var list = store('l'), name = ($('g-name').value || cur.name).slice(0, 60), eid = $('g-edit').value, rec = { id: eid || 'e' + Date.now().toString(36), name: name, widget: cur.id, opts: opts(), created: new Date().toISOString().slice(0, 10) };
      var i = list.map(function (r) { return r.id; }).indexOf(rec.id); if (i > -1) { rec.created = list[i].created; list[i] = rec; } else list.push(rec);
      store('l', list); $('g-edit').value = rec.id; msg.textContent = 'Saved in this browser. Open My Embeds to manage it.';
    });
  }

  /* ---------- My Embeds (prototype, this browser only) ---------- */
  if (page === 'mine') {
    var body = $('m-body');
    function draw() {
      load().then(function (W2) {
        var list = store('l'), byId = {}; W2.forEach(function (w) { byId[w.id] = w; });
        $('m-created').textContent = String(list.length); body.textContent = '';
        if (!list.length) { var tr = el('tr'), td = el('td', 'muted', 'No saved embeds yet. Create one in the Embed Generator and press Save.'); td.colSpan = 4; tr.appendChild(td); body.appendChild(tr); }
        list.forEach(function (r) {
          var w = byId[r.widget]; var tr = el('tr'); tr.appendChild(el('td', '', r.name)); tr.appendChild(el('td', '', w ? w.name : r.widget)); tr.appendChild(el('td', '', r.created));
          var td = el('td'), c = w ? codes(w, r.opts) : null;
          if (c) { var b = el('button', 'btn btn-ghost btn-sm', 'Copy iframe'); b.type = 'button'; b.addEventListener('click', function () { copy(c.iframe, $('m-msg')); }); td.appendChild(b); td.appendChild(document.createTextNode(' ')); var b2 = el('button', 'btn btn-ghost btn-sm', 'Copy JS'); b2.type = 'button'; b2.addEventListener('click', function () { copy(c.js, $('m-msg')); }); td.appendChild(b2); td.appendChild(document.createTextNode(' ')); }
          var ed = el('a', 'btn btn-ghost btn-sm', 'Edit'); ed.href = '../generator/?edit=' + encodeURIComponent(r.id); td.appendChild(ed); td.appendChild(document.createTextNode(' '));
          var del = el('button', 'btn btn-ghost btn-sm', 'Delete'); del.type = 'button'; del.addEventListener('click', function () { store('l', store('l').filter(function (x) { return x.id !== r.id; })); draw(); }); td.appendChild(del);
          tr.appendChild(td); body.appendChild(tr);
        });
      });
    }
    draw();
    $('m-export').addEventListener('click', function () { var blob = new Blob([JSON.stringify(store('l'), null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'gm-embeds-backup.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); });
    $('m-import').addEventListener('change', function (ev) {
      var f = ev.target.files[0]; if (!f || f.size > 200000) { $('m-msg').textContent = 'Please choose a backup file under 200 KB.'; return; }
      var rd = new FileReader(); rd.onload = function () { try { var d = JSON.parse(rd.result); if (!Array.isArray(d)) throw 0; var ok = d.filter(function (r) { return r && typeof r.id === 'string' && typeof r.widget === 'string' && typeof r.name === 'string'; }).slice(0, 200).map(function (r) { return { id: r.id.slice(0, 20), name: r.name.slice(0, 60), widget: r.widget.slice(0, 60), opts: (r.opts && typeof r.opts === 'object') ? r.opts : {}, created: String(r.created || '').slice(0, 10) }; }); store('l', ok); draw(); $('m-msg').textContent = ok.length + ' embeds restored.'; } catch (e) { $('m-msg').textContent = 'That file is not a valid GM Embed backup.'; } }; rd.readAsText(f);
    });
  }

  /* ---------- Enquiry form: opens the visitor's own email or WhatsApp, sends nothing itself ---------- */
  if (page === 'support') {
    var f = $('s-form'), m = $('s-msg'), way = 'wa';
    f.querySelectorAll('button[type=submit]').forEach(function (b) { b.addEventListener('click', function () { way = b.getAttribute('data-way'); }); });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); var t = $('s-text').value.trim();
      if (t.length < 10) { m.textContent = 'Please write a sentence or two so we can help.'; m.className = 'small ep-bad'; return; }
      if (/password|otp|\b\d{13}\b|\b\d{5}-\d{7}-\d\b/i.test(t)) { m.textContent = 'Please remove passwords, ID numbers or codes from your message.'; m.className = 'small ep-bad'; return; }
      var body = 'GM Embed enquiry\nType: ' + $('s-type').value + '\nSite: ' + ($('s-site').value || '-').slice(0, 120) + '\n\n' + t + '\n\n(Sent from gmtoolshub.com/gm-embed/support/)';
      if (window.GM_track) window.GM_track('enquiry_click', { page: location.pathname, topic: $('s-type').value });
      if (way === 'mail') location.href = 'mailto:asmarkniazi@gmail.com?subject=' + encodeURIComponent('GM Embed: ' + $('s-type').value) + '&body=' + encodeURIComponent(body);
      else window.open('https://wa.me/923158935101?text=' + encodeURIComponent(body), '_blank', 'noopener');
      m.textContent = 'Your email or WhatsApp app should open with the message ready. Press Send there.'; m.className = 'small ep-ok';
    });
  }
})();
