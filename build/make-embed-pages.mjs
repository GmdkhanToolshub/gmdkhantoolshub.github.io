// Generates the GM Embed widget routes (embed/<slug>/index.html), the loader (embed/gm-embed.js) and the registry (embed/widgets.json).
// Only slugs listed in WIDGETS are generated. A widget is marked tested only by build/embed-test results (embed/test-results.json).
// Usage: node build/make-embed-pages.mjs
import fs from 'fs'; import vm from 'vm';
const root = 'D:/GM_Claude/';
const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(root + 'assets/js/tools-data.js', 'utf8'), ctx);
const T = Object.fromEntries(ctx.window.TOOLS_DATA.map(t => [t.slug, t]));
// slug -> short card description, features, minimum height
const WIDGETS = [
  ['tola-gold-converter', 'Convert tola, masha, ratti and grams and see the value at a gold rate you enter.', ['Tola, masha, ratti and gram units', 'Value from the rate you type'], 420],
  ['zakat-calculator', 'Work out zakat on cash, gold, silver and savings against the nisab.', ['Gold and silver nisab', 'Clear step-by-step result'], 520],
  ['pakistan-salary-tax-calculator', 'Estimate monthly and annual salary tax and take-home pay for Pakistan, tax years 2025-26 and 2026-27.', ['Two tax years', 'Slab-by-slab breakdown'], 680],
  ['loan-emi-calculator', 'Monthly instalment, total interest and repayment for a loan.', ['Amount, rate and term', 'Total cost shown'], 520],
  ['electricity-bill-calculator', 'Estimate an electricity bill from units used.', ['Units to bill estimate', 'Plain-language result'], 480],
  ['fuel-cost-calculator', 'Trip and monthly fuel cost from distance, mileage and fuel price.', ['Trip cost', 'Monthly cost'], 460],
  ['land-area-converter', 'Convert marla, kanal, square feet, square metres and more.', ['Pakistani and international units', 'Instant results'], 460],
  ['amount-in-words', 'Write a number as words in English, handy for cheques and invoices.', ['Cheque and invoice wording', 'Copy-ready text'], 400],
  ['board-marks-calculator', 'Work out percentage and grade from board marks.', ['Total and percentage', 'Grade guide'], 460],
  ['percentage-calculator', 'Percent of a number, percent change and what percent one number is of another.', ['Three common percentage questions', 'Instant results'], 460],
  ['age-calculator', 'Exact age in years, months and days from a date of birth.', ['Date of birth to age', 'Days until next birthday'], 440],
  ['bmi-calculator', 'Body mass index from height and weight with the standard categories.', ['Metric and imperial', 'Category explanation'], 440],
  ['profit-margin-calculator', 'Profit, margin and markup from cost and selling price.', ['Margin and markup together', 'Selling price from target margin'], 480],
  ['date-difference-calculator', 'Days, weeks, months and years between two dates.', ['Two dates to difference', 'Working days option where available'], 460]
];
// back up and read the existing embed page versions
const verOf = (html, rx) => (html.match(rx) || [])[1] || '00000000';
const css = verOf(fs.readFileSync(root + 'embed/tola-gold-converter/index.html', 'utf8'), /styles\.css\?v=([0-9a-f]{8})/);
const util = verOf(fs.readFileSync(root + 'embed/tola-gold-converter/index.html', 'utf8'), /util\.js\?v=([0-9a-f]{8})/);
const page = (slug, name, tool) => `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'">
<meta name="robots" content="noindex, follow">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${name.replace(/&/g, '&amp;')} (embed) | GM Tools Hub</title>
<link rel="canonical" href="https://gmtoolshub.com/tools/${slug}/">
<link rel="stylesheet" href="../../assets/css/styles.css?v=${css}">
<style>body{background:transparent;margin:0;padding:10px}.embed-wrap{max-width:760px;margin:0 auto}.embed-wrap .tool-panel{box-shadow:none}.embed-head{margin:0 2px 10px;font-weight:800;font-size:1.05rem;color:var(--text)}.embed-credit{margin:10px 2px 0;font-size:.82rem;color:var(--text-soft);text-align:center}.embed-credit a{font-weight:600}</style>
</head>
<body class="embed" data-embed="${slug}" data-name="${name.replace(/"/g, '&quot;')}">
<div class="embed-wrap"><div class="embed-head" id="gm-head" hidden></div><div class="tool-panel"><div id="tool-root" data-tool-id="${slug}"><noscript><p class="inline-error">This tool needs JavaScript.</p></noscript><p class="muted">Loading toolâ€¦</p></div></div>
<p class="embed-credit"><span id="gm-note">Inputs stay in your browser. </span>Free tool by <a href="https://gmtoolshub.com/tools/${slug}/" target="_blank" rel="noopener">GM Tools Hub</a>.</p></div>
<script src="../../assets/js/embed-config.js?v=00000000"></script>
<script src="../../assets/js/util.js?v=${util}"></script>
<script src="../../assets/js/tools/${slug}.js?v=00000000"></script>
<script>(function(){var r=document.getElementById('tool-root'),s=r.getAttribute('data-tool-id');try{r.innerHTML='';window.NiaziTools[s](r,window.NiaziUtil)}catch(e){r.innerHTML='<p class="inline-error">Sorry, this tool could not load.</p>'}})();</script>
</body>
</html>
`;
let results = {}; try { results = JSON.parse(fs.readFileSync(root + 'embed/test-results.json', 'utf8').replace(/^\uFEFF/, '')); } catch (e) { /* none yet */ }
const reg = [];
for (const [slug, desc, features, minH] of WIDGETS) {
  const t = T[slug]; if (!t) { console.log('missing tool', slug); continue; }
  fs.mkdirSync(root + 'embed/' + slug, { recursive: true });
  fs.writeFileSync(root + 'embed/' + slug + '/index.html', page(slug, t.name, t), 'utf8');
  reg.push({ id: slug, name: t.name, category: t.cat, description: desc, features, minHeight: minH, route: '/embed/' + slug + '/', toolPage: '/tools/' + slug + '/', params: ['theme', 'accent', 'bg', 'radius', 'font', 'title', 'footer'], tested: results[slug] || null });
}
reg.push({ id: 'live-rates', name: 'Live Pakistan Rates', category: 'Rates', description: 'Estimated gold (24K, 22K per tola), silver and USD to PKR rates, updated daily, in English or Urdu.', features: ['Gold, silver and dollar', 'English or Urdu', 'Daily history change'], minHeight: 240, route: '/embed/live-rates/', toolPage: '/embed-rates/', params: ['theme', 'accent', 'lang', 'show'], tested: results['live-rates'] || null });
fs.writeFileSync(root + 'embed/widgets.json', JSON.stringify({ version: 1, generated: new Date().toISOString().slice(0, 10), widgets: reg }, null, 1));
const ids = reg.map(w => w.id);
const loader = `/* GM Embed loader. Usage: <div data-gm-embed="WIDGET" data-theme="light" data-accent="0e7490"></div><script src="https://gmtoolshub.com/embed/gm-embed.js" async></script>
   It builds a sandboxed iframe that points to https://gmtoolshub.com/embed/WIDGET/ and resizes it to fit. It never reads what visitors type.
   Messages are only accepted from https://gmtoolshub.com and only from the iframe this script created. */
(function () {
  var ORIGIN = 'https://gmtoolshub.com', ALLOWED = ${JSON.stringify(ids)}, MIN = ${JSON.stringify(Object.fromEntries(reg.map(w => [w.id, w.minHeight])))};
  var FONTS = ['system', 'serif', 'mono', 'rounded'], seq = 0, frames = [];
  function hex(v) { return /^[0-9a-fA-F]{6}$/.test(v || ''); }
  function build(el) {
    if (el.getAttribute('data-gm-done')) return; var w = el.getAttribute('data-gm-embed');
    if (ALLOWED.indexOf(w) < 0) { el.textContent = 'GM Embed: unknown widget.'; return; }
    el.setAttribute('data-gm-done', '1'); var q = [], g = function (k) { return el.getAttribute('data-' + k); };
    var id = 'gm' + (++seq);
    if (g('theme') === 'dark' || g('theme') === 'light') q.push('theme=' + g('theme'));
    if (hex(g('accent'))) q.push('accent=' + g('accent'));
    if (g('bg') === 'transparent' || hex(g('bg'))) q.push('bg=' + g('bg'));
    var r = parseInt(g('radius'), 10); if (r >= 0 && r <= 32) q.push('radius=' + r);
    if (FONTS.indexOf(g('font')) > 0) q.push('font=' + g('font'));
    if (g('title') === '1') q.push('title=1'); if (g('footer') === '0') q.push('footer=0');
    if (g('lang') === 'ur') q.push('lang=ur'); if (/^(gold|silver|usd)(,(gold|silver|usd))*$/.test(g('show') || '')) q.push('show=' + g('show'));
    q.push('id=' + id);
    var f = document.createElement('iframe'); f.src = ORIGIN + '/embed/' + w + '/?' + q.join('&'); f.title = 'GM Tools Hub widget: ' + w;
    f.loading = 'lazy'; f.width = '100%'; f.style.cssText = 'border:0;width:100%;max-width:' + (parseInt(g('max-width'), 10) || 760) + 'px;display:block;height:' + (parseInt(g('height'), 10) || MIN[w] || 480) + 'px';
    f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads');
    f.setAttribute('allow', 'clipboard-write'); f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    el.appendChild(f); frames.push({ id: id, f: f });
  }
  addEventListener('message', function (e) {
    if (e.origin !== ORIGIN) return; var d = e.data; if (!d || d.source !== 'gm-embed' || d.type !== 'height') return;
    for (var i = 0; i < frames.length; i++) if (frames[i].f.contentWindow === e.source && frames[i].id === d.id) { var h = Math.round(+d.height); if (h >= 120 && h <= 4000) frames[i].f.style.height = h + 'px'; }
  });
  function run() { var n = document.querySelectorAll('[data-gm-embed]'); for (var i = 0; i < n.length; i++) build(n[i]); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
`;
fs.writeFileSync(root + 'embed/gm-embed.js', loader, 'utf8');
console.log('widgets:', reg.length, '| loader written | css', css, 'util', util);

