NiaziTools['sales-target-calculator'] = function (root, U) {
  U.mount(root, {
    fields: [
      { id: 'target', label: 'Sales target for the period', type: 'number', placeholder: 'e.g. 5,000,000' },
      { id: 'achieved', label: 'Achieved so far', type: 'number', placeholder: 'e.g. 3,200,000' },
      { id: 'total', label: 'Total selling days in period', type: 'number', value: '26', hint: 'Working / selling days, e.g. 26 for a month.' },
      { id: 'elapsed', label: 'Selling days completed', type: 'number', value: '', placeholder: 'e.g. 15' },
      { id: 'cur', label: 'Currency symbol (optional)', type: 'text', value: '', placeholder: 'e.g. PKR, $', maxlength: 6 }
    ],
    onInput: function (v, ctx) {
      if (!v.target.trim() && !v.achieved.trim()) return ctx.empty('Enter your target and what you have achieved to see progress and the daily run rate required.');
      var t = U.num(v.target), a = U.num(v.achieved), d = U.num(v.total), e = U.num(v.elapsed);
      if (!(t > 0)) return ctx.error('Target must be a number greater than zero.');
      if (!(a >= 0)) return ctx.error('Achieved sales must be zero or more.');
      var cur = v.cur.trim(), f = function (n) { return (cur ? cur + ' ' : '') + U.fmt(n, 2); };
      var pct = a / t * 100, rem = Math.max(0, t - a);
      var boxes = [U.box('Target achievement', U.pct(pct), pct >= 100 ? 'pos' : (pct >= 80 ? 'warn' : 'neg'), true), U.box('Achieved', f(a)), U.box('Remaining target', f(rem), rem === 0 ? 'pos' : ''), U.box(pct > 100 ? 'Over target by' : 'Target', f(pct > 100 ? a - t : t))];
      var note = '';
      if (U.isNum(d) && d > 0 && U.isNum(e) && e >= 0) {
        if (e > d) return ctx.error('Days completed cannot be more than total selling days.');
        var left = d - e;
        if (left > 0) boxes.push(U.box('Selling days left', U.fmt(left, 0)), U.box('Required per day', f(rem / left), rem === 0 ? 'pos' : ''));
        if (e > 0) {
          var rr = a / e, proj = rr * d;
          boxes.push(U.box('Current daily run rate', f(rr)), U.box('Projected at period end', f(proj), proj >= t ? 'pos' : 'neg'), U.box('Projected achievement', U.pct(proj / t * 100)));
          note = proj >= t ? 'At the current run rate you are on track to reach the target.' : 'At the current run rate you would finish ' + f(t - proj) + ' short. Lift the daily average to ' + (left > 0 ? f(rem / left) : 'n/a') + ' to close the gap.';
        }
        if (left === 0 && rem > 0) note = 'The period is complete and the target was missed by ' + f(rem) + '.';
      } else { note = 'Add total selling days and days completed to also see the daily rate required and a projection.'; }
      ctx.html('<div class="progress" role="progressbar" aria-valuenow="' + Math.min(100, Math.round(pct)) + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + Math.min(100, pct) + '%"></i></div>' + U.grid(boxes) + (note ? '<p class="result-note">' + U.esc(note) + '</p>' : ''));
    }
  });
};
