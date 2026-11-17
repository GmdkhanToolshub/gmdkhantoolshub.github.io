/* Fuel cost calculator: trip cost, cost per km and monthly commute cost from distance, mileage and petrol/diesel price. */
NiaziTools['fuel-cost-calculator'] = function (root, U) {
  var inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  function rs(n) { return 'Rs ' + inr.format(Math.round(n)); }
  U.mount(root, {
    fields: [
      { id: 'd', label: 'Distance (one way)', type: 'number', placeholder: 'e.g. 25' },
      { id: 'du', label: 'Distance unit', type: 'select', value: 'km', options: [{ value: 'km', label: 'Kilometres' }, { value: 'mi', label: 'Miles' }] },
      { id: 'm', label: 'Mileage (km per litre)', type: 'number', placeholder: 'e.g. 12', hint: 'Small cars are often 10–16 km/l and motorbikes 35–55 km/l. Use your own average.' },
      { id: 'p', label: 'Fuel price per litre (Rs)', type: 'number', placeholder: 'Today\'s pump price' },
      { id: 'rt', label: 'Round trip (go and come back)', type: 'checkbox', value: true },
      { id: 'n', label: 'Trips per month', type: 'number', value: '1', hint: 'For a daily commute of about 26 working days, enter 26.' },
      { id: 'x', label: 'Tolls and parking per trip (Rs)', type: 'number', placeholder: '0' },
      { id: 'pp', label: 'People sharing the cost', type: 'number', value: '1' }
    ],
    onInput: function (v, c) {
      if (v.d.trim() === '' && v.m.trim() === '' && v.p.trim() === '') return c.empty('Enter the distance, your mileage and the fuel price.');
      var d = U.num(v.d), m = U.num(v.m), p = U.num(v.p), n = U.num(v.n), x = v.x.trim() ? U.num(v.x) : 0, pp = U.num(v.pp);
      if (!U.isNum(d) || d <= 0 || !U.isNum(m) || m <= 0 || !U.isNum(p) || p <= 0) return c.error('Please enter a distance, a mileage and a fuel price, all greater than zero.');
      if (!U.isNum(n) || n < 1 || !U.isNum(x) || x < 0 || !U.isNum(pp) || pp < 1) return c.error('Trips and people must be 1 or more, and tolls cannot be negative.');
      var km = (v.du === 'mi' ? d * 1.609344 : d) * (v.rt ? 2 : 1), litres = km / m, fuel = litres * p, trip = fuel + x * (v.rt ? 1 : 1);
      var out = U.grid([U.box('Cost per trip', rs(trip), '', true), U.box('Fuel needed', U.fmt(litres, 2) + ' litres'), U.box('Cost per km', rs(trip / km))]);
      out += '<div style="margin-top:16px">' + U.table(['', 'Amount'], [
        ['Distance per trip', U.fmt(km, 1) + ' km'], ['Fuel cost per trip', rs(fuel)], ['Tolls and parking per trip', rs(x)],
        ['Each person pays per trip' + (pp > 1 ? ' (' + U.fmt(pp, 0) + ' people)' : ''), rs(trip / pp)],
        ['Per month (' + U.fmt(n, 0) + ' trips)', rs(trip * n)], ['Per month, each person', rs(trip * n / pp)], ['Per year', rs(trip * n * 12)]]) + '</div>';
      c.html(out + '<p class="result-note">Real mileage changes with traffic, AC use, speed and tyre pressure. Fuel prices change often, so type today\'s pump price.</p>');
    }
  });
};
