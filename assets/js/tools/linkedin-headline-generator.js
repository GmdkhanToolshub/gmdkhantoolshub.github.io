NiaziTools['linkedin-headline-generator'] = function (root, U) {
  var ctx = U.mount(root, {
    fields: [
      { id: 'role', label: 'Current role / title', value: '', placeholder: 'e.g. Sales Operations Manager' },
      { id: 'field', label: 'Industry or specialty', value: '', placeholder: 'e.g. FMCG' },
      { id: 'skills', label: 'Top 2–3 skills (comma separated)', value: '', placeholder: 'e.g. Forecasting, KPI Reporting, Process Improvement', wide: true },
      { id: 'value', label: 'What you deliver (optional)', value: '', placeholder: 'e.g. accurate reporting that speeds up decisions', wide: true, hint: 'Only claim what you can back up.' },
      { id: 'audience', label: 'Who you help (optional)', value: '', placeholder: 'e.g. sales leaders' },
      { id: 'open', label: 'Open to… (optional)', value: '', placeholder: 'e.g. new opportunities' }
    ],
    actions: [{ id: 'gen', label: 'Generate headlines', onClick: function (v, c) { gen(v, c); } }],
    onInput: function (v, c) { if (!c.out.innerHTML) c.empty('Enter your role and a few skills, then press "Generate headlines".'); }
  });
  function gen(v, c) {
    var role = v.role.trim(), sk = U.list(v.skills).slice(0, 4), fld = v.field.trim(), val = v.value.trim(), aud = v.audience.trim(), open = v.open.trim();
    if (!role) return c.error('Please enter your current role or title.');
    if (!sk.length && !fld && !val) return c.error('Add at least one skill, your industry, or what you deliver.');
    var out = [], push = function (s) { s = s.replace(/\s+/g, ' ').replace(/\s\|\s*$/, '').trim(); if (s && out.indexOf(s) < 0) out.push(s); };
    var skills2 = sk.slice(0, 3).join(' | ');
    push(role + (fld ? ' | ' + fld : '') + (skills2 ? ' | ' + skills2 : ''));
    if (sk.length) push(role + ' | ' + sk.slice(0, 2).join(' & ') + (fld ? ' | ' + fld : ''));
    if (val) push(role + (fld ? ' in ' + fld : '') + ' | ' + val.charAt(0).toUpperCase() + val.slice(1));
    if (val && aud) push('Helping ' + aud + ' with ' + val + ' | ' + role + (fld ? ' | ' + fld : ''));
    else if (aud) push(role + ' helping ' + aud + (sk.length ? ' with ' + U.joinAnd(sk.slice(0, 2)) : ''));
    if (sk.length) push(sk.slice(0, 3).join(' • ') + ' | ' + role + (fld ? ' | ' + fld : ''));
    if (open) push(role + (fld ? ' | ' + fld : '') + ' | Open to ' + open);
    push(role + (sk.length ? ' | ' + U.joinAnd(sk.slice(0, 3)) + ' specialist' : '') + (fld ? ' | ' + fld : ''));
    if (fld) push(fld + ' ' + role + (sk.length ? ' | ' + sk[0] + ' & ' + (sk[1] || 'Reporting') : ''));
    var list = out.slice(0, 9);
    c.html(list.map(function (h, i) { var n = h.length; return '<div class="out-card"><p>' + U.esc(h) + '<small class="' + (n > 220 ? 'neg' : 'muted') + '">' + n + ' / 220 characters' + (n > 220 ? ' — too long, shorten it' : '') + (n <= 120 ? ' · fully visible in search results' : '') + '</small></p><button type="button" class="btn btn-ghost btn-sm" data-copy="' + i + '">Copy</button></div>'; }).join('') +
      '<p class="result-note">LinkedIn allows up to 220 characters. Put your most searchable keywords first, avoid buzzwords you cannot back up, and tweak the wording to sound like you.</p>');
    c.out.onclick = function (e) { var b = e.target.closest('[data-copy]'); if (b) U.copy(list[+b.getAttribute('data-copy')], 'Headline copied'); };
  }
};
