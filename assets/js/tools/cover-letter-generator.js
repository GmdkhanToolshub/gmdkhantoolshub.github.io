NiaziTools['cover-letter-generator'] = function (root, U) {
  var text = '';
  var ctx = U.mount(root, {
    fields: [
      { id: 'name', label: 'Your full name', value: '', placeholder: 'e.g. Alex Morgan' },
      { id: 'contact', label: 'Your email / phone (optional)', value: '' },
      { id: 'role', label: 'Job title you are applying for', value: '', placeholder: 'e.g. Sales Operations Manager' },
      { id: 'company', label: 'Company name', value: '' },
      { id: 'hm', label: 'Hiring manager name (optional)', value: '', placeholder: 'Leave blank for "Hiring Manager"' },
      { id: 'source', label: 'Where you found the role (optional)', value: '', placeholder: 'e.g. LinkedIn' },
      { id: 'years', label: 'Years of experience', value: '', placeholder: 'e.g. 5' },
      { id: 'field', label: 'Your field / current role', value: '', placeholder: 'e.g. sales operations' },
      { id: 'skills', label: 'Top skills (comma separated)', value: '', wide: true, placeholder: 'e.g. reporting, forecasting, stakeholder management' },
      { id: 'ach', label: 'A real achievement you can mention (optional)', type: 'textarea', value: '', rows: 3, wide: true, hint: 'Only include facts you can support in an interview.' },
      { id: 'why', label: 'Why this company? (optional)', type: 'textarea', value: '', rows: 3, wide: true },
      { id: 'tone', label: 'Tone', type: 'select', options: [{ value: 'professional', label: 'Professional' }, { value: 'enthusiastic', label: 'Enthusiastic' }, { value: 'concise', label: 'Concise' }], value: 'professional' }
    ],
    actions: [{ id: 'gen', label: 'Generate cover letter', onClick: function (v, c) { gen(v, c); } }],
    onInput: function (v, c) { if (!text) c.empty('Fill in the details and press "Generate cover letter".'); }
  });
  function gen(v, c) {
    if (!v.name.trim() || !v.role.trim() || !v.company.trim()) return c.error('Please enter your name, the job title and the company name.');
    var yrs = U.num(v.years), sk = U.list(v.skills).slice(0, 5), field = v.field.trim() || 'my field', hm = v.hm.trim() || 'Hiring Manager';
    var exp = U.isNum(yrs) && yrs > 0 ? 'With ' + U.fmt(yrs, 0) + ' year' + (yrs === 1 ? '' : 's') + ' of experience in ' + field + ', ' : 'Drawing on my background in ' + field + ', ';
    var src = v.source.trim() ? ' that I found via ' + v.source.trim() : '';
    var p = [];
    var open = { professional: 'I am writing to apply for the ' + v.role.trim() + ' position at ' + v.company.trim() + src + '. ' + exp + 'I am confident I can contribute to your team from day one.',
      enthusiastic: 'I was excited to see the ' + v.role.trim() + ' opening at ' + v.company.trim() + src + '. ' + exp + 'I would love the opportunity to bring my skills to your team.',
      concise: 'I am applying for the ' + v.role.trim() + ' role at ' + v.company.trim() + src + '. ' + exp + 'my background matches what you are looking for.' }[v.tone];
    p.push(open);
    if (sk.length) p.push('My core strengths include ' + U.joinAnd(sk) + '. I use these skills to deliver accurate work, communicate clearly with stakeholders and keep projects moving on schedule.');
    if (v.ach.trim()) p.push(v.tone === 'concise' ? 'Highlight: ' + v.ach.trim().replace(/\.*$/, '.') : 'One example of my work: ' + v.ach.trim().replace(/\.*$/, '.') + ' I would bring the same focus on results to ' + v.company.trim() + '.');
    if (v.why.trim() && v.tone !== 'concise') p.push('I am particularly interested in ' + v.company.trim() + ' because ' + v.why.trim().replace(/^because\s+/i, '').replace(/\.*$/, '.'));
    p.push(v.tone === 'concise' ? 'I would welcome a conversation about how I can help. Thank you for your time.' : 'Thank you for considering my application. I would welcome the opportunity to discuss how my experience can support ' + v.company.trim() + '. I look forward to hearing from you.');
    var sig = 'Sincerely,\n' + v.name.trim() + (v.contact.trim() ? '\n' + v.contact.trim() : '');
    text = U.longDate() + '\n\nDear ' + hm + ',\n\n' + p.join('\n\n') + '\n\n' + sig;
    c.html('<label for="out-text">Your cover letter (edit it freely)</label><textarea id="out-text" class="output-text" rows="16">' + U.esc(text) + '</textarea>' + U.outputButtons(true) +
      '<p class="result-note">Review and personalise before sending. Recruiters notice generic letters, so add specifics from your own experience.</p>');
  }
  U.textActions(ctx, function () { return text; }, 'cover-letter', function (t) {
    var doc = new NiaziPDF({ title: 'Cover Letter', size: 11, margin: 64 });
    t.split('\n').forEach(function (l) { if (l === '') doc.space(6); else doc.text(l, { size: 11 }); });
    return doc.toBlob();
  });
};
