// Checks the calculator lab maths against answers worked out by hand. Usage: node build/test-calc-lab.mjs
import '../assets/js/calc-lab.js';
const { math, parse } = globalThis.GMCalcLab;
let pass = 0, fail = 0;
const near = (a, b) => Math.abs(a - b) < 0.005;
const val = (r, label) => (r.rows.find(x => x[0] === label) || [])[1];
const check = (name, ok, info) => { ok ? pass++ : (fail++, console.log('FAIL', name, JSON.stringify(info))); };
const N = NaN;
let r = math.growth({ old: 800000, now: 1000000, n: 2 });
check('growth 25%', near(val(r, 'Growth'), 25) && val(r, 'Change') === 200000, r);
check('compound 11.80%', near(val(r, 'Compound rate per period'), 11.80), r);            // sqrt(1.25) - 1
r = math.growth({ old: 1000, now: 750, n: N }); check('decline -25%', near(val(r, 'Growth'), -25) && val(r, 'Change') === -250, r);
r = math.growth({ old: 0, now: 500, n: N }); check('from zero: no percent', val(r, 'Growth') === undefined && /zero/.test(r.note), r);
check('zero periods refused', !!math.growth({ old: 1, now: 2, n: 0 }).error);
check('negative refused', !!math.growth({ old: -1, now: 2, n: N }).error);
check('incomplete gives nothing', math.growth({ old: 1, now: N, n: N }) === null);
r = math.turnover({ cogs: 1200000, open: 180000, close: 220000, days: 365 });
check('turnover 6', near(val(r, 'Inventory turnover'), 6) && val(r, 'Average stock') === 200000, r);
check('days of stock 60.83', near(val(r, 'Days of stock'), 60.83), r);                     // 365 / 6
check('zero stock refused', !!math.turnover({ cogs: 100, open: 0, close: 0, days: 365 }).error);
r = math.turnover({ cogs: 0, open: 10, close: 10, days: 30 }); check('no sales: no days figure', val(r, 'Days of stock') === undefined && /No goods/.test(r.note), r);
r = math.productivity({ out: 2400, hours: 480, people: 3, prev: 4 });
check('5 per hour, 800 per person', val(r, 'Output per hour') === 5 && val(r, 'Output per person') === 800 && val(r, 'Hours per person') === 160, r);
check('+25%', near(val(r, 'Change in output per hour'), 25), r);
check('zero hours refused', !!math.productivity({ out: 5, hours: 0, people: N, prev: N }).error);
check('half a person refused', !!math.productivity({ out: 5, hours: 5, people: 1.5, prev: N }).error);
r = math.attendance({ days: 26, present: 23, leave: 2, goal: 90 });
check('88.46%', near(val(r, 'Attendance'), 88.46), r);                                     // 23/26
check('95.83% excluding leave', near(val(r, 'Excluding approved leave'), 95.83), r);       // 23/24
check('needs 24 days', val(r, 'Days needed for 90%') === 24 && /Short by 1/.test(r.note), r); // 0.9*26=23.4
r = math.attendance({ days: 20, present: 18, leave: N, goal: 90 }); check('exactly 90% is met (no rounding slip)', val(r, 'Days needed for 90%') === 18 && /is met/.test(r.note), r);
r = math.attendance({ days: 100, present: 70, leave: N, goal: 70 }); check('exactly 70% is met', val(r, 'Days needed for 70%') === 70, r);
check('present over days refused', !!math.attendance({ days: 20, present: 21, leave: N, goal: N }).error);
check('present plus leave over days refused', !!math.attendance({ days: 20, present: 19, leave: 2, goal: N }).error);
check('goal over 100 refused', !!math.attendance({ days: 20, present: 19, leave: N, goal: 101 }).error);
check('parse commas', parse('1,200,000') === 1200000 && parse(' 12.5 ') === 12.5);
check('parse empty and junk', Number.isNaN(parse('')) && parse('abc') === -Infinity && parse('12abc') === -Infinity && parse('1e9') === -Infinity);
check('junk is refused', !!math.growth({ old: parse('abc'), now: 5, n: N }).error);
console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
