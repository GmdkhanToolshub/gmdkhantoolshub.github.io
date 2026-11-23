// Creates a DRAFT email in Buttondown with today's estimated rates, for a human to review and send.
// Needs the repository secret BUTTONDOWN_API_KEY. Without it the script prints a notice and exits cleanly (nothing is sent).
// It never sends an email by itself: status is always "draft".
import fs from 'fs';
const key = process.env.BUTTONDOWN_API_KEY;
const j = f => JSON.parse(fs.readFileSync(new URL('../data/' + f, import.meta.url), 'utf8'));
const g = j('gold.json').history, s = j('silver.json').history, r = j('rates.json').history;
const g1 = g.at(-1), g0 = g.at(-2) || g1, s1 = s.at(-1), s0 = s.at(-2) || s1, u1 = r.USD.at(-1), u0 = r.USD.at(-2) || u1;
const n = x => 'Rs ' + Math.round(x).toLocaleString('en-IN');
const ch = (a, b) => { const p = (a - b) / b * 100; return (p >= 0 ? '+' : '') + p.toFixed(2) + '%'; };
const subject = 'Pakistan rates ' + g1.d + ': gold ' + n(g1.t24) + ' per tola (estimate)';
const body = [
  '**Estimated rates for ' + g1.d + '**',
  '',
  '- Gold 24K, per tola: **' + n(g1.t24) + '** (' + ch(g1.t24, g0.t24) + ' vs previous day)',
  '- Gold 22K, per tola: **' + n(g1.t24 * 22 / 24) + '**',
  '- Silver, per tola: **' + n(s1.tola) + '** (' + ch(s1.tola, s0.tola) + ')',
  '- US dollar: **Rs ' + u1.r.toFixed(2) + '** (' + ch(u1.r, u0.r) + ')',
  '',
  'These are estimates from international prices and exchange rates, not a jeweller, bullion association or bank quote. Ask your jeweller for the exact rate before you buy or sell.',
  '',
  'Full tables and history: https://gmtoolshub.com/gold-rate/ , https://gmtoolshub.com/silver-rate/ , https://gmtoolshub.com/rates/usd-to-pkr/',
  'Sending money home? Compare the real cost: https://gmtoolshub.com/send-money-to-pakistan/'
].join('\n');
if (process.argv.includes('--print') || !key) { console.log(subject + '\n\n' + body); if (!key) console.log('\n[no BUTTONDOWN_API_KEY: nothing was created]'); process.exit(0); }
const res = await fetch('https://api.buttondown.com/v1/emails', { method: 'POST', headers: { Authorization: 'Token ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, body, status: 'draft' }) });
console.log('Buttondown draft status:', res.status);
if (!res.ok) { console.log((await res.text()).slice(0, 300)); process.exit(1); }
