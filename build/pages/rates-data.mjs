import { esc, hero, faqLd, faqHtml, CSS } from '../page-shell.mjs';
export const slug = 'rates-data';
export const title = 'Pakistan Gold, Silver & Exchange Rate Data (JSON) | GM Tools Hub';
export const desc = 'Free daily JSON data for Pakistan gold per tola, silver per tola and PKR exchange rates (USD, GBP, EUR, AED, SAR, CAD, AUD, QAR). Fields, examples and terms of use.';
const faqs = [
 ['Is the data free to use?', 'Yes, for websites, apps and personal projects, as long as you show a visible link to gmtoolshub.com where you display the figures and keep the "estimate" wording. There is no API key and no sign-up.'],
 ['How often is it updated?', 'Once a day by an automated job. The files hold a short daily history. It is not a real-time or tick-by-tick feed.'],
 ['Are the numbers official?', 'No. Gold and silver are estimates from international prices converted to rupees per tola, and exchange rates come from a public feed. They are not a jeweller, bullion association or bank quote.'],
 ['Is there an uptime guarantee?', 'No. The files are served by a static host and may change or stop. Please cache the data and handle errors in your code. If you need agreed limits, a stable address or a custom feed, contact us and we can discuss it in writing.'],
 ['Can I request more currencies or fields?', 'Yes, send a request through the contact page. We add things only when we can maintain them reliably.']
];
export const ld = [faqLd(faqs)];
const code1 = `fetch('https://gmtoolshub.com/data/gold.json')
  .then(r => r.json())
  .then(d => {
    const last = d.history[d.history.length - 1];
    console.log(last.d, 'Gold 24K per tola: Rs', last.t24);
  });`;
const code2 = `import requests
d = requests.get('https://gmtoolshub.com/data/rates.json', timeout=15).json()
usd = d['history']['USD'][-1]
print(usd['d'], 'USD to PKR:', usd['r'])`;
export const main = `
${hero('Rates data', 'Developer data', 'Pakistan Gold, Silver &amp; Exchange Rate Data <span class="gradient-text">(JSON)</span>', 'Small public JSON files with the daily estimated gold and silver price per tola and PKR exchange rates. Free to use with a link back, no key needed.')}
${CSS}
<section class="section"><div class="container prose" style="max-width:900px">
<div class="ep-note"><strong>Please read:</strong> these are <strong>estimates</strong>, updated once a day, with no uptime guarantee. They are not official quotes. Show the "estimate" wording wherever you display them.</div>
<h2>Files</h2>
<div class="ep-wrap"><table><thead><tr><th>File</th><th>Contents</th><th>Fields in each history entry</th></tr></thead><tbody>
<tr><td><a href="../data/gold.json">/data/gold.json</a></td><td>Gold, 24 karat</td><td><code>d</code> date, <code>oz</code> USD per troy ounce, <code>usd</code> USD to PKR used, <code>t24</code> PKR per tola (24K)</td></tr>
<tr><td><a href="../data/silver.json">/data/silver.json</a></td><td>Silver</td><td><code>d</code> date, <code>oz</code> USD per troy ounce, <code>usd</code> USD to PKR used, <code>tola</code> PKR per tola</td></tr>
<tr><td><a href="../data/rates.json">/data/rates.json</a></td><td>PKR exchange rates</td><td>Under <code>history</code>, one list per currency (USD, GBP, EUR, AED, SAR, CAD, AUD, QAR). Each entry has <code>d</code> date and <code>r</code> PKR per 1 unit</td></tr>
</tbody></table></div>
<p>Each file also has <code>updated</code> (date of the last refresh) and <code>source</code> (the public feeds used). 22 karat gold is 22 divided by 24 of the 24 karat figure.</p>
<h2>Examples</h2>
<h3>JavaScript</h3><pre><code>${esc(code1)}</code></pre>
<h3>Python</h3><pre><code>${esc(code2)}</code></pre>
<h2>Terms of use</h2>
<ul><li>Free for websites, apps and personal projects.</li><li>Show a visible link to <a href="../">gmtoolshub.com</a> where you display the figures.</li><li>Keep the wording that the figures are estimates. Do not present them as official or live quotes.</li><li>Cache the data. Do not call the files more than a few times a day from the same app.</li><li>No warranty. The data, its format and its availability may change.</li></ul>
<h2>Prefer a ready-made box?</h2>
<p>Use the free <a href="../embed-rates/">live rates widget</a> with one line of code. For a branded version or a custom feed, <a href="../contact/">contact us</a> and agree terms in writing first.</p>
<h2>Frequently asked questions</h2>${faqHtml(faqs)}
</div></section>
`;
