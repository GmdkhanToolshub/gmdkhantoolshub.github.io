/* Zakat Calculator: 2.5% of zakatable wealth held for a lunar year, if it meets the nisab.
   Gold and silver prices are entered by the user (no price feed), so it works offline and costs nothing. */
NiaziTools['zakat-calculator'] = function (root, U) {
  var TOLA = 11.6638; // grams in one tola
  var NISAB = { silver: 612.36, gold: 87.48 }; // grams: 52.5 tola silver, 7.5 tola gold
  U.mount(root, {
    before: '<p class="small muted" style="margin-top:0">Enter today\'s local prices and what you own on your zakat date. Leave anything that does not apply blank.</p>',
    fields: [
      { id: 'cur', label: 'Currency', type: 'select', value: 'PKR', options: ['PKR', 'USD', 'GBP', 'EUR', 'AED', 'SAR', 'INR'] },
      { id: 'unit', label: 'Weigh gold and silver in', type: 'select', value: 'tola', options: [{ value: 'tola', label: 'Tola' }, { value: 'g', label: 'Grams' }] },
      { id: 'gp', label: 'Gold price (per tola or gram)', type: 'number', placeholder: 'Today\'s price', hint: 'Use the 24-carat price per unit chosen above.' },
      { id: 'sp', label: 'Silver price (per tola or gram)', type: 'number', placeholder: 'Today\'s price' },
      { id: 'gw', label: 'Gold you own (weight)', type: 'number', placeholder: '0' },
      { id: 'sw', label: 'Silver you own (weight)', type: 'number', placeholder: '0' },
      { id: 'cash', label: 'Cash at home and in bank accounts', type: 'number', placeholder: '0' },
      { id: 'inv', label: 'Savings, shares and investments', type: 'number', placeholder: '0', hint: 'Current value of shares, mutual funds, prize bonds and similar.' },
      { id: 'biz', label: 'Business stock and trade goods', type: 'number', placeholder: '0', hint: 'Value goods for sale at their current selling value.' },
      { id: 'rec', label: 'Money others owe you (expected to be repaid)', type: 'number', placeholder: '0' },
      { id: 'debt', label: 'Debts and bills due now', type: 'number', placeholder: '0', hint: 'Deduct only debts payable now, not the full balance of long-term loans.' },
      { id: 'basis', label: 'Nisab standard', type: 'select', value: 'silver', options: [{ value: 'silver', label: 'Silver (52.5 tola / 612.36 g) — more cautious' }, { value: 'gold', label: 'Gold (7.5 tola / 87.48 g)' }] }
    ],
    onInput: function (v, c) {
      var n = function (k) { var x = U.num(v[k]); return U.isNum(x) && x > 0 ? x : 0; };
      var per = v.unit === 'tola' ? TOLA : 1, cur = v.cur;
      var gp = n('gp') / per, sp = n('sp') / per; // price per gram
      var gold = n('gw') * per * gp, silver = n('sw') * per * sp;
      var assets = gold + silver + n('cash') + n('inv') + n('biz') + n('rec'), net = assets - n('debt');
      var price = v.basis === 'gold' ? gp : sp;
      if (!assets && !n('debt')) return c.empty('Enter your gold and silver prices and what you own to see your zakat.');
      if (!price) return c.error('Enter today\'s ' + v.basis + ' price to work out the nisab.');
      if ((n('gw') && !gp) || (n('sw') && !sp)) return c.error('Enter the price for the gold or silver weight you entered.');
      var nisab = NISAB[v.basis] * price, due = net >= nisab, zakat = due ? net * 0.025 : 0, m = function (x) { return U.money(x, cur, 0); };
      c.html(U.grid([U.box('Zakat payable (2.5%)', m(zakat), due ? 'pos' : '', true)]) +
        U.grid([U.box('Total zakatable assets', m(assets)), U.box('Less debts due', m(n('debt'))), U.box('Net wealth', m(net)), U.box('Nisab (' + v.basis + ')', m(nisab))]) +
        U.table(['Item', 'Value'], [['Gold', m(gold)], ['Silver', m(silver)], ['Cash and bank', m(n('cash'))], ['Savings and investments', m(n('inv'))], ['Business stock', m(n('biz'))], ['Money owed to you', m(n('rec'))]], 1) +
        '<p class="result-note">' + (due ? 'Your net wealth is at or above the nisab, so zakat is due if you have held it for one lunar (Hijri) year.' : 'Your net wealth is below the nisab, so no zakat is due on these figures.') +
        ' This is a general guide. Rulings on jewellery, pensions, property and debts differ between scholars, so please confirm your situation with a qualified scholar.</p>');
    }
  });
};
