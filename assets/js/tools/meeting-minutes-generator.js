NiaziTools['meeting-minutes-generator'] = function (root, U) {
  var text = '', data = null;
  var ctx = U.mount(root, {
    fields: [
      { id: 'title', label: 'Meeting title', value: '', placeholder: 'e.g. Weekly Sales Review', wide: true },
      { id: 'date', label: 'Date', type: 'date', value: U.today() },
      { id: 'time', label: 'Time', value: '', placeholder: 'e.g. 10:00 – 11:00' },
      { id: 'loc', label: 'Location / link', value: '' },
      { id: 'chair', label: 'Chair / facilitator', value: '' },
      { id: 'minute', label: 'Minutes taken by', value: '' },
      { id: 'att', label: 'Attendees (comma or one per line)', type: 'textarea', rows: 2, wide: true, value: '' },
      { id: 'abs', label: 'Apologies / absent (optional)', value: '', wide: true },
      { id: 'agenda', label: 'Agenda items (one per line, optional)', type: 'textarea', rows: 3, wide: true, value: '' },
      { id: 'notes', label: 'Raw meeting notes', type: 'textarea', rows: 9, wide: true, value: '', hint: 'One point per line. Start a line with <b>Decision:</b>, <b>Action:</b>, <b>Risk:</b> or <b>Next meeting:</b> to place it. For actions use <b>@Owner</b> and <b>by &lt;date&gt;</b>, e.g. "Action: Share route plan @Ali by Friday". Other lines become discussion points.' }
    ],
    actions: [{ id: 'gen', label: 'Generate minutes', onClick: function (v, c) { gen(v, c); } }],
    onInput: function (v, c) { if (!text) c.empty('Paste your notes and press "Generate minutes" to get a structured Minutes of Meeting with a tracked action list.'); }
  });
  function gen(v, c) {
    if (!v.title.trim()) return c.error('Please enter a meeting title.');
    if (!v.notes.trim()) return c.error('Please add some meeting notes to convert.');
    var disc = [], dec = [], act = [], risk = [], nextM = [];
    U.lines(v.notes).forEach(function (l) {
      var m = l.match(/^(decision|decided|agreed|action|action item|ai|todo|risk|issue|next meeting|next)\s*[:\-–]\s*(.+)$/i);
      if (!m) { disc.push(U.stripBullet(l)); return; }
      var k = m[1].toLowerCase(), body = m[2].trim();
      if (/^decision|decided|agreed/.test(k)) dec.push(body);
      else if (/^risk|issue/.test(k)) risk.push(body);
      else if (/^next/.test(k)) nextM.push(body);
      else {
        var owner = '', due = '', t = body, om = t.match(/@([A-Za-z][\w.\- ]*?)(?=\s+(?:by|due|before|on)\b|[,;.]|$)/);
        if (om) { owner = om[1].trim(); t = t.replace(om[0], ''); }
        var dm = t.match(/\b(?:by|due|before)\s+([A-Za-z0-9 ,\/\-]+?)\s*[.;]?$/i);
        if (dm) { due = dm[1].trim(); t = t.replace(dm[0], ''); }
        act.push({ t: t.replace(/\s{2,}/g, ' ').replace(/[\s,;-]+$/, '').trim(), o: owner || 'TBC', d: due || 'TBC' });
      }
    });
    var att = U.list(v.att), ag = U.lines(v.agenda).map(U.stripBullet);
    data = { v: v, att: att, ag: ag, disc: disc, dec: dec, act: act, risk: risk, nextM: nextM };
    var o = ['MINUTES OF MEETING', v.title.trim(), '', 'Date: ' + U.longDate(v.date) + (v.time.trim() ? '   Time: ' + v.time.trim() : '')];
    if (v.loc.trim()) o.push('Location: ' + v.loc.trim());
    if (v.chair.trim()) o.push('Chair: ' + v.chair.trim());
    if (v.minute.trim()) o.push('Minutes by: ' + v.minute.trim());
    o.push('');
    if (att.length) o.push('ATTENDEES', att.join(', '), '');
    if (v.abs.trim()) o.push('APOLOGIES', v.abs.trim(), '');
    if (ag.length) { o.push('AGENDA'); ag.forEach(function (a, i) { o.push((i + 1) + '. ' + a); }); o.push(''); }
    if (disc.length) { o.push('DISCUSSION'); disc.forEach(function (d) { o.push('- ' + d); }); o.push(''); }
    if (dec.length) { o.push('DECISIONS'); dec.forEach(function (d, i) { o.push('D' + (i + 1) + '. ' + d); }); o.push(''); }
    if (act.length) { o.push('ACTION ITEMS'); act.forEach(function (a, i) { o.push('A' + (i + 1) + '. ' + a.t + '  [Owner: ' + a.o + ' | Due: ' + a.d + ']'); }); o.push(''); }
    if (risk.length) { o.push('RISKS / ISSUES'); risk.forEach(function (d) { o.push('- ' + d); }); o.push(''); }
    if (nextM.length) o.push('NEXT MEETING', nextM.join('; '), '');
    text = o.join('\n').replace(/\n+$/, '');
    var warn = act.some(function (a) { return a.o === 'TBC' || a.d === 'TBC'; }) ? '<p class="result-note warn">Some actions have no owner or due date (marked TBC). Add "@Name" and "by date" so every action is accountable.</p>' : '';
    c.html('<label for="out-text">Your minutes (edit freely)</label><textarea id="out-text" class="output-text" rows="20">' + U.esc(text) + '</textarea>' + U.outputButtons(true) + warn +
      '<p class="result-note">Found: ' + disc.length + ' discussion point(s), ' + dec.length + ' decision(s), ' + act.length + ' action(s), ' + risk.length + ' risk(s).</p>');
  }
  U.textActions(ctx, function () { return text; }, 'minutes-of-meeting', function () {
    var d = data, doc = new NiaziPDF({ title: 'Minutes of Meeting - ' + d.v.title });
    doc.text('MINUTES OF MEETING', { size: 9, bold: true, color: [47, 107, 255] }); doc.text(d.v.title.trim(), { size: 19, bold: true, after: 4 });
    var rows = [['Date', U.longDate(d.v.date) + (d.v.time.trim() ? ', ' + d.v.time.trim() : '')]];
    if (d.v.loc.trim()) rows.push(['Location', d.v.loc.trim()]); if (d.v.chair.trim()) rows.push(['Chair', d.v.chair.trim()]); if (d.v.minute.trim()) rows.push(['Minutes by', d.v.minute.trim()]);
    doc.table(null, rows, [1, 4]);
    if (d.att.length) { doc.heading('Attendees'); doc.text(d.att.join(', ')); }
    if (d.v.abs.trim()) { doc.heading('Apologies'); doc.text(d.v.abs.trim()); }
    if (d.ag.length) { doc.heading('Agenda'); doc.bullets(d.ag); }
    if (d.disc.length) { doc.heading('Discussion'); doc.bullets(d.disc); }
    if (d.dec.length) { doc.heading('Decisions'); doc.table(['#', 'Decision'], d.dec.map(function (x, i) { return ['D' + (i + 1), x]; }), [1, 9]); }
    if (d.act.length) { doc.heading('Action items'); doc.table(['#', 'Action', 'Owner', 'Due'], d.act.map(function (a, i) { return ['A' + (i + 1), a.t, a.o, a.d]; }), [0.8, 6, 2, 2]); }
    if (d.risk.length) { doc.heading('Risks / issues'); doc.bullets(d.risk); }
    if (d.nextM.length) { doc.heading('Next meeting'); doc.text(d.nextM.join('; ')); }
    return doc.toBlob();
  });
};
