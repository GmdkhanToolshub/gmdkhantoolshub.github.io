// Every figure quoted in the two cornerstone guides must follow from data/cornerstone-examples.json,
// and no unexplained large number or percentage may appear. Usage: node build/check-guide-figures.mjs
import fs from 'fs';
import POSTS from './posts-cornerstone.mjs';
const J = JSON.parse(fs.readFileSync('D:/GM_Claude/data/cornerstone-examples.json', 'utf8'));
const d = J.dashboard, v = J.inventory, it = Object.fromEntries(v.items.map(x => [x.code, x]));
const n = x => Math.round(x).toLocaleString('en-US'), f1 = x => x.toFixed(1), pct = x => (x * 100).toFixed(1) + '%';
const received = v.items.reduce((s, x) => s + x.inQty * x.cost, 0);
if (v.openValue + received - v.cogs !== v.closeValue) throw new Error('stock reconciliation does not hold');
const diff = r => d.regionsMar[r].sales - d.regionsMar[r].target;
const need = {
  'excel-dashboard-guide-business-reporting': [n(d.marSales), n(d.marTarget), pct(d.marAch), n(-d.marGap), '+' + pct(d.marGrowth), pct(d.simpleAvgAch), pct(d.months.Mar.target / d.months.Feb.target - 1), n(d.sales), String(d.rows) + ' rows',
    ...['North', 'South', 'East', 'West'].flatMap(r => [n(d.regionsMar[r].sales), n(d.regionsMar[r].target), pct(d.regionsMar[r].sales / d.regionsMar[r].target), n(Math.abs(diff(r)))])],
  'inventory-management-using-excel': [n(v.openValue), n(v.closeValue), n(v.cogs), n(received), n((v.openValue + v.closeValue) / 2), v.turnover.toFixed(2), f1(v.daysOfStock) + ' days', String(it.P04.outQty) + ' units', it.P04.daily.toFixed(2), f1(it.P04.rop), String(it.P04.closing) + ' are on hand', f1(it.P04.cover), f1(it.P08.cover),
    String(it.P06.closing) + ' on hand against ' + f1(it.P06.rop), String(it.P07.closing) + ' against ' + f1(it.P07.rop), it.P04.lead + '-day lead time', it.P04.safety + ' units of safety stock']
};
let fail = 0;
for (const p of POSTS) {
  const text = p.body.replace(/<section class="refs">[\s\S]*?<\/section>/g, ' ').replace(/<(figure|p class="guide-dl")[\s\S]*?<\/(figure|p)>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const missing = need[p.slug].filter(x => !text.includes(x));
  const allowed = new Set(need[p.slug].flatMap(x => x.match(/\d[\d,]*\.?\d*%?/g) || []));
  const extra = [...new Set(text.match(/\d{1,3}(,\d{3})+|\d+\.\d+%?|\d+%/g) || [])].filter(x => !allowed.has(x));
  console.log(p.slug, '| required figures', need[p.slug].length, '| missing:', missing.join(' ; ') || 'none', '| other numbers to review:', extra.join(' ') || 'none');
  fail += missing.length;
}
const a = v.items.filter(x => x.abc === 'A').length, b = v.items.filter(x => x.abc === 'B').length, c = v.items.filter(x => x.abc === 'C').length;
console.log('ABC counts', a, b, c, '| flagged reorder:', v.items.filter(x => x.status === 'Reorder').map(x => x.name).join(', '), '| flagged items with cover above lead time:', v.items.filter(x => x.status === 'Reorder').every(x => x.cover > x.lead));
process.exit(fail ? 1 : 0);
