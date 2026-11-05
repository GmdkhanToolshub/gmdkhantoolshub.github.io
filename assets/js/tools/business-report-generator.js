NiaziTools['business-report-generator'] = function (root, U) {
  var text = '', data = null;
  var TYPES = ['Weekly sales report', 'Monthly performance report', 'Project status report', 'Executive summary', 'General business report'];
  var ctx = U.mount(root, {
    fields: [
      { id: 'title', label: 'Report title', value: '', placeholder: 'e.g. Monthly Sales Performance — October', wide: true },
      { id: 'type', label: 'Report type', type: 'select', options: TYPES, value: TYPES[1] },
      { id: 'period', label: 'Reporting period', value: '', placeholder: 'e.g. 1–31 October 2026' },
      { id: 'by', label: 'Prepared by', value: '' },
      { id: 'to', label: 'Prepared for', value: '' },
      { id: 'obj', label: 'Purpose / objective', type: 'textarea', rows: 2, wide: true, value: '' },
      { id: 'high', label: 'Key highlights (one per line)', type: 'textarea', rows: 4, wide: true, value: '' },
      { id: 'metrics', label: 'Key metrics (one per line as "Name: value")', type: 'textarea', rows: 4, wide: true, value: '', placeholder: 'Sales achievement: 94%\nNew outlets: 120' },
      { id: 'issues', label: 'Challenges / risks (one per line)', type: 'textarea', rows: 3, wide: true, value: '' },
      { id: 'next', label: 'Next steps / actions (one per line)', type: 'textarea', rows: 3, wide: true, value: '' },
      { id: 'rec', label: 'Recommendations (one per line)', type: 'textarea', rows: 3, wide: true, value: '' }
    ],
    actions: [{ id: 'gen', label: 'Generate report', onClick: function (v, c) { gen(v, c); } }],
    onInput: function (v, c) { if (!text) c.empty('Complete the fields you need — blank sections are left out — then press "Generate report".'); }
  });
  function gen(v, c) {
    if (!v.title.trim()) return c.error('Please enter a report title.');
    var hi = U.lines(v.high).map(U.stripBullet), mt = U.lines(v.metrics).map(function (l) { var i = l.indexOf(':'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : [l, '']; }),
      is = U.lines(v.issues).map(U.stripBullet), nx = U.lines(v.next).map(U.stripBullet), rc = U.lines(v.rec).map(U.stripBullet);
    if (!v.obj.trim() && !hi.length && !mt.length && !is.length && !nx.length && !rc.length) return c.error('Add at least one section of content (objective, highlights, metrics, challenges, next steps or recommendations).');
    data = { v: v, hi: hi, mt: mt, is: is, nx: nx, rc: rc };
    var o = [v.title.trim().toUpperCase(), v.type];
    if (v.period.trim()) o.push('Period: ' + v.period.trim());
    if (v.by.trim()) o.push('Prepared by: ' + v.by.trim());
    if (v.to.trim()) o.push('Prepared for: ' + v.to.trim());
    o.push('Date: ' + U.longDate(), '');
    var n = 1;
    function sec(name, body) { o.push(n++ + '. ' + name.toUpperCase()); o.push.apply(o, body); o.push(''); }
    if (v.obj.trim()) sec('Purpose', [v.obj.trim()]);
    if (hi.length) sec('Key highlights', hi.map(function (x) { return '- ' + x; }));
    if (mt.length) sec('Key metrics', mt.map(function (m) { return '- ' + m[0] + (m[1] ? ': ' + m[1] : ''); }));
    if (is.length) sec('Challenges and risks', is.map(function (x) { return '- ' + x; }));
    if (nx.length) sec('Next steps', nx.map(function (x, i) { return (i + 1) + '. ' + x; }));
    if (rc.length) sec('Recommendations', rc.map(function (x) { return '- ' + x; }));
    text = o.join('\n').replace(/\n+$/, '');
    c.html('<label for="out-text">Your report (edit it freely)</label><textarea id="out-text" class="output-text" rows="20">' + U.esc(text) + '</textarea>' + U.outputButtons(true) +
      '<p class="result-note">The PDF is generated from the structured fields so metrics appear in a table. If you edit the text above, the .txt and Copy buttons use your edits.</p>');
  }
  U.textActions(ctx, function () { return text; }, 'business-report', function () {
    var d = data, doc = new NiaziPDF({ title: d.v.title });
    doc.text(d.v.title.trim(), { size: 20, bold: true, after: 2 }); doc.text(d.v.type, { size: 11, bold: true, color: [47, 107, 255] });
    var meta = [d.v.period && 'Period: ' + d.v.period, d.v.by && 'Prepared by: ' + d.v.by, d.v.to && 'Prepared for: ' + d.v.to, 'Date: ' + U.longDate()].filter(Boolean).join('   |   ');
    doc.text(meta, { size: 9, color: [90, 90, 90] }); doc.rule([47, 107, 255], 1.5);
    if (d.v.obj.trim()) { doc.heading('Purpose'); doc.text(d.v.obj.trim()); }
    if (d.hi.length) { doc.heading('Key highlights'); doc.bullets(d.hi); }
    if (d.mt.length) { doc.heading('Key metrics'); doc.table(['Metric', 'Value'], d.mt, [3, 2]); }
    if (d.is.length) { doc.heading('Challenges and risks'); doc.bullets(d.is); }
    if (d.nx.length) { doc.heading('Next steps'); doc.bullets(d.nx); }
    if (d.rc.length) { doc.heading('Recommendations'); doc.bullets(d.rc); }
    return doc.toBlob();
  });
};
