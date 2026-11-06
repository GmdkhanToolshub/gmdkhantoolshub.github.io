NiaziTools['kpi-performance-calculator'] = function (root, U) {
  var rows = [
    { name: 'Sales achievement', weight: 40, target: 100, actual: '', dir: 'high' },
    { name: 'Distribution / coverage', weight: 25, target: 100, actual: '', dir: 'high' },
    { name: 'Collections', weight: 20, target: 100, actual: '', dir: 'high' },
    { name: 'Returns / complaints', weight: 15, target: 5, actual: '', dir: 'low' }
  ];
  root.innerHTML = '<div id="kpi-rows"></div><div class="tool-actions"><button type="button" class="btn btn-ghost btn-sm" id="kpi-add">+ Add KPI</button>' +
    '</div><div class="form-grid" style="margin-top:12px"><div class="field"><label for="f-cap">Cap each KPI score at (%)</label><input id="f-cap" type="text" inputmode="decimal" value="120"><small class="hint">Prevents one over-achieved KPI from hiding weak ones. Use 0 for no cap.</small></div>' +
    '<div class="field check" style="align-self:center"><input type="checkbox" id="f-norm" checked><label for="f-norm">Auto-normalise weights if they don\'t total 100%</label></div></div>' +
    '<div class="form-error" role="alert" id="kpi-err"></div><div class="tool-actions"><button type="button" class="btn btn-ghost" id="kpi-reset">Reset to example KPIs</button><button type="button" class="btn btn-ghost" id="kpi-copy">Copy results</button></div><div class="tool-result" id="tool-result" aria-live="polite"></div>';
  var box = root.querySelector('#kpi-rows'), out = root.querySelector('#tool-result'), err = root.querySelector('#kpi-err'), lastText = '';
  function draw() {
    box.innerHTML = rows.map(function (r, i) {
      return '<div class="repeat-row" data-i="' + i + '"><div class="form-grid"><div class="field wide"><label>KPI name</label><input aria-label="KPI name (KPI ' + (i + 1) + ')" data-k="name" value="' + U.esc(r.name) + '" maxlength="60"></div>' +
        '<div class="field"><label>Weight (%)</label><input aria-label="Weight (%) (KPI ' + (i + 1) + ')" data-k="weight" inputmode="decimal" value="' + U.esc(r.weight) + '"></div>' +
        '<div class="field"><label>Better when…</label><select aria-label="Better when… (KPI ' + (i + 1) + ')" data-k="dir"><option value="high"' + (r.dir === 'high' ? ' selected' : '') + '>Higher is better</option><option value="low"' + (r.dir === 'low' ? ' selected' : '') + '>Lower is better</option></select></div>' +
        '<div class="field"><label>Target</label><input aria-label="Target (KPI ' + (i + 1) + ')" data-k="target" inputmode="decimal" value="' + U.esc(r.target) + '"></div>' +
        '<div class="field"><label>Actual</label><input aria-label="Actual (KPI ' + (i + 1) + ')" data-k="actual" inputmode="decimal" value="' + U.esc(r.actual) + '"></div></div>' +
        (rows.length > 1 ? '<button type="button" class="btn btn-ghost btn-sm remove" data-del="' + i + '" aria-label="Remove KPI">Remove</button>' : '') + '</div>';
    }).join('');
  }
  function calc() {
    err.textContent = '';
    var cap = U.num(root.querySelector('#f-cap').value || '0'); if (!(cap >= 0)) { err.textContent = 'Cap must be zero or more.'; return; }
    var norm = root.querySelector('#f-norm').checked, wsum = 0, out2 = [], filled = 0;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], w = U.num(r.weight), t = U.num(r.target), a = U.num(r.actual);
      if (!(w >= 0)) { err.textContent = 'Weight for "' + (r.name || 'KPI ' + (i + 1)) + '" must be zero or more.'; return; }
      wsum += w;
      if (String(r.actual).trim() === '') continue;
      if (!U.isNum(t) || !U.isNum(a)) { err.textContent = 'Target and actual for "' + (r.name || 'KPI ' + (i + 1)) + '" must be numbers.'; return; }
      if (r.dir === 'high' && t <= 0) { err.textContent = 'Target for "' + r.name + '" must be greater than zero.'; return; }
      if (r.dir === 'low' && a < 0) { err.textContent = 'Actual for "' + r.name + '" cannot be negative.'; return; }
      var score = r.dir === 'high' ? a / t * 100 : (a === 0 ? (cap || 200) : t / a * 100);
      if (cap > 0) score = Math.min(score, cap);
      filled++; out2.push({ r: r, w: w, t: t, a: a, score: score });
    }
    if (!filled) { out.innerHTML = '<div class="result-empty">Enter the actual result for at least one KPI to see the weighted score.</div>'; lastText = ''; return; }
    if (wsum <= 0) { err.textContent = 'Weights must add up to more than zero.'; return; }
    var used = 0; out2.forEach(function (o) { used += o.w; });
    if (used <= 0) { err.textContent = 'KPIs with results need a weight above zero.'; return; }
    var total = 0; out2.forEach(function (o) { o.eff = norm ? o.w / used * 100 : o.w; o.pts = o.score * o.eff / 100; total += o.pts; });
    var rating = total >= 100 ? ['Target achieved or exceeded', 'pos'] : total >= 90 ? ['Close to target', 'warn'] : total >= 75 ? ['Below target', 'warn'] : ['Significantly below target', 'neg'];
    var msg = '';
    if (!norm && Math.abs(used - 100) > 0.01) msg = 'Weights of KPIs with results total ' + U.fmt(used, 2) + '%, not 100%, so the score is scaled accordingly. Tick auto-normalise to rescale to 100%.';
    else if (norm && filled < rows.length) msg = 'KPIs without an actual result were excluded and the remaining weights were rescaled to 100%.';
    else if (norm && Math.abs(wsum - 100) > 0.01) msg = 'Weights totalled ' + U.fmt(wsum, 2) + '% and were rescaled to 100%.';
    out.innerHTML = U.grid([U.box('Weighted performance score', U.pct(total, 1), rating[1], true), U.box('Rating', rating[0], rating[1])]) + '<div style="margin-top:16px">' +
      U.table(['KPI', 'Weight', 'Target', 'Actual', 'Score', 'Points'], out2.map(function (o) { return [U.esc(o.r.name || 'KPI'), U.fmt(o.eff, 1) + '%', U.fmt(o.t), U.fmt(o.a), U.pct(o.score, 1), U.fmt(o.pts, 1)]; }), 1) + '</div>' +
      (msg ? '<p class="result-note">' + U.esc(msg) + '</p>' : '') + '<p class="result-note">Score for "higher is better" KPIs = Actual ÷ Target. For "lower is better" KPIs = Target ÷ Actual.</p>';
    lastText = 'KPI Performance Score: ' + U.fmt(total, 1) + '% (' + rating[0] + ')\n' + out2.map(function (o) { return '- ' + (o.r.name || 'KPI') + ': weight ' + U.fmt(o.eff, 1) + '%, target ' + U.fmt(o.t) + ', actual ' + U.fmt(o.a) + ', score ' + U.fmt(o.score, 1) + '%'; }).join('\n');
  }
  draw(); calc();
  root.querySelector('#kpi-add').addEventListener('click', function () { if (rows.length >= 12) { err.textContent = 'You can add up to 12 KPIs.'; return; } rows.push({ name: '', weight: 0, target: '', actual: '', dir: 'high' }); draw(); calc(); });
  box.addEventListener('input', function (e) { var row = e.target.closest('.repeat-row'); if (!row) return; rows[+row.dataset.i][e.target.dataset.k] = e.target.value; calc(); });
  box.addEventListener('change', function (e) { var row = e.target.closest('.repeat-row'); if (!row) return; rows[+row.dataset.i][e.target.dataset.k] = e.target.value; calc(); });
  box.addEventListener('click', function (e) { var b = e.target.closest('[data-del]'); if (!b) return; rows.splice(+b.dataset.del, 1); draw(); calc(); });
  root.querySelector('#f-cap').addEventListener('input', calc); root.querySelector('#f-norm').addEventListener('change', calc);
  root.querySelector('#kpi-reset').addEventListener('click', function () {
    rows = [{ name: 'Sales achievement', weight: 40, target: 100, actual: '', dir: 'high' }, { name: 'Distribution / coverage', weight: 25, target: 100, actual: '', dir: 'high' }, { name: 'Collections', weight: 20, target: 100, actual: '', dir: 'high' }, { name: 'Returns / complaints', weight: 15, target: 5, actual: '', dir: 'low' }];
    root.querySelector('#f-cap').value = '120'; root.querySelector('#f-norm').checked = true; draw(); calc();
  });
  root.querySelector('#kpi-copy').addEventListener('click', function () { if (lastText) U.copy(lastText); else U.toast('Nothing to copy yet'); });
};
