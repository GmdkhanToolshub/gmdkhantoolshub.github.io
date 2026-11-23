import { esc, hero, faqLd, faqHtml, CSS } from '../page-shell.mjs';
export const slug = 'send-money-to-pakistan';
export const title = 'Send Money to Pakistan: Compare Fees & Exchange Rates | GM Tools Hub';
export const desc = 'Free calculator to compare how many rupees your family receives from USD, GBP, EUR, AED, SAR, CAD, AUD or QAR, including transfer fees and exchange-rate margin.';
const faqs = [
 ['How do I find the cheapest way to send money to Pakistan?', 'Compare the total rupees the receiver gets, not just the fee. A "zero fee" transfer can still cost more if the exchange rate is lower than the market rate. Enter each provider\'s fee and the exchange rate it shows into the calculator above and compare the "rupees received" and "hidden cost" numbers.'],
 ['What is the mid-market exchange rate?', 'It is the rate banks use between themselves, halfway between the buy and sell price. Consumers rarely get exactly this rate. The difference between the mid-market rate and the rate you are offered is the exchange-rate margin, and it is often the biggest part of the cost.'],
 ['Where does the calculator get its rates?', 'From the free open.er-api.com exchange-rate feed, collected once a day by an automated job on this site. They are estimates for comparison, not a guaranteed rate. Always use the rate the provider shows you before you confirm a transfer.'],
 ['Does the amount arrive instantly?', 'It depends on the provider, the payout method (bank account, mobile wallet or cash pickup), the amount and checks the provider must carry out. Ask the provider for the expected delivery time and check it again before you send.'],
 ['How can I avoid scams when sending money abroad?', 'Use providers that are licensed or registered in the country you send from. Check the receiver\'s name and account details carefully, never send money to a stranger or for a prize or job fee, and keep your receipt and reference number. See our guide on staying safe from scams.'],
 ['Do you earn money from this page?', 'This page has no sponsored providers or affiliate links at the moment. If we ever add partner links, they will be clearly marked as affiliate links and will not change the calculator results.']
];
export const ld = [faqLd(faqs)];
const rates = ['USD', 'GBP', 'EUR', 'AED', 'SAR', 'CAD', 'AUD', 'QAR'];
export const main = `
${hero('Send money to Pakistan', 'Remittance calculator', 'Send Money to Pakistan: <span class="gradient-text">Compare the Real Cost</span>', 'See how many rupees your family actually receives after the transfer fee and the exchange-rate margin. Works for USD, GBP, EUR, AED, SAR, CAD, AUD and QAR.')}
${CSS}
<section class="section"><div class="container" style="max-width:1000px">
<div class="ep-note"><strong>How to read this:</strong> the best transfer is the one that gives the receiver the most rupees, not the one with the smallest fee. Add the fee and the exchange rate each provider shows you. The calculator compares them against the market rate. Rates here are estimates from a daily feed and are not a quote or financial advice.</div>
<div class="ep-card" style="margin-top:18px"><h2>Compare up to three providers</h2>
<div class="ep-row"><label>You send in<select id="sm-cur">${rates.map(c => `<option value="${c}">${c}</option>`).join('')}</select></label><label>Amount<input id="sm-amt" type="number" min="1" step="any" value="500" inputmode="decimal"></label><span class="small muted" id="sm-mid"></span></div>
<div class="ep-wrap"><table id="sm-tab"><thead><tr><th>Provider (your label)</th><th>Fee (in sending currency)</th><th>Their rate (PKR per 1 unit)</th><th>Rupees received</th><th>Hidden cost vs market</th></tr></thead><tbody>
${[1, 2, 3].map(i => `<tr><td><input class="sm-n" value="Provider ${i}" aria-label="Provider ${i} name" style="width:140px;font:inherit;padding:8px;border-radius:10px;border:1.5px solid var(--border-strong);background:var(--surface);color:var(--text)"></td><td><input class="sm-f" type="number" min="0" step="any" placeholder="0" aria-label="Provider ${i} fee" style="width:100px;font:inherit;padding:8px;border-radius:10px;border:1.5px solid var(--border-strong);background:var(--surface);color:var(--text)"></td><td><input class="sm-r" type="number" min="0" step="any" placeholder="rate" aria-label="Provider ${i} rate" style="width:110px;font:inherit;padding:8px;border-radius:10px;border:1.5px solid var(--border-strong);background:var(--surface);color:var(--text)"></td><td class="sm-o">-</td><td class="sm-h">-</td></tr>`).join('')}
</tbody></table></div>
<p class="ep-big" id="sm-best" aria-live="polite"></p>
<p class="small muted">Hidden cost = how much less the receiver gets compared with converting the same amount at the market rate with no fee. Your numbers stay in your browser.</p></div>
</div></section>
<section class="section alt"><div class="container prose" style="max-width:860px">
<h2>The three numbers that decide what your family receives</h2>
<ol><li><strong>The fee</strong> the provider charges, often shown clearly.</li><li><strong>The exchange rate</strong> the provider uses. A lower rate than the market rate is a hidden fee.</li><li><strong>Speed and payout method</strong>: bank deposit, mobile wallet or cash pickup. A cheaper option that arrives late or is hard to collect may cost your family more in practice.</li></ol>
<h2>A short checklist before you send</h2>
<ul><li>Compare at least three options at the same time of day, using the same amount.</li><li>Ask for the final rupee amount the receiver will get, in writing or on screen.</li><li>Check that the provider is licensed or registered where you live and works with a reputable payout partner in Pakistan.</li><li>Double-check the receiver's name, account number or wallet before you press send.</li><li>Keep the receipt and tracking reference until the money is collected.</li></ul>
<h2>Why the official rate and the rate you are offered differ</h2>
<p>Banks and money-transfer companies buy foreign currency at one price and sell it at a slightly different price, then add their own margin. That is why the rate on a transfer screen is almost always lower than the rate you see in a news headline. Tracking the market rate helps you notice a margin that is unusually large. See the daily <a href="../rates/usd-to-pkr/">USD to PKR rate</a> and the <a href="../rates/">full exchange-rate list</a>.</p>
<h2>Related</h2>
<ul class="ep-pills"><li><a href="../rates/usd-to-pkr/">USD to PKR</a></li><li><a href="../gold-rate/">Gold rate in Pakistan</a></li><li><a href="../tools/zakat-calculator/">Zakat Calculator</a></li><li><a href="../security/">Stay safe from scams</a></li><li><a href="../embed-rates/">Free rates widget</a></li></ul>
</div></section>
<section class="section"><div class="container prose" style="max-width:860px"><h2>Frequently asked questions</h2>${faqHtml(faqs)}
<p class="small muted">Not financial advice. Rates are estimates from an exchange-rate feed updated once a day. No provider pays to appear on this page.</p></div></section>
<script>(function(){
var $=function(i){return document.getElementById(i)},mid=null,date='';
function fmt(n){return Math.round(n).toLocaleString('en-IN')}
function calc(){var c=$('sm-cur').value,a=parseFloat($('sm-amt').value)||0;if(!mid||!mid[c]){$('sm-mid').textContent='Loading market rate…';return}
 var m=mid[c];$('sm-mid').textContent='Market rate: 1 '+c+' = '+m.toFixed(2)+' PKR ('+date+')';
 var rows=document.querySelectorAll('#sm-tab tbody tr'),best=null,bestV=-1;
 rows.forEach(function(r){var f=parseFloat(r.querySelector('.sm-f').value)||0,rt=parseFloat(r.querySelector('.sm-r').value);
  if(!rt||a<=0){r.querySelector('.sm-o').textContent='-';r.querySelector('.sm-h').textContent='-';return}
  var got=Math.max(0,a-f)*rt,ideal=a*m,h=(ideal-got)/ideal*100;
  r.querySelector('.sm-o').textContent='Rs '+fmt(got);r.querySelector('.sm-h').innerHTML=(h<=0?'<span class="ep-ok">none (at or above market)</span>':h.toFixed(2)+'% (about Rs '+fmt(ideal-got)+')');
  if(got>bestV){bestV=got;best=r.querySelector('.sm-n').value||'This provider'}});
 $('sm-best').textContent=best?'Most rupees received: '+best+' (Rs '+fmt(bestV)+')':''}
fetch('../data/rates.json',{cache:'no-cache'}).then(function(r){return r.json()}).then(function(j){mid={};Object.keys(j.history).forEach(function(k){var h=j.history[k];mid[k]=h[h.length-1].r;date=h[h.length-1].d});calc()}).catch(function(){$('sm-mid').textContent='Market rate is unavailable right now.'});
document.addEventListener('input',calc);document.addEventListener('change',calc);calc()})();</script>
`;
