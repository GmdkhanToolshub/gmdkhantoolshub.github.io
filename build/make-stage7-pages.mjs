// Builds /report-library/ and /bi-studio/, adds a step-by-step path to /career-studio/ (the existing career hub)
// and adds the two new pages to the Resources menu. Safe to re-run.
// The build stops if any link, download, screenshot or product listed here does not exist.
import fs from 'fs'; import path from 'path';
import { buildPage, esc, faqLd, faqHtml, ROOT } from './page-shell.mjs';
const exists = rel => fs.existsSync(ROOT + rel.split('#')[0].split('?')[0] + (rel.split('#')[0].endsWith('/') ? 'index.html' : ''));
const must = rel => { if (!exists(rel)) throw new Error('missing: ' + rel); const [file, hash] = rel.split('#'); if (hash && !fs.readFileSync(ROOT + file + 'index.html', 'utf8').includes('id="' + hash + '"')) throw new Error('missing anchor: ' + rel); return rel; };
const shop = fs.readFileSync(ROOT + 'shop/index.html', 'utf8');
const price = id => { const c = (shop.match(new RegExp('<article class="card shop-card" id="' + id + '">[\\s\\S]*?</article>')) || [])[0]; if (!c) throw new Error('no product ' + id); return { name: c.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1].replace(/&amp;/g, '&'), /* plain text: escaped once where it is printed */ usd: c.match(/font-weight:800">(\$[\d.]+)/)[1], pkr: c.match(/&middot; (Rs [\d,]+)/)[1] }; };
const TYPE = { tool: 'Free tool', file: 'Free download', paid: 'Paid template', guide: 'Guide' };
// helpers returning catalogue items
const T = (href, name, what) => ({ type: 'tool', href: must(href), name, what });
const G = (slug, name, what) => ({ type: 'guide', href: must('blog/' + slug + '/'), name, what });
const F = (file, name, what, shot) => ({ type: 'file', href: must('assets/downloads/' + file), name, what, shot: shot && must('assets/img/guides/' + shot + '.webp'), download: true });
const P = (id, what) => { const p = price(id); return { type: 'paid', href: must('shop/' + id + '/'), name: p.name, what, price: p.usd + ' · ' + p.pkr }; };

const AREAS = [
  { id: 'sales', name: 'Sales reports', intro: 'Target follow-up, representative scorecards and pipeline.', items: [
    F('GM-Sales-Performance-Example.xlsx', 'Sales performance scorecard (example)', 'Pace, required daily sales, coverage and invoice measures for six made-up representatives.', 'sales-performance-scorecard'),
    F('GM-Sales-Dashboard-Example.xlsx', 'Sales dashboard (example)', 'Month selector, summary tiles, regional table, charts and total checks.', 'sales-dashboard-example'),
    T('tools/sales-target-calculator/', 'Sales Target Calculator', 'Achievement, daily sales needed and month-end projection.'),
    P('sales-target-tracker', 'Day-by-day target tracker with a team sheet.'), P('sales-leads-pipeline-tracker', 'Leads, follow-up alerts and pipeline value.'), P('sales-manager-pack', 'KPI scorecard and target tracker together.'),
    G('sales-performance-dashboard-measures', 'Which sales measures to use', 'How to read pace, coverage and product mix.'), G('secondary-vs-primary-sales-fmcg', 'Primary and secondary sales', 'Which sales figure you are looking at.')] },
  { id: 'management', name: 'Management and business reviews', intro: 'Monthly management reports, review notes and minutes.', items: [
    F('GM-Monthly-Report-Example.xlsx', 'Monthly management report (example)', 'Moves to the latest month, compares with budget and prior month, and flags failed checks.', 'monthly-report-sheet'),
    T('tools/business-report-generator/', 'Business Report Generator', 'Turn highlights, issues and next steps into a report you can copy or save as PDF.'),
    T('tools/meeting-minutes-generator/', 'Meeting Minutes Generator', 'Structure meeting notes with actions.'),
    G('automated-monthly-business-reporting-excel', 'Automated monthly reporting', 'Build a report that updates and checks itself.'), G('effective-minutes-of-meeting', 'Effective minutes of meeting', 'What to record and how to follow up.')],
    note: 'There are no ready-made management presentation (slide) templates here yet. If you need one prepared from your figures, <a href="../services/#enquiry">send your requirements</a> for a quote.' },
  { id: 'hr', name: 'HR reports', intro: 'Attendance, leave, performance, hiring and payroll.', items: [
    F('GM-HR-Attendance-Dashboard-Example.xlsx', 'HR attendance dashboard (example)', 'Monthly attendance by department with data checks and small-group hiding.', 'hr-attendance-dashboard'),
    F('GM-Attendance-Tracking-Example.xlsx', 'Attendance tracker (example)', 'Exceptions log, two attendance rates and a separate productivity sheet.', 'attendance-summary-sheet'),
    F('GM-Attendance-Tracker-Lite-FREE.xlsx', 'Attendance Tracker Lite', 'A free starting template for logging absences and leave.'),
    F('GM-KPI-Scorecard-Lite-FREE.xlsx', 'KPI Scorecard Lite', 'Up to 5 people and 4 KPIs.'),
    F('GM-Payroll-Tax-Lite-FREE.xlsx', 'Payroll and Salary Tax Lite', 'Up to 10 employees, Pakistan tax year 2026-27. An estimating aid, not tax advice.'),
    P('hr-attendance-tracker', 'Attendance and leave balances for up to 50 employees.'), P('team-kpi-scorecard', 'Weighted scores for up to 50 people.'), P('recruitment-hiring-tracker', 'Candidates and open positions.'), P('pakistan-payroll-tax-workbook', 'Payroll and payslips for up to 100 employees.'),
    G('hr-attendance-dashboard-excel', 'HR attendance dashboard guide', 'Department comparisons and privacy.'), G('employee-attendance-productivity-tracking-excel', 'Attendance and productivity tracking', 'Define, record and measure fairly.'), G('weighted-kpi-scorecard', 'Weighted KPI scorecard guide', 'Weights, direction and caps.')] },
  { id: 'operations', name: 'Operations and inventory reports', intro: 'Stock position, reorder and productivity.', items: [
    F('GM-Inventory-Tracker-Example.xlsx', 'Inventory tracker (example)', 'Stock on hand, reorder points, stock value, turnover and ABC ranking.', 'inventory-stock-sheet'),
    T('business-calculators/#turnover', 'Inventory turnover calculator', 'Turnover and days of stock.'), T('business-calculators/#productivity', 'Productivity calculator', 'Output per hour and per person.'),
    P('inventory-sales-tracker', 'Stock, sales and profit for up to 200 products.'),
    G('inventory-management-using-excel', 'Inventory management using Excel', 'Movements, reorder points, valuation and counting.')] },
  { id: 'finance', name: 'Money and billing reports', intro: 'Budgets, invoices, margins and tax estimates.', items: [
    F('GM-Monthly-Budget-50-30-20-FREE.xlsx', '50/30/20 monthly budget', 'A free personal budget sheet.'),
    T('tools/profit-margin-calculator/', 'Profit Margin Calculator', 'Margin, markup and price for a target margin.'),
    P('invoice-payment-tracker', 'Invoices and who still owes you.'), P('budget-planner', 'Budget against actual through the year.'), P('freelancer-income-tax-tracker', 'Freelance income, expenses and estimated tax.'), P('salary-tax-pack', 'Salary tax estimate and a small payroll sheet.'), P('small-business-starter-pack', 'Inventory and invoicing together.'),
    G('profit-margin-vs-markup', 'Profit margin vs markup', 'Formulas, discounts and mixed products.')] }
];

const hero = (crumb, h1, lead) => `<section class="page-hero"><div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="../">Home</a></li><li aria-current="page">${esc(crumb)}</li></ol></nav><h1>${h1}</h1><p class="lead">${esc(lead)}</p></div></section>`;
const css = '<link rel="stylesheet" href="../assets/css/stage7.css?v=00000000">\n';
const item = i => `<article class="rl-card" data-type="${i.type}">${i.shot ? `<a class="rl-shot" href="../${i.shot}" target="_blank" rel="noopener noreferrer"><img src="../${i.shot}" alt="Preview of ${esc(i.name)}" width="640" height="300" loading="lazy" decoding="async"></a>` : ''}<span class="rl-type rl-${i.type}">${TYPE[i.type]}</span><h3><a href="../${i.href}"${i.download ? ' download' : ''}>${esc(i.name)}</a></h3><p>${esc(i.what)}</p><p class="rl-foot">${i.price ? i.price + ' · see features and limits' : i.download ? 'Excel file, no sign-up' : i.type === 'tool' ? 'Runs in your browser' : 'Read online'}</p></article>`;
const total = AREAS.reduce((s, a) => s + a.items.length, 0);
const count = t => AREAS.reduce((s, a) => s + a.items.filter(i => i.type === t).length, 0);
const rlFaq = [
  ['Are the example workbooks free to use?', 'Yes. You can download and change them for your own work. The data in them is made up, so replace it and check your results before sharing a report.'],
  ['What is the difference between an example and a paid template?', 'An example teaches one method and is linked to a guide. A paid template is built for repeated use, with more rows and sheets. Each product page lists its features and limits.'],
  ['Have the files been tested?', 'The free workbooks listed here were opened and recalculated in Microsoft Excel (version 16.0) without error cells, external links or macros. Other spreadsheet programs were not tested.'],
  ['Do I need an account?', 'No. Free tools and downloads need no sign-up.']
];
buildPage({ slug: 'report-library', title: 'Report Library: Excel Report Templates | GM Tools Hub', desc: 'Sales, management, HR, inventory and money reports: free example workbooks, report tools, guides and paid templates, each clearly labelled.', ld: [faqLd(rlFaq)], extraHead: css,
  main: hero('Report library', 'GM <span class="gradient-text">Report Library</span>', 'Find a report by business area. Every item is labelled as a free tool, free download, paid template or guide.') +
`<section class="section"><div class="container rl-wrap">
<nav class="rl-jump" aria-label="Business areas">${AREAS.map(a => `<a href="#${a.id}">${a.name}</a>`).join('')}</nav>
<div class="rl-filter" role="group" aria-label="Show one kind of item"><button type="button" class="rl-chip" data-type="" aria-pressed="true">All (${total})</button>${Object.entries(TYPE).map(([k, v]) => `<button type="button" class="rl-chip" data-type="${k}" aria-pressed="false">${v} (${count(k)})</button>`).join('')}</div>
<p class="small muted" id="rl-count" role="status" aria-live="polite">${total} items</p>
${AREAS.map(a => `<section class="rl-area" id="${a.id}"><h2>${a.name}</h2><p>${a.intro}</p><div class="rl-grid">${a.items.map(item).join('')}</div>${a.note ? `<p class="rl-note">${a.note}</p>` : ''}</section>`).join('')}
<h2>Building your own report?</h2><p>Follow the six steps in <a href="../bi-studio/">BI Studio</a>, or browse the <a href="../excel-formulas/">Excel formula library</a>.</p>
<h2>Questions</h2>${faqHtml(rlFaq)}</div></section><script src="../assets/js/report-library.js?v=00000000" defer></script>` });

// ---------- BI Studio: a path, not another catalogue
const link = (href, text) => `<a href="../${must(href)}">${text}</a>`;
const dlink = (file, text) => `<a href="../${must('assets/downloads/' + file)}" download>${text}</a>`;
const STEPS = [
  { id: 'data', name: 'Organise your data', goal: 'One table, one row per record, consistent names, and totals left to formulas.', learn: link('blog/excel-dashboard-guide-business-reporting/', 'Data layout in the dashboard guide'), practise: 'Look at the Data sheet in the ' + dlink('GM-Sales-Dashboard-Example.xlsx', 'sales dashboard example') + '.', tools: [link('tools/pdf-to-excel/', 'PDF to Excel'), link('tools/excel-to-pdf/', 'Excel to PDF')], done: 'Someone else can add next month’s rows without asking you where they go.' },
  { id: 'formulas', name: 'Learn the formulas you need', goal: 'Totals, counts, lookups and error handling that you can explain.', learn: link('excel-formulas/', 'Excel Formula Library'), practise: dlink('GM-Excel-Formula-Examples.xlsx', 'Download the formula examples') + ' and change the sample data.', tools: [link('tools/excel-formula-generator/', 'Excel Formula Generator')], done: 'You can check one result by hand and get the same answer.' },
  { id: 'measures', name: 'Choose and define measures', goal: 'A few measures, each with a written definition and an action it can lead to.', learn: link('blog/sales-performance-dashboard-measures/', 'Choosing sales measures') + ' and ' + link('blog/weighted-kpi-scorecard/', 'weighted KPI scorecards'), practise: dlink('GM-Sales-Performance-Example.xlsx', 'Sales performance example') + '.', tools: [link('tools/kpi-performance-calculator/', 'KPI Performance Calculator'), link('business-calculators/', 'Business Calculator Lab')], done: 'Two people calculating a measure get the same figure.' },
  { id: 'dashboard', name: 'Build the dashboard', goal: 'One screen that answers agreed questions, with checks you can see.', learn: link('blog/excel-dashboard-guide-business-reporting/', 'Excel dashboard guide') + ' and ' + link('blog/hr-attendance-dashboard-excel/', 'HR attendance dashboard guide'), practise: dlink('GM-HR-Attendance-Dashboard-Example.xlsx', 'HR dashboard example') + ' or ' + dlink('GM-Inventory-Tracker-Example.xlsx', 'inventory example') + '.', tools: [link('tools/color-contrast-checker/', 'Colour Contrast Checker')], done: 'The totals agree with the source system and a reader can find the main point quickly.' },
  { id: 'repeat', name: 'Make it repeatable', goal: 'New data goes in the same way each period, and bad data is caught.', learn: link('blog/automated-monthly-business-reporting-excel/', 'Automated monthly reporting'), practise: 'Add a month to the ' + dlink('GM-Monthly-Report-Example.xlsx', 'monthly report example') + ' and watch its checks.', tools: [link('tools/business-report-generator/', 'Business Report Generator')], done: 'A second person can run the month from your written steps.' },
  { id: 'decide', name: 'Explain and decide', goal: 'Separate what happened, why, what may happen and what to do.', learn: link('blog/business-intelligence-vs-business-analytics/', 'BI vs business analytics'), practise: 'Study the Analytics sheet in the ' + dlink('GM-Monthly-Report-Example.xlsx', 'monthly report example') + ', including the limits of its forecast.', tools: [link('tools/meeting-minutes-generator/', 'Meeting Minutes Generator')], done: 'Each decision has an owner, and you check its result later.' }
];
const CHECKS = [
  ['data', 'Our records are in one table with one row per record and consistent names.'], ['data', 'Nobody types totals or subtotals into the data.'],
  ['formulas', 'I can explain every formula in the report and check a result by hand.'],
  ['measures', 'Each measure has a written definition that others agree with.'], ['measures', 'For each measure, we know what we would do if it changed.'],
  ['dashboard', 'The main points are visible on one screen, with the data date shown.'], ['dashboard', 'The report has visible checks that totals agree.'],
  ['repeat', 'A new period can be added without editing formulas.'], ['repeat', 'Another person could produce the report from written steps.'],
  ['decide', 'We record decisions and later check whether they worked.']];
const biFaq = [
  ['Do I need special software?', 'The steps and practice files use Microsoft Excel. The ideas apply to other tools, but the files were tested only in Excel (version 16.0).'],
  ['Where should I start?', 'Use the self-check. It points to the earliest step with a gap, because later work depends on earlier steps.'],
  ['Are my self-check answers saved?', 'No. They stay on this page in your browser and are not sent or stored.'],
  ['How long does it take?', 'It depends on your data and experience. Finish one small report through all six steps before building a larger one.']
];
buildPage({ slug: 'bi-studio', title: 'BI Studio: Data to Dashboard in Six Steps | GM Tools Hub', desc: 'A six-step path from raw data to a checked report and decisions in Excel, with guides, practice workbooks, tools and a quick self-check.', ld: [faqLd(biFaq)], extraHead: css,
  main: hero('BI Studio', 'GM <span class="gradient-text">BI Studio</span>', 'A six-step path from raw data to a report people can trust, with a guide, a practice file and a finish test for each step.') +
`<section class="section"><div class="container rl-wrap">
<div class="bi-check" id="self-check"><h2>Where should you start?</h2><p>Tick every statement that is already true for your report. Leave a box empty if you are not sure.</p><form id="bi-form">${CHECKS.map(([s, q], i) => `<label class="bi-q"><input type="checkbox" data-step="${s}" id="bi-q${i}"><span>${esc(q)}</span></label>`).join('')}<div class="btn-row"><button type="submit" class="btn btn-primary">Show my starting step</button><button type="reset" class="btn btn-ghost">Clear</button></div></form><div id="bi-result" role="status" aria-live="polite"></div></div>
<ol class="bi-steps">${STEPS.map((s, i) => `<li id="${s.id}" data-name="Step ${i + 1}: ${esc(s.name)}"><h2><span class="bi-num">${i + 1}</span> ${s.name}</h2><p>${s.goal}</p><dl><dt>Read</dt><dd>${s.learn}</dd><dt>Practise</dt><dd>${s.practise}</dd><dt>Tools</dt><dd>${s.tools.join(', ')}</dd><dt>Finished when</dt><dd>${s.done}</dd></dl></li>`).join('')}</ol>
<p>Looking for a ready report instead? See the <a href="../report-library/">Report Library</a>. Need one built from your data? <a href="../services/#enquiry">Send your requirements</a>.</p>
<h2>Questions</h2>${faqHtml(biFaq)}</div></section><script src="../assets/js/bi-studio.js?v=00000000" defer></script>` });

// ---------- Career Studio: add the path to the existing career hub
let cs = fs.readFileSync(ROOT + 'career-studio/index.html', 'utf8');
cs = cs.replace(/<!-- path:start -->[\s\S]*?<!-- path:end -->\n?/, '').replace(/<link rel="stylesheet" href="\.\.\/assets\/css\/stage7\.css[^>]*>\n?/, '');
const paid = id => { const p = price(id); return `<a href="../${must('shop/' + id + '/')}">${esc(p.name)}</a> <span class="rl-type rl-paid">Paid ${p.usd}</span>`; };
const CAREER = [
  ['Plan', 'Decide which roles you are aiming for and what they ask for.', [link('growth/', 'Six steps to your next job')]],
  ['Write your CV', 'One clear version with facts you can support.', [link('tools/resume-builder/', 'Resume Builder'), link('blog/write-cv-for-jobs-in-pakistan/', 'CV guide'), paid('cv-pack')]],
  ['Check it against the advert', 'Look for missing requirements. Add only what is true.', [link('tools/ats-resume-checker/', 'ATS Resume Checker'), link('blog/ats-friendly-resume/', 'ATS-friendly resume guide')]],
  ['Apply', 'Adjust your letter and profile for the role.', [link('tools/cover-letter-generator/', 'Cover Letter Generator'), link('blog/how-to-write-a-cover-letter-in-five-steps/', 'Cover letter guide'), link('tools/linkedin-headline-generator/', 'LinkedIn Headline Generator'), link('blog/linkedin-headline-formula/', 'Headline guide')]],
  ['Prepare for the interview', 'Practise aloud with your own real examples.', [link('growth/interview-practice/', 'Interview practice'), link('blog/common-interview-questions-pakistan/', 'Common questions'), paid('interview-success-pack')]],
  ['Follow up', 'Thank the interviewer and keep a record of each application.', [link('tools/message-writer/', 'Message Writer'), link('workspace/planner/', 'Tasks and Planner')]]
];
const block = `<!-- path:start --><section class="section" id="path"><div class="container rl-wrap"><h2>Your job search, step by step</h2><ol class="bi-steps cs-path">${CAREER.map(([n, g, l], i) => `<li><h3><span class="bi-num">${i + 1}</span> ${n}</h3><p>${g}</p><ul>${l.map(x => `<li>${x}</li>`).join('')}</ul></li>`).join('')}</ol><p class="small muted">Free tools need no account. No tool or template can guarantee an interview or a job offer. Want help from a person? See <a href="../services/#resume">resume writing and review</a>.</p></div></section><!-- path:end -->\n`;
const firstEnd = cs.indexOf('</section>', cs.indexOf('<section class="page-hero">'));
if (firstEnd < 0) throw new Error('career studio hero not found');
cs = cs.slice(0, firstEnd + 10) + '\n' + block + cs.slice(firstEnd + 10);
cs = cs.replace('</head>', css + '</head>');
fs.writeFileSync(ROOT + 'career-studio/index.html', cs, 'utf8');

// ---------- Resources menu
let nav = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name), rel = path.relative(ROOT, p).replace(/\\/g, '/');
    if (/^(\.git|\.github|products|node_modules|backend|embed|scripts|build|data|assets)(\/|$)/.test(rel)) continue;
    if (e.isDirectory()) { walk(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    const h = fs.readFileSync(p, 'utf8');
    if (h.includes('<b>Report Library</b>')) continue;
    const m = h.match(/<a class="nm-link" href="([^"]*)excel-formulas\/"><b>Excel Formula Library<\/b>/);
    if (!m) continue;
    const add = `<a class="nm-link" href="${m[1]}report-library/"><b>Report Library</b><span>Report files, tools and templates</span></a><a class="nm-link" href="${m[1]}bi-studio/"><b>BI Studio</b><span>From raw data to decisions</span></a>`;
    fs.writeFileSync(p, h.replace(m[0], () => add + m[0]), 'utf8'); nav++;
  }
})(ROOT.replace(/\/$/, ''));
console.log('report library:', total, 'items', JSON.stringify(Object.fromEntries(Object.keys(TYPE).map(k => [k, count(k)]))), '| BI steps:', STEPS.length, '| career steps:', CAREER.length, '| menu updated on', nav, 'pages');
