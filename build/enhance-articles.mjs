// Adds checked references to selected articles, expands the margin vs markup guide and marks only the changed articles as updated.
// Safe to re-run. Run it again after build/make-posts.mjs, which rewrites some article pages.
// Each source below was opened and checked against the article's claim on the REVIEWED date. Re-check before changing that date.
import fs from 'fs';
const root = 'D:/GM_Claude/';
const REVIEWED = '2026-11-25', LABEL = '25 November 2026';
const MS = 'https://support.microsoft.com/en-us/excel/functions/';
const REFS = {
  'color-contrast-and-accessible-design': [
    ['https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html', 'W3C: Understanding contrast (minimum)', 'Level AA ratios for normal and large text.'],
    ['https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html', 'W3C: Understanding contrast (enhanced)', 'Level AAA ratios.'],
    ['https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html', 'W3C: Understanding non-text contrast', 'The 3 to 1 rule for controls and meaningful graphics.'],
    ['https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html', 'W3C: Understanding use of colour', 'Why colour must not be the only signal.'],
    ['https://www.colourblindawareness.org/colour-blindness/', 'Colour Blind Awareness: about colour blindness', 'How common colour vision deficiency is in men and women.']],
  'how-to-create-a-strong-password': [
    ['https://pages.nist.gov/800-63-4/sp800-63b.html', 'NIST SP 800-63B: Digital identity guidelines', 'Technical guidance on passwords, blocked common passwords and authentication methods.'],
    ['https://www.cisa.gov/secure-our-world/use-strong-passwords', 'CISA: Use strong passwords', 'Long, random, unique passwords and password managers.'],
    ['https://www.cisa.gov/secure-our-world/turn-mfa', 'CISA: Turn on multifactor authentication', 'Adding a second step when signing in.']],
  'jpg-vs-png-vs-webp': [
    ['https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types', 'MDN: Image file type and format guide', 'How JPEG, PNG and WebP compare and what each supports.'],
    ['https://developers.google.com/speed/webp', 'Google for Developers: WebP', 'Lossy and lossless WebP, transparency and file size.']],
  'excel-formulas-sales-ops': [
    [MS + 'sumifs-function', 'Microsoft Support: SUMIFS', 'Argument order and examples.'],
    [MS + 'xlookup-function', 'Microsoft Support: XLOOKUP', 'Syntax and version availability.'],
    [MS + 'ifs-function', 'Microsoft Support: IFS', 'Syntax and version availability.'],
    [MS + 'datedif-function', 'Microsoft Support: DATEDIF', 'Includes the warning about the "MD" unit.']],
  'loan-emi-formula-excel': [[MS + 'pmt-function', 'Microsoft Support: PMT', 'The Excel function used for the instalment.']],
  'flat-rate-vs-reducing-balance-loans': [[MS + 'pmt-function', 'Microsoft Support: PMT', 'Use it to reproduce the reducing-balance payments. Flat-rate figures use the simple formula shown above.']],
  'qr-codes-small-business': [
    ['https://faq.whatsapp.com/5913398998672934', 'WhatsApp Help Center: click to chat', 'The wa.me link format.'],
    ['https://support.google.com/contributionpolicy/answer/7400114', 'Google Maps user content policy', 'Includes the ban on offering incentives for reviews.'],
    ['https://www.qrcode.com/en/about/error_correction.html', 'DENSO WAVE: QR code error correction', 'How much damage a code can recover from.'],
    ['https://www.qrcode.com/en/howto/cell.html', 'DENSO WAVE: setting the module size', 'Why print size and printer resolution affect scanning.']]
};

const MARGIN_EXTRA = `<!-- extra:start -->
<h2>Converting between the two</h2>
<p>Write both as decimals, so 25% is 0.25.</p>
<ul>
<li><strong>Markup from margin:</strong> margin ÷ (1 − margin). A 20% margin is 0.20 ÷ 0.80 = 0.25, a 25% markup.</li>
<li><strong>Margin from markup:</strong> markup ÷ (1 + markup). A 50% markup is 0.50 ÷ 1.50, a margin of about 33.3%.</li>
</ul>
<p>Margin can never reach 100% while the product costs you something. Markup has no upper limit.</p>
<h2>In Excel or Google Sheets</h2>
<p>Put the cost in B2 and the selling price in C2, then format the two result cells as percentages.</p>
<table><tr><th>You want</th><th>Formula</th></tr>
<tr><td>Markup</td><td><code>=(C2-B2)/B2</code></td></tr>
<tr><td>Margin</td><td><code>=(C2-B2)/C2</code></td></tr>
<tr><td>Price for the margin in D2</td><td><code>=B2/(1-D2)</code></td></tr></table>
<p>If a price or cost can be blank, wrap the formula in IFERROR, but check the blank cells instead of hiding them for good.</p>
<h2>Pricing when there are fees and delivery</h2>
<p>Some costs are a fixed amount per order, such as delivery. Others are a share of the selling price, such as a payment or marketplace fee. They go in different places in the formula:</p>
<p><strong>Price = (product cost + fixed costs per sale) ÷ (1 − target margin − percentage fees)</strong></p>
<p>Example: the product costs 800, delivery costs you 100, the fee is 5% of the price and you want 30% left. The price is 900 ÷ (1 − 0.30 − 0.05) = 900 ÷ 0.65 ≈ 1,385. Check it: the fee is about 69, and 1,385 − 900 − 69 leaves about 416, which is 30% of 1,385. Real fee rates differ between providers and may carry tax, so use the figures from your own agreement.</p>
<h2>What a discount really costs</h2>
<p>Go back to the product that costs 800 and sells for 1,000. A 10% discount drops the price to 900, so profit falls from 200 to 100. The discount is 10%, but you lose half of the profit on each unit. You would need to sell twice as many to earn the same total.</p>
<p>The units you need, compared with before, are: <strong>old margin ÷ (old margin − discount)</strong>, with the discount measured against the old price.</p>
<table><tr><th>Discount</th><th>At a 20% margin</th><th>At a 40% margin</th></tr>
<tr><td>5%</td><td>1.33 times the units</td><td>1.14 times the units</td></tr>
<tr><td>10%</td><td>2 times the units</td><td>1.33 times the units</td></tr>
<tr><td>15%</td><td>4 times the units</td><td>1.6 times the units</td></tr></table>
<p>If the discount equals the margin, there is no product profit left at any volume. The table also leaves out extra costs that higher volume can bring, such as more staff time or delivery.</p>
<h2>Do not average margins</h2>
<p>Suppose product A has sales of 100,000 at a 40% margin, and product B has sales of 300,000 at 10%. The simple average of the two margins is 25%, but it is wrong. Profit is 40,000 + 30,000 = 70,000 on sales of 400,000, an overall margin of <strong>17.5%</strong>. Always divide total profit by total sales. When your sales mix moves towards lower-margin items, the overall margin falls even if no price has changed.</p>
<h2>Frequently asked questions</h2>
<h3>Is margin or markup always the bigger number?</h3>
<p>For a sale above cost, markup is always bigger, because it divides the same profit by the cost, which is smaller than the price. If you sell below cost, both are negative.</p>
<h3>Should the cost include tax?</h3>
<p>Treat cost and price the same way. Many businesses compare both without sales tax they collect or can claim back. Tax rules depend on your registration, so confirm yours with a tax adviser.</p>
<h3>Is gross margin the same as net margin?</h3>
<p>No. Gross margin takes away the cost of the goods sold. Net margin takes away all other expenses too, so it is usually much lower.</p>
<h3>What counts as a good margin?</h3>
<p>There is no single figure. It depends on your trade, your running costs and how fast stock sells. A useful test is whether your total gross profit covers your running costs and leaves enough over.</p>
<h3>Can I use the same margin on every product?</h3>
<p>You can, but many sellers do not. A fast-selling item may work on a thinner margin, while a slow or fragile one may need more. Watch the overall margin of the whole mix.</p>
<!-- extra:end -->`;

const longDate = LABEL;
let done = 0;
for (const slug of new Set([...Object.keys(REFS), 'profit-margin-vs-markup'])) {
  const f = root + 'blog/' + slug + '/index.html';
  let h = fs.readFileSync(f, 'utf8');
  h = h.replace(/<!-- refs:start -->[\s\S]*?<!-- refs:end -->\n?/, '').replace(/<!-- extra:start -->[\s\S]*?<!-- extra:end -->\n?/, '');
  if (slug === 'profit-margin-vs-markup') {
    const at = '<h2>Which one should you use?</h2>';
    if (!h.includes(at)) throw new Error('margin article marker missing');
    h = h.replace(at, () => MARGIN_EXTRA + '\n' + at);
  }
  if (REFS[slug]) {
    const block = '<!-- refs:start --><section class="refs"><h2>References</h2><ul>' + REFS[slug].map(([u, t, n]) => `<li><a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>. ${n}</li>`).join('') + `</ul><p class="small muted">Links checked on ${longDate}.</p></section><!-- refs:end -->\n`;
    const art = h.match(/<article class="prose">[\s\S]*?<\/article>/)[0];
    const cut = art.indexOf('<aside style=') >= 0 ? art.indexOf('<aside style=') : art.indexOf('<div class="share-row') >= 0 ? art.indexOf('<div class="share-row') : art.lastIndexOf('</article>');
    h = h.replace(art, () => art.slice(0, cut) + block + art.slice(cut));
  }
  // Visible "Updated" line and structured data, only for the articles changed here.
  h = h.replace(/(<span>Published [^<]+<\/span>)(<span>Updated [^<]+<\/span>)?/, `$1<span>Updated ${longDate}</span>`).replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/, `"dateModified":"${REVIEWED}"`);
  // Reading time follows the real length.
  const words = h.match(/<article class="prose">[\s\S]*?<\/article>/)[0].replace(/<(svg|div class="share-row)[\s\S]*$/, '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if (slug === 'profit-margin-vs-markup') {
    const read = Math.max(4, Math.round(words / 200)) + ' min read';
    h = h.replace(/(<span>Updated [^<]+<\/span><span>)\d+ min read/, '$1' + read);
  }
  if (!h.includes('<span>Updated ' + longDate)) throw new Error('no date line in ' + slug);
  fs.writeFileSync(f, h, 'utf8'); done++;
  console.log(slug.padEnd(42), words, 'words,', (REFS[slug] || []).length, 'references');
}
console.log('articles updated:', done);
