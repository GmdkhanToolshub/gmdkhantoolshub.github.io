NiaziTools['ats-resume-checker'] = function (root, U) {
  var STOP = ('a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its just me more most my no nor not now of off on once only or other our ours out over own same she should so some such than that the their theirs them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours ' +
    'ability able etc experience including job looking must role strong team work working years year join candidate position responsibilities requirements required preferred plus within across using use new').split(' ');
  var VERBS = 'led managed built developed created improved increased reduced delivered implemented launched coordinated analysed analyzed designed achieved streamlined optimized optimised negotiated trained mentored planned executed monitored prepared reported forecasted supported owned automated established resolved drove generated administered'.split(' ');
  var ctx = U.mount(root, {
    fields: [
      { id: 'resume', label: 'Your resume (paste plain text)', type: 'textarea', rows: 12, wide: true, value: '', hint: 'Paste text rather than uploading a file — your resume never leaves your browser.' },
      { id: 'jd', label: 'Job description', type: 'textarea', rows: 10, wide: true, value: '' }
    ],
    actions: [{ id: 'go', label: 'Analyse match', onClick: function (v, c) { run(v, c); } }],
    onInput: function (v, c) { if (!c.out.innerHTML) c.empty('Paste your resume and a job description, then press "Analyse match".'); }
  });
  function stem(w) { return w.replace(/(ing|ed|es|s|ly)$/,'').replace(/(ation|ment)$/,''); }
  function tokens(t) { return (t.toLowerCase().match(/[a-z][a-z+#.\-\/]*[a-z+#]|[a-z]/g) || []).map(function (w) { return w.replace(/^[.\-\/]+|[.\-\/]+$/g, ''); }).filter(Boolean); }
  function run(v, c) {
    var r = v.resume.trim(), j = v.jd.trim();
    if (r.split(/\s+/).length < 30) return c.error('Please paste more of your resume (at least about 30 words).');
    if (j.split(/\s+/).length < 20) return c.error('Please paste more of the job description (at least about 20 words).');
    var jt = tokens(j).filter(function (w) { return w.length > 2 && STOP.indexOf(w) < 0 && !/^\d+$/.test(w); });
    var freq = {}, grams = {};
    jt.forEach(function (w) { freq[w] = (freq[w] || 0) + 1; });
    var all = tokens(j);
    for (var i = 0; i < all.length - 1; i++) { var a = all[i], b = all[i + 1]; if (STOP.indexOf(a) < 0 && STOP.indexOf(b) < 0 && a.length > 2 && b.length > 2) { var g = a + ' ' + b; grams[g] = (grams[g] || 0) + 1; } }
    var phr = Object.keys(grams).filter(function (g) { return grams[g] >= 2; }).sort(function (x, y) { return grams[y] - grams[x]; }).slice(0, 8);
    var kws = Object.keys(freq).sort(function (x, y) { return freq[y] - freq[x] || x.localeCompare(y); }).slice(0, 25);
    var rtxt = r.toLowerCase(), rset = {}; tokens(r).forEach(function (w) { rset[stem(w)] = 1; });
    function has(k) { return k.indexOf(' ') > 0 ? rtxt.indexOf(k) >= 0 : (rtxt.indexOf(k) >= 0 && (rset[stem(k)] || new RegExp('(^|[^a-z])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z]|$)').test(rtxt))); }
    var found = [], missing = [];
    kws.forEach(function (k) { (has(k) ? found : missing).push(k); });
    var pfound = [], pmiss = []; phr.forEach(function (k) { (has(k) ? pfound : pmiss).push(k); });
    var wKw = kws.reduce(function (s, k) { return s + freq[k]; }, 0), wFound = found.reduce(function (s, k) { return s + freq[k]; }, 0);
    var kwScore = wKw ? wFound / wKw : 0;
    var checks = [], pts = 0;
    function chk(ok, good, bad, w) { checks.push({ ok: ok, msg: ok ? good : bad }); if (ok) pts += w; }
    var words = r.split(/\s+/).length;
    chk(/[\w.+-]+@[\w-]+\.[\w.-]+/.test(r), 'Email address found.', 'No email address detected — add one near the top.', 3);
    chk(/(\+?\d[\d\s().-]{7,}\d)/.test(r), 'Phone number found.', 'No phone number detected.', 2);
    chk(/(experience|employment|work history)/i.test(r), 'Experience section found.', 'No clear "Experience" heading — use standard section names.', 4);
    chk(/(education|qualification)/i.test(r), 'Education section found.', 'No clear "Education" heading.', 2);
    chk(/(skills|competenc)/i.test(r), 'Skills section found.', 'No "Skills" heading — add one with relevant keywords.', 3);
    chk(words >= 250 && words <= 1000, 'Length looks reasonable (' + words + ' words).', words < 250 ? 'Resume looks short (' + words + ' words) — add detail on your achievements.' : 'Resume is long (' + words + ' words) — consider tightening to 1–2 pages.', 3);
    var nums = (r.match(/\d+(\.\d+)?\s?(%|k|m|million|billion)?/gi) || []).length;
    chk(nums >= 5, 'Includes measurable figures (' + nums + ' numbers found).', 'Few numbers found — quantify results (%, volumes, amounts, team size) where you truthfully can.', 3);
    var vcount = VERBS.filter(function (x) { return rtxt.indexOf(x) >= 0; }).length;
    chk(vcount >= 4, 'Uses strong action verbs (' + vcount + ' found).', 'Start bullets with action verbs such as "Led", "Delivered", "Improved".', 2);
    chk(!/[│┃▌█■▪]|\t{2,}/.test(r), 'No table or special-layout characters detected.', 'Possible table/graphic characters found; use a simple single-column layout.', 1);
    var score = Math.round(kwScore * 70 + pts / 23 * 30);
    var cls = score >= 75 ? 'pos' : score >= 55 ? 'warn' : 'neg', label = score >= 75 ? 'Strong match' : score >= 55 ? 'Moderate match' : 'Needs work';
    function chips(a, cl) { return a.length ? '<div class="tags">' + a.map(function (k) { return '<span class="tag"' + (cl ? ' style="color:var(--' + cl + ');border-color:var(--' + cl + ')"' : '') + '>' + U.esc(k) + '</span>'; }).join('') + '</div>' : '<p class="muted small">None</p>'; }
    c.html(U.grid([U.box('Match score', score + ' / 100', cls, true), U.box('Verdict', label, cls), U.box('Keywords matched', found.length + ' of ' + kws.length), U.box('Resume length', U.fmt(words, 0) + ' words')]) +
      '<h3 style="margin-top:22px;font-size:1rem">Missing keywords from the job description</h3>' + chips(missing.concat(pmiss), 'err') +
      '<p class="result-note">Add these only where they truthfully describe your experience — in your summary, skills or achievement bullets.</p>' +
      '<h3 style="margin-top:22px;font-size:1rem">Keywords you already match</h3>' + chips(found.concat(pfound), 'ok') +
      '<h3 style="margin-top:22px;font-size:1rem">Structure and quality checks</h3><ul style="list-style:none;padding:0">' + checks.map(function (k) { return '<li style="margin-bottom:6px">' + (k.ok ? '<span class="pos">✔</span> ' : '<span class="warn">⚠</span> ') + U.esc(k.msg) + '</li>'; }).join('') + '</ul>' +
      '<p class="result-note">This is a keyword and formatting heuristic, not the algorithm of any specific ATS. Use it as guidance, not a guarantee of how an employer\'s system will rank you.</p>');
  }
};
