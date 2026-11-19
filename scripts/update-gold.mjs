/* Daily gold-rate pages: international gold price (free gold-api.com feed, no key) converted to rupees with the dollar rate in data/rates.json.
   These are ESTIMATES from the international price, not jewellers' quotes, and every page says so.
   Writes: data/gold.json, gold-rate/index.html and gold-rate/<karat>-karat/index.html (marked blocks and meta descriptions), sitemap.xml (lastmod). */
import fs from 'node:fs';

const GRAMS_PER_OZ = 31.1035, GRAMS_PER_TOLA = 11.6638;
const KARATS = [{ k: 24, slug: '24-karat', purity: '99.9% pure' }, { k: 22, slug: '22-karat', purity: '91.6% gold' }, { k: 21, slug: '21-karat', purity: '87.5% gold' }, { k: 18, slug: '18-karat', purity: '75% gold' }];
const KEEP_DAYS = 90, SHOW_DAYS = 30;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const nin = n => Math.round(n).toLocaleString('en-IN');
const nf = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const longDate = iso => { const [y, m, d] = iso.split('-').map(Number); return d + ' ' + MON[m - 1] + ' ' + y; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
const g = await getJson('https://api.gold-api.com/price/XAU', 'gm-gold-bot');
const oz = g && g.price;
if (!(typeof oz === 'number' && isFinite(oz) && oz > 500 && oz < 20000)) throw new Error('Gold price out of range: ' + oz);
const date = (g.updatedAt || new Date().toISOString()).slice(0, 10);

const path = 'data/gold.json';
const data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : { history: [] };
const entry = { d: date, oz: Math.round(oz * 100) / 100, usd: Math.round(usdPkr * 10000) / 10000, t24: Math.round(oz * usdPkr / GRAMS_PER_OZ * GRAMS_PER_TOLA) };
const i = data.history.findIndex(x => x.d === date); if (i >= 0) data.history[i] = entry; else data.history.push(entry);
data.history.sort((a, b) => (a.d < b.d ? -1 : 1)); while (data.history.length > KEEP_DAYS) data.history.shift();
data.updated = date; data.source = 'gold-api.com + open.er-api.com';
fs.writeFileSync(path, JSON.stringify(data, null, 1) + '\n');

const H = data.history, cur = H[H.length - 1], prev = H.length > 1 ? H[H.length - 2] : null;
const tola = k => cur.t24 * k / 24, gram = k => tola(k) / GRAMS_PER_TOLA;
const dTxt = (now, before) => before === null ? 'First day recorded' : (now - before >= 0 ? '+' : '-') + 'Rs ' + nin(Math.abs(now - before)) + ' (' + (now - before >= 0 ? '+' : '-') + nf(Math.abs((now - before) / before * 100), 2) + '%)';

function patch(html, name, inner) {
  const re = new RegExp('<!--' + name + ':start-->[\\s\\S]*?<!--' + name + ':end-->');
  if (!re.test(html)) throw new Error('marker missing: ' + name);
  return html.replace(re, () => '<!--' + name + ':start-->' + inner + '<!--' + name + ':end-->');
}
function setMeta(html, text) {
  return html.replace(/(<meta name="description" content=")[^"]*(")/, (m, a, b) => a + esc(text) + b)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, (m, a, b) => a + esc(text) + b)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, (m, a, b) => a + esc(text) + b);
}
const SITE = 'https://gmdkhantoolshub.github.io';
function share(text, url) { return '<p><a class="btn btn-primary btn-sm" href="https://wa.me/?text=' + encodeURIComponent(text + '\n' + url) + '" target="_blank" rel="noopener noreferrer">Share on WhatsApp</a></p>'; }
const wrap = s => '<div class="pp-wrap">' + s + '</div>';
const histTable = k => '<h3>Estimated ' + k + ' karat price history (per tola)</h3>' + wrap('<table><thead><tr><th>Date</th><th>Per tola</th><th>Change</th></tr></thead><tbody>' +
  H.slice(-SHOW_DAYS).reverse().map((x, idx, arr) => { const p = arr[idx + 1]; const t = x.t24 * k / 24, pt = p ? p.t24 * k / 24 : null; return '<tr><td>' + longDate(x.d) + '</td><td>Rs ' + nin(t) + '</td><td>' + (pt === null ? '-' : (t - pt >= 0 ? '+' : '-') + 'Rs ' + nin(Math.abs(t - pt))) + '</td></tr>'; }).join('') + '</tbody></table>') +
  '<p class="small muted">History is recorded by this site once a day from ' + longDate(H[0].d) + ', so the table grows daily.</p>';
const dataDiv = k => '<div id="gold-data" data-tola="' + tola(k).toFixed(2) + '" data-karat="' + k + '" data-date="' + cur.d + '" hidden></div>';
const ans = k => '<div class="pp-ans"><div><span>' + k + 'K per tola</span><b>Rs ' + nin(tola(k)) + '</b></div><div><span>Per 10 grams</span><b>Rs ' + nin(gram(k) * 10) + '</b></div><div><span>Per gram</span><b>Rs ' + nin(gram(k)) + '</b></div><div><span>Change vs previous day</span><b>' + dTxt(cur.t24, prev ? prev.t24 : null).replace(/Rs \d[\d,]*/, m => m) + '</b></div></div>';

const jobs = [];
for (const K of KARATS) {
  const p = 'gold-rate/' + K.slug + '/index.html'; if (!fs.existsSync(p)) { console.log('skip', p); continue; }
  let html = fs.readFileSync(p, 'utf8'); const k = K.k;
  const lead = 'Estimated ' + k + ' karat gold price: Rs ' + nin(tola(k)) + ' per tola on ' + longDate(cur.d) + '. International price converted to rupees, not a jeweller\'s quote.';
  const rows = [['1 ratti', GRAMS_PER_TOLA / 96], ['1 masha', GRAMS_PER_TOLA / 12], ['Half tola', GRAMS_PER_TOLA / 2], ['1 tola', GRAMS_PER_TOLA], ['5 tola', GRAMS_PER_TOLA * 5], ['10 tola', GRAMS_PER_TOLA * 10], ['10 grams', 10], ['1 gram', 1], ['1 troy ounce', GRAMS_PER_OZ]];
  const body = dataDiv(k) + ans(k) + share('Estimated ' + k + ' karat gold in Pakistan today (' + longDate(cur.d) + '): Rs ' + nin(tola(k)) + ' per tola', SITE + '/gold-rate/' + K.slug + '/') +
    '<p class="small muted">International gold: US$ ' + nf(cur.oz, 2) + ' per troy ounce and 1 USD = ' + nf(cur.usd, 2) + ' PKR on ' + longDate(cur.d) + '. Updated once a day.</p>' +
    '<h3>' + k + ' karat gold price by weight</h3>' + wrap('<table><thead><tr><th>Weight</th><th>Grams</th><th>Estimated price</th></tr></thead><tbody>' + rows.map(r => '<tr><td>' + r[0] + '</td><td>' + nf(r[1], 3).replace(/\.?0+$/, '') + '</td><td>Rs ' + nin(r[1] * gram(k)) + '</td></tr>').join('') + '</tbody></table>') +
    '<p><strong>Zakat nisab:</strong> 7.5 tola (87.48 g) of ' + k + ' karat gold is worth about Rs ' + nin(7.5 * tola(k)) + ' at this estimate. Use the <a href="../../tools/zakat-calculator/">Zakat Calculator</a> for the full calculation.</p>' + histTable(k);
  html = patch(html, 'gold-lead', lead); html = patch(html, 'gold-body', body);
  html = setMeta(html, 'Estimated ' + k + ' karat gold rate in Pakistan: Rs ' + nin(tola(k)) + ' per tola, Rs ' + nin(gram(k) * 10) + ' per 10 g (' + longDate(cur.d) + '). Price by weight, history and calculator.');
  fs.writeFileSync(p, html); jobs.push('/gold-rate/' + K.slug + '/');
}
const hp = 'gold-rate/index.html';
if (fs.existsSync(hp)) {
  let html = fs.readFileSync(hp, 'utf8');
  const lead = 'Estimated 24 karat gold: Rs ' + nin(tola(24)) + ' per tola on ' + longDate(cur.d) + '. International gold price converted to rupees, not a jeweller\'s quote. Updated every day.';
  const body = dataDiv(24) + ans(24) + share('Gold rate in Pakistan today (estimate, ' + longDate(cur.d) + '): 24K Rs ' + nin(tola(24)) + ' per tola, 22K Rs ' + nin(tola(22)) + ' per tola', SITE + '/gold-rate/') + '<p class="small muted">International gold: US$ ' + nf(cur.oz, 2) + ' per troy ounce and 1 USD = ' + nf(cur.usd, 2) + ' PKR on ' + longDate(cur.d) + '.</p>' +
    '<h3>Gold rate in Pakistan today by karat</h3>' + wrap('<table><thead><tr><th>Karat</th><th>Purity</th><th>Per tola</th><th>Per 10 grams</th><th>Per gram</th></tr></thead><tbody>' +
      KARATS.map(K => '<tr><td><a href="./' + K.slug + '/">' + K.k + ' karat</a></td><td>' + K.purity + '</td><td>Rs ' + nin(tola(K.k)) + '</td><td>Rs ' + nin(gram(K.k) * 10) + '</td><td>Rs ' + nin(gram(K.k)) + '</td></tr>').join('') + '</tbody></table>') +
    '<p><strong>Zakat nisab:</strong> 7.5 tola (87.48 g) of 24 karat gold is worth about Rs ' + nin(7.5 * tola(24)) + ' at this estimate.</p>' + histTable(24);
  html = patch(html, 'gold-lead', lead); html = patch(html, 'gold-body', body);
  html = setMeta(html, 'Gold rate in Pakistan today (estimate): 24K Rs ' + nin(tola(24)) + ' per tola, 22K Rs ' + nin(tola(22)) + ' on ' + longDate(cur.d) + '. Price by karat, history and calculator.');
  fs.writeFileSync(hp, html); jobs.push('/gold-rate/');
}
if (fs.existsSync('sitemap.xml')) {
  let sm = fs.readFileSync('sitemap.xml', 'utf8');
  for (const pth of jobs) { const loc = 'https://gmdkhantoolshub.github.io' + pth; const re = new RegExp('(<loc>' + loc.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '</loc><lastmod>)[^<]*(</lastmod>)'); if (re.test(sm)) sm = sm.replace(re, (m, a, b) => a + cur.d + b); }
  fs.writeFileSync('sitemap.xml', sm);
}
console.log('Gold updated for', cur.d, 'US$' + cur.oz + '/oz', 'Rs ' + nin(tola(24)) + '/tola (24K)', 'Rs ' + nin(tola(22)) + '/tola (22K)');
