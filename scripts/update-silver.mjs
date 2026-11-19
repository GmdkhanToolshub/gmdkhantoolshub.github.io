/* Daily silver-rate page: international silver price (free gold-api.com feed, no key) converted to rupees with the dollar rate in data/rates.json.
   ESTIMATES from the international price, not jewellers' quotes, and the page says so.
   Writes: data/silver.json, silver-rate/index.html (marked blocks and meta description), sitemap.xml (lastmod). */
import fs from 'node:fs';

const GRAMS_PER_OZ = 31.1035, GRAMS_PER_TOLA = 11.6638, KEEP_DAYS = 90, SHOW_DAYS = 30;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const nin = n => Math.round(n).toLocaleString('en-IN');
const nf = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const longDate = iso => { const [y, m, d] = iso.split('-').map(Number); return d + ' ' + MON[m - 1] + ' ' + y; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const SITE = 'https://gmdkhantoolshub.github.io';
function share(text, url) { return '<p><a class="btn btn-primary btn-sm" href="https://wa.me/?text=' + encodeURIComponent(text + '\n' + url) + '" target="_blank" rel="noopener noreferrer">Share on WhatsApp</a></p>'; }

async function getJson(url, ua) {
  let last;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': ua }, signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) { last = e; await new Promise(res => setTimeout(res, 4000 * attempt)); }
  }
  throw new Error('Feed unavailable after 4 tries: ' + (last && last.message));
}
const rates = JSON.parse(fs.readFileSync('data/rates.json', 'utf8'));
const usdHist = rates.history && rates.history.USD; if (!usdHist || !usdHist.length) throw new Error('data/rates.json has no USD history');
const usdPkr = usdHist[usdHist.length - 1].r;
const g = await getJson('https://api.gold-api.com/price/XAG', 'gm-silver-bot'); const oz = g && g.price;
if (!(typeof oz === 'number' && isFinite(oz) && oz > 3 && oz < 1000)) throw new Error('Silver price out of range: ' + oz);
const date = (g.updatedAt || new Date().toISOString()).slice(0, 10);

const path = 'data/silver.json';
const data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : { history: [] };
const entry = { d: date, oz: Math.round(oz * 1000) / 1000, usd: Math.round(usdPkr * 10000) / 10000, tola: Math.round(oz * usdPkr / GRAMS_PER_OZ * GRAMS_PER_TOLA) };
const i = data.history.findIndex(x => x.d === date); if (i >= 0) data.history[i] = entry; else data.history.push(entry);
data.history.sort((a, b) => (a.d < b.d ? -1 : 1)); while (data.history.length > KEEP_DAYS) data.history.shift();
data.updated = date; data.source = 'gold-api.com + open.er-api.com';
fs.writeFileSync(path, JSON.stringify(data, null, 1) + '\n');

const H = data.history, cur = H[H.length - 1], prev = H.length > 1 ? H[H.length - 2] : null;
const tola = cur.tola, gram = tola / GRAMS_PER_TOLA;
const dTxt = prev === null ? 'First day recorded' : (tola - prev.tola >= 0 ? '+' : '-') + 'Rs ' + nin(Math.abs(tola - prev.tola)) + ' (' + (tola - prev.tola >= 0 ? '+' : '-') + nf(Math.abs((tola - prev.tola) / prev.tola * 100), 2) + '%)';
function patch(html, name, inner) {
  const re = new RegExp('<!--' + name + ':start-->[\\s\\S]*?<!--' + name + ':end-->');
  if (!re.test(html)) throw new Error('marker missing: ' + name);
  return html.replace(re, () => '<!--' + name + ':start-->' + inner + '<!--' + name + ':end-->');
}
const wrap = s => '<div class="pp-wrap">' + s + '</div>';
const rows = [['1 ratti', GRAMS_PER_TOLA / 96], ['1 masha', GRAMS_PER_TOLA / 12], ['Half tola', GRAMS_PER_TOLA / 2], ['1 tola', GRAMS_PER_TOLA], ['10 tola', GRAMS_PER_TOLA * 10], ['10 grams', 10], ['100 grams', 100], ['1 kilogram', 1000], ['1 troy ounce', GRAMS_PER_OZ]];
const body = '<div id="gold-data" data-tola="' + tola.toFixed(2) + '" data-label="silver" data-date="' + cur.d + '" hidden></div>' +
  '<div class="pp-ans"><div><span>Silver per tola</span><b>Rs ' + nin(tola) + '</b></div><div><span>Per 10 grams</span><b>Rs ' + nin(gram * 10) + '</b></div><div><span>Per gram</span><b>Rs ' + nin(gram) + '</b></div><div><span>Change vs previous day</span><b>' + dTxt + '</b></div></div>' +
  share('Silver rate in Pakistan today (estimate, ' + longDate(cur.d) + '): Rs ' + nin(tola) + ' per tola', SITE + '/silver-rate/') +
  '<p class="small muted">International silver: US$ ' + nf(cur.oz, 2) + ' per troy ounce and 1 USD = ' + nf(cur.usd, 2) + ' PKR on ' + longDate(cur.d) + '. Updated once a day.</p>' +
  '<h3>Silver price by weight (pure silver)</h3>' + wrap('<table><thead><tr><th>Weight</th><th>Grams</th><th>Estimated price</th></tr></thead><tbody>' + rows.map(r => '<tr><td>' + r[0] + '</td><td>' + nf(r[1], 3).replace(/\.?0+$/, '') + '</td><td>Rs ' + nin(r[1] * gram) + '</td></tr>').join('') + '</tbody></table>') +
  '<h3>Silver by purity</h3>' + wrap('<table><thead><tr><th>Purity</th><th>Per tola</th><th>Per 10 grams</th></tr></thead><tbody><tr><td>Pure (999)</td><td>Rs ' + nin(tola) + '</td><td>Rs ' + nin(gram * 10) + '</td></tr><tr><td>Sterling (925)</td><td>Rs ' + nin(tola * 0.925) + '</td><td>Rs ' + nin(gram * 10 * 0.925) + '</td></tr></tbody></table>') +
  '<p><strong>Zakat nisab:</strong> 52.5 tola (612.36 g) of silver is worth about Rs ' + nin(52.5 * tola) + ' at this estimate. Use the <a href="../tools/zakat-calculator/">Zakat Calculator</a> for the full calculation.</p>' +
  '<h3>Estimated silver price history (per tola)</h3>' + wrap('<table><thead><tr><th>Date</th><th>Per tola</th><th>Change</th></tr></thead><tbody>' +
    H.slice(-SHOW_DAYS).reverse().map((x, idx, arr) => { const p = arr[idx + 1]; return '<tr><td>' + longDate(x.d) + '</td><td>Rs ' + nin(x.tola) + '</td><td>' + (p ? (x.tola - p.tola >= 0 ? '+' : '-') + 'Rs ' + nin(Math.abs(x.tola - p.tola)) : '-') + '</td></tr>'; }).join('') + '</tbody></table>') +
  '<p class="small muted">History is recorded by this site once a day from ' + longDate(H[0].d) + ', so the table grows daily.</p>';
const hp = 'silver-rate/index.html';
if (!fs.existsSync(hp)) throw new Error('silver-rate/index.html missing');
let html = fs.readFileSync(hp, 'utf8');
html = patch(html, 'gold-lead', 'Estimated silver price: Rs ' + nin(tola) + ' per tola on ' + longDate(cur.d) + '. International price converted to rupees, not a jeweller\'s quote. Updated every day.');
html = patch(html, 'gold-body', body);
const meta = 'Estimated silver rate in Pakistan today: Rs ' + nin(tola) + ' per tola, Rs ' + nin(gram * 10) + ' per 10 g (' + longDate(cur.d) + '). Price by weight, history and calculator.';
html = html.replace(/(<meta name="description" content=")[^"]*(")/, (m, a, b) => a + esc(meta) + b).replace(/(<meta property="og:description" content=")[^"]*(")/, (m, a, b) => a + esc(meta) + b).replace(/(<meta name="twitter:description" content=")[^"]*(")/, (m, a, b) => a + esc(meta) + b);
fs.writeFileSync(hp, html);
if (fs.existsSync('sitemap.xml')) {
  let sm = fs.readFileSync('sitemap.xml', 'utf8'); const loc = SITE + '/silver-rate/';
  const re = new RegExp('(<loc>' + loc.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '</loc><lastmod>)[^<]*(</lastmod>)'); if (re.test(sm)) sm = sm.replace(re, (m, a, b) => a + cur.d + b);
  fs.writeFileSync('sitemap.xml', sm);
}
console.log('Silver updated for', cur.d, 'US$' + cur.oz + '/oz', 'Rs ' + nin(tola) + '/tola');
