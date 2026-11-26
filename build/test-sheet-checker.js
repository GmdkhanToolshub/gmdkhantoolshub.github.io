/* node build/test-sheet-checker.js : rule tests on made-up data, including cases that must NOT be flagged. */
const S = require('../assets/js/sheet-checker/core.js');
let pass = 0, fail = 0;
function eq(name, got, want) { if (JSON.stringify(got) === JSON.stringify(want)) pass++; else { fail++; console.log('FAIL', name, 'got', JSON.stringify(got), 'want', JSON.stringify(want)); } }
const run = (csv, o) => S.analyse(S.parseCsv(csv), o);
const types = r => { const c = {}; r.findings.forEach(f => c[f.type] = (c[f.type] || 0) + 1); return c; };

const items = ['Rice 5kg', 'Rice 2kg', 'Sugar', 'Tea'], areas = ['North', 'South'];
const clean = 'Invoice No,Date,Item,Area,Phone,Qty,Rate,Total\n' + Array.from({ length: 24 }, (_, i) => `A-${i},2026-10-${String(i % 28 + 1).padStart(2, '0')},${items[i % 4]},${areas[i % 2]},0300000${100 + i},${i % 5 + 1},100,${(i % 5 + 1) * 100}`).join('\n') + '\n';
eq('clean file has no flags', run(clean).findings, []);
eq('clean file rows', run(clean).dataRows, 24);
eq('clean file totals compared', run(clean).compared, 24);

const lines = clean.trim().split('\n');
const edit = (n, f) => { const l = lines.slice(); l[n] = f(l[n].split(',')).join(','); return l.join('\n'); };
eq('repeat row', types(run(clean + lines[3])), { repeat: 1 });
eq('same sale, new invoice is not a repeat', types(run(clean + lines[3].replace('A-2,', 'A-99,'))), {});
eq('missing value', types(run(edit(2, c => (c[3] = '', c)))), { missing: 1 });
eq('wrong total', types(run(edit(2, c => (c[7] = '999', c)))), { total: 1 });
eq('rounding allowed', types(run('Item,Qty,Rate,Total\nA,3,33.33,99.99\nB,3,0.333,1\n')), {});
eq('mixed date', types(run(edit(2, c => (c[1] = '02 Oct 2026', c)))), { datemix: 1 });
const t = v => ({ v, t: 'text' });
const mostlyText = [{ n: 1, c: [t('Date'), t('Item')] }].concat(['01/10/2026', '02/10/2026', '03/10/2026'].map((d, i) => ({ n: i + 2, c: [t(d), t('x' + i)] })), [{ n: 5, c: [{ v: '2026-10-04', t: 'date' }, t('y')] }]);
eq('real Excel dates are not the flagged ones', S.analyse(mostlyText).findings.filter(f => f.type === 'datemix').map(f => f.row), [2, 3, 4]);
eq('impossible date', types(run(edit(2, c => (c[1] = '2026-02-30', c)))), { unreadable: 1 });
eq('text number', types(run(edit(2, c => (c[6] = 'Rs 100', c)))), { textnum: 1 });
eq('word in number column', types(run(edit(2, c => (c[5] = 'two', c)))), { unreadable: 1 });
eq('spelling by case', types(run(edit(2, c => (c[3] = 'SOUTH ', c)))), { spelling: 1 });
eq('5kg and 2kg stay separate', types(run(clean)), {});
eq('decimal sizes stay separate', types(run('Item,Qty\n' + 'Oil 1.5L,1\nOil 15L,2\n'.repeat(6).trim())).spelling, undefined);
eq('repeated heading and total row', types(run(clean + lines[0] + '\n,,Total,,,,,5000\n')), { header: 1, totalrow: 1 });
eq('blank row in middle', types(run(lines.slice(0, 4).concat([''], lines.slice(4)).join('\n'))), { blank: 1 });
eq('trailing blank rows ignored', types(run(clean + '\n,,,,,,,\n\n')), {});
eq('title rows above heading', run('October report\n\n' + clean).headerRow, 3);
eq('Urdu names stay separate', types(run('Item,Qty\n' + 'چاول,1\nچینی,2\n'.repeat(6).trim())).spelling, undefined);
eq('mostly empty column not flagged', types(run('Item,Note,Qty\nA,,1\nB,,2\nC,x,3\nD,,4\n')), {});
eq('no total columns gives a note', run('Name,City\nAmna,Lahore\nUmar,Multan\n').notes.length, 1);
eq('chosen columns respected', run('A,B,C\nx,2,5\n2,3,6\n', { roles: { qty: 0, rate: 1, total: 2 } }).compared, 1);
let threw = false; try { run('1,2,3\n4,5,6\n'); } catch (e) { threw = true; } eq('no heading is refused', threw, true);

[['1,234', 1234], ['12,34,567', 1234567], ['Rs.780', 780], ['690/-', 690], ['6 pcs', 6], ['$1,200.50', 1200.5], ['(500)', -500], ['1,5', null], ['5kg', null], ['S-1001', null], ['', null], ['12 34', null]].forEach(([s, w]) => eq('number ' + s, S.parseNumber(s), w));
eq('ambiguous date', S.dateStyle({ v: '04/10/2026', t: 'text' }).ambiguous, true);
eq('day-first date', S.dateStyle({ v: '25/10/2026', t: 'text' }).order, 'dmy');
eq('formula in export is defused', S.csvSafe('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
eq('quoted csv', S.parseCsv('a,b\n"x,y","he said ""hi"""\n')[1].c.map(c => c.v), ['x,y', 'he said "hi"']);
console.log(`passed ${pass}, failed ${fail}`);
process.exit(fail ? 1 : 0);
