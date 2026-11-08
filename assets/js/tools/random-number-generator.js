/* Random Number Generator: numbers, dice, coin flips and a list picker. Uses the browser's cryptographic random
   generator with rejection sampling, so every value is equally likely. */
NiaziTools['random-number-generator'] = function (root, U) {
  function rnd(n) { var lim = Math.floor(4294967296 / n) * n, b = new Uint32Array(1); do { crypto.getRandomValues(b); } while (b[0] >= lim); return b[0] % n; }
  function frac() { var b = new Uint32Array(2); crypto.getRandomValues(b); return (b[0] * 2097152 + (b[1] >>> 11)) / 9007199254740992; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function chips(arr) { return '<div class="rn-chips">' + arr.map(function (v) { return '<span class="rn-chip">' + U.esc(v) + '</span>'; }).join('') + '</div>'; }
  root.innerHTML = '<div id="rn-body"></div>';
  var views = [
    function (b) {
      U.mount(b, {
        fields: [{ id: 'min', label: 'Lowest number', type: 'number', value: '1' }, { id: 'max', label: 'Highest number', type: 'number', value: '100' }, { id: 'n', label: 'How many numbers', type: 'number', value: '1' },
          { id: 'dec', label: 'Decimal places', type: 'select', value: '0', options: [{ value: '0', label: 'Whole numbers' }, { value: '1', label: '1 decimal place' }, { value: '2', label: '2 decimal places' }, { value: '4', label: '4 decimal places' }] },
          { id: 'uniq', label: 'No repeats (each number only once)', type: 'checkbox', value: false }, { id: 'sort', label: 'Sort the results', type: 'checkbox', value: false }],
        reset: false, initial: false,
        actions: [{ id: 'go', label: 'Generate', onClick: function (v, c) {
          var lo = U.num(v.min), hi = U.num(v.max), n = U.num(v.n), d = +v.dec;
          if (!U.isNum(lo) || !U.isNum(hi) || !U.isNum(n)) return c.error('Enter the lowest number, highest number and how many you want.');
          if (hi < lo) return c.error('The highest number must not be lower than the lowest.');
          n = Math.floor(n); if (n < 1 || n > 1000) return c.error('Choose between 1 and 1,000 numbers.');
          var out = [];
          if (d === 0) {
            lo = Math.ceil(lo); hi = Math.floor(hi); var span = hi - lo + 1; if (span < 1) return c.error('There is no whole number between those limits.');
            if (span > 4294967295) return c.error('That range is too large. Use a range under 4 billion.');
            if (v.uniq && n > span) return c.error('You asked for ' + n + ' different numbers, but only ' + span + ' whole numbers fit between ' + lo + ' and ' + hi + '.');
            if (v.uniq) { var seen = {}; while (out.length < n) { var x = lo + rnd(span); if (!seen[x]) { seen[x] = 1; out.push(x); } } } else for (var i = 0; i < n; i++) out.push(lo + rnd(span));
          } else {
            var p = Math.pow(10, d); if (v.uniq) { var cnt = Math.floor((hi - lo) * p) + 1; if (n > cnt) return c.error('Only ' + cnt + ' different values exist between those limits at this precision.'); var s2 = {}; while (out.length < n) { var y = Math.round((lo + frac() * (hi - lo)) * p) / p; if (!s2[y]) { s2[y] = 1; out.push(y); } } } else for (var k = 0; k < n; k++) out.push(Math.round((lo + frac() * (hi - lo)) * p) / p);
          }
          if (v.sort) out.sort(function (a, b) { return a - b; });
          var sum = out.reduce(function (a, b) { return a + b; }, 0), txt = out.map(function (x) { return d ? x.toFixed(d) : String(x); });
          c.html(U.grid([U.box(n === 1 ? 'Your random number' : 'Your random numbers', n === 1 ? U.esc(txt[0]) : U.fmt(n, 0) + ' numbers', '', true)]) + chips(txt) +
            (n > 1 ? U.grid([U.box('Sum', U.fmt(sum, 4)), U.box('Average', U.fmt(sum / n, 4)), U.box('Lowest', U.fmt(Math.min.apply(null, out), 4)), U.box('Highest', U.fmt(Math.max.apply(null, out), 4))]) : '') +
            '<div class="tool-actions"><button type="button" class="btn btn-ghost btn-sm" id="rn-copy">Copy</button></div>');
          c.$('#rn-copy').onclick = function () { U.copy(txt.join(', ')); };
        } }]
      });
    },
    function (b) {
      U.mount(b, {
        fields: [{ id: 'n', label: 'Number of dice', type: 'select', value: '2', options: ['1', '2', '3', '4', '5', '6', '8', '10'] }, { id: 's', label: 'Sides on each die', type: 'select', value: '6', options: ['4', '6', '8', '10', '12', '20', '100'] }],
        reset: false, initial: false,
        actions: [{ id: 'go', label: 'Roll', onClick: function (v, c) { var n = +v.n, s = +v.s, r = []; for (var i = 0; i < n; i++) r.push(1 + rnd(s)); var t = r.reduce(function (a, x) { return a + x; }, 0); c.html(U.grid([U.box('Total', String(t), '', true), U.box('Rolled', n + ' × d' + s)]) + chips(r)); } }]
      });
    },
    function (b) {
      U.mount(b, {
        fields: [{ id: 'n', label: 'Number of flips', type: 'select', value: '1', options: ['1', '2', '3', '5', '10', '25', '50', '100'] }], reset: false, initial: false,
        actions: [{ id: 'go', label: 'Flip', onClick: function (v, c) { var n = +v.n, h = 0, r = []; for (var i = 0; i < n; i++) { var x = rnd(2); h += x; r.push(x ? 'Heads' : 'Tails'); } c.html(n === 1 ? U.grid([U.box('Result', r[0], '', true)]) : U.grid([U.box('Heads', String(h), '', true), U.box('Tails', String(n - h))]) + (n <= 25 ? chips(r) : '')); } }]
      });
    },
    function (b) {
      U.mount(b, {
        fields: [{ id: 'list', label: 'Your list (one item per line)', type: 'textarea', rows: 6, wide: true, placeholder: 'Ali\nSara\nHamza\nAyesha' }, { id: 'n', label: 'How many to pick', type: 'number', value: '1' }],
        reset: false, initial: false,
        actions: [{ id: 'pick', label: 'Pick randomly', onClick: function (v, c) {
          var items = U.lines(v.list), n = Math.floor(U.num(v.n));
          if (!items.length) return c.error('Add at least one item, one per line.');
          if (!(n >= 1)) return c.error('Choose how many items to pick.'); if (n > items.length) return c.error('You asked for ' + n + ' but the list has only ' + items.length + ' item' + (items.length > 1 ? 's' : '') + '.');
          c.html(U.grid([U.box(n === 1 ? 'Winner' : 'Winners', n === 1 ? U.esc(shuffle(items)[0]) : U.fmt(n, 0) + ' picked', '', true)]) + (n > 1 ? chips(shuffle(items).slice(0, n)) : ''));
        } }, { id: 'shuf', label: 'Shuffle the whole list', kind: 'ghost', onClick: function (v, c) { var items = U.lines(v.list); if (!items.length) return c.error('Add at least one item, one per line.'); c.html('<ol class="rn-ol">' + shuffle(items).map(function (x) { return '<li>' + U.esc(x) + '</li>'; }).join('') + '</ol>'); } }]
      });
    }
  ];
  U.tabs(root, ['Numbers', 'Dice', 'Coin flip', 'Pick from a list'], function (i) { views[i](root.querySelector('#rn-body')); });
  views[0](root.querySelector('#rn-body'));
};
