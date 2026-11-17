/* Electricity bill calculator for Pakistan. You enter your own per-unit rate, so it stays correct when tariffs change.
   Tab 1 adds up the units (kWh) your appliances use. Tab 2 turns units into a bill and shows what saving units would do. */
NiaziTools['electricity-bill-calculator'] = function (root, U) {
  var APP = [
    ['fan', 'Ceiling fan', 75, 12], ['led', 'LED bulb', 12, 6], ['fridge', 'Refrigerator (about 60 W average)', 60, 24], ['ac', 'AC 1.5 ton, standard', 1500, 6],
    ['inv', 'AC 1.5 ton, inverter (about 800 W average)', 800, 6], ['tv', 'LED TV', 80, 4], ['wm', 'Washing machine', 400, 1], ['iron', 'Electric iron', 1000, 0.5],
    ['pump', 'Water pump / motor', 750, 0.5], ['pc', 'Laptop or desktop', 100, 6], ['geyser', 'Electric geyser', 3000, 0.5]
  ];
  var inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  function rs(n) { return 'Rs ' + inr.format(Math.round(n)); }
  var mode = 0;
  function build() {
    var body = root.querySelector('#eb-body');
    if (mode === 0) {
      var fields = [];
      APP.forEach(function (a) {
        fields.push({ id: a[0] + 'q', label: a[1] + ': how many', type: 'number', placeholder: '0', min: 0 });
        fields.push({ id: a[0] + 'h', label: a[1] + ': hours per day', type: 'number', value: String(a[3]), min: 0, max: 24, hint: a[2] + ' W each' });
      });
      fields.push({ id: 'ow', label: 'Other appliance: watts', type: 'number', placeholder: 'e.g. 250' }, { id: 'oq', label: 'Other appliance: how many', type: 'number', placeholder: '0' }, { id: 'oh', label: 'Other appliance: hours per day', type: 'number', placeholder: '0' });
      fields.push({ id: 'days', label: 'Days in the month', type: 'number', value: '30' }, { id: 'rate', label: 'Your price per unit (Rs)', type: 'number', placeholder: 'e.g. 45', hint: 'Divide your last bill total by its units for an average rate that includes taxes.' });
      U.mount(body, {
        before: '<p class="small muted" style="margin-top:0">Fill in the appliances you use. One unit on your bill is one kilowatt-hour (kWh). Watts are typical values, so adjust the hours to match your home.</p>',
        fields: fields,
        onInput: function (v, c) {
          var days = U.num(v.days); if (!(days > 0 && days <= 31)) return c.error('Days in the month must be between 1 and 31.');
          var rows = [], total = 0, bad = false;
          function add(name, w, q, h) { if (!(q > 0) || !(h > 0)) return; var kwh = w * q * h * days / 1000; total += kwh; rows.push([U.esc(name), U.fmt(q, 0) + ' × ' + U.fmt(w, 0) + ' W × ' + U.fmt(h, 2) + ' h', kwh]); }
          APP.forEach(function (a) { var q = U.num(v[a[0] + 'q']), h = U.num(v[a[0] + 'h']); if (v[a[0] + 'h'].trim() !== '' && (!U.isNum(h) || h < 0 || h > 24)) bad = true; add(a[1], a[2], q, h); });
          var ow = U.num(v.ow), oq = U.num(v.oq), oh = U.num(v.oh); if (ow > 0) add('Other appliance', ow, oq, oh);
          if (bad) return c.error('Hours per day must be a number from 0 to 24.');
          if (!rows.length) return c.empty('Enter how many of each appliance you use to see your monthly units.');
          rows.sort(function (a, b) { return b[2] - a[2]; });
          var rate = U.num(v.rate), has = U.isNum(rate) && rate > 0;
          var tr = rows.map(function (r) { return [r[0], r[1], U.fmt(r[2], 1) + ' kWh', has ? rs(r[2] * rate) : '–', U.fmt(r[2] / total * 100, 0) + '%']; });
          var out = U.grid([U.box('Units per month', U.fmt(total, 1) + ' kWh', '', true), U.box('Units per day', U.fmt(total / days, 2) + ' kWh'), U.box(has ? 'Estimated bill' : 'Estimated bill', has ? rs(total * rate) : 'Add your rate')]);
          out += '<div style="margin-top:16px">' + U.table(['Appliance', 'Calculation', 'Units', 'Cost', 'Share'], tr, 2) + '</div>';
          out += '<p class="result-note">Units = watts × number × hours per day × days ÷ 1000. Your real bill depends on your tariff slabs, fixed charges and taxes, so it will not match to the rupee.</p>';
          c.html(out);
        }
      });
    } else {
      U.mount(body, {
        before: '<p class="small muted" style="margin-top:0">Look at your last bill for the units used and the per-unit rate or the total. Enter your own numbers so the result stays right when tariffs change.</p>',
        fields: [
          { id: 'u', label: 'Units used (kWh)', type: 'number', placeholder: 'e.g. 350' },
          { id: 'r', label: 'Average price per unit (Rs)', type: 'number', placeholder: 'e.g. 40' },
          { id: 'fx', label: 'Fixed charges (Rs)', type: 'number', placeholder: '0', hint: 'Fixed or minimum charges on the bill, if any.' },
          { id: 'tx', label: 'Taxes and surcharges (%)', type: 'number', placeholder: '0', hint: 'Combined GST, duties and surcharges as a percentage of energy plus fixed charges.' },
          { id: 'ex', label: 'Other fixed amounts (Rs)', type: 'number', placeholder: '0', hint: 'TV fee, arrears, meter rent or anything added after tax.' }
        ],
        onInput: function (v, c) {
          if (v.u.trim() === '' && v.r.trim() === '') return c.empty('Enter your units and price per unit.');
          var u = U.num(v.u), r = U.num(v.r), fx = U.num(v.fx || '0'), tx = U.num(v.tx || '0'), ex = U.num(v.ex || '0');
          if (!U.isNum(u) || u < 0 || !U.isNum(r) || r < 0) return c.error('Please enter valid units and a price per unit.');
          if (!U.isNum(fx) || fx < 0 || !U.isNum(tx) || tx < 0 || tx > 100 || !U.isNum(ex) || ex < 0) return c.error('Fixed charges, taxes (0–100%) and other amounts must be zero or more.');
          function bill(units) { var e = units * r, sub = e + fx, t = sub * tx / 100; return { e: e, sub: sub, t: t, tot: sub + t + ex }; }
          var b = bill(u);
          var out = U.grid([U.box('Estimated bill', rs(b.tot), '', true), U.box('Energy charge', rs(b.e)), U.box('Taxes and surcharges', rs(b.t))]);
          if (u > 0) out += '<p class="result-note">All-in cost works out to ' + rs(b.tot / u) + ' per unit.</p>';
          if (u > 0) {
            out += '<div style="margin-top:16px"><b>If you cut your usage</b>' + U.table(['Cut', 'Units', 'Bill', 'You save'], [10, 20, 30].map(function (p) {
              var nu = u * (1 - p / 100), nb = bill(nu).tot; return [p + '% less', U.fmt(nu, 0), rs(nb), rs(b.tot - nb)];
            }), 1) + '</div>';
          }
          out += '<p class="result-note">This uses one average rate. Real bills in Pakistan can charge higher rates as your units go up, so use the average rate printed on your own bill for the best match.</p>';
          c.html(out);
        }
      });
    }
  }
  root.innerHTML = '<div id="eb-body"></div>';
  U.tabs(root, ['Appliance units', 'Bill from units'], function (i) { mode = i; build(); });
  build();
};
