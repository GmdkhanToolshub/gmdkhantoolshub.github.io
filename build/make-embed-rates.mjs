// Builds /embed-rates/index.html (landing page for the free Live Rates widget) using the site's own shell from gold-rate/index.html.
// Usage: node build/make-embed-rates.mjs   (idempotent; rerun after header/footer changes)
import fs from 'fs';
const root = 'D:/GM_Claude/';
const src = fs.readFileSync(root + 'gold-rate/index.html', 'utf8');
const mi = src.indexOf('<main id="main">'); const me = src.indexOf('</main>');
let pre = src.slice(0, mi + '<main id="main">'.length); let post = src.slice(me);

const TITLE = 'Free Pakistan Gold, Silver & Dollar Rate Widget | GM Tools Hub';
const DESC = 'Free embeddable widget showing Pakistan gold (24K, 22K per tola), silver and USD to PKR rates. One line of code, no sign-up, updated daily. Estimates, English or Urdu.';
const URL = 'https://gmtoolshub.com/embed-rates/';
pre = pre.replace(/<title>[\s\S]*?<\/title>/, '<title>' + TITLE.replace(/&/g, '&amp;') + '</title>')
  .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + DESC + '">')
  .replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + URL + '">')
  .replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + TITLE.replace(/&/g, '&amp;') + '">')
  .replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + DESC + '">')
  .replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="' + URL + '">')
  .replace(/<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="' + TITLE.replace(/&/g, '&amp;') + '">')
  .replace(/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="' + DESC + '">')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
// the page embeds our own widget in an iframe
pre = pre.replace(/frame-src https:;/, "frame-src 'self' https:;");

const faqs = [
 ['Is the Pakistan rates widget really free?', 'Yes. You can add it to a website or blog for free, with no account and no sign-up. The widget shows a small "Rates by GM Tools Hub" link, which you should keep in place.'],
 ['Are these official gold and dollar rates?', 'No. They are estimates worked out from the international gold and silver price and the dollar to rupee exchange rate. Local jewellers, bullion associations and banks add their own premiums and may differ by a few percent. The widget says this on every display.'],
 ['How often do the numbers update?', 'Once a day, by an automated job that collects the international prices and the exchange rate. The widget shows the date of the last update and the change since the previous day. It is not a live tick-by-tick price.'],
 ['How is the gold rate per tola calculated?', 'The international price of one troy ounce of gold in US dollars is multiplied by the dollar to rupee rate, divided by 31.1035 grams per troy ounce, and multiplied by 11.6638 grams per tola. For 22 karat the result is multiplied by 22 and divided by 24.'],
 ['Can I show the rates in Urdu or in dark mode?', 'Yes. Choose Urdu in the builder on this page, or add lang=ur to the widget address. Add theme=dark for dark mode and accent with a six-digit colour code to match your site.'],
 ['Can I remove the credit link or add my shop name?', 'The free widget keeps the credit link. If you want a branded version, for example "Rates presented by your shop" with your colours and no credit, contact me and we can arrange a custom version. Prices are agreed in writing before any work starts.'],
 ['Does the widget slow down my site or track my visitors?', 'The widget is a small page loaded in an iframe, with no advertising or tracking scripts of its own and no cookies set by the widget. It reads three small data files from gmtoolshub.com once when it loads.']
];
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const faqHtml = faqs.map(([q, a]) => '<details class="faq"><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('');
const ld = [
 { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gmtoolshub.com/' }, { '@type': 'ListItem', position: 2, name: 'Embed live rates' }] },
 { '@context': 'https://schema.org', '@type': 'WebPage', name: TITLE.replace(' | GM Tools Hub', ''), url: URL, description: DESC, inLanguage: 'en', isPartOf: { '@type': 'WebSite', name: 'GM Tools Hub', url: 'https://gmtoolshub.com/' }, author: { '@type': 'Person', name: 'Gmd Khan Niazi' } },
 { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
].map(o => '<script type="application/ld+json">' + JSON.stringify(o) + '</script>').join('\n');
pre = pre.replace('</head>', ld + '\n</head>');

const style = '<style>.er-grid{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));align-items:start}.er-card{border:1px solid var(--border);border-radius:16px;background:var(--surface);padding:18px}.er-card h2,.er-card h3{margin-top:0}.er-opt{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:0 0 12px}.er-opt label{display:flex;gap:6px;align-items:center;font-weight:600}.er-opt select,.er-opt input[type=color]{font:inherit;padding:6px 8px;border-radius:10px;border:1.5px solid var(--border-strong);background:var(--surface);color:var(--text)}.er-opt input[type=color]{padding:2px;width:44px;height:34px}.er-code{width:100%;min-height:104px;font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;padding:10px;border-radius:12px;border:1.5px solid var(--border-strong);background:var(--surface);color:var(--text);resize:vertical}.er-prev{width:100%;border:0;min-height:360px;background:transparent}.er-note{padding:14px 16px;border:1px solid var(--border-strong);border-left:4px solid var(--accent);border-radius:12px;background:var(--surface)}.er-pills{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}.er-pills li{padding:6px 12px;border:1px solid var(--border);border-radius:999px;background:var(--surface);font-size:.9rem}</style>';

const main = `
<section class="page-hero"><div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="../">Home</a></li><li aria-current="page">Embed live rates</li></ol></nav><span class="eyebrow">Free widget</span><h1>Live Gold, Silver &amp; Dollar Rates for <span class="gradient-text">Your Website</span></h1><p class="lead">Add Pakistan's estimated gold (24K and 22K per tola), silver and USD to PKR rates to any website with one line of code. Free, no sign-up, updated every day, in English or Urdu.</p></div></section>
${style}
<section class="section"><div class="container" style="max-width:1040px">
<div class="er-note"><strong>Please read:</strong> the numbers are <strong>estimates</strong> from international gold and silver prices and the dollar to rupee rate. They are <strong>not a jeweller's, bullion association's or bank's quote</strong>, and they update once a day, not live. The widget states this on screen.</div>
<div class="er-grid" style="margin-top:18px">
<div class="er-card"><h2>1. Choose and preview</h2>
<div class="er-opt"><label><input type="checkbox" id="er-gold" checked> Gold</label><label><input type="checkbox" id="er-silver" checked> Silver</label><label><input type="checkbox" id="er-usd" checked> Dollar</label></div>
<div class="er-opt"><label>Theme <select id="er-theme"><option value="light">Light</option><option value="dark">Dark</option></select></label><label>Language <select id="er-lang"><option value="en">English</option><option value="ur">Ø§Ø±Ø¯Ùˆ</option></select></label><label>Accent <input type="color" id="er-accent" value="#0e7490" aria-label="Accent colour"></label></div>
<iframe class="er-prev" id="er-prev" title="Live rates preview" src="../embed/live-rates/" loading="lazy"></iframe></div>
<div class="er-card"><h2>2. Copy the code</h2>
<p class="small muted">Paste this where you want the rates to appear (a page, post or sidebar).</p>
<textarea class="er-code" id="er-code" readonly aria-label="Embed code"></textarea>
<p><button class="btn btn-primary btn-sm" type="button" id="er-copy">Copy code</button> <span class="small muted" id="er-msg" aria-live="polite"></span></p>
<details><summary><strong>Optional: auto-fit the height</strong></summary><p class="small muted">Add this once on the page and the box resizes itself on small screens.</p><textarea class="er-code" id="er-code2" readonly aria-label="Auto-resize code" style="min-height:96px"></textarea></details></div>
</div></div></section>
<section class="section alt"><div class="container prose" style="max-width:860px">
<h2>What the widget shows</h2>
<ul><li><strong>Gold, 24 karat and 22 karat, per tola</strong> (one tola is 11.6638 grams).</li><li><strong>Silver, per tola.</strong></li><li><strong>US dollar to Pakistani rupee.</strong></li><li>The change since the previous day, the date of the last update and a plain "estimate" notice.</li></ul>
<h2>Where the numbers come from</h2>
<p>Gold and silver prices in US dollars per troy ounce come from the free <a href="https://gold-api.com" target="_blank" rel="noopener noreferrer">gold-api.com</a> feed and the dollar rate from <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">Exchange Rate API</a>. A scheduled job on this site collects them once a day and converts them to rupees per tola. The same figures power the <a href="../gold-rate/">gold rate</a>, <a href="../silver-rate/">silver rate</a> and <a href="../rates/usd-to-pkr/">USD to PKR</a> pages, which also show the daily history and how each figure is calculated.</p>
<h2>Who it is for</h2>
<ul class="er-pills"><li>Jewellers and bullion shops</li><li>Exchange and remittance businesses</li><li>News and finance blogs</li><li>Real-estate and loan sites</li><li>Zakat and Islamic finance pages</li><li>Community and school sites</li></ul>
<h2>Free and branded versions</h2>
<p>The free widget is yours to use on any lawful website as long as you keep the small credit link. If you want a branded version, for example "Rates presented by your shop", with your colours, your name and no credit link, <a href="../contact/">contact me</a>. Terms and price are agreed in writing before any work starts, and the rates stay clearly labelled as estimates.</p>
<h2>Terms of use</h2>
<ul><li>Keep the credit link and the estimate notice visible.</li><li>Do not present the figures as an official or live quote.</li><li>Do not use the widget on unlawful, misleading or adult sites.</li><li>The service is provided as it is. It may change or stop, and accuracy is not guaranteed. See the <a href="../disclaimer/">disclaimer</a>.</li></ul>
</div></section>
<section class="section"><div class="container prose" style="max-width:860px"><h2>Frequently asked questions</h2>${faqHtml}
<h3>Related pages</h3><ul class="er-pills"><li><a href="../gold-rate/">Gold rate in Pakistan</a></li><li><a href="../silver-rate/">Silver rate</a></li><li><a href="../rates/usd-to-pkr/">USD to PKR</a></li><li><a href="../tools/tola-gold-converter/">Tola to Gram Converter</a></li><li><a href="../tools/zakat-calculator/">Zakat Calculator</a></li><li><a href="../advertise/">Advertise with us</a></li></ul></div></section>
<script>(function(){
var $=function(i){return document.getElementById(i)};
function upd(){var s=[];['gold','silver','usd'].forEach(function(k){if($('er-'+k).checked)s.push(k)});if(!s.length){$('er-gold').checked=true;s=['gold']}
var q='?show='+s.join(',')+'&theme='+$('er-theme').value+'&lang='+$('er-lang').value;var a=$('er-accent').value.replace('#','');if(a&&a!=='0e7490')q+='&accent='+a;
$('er-prev').src='../embed/live-rates/'+q;
$('er-code').value='<iframe src="https://gmtoolshub.com/embed/live-rates/'+q+'" title="Pakistan gold, silver and dollar rates" width="100%" height="240" style="border:0;max-width:720px;display:block" loading="lazy"></iframe>';
$('er-code2').value='<script>addEventListener("message",function(e){if(e.origin==="https://gmtoolshub.com"&&e.data&&e.data.gmRatesHeight){document.querySelectorAll(\\'iframe[src*="gmtoolshub.com/embed/live-rates"]\\').forEach(function(f){f.style.height=(e.data.gmRatesHeight+8)+"px"})}})<\\/script>'}
['er-gold','er-silver','er-usd','er-theme','er-lang','er-accent'].forEach(function(i){$(i).addEventListener('change',upd)});
$('er-copy').addEventListener('click',function(){var t=$('er-code').value;var done=function(){$('er-msg').textContent='Copied.'};
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){$('er-code').select();$('er-msg').textContent='Press Ctrl+C to copy.'})}else{$('er-code').select();$('er-msg').textContent='Press Ctrl+C to copy.'}});
upd()})();</script>
`;
post = post.replace(/\s*<script src="\.\.\/assets\/js\/gold-page\.js[^>]*><\/script>/, '').replace(/%2Fservices%2F/g, '%2Fembed-rates%2F');
fs.mkdirSync(root + 'embed-rates', { recursive: true });
fs.writeFileSync(root + 'embed-rates/index.html', pre + main + post, 'utf8');
console.log('embed-rates/index.html written', (pre + main + post).length);
