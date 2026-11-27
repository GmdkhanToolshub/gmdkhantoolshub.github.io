// Upgrade Phase 1. Safe to re-run. Run AGAIN after make-posts.mjs or make-cornerstone.mjs, then bump.py,
// make-sitemap.mjs, make-llms-full.mjs, audit-site.mjs and validate-jsonld.mjs.
//  1. Services: the existing Excel card now describes spreadsheet cleanup (no second card); the checker links to it.
//  2. Blog page: topic filter and search over the existing article cards (no new library pages).
//  3. Articles: visible author name links to the author profile; publisher is one Organization record.
//  4. Home: the same Organization record; WebSite name matches the brand.
//  5. Long page titles drop the " | GM Tools Hub" ending.
import fs from 'fs';
const R = 'D:/GM_Claude/';
const read = f => fs.readFileSync(R + f, 'utf8');
const write = (f, s) => { if (read(f) !== s) { fs.writeFileSync(R + f, s, 'utf8'); changed.add(f); } };
const changed = new Set();
// Replace `from` once; do nothing if `to` is already there; stop if neither is found.
const once = (s, from, to, what) => { if (s.includes(to)) return s; if (!s.includes(from)) throw new Error('not found: ' + what); return s.replace(from, () => to); };

// 1. services + checker
let sv = read('services/index.html');
sv = once(sv, '<li>Cleaning up and fixing existing workbooks</li>',
  '<li>Spreadsheet cleanup: fixing existing workbooks, with a list of repeated, missing or mismatched entries for you to confirm. Missing figures are not guessed</li><li>Check a sales sheet yourself first with the free <a href="../spreadsheet-checker/">Spreadsheet Checker</a></li><li>Before sending sample rows, remove names, phone numbers, ID numbers and bank details</li>', 'Excel service bullet');
write('services/index.html', sv);
for (const f of ['spreadsheet-checker/index.html', 'build/make-sheet-checker.mjs']) write(f, once(read(f), 'href="../services/#enquiry" target="_blank"', 'href="../services/#excel" target="_blank"', 'quote link in ' + f));

// 2. blog page
const TOPICS = {
  excel: ['Excel & Business Intelligence', 'check-distributor-sales-file sales-and-finance-totals-differ prepare-lists-for-new-software automated-monthly-business-reporting-excel business-intelligence-vs-business-analytics excel-dashboard-guide-business-reporting excel-formulas-sales-ops hr-attendance-dashboard-excel employee-attendance-productivity-tracking-excel inventory-management-using-excel weighted-kpi-scorecard digital-transformation-start-with-data loan-emi-formula-excel sales-performance-dashboard-measures'],
  management: ['Business Management', 'sales-and-finance-totals-differ prepare-lists-for-new-software digital-transformation-start-with-data effective-minutes-of-meeting profit-margin-vs-markup employee-attendance-productivity-tracking-excel inventory-management-using-excel weighted-kpi-scorecard qr-codes-small-business percentage-discount-sales-tax-guide'],
  sales: ['Sales & Distribution', 'check-distributor-sales-file sales-operations-explained sales-performance-dashboard-measures sales-target-tracking secondary-vs-primary-sales-fmcg excel-formulas-sales-ops'],
  download: ['Templates & Downloads', ''], /* worked out from the article itself */
  productivity: ['Productivity & Files', 'pomodoro-technique-guide how-to-improve-your-typing-speed compress-pdf-without-losing-quality convert-photos-and-scans-into-one-pdf merge-and-split-pdf-files pdf-to-word-and-excel-what-to-expect jpg-vs-png-vs-webp resize-images-for-whatsapp-email-and-websites how-to-create-a-strong-password color-contrast-and-accessible-design'],
  careers: ['Careers', 'ats-friendly-resume ats-resume-check-free common-interview-questions-pakistan how-to-write-a-cover-letter-in-five-steps linkedin-headline-formula write-cv-for-jobs-in-pakistan'],
  money: ['Money & Everyday Guides', 'flat-rate-vs-reducing-balance-loans loan-emi-formula-excel gross-vs-net-salary-take-home-pay salary-tax-pakistan-2026-27 monthly-budget-50-30-20-pakistan zakat-calculation-guide gpa-cgpa-calculation-guide marla-kanal-and-square-feet-explained percentage-discount-sales-tax-guide']
};
const prose = slug => (read('blog/' + slug + '/index.html').match(/<article class="prose">[\s\S]*?<\/article>/) || [''])[0];
let bl = read('blog/index.html');
const count = {}, seen = [];
bl = bl.replace(/<article class="card hover post-card"(?: data-topics="[^"]*")?>([\s\S]*?)<\/article>/g, (m, inner) => {
  const slug = (inner.match(/href="\.\.\/blog\/([^/"]+)\/"/) || [])[1];
  if (!slug) throw new Error('card without a link');
  const keys = Object.keys(TOPICS).filter(k => k === 'download' ? /href="[^"]*assets\/downloads\//.test(prose(slug)) : TOPICS[k][1].split(' ').includes(slug));
  if (!keys.some(k => k !== 'download')) throw new Error('article has no topic, add it to TOPICS: ' + slug);
  keys.forEach(k => count[k] = (count[k] || 0) + 1); seen.push(slug);
  return `<article class="card hover post-card" data-topics="${keys.join(' ')}">${inner}</article>`;
});
for (const [k, [, list]] of Object.entries(TOPICS)) for (const s of list.split(' ').filter(Boolean)) if (!seen.includes(s)) throw new Error('topic ' + k + ' names a missing card: ' + s);
const chip = (k, label, n, on) => `<button type="button" class="rl-chip" data-topic="${k}" aria-pressed="${on}">${label.replace(/&/g, '&amp;')} (${n})</button>`;
const controls = `<!-- library:start --><div class="bl-tools" id="bl-tools" hidden><label class="bl-search" for="bl-q">Search articles<input type="search" id="bl-q" autocomplete="off" placeholder="For example: attendance, KPI, PDF"></label><div class="rl-filter" role="group" aria-label="Show one topic">${chip('', 'All', seen.length, true)}${Object.entries(TOPICS).filter(([k]) => count[k]).map(([k, [l]]) => chip(k, l, count[k], false)).join('')}</div><p class="small muted" id="bl-count" role="status" aria-live="polite">${seen.length} articles</p><p id="bl-none" hidden>No article matches. Try another word, choose All, or <a href="../tools/">look through the free tools</a>.</p></div><!-- library:end -->`;
if (/<!-- library:start -->[\s\S]*?<!-- library:end -->/.test(bl)) bl = bl.replace(/<!-- library:start -->[\s\S]*?<!-- library:end -->/, () => controls);
else { const next = bl.replace(/<div class="tags" style="margin:0 0 28px">(?:<span class="tag">[^<]*<\/span>)+<\/div>/, () => controls); /* the old labels did nothing when clicked */ if (next === bl) throw new Error('blog tag row not found'); bl = next; }
if (!bl.includes('assets/css/stage7.css')) bl = bl.replace('</head>', '<link rel="stylesheet" href="../assets/css/stage7.css?v=00000000">\n</head>');
if (!bl.includes('assets/js/blog-library.js')) bl = bl.replace('</main>', '<script src="../assets/js/blog-library.js?v=00000000" defer></script></main>');
write('blog/index.html', bl);

// 3 + 4. author links and one Organization record
const ORG = { '@type': 'Organization', '@id': 'https://gmtoolshub.com/#organization', name: 'GM Tools Hub', url: 'https://gmtoolshub.com/', logo: 'https://gmtoolshub.com/assets/img/apple-touch-icon.png' };
if (!fs.existsSync(R + 'assets/img/apple-touch-icon.png')) throw new Error('logo file missing');
const LD = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const NAME = 'Gmd Khan Niazi (Ghulam Mohiuddin Khan Niazi)';
let articles = 0;
for (const slug of seen) {
  const f = 'blog/' + slug + '/index.html';
  let h = once(read(f), `<span>By ${NAME}</span>`, `<span>By <a href="../../about/" rel="author">${NAME}</a></span>`, 'byline in ' + f);
  let found = 0;
  h = h.replace(LD, (m, json) => { const o = JSON.parse(json); if (o['@type'] !== 'BlogPosting') return m; found++; o.publisher = ORG; return '<script type="application/ld+json">' + JSON.stringify(o) + '</script>'; });
  if (found !== 1) throw new Error('expected one BlogPosting in ' + f);
  write(f, h); articles++;
}
let home = read('index.html'), sites = 0;
home = home.replace(LD, (m, json) => { const o = JSON.parse(json); if (o['@type'] !== 'WebSite') return m; sites++; o.name = 'GM Tools Hub'; o.publisher = { '@id': ORG['@id'] }; return '<script type="application/ld+json">' + JSON.stringify(o) + '</script>'; });
if (sites !== 1) throw new Error('home WebSite record not found');
if (!home.includes('"@id":"' + ORG['@id'] + '","name"')) home = home.replace('</head>', () => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', ...ORG, founder: { '@type': 'Person', name: 'Ghulam Mohiuddin Khan Niazi', url: 'https://gmtoolshub.com/about/' } }) + '</script>\n</head>');
write('index.html', home);

// 5. long titles
const LONG = ['blog/business-intelligence-vs-business-analytics', 'blog/employee-attendance-productivity-tracking-excel', 'blog/excel-dashboard-guide-business-reporting', 'blog/inventory-management-using-excel', 'daily-rates-email', 'embed-rates', 'get-expert-help', 'rates-data', 'send-money-to-pakistan', 'silver-rate', 'tools/color-picker', 'tools', 'tools/number-converter'];
for (const d of LONG) write(d + '/index.html', read(d + '/index.html').replace(/<title>([^<]*?) \| GM(?: Tools Hub)?<\/title>/, '<title>$1</title>'));
write('embed-rates/index.html', read('embed-rates/index.html').split('(24K, 22K per tola), silver and USD to PKR rates.').join('(24K, 22K per tola), silver and USD-PKR rates.').split('One line of code, no sign-up, updated daily.').join('One line of code, no sign-up, daily updates.'));

console.log('articles:', articles, '| topics:', JSON.stringify(count), '| files changed:', changed.size);
