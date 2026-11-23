// Builds the earning pages (send money, daily email, rates data, expert help), adds a small "more from rates" block to the rate pages, and updates llms.txt.
// Usage: node build/make-earning-pages.mjs   (idempotent)
import fs from 'fs';
import { buildPage, ROOT } from './page-shell.mjs';
import * as sm from './pages/send-money.mjs';
import * as de from './pages/daily-email.mjs';
import * as rd from './pages/rates-data.mjs';
import * as ex from './pages/expert-help.mjs';
for (const p of [sm, de, rd, ex]) console.log(p.slug, buildPage(p));

// cross-links on the rate pages (outside the script-managed marker blocks)
const block = pre => '<!-- gm:ratesmore:start --><section class="section alt"><div class="container prose" style="max-width:860px"><h2>More from the rates</h2><ul>' +
  '<li><a href="' + pre + 'daily-rates-email/">Get these rates by email every day</a> (free)</li>' +
  '<li><a href="' + pre + 'send-money-to-pakistan/">Send money to Pakistan: compare the real cost</a></li>' +
  '<li><a href="' + pre + 'embed-rates/">Add live rates to your website</a> with the free widget</li>' +
  '<li><a href="' + pre + 'rates-data/">Rates data (JSON) for developers</a></li></ul></div></section><!-- gm:ratesmore:end -->';
for (const [f, pre] of [['gold-rate/index.html', '../'], ['silver-rate/index.html', '../'], ['rates/index.html', '../'], ['rates/usd-to-pkr/index.html', '../../']]) {
  const file = ROOT + f; if (!fs.existsSync(file)) { console.log('missing', f); continue; }
  let h = fs.readFileSync(file, 'utf8'); h = h.replace(/<!-- gm:ratesmore:start -->[\s\S]*?<!-- gm:ratesmore:end -->/, '');
  const i = h.lastIndexOf('</main>'); if (i < 0) { console.log('no main', f); continue; }
  fs.writeFileSync(file, h.slice(0, i) + block(pre) + '\n' + h.slice(i), 'utf8'); console.log('linked', f);
}
// llms.txt
let l = fs.readFileSync(ROOT + 'llms.txt', 'utf8');
const add = [
  ['embed-rates', '- [Free live rates widget](https://gmtoolshub.com/embed-rates/): embeddable Pakistan gold, silver and USD to PKR estimates, updated daily, English or Urdu'],
  ['send-money-to-pakistan', '- [Send money to Pakistan calculator](https://gmtoolshub.com/send-money-to-pakistan/): compare fees and exchange-rate margin for USD, GBP, EUR, AED, SAR, CAD, AUD and QAR'],
  ['daily-rates-email', '- [Daily rates email](https://gmtoolshub.com/daily-rates-email/): free short daily email with estimated gold, silver and dollar rates'],
  ['rates-data', '- [Rates data (JSON)](https://gmtoolshub.com/rates-data/): free daily JSON for gold, silver and PKR exchange rates with field notes and terms'],
  ['get-expert-help', '- [Get expert help](https://gmtoolshub.com/get-expert-help/): request an introduction to an independent tax, accounting or web professional']
];
for (const [k, line] of add) if (!l.includes('/' + k + '/')) l = l.replace('- [About the author]', line + '\n- [About the author]');
fs.writeFileSync(ROOT + 'llms.txt', l, 'utf8');
console.log('llms.txt updated');
