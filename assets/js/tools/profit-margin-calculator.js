NiaziTools['profit-margin-calculator'] = function (root, U) {
  var CUR = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD', 'AUD'];
  root.innerHTML = '<div id="pm-body"></div>';
  var mode = 0, bodies = [
    function () {
      return U.mount(root.querySelector('#pm-body'), {
        fields: [
          { id: 'rev', label: 'Revenue / sales', type: 'number', value: '' },
          { id: 'cogs', label: 'Cost of goods sold (COGS)', type: 'number', value: '' },
          { id: 'opex', label: 'Operating expenses (optional)', type: 'number', value: '0' },
          { id: 'other', label: 'Tax, interest & other costs (optional)', type: 'number', value: '0' },
          { id: 'cur', label: 'Currency', type: 'select', options: CUR, value: 'USD' }
        ],
        onInput: function (v, c) {
          if (!v.rev.trim() && !v.cogs.trim()) return c.empty('Enter revenue and cost of goods sold to see profit and margin.');
          var r = U.num(v.rev), cg = U.num(v.cogs), o = U.num(v.opex || '0'), ot = U.num(v.other || '0');
          if (!(r > 0)) return c.error('Revenue must be a number greater than zero.');
          if (!(cg >= 0) || !(o >= 0) || !(ot >= 0)) return c.error('Costs must be numbers of zero or more.');
          var gp = r - cg, op = gp - o, np = op - ot, m = function (n) { return U.money(n, v.cur); };
          c.html(U.grid([
            U.box('Gross profit margin', U.pct(gp / r * 100), gp >= 0 ? 'pos' : 'neg', true),
            U.box('Gross profit', m(gp), gp >= 0 ? 'pos' : 'neg'), U.box('Operating profit', m(op), op >= 0 ? 'pos' : 'neg'), U.box('Net profit', m(np), np >= 0 ? 'pos' : 'neg'),
            U.box('Operating margin', U.pct(op / r * 100)), U.box('Net margin', U.pct(np / r * 100)),
            U.box('Markup on cost', cg > 0 ? U.pct(gp / cg * 100) : 'n/a')
          ]) + '<p class="result-note">Gross margin = (Revenue − COGS) ÷ Revenue. Markup = Profit ÷ Cost. They are different measures: a 50% markup equals a 33.3% margin.</p>');
        }
      });
    },
    function () {
      return U.mount(root.querySelector('#pm-body'), {
        fields: [
          { id: 'cost', label: 'Cost per unit', type: 'number', value: '' },
          { id: 'margin', label: 'Desired profit margin (%)', type: 'number', value: '30', hint: 'Must be below 100%.' },
          { id: 'cur', label: 'Currency', type: 'select', options: CUR, value: 'USD' }
        ],
        onInput: function (v, c) {
          if (!v.cost.trim()) return c.empty('Enter a unit cost and a target margin to get the selling price.');
          var cost = U.num(v.cost), mg = U.num(v.margin);
          if (!(cost >= 0)) return c.error('Cost must be zero or more.');
          if (!(mg >= 0 && mg < 100)) return c.error('Margin must be at least 0 and below 100.');
          var price = cost / (1 - mg / 100), profit = price - cost;
          c.html(U.grid([U.box('Selling price needed', U.money(price, v.cur), '', true), U.box('Profit per unit', U.money(profit, v.cur), 'pos'), U.box('Equivalent markup', cost > 0 ? U.pct(profit / cost * 100) : 'n/a')]) +
            '<p class="result-note">Price = Cost ÷ (1 − Margin).</p>');
        }
      });
    }
  ];
  U.tabs(root, ['Profit & margin', 'Price from target margin'], function (i) { mode = i; bodies[i](); });
  bodies[0]();
};
