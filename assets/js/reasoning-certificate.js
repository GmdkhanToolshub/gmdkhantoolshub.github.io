/* GM Reasoning Test certificate: shows and verifies a certificate by its public ID. The server decides whether an ID is valid; this page only displays what the server returns. */
(function () {
  'use strict';
  var P = window.GMPay, root = P && P.$('rc-app'); if (!root) return;
  if (!P.live) { P.notLive(root); return; }
  var el = P.el, id = (new URLSearchParams(location.search).get('id') || '').toUpperCase();
  function form(msg) {
    root.textContent = ''; var c = el('form', 'rt-card'); c.noValidate = true; c.appendChild(el('h2', '', 'Verify a certificate'));
    c.appendChild(el('p', '', 'Enter the certificate ID (it looks like GMC-XXXXXXXXXX).')); var l = el('label', '', 'Certificate ID'), i = el('input'); i.maxLength = 14; i.autocomplete = 'off'; l.appendChild(i); c.appendChild(l);
    var m = el('p', 'rt-err', msg || ''); m.setAttribute('role', 'alert'); var b = el('button', 'btn btn-primary', 'Verify'); b.type = 'submit'; c.appendChild(m); c.appendChild(b); root.appendChild(c);
    c.addEventListener('submit', function (e) { e.preventDefault(); var v = i.value.trim().toUpperCase(); if (!/^GMC-[0-9A-Z]{10}$/.test(v)) { m.textContent = 'That ID does not look right.'; return; } location.href = '?id=' + encodeURIComponent(v); });
  }
  function draw(c, cv) {
    var x = cv.getContext('2d'), W = cv.width, H = cv.height; x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); x.strokeStyle = '#0b1b34'; x.lineWidth = 14; x.strokeRect(24, 24, W - 48, H - 48); x.strokeStyle = '#0e7490'; x.lineWidth = 4; x.strokeRect(46, 46, W - 92, H - 92);
    x.textAlign = 'center'; x.fillStyle = '#0b1b34'; x.font = 'bold 30px Georgia, serif'; x.fillText('GM TOOLS HUB', W / 2, 130); x.font = 'bold 64px Georgia, serif'; x.fillText('Certificate of Completion', W / 2, 220);
    x.fillStyle = '#475569'; x.font = '26px Georgia, serif'; x.fillText('GM Reasoning Test: 30 pattern puzzles', W / 2, 270); x.fillText('awarded to', W / 2, 340);
    x.fillStyle = '#0b1b34'; var n = c.name, fs = 68; x.font = 'bold ' + fs + 'px Georgia, serif'; while (x.measureText(n).width > W - 220 && fs > 30) { fs -= 4; x.font = 'bold ' + fs + 'px Georgia, serif'; } x.fillText(n, W / 2, 425);
    x.fillStyle = '#0e7490'; x.font = 'bold 110px Georgia, serif'; x.fillText(c.pct + '/100', W / 2, 560); x.fillStyle = '#334155'; x.font = '28px Georgia, serif'; x.fillText('Reasoning score  ·  Level: ' + c.level + '  ·  ' + c.raw + ' of ' + c.total + ' puzzles correct', W / 2, 615);
    x.font = '24px Georgia, serif'; x.fillText('Issued ' + P.date(c.issued_at) + '  ·  Certificate ID ' + c.id, W / 2, 700); x.font = '20px Georgia, serif'; x.fillStyle = '#64748b'; x.fillText('Verify at gmtoolshub.com/reasoning-test/certificate/?id=' + c.id, W / 2, 745); x.fillText('A reasoning quiz result. Not a clinical IQ assessment and not an IQ score.', W / 2, 785);
    if (!c.valid) { x.save(); x.translate(W / 2, H / 2); x.rotate(-0.4); x.fillStyle = 'rgba(185,28,28,.35)'; x.font = 'bold 190px Arial'; x.fillText('REVOKED', 0, 60); x.restore(); }
  }
  function show(c) {
    root.textContent = ''; var box = el('div', 'rt-card'); box.appendChild(el('h2', c.valid ? 'ck-ok' : 'ck-err', c.valid ? 'Valid certificate' : 'This certificate has been revoked'));
    var cv = el('canvas', 'rc-canvas'); cv.width = 1400; cv.height = 880; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Certificate of Completion for ' + c.name + ', reasoning score ' + c.pct + ' out of 100, level ' + c.level + ', certificate ID ' + c.id); draw(c, cv); box.appendChild(cv);
    var dl = el('dl', 'ck-rows rc-rows'); [['Name', c.name], ['Reasoning score', c.pct + '/100'], ['Level', c.level], ['Puzzles correct', c.raw + ' of ' + c.total], ['Issued', P.date(c.issued_at)], ['Certificate ID', c.id], ['Status', c.valid ? 'Valid' : 'Revoked']].forEach(function (r) { dl.appendChild(el('dt', '', r[0])); dl.appendChild(el('dd', '', r[1])); }); box.appendChild(dl);
    box.appendChild(el('p', 'small muted', c.notice)); var row = el('div', 'rt-row');
    var d = el('button', 'btn btn-primary', 'Download as image'); d.type = 'button'; d.addEventListener('click', function () { cv.toBlob(function (b) { var a = el('a'); a.href = URL.createObjectURL(b); a.download = 'gm-reasoning-certificate-' + c.id + '.png'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }, 'image/png'); }); row.appendChild(d);
    var p = el('button', 'btn btn-ghost', 'Print or save as PDF'); p.type = 'button'; p.addEventListener('click', function () { window.print(); }); row.appendChild(p); var v = el('a', 'btn btn-ghost', 'Verify another'); v.href = './'; row.appendChild(v); box.appendChild(row); root.appendChild(box);
  }
  if (!id) { form(); return; }
  if (!/^GMC-[0-9A-Z]{10}$/.test(id)) { form('That ID does not look right.'); return; }
  P.api('/api/certificates/' + id).then(show, function (e) { form(e.status === 404 ? 'No certificate was found with that ID.' : e.message); });
})();
