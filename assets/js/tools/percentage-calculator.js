NiaziTools['percentage-calculator'] = function (root, U) {
  var MODES = [
    { id: 'of', name: '% of a number', fields: [{ id: 'a', label: 'Percentage (%)', value: '' }, { id: 'b', label: 'Of this number', value: '' }] },
    { id: 'is', name: 'X is what % of Y', fields: [{ id: 'a', label: 'Value (X)', value: '' }, { id: 'b', label: 'Total (Y)', value: '' }] },
    { id: 'change', name: '% increase / decrease', fields: [{ id: 'a', label: 'Old value', value: '' }, { id: 'b', label: 'New value', value: '' }] },
    { id: 'diff', name: '% difference', fields: [{ id: 'a', label: 'First value', value: '' }, { id: 'b', label: 'Second value', value: '' }] },
    { id: 'addsub', name: 'Add / subtract a %', fields: [{ id: 'a', label: 'Starting value', value: '' }, { id: 'b', label: 'Percentage (%)', value: '' }, { id: 'op', label: 'Operation', type: 'select', options: [{ value: 'add', label: 'Increase by %' }, { value: 'sub', label: 'Decrease by %' }], value: 'add' }] }
  ];
  var mode = 0, ctx;
  function build() {
    var m = MODES[mode];
    ctx = U.mount(root.querySelector('#pc-body'), {
      fields: m.fields.map(function (f) { return Object.assign({ type: 'number' }, f); }),
      onInput: function (v, c) {
        if (!v.a.trim() && !v.b.trim()) return c.empty('Enter two values to calculate.');
        var a = U.num(v.a), b = U.num(v.b);
        if (!U.isNum(a) || !U.isNum(b)) return c.error('Please enter valid numbers in both fields.');
        var res, formula, main;
        if (m.id === 'of') { res = a / 100 * b; main = U.fmt(res, 6); formula = U.fmt(a, 6) + '% × ' + U.fmt(b, 6) + ' ÷ 100'; }
        else if (m.id === 'is') { if (b === 0) return c.error('The total (Y) cannot be zero.'); res = a / b * 100; main = U.fmt(res, 4) + '%'; formula = U.fmt(a, 6) + ' ÷ ' + U.fmt(b, 6) + ' × 100'; }
        else if (m.id === 'change') {
          if (a === 0) return c.error('The old value cannot be zero when calculating a percentage change.');
          res = (b - a) / Math.abs(a) * 100; main = (res > 0 ? '+' : '') + U.fmt(res, 4) + '%';
          formula = '(' + U.fmt(b, 6) + ' − ' + U.fmt(a, 6) + ') ÷ |' + U.fmt(a, 6) + '| × 100';
          return c.html(U.grid([U.box(res >= 0 ? 'Percentage increase' : 'Percentage decrease', main, res >= 0 ? 'pos' : 'neg', true), U.box('Absolute change', U.fmt(b - a, 6))]) + '<p class="result-note">Formula: ' + formula + '</p>');
        }
        else if (m.id === 'diff') {
          var avg = (Math.abs(a) + Math.abs(b)) / 2; if (avg === 0) return c.error('Both values cannot be zero.');
          res = Math.abs(a - b) / avg * 100; main = U.fmt(res, 4) + '%'; formula = '|' + U.fmt(a, 6) + ' − ' + U.fmt(b, 6) + '| ÷ average × 100';
        }
        else { var f = v.op === 'add' ? 1 + b / 100 : 1 - b / 100; res = a * f; main = U.fmt(res, 6); formula = U.fmt(a, 6) + ' × (1 ' + (v.op === 'add' ? '+' : '−') + ' ' + U.fmt(b, 6) + '/100)'; }
        c.html(U.grid([U.box('Result', main, '', true)]) + '<p class="result-note">Formula: ' + formula + '</p>');
      }
    });
  }
  root.innerHTML = '<div id="pc-body"></div>';
  U.tabs(root, MODES.map(function (m) { return m.name; }), function (i) { mode = i; build(); });
  build();
};
