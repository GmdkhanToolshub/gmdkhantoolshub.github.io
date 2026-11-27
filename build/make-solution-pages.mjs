// Builds the five service pages under /solutions/ (no advertising on these sales pages) and adds the package
// section and links to the Solutions page. Safe to re-run.
import fs from 'fs';
import { ROOT, esc, buildPage, faqLd, faqHtml } from './page-shell.mjs';
import { WA, EMAIL, PACKAGES, TERMS, PAGES } from './solution-data.mjs';
const wa = text => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
const mail = (subject, body) => 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&amp;body=' + encodeURIComponent(body);
const ask = p => 'Hello GM, I am interested in the $' + p.price + ' package: ' + p.name + '.\n\nMy company:\nMy country:\nWhat my data looks like (no private details):\nWhen I need it:';

export const packageCards = (formHref) => '<div class="pk-grid">' + PACKAGES.map(p => `<article class="pk-card${p.featured ? ' pk-top' : ''}"><h3>${esc(p.name)}</h3><p class="pk-price"><strong>$${p.price}</strong> <span>one-time, USD</span></p><p class="pk-fit">${esc(p.fit)}</p><ul>${p.gets.map(g => '<li>' + esc(g) + '</li>').join('')}</ul><p class="pk-not"><b>Not included:</b> ${esc(p.not)}</p><div class="pk-cta"><a class="btn btn-primary" href="${formHref}" data-package="${p.id}" data-price="${p.price}">Enquire about this package</a><a class="pk-wa" href="${wa(ask(p))}" data-package="${p.id}" data-price="${p.price}" target="_blank" rel="noopener noreferrer">or ask on WhatsApp</a></div></article>`).join('') + '</div><p class="small muted pk-terms">' + esc(TERMS) + ' See the <a href="TERMS_BASEterms-and-conditions/">terms</a> and <a href="TERMS_BASErefund-policy/">refund policy</a>.</p>';

const table = (head, rows) => '<div class="sv-wrap"><table><thead><tr>' + head.map(x => '<th scope="col">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + r.map(x => '<td>' + esc(x) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const ul = a => '<ul>' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';

for (const s of PAGES) {
  const url = 'https://gmtoolshub.com/solutions/' + s.slug + '/';
  const others = PAGES.filter(o => o !== s).map(o => '<a href="../' + o.slug + '/">' + esc(o.short) + '</a>').join('');
  const main = `<section class="page-hero"><div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="../../">Home</a></li><li><a href="../">Business solutions</a></li><li aria-current="page">${esc(s.short)}</li></ol></nav><span class="eyebrow">${esc(s.short)}</span><h1>${s.h1}</h1><p class="lead">${esc(s.lead)}</p><div class="btn-row" style="margin-top:20px"><a class="btn btn-primary" href="#quote">Request a written quote</a><a class="btn btn-ghost" href="#packages">See $49 to $199 packages</a></div></div></section>
<section class="section"><div class="container prose sv-body"><h2>When this helps</h2>${ul(s.problem)}<h2>What you get</h2>${ul(s.gets)}<h2>${esc(s.exampleTitle)}</h2>${table(s.exampleHead, s.example)}<h2>What to send us</h2>${ul(s.send)}<p>Remove names, phone numbers, ID numbers and bank details before sharing any file. Never send a password.</p><h2>What is not included</h2><p>${esc(s.not)}</p><h2>Which option fits</h2><p>${esc(s.fit)}</p></div></section>
<section class="section alt" id="packages" style="scroll-margin-top:80px"><div class="container"><div class="section-head"><h2>Fixed-scope packages</h2><p>Start small, with the scope written down. Larger work is quoted.</p></div>${packageCards('#quote').split('TERMS_BASE').join('../../')}</div></section>
<section class="section"><div class="container prose sv-body"><h2>Who does the work</h2><p>GM Tools Hub is run by Gmd Khan Niazi (Ghulam Mohiuddin Khan Niazi), a Project Manager and Sales Operations professional with more than nine years of experience across FMCG, consumer goods and consumer electronics. Read the <a href="../../about/founder/">professional biography</a> or the <a href="../../resume/">resume</a>.</p><h2>Questions</h2>${faqHtml(s.faqs)}<h2>Free tools and guides to try first</h2><ul>${s.related.map(([h, t]) => '<li><a href="' + h + '">' + esc(t) + '</a></li>').join('')}</ul><h2>Other services</h2><nav class="sv-more" aria-label="Other services">${others}<a href="../">All business solutions</a></nav></div></section>
<section class="section alt" id="quote" style="scroll-margin-top:80px"><div class="container" style="max-width:860px"><div class="section-head"><h2>Request a quote</h2><p>Prefer email? Write to <a href="${mail('Quote request: ' + s.short, 'My company:\nMy country:\nWhat I need:\nWhen I need it:')}">${EMAIL}</a>.</p></div><div data-quote="${esc(s.short)}" data-quote-service="${esc(s.form)}"></div></div></section><script src="../../assets/js/quote.js?v=00000000" defer></script>`;
  const service = { '@context': 'https://schema.org', '@type': 'Service', name: s.short, serviceType: s.short, description: s.desc, url, provider: { '@type': 'Organization', '@id': 'https://gmtoolshub.com/#organization', name: 'GM Tools Hub', url: 'https://gmtoolshub.com/' }, areaServed: 'Worldwide (remote)' };
  buildPage({ slug: 'solutions/' + s.slug, depth: 2, ads: false, title: s.title, desc: s.desc, ld: [service, faqLd(s.faqs)], extraHead: '<link rel="stylesheet" href="../../assets/css/services-growth.css?v=00000000">\n', main });
  // three-step breadcrumb data, matching the visible breadcrumb
  const f = ROOT + 'solutions/' + s.slug + '/index.html';
  let h = fs.readFileSync(f, 'utf8');
  h = h.replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"BreadcrumbList"[\s\S]*?<\/script>/, '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gmtoolshub.com/' }, { '@type': 'ListItem', position: 2, name: 'Business solutions', item: 'https://gmtoolshub.com/solutions/' }, { '@type': 'ListItem', position: 3, name: s.short }] }) + '</script>');
  fs.writeFileSync(f, h, 'utf8');
  console.log('built', 'solutions/' + s.slug);
}

// the Solutions hub: packages and a link to each service page
const hubFile = ROOT + 'solutions/index.html';
let hub = fs.readFileSync(hubFile, 'utf8').replace(/<!-- gm:packages:start -->[\s\S]*?<!-- gm:packages:end -->\n?/g, '');
const block = `<!-- gm:packages:start --><section class="section" id="packages" style="scroll-margin-top:80px"><div class="container"><div class="section-head"><span class="eyebrow">Fixed-scope packages</span><h2>Excel work with the price and scope written down</h2><p>For international and local clients. Pick the closest package, send a sample, and receive written confirmation before you pay.</p></div>${packageCards('#quote').split('TERMS_BASE').join('../')}<h3 style="margin-top:34px">Look closer at each service</h3><nav class="sv-more" aria-label="Service pages">${PAGES.map(p => '<a href="' + p.slug + '/">' + esc(p.short) + '</a>').join('')}<a href="../portfolio/fmcg-sales-bi/">FMCG sample dashboard</a></nav></div></section><!-- gm:packages:end -->\n`;
const anchor = hub.search(/<section class="section[^"]*"[^>]*>(?:(?!<section)[\s\S])*?How a project works/);
if (anchor < 0) throw new Error('place for packages not found');
hub = hub.slice(0, anchor) + block + hub.slice(anchor);
if (!hub.includes('services-growth.css')) hub = hub.replace('</head>', '<link rel="stylesheet" href="../assets/css/services-growth.css?v=00000000">\n</head>');
// a clear route to the prices from the top of the page
if (!hub.includes('data-gm="to-packages"')) hub = hub.replace(/(<section class="page-hero">[\s\S]*?<p class="lead">[\s\S]*?<\/p>)/, '$1<div class="btn-row" style="margin-top:20px" data-gm="to-packages"><a class="btn btn-primary" href="#packages">Packages from $49</a><a class="btn btn-ghost" href="#quote">Request a quote</a></div>');
fs.writeFileSync(hubFile, hub, 'utf8');
console.log('Solutions hub updated');
