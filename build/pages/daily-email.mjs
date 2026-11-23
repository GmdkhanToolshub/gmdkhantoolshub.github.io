import { esc, hero, faqLd, faqHtml, CSS } from '../page-shell.mjs';
export const slug = 'daily-rates-email';
export const title = 'Daily Pakistan Gold, Silver & Dollar Rates by Email | GM Tools Hub';
export const desc = 'Free short email with the latest estimated gold (per tola), silver and USD to PKR rates and the change since yesterday. No spam, unsubscribe any time.';
const faqs = [
 ['What is in the daily rates email?', 'A short summary of the latest estimated 24K and 22K gold price per tola, silver per tola and the US dollar to rupee rate, with the change since the previous day and a link to the full tables and calculators.'],
 ['Are these official rates?', 'No. They are estimates worked out from international gold and silver prices and the exchange rate. Local jewellers and bullion associations add their own premium and may differ by a few percent. Always confirm the exact rate with your jeweller before you buy or sell.'],
 ['How often will I get an email?', 'The plan is one short email on days when the rates are updated. The first emails may be sent a few days after launch while the format is tested. You can unsubscribe with one click from any email.'],
 ['What do you do with my email address?', 'It is used only to send these updates through the Buttondown email service. We do not sell or rent your address. Read the Privacy Policy for details.'],
 ['Can a business sponsor the email?', 'Yes, a small "presented by" line can be arranged once the list is large enough to be useful. We will share real subscriber numbers when there is something honest to report. Contact us through the Advertise page.']
];
export const ld = [faqLd(faqs)];
export const main = `
${hero('Daily rates email', 'Free email', 'Daily Gold, Silver &amp; Dollar Rates <span class="gradient-text">by Email</span>', 'One short email with Pakistan\'s estimated gold (per tola), silver and USD to PKR rates and what changed since yesterday. Free, and you can unsubscribe any time.')}
${CSS}
<section class="section"><div class="container" style="max-width:900px">
<div class="ep-note"><strong>Please read:</strong> the rates are <strong>estimates</strong> from international prices and the exchange rate, not a jeweller's, bullion association's or bank's quote.</div>
<div class="ep-card" style="margin-top:18px"><h2>Join the daily rates email</h2>
<form id="de-form" novalidate class="ep-row" style="align-items:center"><label style="flex:1;min-width:240px">Your email address<input id="de-email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required></label><button class="btn btn-primary" type="submit">Subscribe</button></form>
<p class="small muted">By subscribing you agree to receive these emails. You will get a confirmation email first. Read the <a href="../privacy-policy/">Privacy Policy</a>.</p><p id="de-msg" role="status" aria-live="polite" class="small"></p></div>
<h2>What you get</h2>
<ul><li>Gold 24 karat and 22 karat, per tola, with the change since the previous day.</li><li>Silver per tola.</li><li>US dollar to rupee, plus links for GBP, EUR, AED, SAR, CAD, AUD and QAR.</li><li>A link to the full <a href="../gold-rate/">gold rate</a>, <a href="../silver-rate/">silver rate</a> and <a href="../rates/usd-to-pkr/">dollar rate</a> pages.</li></ul>
<h2>Who it is for</h2>
<p>Families who buy gold for weddings or savings, jewellers, traders, overseas Pakistanis and anyone who wants the numbers without opening a website every day. If you send money home, try the <a href="../send-money-to-pakistan/">send money to Pakistan calculator</a> too.</p>
<h2>For businesses</h2>
<p>A small "presented by" line for a jeweller, exchange dealer or finance business can be arranged when the list is large enough to be useful. There are no subscriber numbers to quote yet and none will be invented. See <a href="../advertise/">Advertise with us</a>.</p>
<h2>Frequently asked questions</h2>${faqHtml(faqs)}
</div></section>
<script>document.addEventListener('DOMContentLoaded',function(){
var SC=window.SITE_CONFIG||{},cfg=SC.newsletter||{},ep=cfg.endpoint||'',f=document.getElementById('de-form'),m=document.getElementById('de-msg'),i=document.getElementById('de-email');
f.addEventListener('submit',function(ev){ev.preventDefault();var em=i.value.trim();
 if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(em)||em.length>120){m.textContent='Please enter a valid email address.';m.className='small ep-bad';i.focus();return}
 if(!/^https:\\/\\//.test(ep)){location.href='mailto:'+(SC.contactEmail||'asmarkniazi@gmail.com')+'?subject='+encodeURIComponent('Please add me to the daily rates email')+'&body='+encodeURIComponent('Please add this email address: '+em);m.textContent='Your email app should open. Press Send to join.';return}
 var fd=new FormData();fd.append(cfg.field||'email',em);fd.append('tag','daily-rates');Object.keys(cfg.hidden||{}).forEach(function(k){fd.append(k,cfg.hidden[k])});
 var b=f.querySelector('button');b.disabled=true;m.textContent='Sending…';m.className='small';
 fetch(ep,{method:'POST',body:fd,mode:'no-cors',referrerPolicy:'no-referrer'}).then(function(){m.textContent='Thank you! Please check your inbox and confirm your email address.';m.className='small ep-ok';i.value='';i.disabled=true;if(window.GM_track)window.GM_track('newsletter_signup',{page:location.pathname,list:'daily-rates'})}).catch(function(){b.disabled=false;m.textContent='Sorry, that did not go through. Please try again later.';m.className='small ep-bad'})});
});</script>
`;
