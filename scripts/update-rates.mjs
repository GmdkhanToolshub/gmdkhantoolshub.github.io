/* Daily exchange-rate pages: fetch mid-market rates, record the history, refresh the rate pages and the sitemap dates.
   Source: the free open.er-api.com feed (Exchange Rate API open access). No key needed; attribution is shown on every rate page.
   Writes: data/rates.json, rates/index.html and rates/<pair>/index.html (only the marked blocks and meta descriptions), sitemap.xml (lastmod). */
import fs from 'node:fs';

const API = 'https://open.er-api.com/v6/latest/USD';
const CUR = [
  { code: 'USD', slug: 'usd-to-pkr', name: 'US dollar', short: 'dollar', flag: 'US' },
  { code: 'GBP', slug: 'gbp-to-pkr', name: 'British pound', short: 'pound', flag: 'UK' },
  { code: 'EUR', slug: 'eur-to-pkr', name: 'euro', short: 'euro', flag: 'EU' },
  { code: 'AED', slug: 'aed-to-pkr', name: 'UAE dirham', short: 'dirham', flag: 'UAE' },
  { code: 'SAR', slug: 'sar-to-pkr', name: 'Saudi riyal', short: 'riyal', flag: 'Saudi Arabia' },
  { code: 'CAD', slug: 'cad-to-pkr', name: 'Canadian dollar', short: 'Canadian dollar', flag: 'Canada' },
  { code: 'AUD', slug: 'aud-to-pkr', name: 'Australian dollar', short: 'Australian dollar', flag: 'Australia' },
  { code: 'QAR', slug: 'qar-to-pkr', name: 'Qatari riyal', short: 'Qatari riyal', flag: 'Qatar' },
];
const KEEP_DAYS = 90, SHOW_DAYS = 30;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const nf = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const nin = n => Math.round(n).toLocaleString('en-IN');
const longDate = iso => { const [y, m, d] = iso.split('-').map(Number); return d + ' ' + MON[m - 1] + ' ' + y; };
const SITE = 'https://gmtoolshub.com';
function share(text, url) { return '<p><a class="btn btn-primary btn-sm" href="https://wa.me/?text=' + encodeURIComponent(text + '\n' + url) + '" target="_blank" rel="noopener noreferrer">Share on WhatsApp</a></p>'; }
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function load() {
  const res = await fetch(API, { headers: { 'User-Agent': 'gm-rates-bot' } });
  if (!res.ok) throw new Error('Feed returned HTTP ' + res.status);
  const j = await res.json();
  if (!j || j.result !== 'success' || !j.rates || !(j.rates.PKR > 0)) throw new Error('Unexpected feed response');
  const out = {};
  for (const c of CUR) {
    const r = j.rates[c.code];
    if (!(typeof r === 'number' && isFinite(r) && r > 0)) throw new Error('Missing rate for ' + c.code);
    out[c.code] = j.rates.PKR / r;                       // rupees for one unit of the currency
    if (!(out[c.code] > 0.5 && out[c.code] < 5000)) throw new Error('Rate out of range for ' + c.code + ': ' + out[c.code]);
  }
  const date = new Date(j.time_last_update_unix * 1000).toISOString().slice(0, 10);
  return { date, rates: out, updatedUtc: j.time_last_update_utc };
}

const dataPath = 'data/rates.json';
const data = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, 'utf8')) : { history: {} };
const live = await load();
data.updated = live.date; data.source = 'open.er-api.com'; data.history = data.history || {};
for (const c of CUR) {
  const h = (data.history[c.code] = data.history[c.code] || []);
  const val = Math.round(live.rates[c.code] * 10000) / 10000;
  const i = h.findIndex(x => x.d === live.date);
  if (i >= 0) h[i].r = val; else h.push({ d: live.date, r: val });
  h.sort((a, b) => (a.d < b.d ? -1 : 1));
  while (h.length > KEEP_DAYS) h.shift();
}
fs.writeFileSync(dataPath, JSON.stringify(data, null, 1) + '\n');

function pairBlocks(c) {
  const h = data.history[c.code], cur = h[h.length - 1], prev = h.length > 1 ? h[h.length - 2] : null;
  const r = cur.r, date = longDate(cur.d);
  const chg = prev ? r - prev.r : null, pct = prev ? chg / prev.r * 100 : null;
  const chgTxt = prev ? (chg >= 0 ? '+' : '-') + nf(Math.abs(chg), 2) + ' (' + (pct >= 0 ? '+' : '-') + nf(Math.abs(pct), 2) + '%)' : 'First day recorded';
  const lead = '1 ' + c.code + ' = ' + nf(r, 2) + ' PKR on ' + date + ' (mid-market rate). Updated every day.';
  const amounts = [1, 5, 10, 50, 100, 500, 1000, 5000], back = [10000, 50000, 100000, 500000, 1000000];
  const body =
    '<div id="rate-data" data-rate="' + r.toFixed(4) + '" data-code="' + c.code + '" data-date="' + cur.d + '" hidden></div>' +
    '<div class="pp-ans"><div><span>Rate today</span><b>1 ' + c.code + ' = ' + nf(r, 2) + ' PKR</b></div><div><span>Change vs previous day</span><b>' + chgTxt + '</b></div><div><span>1,000 ' + c.code + '</span><b>Rs ' + nin(r * 1000) + '</b></div><div><span>Updated</span><b>' + date + '</b></div></div>' +
    share(c.code + ' to PKR today: 1 ' + c.code + ' = ' + nf(r, 2) + ' PKR (' + date + ')', SITE + '/rates/' + c.slug + '/') +
    '<h3>' + esc(c.code) + ' to PKR quick table</h3><div class="pp-wrap"><table><thead><tr><th>' + c.code + '</th><th>Pakistani rupees</th></tr></thead><tbody>' +
    amounts.map(a => '<tr><td>' + nf(a, 0) + ' ' + c.code + '</td><td>Rs ' + nin(a * r) + '</td></tr>').join('') + '</tbody></table></div>' +
    '<h3>PKR to ' + c.code + '</h3><div class="pp-wrap"><table><thead><tr><th>Pakistani rupees</th><th>' + c.code + '</th></tr></thead><tbody>' +
    back.map(a => '<tr><td>Rs ' + nin(a) + '</td><td>' + nf(a / r, 2) + ' ' + c.code + '</td></tr>').join('') + '</tbody></table></div>' +
    '<h3>Rate history</h3><div class="pp-wrap"><table><thead><tr><th>Date</th><th>1 ' + c.code + ' in PKR</th><th>Change</th></tr></thead><tbody>' +
    h.slice(-SHOW_DAYS).reverse().map((x, i, arr) => { const p = arr[i + 1]; const d = p ? x.r - p.r : null; return '<tr><td>' + longDate(x.d) + '</td><td>' + nf(x.r, 2) + '</td><td>' + (d === null ? '-' : (d >= 0 ? '+' : '-') + nf(Math.abs(d), 2)) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
    '<p class="small muted">History is recorded by this site once a day, starting on ' + longDate(h[0].d) + ', so the table grows each day. It is not the State Bank of Pakistan rate.</p>';
  const meta = "Today's " + c.code + ' to PKR rate: 1 ' + c.code + ' = ' + nf(r, 2) + ' Pakistani rupees on ' + date + '. Quick conversion table, PKR to ' + c.code + ', rate history and a free converter.';
  return { lead, body, meta, r, date: cur.d };
}
function patch(html, a, b, inner) {
  const re = new RegExp('<!--' + a + ':start-->[\\s\\S]*?<!--' + a + ':end-->');
  if (!re.test(html)) throw new Error('marker missing: ' + a);
  return html.replace(re, () => '<!--' + a + ':start-->' + inner + '<!--' + a + ':end-->');
}
function setMeta(html, text) {
  return html.replace(/(<meta name="description" content=")[^"]*(")/, (m, a, b) => a + esc(text) + b)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, (m, a, b) => a + esc(text) + b)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, (m, a, b) => a + esc(text) + b);
}
const dates = {};
for (const c of CUR) {
  const p = 'rates/' + c.slug + '/index.html';
  if (!fs.existsSync(p)) { console.log('skip (page missing):', p); continue; }
  const b = pairBlocks(c); let html = fs.readFileSync(p, 'utf8');
  html = patch(html, 'rate-lead', null, b.lead); html = patch(html, 'rate-body', null, b.body); html = setMeta(html, b.meta);
  fs.writeFileSync(p, html); dates['/rates/' + c.slug + '/'] = live.date;
}
// hub page
const hp = 'rates/index.html';
if (fs.existsSync(hp)) {
  let html = fs.readFileSync(hp, 'utf8');
  const rows = CUR.map(c => { const h = data.history[c.code], cur = h[h.length - 1], prev = h.length > 1 ? h[h.length - 2] : null; const d = prev ? cur.r - prev.r : null;
    return '<tr><td><a href="./' + c.slug + '/">' + c.code + ' to PKR</a></td><td>' + esc(c.name) + '</td><td>' + nf(cur.r, 2) + '</td><td>' + (d === null ? '-' : (d >= 0 ? '+' : '-') + nf(Math.abs(d), 2)) + '</td></tr>'; }).join('');
  html = patch(html, 'rate-hub', null, share('Rates in Pakistan today (' + longDate(live.date) + '): ' + CUR.map(c => c.code + ' ' + nf(data.history[c.code][data.history[c.code].length - 1].r, 2)).join(', ') + ' PKR', SITE + '/rates/') + '<p class="small muted">Rates for ' + longDate(live.date) + '. Mid-market reference rates, updated daily.</p><div class="pp-wrap"><table><thead><tr><th>Pair</th><th>Currency</th><th>Rs per 1 unit</th><th>Change vs previous day</th></tr></thead><tbody>' + rows + '</tbody></table></div>');
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, (m, a, b) => a + esc("Today's exchange rates in Pakistan: USD, GBP, EUR, AED, SAR, CAD, AUD and QAR to PKR with quick tables, history and a free converter. Updated " + longDate(live.date) + '.') + b);
  fs.writeFileSync(hp, html); dates['/rates/'] = live.date;
}
// sitemap dates
if (fs.existsSync('sitemap.xml')) {
  let sm = fs.readFileSync('sitemap.xml', 'utf8');
  for (const [path, d] of Object.entries(dates)) {
    const loc = 'https://gmtoolshub.com' + path;
    const re = new RegExp('(<loc>' + loc.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '</loc><lastmod>)[^<]*(</lastmod>)');
    if (re.test(sm)) sm = sm.replace(re, (m, a, b) => a + d + b);
  }
  fs.writeFileSync('sitemap.xml', sm);
}
console.log('Rates updated for', live.date, Object.fromEntries(CUR.map(c => [c.code, nf(live.rates[c.code], 2)])));
