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
const A = JSON.parse(fs.readFileSync('D:/GM_Claude/data/cornerstone-attendance.json', 'utf8'));
const t = A.tracker, h = A.hr, P = x => (x * 100).toFixed(1) + '%', who = Object.fromEntries(t.summary.map(x => [x.id, x]));
need['employee-attendance-productivity-tracking-excel'] = [t.workingDays + ' working days', t.entries + ' entries', P(who.E03.att), P(who.E02.att), String(t.teamWorking) + ' possible days', t.teamApproved + ' days of approved leave', t.teamUA + ' unapproved days', t.teamPresent + ' days were attended', P(t.teamAtt), P(t.teamAdj), t.teamLT + ' late arrivals totalling ' + t.summary.reduce((a, x) => a + x.lateMin, 0) + ' minutes',
  ...t.productivity.map(p => p.perHour.toFixed(2)), ...t.productivity.flatMap(p => [String(p.hours), p.orders.toLocaleString('en-US')]), String(t.opsHours), t.opsOrders.toLocaleString('en-US'), t.opsPerHour.toFixed(2)];
if (!(who.E03.att === Math.min(...t.summary.map(x => x.att)) && who.E02.att === who.E04.att && who.E02.att === who.E07.att && who.E02.adj === who.E02.att && who.E04.adj === 1 && who.E07.adj === 1)) throw new Error('claims about individuals do not hold');
const simpleOps = t.productivity.reduce((a, p) => a + p.perHour, 0) / t.productivity.length;
const dm = h.deptMar, visibleUA = dm.Operations.ua + dm.Sales.ua + dm.Warehouse.ua;
need['hr-attendance-dashboard-excel'] = [h.rows + ' rows', P(h.months.Mar.att), P(h.simpleAvgMar), P(h.months.Mar.adj), ...['Jan', 'Feb', 'Mar'].flatMap(m => [P(h.months[m].att), P(h.months[m].adj)]), ...Object.entries(dm).filter(([k, v]) => v.people >= 5).flatMap(([k, v]) => [P(v.att), P(v.adj)]), dm.Warehouse.ua + ' of the ' + h.months.Mar.ua + ' unapproved days', 'doubled from ' + h.months.Feb.ua + ' to ' + h.months.Mar.ua, '1 + 1 + 6 = ' + visibleUA];
if (!(visibleUA === h.months.Mar.ua && dm.Accounts.ua === 0 && dm.Warehouse.ua2 === 1 && h.months.Feb.approved - h.months.Mar.approved === 2 && h.months.Mar.ua === 2 * h.months.Feb.ua && (h.months.Mar.adj - h.months.Mar.att) > 0.02)) throw new Error('dashboard claims do not hold');
// table rows in the monthly table must match the data exactly
const monthRow = (name, m) => `<tr><td>${name}</td><td>${P(h.months[m].att)}</td><td>${P(h.months[m].adj)}</td><td>${h.months[m].approved}</td><td>${h.months[m].ua}</td><td>${h.months[m].late}</td></tr>`;
const hrBody = POSTS.find(p => p.slug === 'hr-attendance-dashboard-excel').body;
for (const [name, m] of [['January', 'Jan'], ['February', 'Feb'], ['March', 'Mar']]) if (!hrBody.includes(monthRow(name, m))) throw new Error('monthly table row wrong: ' + name);
for (const [k, v] of Object.entries(dm)) if (v.people >= 5 && !hrBody.includes(`<tr><td>${k}</td><td>${v.people}</td><td>${P(v.att)}</td><td>${P(v.adj)}</td><td>${v.ua}</td><td>${v.ua2}</td></tr>`)) throw new Error('department row wrong: ' + k);
console.log('table rows and claims about people, months and departments hold | average of four hourly rates would be', simpleOps.toFixed(3), 'vs team rate', t.opsPerHour.toFixed(3));
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
