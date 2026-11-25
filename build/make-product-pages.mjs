// Builds /shop/<id>/ for every product on the shop page, and links shop cards to those pages. Safe to re-run.
// Order: node build/make-product-pages.mjs ; node build/make-premium-v2.mjs ; python build/bump.py D:/GM_Claude ; node build/make-sitemap.mjs
import fs from 'fs';
import { buildPage, esc, ROOT } from './page-shell.mjs';
import FACTS from './shop-products.mjs';
let shop = fs.readFileSync(ROOT + 'shop/index.html', 'utf8');
const dec = s => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
const cards = {};
for (const m of shop.matchAll(/<article class="card shop-card" id="([a-z0-9-]+)">([\s\S]*?)<\/article>/g)) {
  const c = m[2], g = re => (c.match(re) || [])[1];
  cards[m[1]] = { name: dec(g(/<h3[^>]*>([\s\S]*?)<\/h3>/).trim()), usd: g(/font-weight:800">\$([\d.]+)/), was: g(/<s[^>]*>\$([\d.]+)<\/s>/), pkr: g(/&middot; (Rs [\d,]+)/), wa: g(/href="(https:\/\/wa\.me\/[^"]+)"/), mail: g(/href="(mailto:[^"]+)"/) };
}
const ids = Object.keys(cards);
const missing = ids.filter(i => !FACTS[i]).concat(Object.keys(FACTS).filter(i => !cards[i]));
if (missing.length) throw new Error('shop cards and product facts do not match: ' + missing);
for (const i of ids) for (const k of ['name', 'usd', 'pkr', 'wa', 'mail']) if (!cards[i][k]) throw new Error(i + ' has no ' + k + ' on the shop page');
const rs = s => Number(s.replace(/[^\d]/g, ''));
const list = a => '<ul>' + a.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>';
const KIND = { excel: 'Excel workbook (.xlsx)', word: 'Word templates (.docx)', print: 'Printable PDF', bundle: 'Bundle' };
const STYLE = '<style>.pp2{display:grid;gap:26px;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);align-items:start}@media(max-width:860px){.pp2{grid-template-columns:minmax(0,1fr)}}.pp2 figure{margin:0}.pp2 figure img{display:block;width:100%;height:auto;border:1px solid var(--border);border-radius:16px;background:#fff}.pp2 figcaption{font-size:.86rem;color:var(--text-soft);margin-top:8px}.pp-buy{border:1px solid var(--border);border-radius:18px;background:var(--surface);padding:22px}.pp-price{font-size:2rem;font-weight:800;margin:0}.pp-price small{font-size:1rem;font-weight:600;color:var(--text-soft)}.pp-buy ol{padding-left:18px;margin:14px 0 0;font-size:.94rem}.pp-body{max-width:860px}.pp-body table{display:block;overflow-x:auto;max-width:100%}.pp-sheets{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0}.pp-sheets li{padding:6px 12px;border:1px solid var(--border);border-radius:999px;background:var(--surface);font-size:.9rem}</style>\n';
const ORDER = `<ol><li>Press an order button. A ready-made message opens in your own app.</li><li>GM confirms the order and sends payment details privately.</li><li>Pay by bank transfer (USD or PKR) or, in Pakistan, JazzCash.</li><li>After the payment is confirmed, your file is sent to you by email or WhatsApp.</li></ol>`;
for (const id of ids) {
  const c = cards[id], f = FACTS[id];
  const bundle = f.type === 'bundle';
  const kids = !!f.kids || (bundle && f.parts.some(p => FACTS[p].kids));
  let body = '';
  if (bundle) {
    const sumU = f.parts.reduce((s, p) => s + Number(cards[p].usd), 0), sumR = f.parts.reduce((s, p) => s + rs(cards[p].pkr), 0);
    const saveU = sumU - Number(c.usd), saveR = sumR - rs(c.pkr);
    if (saveU <= 0 || saveR <= 0) throw new Error(id + ': bundle is not cheaper than its parts');
    if (c.was && Math.abs(Number(c.was) - sumU) > 0.001) throw new Error(`${id}: struck-through price $${c.was} is not the sum of parts $${sumU.toFixed(2)}`);
    body = `<h2>What is in this bundle</h2><table><tr><th>Product</th><th>Bought alone (USD)</th><th>Bought alone (PKR)</th></tr>${f.parts.map(p => `<tr><td><a href="../${p}/">${esc(cards[p].name)}</a></td><td>$${cards[p].usd}</td><td>${cards[p].pkr}</td></tr>`).join('')}<tr><td><strong>Total if bought separately</strong></td><td><strong>$${sumU.toFixed(2)}</strong></td><td><strong>Rs ${sumR.toLocaleString('en-US')}</strong></td></tr><tr><td><strong>Bundle price</strong></td><td><strong>$${c.usd}</strong></td><td><strong>${c.pkr}</strong></td></tr></table><p>You save $${saveU.toFixed(2)} or Rs ${saveR.toLocaleString('en-US')} compared with today’s separate prices.</p><p>Read each product page for its features and limits before ordering.</p>`;
  } else {
    if (f.sheets) body += `<h2>Sheets in the workbook</h2><ul class="pp-sheets">${f.sheets.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`;
    if (f.contents) body += `<h2>What you get</h2>${list(f.contents)}${f.pages ? `<p>${f.pages} pages. Paper size: ${esc(f.sizes)}.</p>` : ''}`;
    if (f.features) body += `<h2>Features</h2>${list(f.features)}`;
    body += `<h2>Limits: please read before ordering</h2>${list(f.limits)}`;
    if (f.tax) body += '<p><strong>Tax notice:</strong> this is an estimating aid, not tax advice. Tax rules change. Confirm the current rates and how they apply to you with FBR guidance or a qualified adviser. The workbook calculations were checked for consistency with the calculator on this website; the legal rates were not independently verified.</p>';
    if (f.steps) body += `<h2>How to use it</h2><ol>${f.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>`;
    else body += '<h2>How to use it</h2><ol><li>Open the PDF in a PDF reader.</li><li>Print the pages you need, choosing your paper size. Use “fit” or “actual size” and check one page first.</li></ol>';
    body += '<h2>What you need</h2>' + (f.type === 'excel' ? '<p>Microsoft Excel on a computer. The workbook has no macros. On 25 November 2026 it was opened and recalculated in Microsoft Excel (version 16.0) on Windows, and a test entry in the last supported row was picked up correctly. <strong>Not tested:</strong> older Excel versions, Excel for Mac, web or mobile, Google Sheets and LibreOffice.</p>' : f.type === 'word' ? '<p>Microsoft Word on a computer. The files were opened in Microsoft Word (version 16.0) on Windows. <strong>Not tested:</strong> Word for Mac or mobile, Google Docs and LibreOffice.</p>' : '<p>A PDF reader and, for paper copies, a printer. The files were checked for page count and paper size; a test print on your own printer is recommended.</p>');
  }
  body += `<h2>Licence, refunds and help</h2><p>For your own use, or your own business where it is a business template. Please do not resell or share the files. Products are digital, so <strong>sales are final</strong>. If a file does not open or has an error, it will be fixed or replaced. Read the <a href="../../refund-policy/">Refund Policy</a> and ask any question through the <a href="../../contact/">contact page</a> before ordering; a file can be described or shown first.</p><p class="small muted">GM does not publish account numbers on this website and will never ask for your card number, PIN or one-time code.</p>`;
  const extra = [f.free && `<a href="../${f.free[0]}">${esc(f.free[1])} (free tool)</a>`, f.guide && `<a href="../${f.guide[0]}">${esc(f.guide[1])}</a>`].filter(Boolean);
  if (extra.length) body += `<h2>Related, free</h2><ul>${extra.map(x => `<li>${x}</li>`).join('')}</ul>`;
  body += '<p><a href="../">← All products</a></p>';
  const kind = KIND[f.type];
  const url = `https://gmtoolshub.com/shop/${id}/`;
  const product = { '@context': 'https://schema.org', '@type': 'Product', name: c.name, description: f.summary, image: `https://gmtoolshub.com/assets/img/shop/${id}.webp`, url, brand: { '@type': 'Brand', name: 'GM Tools Hub' }, category: kind,
    offers: [{ '@type': 'Offer', price: c.usd, priceCurrency: 'USD', availability: 'https://schema.org/InStock', url }, { '@type': 'Offer', price: String(rs(c.pkr)), priceCurrency: 'PKR', availability: 'https://schema.org/InStock', url }] };
  const real = ['salary-tax-pack', 'team-kpi-scorecard', 'sales-target-tracker', 'inventory-sales-tracker', 'invoice-payment-tracker', 'budget-planner', 'hr-attendance-tracker', 'pakistan-payroll-tax-workbook', 'freelancer-income-tax-tracker', 'recruitment-hiring-tracker', 'sales-leads-pipeline-tracker'].includes(id);
  const caption = real ? 'Preview drawn from this workbook’s real sheet names and cells with its example data. It is not a screenshot.' : 'Cover graphic summarising the product. It is not a page from the files.';
  const title = c.name.length > 46 ? c.name : `${c.name} | GM Tools Hub`;
  const desc = (f.summary + ` ${kind}, $${c.usd} or ${c.pkr}.`).slice(0, 165);
  const main = `<section class="page-hero"><div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="../../">Home</a></li><li><a href="../">Shop</a></li><li aria-current="page">${esc(c.name)}</li></ol></nav><span class="eyebrow">${esc(kind)}</span><h1>${esc(c.name)}</h1><p class="lead">${esc(f.summary)}</p></div></section>
<section class="section" style="padding-top:20px"><div class="container"><div class="pp2"><figure><img src="../../assets/img/shop/${id}.webp?v=2" width="960" height="600" alt="${esc(c.name)} preview"><figcaption>${caption}</figcaption></figure>
<div class="pp-buy"><p class="pp-price">$${c.usd} <small>· ${c.pkr}</small></p><p class="small muted" style="margin:4px 0 14px">One-time payment. Delivery is manual, not instant.</p><div class="btn-row"><a class="btn btn-primary" href="${c.wa}" target="_blank" rel="noopener noreferrer">Order on WhatsApp</a><a class="btn btn-ghost" href="${c.mail}">Order by email</a></div>${ORDER}</div></div></div></section>
<section class="section" style="padding-top:0"><div class="container prose pp-body">${body}</div></section>`;
  buildPage({ slug: 'shop/' + id, depth: 2, title, desc, ld: [product], extraHead: STYLE, main, ads: !kids });
}
// shop cards get a link to their page
let linked = 0;
shop = shop.replace(/<!-- details --><a class="btn btn-ghost btn-sm" href="[a-z0-9-]+\/">Details<\/a>/g, '');
shop = shop.replace(/(<article class="card shop-card" id="([a-z0-9-]+)">[\s\S]*?<div class="btn-row"[^>]*>)/g, (m, a, id) => { linked++; return a + `<!-- details --><a class="btn btn-ghost btn-sm" href="${id}/">Details</a>`; });
fs.writeFileSync(ROOT + 'shop/index.html', shop, 'utf8');
console.log('product pages built:', ids.length, '| shop cards linked:', linked);
