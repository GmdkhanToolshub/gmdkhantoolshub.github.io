NiaziTools['qr-code-generator'] = function (root, U) {
  var TYPES = ['Website URL', 'Plain text', 'Contact (vCard)', 'Wi-Fi network', 'Email', 'Phone / SMS'];
  var FIELDS = [
    [{ id: 'url', label: 'Website address', value: '', placeholder: 'https://example.com', wide: true }],
    [{ id: 'text', label: 'Text', type: 'textarea', rows: 4, value: '', wide: true, maxlength: 1000 }],
    [{ id: 'fn', label: 'First name', value: '' }, { id: 'ln', label: 'Last name', value: '' }, { id: 'org', label: 'Company', value: '' }, { id: 'job', label: 'Job title', value: '' }, { id: 'tel', label: 'Phone', value: '' }, { id: 'mail', label: 'Email', value: '' }, { id: 'web', label: 'Website', value: '', wide: true }],
    [{ id: 'ssid', label: 'Network name (SSID)', value: '' }, { id: 'pw', label: 'Password', value: '' }, { id: 'sec', label: 'Security', type: 'select', options: ['WPA', 'WEP', 'nopass'], value: 'WPA' }],
    [{ id: 'to', label: 'Email address', value: '' }, { id: 'sub', label: 'Subject (optional)', value: '' }, { id: 'body', label: 'Message (optional)', type: 'textarea', rows: 3, value: '', wide: true }],
    [{ id: 'num', label: 'Phone number', value: '', placeholder: '+92 300 1234567' }, { id: 'sms', label: 'SMS text (optional — creates an SMS QR)', value: '' }]
  ];
  var idx = 0, ctx, canvas, svgStr = '';
  function payload(v) {
    var e = function (s) { return String(s).replace(/([\;,":])/g, '\\$1'); };
    if (idx === 0) { var u = v.url.trim(); if (!u) return null; if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u; return u; }
    if (idx === 1) return v.text.trim() ? v.text : null;
    if (idx === 2) { if (!v.fn.trim() && !v.ln.trim() && !v.org.trim()) return null; return ['BEGIN:VCARD', 'VERSION:3.0', 'N:' + v.ln.trim() + ';' + v.fn.trim() + ';;;', 'FN:' + (v.fn.trim() + ' ' + v.ln.trim()).trim(), v.org.trim() && 'ORG:' + v.org.trim(), v.job.trim() && 'TITLE:' + v.job.trim(), v.tel.trim() && 'TEL:' + v.tel.trim(), v.mail.trim() && 'EMAIL:' + v.mail.trim(), v.web.trim() && 'URL:' + v.web.trim(), 'END:VCARD'].filter(Boolean).join('\n'); }
    if (idx === 3) { if (!v.ssid.trim()) return null; return 'WIFI:T:' + v.sec + ';S:' + e(v.ssid) + ';' + (v.sec !== 'nopass' ? 'P:' + e(v.pw) + ';' : '') + ';'; }
    if (idx === 4) { if (!v.to.trim()) return null; var q = []; if (v.sub.trim()) q.push('subject=' + encodeURIComponent(v.sub)); if (v.body.trim()) q.push('body=' + encodeURIComponent(v.body)); return 'mailto:' + v.to.trim() + (q.length ? '?' + q.join('&') : ''); }
    if (!v.num.trim()) return null; var n = v.num.replace(/[^\d+]/g, ''); return v.sms.trim() ? 'SMSTO:' + n + ':' + v.sms.trim() : 'tel:' + n;
  }
  root.innerHTML = '<div id="qr-top"></div><div class="two-col-tool"><div id="qr-form"></div><div><div class="qr-stage" id="qr-stage"><p class="muted small" style="color:#555;margin:0">Your QR code appears here</p></div><div class="tool-actions"><button type="button" class="btn btn-primary btn-sm" id="qr-png" disabled>Download PNG</button><button type="button" class="btn btn-ghost btn-sm" id="qr-svg" disabled>Download SVG</button></div><p class="small muted" id="qr-info"></p></div></div>';
  function build() {
    var extra = [
      { id: 'size', label: 'Size (pixels)', type: 'select', options: ['256', '384', '512', '768', '1024'], value: '512' },
      { id: 'ecl', label: 'Error correction', type: 'select', options: [{ value: 'L', label: 'Low (7%)' }, { value: 'M', label: 'Medium (15%)' }, { value: 'Q', label: 'Quartile (25%)' }, { value: 'H', label: 'High (30%)' }], value: 'M' },
      { id: 'fg', label: 'Foreground colour', type: 'color', value: '#0a1128' }, { id: 'bg', label: 'Background colour', type: 'color', value: '#ffffff' }
    ];
    ctx = U.mount(root.querySelector('#qr-form'), { fields: FIELDS[idx].concat(extra), reset: true, onInput: render });
  }
  function lum(h) { var c = [1, 3, 5].map(function (i) { var x = parseInt(h.substr(i, 2), 16) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function render(v, c) {
    var stage = root.querySelector('#qr-stage'), pn = root.querySelector('#qr-png'), sv = root.querySelector('#qr-svg'), info = root.querySelector('#qr-info');
    var data = payload(v);
    if (!data) { stage.innerHTML = '<p class="muted small" style="color:#555;margin:0">Fill in the details to generate your QR code</p>'; pn.disabled = sv.disabled = true; info.textContent = ''; canvas = null; return; }
    if (!window.qrcode) return c.error('The QR library failed to load. Check your connection and reload the page.');
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    var q; try { q = qrcode(0, v.ecl); q.addData(data); q.make(); } catch (e) { stage.innerHTML = ''; pn.disabled = sv.disabled = true; return c.error('That content is too long for a QR code at this error-correction level. Shorten it or choose "Low".'); }
    var n = q.getModuleCount(), size = parseInt(v.size, 10), quiet = 4, total = n + quiet * 2, cell = Math.max(1, Math.floor(size / total)), px = cell * total;
    canvas = document.createElement('canvas'); canvas.width = canvas.height = px; canvas.setAttribute('aria-label', 'QR code');
    var g = canvas.getContext('2d'); g.fillStyle = v.bg; g.fillRect(0, 0, px, px); g.fillStyle = v.fg;
    var rects = '';
    for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) if (q.isDark(r, cc)) { g.fillRect((cc + quiet) * cell, (r + quiet) * cell, cell, cell); rects += '<rect x="' + (cc + quiet) + '" y="' + (r + quiet) + '" width="1" height="1"/>'; }
    svgStr = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" width="' + size + '" height="' + size + '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="' + v.bg + '"/><g fill="' + v.fg + '">' + rects + '</g></svg>';
    stage.innerHTML = ''; stage.appendChild(canvas); pn.disabled = sv.disabled = false;
    var contrast = (Math.max(lum(v.fg), lum(v.bg)) + 0.05) / (Math.min(lum(v.fg), lum(v.bg)) + 0.05);
    info.textContent = n + '×' + n + ' modules · ' + px + '×' + px + ' px' + (contrast < 4 ? ' · ⚠ Low contrast — dark foreground on a light background scans best.' : '') + (lum(v.fg) > lum(v.bg) ? ' · ⚠ Inverted colours may not scan on every reader.' : '');
  }
  root.querySelector('#qr-png').addEventListener('click', function () { if (canvas) canvas.toBlob(function (b) { U.download('qr-code.png', b); }, 'image/png'); });
  root.querySelector('#qr-svg').addEventListener('click', function () { if (svgStr) U.download('qr-code.svg', svgStr, 'image/svg+xml'); });
  U.tabs(root.querySelector('#qr-top'), TYPES, function (i) { idx = i; build(); });
  build();
};
