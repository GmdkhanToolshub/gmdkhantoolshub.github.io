// Tool pages: app structured data plus a relevant guide or service link. Product pages: preview link and a route to
// customisation packages. A few small technical fixes. Safe to re-run (everything sits between markers).
import fs from 'fs'; import vm from 'vm';
const R = 'D:/GM_Claude/';
const read = f => fs.readFileSync(R + f, 'utf8'), save = (f, t) => fs.writeFileSync(R + f, t, 'utf8');
const strip = (t, name) => t.replace(new RegExp('<!-- ' + name + ':start -->[\\s\\S]*?<!-- ' + name + ':end -->\\n?', 'g'), '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const box = { window: {} }; vm.createContext(box); vm.runInContext(read('assets/js/tools-data.js'), box);
let tools = Object.values(box.window).find(Array.isArray) || Object.values(Object.values(box.window)[0]).find(Array.isArray);

const blogTitle = slug => { const t = read('blog/' + slug + '/index.html'); return (t.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, slug])[1].replace(/<[^>]+>/g, '').trim(); };
const GUIDE = { 'pdf-to-jpg': 'jpg-vs-png-vs-webp', 'excel-to-pdf': 'pdf-to-word-and-excel-what-to-expect', 'pdf-compressor': 'compress-pdf-without-losing-quality', 'profit-margin-calculator': 'profit-margin-vs-markup', 'gpa-calculator': 'gpa-cgpa-calculation-guide', 'zakat-calculator': 'zakat-calculation-guide', 'final-settlement-calculator': 'gross-vs-net-salary-take-home-pay', 'uk-take-home-pay-calculator': 'gross-vs-net-salary-take-home-pay', 'us-take-home-pay-calculator': 'gross-vs-net-salary-take-home-pay', 'qr-code-scanner': 'qr-codes-small-business' };
// only where a paid service is a natural next step
const SERVICE = {
  'pdf-to-excel': ['solutions/excel-automation/', 'Need the same clean-up every month? Excel automation service'],
  'excel-to-pdf': ['solutions/reporting/', 'Reporting packs that are ready to share'],
  'excel-formula-generator': ['solutions/excel-automation/', 'Have Excel formulas and steps set up for you'],
  'profit-margin-calculator': ['solutions/data-analysis/', 'Find where margin is being lost: data analysis service'],
  'percentage-calculator': ['solutions/data-analysis/', 'Explain why a figure changed: data analysis service'],
  'sales-target-calculator': ['solutions/sales-operations/', 'Targets and run rates for a sales team: sales operations support'],
  'kpi-performance-calculator': ['solutions/business-dashboards/', 'Turn KPI scores into a dashboard'],
  'business-report-generator': ['solutions/reporting/', 'Monthly management reporting packs'],
  'meeting-minutes-generator': ['solutions/reporting/', 'Reporting and review routines'],
  'salary-calculator': ['services/#hr', 'HR and payroll spreadsheet setup'],
  'pakistan-salary-tax-calculator': ['services/#hr', 'Payroll spreadsheet setup for your team'],
  'final-settlement-calculator': ['services/#hr', 'HR and payroll spreadsheet setup']
};
const APPCAT = { 'PDF & Documents': 'UtilitiesApplication', Images: 'MultimediaApplication', Gadgets: 'UtilitiesApplication', Calculators: 'UtilitiesApplication', 'Developer & Text': 'DeveloperApplication', 'Career & Business': 'BusinessApplication', 'Urdu & Language': 'UtilitiesApplication' };
let ld = 0, nx = 0;
for (const t of tools) {
  const f = 'tools/' + t.slug + '/index.html'; let h = strip(strip(read(f), 'gm:app'), 'gm:next');
  const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1].replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"');
  const app = { '@context': 'https://schema.org', '@type': 'WebApplication', name: t.name, url: 'https://gmtoolshub.com/tools/' + t.slug + '/', description: desc, applicationCategory: APPCAT[t.cat] || 'UtilitiesApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript and a modern web browser', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@type': 'Organization', '@id': 'https://gmtoolshub.com/#organization', name: 'GM Tools Hub', url: 'https://gmtoolshub.com/' } };
  h = h.replace('</head>', '<!-- gm:app:start --><script type="application/ld+json">' + JSON.stringify(app).replace(/</g, '\\u003c') + '</script><!-- gm:app:end -->\n</head>'); ld++;
  const links = [], main = (h.match(/<main[\s\S]*?<\/main>/) || [''])[0];
  if (GUIDE[t.slug] && !main.includes('blog/' + GUIDE[t.slug] + '/')) links.push(['../../blog/' + GUIDE[t.slug] + '/', 'Guide: ' + blogTitle(GUIDE[t.slug])]);
  if (SERVICE[t.slug] && !main.includes(SERVICE[t.slug][0])) links.push(['../../' + SERVICE[t.slug][0], SERVICE[t.slug][1]]);
  if (links.length) {
    const block = '<!-- gm:next:start --><section class="section" style="padding-top:0" aria-label="Useful next steps"><div class="container" style="max-width:860px"><h2 style="font-size:1.25rem">Useful next steps</h2><ul class="tool-next">' + links.map(([u, x]) => '<li><a href="' + u + '">' + esc(x.replace(/&amp;/g, '&')) + '</a></li>').join('') + '</ul></div></section><!-- gm:next:end -->\n';
    h = h.replace('</main>', block + '</main>'); nx++;
    if (!h.includes('services-growth.css')) h = h.replace('</head>', '<link rel="stylesheet" href="../../assets/css/services-growth.css?v=00000000">\n</head>');
  }
  save(f, h);
}
console.log('tool pages: app data on', ld, '| next-step links added on', nx);

// product pages: open the preview full size, and offer help adapting it
let pp = 0;
for (const d of fs.readdirSync(R + 'shop', { withFileTypes: true }).filter(e => e.isDirectory())) {
  const f = 'shop/' + d.name + '/index.html'; if (!fs.existsSync(R + f)) continue;
  let h = strip(strip(read(f), 'gm:preview'), 'gm:adapt');
  if (!h.includes('class="pp-buy"')) continue;
  const img = h.match(/<figure[^>]*>\s*<img[^>]*src="([^"]+)"/);
  if (img) h = h.replace(/(<figure[^>]*>[\s\S]*?)(<\/figure>)/, (m, a, b) => a + '<!-- gm:preview:start --><p style="margin:8px 0 0"><a href="' + img[1] + '" target="_blank" rel="noopener" data-preview="' + d.name + '">Open the preview full size</a></p><!-- gm:preview:end -->' + b);
  const excel = /Excel/i.test((h.match(/<span class="eyebrow">([^<]*)<\/span>/) || [, ''])[1]);
  if (excel) {
    const block = '<!-- gm:adapt:start --><section class="section alt"><div class="container" style="max-width:860px"><h2 style="font-size:1.3rem">Need it changed for your team?</h2><p>If your columns, measures or layout are different, ask for a written quote. Fixed Excel packages start at $49, with the scope listed before you pay.</p><ul class="tool-next"><li><a href="../../solutions/#packages">See the $49, $99 and $199 packages</a></li><li><a href="../../portfolio/fmcg-sales-bi/">See a sample dashboard</a></li></ul></div></section><!-- gm:adapt:end -->\n';
    h = h.replace('</main>', block + '</main>');
    if (!h.includes('services-growth.css')) h = h.replace('</head>', '<link rel="stylesheet" href="../../assets/css/services-growth.css?v=00000000">\n</head>');
  }
  save(f, h); pp++;
}
console.log('product pages updated:', pp);

// breadcrumb data where it was missing
for (const [f, name, url] of [['daily-ayah/index.html', 'Daily Quran Ayat', 'daily-ayah/'], ['apps/family-story-keeper/index.html', 'Family Story Keeper', 'apps/family-story-keeper/']]) {
  let h = read(f); if (h.includes('"BreadcrumbList"')) continue;
  h = h.replace('</head>', '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gmtoolshub.com/' }, { '@type': 'ListItem', position: 2, name }] }) + '</script>\n</head>');
  save(f, h); console.log('breadcrumb data added:', url);
}
// a personal utility page with nothing for searchers to find
let me = read('gm-embed/my-embeds/index.html');
if (!/content="noindex/.test(me)) { me = me.replace(/<meta name="robots" content="[^"]*">/g, '').replace('</title>', '</title>\n<meta name="robots" content="noindex, follow">'); save('gm-embed/my-embeds/index.html', me); console.log('my-embeds set to noindex'); }
// Services page: route international clients to the dollar packages, and link the one page nothing linked to
let s = strip(read('services/index.html'), 'gm:intl');
const intl = '<!-- gm:intl:start --><section class="section" style="padding-block:18px"><div class="container" style="max-width:900px"><div class="card" role="note" style="padding:16px 20px"><p style="margin:0"><b>Outside Pakistan?</b> See the <a href="../solutions/#packages">fixed Excel packages in US dollars: $49, $99 and $199</a>. Need a different professional, such as a tax or web specialist? <a href="../get-expert-help/">Request an introduction</a>.</p></div></div></section><!-- gm:intl:end -->\n';
const first = s.indexOf('</section>', s.indexOf('class="page-hero"')); if (first < 0) throw new Error('services hero not found');
s = s.slice(0, first + 10) + '\n' + intl + s.slice(first + 10); save('services/index.html', s); console.log('services page linked to packages');
// llms.txt
let l = read('llms.txt');
if (!l.includes('solutions/#packages')) { l = l.replace('- [About the author](https://gmtoolshub.com/about/)', '- [Excel service packages](https://gmtoolshub.com/solutions/#packages): fixed scope at $49, $99 and $199, with service pages for Excel automation, dashboards, data analysis, reporting and sales operations\n- [FMCG sample dashboard](https://gmtoolshub.com/portfolio/fmcg-sales-bi/): invented sample data with a downloadable Excel workbook; not client work\n- [About the author](https://gmtoolshub.com/about/)'); save('llms.txt', l); }
