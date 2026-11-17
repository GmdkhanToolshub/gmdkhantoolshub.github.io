/* Tola, Masha, Ratti and Gram converter with a gold value estimate.
   1 tola = 11.6638038 g (standard South Asian tola), 1 tola = 12 masha, 1 masha = 8 ratti.
   Gold prices are typed in by the user (no price feed), so it works offline and costs nothing. */
NiaziTools['tola-gold-converter'] = function (root, U) {
  var TOLA = 11.6638038, MASHA = TOLA / 12, RATTI = MASHA / 8, OZ = 31.1034768;
  var inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  function rs(n) { return 'Rs ' + inr.format(Math.round(n)); }
  function g(v, k) { var x = U.num(v[k]); return U.isNum(x) && x > 0 ? x : 0; }
  U.mount(root, {
    before: '<p class="small muted" style="margin-top:0">Type any mix of units, for example 2 tola 5 masha 3 ratti. They are added together. Leave the others blank.</p>',
    fields: [
      { id: 't', label: 'Tola', type: 'number', placeholder: '0', min: 0 },
      { id: 'm', label: 'Masha', type: 'number', placeholder: '0', min: 0, hint: '1 tola = 12 masha' },
      { id: 'r', label: 'Ratti', type: 'number', placeholder: '0', min: 0, hint: '1 masha = 8 ratti' },
      { id: 'gr', label: 'Grams', type: 'number', placeholder: '0', min: 0 },
      { id: 'price', label: 'Gold price per tola (optional)', type: 'number', placeholder: 'Today\'s rate in Rs', hint: 'Use the rate for the karat you are buying or selling.' },
      { id: 'mk', label: 'Making charges / wastage (%)', type: 'number', placeholder: '0', hint: 'Added on top of the gold value when you are buying jewellery.' }
    ],
    onInput: function (v, c) {
      var grams = g(v, 't') * TOLA + g(v, 'm') * MASHA + g(v, 'r') * RATTI + g(v, 'gr');
      if (!grams) return c.empty('Enter a weight in tola, masha, ratti or grams to convert it.');
      if (grams > 1e9) return c.error('That weight is too large. Please check the numbers.');
      var totalRatti = Math.round(grams / RATTI * 100) / 100, tN = Math.floor(totalRatti / 96), rem = totalRatti - tN * 96, mN = Math.floor(rem / 8), rN = Math.round((rem - mN * 8) * 100) / 100;
      var plain = (tN ? tN + ' tola ' : '') + (mN ? mN + ' masha ' : '') + (rN ? U.fmt(rN, 2) + ' ratti' : '');
      var out = U.grid([U.box('Weight in grams', U.fmt(grams, 3) + ' g', '', true), U.box('Weight in tola', U.fmt(grams / TOLA, 4), ''), U.box('As tola-masha-ratti', U.esc(plain.trim() || '0'))]);
      out += '<div style="margin-top:16px">' + U.table(['Unit', 'Weight'], [
        ['Tola', U.fmt(grams / TOLA, 4)], ['Masha', U.fmt(grams / MASHA, 3)], ['Ratti', U.fmt(grams / RATTI, 2)],
        ['Gram', U.fmt(grams, 3)], ['Kilogram', U.fmt(grams / 1000, 5)], ['Troy ounce', U.fmt(grams / OZ, 4)]]) + '</div>';
      var p = U.num(v.price);
      if (U.isNum(p) && p > 0) {
        var mk = U.num(v.mk); mk = U.isNum(mk) && mk > 0 ? mk : 0;
        var val = grams / TOLA * p, make = val * mk / 100;
        out += '<div style="margin-top:16px">' + U.grid([U.box('Gold value', rs(val)), U.box('Making charges' + (mk ? ' (' + U.fmt(mk, 2) + '%)' : ''), rs(make)), U.box('Total', rs(val + make), '', true)]) +
          '<p class="result-note">Price per gram works out to ' + rs(p / TOLA) + '. Jewellers may round the weight or add other charges, so treat this as an estimate.</p></div>';
      }
      out += '<p class="result-note">Uses 1 tola = 11.6638 g. Some shops round a tola to 11.66 g, which changes a one-tola result by less than 0.01 g.</p>';
      c.html(out);
    }
  });
};
