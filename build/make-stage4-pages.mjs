// Builds /excel-formulas/ (from data/excel-formulas.json) and /business-calculators/, and adds both to the Resources menu.
// Safe to re-run. Order: python build/formula_library.py ; powershell -File build/verify-formulas.ps1 ; node build/make-stage4-pages.mjs ; python build/bump.py D:/GM_Claude
import fs from 'fs'; import path from 'path';
import { buildPage, esc, faqLd, faqHtml, ROOT } from './page-shell.mjs';
const data = JSON.parse(fs.readFileSync(ROOT + 'data/excel-formulas.json', 'utf8'));
const hero = (crumb, h1, lead) => `<section class="page-hero"><div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="../">Home</a></li><li aria-current="page">${esc(crumb)}</li></ol></nav><h1>${h1}</h1><p class="lead">${esc(lead)}</p></div></section>`;
const num = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const shown = f => f.format === 'p' ? (f.expected * 100).toFixed(1) + '%' : f.format === 'n2' ? num(f.expected, 2) : f.format === 'n' ? num(f.expected, Number.isInteger(f.expected) ? 0 : 2) : String(f.expected);

// ---------- Excel formula library
const cats = [...new Set(data.formulas.map(f => f.category))];
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cols = 'ABCDEFGHJ'.split('');
const headNames = [...data.head.slice(0, 8), data.head[8]];
const sample = `<div class="fx-scroll" tabindex="0" role="region" aria-label="Sample data used by the examples"><table class="fx-data"><caption class="sr-only">Sample sales data</caption><thead><tr><th></th>${cols.map(c => `<th>${c}</th>`).join('')}</tr><tr><th>1</th>${headNames.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${data.rows.map((r, i) => `<tr><th>${i + 2}</th>${r.map((v, c) => `<td>${esc(c === 5 || c === 6 || c === 7 ? num(v) : String(v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
<p class="small muted">Column I in the workbook is hidden. Names and figures are made up for practice.</p>
<div class="fx-scroll"><table class="fx-data fx-small"><caption>Sheet "Lookup"</caption><thead><tr><th></th><th>A</th><th>B</th><th>C</th><th>E</th></tr></thead><tbody>${data.lookup.map((r, i) => `<tr><th>${i + 1}</th>${r.map(v => `<td>${esc(String(v))}</td>`).join('')}<td>${i === 0 ? 'Messy name' : i === 1 ? '<code class="fx-pre">' + esc(data.messy) + '</code>' : ''}</td></tr>`).join('')}</tbody></table></div>`;
const card = f => `<article class="fx-card" id="${f.id}" data-cat="${slug(f.category)}"><h3>${esc(f.name)}</h3><p class="fx-syn"><span class="sr-only">Syntax: </span><code>${esc(f.syntax)}</code></p><p>${esc(f.what)}</p>
<div class="fx-ex"><code>${esc(f.example)}</code><button type="button" class="btn btn-ghost btn-sm fx-copy" data-copy="${esc(f.example)}" aria-label="Copy the ${esc(f.name)} example">Copy</button></div>
<p class="fx-res">Result with the sample data: <strong>${esc(shown(f))}</strong></p><p class="fx-tip"><strong>Watch out:</strong> ${esc(f.tip)}</p><p class="small muted fx-ver">${esc(f.since)}</p></article>`;
const fxFaq = [
  ['Do these formulas work in Google Sheets?', 'Many of them use the same names there, but they have only been checked in Microsoft Excel. Test any formula in Google Sheets before relying on it.'],
  ['Why do I see #NAME? in my Excel?', 'Your version does not have that function, or the name is misspelled. Each card shows which versions include it. XLOOKUP, FILTER and UNIQUE need Excel 2021 or Microsoft 365.'],
  ['Why does my formula need semicolons instead of commas?', 'Some regional settings use a semicolon to separate arguments. Replace the commas with semicolons if Excel rejects a formula.'],
  ['How were the results checked?', 'The example workbook was opened and recalculated in Microsoft Excel, and each result was compared with an answer worked out separately. That check covers the sample data only.'],
  ['Can I use the example workbook for work?', 'Yes, you can use and change it for your own work. The data in it is made up. Check your own results before sharing reports.']
];
buildPage({ slug: 'excel-formulas', title: 'Excel Formula Library with Examples | GM Tools Hub', desc: `${data.formulas.length} Excel formulas for sales, operations and HR reporting, with syntax, worked results, common mistakes, a copy button and a free example workbook.`, ld: [faqLd(fxFaq)],
  extraHead: '<link rel="stylesheet" href="../assets/css/stage4.css?v=00000000">\n',
  main: hero('Excel formula library', 'GM Excel <span class="gradient-text">Formula Library</span>', `${data.formulas.length} formulas for sales, operations and HR reporting. Each has the syntax, a worked example on the same sample data, the result and the mistake to avoid.`) +
`<section class="section"><div class="container fx-wrap">
<div class="btn-row"><a class="btn btn-primary" href="../assets/downloads/GM-Excel-Formula-Examples.xlsx" download>Download the example workbook (.xlsx)</a><a class="btn btn-ghost" href="../tools/excel-formula-generator/">Build a formula for your own cells</a></div>
<h2>Sample data</h2><p>All examples read from this sheet, named "Data", so you can check any result by hand.</p>${sample}
<h2>Find a formula</h2>
<div class="fx-tools"><label for="fx-q">Search by name or task<input id="fx-q" type="search" placeholder="e.g. lookup, count, growth" autocomplete="off"></label>
<div class="fx-chips" role="group" aria-label="Filter by category"><button type="button" class="fx-chip" data-cat="" aria-pressed="true">All</button>${cats.map(c => `<button type="button" class="fx-chip" data-cat="${slug(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</div>
<p class="small muted" id="fx-count" role="status" aria-live="polite">${data.formulas.length} formulas</p></div>
${cats.map(c => `<section class="fx-group" data-group="${slug(c)}"><h2>${esc(c)}</h2><div class="fx-grid">${data.formulas.filter(f => f.category === c).map(card).join('')}</div></section>`).join('')}
<p id="fx-none" hidden>No formula matches. Try a shorter word, such as "sum" or "date".</p>
<h2>Where to go next</h2><p>Read <a href="../blog/excel-formulas-sales-ops/">Excel formulas for sales operations</a>, try the <a href="../business-calculators/">business calculator lab</a>, or see the <a href="../shop/">ready-made Excel templates</a>.</p>
<h2>Questions</h2>${faqHtml(fxFaq)}
<p class="small muted">Function names are Microsoft's. For full reference pages, see <a href="https://support.microsoft.com/en-us/excel/functions/sumifs-function" target="_blank" rel="noopener noreferrer">Microsoft Support</a>. This library is general information; check results before using them for decisions.</p>
</div></section><script src="../assets/js/formula-library.js?v=00000000" defer></script>` });

// ---------- Business calculator lab
const inp = (id, label, value = '', hint = '') => `<label for="${id}">${label}<input id="${id}" type="text" inputmode="decimal" autocomplete="off" value="${value}">${hint ? `<small>${hint}</small>` : ''}</label>`;
const calc = (id, title, intro, fields, formula, example) => `<article class="bc-card" id="${id}"><h2>${title}</h2><p>${intro}</p><div class="bc-cols"><form class="bc-form" data-calc="${id}" novalidate onsubmit="return false">${fields}<button type="reset" class="btn btn-ghost btn-sm">Clear</button></form><div class="bc-out" id="${id}-out" role="status" aria-live="polite"><p class="muted">Enter your figures to see the result.</p></div></div>
<h3>How it is worked out</h3><ul class="bc-formula">${formula.map(x => `<li>${x}</li>`).join('')}</ul><p class="bc-eg"><strong>Example:</strong> ${example}</p></article>`;
const existing = [
  ['../tools/sales-target-calculator/', 'Target achievement and run-rate', 'Achievement %, daily sales still needed and the projected month-end figure.'],
  ['../tools/kpi-performance-calculator/', 'KPI scorecard', 'Weighted score across several KPIs, including lower-is-better measures and caps.'],
  ['../tools/profit-margin-calculator/', 'Profit margin and markup', 'Gross and net margin, markup and the price for a target margin.'],
  ['../tools/percentage-calculator/', 'Percentages', 'Percent of a number, change, difference, and adding or removing a percentage.'],
  ['../tools/salary-calculator/', 'Salary conversion', 'Hourly, daily, monthly and annual pay.'],
  ['../tools/loan-emi-calculator/', 'Loan instalment', 'Monthly payment, total interest and a repayment schedule.']];
const bcFaq = [
  ['What counts as a good inventory turnover?', 'It depends on the trade. Fresh food turns far faster than furniture. Compare with your own earlier periods and with businesses selling similar goods.'],
  ['Should approved leave count against attendance?', 'Organisations differ. The calculator shows both: attendance against all working days, and against working days after approved leave. Use the one your policy states, and show which you used.'],
  ['Why is growth not shown when the earlier figure is zero?', 'A percentage change from zero cannot be calculated. Report the amount of the change instead.'],
  ['Is anything I type sent to a server?', 'No. These calculators run in your browser and do not send or store what you enter.']
];
buildPage({ slug: 'business-calculators', title: 'Business Calculator Lab | GM Tools Hub', desc: 'Free business calculators for sales growth, inventory turnover, employee productivity and attendance, with formulas and examples, plus target, KPI and margin tools.', ld: [faqLd(bcFaq)],
  extraHead: '<link rel="stylesheet" href="../assets/css/stage4.css?v=00000000">\n',
  main: hero('Business calculator lab', 'GM Business <span class="gradient-text">Calculator Lab</span>', 'Calculators for sales, stock and team measures. Each shows how the result is worked out, so you can explain the number to others.') +
`<section class="section"><div class="container fx-wrap">
<nav class="bc-jump" aria-label="Calculators on this page"><a href="#growth">Sales growth</a><a href="#turnover">Inventory turnover</a><a href="#productivity">Productivity</a><a href="#attendance">Attendance</a><a href="#more">More calculators</a></nav>
${calc('growth', 'Sales growth', 'Compare two periods. Add the number of periods to see the average compound rate per period.',
  inp('gr-old', 'Earlier sales') + inp('gr-new', 'Later sales') + inp('gr-n', 'Periods between them (optional)', '', 'For example 3 for three years'),
  ['Change = later − earlier', 'Growth % = change ÷ earlier × 100', 'Compound rate per period = (later ÷ earlier)<sup>1 ÷ periods</sup> − 1'],
  'Sales rise from 800,000 to 1,000,000: a change of 200,000, or 25%. If that took 2 periods, the compound rate is about 11.80% per period.')}
${calc('turnover', 'Inventory turnover', 'How many times stock is sold and replaced in a period, and how many days it stays on the shelf. Use cost values, not selling prices.',
  inp('it-cogs', 'Cost of goods sold in the period') + inp('it-open', 'Opening stock (at cost)') + inp('it-close', 'Closing stock (at cost)') + inp('it-days', 'Days in the period', '365'),
  ['Average stock = (opening + closing) ÷ 2', 'Turnover = cost of goods sold ÷ average stock', 'Days of stock = days in the period ÷ turnover', 'A two-point average can mislead if stock swings during the period; use monthly averages if you have them.'],
  'Cost of goods sold 1,200,000, opening stock 180,000 and closing stock 220,000 over 365 days: average stock 200,000, turnover 6 times, about 60.8 days of stock.')}
${calc('productivity', 'Employee productivity', 'Output per hour and per person. Output can be units, orders, calls or sales value; use the same measure each time you compare.',
  inp('ep-out', 'Output in the period') + inp('ep-hours', 'Total hours worked by the team') + inp('ep-people', 'Number of people (optional)') + inp('ep-prev', 'Earlier output per hour (optional)'),
  ['Output per hour = output ÷ total hours', 'Output per person = output ÷ number of people', 'Change % = (this output per hour − earlier) ÷ earlier × 100', 'A single number does not show quality, difficulty or conditions. Do not rank people on it alone.'],
  '2,400 orders, 480 hours and 3 people: 5 orders per hour and 800 per person. Against an earlier 4 per hour, that is 25% higher.')}
${calc('attendance', 'Attendance percentage', 'Attendance for one person over a period, with and without approved leave.',
  inp('at-days', 'Working days in the period') + inp('at-present', 'Days present') + inp('at-leave', 'Approved leave days (optional)', '', 'Part of the absent days') + inp('at-goal', 'Required attendance % (optional)'),
  ['Attendance % = days present ÷ working days × 100', 'Excluding approved leave % = days present ÷ (working days − approved leave) × 100', 'Days needed to meet the requirement = required % × working days, rounded up'],
  '26 working days, 23 present and 2 on approved leave: 88.46% of all working days, or 95.83% excluding leave. To meet 90% of all working days, 24 days are needed.')}
<h2 id="more">More calculators</h2><div class="bc-links">${existing.map(([u, t, d]) => `<a class="bc-link" href="${u}"><b>${t}</b><span>${d}</span></a>`).join('')}</div>
<p>Prefer a spreadsheet? Use the <a href="../excel-formulas/">Excel formula library</a> or see the <a href="../shop/">ready-made templates</a>.</p>
<h2>Questions</h2>${faqHtml(bcFaq)}
<p class="small muted">Results are estimates from the figures you enter. They are not accounting or HR policy advice.</p>
</div></section><script src="../assets/js/calc-lab.js?v=00000000" defer></script>` });

// ---------- Resources menu: two entries on every page that has the menu
let nav = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name), rel = path.relative(ROOT, p).replace(/\\/g, '/');
    if (/^(\.git|\.github|products|node_modules|backend|embed|scripts|build|data|assets)(\/|$)/.test(rel)) continue;
    if (e.isDirectory()) { walk(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    const h = fs.readFileSync(p, 'utf8');
    if (h.includes('<b>Excel Formula Library</b>')) continue;
    const m = h.match(/<a class="nm-link" href="([^"]*)recommendations\/"><b>Recommendations<\/b>/);
    if (!m) continue;
    const add = `<a class="nm-link" href="${m[1]}excel-formulas/"><b>Excel Formula Library</b><span>Formulas with checked examples</span></a><a class="nm-link" href="${m[1]}business-calculators/"><b>Calculator Lab</b><span>Growth, stock, team and attendance</span></a>`;
    fs.writeFileSync(p, h.replace(m[0], () => add + m[0]), 'utf8'); nav++;
  }
})(ROOT.replace(/\/$/, ''));
console.log('built /excel-formulas/ (' + data.formulas.length + ' formulas) and /business-calculators/; menu updated on', nav, 'pages');
