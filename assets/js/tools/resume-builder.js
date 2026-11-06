NiaziTools['resume-builder'] = function (root, U) {
  var KEY = 'niazi.resume.v1';
  var blank = { name: '', title: '', email: '', phone: '', location: '', links: '', summary: '', skills: '', template: 'modern', accent: '#2f6bff', exp: [{ role: '', company: '', dates: '', bullets: '' }], edu: [{ degree: '', school: '', dates: '' }], extra: '' };
  var sample = { name: 'Alex Morgan', title: 'Operations Manager', email: 'alex.morgan@example.com', phone: '+1 555 010 2030', location: 'Chicago, IL', links: 'linkedin.com/in/alex-morgan-example', summary: 'Operations professional with experience coordinating teams, tracking performance metrics and improving day-to-day processes.', skills: 'Operations Planning, Reporting, Stakeholder Management, Excel, Process Improvement', template: 'modern', accent: '#2f6bff',
    exp: [{ role: 'Operations Manager', company: 'Example Co.', dates: '2021 – Present', bullets: 'Coordinate weekly planning across three teams\nPrepare monthly performance reports for leadership' }], edu: [{ degree: 'B.Sc. Business Administration', school: 'Example University', dates: '2017' }], extra: '' };
  var d = U.store.get(KEY, null) || JSON.parse(JSON.stringify(blank));
  var TPL = [{ v: 'modern', l: 'Modern (accent headings)' }, { v: 'classic', l: 'Classic (black & white)' }, { v: 'compact', l: 'Compact (more content per page)' }];
  root.innerHTML = '<div class="two-col-tool"><div id="rb-form"></div><div><div class="tool-actions" style="margin-top:0"><button type="button" class="btn btn-primary" id="rb-pdf">Download PDF</button><button type="button" class="btn btn-ghost" id="rb-txt">Download .txt</button><button type="button" class="btn btn-ghost" id="rb-sample">Load example</button><button type="button" class="btn btn-ghost" id="rb-clear">Clear all</button></div><div class="form-error" id="tool-error" role="alert"></div><p class="small muted" style="margin:6px 0 12px">Live preview · saved only in your browser</p><div id="rb-preview" class="resume-preview" aria-live="polite"></div></div></div>';
  var f = root.querySelector('#rb-form'), pv = root.querySelector('#rb-preview'), err = root.querySelector('#tool-error');
  function inp(k, label, o) { o = o || {}; var v = U.esc(d[k]); return '<div class="field' + (o.wide === false ? '' : ' wide') + '"><label for="rb-' + k + '">' + label + '</label>' + (o.area ? '<textarea id="rb-' + k + '" data-k="' + k + '" rows="' + o.area + '">' + v + '</textarea>' : '<input id="rb-' + k + '" data-k="' + k + '" value="' + v + '"' + (o.type ? ' type="' + o.type + '"' : '') + ' maxlength="200">') + (o.hint ? '<small class="hint">' + o.hint + '</small>' : '') + '</div>'; }
  function draw() {
    f.innerHTML = '<div class="form-grid">' + '<div class="field"><label for="rb-template">Template</label><select id="rb-template" data-k="template">' + TPL.map(function (t) { return '<option value="' + t.v + '"' + (d.template === t.v ? ' selected' : '') + '>' + t.l + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="rb-accent">Accent colour</label><input id="rb-accent" type="color" data-k="accent" value="' + U.esc(d.accent) + '"></div>' +
      inp('name', 'Full name', { wide: false }) + inp('title', 'Professional title', { wide: false }) + inp('email', 'Email', { wide: false, type: 'email' }) + inp('phone', 'Phone', { wide: false }) + inp('location', 'Location', { wide: false }) + inp('links', 'Links (LinkedIn, portfolio)', { wide: false }) +
      inp('summary', 'Professional summary', { area: 4, hint: '2–4 sentences about your experience and strengths.' }) + '</div>' +
      '<h3 style="font-size:1.05rem;margin:8px 0 10px">Experience</h3>' + d.exp.map(function (x, i) {
        return '<div class="repeat-row"><div class="form-grid"><div class="field"><label>Job title</label><input aria-label="Job title (entry ' + (i + 1) + ')" data-g="exp" data-i="' + i + '" data-k="role" value="' + U.esc(x.role) + '" maxlength="120"></div><div class="field"><label>Company</label><input aria-label="Company (entry ' + (i + 1) + ')" data-g="exp" data-i="' + i + '" data-k="company" value="' + U.esc(x.company) + '" maxlength="120"></div><div class="field wide"><label>Dates</label><input aria-label="Dates (entry ' + (i + 1) + ')" data-g="exp" data-i="' + i + '" data-k="dates" value="' + U.esc(x.dates) + '" placeholder="e.g. Jan 2021 – Present" maxlength="60"></div><div class="field wide"><label>Achievements / responsibilities (one per line)</label><textarea aria-label="Achievements / responsibilities (one per line) (entry ' + (i + 1) + ')" data-g="exp" data-i="' + i + '" data-k="bullets" rows="4">' + U.esc(x.bullets) + '</textarea></div></div>' + (d.exp.length > 1 ? '<button type="button" class="btn btn-ghost btn-sm remove" data-del="exp" data-i="' + i + '">Remove</button>' : '') + '</div>';
      }).join('') + '<button type="button" class="btn btn-ghost btn-sm" data-add="exp">+ Add experience</button>' +
      '<h3 style="font-size:1.05rem;margin:22px 0 10px">Education</h3>' + d.edu.map(function (x, i) {
        return '<div class="repeat-row"><div class="form-grid"><div class="field wide"><label>Degree / qualification</label><input aria-label="Degree / qualification (entry ' + (i + 1) + ')" data-g="edu" data-i="' + i + '" data-k="degree" value="' + U.esc(x.degree) + '" maxlength="140"></div><div class="field"><label>Institution</label><input aria-label="Institution (entry ' + (i + 1) + ')" data-g="edu" data-i="' + i + '" data-k="school" value="' + U.esc(x.school) + '" maxlength="140"></div><div class="field"><label>Year / dates</label><input aria-label="Year / dates (entry ' + (i + 1) + ')" data-g="edu" data-i="' + i + '" data-k="dates" value="' + U.esc(x.dates) + '" maxlength="60"></div></div>' + (d.edu.length > 1 ? '<button type="button" class="btn btn-ghost btn-sm remove" data-del="edu" data-i="' + i + '">Remove</button>' : '') + '</div>';
      }).join('') + '<button type="button" class="btn btn-ghost btn-sm" data-add="edu">+ Add education</button>' +
      '<div class="form-grid" style="margin-top:22px">' + inp('skills', 'Skills (comma separated)', { area: 3 }) + inp('extra', 'Certifications / additional sections (one per line)', { area: 3 }) + '</div>';
  }
  function preview() {
    var cls = 'resume-preview' + (d.template === 'compact' ? ' compact' : ''), acc = d.template === 'classic' ? '#111111' : d.accent;
    pv.className = cls; pv.style.setProperty('--rp-accent', acc);
    var contact = [d.email, d.phone, d.location, d.links].filter(function (x) { return x.trim(); }).map(U.esc).join(' · ');
    var h = '<h2>' + (U.esc(d.name) || '<span style="color:#999">Your Name</span>') + '</h2>' + (d.title ? '<p class="rp-sub" style="font-weight:600">' + U.esc(d.title) + '</p>' : '') + (contact ? '<p class="rp-sub">' + contact + '</p>' : '');
    if (d.summary.trim()) h += '<h3>Summary</h3><p style="margin:0">' + U.esc(d.summary) + '</p>';
    var ex = d.exp.filter(function (x) { return x.role.trim() || x.company.trim() || x.bullets.trim(); });
    if (ex.length) h += '<h3>Experience</h3>' + ex.map(function (x) { return '<div class="rp-row"><span>' + U.esc(x.role) + (x.company ? ', ' + U.esc(x.company) : '') + '</span><span>' + U.esc(x.dates) + '</span></div><ul>' + U.lines(x.bullets).map(function (b) { return '<li>' + U.esc(U.stripBullet(b)) + '</li>'; }).join('') + '</ul>'; }).join('');
    var ed = d.edu.filter(function (x) { return x.degree.trim() || x.school.trim(); });
    if (ed.length) h += '<h3>Education</h3>' + ed.map(function (x) { return '<div class="rp-row"><span>' + U.esc(x.degree) + '</span><span>' + U.esc(x.dates) + '</span></div><p class="rp-sub" style="margin-bottom:8px">' + U.esc(x.school) + '</p>'; }).join('');
    if (d.skills.trim()) h += '<h3>Skills</h3><p style="margin:0">' + U.list(d.skills).map(U.esc).join(' · ') + '</p>';
    if (d.extra.trim()) h += '<h3>Additional</h3><ul>' + U.lines(d.extra).map(function (x) { return '<li>' + U.esc(U.stripBullet(x)) + '</li>'; }).join('') + '</ul>';
    pv.innerHTML = h;
  }
  function save() { U.store.set(KEY, d); preview(); }
  function plain() {
    var o = [d.name, d.title, [d.email, d.phone, d.location, d.links].filter(Boolean).join(' | '), ''];
    if (d.summary.trim()) o.push('SUMMARY', d.summary.trim(), '');
    var ex = d.exp.filter(function (x) { return x.role.trim() || x.company.trim(); });
    if (ex.length) { o.push('EXPERIENCE'); ex.forEach(function (x) { o.push(x.role + (x.company ? ', ' + x.company : '') + (x.dates ? ' (' + x.dates + ')' : '')); U.lines(x.bullets).forEach(function (b) { o.push('- ' + U.stripBullet(b)); }); o.push(''); }); }
    var ed = d.edu.filter(function (x) { return x.degree.trim() || x.school.trim(); });
    if (ed.length) { o.push('EDUCATION'); ed.forEach(function (x) { o.push(x.degree + (x.school ? ', ' + x.school : '') + (x.dates ? ' (' + x.dates + ')' : '')); }); o.push(''); }
    if (d.skills.trim()) o.push('SKILLS', U.list(d.skills).join(', '), '');
    if (d.extra.trim()) o.push('ADDITIONAL', U.lines(d.extra).map(U.stripBullet).join('\n'));
    return o.join('\n');
  }
  function pdf() {
    if (!d.name.trim()) { err.textContent = 'Add your name before downloading the PDF.'; return; }
    err.textContent = '';
    var compact = d.template === 'compact', acc = d.template === 'classic' ? [17, 17, 17] : NiaziPDF.hex2rgb(d.accent);
    var doc = new NiaziPDF({ title: d.name + ' - Resume', margin: compact ? 42 : 54, size: compact ? 9.5 : 10.5 });
    doc.text(d.name, { size: compact ? 20 : 24, bold: true });
    if (d.title) doc.text(d.title, { size: 12, bold: true, color: acc });
    var c = [d.email, d.phone, d.location, d.links].filter(function (x) { return x.trim(); }).join('  |  ');
    if (c) doc.text(c, { size: 9.5, color: [90, 90, 90] });
    if (d.summary.trim()) { doc.heading('Summary', { color: acc }); doc.text(d.summary.trim()); }
    var ex = d.exp.filter(function (x) { return x.role.trim() || x.company.trim() || x.bullets.trim(); });
    if (ex.length) { doc.heading('Experience', { color: acc }); ex.forEach(function (x) { doc.pair(x.role + (x.company ? ', ' + x.company : ''), x.dates); doc.bullets(U.lines(x.bullets).map(U.stripBullet)); doc.space(5); }); }
    var ed = d.edu.filter(function (x) { return x.degree.trim() || x.school.trim(); });
    if (ed.length) { doc.heading('Education', { color: acc }); ed.forEach(function (x) { doc.pair(x.degree, x.dates); if (x.school) doc.text(x.school, { color: [90, 90, 90] }); doc.space(3); }); }
    if (d.skills.trim()) { doc.heading('Skills', { color: acc }); doc.text(U.list(d.skills).join('  •  ')); }
    if (d.extra.trim()) { doc.heading('Additional', { color: acc }); doc.bullets(U.lines(d.extra).map(U.stripBullet)); }
    U.download(U.slug(d.name) + '-resume.pdf', doc.toBlob());
  }
  function onField(e) {
    var t = e.target, k = t.getAttribute('data-k'); if (!k) return;
    var g = t.getAttribute('data-g');
    if (g) d[g][+t.getAttribute('data-i')][k] = t.value; else d[k] = t.value;
    save();
  }
  f.addEventListener('input', onField); f.addEventListener('change', onField);
  f.addEventListener('click', function (e) {
    var a = e.target.closest('[data-add]'), r = e.target.closest('[data-del]');
    if (a) { var g = a.getAttribute('data-add'); if (d[g].length >= 8) { err.textContent = 'You can add up to 8 entries.'; return; } d[g].push(g === 'exp' ? { role: '', company: '', dates: '', bullets: '' } : { degree: '', school: '', dates: '' }); draw(); save(); }
    if (r) { d[r.getAttribute('data-del')].splice(+r.getAttribute('data-i'), 1); draw(); save(); }
  });
  root.querySelector('#rb-pdf').addEventListener('click', pdf);
  root.querySelector('#rb-txt').addEventListener('click', function () { if (!d.name.trim()) { err.textContent = 'Add your name first.'; return; } err.textContent = ''; U.download(U.slug(d.name) + '-resume.txt', plain()); });
  root.querySelector('#rb-sample').addEventListener('click', function () { d = JSON.parse(JSON.stringify(sample)); draw(); save(); U.toast('Example loaded — replace it with your details'); });
  root.querySelector('#rb-clear').addEventListener('click', function () { if (confirm('Clear all resume fields?')) { d = JSON.parse(JSON.stringify(blank)); U.store.del(KEY); draw(); preview(); } });
  draw(); preview();
};
