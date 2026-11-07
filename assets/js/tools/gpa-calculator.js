/* GPA & CGPA Calculator on a 4.0 scale with credit hours. Grade points are editable because universities differ. */
NiaziTools['gpa-calculator'] = function (root, U) {
  var SCALE = [['A+', 4], ['A', 4], ['A-', 3.67], ['B+', 3.33], ['B', 3], ['B-', 2.67], ['C+', 2.33], ['C', 2], ['C-', 1.67], ['D+', 1.33], ['D', 1], ['F', 0]];
  var KEY = 'gm.gpa.v1', st = U.store.get(KEY, null) || { rows: [{ n: '', cr: '3', g: 'A' }, { n: '', cr: '3', g: 'B+' }, { n: '', cr: '3', g: 'B' }, { n: '', cr: '2', g: 'A-' }], prevC: '', prevCr: '' };
  root.innerHTML = '<div id="gp-rows"></div><div class="tool-actions" style="margin-top:4px"><button type="button" class="btn btn-ghost btn-sm" id="gp-add">+ Add course</button></div>' +
    '<h3 style="font-size:1rem;margin:18px 0 8px">Previous semesters (for CGPA, optional)</h3>' +
    '<div class="form-grid"><div class="field"><label for="gp-pc">Current CGPA</label><input type="text" inputmode="decimal" id="gp-pc" placeholder="e.g. 3.21"></div>' +
    '<div class="field"><label for="gp-pcr">Credit hours completed</label><input type="text" inputmode="decimal" id="gp-pcr" placeholder="e.g. 66"></div></div>' +
    '<div class="tool-actions"><button type="button" class="btn btn-ghost btn-sm" id="gp-reset">Reset</button></div>' +
    '<div class="tool-result" id="gp-out" aria-live="polite"></div>' +
    '<p class="small muted">Grade points use a common 4.0 scale (A = 4.0, B = 3.0, C = 2.0, D = 1.0). Universities use different scales and cut-offs, so check your institution\'s grading policy.</p>';
  var box = root.querySelector('#gp-rows'), out = root.querySelector('#gp-out');
  root.querySelector('#gp-pc').value = st.prevC; root.querySelector('#gp-pcr').value = st.prevCr;
  function draw() {
    box.innerHTML = st.rows.map(function (r, i) {
      return '<div class="gp-row"><div class="field"><label for="gp-n' + i + '">Course ' + (i + 1) + '</label><input id="gp-n' + i + '" data-i="' + i + '" data-k="n" value="' + U.esc(r.n) + '" placeholder="Course name (optional)" maxlength="60"></div>' +
        '<div class="field"><label for="gp-c' + i + '">Credit hours</label><input id="gp-c' + i + '" data-i="' + i + '" data-k="cr" inputmode="decimal" value="' + U.esc(r.cr) + '"></div>' +
        '<div class="field"><label for="gp-g' + i + '">Grade</label><select id="gp-g' + i + '" data-i="' + i + '" data-k="g">' + SCALE.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === r.g ? ' selected' : '') + '>' + s[0] + ' (' + s[1].toFixed(2) + ')</option>'; }).join('') + '</select></div>' +
        (st.rows.length > 1 ? '<button type="button" class="btn btn-ghost btn-sm gp-del" data-del="' + i + '" aria-label="Remove course ' + (i + 1) + '">✕</button>' : '<span></span>') + '</div>';
    }).join('');
  }
  function pts(g) { for (var i = 0; i < SCALE.length; i++) if (SCALE[i][0] === g) return SCALE[i][1]; return 0; }
  function calc() {
    st.prevC = root.querySelector('#gp-pc').value; st.prevCr = root.querySelector('#gp-pcr').value; U.store.set(KEY, st);
    var cr = 0, qp = 0, bad = false;
    st.rows.forEach(function (r) { var c = U.num(r.cr); if (!U.isNum(c) || c <= 0) { if (String(r.cr).trim()) bad = true; return; } cr += c; qp += c * pts(r.g); });
    if (bad) { out.innerHTML = '<p class="form-error">Credit hours must be a number above zero.</p>'; return; }
    if (!cr) { out.innerHTML = '<div class="result-empty">Add your courses with credit hours and grades.</div>'; return; }
    var gpa = qp / cr, boxes = [U.box('Semester GPA', U.fmt(gpa, 2), gpa >= 3 ? 'pos' : gpa >= 2 ? '' : 'neg', true), U.box('Credit hours', U.fmt(cr, 1)), U.box('Quality points', U.fmt(qp, 2))];
    var pc = U.num(st.prevC), pcr = U.num(st.prevCr), note = '';
    if (U.isNum(pc) && U.isNum(pcr) && pcr > 0) {
      if (pc < 0 || pc > 4) note = '<p class="form-error">Current CGPA should be between 0 and 4.</p>';
      else { var cg = (pc * pcr + qp) / (pcr + cr); boxes.push(U.box('New CGPA', U.fmt(cg, 2), cg >= pc ? 'pos' : 'neg'), U.box('Total credit hours', U.fmt(pcr + cr, 1))); }
    }
    out.innerHTML = U.grid(boxes) + note;
  }
  box.addEventListener('input', function (e) { var el = e.target; if (el.hasAttribute('data-k')) { st.rows[+el.getAttribute('data-i')][el.getAttribute('data-k')] = el.value; calc(); } });
  box.addEventListener('change', function (e) { var el = e.target; if (el.hasAttribute('data-k')) { st.rows[+el.getAttribute('data-i')][el.getAttribute('data-k')] = el.value; calc(); } });
  box.addEventListener('click', function (e) { var b = e.target.closest('[data-del]'); if (!b) return; st.rows.splice(+b.getAttribute('data-del'), 1); draw(); calc(); });
  root.querySelector('#gp-add').addEventListener('click', function () { if (st.rows.length >= 20) return U.toast('Up to 20 courses'); st.rows.push({ n: '', cr: '3', g: 'A' }); draw(); calc(); box.querySelector('#gp-n' + (st.rows.length - 1)).focus(); });
  root.querySelector('#gp-pc').addEventListener('input', calc); root.querySelector('#gp-pcr').addEventListener('input', calc);
  root.querySelector('#gp-reset').addEventListener('click', function () { st = { rows: [{ n: '', cr: '3', g: 'A' }], prevC: '', prevCr: '' }; root.querySelector('#gp-pc').value = ''; root.querySelector('#gp-pcr').value = ''; draw(); calc(); });
  draw(); calc();
};
