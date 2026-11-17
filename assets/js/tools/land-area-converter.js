/* Land area converter for Pakistan: marla, kanal, acre, square feet, square yard, square metre, murabba.
   A marla is usually 272.25 sq ft (30.25 sq yd). Some housing schemes use 225 sq ft, so that is a choice. */
NiaziTools['land-area-converter'] = function (root, U) {
  var SQM = 10.7639104; // sq ft in one sq metre
  var MARLA_OPTS = [{ value: '272.25', label: 'Standard marla: 272.25 sq ft (30.25 sq yd)' }, { value: '225', label: 'Housing-scheme marla: 225 sq ft (25 sq yd)' }];
  var inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  function units(M) {
    return [
      { id: 'sqft', name: 'Square feet', f: 1 }, { id: 'sqyd', name: 'Square yards', f: 9 }, { id: 'sqm', name: 'Square metres', f: SQM },
      { id: 'marla', name: 'Marla', f: M }, { id: 'kanal', name: 'Kanal (20 marla)', f: 20 * M }, { id: 'acre', name: 'Acre', f: 43560 },
      { id: 'ghumaon', name: 'Ghumaon (1 acre)', f: 43560 }, { id: 'murabba', name: 'Murabba (25 acres)', f: 25 * 43560 }, { id: 'hectare', name: 'Hectare', f: 10000 * SQM }
    ];
  }
  function split(sqft, M) { var tot = Math.round(sqft / M * 100) / 100, k = Math.floor(tot / 20), m = Math.round((tot - k * 20) * 100) / 100; return (k ? k + ' kanal ' : '') + (m || !k ? U.fmt(m, 2) + ' marla' : ''); }
  var mode = 0;
  function build() {
    if (mode === 0) {
      var body0 = root.querySelector('#la-body');
      U.mount(body0, {
        fields: [
          { id: 'val', label: 'Area', type: 'number', placeholder: 'e.g. 5' },
          { id: 'from', label: 'In', type: 'select', value: 'marla', options: units(272.25).map(function (u) { return { value: u.id, label: u.name }; }) },
          { id: 'M', label: 'Marla size', type: 'select', value: '272.25', options: MARLA_OPTS, hint: 'Only matters for marla and kanal. Acre, feet and yards do not change.' }
        ],
        onInput: function (v, c) {
          var x = U.num(v.val); if (v.val.trim() === '') return c.empty('Enter an area to convert it into every unit.');
          if (!U.isNum(x) || x < 0) return c.error('Please enter a valid area of zero or more.');
          var M = parseFloat(v.M), us = units(M), cur = us.filter(function (u) { return u.id === v.from; })[0], sqft = x * cur.f;
          var rows = us.map(function (u) { return [u.name, U.fmt(sqft / u.f, u.f > 100000 ? 6 : 3)]; });
          c.html(U.grid([U.box('Square feet', U.fmt(sqft, 2), '', true), U.box('In marla and kanal', split(sqft, M)), U.box('Acres', U.fmt(sqft / 43560, 4))]) +
            '<div style="margin-top:16px">' + U.table(['Unit', 'Area'], rows) + '</div><p class="result-note">1 kanal = 20 marla. 1 acre = 43,560 sq ft = 160 standard marla.</p>');
        }
      });
    } else {
      U.mount(root.querySelector('#la-body'), {
        before: '<p class="small muted" style="margin-top:0">Enter the length and width of a rectangular plot to see its size in marla and kanal.</p>',
        fields: [
          { id: 'len', label: 'Length', type: 'number', placeholder: 'e.g. 45' },
          { id: 'wid', label: 'Width', type: 'number', placeholder: 'e.g. 45' },
          { id: 'u', label: 'Measured in', type: 'select', value: 'ft', options: [{ value: 'ft', label: 'Feet' }, { value: 'yd', label: 'Yards' }, { value: 'm', label: 'Metres' }] },
          { id: 'M', label: 'Marla size', type: 'select', value: '272.25', options: MARLA_OPTS },
          { id: 'pm', label: 'Price per marla (optional)', type: 'number', placeholder: 'Rs per marla' }
        ],
        onInput: function (v, c) {
          if (v.len.trim() === '' && v.wid.trim() === '') return c.empty('Enter the plot length and width.');
          var l = U.num(v.len), w = U.num(v.wid);
          if (!U.isNum(l) || !U.isNum(w) || l <= 0 || w <= 0) return c.error('Please enter a length and a width greater than zero.');
          var f = v.u === 'ft' ? 1 : v.u === 'yd' ? 3 : 3.28083989501312, sqft = l * f * w * f, M = parseFloat(v.M), marla = sqft / M;
          var out = U.grid([U.box('Plot size', split(sqft, M), '', true), U.box('Square feet', U.fmt(sqft, 2)), U.box('Square yards', U.fmt(sqft / 9, 2))]);
          out += '<div style="margin-top:16px">' + U.table(['Unit', 'Area'], [['Marla', U.fmt(marla, 3)], ['Kanal', U.fmt(marla / 20, 4)], ['Acre', U.fmt(sqft / 43560, 5)], ['Square metres', U.fmt(sqft / SQM, 2)]]) + '</div>';
          var pm = U.num(v.pm);
          if (U.isNum(pm) && pm > 0) out += '<p class="result-note">At Rs ' + inr.format(pm) + ' per marla, this plot is about <b>Rs ' + inr.format(Math.round(marla * pm)) + '</b>.</p>';
          c.html(out + '<p class="result-note">Real plots are often a little smaller or larger than their named size. Check the registry or fard for the exact area.</p>');
        }
      });
    }
  }
  root.innerHTML = '<div id="la-body"></div>';
  U.tabs(root, ['Convert area', 'Plot size from length × width'], function (i) { mode = i; build(); });
  build();
};
