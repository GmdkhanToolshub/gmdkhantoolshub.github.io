/* MDCAT Aggregate Calculator 2026: merit aggregate from Matric, FSc and test marks with editable weights, plus the test marks needed for a target. */
NiaziTools['mdcat-aggregate-calculator'] = function (root, U) {
  function pc(n) { return U.fmt(n, 2, 2) + '%'; }
  U.mount(root, {
    fields: [
      { id: 'm', label: 'Matric marks obtained', type: 'number', placeholder: 'e.g. 1000' },
      { id: 'mt', label: 'Matric total marks', type: 'number', value: '1100' },
      { id: 'f', label: 'FSc / intermediate marks obtained', type: 'number', placeholder: 'e.g. 950', hint: 'Use Part 1 and Part 2 together. If the notice says Part 1 only, enter Part 1 marks and change the total to 550.' },
      { id: 'ft', label: 'FSc / intermediate total marks', type: 'number', value: '1100' },
      { id: 't', label: 'MDCAT marks obtained', type: 'number', placeholder: 'Your test marks' },
      { id: 'tt', label: 'MDCAT total marks', type: 'number', value: '180', hint: 'MDCAT paper total. Check your official notice: 180 and 200 have both been reported.' },
      { id: 'wm', label: 'Matric weight (%)', type: 'number', value: '10' },
      { id: 'wf', label: 'FSc weight (%)', type: 'number', value: '40' },
      { id: 'wt', label: 'MDCAT weight (%)', type: 'number', value: '50', hint: 'The three weights must add up to 100. Copy them from your official admission notice.' },
      { id: 'goal', label: 'Target aggregate (%) (optional)', type: 'number', placeholder: 'e.g. 85', hint: 'Enter an aggregate you want to reach to see the test marks you need.' }
    ],
    onInput: function (v, c) {
      if (!v.m.trim() && !v.f.trim() && !v.t.trim()) return c.empty('Enter your Matric, FSc and test marks to see your aggregate.');
      var m = U.num(v.m), mt = U.num(v.mt), f = U.num(v.f), ft = U.num(v.ft), t = U.num(v.t), tt = U.num(v.tt), wm = U.num(v.wm), wf = U.num(v.wf), wt = U.num(v.wt);
      var all = [m, mt, f, ft, t, tt, wm, wf, wt];
      for (var i = 0; i < all.length; i++) if (!U.isNum(all[i]) || all[i] < 0) return c.error('Please fill every marks and weight box with numbers of zero or more.');
      if (mt <= 0 || ft <= 0 || tt <= 0) return c.error('Total marks must be greater than zero.');
      if (m > mt || f > ft || t > tt) return c.error('Marks obtained cannot be more than the total for that part.');
      var sum = wm + wf + wt;
      if (Math.abs(sum - 100) > 0.001) return c.error('The three weights add up to ' + U.fmt(sum, 2) + ', but they must add up to 100.');
      var pm = m / mt * 100, pf = f / ft * 100, pt = t / tt * 100;
      var cm = pm * wm / 100, cf = pf * wf / 100, ct = pt * wt / 100, agg = cm + cf + ct;
      var out = U.grid([U.box('Your aggregate', pc(agg), '', true), U.box('Matric part', U.fmt(cm, 2, 2)), U.box('FSc part', U.fmt(cf, 2, 2)), U.box('MDCAT part', U.fmt(ct, 2, 2))]);
      out += '<div style="margin-top:16px">' + U.table(['Part', 'Marks', 'Percentage', 'Weight', 'Adds'], [
        ['Matric', U.fmt(m, 1) + ' / ' + U.fmt(mt, 0), pc(pm), U.fmt(wm, 2) + '%', U.fmt(cm, 2, 2)],
        ['FSc', U.fmt(f, 1) + ' / ' + U.fmt(ft, 0), pc(pf), U.fmt(wf, 2) + '%', U.fmt(cf, 2, 2)],
        ['MDCAT', U.fmt(t, 1) + ' / ' + U.fmt(tt, 0), pc(pt), U.fmt(wt, 2) + '%', U.fmt(ct, 2, 2)],
        ['Total', '', '', U.fmt(sum, 0) + '%', U.fmt(agg, 2, 2)]]) + '</div>';
      if (v.goal.trim()) {
        var g = U.num(v.goal);
        if (!U.isNum(g) || g <= 0 || g > 100) return c.error('The target aggregate must be a number between 0 and 100.');
        if (wt <= 0) out += '<p class="result-note">The test weight is zero, so test marks cannot change your aggregate.</p>';
        else {
          var needPct = (g - cm - cf) / wt * 100, needMarks = needPct / 100 * tt;
          if (needPct > 100) out += '<p class="result-note"><b>Target ' + U.fmt(g, 2) + '%:</b> not reachable with these Matric and FSc marks, because even full marks in the test would give ' + pc(cm + cf + wt) + '.</p>';
          else if (needPct <= 0) out += '<p class="result-note"><b>Target ' + U.fmt(g, 2) + '%:</b> you already reach it with your Matric and FSc marks alone.</p>';
          else out += '<p class="result-note"><b>Target ' + U.fmt(g, 2) + '%:</b> you need about <b>' + U.fmt(Math.ceil(needMarks * 10) / 10, 1) + ' out of ' + U.fmt(tt, 0) + '</b> (' + U.fmt(needPct, 1) + '%) in the MDCAT.</p>';
        }
      }
      c.html(out + '<p class="result-note">An estimate using the weights above. Formulas change by year and university, so confirm them with the official admission notice.</p>');
    }
  });
};
