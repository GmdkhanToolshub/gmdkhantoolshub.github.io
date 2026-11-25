// GM Tools Hub v2: links the v2 design layer everywhere, updates navigation, rebuilds the Home page sections, and builds /pricing/ and /recommendations/.
// Idempotent. Product data comes from shop/index.html and affiliate links from assets/js/config.js (single sources of truth).
// Usage: node build/make-premium-v2.mjs   then: python build/bump.py D:/GM_Claude ; node build/make-sitemap.mjs ; node build/audit-site.mjs
import fs from 'fs'; import path from 'path'; import vm from 'vm';
const root = 'D:/GM_Claude/';
const read = f => fs.readFileSync(root + f, 'utf8'), write = (f, s) => fs.writeFileSync(root + f, s, 'utf8');
const WA = t => 'https://wa.me/923158935101?text=' + encodeURIComponent(t);

// ---------- 1. every page: v2 stylesheet and navigation
function allHtml() { const out = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name), rel = path.relative(root, p).replace(/\\/g, '/'); if (/^(\.git|\.github|node_modules|backend|products|build|scripts|assets|data|embed)(\/|$)/.test(rel)) continue; if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) out.push(rel); } })(root); return out; }
function sitewide() {
  let css = 0, nav = 0;
  for (const rel of allHtml()) {
    let h = read(rel); const o = h;
    if (!h.includes('assets/css/gm-v2.css')) { const m = h.match(/<link rel="stylesheet" href="([^"]*)assets\/css\/premium\.css\?v=[0-9a-f]{8}">/); if (m) { h = h.replace(m[0], m[0] + '\n<link rel="stylesheet" href="' + m[1] + 'assets/css/gm-v2.css?v=00000000">'); css++; } }
    const ul = h.match(/<ul class="nav-links" id="nav-links">[\s\S]*?<\/ul><\/nav>/);
    if (ul) {
      let n = ul[0]; const pm = n.match(/<a class="nav-link" href="([^"]*)tools\/"/);
      if (pm && !n.includes('>Pricing</a>')) {
        const pre = pm[1], cur = s => rel.startsWith(s) ? ' aria-current="page"' : '';
        n = n.replace(/>Free Tools &amp; Gadgets<\/a>/, '>Free Tools</a>');
        n = n.replace(/<li><a class="nav-link" href="[^"]*portfolio\/"[^>]*>[\s\S]*?<\/a><\/li>/, '');
        const add = '<li><a class="nav-link" href="' + pre + 'shop/"' + cur('shop/') + '>Products</a></li><li><a class="nav-link" href="' + pre + 'solutions/"' + cur('solutions/') + '>Solutions</a></li><li><a class="nav-link" href="' + pre + 'pricing/"' + cur('pricing/') + '>Pricing</a></li>';
        n = n.replace(/(<li><a class="nav-link" href="[^"]*tools\/"[^>]*>Free Tools<\/a><\/li>)/, '$1' + add);
        n = n.replace(/(<a class="nm-link" href="[^"]*gm-embed\/"><b>GM Embed<\/b><span>[^<]*<\/span><\/a>)/, '$1<a class="nm-link" href="' + pre + 'portfolio/"><b>Portfolio</b><span>Project and operations experience</span></a><a class="nm-link" href="' + pre + 'recommendations/"><b>Recommendations</b><span>Tools and books, with affiliate links marked</span></a>');
        n = n.replace(/AI &amp; Productivity (<svg class="chev")/, 'Resources $1');
        h = h.replace(ul[0], n); nav++;
      }
    }
    if (h !== o) write(rel, h);
  }
  console.log('v2 stylesheet added to', css, 'pages; navigation updated on', nav);
}

// ---------- data from the shop
const shop = read('shop/index.html');
function product(id) {
  const c = (shop.match(new RegExp('<article class="card shop-card" id="' + id + '">[\\s\\S]*?</article>')) || [])[0];
  if (!c) throw new Error('product missing: ' + id);
  const g = (re) => (c.match(re) || [])[1];
  return { id, name: g(/<h3[^>]*>([\s\S]*?)<\/h3>/), usd: g(/font-weight:800">(\$[\d.]+)/), pkr: g(/&middot; (Rs [\d,]+)/), order: g(/<a class="btn btn-primary btn-sm" href="(https:\/\/wa\.me\/[^"]+)"/) };
}
const FEATURED = [
  ['salary-tax-pack', 'Payroll', 'Work out salary tax for a person or a small team.', ['Tax years 2025-26 and 2026-27', 'Payroll sheet for 25 employees', 'Editable slabs and how-to sheet']],
  ['team-kpi-scorecard', 'Dashboard', 'Score and rank your team on the measures that matter.', ['Up to 50 people, 8 weighted KPIs', 'Automatic rating and ranking', 'Team summary']],
  ['sales-target-tracker', 'Sales', 'Know the daily sales you need to hit the month.', ['Required daily sales and run rate', 'Month-end projection with chart', 'Team sheet for 25 salespeople']],
  ['inventory-sales-tracker', 'Inventory', 'Stock, sales and profit in one workbook.', ['Up to 200 products', 'Reorder alerts and profit per sale', 'Monthly sales and profit chart']],
  ['invoice-payment-tracker', 'Documents', 'Invoice customers and see who still owes you.', ['Printable one-page A4 invoice', 'Customer list for 200 customers', 'Paid, part-paid and overdue register']],
  ['pakistan-payroll-tax-workbook', 'Reporting', 'Monthly Pakistan payroll with income tax worked out.', ['Up to 100 employees', 'Printable payslip and department summary', 'Live Excel formulas, no macros']]
];
const productCard = (pre, [id, tag, benefit, feats]) => { const p = product(id); return `<article class="v2-product"><div class="v2-thumb"><img src="${pre}assets/img/shop/${id}.webp?v=2" data-full="${pre}assets/img/shop/${id}.webp?v=2" tabindex="0" role="button" width="640" height="400" loading="lazy" decoding="async" alt="Preview of ${p.name}. Open larger preview"><span class="v2-tag">${tag}</span></div><div class="v2-body"><h3>${p.name}</h3><p>${benefit}</p><ul class="v2-feats">${feats.map(f => '<li>' + f + '</li>').join('')}</ul><div class="v2-price"><strong>${p.usd}</strong><span>${p.pkr} &middot; one-time</span></div><div class="v2-actions"><a class="btn btn-ghost btn-sm" href="${pre}shop/${id}/">View Product</a><a class="btn btn-primary btn-sm" href="${p.order}" target="_blank" rel="noopener noreferrer">Buy on WhatsApp</a></div></div></article>`; };

// ---------- shared blocks
const ICON = d => `<span class="v2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg></span>`;
const SERVICES = [
  ['Excel data cleaning', 'Messy exports made consistent: duplicates, formats, names and totals checked.', '<path d="M3 6h18M7 12h10M10 18h4"/>'],
  ['Dashboard development', 'KPI and sales dashboards in Excel that update from your own data.', '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 16v-5M12 16V8M17 16v-3"/>'],
  ['Website audits', 'Technical, SEO and AI-search checks with a written list of fixes. No ranking promises.', '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8.5 11l2 2 3.5-3.5"/>'],
  ['Business reporting', 'Weekly and monthly reports your managers can read in two minutes.', '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'],
  ['Data formatting', 'Lists, sheets and documents laid out consistently and ready to print or share.', '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>']
];
const servicesGrid = () => '<div class="v2-services">' + SERVICES.map(([t, d, i]) => `<article class="v2-service">${ICON(i)}<h3>${t}</h3><p>${d}</p><a href="${WA('Hello GM, I would like a quote for: ' + t + '. My company and what I need:')}" target="_blank" rel="noopener noreferrer">Request a Service &rarr;</a></article>`).join('') + '</div>';
const rates = JSON.parse(read('data/rates.json')).history.USD, usd = rates[rates.length - 1];
const pkr = d => 'Rs ' + (Math.round(d * usd.r / 50) * 50).toLocaleString('en-IN');
const amount = (d, per) => `<div class="v2-amount"><span data-usd="$${d}" data-pkr="${d ? '≈ ' : ''}${pkr(d)}">$${d}</span>${per ? ' <small>/ month, planned</small>' : ''}</div>`;
const plans = pre => `<div class="v2-plans">
<article class="v2-plan feature"><span class="v2-chip">Available now</span><h3>Free</h3>${amount(0)}<ul><li>All free online tools, no registration</li><li>Guides and free templates</li><li>GM Embed widgets with a credit link</li></ul><a class="btn btn-primary" href="${pre}tools/">Try Free</a></article>
<article class="v2-plan"><span class="v2-chip soon">Planned, not on sale</span><h3>Pro</h3>${amount(15, true)}<ul><li>More embed widgets as they are added</li><li>Advanced themes and customisation</li><li>Usage analytics and higher limits</li><li>Priority support</li></ul><a class="btn btn-ghost" href="${pre}gm-embed/support/">Join the waiting list</a></article>
<article class="v2-plan"><span class="v2-chip soon">Planned, not on sale</span><h3>Agency</h3>${amount(29, true)}<ul><li>White-label embeds</li><li>Multiple client domains</li><li>Commercial website licence</li><li>API access where available, business support</li></ul><a class="btn btn-ghost" href="${pre}gm-embed/support/">Join the waiting list</a></article>
<article class="v2-plan"><span class="v2-chip">Taking requests</span><h3>Custom</h3><div class="v2-amount">Quoted</div><ul><li>Dashboards and reporting</li><li>Data cleaning and formatting</li><li>Website and SEO audits</li><li>Scope and price agreed before work starts</li></ul><a class="btn btn-ghost" href="${WA('Hello GM, I would like a quote for a custom business solution. I need:')}" target="_blank" rel="noopener noreferrer">Request a Quote</a></article>
</div>`;
const currency = '<div class="v2-cur" role="group" aria-label="Show prices in"><button type="button" data-cur="usd" aria-pressed="true">USD</button><button type="button" data-cur="pkr" aria-pressed="false">PKR</button></div>';
const priceNote = `Pro and Agency prices are planned. They are not on sale, nothing recurring is billed today, and prices may change before launch. PKR figures are approximate, converted at Rs ${usd.r.toFixed(2)} per US dollar (${usd.d}).`;

// ---------- 2. Home page
const wrapBlock = (k, s) => `<!-- v2:${k}:start -->${s}<!-- v2:${k}:end -->`;
const check = (l, id, type, val, extra = '') => `<label for="${id}">${l}</label><input id="${id}" type="${type}" inputmode="decimal" value="${val}" ${extra}>`;
function heroBlock(old) {
  const form = old.match(/<form class="gx-search"[\s\S]*?<\/form>/)[0], suggest = old.match(/<ul class="gx-suggest"[\s\S]*?<\/ul>/)[0];
  const tab = (id, label, on) => `<button type="button" role="tab" id="v2-t-${id}" aria-controls="v2-p-${id}" aria-selected="${on}"${on ? '' : ' tabindex="-1"'}>${label}</button>`;
  const out = id => `<div class="v2-out" aria-live="polite"><span id="v2-${id}-label">${id === 's' ? 'Monthly take-home pay' : id === 'g' ? 'Estimated value' : 'Result'}</span><strong id="v2-${id}-main">—</strong><p id="v2-${id}-sub"></p></div>`;
  return `<section class="v2-hero" aria-labelledby="gx-h1"><div class="container v2-hero-grid"><div><p class="v2-kicker">GM Tools Hub</p><h1 id="gx-h1">Powerful Digital Tools. <span>Smarter Business Solutions.</span></h1><p class="v2-sub">Discover free online utilities, premium business templates and powerful digital solutions designed to simplify your everyday work.</p>${form}${suggest}<div class="v2-cta"><a class="btn btn-primary btn-lg" href="tools/">Explore Free Tools</a><a class="btn btn-lg v2-btn-ghost" href="solutions/">Explore Business Solutions</a></div><ul class="v2-points"><li>Free tools need no account</li><li>Calculations run in your browser</li><li>English and Urdu</li></ul></div>
<div class="v2-demo" id="v2-demo"><div class="v2-demo-head"><span>Try a tool right here</span><em>Live</em></div><div class="v2-tabs" role="tablist" aria-label="Tool demonstrations">${tab('salary', 'Salary tax', true)}${tab('gold', 'Gold value', false)}${tab('pct', 'Percentage', false)}</div>
<div class="v2-pane" role="tabpanel" id="v2-p-salary" aria-labelledby="v2-t-salary">${check('Monthly salary (Rs)', 'v2-salary', 'text', '150,000')}${out('s')}<a class="v2-open" href="tools/pakistan-salary-tax-calculator/">Open the full salary tax calculator &rarr;</a></div>
<div class="v2-pane" role="tabpanel" id="v2-p-gold" aria-labelledby="v2-t-gold" hidden><div class="v2-two"><div>${check('Weight', 'v2-weight', 'text', '1')}</div><div><label for="v2-unit">Unit</label><select id="v2-unit"><option value="tola">tola</option><option value="gram">gram</option></select></div></div>${out('g')}<a class="v2-open" href="tools/tola-gold-converter/">Open the tola and gold converter &rarr;</a></div>
<div class="v2-pane" role="tabpanel" id="v2-p-pct" aria-labelledby="v2-t-pct" hidden><div class="v2-two"><div>${check('Percent', 'v2-pct', 'text', '18')}</div><div>${check('Of', 'v2-of', 'text', '25,000')}</div></div>${out('p')}<a class="v2-open" href="tools/percentage-calculator/">Open the percentage calculator &rarr;</a></div></div></div></section>`;
}
const head = (eyebrow, h2, p, right = '') => `<div class="v2-head"><div><span class="v2-eyebrow">${eyebrow}</span><h2>${h2}</h2><p>${p}</p></div>${right}</div>`;
const productsBlock = `<section class="section" id="digital-products"><div class="container">${head('GM Digital Products', 'Business templates ready to use', 'Excel dashboards, sales, inventory, invoicing and payroll workbooks. One-time price in US dollars or rupees. Click a thumbnail to preview.', '<a class="btn btn-ghost" href="shop/">All products</a>')}<div class="v2-products">${FEATURED.map(f => productCard('./', f)).join('')}</div><p class="small muted" style="margin-top:16px">Orders are placed on WhatsApp or email and delivered after payment is confirmed.</p></div></section>`;
const snippet = '&lt;div data-gm-embed="percentage-calculator" data-accent="245bdb"&gt;&lt;/div&gt;\n&lt;script src="https://gmtoolshub.com/embed/gm-embed.js" async&gt;&lt;/script&gt;';
const embedBlock = `<section class="section v2-dark" id="gm-embed-showcase"><div class="container">${head('GM Embed', 'Put a working calculator on your website', 'Pick a tool, set your colours, copy one line of code. The live widget on the right is the real thing.')}<div class="v2-split"><div><ol class="v2-steps"><li>Choose from the tested widgets</li><li>Set theme, colour, corners and size with a live preview</li><li>Paste the code into your page</li></ol><div class="v2-code"><header><span>Embed code</span><button type="button" id="v2-copy">Copy</button></header><pre id="v2-snippet">${snippet}</pre></div><div class="v2-cta"><a class="btn btn-primary btn-lg" href="gm-embed/generator/">Generate Embed</a><a class="btn btn-lg v2-btn-ghost" href="gm-embed/">See licensing plans</a></div><p class="small" style="color:#9fb4dd;margin-top:14px">Free embeds keep a GM Tools Hub credit link. Domain management and paid licences are planned and not available yet.</p></div><iframe class="v2-frame" src="./embed/percentage-calculator/?accent=245bdb&amp;radius=16&amp;title=1" title="Live GM Embed demo: percentage calculator" loading="lazy"></iframe></div></div></section>`;
const businessBlock = `<section class="section" id="business-solutions"><div class="container">${head('GM Business Solutions', 'Have the work done for you', 'Practical services for small and growing companies. Tell me what you need and get the scope and price before anything starts.', '<a class="btn btn-ghost" href="solutions/">All business solutions</a>')}${servicesGrid()}</div></section>`;
const pricingBlock = `<section class="section alt" id="pricing-preview"><div class="container">${head('Pricing', 'Start free. Pay only for what you need.', 'Digital products are priced separately as one-time purchases.', currency)}${plans('./')}<p class="small muted" style="margin-top:14px">${priceNote} <a href="pricing/">Full pricing details</a>.</p></div></section>`;
const trustBlock = `<section class="section" id="why-gm"><div class="container">${head('Why trust GM Tools Hub', 'Straightforward by design', 'No invented customer numbers or testimonials. Here is what you can check for yourself.')}<div class="v2-trust"><article><h3>Your inputs stay with you</h3><p>Free calculators and file tools run in your browser. Each tool page says what it does with your data.</p></article><article><h3>Honest about estimates</h3><p>Rates, tax and bill figures are labelled as estimates, with how they are worked out.</p></article><article><h3>A real person to contact</h3><p>Built and maintained by Gmd Khan Niazi in Pakistan, reachable by the contact page, email or WhatsApp.</p></article><article><h3>Clear policies</h3><p>Privacy, terms, refunds and affiliate disclosure are published and linked on every page.</p></article></div><ul class="v2-links"><li><a href="about/">About</a></li><li><a href="privacy-policy/">Privacy</a></li><li><a href="terms-and-conditions/">Terms</a></li><li><a href="refund-policy/">Refunds</a></li><li><a href="affiliate-disclosure/">Affiliate disclosure</a></li><li><a href="recommendations/">Recommendations</a></li><li><a href="contact/">Contact Support</a></li></ul></div></section>`;

function sections(h) { const out = []; const re = /<section\b|<\/section>/g; let m, depth = 0, start = 0; while ((m = re.exec(h))) { if (m[0] === '<section') { if (!depth) start = m.index; depth++; } else { depth--; if (!depth) out.push([start, m.index + 10]); } } return out; }
const findSec = (h, needle) => sections(h).find(([a, b]) => h.slice(a, b).includes(needle));
function home() {
  let h = read('index.html');
  const blocks = { products: productsBlock, embed: embedBlock, business: businessBlock, pricing: pricingBlock, trust: trustBlock };
  if (!h.includes('<!-- v2:hero:start -->')) {
    const hs = findSec(h, 'class="gx-hero"'); if (!hs) throw new Error('hero not found');
    h = h.slice(0, hs[0]) + wrapBlock('hero', heroBlock(h.slice(hs[0], hs[1]))) + h.slice(hs[1]);
    // Home sections that repeated other sections or pages. Their content stays on its own pages.
    for (const title of ['New tools for everyday life in Pakistan', 'Handy every day', 'Get more done, with less friction', 'Built on real operations experience', 'Explore the GM platform', 'Family Story Keeper: save your grandparents', 'Ready-made Excel templates']) {
      const s = sections(h).find(([a, b]) => { const t = (h.slice(a, b).match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || ''; return t.replace(/<[^>]+>/g, '').startsWith(title); });
      if (!s) { console.log('section not found (skipped):', title); continue; }
      const inner = h.slice(s[0], s[1]).match(/<!--[\s\S]*?-->/g) || []; h = h.slice(0, s[0]) + inner.join('') + h.slice(s[1]);
    }
    // the long all-tools directory stays (internal links) but folds away
    const all = findSec(h, 'Every free tool and gadget, sorted by'); if (all) { const seg = h.slice(all[0], all[1]); h = h.slice(0, all[0]) + '<section class="section"><div class="container"><details class="v2-all"><summary>Browse the full directory of free tools</summary>' + seg + '</details></div></section>' + h.slice(all[1]); }
    // new showcase blocks after the categories
    const cats = findSec(h, 'id="browse-categories"'); if (!cats) throw new Error('categories not found');
    h = h.slice(0, cats[1]) + ['products', 'embed', 'business', 'pricing'].map(k => wrapBlock(k, blocks[k])).join('') + h.slice(cats[1]);
    const why = findSec(h, 'Built to be fast, private and genuinely useful'); if (!why) throw new Error('why section not found');
    const keep = h.slice(why[0], why[1]).match(/<!--[\s\S]*?-->/g) || []; h = h.slice(0, why[0]) + keep.join('') + wrapBlock('trust', trustBlock) + h.slice(why[1]);
    h = h.replace('</body>', '<script src="./assets/js/home-v2.js?v=00000000" defer></script></body>');
  } else {
    for (const [k, v] of Object.entries(blocks)) h = h.replace(new RegExp('<!-- v2:' + k + ':start -->[\\s\\S]*?<!-- v2:' + k + ':end -->'), () => wrapBlock(k, v));
  }
  const title = 'GM Tools Hub: Free Online Tools & Business Solutions', desc = 'Free online utilities, premium Excel business templates, embeddable calculators and business solutions from GM Tools Hub. Free tools need no account.';
  h = h.replace(/<title>[\s\S]*?<\/title>/, '<title>' + title.replace('&', '&amp;') + '</title>').replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + desc + '">')
    .replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*(">)/g, '$1' + title.replace('&', '&amp;') + '$2').replace(/(<meta (?:property="og:description"|name="twitter:description") content=")[^"]*(">)/g, '$1' + desc + '$2');
  h = h.replace(/frame-src https:;/, "frame-src 'self' https:;");
  write('index.html', h); console.log('home page rebuilt:', sections(h).length, 'top-level sections');
}

// ---------- 3. Pricing and recommendations pages
async function pages() {
  const { buildPage, esc, faqLd, faqHtml } = await import('./page-shell.mjs');
  const hero = (crumb, h1, lead) => `<section class="page-hero"><div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="../">Home</a></li><li aria-current="page">${crumb}</li></ol></nav><h1>${h1}</h1><p class="lead">${lead}</p></div></section>`;
  const faqs = [
    ['Can I buy Pro or Agency today?', 'No. Both are planned and not on sale. No payment is taken and nothing renews. You can join the waiting list, which only opens a message in your own WhatsApp or email.'],
    ['Are the free tools really free?', 'Yes. The online tools are free to use without registration. Free embeds on your own website keep a GM Tools Hub credit link.'],
    ['How are digital products priced?', 'Templates and packs are one-time purchases with prices in US dollars and rupees shown on each product. They are not part of any monthly plan.'],
    ['How do I order a product?', 'Use the order button to message on WhatsApp or email. Payment details are confirmed there and the file is delivered after payment is confirmed. See the Refund Policy.'],
    ['What about the existing memberships?', 'Template Club and Career Pro are separate optional offers, delivered by hand with no automatic renewal. Their current prices are on the Membership page.']
  ];
  const shopRows = FEATURED.map(([id]) => { const p = product(id); return `<tr><td><a href="../shop/${id}/">${p.name}</a></td><td>${p.usd}</td><td>${p.pkr}</td><td><a href="${p.order}" target="_blank" rel="noopener noreferrer">Buy on WhatsApp</a></td></tr>`; }).join('');
  buildPage({ slug: 'pricing', title: 'Pricing: Free Tools, Pro, Agency and Custom', desc: 'GM Tools Hub pricing: free online tools, planned Pro and Agency embed plans, custom business solutions and one-time digital product prices in USD and PKR.', ld: [faqLd(faqs)],
    main: hero('Pricing', 'Simple, <span class="gradient-text">honest pricing</span>', 'Free tools today, planned plans for embedding, quoted business work, and one-time prices for digital products.') +
      `<section class="section"><div class="container"><h2 class="sr-only">Plans</h2><div class="v2-head"><div class="v2-note" style="margin:0;max-width:720px">${priceNote}</div>${currency}</div>${plans('../')}</div></section>
<section class="section alt"><div class="container" style="max-width:960px">${head('One-time purchases', 'Digital products', 'Paid once. Popular templates are below; the shop has the full range including career packs and printables.', '<a class="btn btn-ghost" href="../shop/">Visit the shop</a>')}<div style="overflow-x:auto"><table style="min-width:520px"><thead><tr><th>Product</th><th>USD</th><th>PKR</th><th>Order</th></tr></thead><tbody>${shopRows}</tbody></table></div><p class="small muted" style="margin-top:14px">Optional memberships (Template Club, Career Pro) are listed on the <a href="../membership/">Membership page</a>. See the <a href="../refund-policy/">Refund Policy</a> before ordering.</p></div></section>
<section class="section"><div class="container prose" style="max-width:860px"><h2>Questions</h2>${faqHtml(faqs)}</div></section><script src="../assets/js/home-v2.js?v=00000000" defer></script>` });
  const ctx = { window: {} }; vm.createContext(ctx); const cfg = read('assets/js/config.js'); vm.runInContext(cfg, ctx); const aff = (ctx.window.SITE_CONFIG && ctx.window.SITE_CONFIG.affiliates) || [];
  const seen = new Set(), items = aff.filter(a => a && a.url && /^https:\/\//.test(a.url) && !seen.has(a.url) && seen.add(a.url));
  buildPage({ slug: 'recommendations', title: 'Recommended Software, Tech and Books (Affiliate Links)', desc: 'GM Tools Hub recommendations for books, work technology and shopping, with every affiliate link clearly marked. We may earn a commission at no extra cost to you.',
    main: hero('Recommendations', 'Recommendations <span class="gradient-text">directory</span>', 'Books, work technology and shopping suggestions related to the tools and guides.') +
      `<section class="section"><div class="container"><div class="v2-note"><strong>Affiliate disclosure:</strong> every link below is an affiliate link. If you buy through one, GM may earn a small commission at no extra cost to you. As an Amazon Associate I earn from qualifying purchases. These links open a search or store page; they are not reviews or tests of a specific product. Read the full <a href="../affiliate-disclosure/">Affiliate Disclosure</a>.</div><h2 class="sr-only">Recommended links</h2><div class="v2-dir">${items.map(a => { const store = a.name.startsWith('Amazon:') ? 'Amazon' : a.name.split(':')[0]; return `<article><span class="v2-eyebrow">${esc(store)} &middot; affiliate</span><h3>${esc(a.name.replace(/^[^:]+:\s*/, '').replace(/^./, c => c.toUpperCase()))}</h3><p>${esc(a.note || '')}</p><a href="${esc(a.url)}" target="_blank" rel="sponsored nofollow noopener noreferrer">View on ${esc(store)} &rarr;</a></article>`; }).join('')}</div></div></section>` });
  console.log('pricing and recommendations built;', items.length, 'affiliate links listed');
}
// ---------- 4. shop: click-to-preview on product images
function shopPreview() {
  let h = read('shop/index.html'), n = 0;
  h = h.replace(/<img src="(\.\.\/assets\/img\/shop\/[a-z0-9-]+\.webp)" (?!data-full)/g, (m, src) => { n++; return '<img src="' + src + '" data-full="' + src + '" tabindex="0" role="button" title="Click to preview" '; });
  h = h.replace(/(assets\/img\/shop\/[a-z0-9-]+\.webp)(\?v=\d+)?"/g, '$1?v=2"');
  write('shop/index.html', h); console.log('shop preview enabled on', n, 'images');
}
sitewide(); home(); shopPreview(); await pages(); sitewide();
