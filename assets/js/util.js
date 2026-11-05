/* Shared helpers for all tools: forms, formatting, clipboard, downloads, storage, zip. */
(function (global) {
  'use strict';
  var U = {};

  /* ---------- basics ---------- */
  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  U.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  U.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /** Parse a number from user input; accepts "1,234.50". Returns NaN for blank/invalid. */
  U.num = function (v) {
    if (v == null) return NaN;
    var s = String(v).trim().replace(/,/g, '').replace(/\s/g, '');
    if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  };
  U.isNum = function (n) { return typeof n === 'number' && isFinite(n); };
  U.round = function (n, d) { var p = Math.pow(10, d == null ? 2 : d); return Math.round((n + Number.EPSILON) * p) / p; };
  U.fmt = function (n, d, min) {
    if (!U.isNum(n)) return '–';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: d == null ? 2 : d, minimumFractionDigits: min || 0 }).format(n);
  };
  U.pct = function (n, d) { return U.isNum(n) ? U.fmt(n, d == null ? 2 : d) + '%' : '–'; };
  U.money = function (n, cur, d) {
    if (!U.isNum(n)) return '–';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || 'USD', maximumFractionDigits: d == null ? 2 : d, minimumFractionDigits: d == null ? 2 : d }).format(n);
    } catch (e) { return (cur || '') + ' ' + U.fmt(n, 2, 2); }
  };
  U.pad2 = function (n) { return ('0' + n).slice(-2); };
  U.slug = function (s) { return String(s || 'file').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'file'; };
  U.debounce = function (fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 120); }; };
  U.today = function () { var d = new Date(); return d.getFullYear() + '-' + U.pad2(d.getMonth() + 1) + '-' + U.pad2(d.getDate()); };
  U.longDate = function (iso) {
    var d = iso ? new Date(iso + 'T00:00:00') : new Date();
    if (isNaN(d)) return iso || '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  /* ---------- storage ---------- */
  U.store = {
    get: function (k, def) { try { var v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  /* ---------- UI feedback ---------- */
  U.toast = function (msg) {
    var t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(U._tt); U._tt = setTimeout(function () { t.classList.remove('show'); }, 2200);
  };
  U.copy = function (text, okMsg) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta); U.toast(ok ? (okMsg || 'Copied to clipboard') : 'Copy failed — select the text and copy manually');
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { U.toast(okMsg || 'Copied to clipboard'); }, fallback);
    } else fallback();
  };
  U.download = function (filename, data, mime) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  };

  /* ---------- form building ---------- */
  function fieldHTML(f) {
    var id = 'f-' + f.id, cls = 'field' + (f.wide ? ' wide' : '') + (f.type === 'checkbox' ? ' check' : '');
    var attrs = ' id="' + id + '" name="' + f.id + '"';
    if (f.placeholder) attrs += ' placeholder="' + U.esc(f.placeholder) + '"';
    if (f.min != null) attrs += ' min="' + f.min + '"';
    if (f.max != null) attrs += ' max="' + f.max + '"';
    if (f.step != null) attrs += ' step="' + f.step + '"';
    if (f.maxlength) attrs += ' maxlength="' + f.maxlength + '"';
    if (f.autocomplete) attrs += ' autocomplete="' + f.autocomplete + '"';
    if (f.required) attrs += ' aria-required="true"';
    var val = f.value == null ? '' : f.value, h = '';
    if (f.type === 'select') {
      h = '<select' + attrs + '>' + f.options.map(function (o) {
        var ov = typeof o === 'object' ? o.value : o, ol = typeof o === 'object' ? o.label : o;
        return '<option value="' + U.esc(ov) + '"' + (String(ov) === String(val) ? ' selected' : '') + '>' + U.esc(ol) + '</option>';
      }).join('') + '</select>';
    } else if (f.type === 'textarea') {
      h = '<textarea' + attrs + ' rows="' + (f.rows || 4) + '">' + U.esc(val) + '</textarea>';
    } else if (f.type === 'checkbox') {
      return '<div class="' + cls + '"><input type="checkbox"' + attrs + (val ? ' checked' : '') + '><label for="' + id + '">' + f.label + '</label></div>';
    } else {
      var type = f.type || 'text';
      var inputmode = type === 'number' ? ' inputmode="decimal"' : '';
      // number fields use type=text + inputmode so thousands separators and validation messages stay under our control
      if (type === 'number') type = 'text';
      h = '<input type="' + type + '"' + inputmode + attrs + ' value="' + U.esc(val) + '">';
    }
    return '<div class="' + cls + '"><label for="' + id + '">' + f.label + '</label>' + h + (f.hint ? '<small class="hint">' + f.hint + '</small>' : '') + '</div>';
  }
  U.fieldsHTML = function (fields) { return '<div class="form-grid">' + fields.map(fieldHTML).join('') + '</div>'; };

  /**
   * Mount a standard tool UI.
   * cfg: { fields, before, after, actions:[{id,label,kind,onClick}], reset:true, onInput(vals, ctx), initial:true }
   */
  U.mount = function (root, cfg) {
    var defaults = {};
    (cfg.fields || []).forEach(function (f) { defaults[f.id] = f.value == null ? (f.type === 'checkbox' ? false : '') : f.value; });
    var html = (cfg.before || '') + '<form class="tool-form" novalidate autocomplete="off">' + U.fieldsHTML(cfg.fields || []) + (cfg.after || '') +
      '<div class="form-error" role="alert" id="tool-error"></div><div class="tool-actions">' +
      (cfg.actions || []).map(function (a) { return '<button type="button" class="btn ' + (a.kind === 'ghost' ? 'btn-ghost' : 'btn-primary') + '" data-act="' + a.id + '">' + a.label + '</button>'; }).join('') +
      (cfg.reset === false ? '' : '<button type="button" class="btn btn-ghost" data-act="__reset">Reset</button>') +
      '</div></form><div class="tool-result" id="tool-result" aria-live="polite"></div>';
    root.innerHTML = html;
    var form = root.querySelector('form'), out = root.querySelector('#tool-result'), err = root.querySelector('#tool-error');
    var ctx = {
      root: root, form: form, out: out,
      vals: function () {
        var v = {};
        (cfg.fields || []).forEach(function (f) {
          var el = root.querySelector('#f-' + f.id);
          if (!el) return;
          v[f.id] = f.type === 'checkbox' ? el.checked : el.value;
        });
        return v;
      },
      set: function (id, value) {
        var el = root.querySelector('#f-' + id); if (!el) return;
        if (el.type === 'checkbox') el.checked = !!value; else el.value = value;
      },
      html: function (h) { out.innerHTML = h; },
      empty: function (msg) { out.innerHTML = '<div class="result-empty">' + (msg || 'Enter your values above to see the result.') + '</div>'; },
      error: function (msg) { err.textContent = msg || ''; },
      clear: function () { err.textContent = ''; },
      $: function (s) { return root.querySelector(s); }
    };
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    var run = function () { ctx.clear(); try { cfg.onInput && cfg.onInput(ctx.vals(), ctx); } catch (e) { ctx.error('Something went wrong: ' + e.message); if (global.console) console.warn(e); } };
    var deb = U.debounce(run, 80);
    form.addEventListener('input', deb);
    form.addEventListener('change', run);
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b || !root.contains(b)) return;
      var id = b.getAttribute('data-act');
      if (id === '__reset') {
        (cfg.fields || []).forEach(function (f) { ctx.set(f.id, defaults[f.id]); });
        ctx.clear(); out.innerHTML = ''; run(); if (cfg.onReset) cfg.onReset(ctx);
        return;
      }
      var a = (cfg.actions || []).filter(function (x) { return x.id === id; })[0];
      if (a && a.onClick) { ctx.clear(); try { a.onClick(ctx.vals(), ctx, b); } catch (e) { ctx.error('Something went wrong: ' + e.message); } }
    });
    if (cfg.initial !== false) run();
    return ctx;
  };

  /* ---------- result rendering ---------- */
  U.box = function (label, value, cls, big) {
    return '<div class="result-box' + (big ? ' big' : '') + '"><small>' + U.esc(label) + '</small><b class="' + (cls || '') + '">' + value + '</b></div>';
  };
  U.grid = function (boxes) { return '<div class="result-grid">' + boxes.join('') + '</div>'; };
  U.table = function (heads, rows, numFrom) {
    numFrom = numFrom == null ? 1 : numFrom;
    return '<div class="table-wrap"><table class="data"><thead><tr>' + heads.map(function (h, i) { return '<th' + (i >= numFrom ? ' class="num"' : '') + '>' + U.esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td' + (i >= numFrom ? ' class="num"' : '') + '>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  };

  /* ---------- dates ---------- */
  U.parseDate = function (s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    var p = s.split('-').map(Number), d = new Date(p[0], p[1] - 1, p[2]);
    if (d.getFullYear() !== p[0] || d.getMonth() !== p[1] - 1 || d.getDate() !== p[2]) return null;
    return d;
  };
  U.daysInMonth = function (y, m) { return new Date(y, m + 1, 0).getDate(); };
  /** Calendar difference between two dates (a <= b) as {y,m,d}. */
  U.ymd = function (a, b) {
    var y = b.getFullYear() - a.getFullYear(), m = b.getMonth() - a.getMonth(), d = b.getDate() - a.getDate();
    if (d < 0) { m--; d += U.daysInMonth(b.getFullYear(), b.getMonth() - 1); }
    if (m < 0) { y--; m += 12; }
    return { y: y, m: m, d: d };
  };
  U.dayDiff = function (a, b) { return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000); };

  /* ---------- tabs ---------- */
  U.tabs = function (root, names, onSelect) {
    var bar = document.createElement('div'); bar.className = 'tabs'; bar.setAttribute('role', 'tablist');
    bar.innerHTML = names.map(function (n, i) { return '<button type="button" class="tab" role="tab" aria-selected="' + (i === 0) + '" data-i="' + i + '">' + U.esc(n) + '</button>'; }).join('');
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.tab'); if (!b) return;
      U.$$('.tab', bar).forEach(function (t) { t.setAttribute('aria-selected', t === b ? 'true' : 'false'); });
      onSelect(+b.getAttribute('data-i'));
    });
    root.insertBefore(bar, root.firstChild);
    return bar;
  };

  /* ---------- CRC32 + ZIP (store) ---------- */
  var crcTable = null;
  function crc32(bytes) {
    if (!crcTable) { crcTable = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; } }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  U.crc32 = crc32;
  /** files: [{name, data:Uint8Array}] -> Blob (uncompressed zip) */
  U.zip = function (files) {
    var parts = [], central = [], offset = 0, enc = new TextEncoder();
    function u16(n) { return [n & 255, (n >>> 8) & 255]; }
    function u32(n) { return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; }
    files.forEach(function (f) {
      var name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      var local = new Uint8Array([0x50, 0x4b, 3, 4].concat(u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(size), u32(size), u16(name.length), u16(0)));
      parts.push(local, name, f.data);
      var cen = new Uint8Array([0x50, 0x4b, 1, 2].concat(u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(size), u32(size), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset)));
      central.push(cen, name);
      offset += local.length + name.length + size;
    });
    var cdSize = 0; central.forEach(function (c) { cdSize += c.length; });
    var end = new Uint8Array([0x50, 0x4b, 5, 6].concat(u16(0), u16(0), u16(files.length), u16(files.length), u32(cdSize), u32(offset), u16(0)));
    return new Blob(parts.concat(central, [end]), { type: 'application/zip' });
  };

  /* ---------- text helpers shared by writers ---------- */
  U.lines = function (s) { return String(s || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); };
  U.stripBullet = function (s) { return s.replace(/^[-*••\d.)\s]+(?=\S)/, '').trim(); };
  U.titleCase = function (s) { return String(s || '').replace(/\w\S*/g, function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }); };
  U.list = function (s) { return String(s || '').split(/[,;\n]/).map(function (x) { return x.trim(); }).filter(Boolean); };
  U.joinAnd = function (arr) {
    if (arr.length <= 1) return arr.join('');
    if (arr.length === 2) return arr[0] + ' and ' + arr[1];
    return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  };

  /** Standard action trio for text outputs. */
  U.textActions = function (ctx, getText, filename, makePdf) {
    var wrap = ctx.out;
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-out]'); if (!b) return;
      var el = ctx.$('#out-text'), t = el ? el.value : getText();
      if (b.getAttribute('data-out') === 'copy') U.copy(t);
      if (b.getAttribute('data-out') === 'txt') U.download(filename + '.txt', t);
      if (b.getAttribute('data-out') === 'pdf' && makePdf) { try { U.download(filename + '.pdf', makePdf(t)); } catch (er) { ctx.error('Could not create the PDF: ' + er.message); } }
    });
  };
  U.outputButtons = function (pdf) {
    return '<div class="tool-actions"><button type="button" class="btn btn-primary btn-sm" data-out="copy">Copy</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-out="txt">Download .txt</button>' +
      (pdf ? '<button type="button" class="btn btn-ghost btn-sm" data-out="pdf">Download PDF</button>' : '') + '</div>';
  };

  global.NiaziUtil = U;
  global.NiaziTools = global.NiaziTools || {};
})(typeof window !== 'undefined' ? window : globalThis);
