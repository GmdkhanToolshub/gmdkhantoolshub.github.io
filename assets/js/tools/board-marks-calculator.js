/* Matric / FSc board marks calculator: percentage, grade, marks needed for a target and a university merit aggregate.
   The grade scale below is the one used by most Pakistani boards. Your board's own notification is the final word. */
NiaziTools['board-marks-calculator'] = function (root, U) {
  var SCALE = [[80, 'A+', 'Outstanding'], [70, 'A', 'Excellent'], [60, 'B', 'Very good'], [50, 'C', 'Good'], [40, 'D', 'Satisfactory'], [33, 'E', 'Pass']];
  function grade(p) { for (var i = 0; i < SCALE.length; i++) if (p >= SCALE[i][0]) return SCALE[i]; return [0, 'F', 'Fail']; }
  var mode = 0;
  function pos(x) { return U.isNum(x) && x >= 0; }
  function build() {
    var body = root.querySelector('#bm-body');
    if (mode === 0) {
      U.mount(body, {
        fields: [
          { id: 'ob', label: 'Marks obtained', type: 'number', placeholder: 'e.g. 962' },
          { id: 'tot', label: 'Total marks', type: 'number', value: '1100', hint: 'Matric (9th + 10th) and most FSc (1st + 2nd year) results are out of 1100. Change it if your total is different.' }
        ],
        onInput: function (v, c) {
          if (v.ob.trim() === '') return c.empty('Enter your marks to see your percentage and grade.');
          var ob = U.num(v.ob), t = U.num(v.tot);
          if (!pos(ob) || !U.isNum(t) || t <= 0) return c.error('Enter valid marks and a total greater than zero.');
          if (ob > t) return c.error('Marks obtained cannot be more than the total marks.');
          var p = ob / t * 100, gr = grade(p), nxt = null;
          for (var i = SCALE.length - 1; i >= 0; i--) if (SCALE[i][0] > p) { nxt = SCALE[i]; break; }
          var out = U.grid([U.box('Percentage', U.fmt(p, 2) + '%', '', true), U.box('Grade', gr[1] + ' (' + gr[2] + ')'), U.box('Marks lost', U.fmt(t - ob, 2))]);
          if (nxt) out += '<p class="result-note">You need ' + U.fmt(Math.ceil(nxt[0] / 100 * t - ob), 0) + ' more marks out of ' + U.fmt(t, 0) + ' to reach grade ' + nxt[1] + ' (' + nxt[0] + '%).</p>';
          out += '<div style="margin-top:12px">' + U.table(['Grade', 'Percentage', 'Marks out of ' + U.fmt(t, 0)], SCALE.map(function (s) { return [s[1] + ' ' + s[2], s[0] + '% and above', U.fmt(Math.ceil(s[0] / 100 * t), 0) + '+']; }), 1) + '</div>';
          c.html(out + '<p class="result-note">Grade bands follow the common board scale (A+ at 80%, pass at 33%). Some boards and years differ, so check your result gazette.</p>');
        }
      });
    } else if (mode === 1) {
      U.mount(body, {
        before: '<p class="small muted" style="margin-top:0">Already have some papers done? Enter your marks so far and the marks still to come to see what you need in the rest.</p>',
        fields: [
          { id: 'tp', label: 'Target percentage', type: 'number', placeholder: 'e.g. 85' },
          { id: 'tot', label: 'Total marks of the exam', type: 'number', value: '1100' },
          { id: 'ob', label: 'Marks obtained so far', type: 'number', placeholder: '0' },
          { id: 'done', label: 'Total marks of papers already done', type: 'number', placeholder: '0' }
        ],
        onInput: function (v, c) {
          if (v.tp.trim() === '') return c.empty('Enter the percentage you are aiming for.');
          var tp = U.num(v.tp), t = U.num(v.tot), ob = v.ob.trim() ? U.num(v.ob) : 0, dn = v.done.trim() ? U.num(v.done) : 0;
          if (!U.isNum(tp) || tp < 0 || tp > 100 || !U.isNum(t) || t <= 0) return c.error('Target must be 0 to 100 and total marks greater than zero.');
          if (!pos(ob) || !pos(dn) || ob > dn || dn > t) return c.error('Marks so far must be valid: obtained cannot exceed the papers done, and papers done cannot exceed the total.');
          var need = tp / 100 * t, left = t - dn, req = need - ob;
          var out = U.grid([U.box('Marks needed in total', U.fmt(Math.ceil(need), 0), '', true), U.box('Still to come', U.fmt(left, 0) + ' marks'), U.box('Needed in remaining', left > 0 ? U.fmt(Math.max(0, Math.ceil(req)), 0) : '–')]);
          if (left > 0) {
            if (req > left) out += '<p class="result-note inline-error">This target is out of reach: you would need ' + U.fmt(Math.ceil(req), 0) + ' marks but only ' + U.fmt(left, 0) + ' are left.</p>';
            else out += '<p class="result-note">That is ' + U.fmt(Math.max(0, req) / left * 100, 1) + '% of the remaining marks.</p>';
          }
          c.html(out);
        }
      });
    } else {
      U.mount(body, {
        before: '<p class="small muted" style="margin-top:0">Universities combine Matric, Intermediate and the entry test with their own weights. Enter your percentages and <b>your university\'s weights</b> (they are not the same everywhere). The defaults are only an example.</p>',
        fields: [
          { id: 'a', label: 'Matric percentage', type: 'number', placeholder: 'e.g. 88' }, { id: 'aw', label: 'Matric weight', type: 'number', value: '10' },
          { id: 'b', label: 'Intermediate percentage', type: 'number', placeholder: 'e.g. 82' }, { id: 'bw', label: 'Intermediate weight', type: 'number', value: '40' },
          { id: 'c', label: 'Entry test percentage', type: 'number', placeholder: 'e.g. 70' }, { id: 'cw', label: 'Entry test weight', type: 'number', value: '50' }
        ],
        onInput: function (v, c) {
          var rows = [['a', 'Matric'], ['b', 'Intermediate'], ['c', 'Entry test']], sw = 0, s = 0, used = [];
          for (var i = 0; i < rows.length; i++) {
            var k = rows[i][0], x = v[k].trim() === '' ? null : U.num(v[k]), w = U.num(v[k + 'w']);
            if (x === null) continue;
            if (!U.isNum(x) || x < 0 || x > 100 || !U.isNum(w) || w < 0) return c.error('Percentages must be 0 to 100 and weights must be zero or more.');
            s += x * w; sw += w; used.push([rows[i][1], U.fmt(x, 2) + '%', U.fmt(w, 2)]);
          }
          if (!used.length) return c.empty('Enter at least one percentage and its weight.');
          if (sw <= 0) return c.error('The weights add up to zero. Enter a weight above zero.');
          c.html(U.grid([U.box('Merit aggregate', U.fmt(s / sw, 2) + '%', '', true), U.box('Total weight', U.fmt(sw, 2))]) + '<div style="margin-top:12px">' + U.table(['Part', 'Your score', 'Weight'], used, 1) + '</div>' +
            '<p class="result-note">Aggregate = sum of (percentage × weight) ÷ total weight. If you left a part blank, only the parts you entered are counted.</p>');
        }
      });
    }
  }
  root.innerHTML = '<div id="bm-body"></div>';
  U.tabs(root, ['Percentage & grade', 'Marks needed', 'Merit aggregate'], function (i) { mode = i; build(); });
  build();
};
