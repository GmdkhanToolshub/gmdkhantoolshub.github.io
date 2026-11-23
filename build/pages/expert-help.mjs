import { esc, hero, faqLd, faqHtml, CSS } from '../page-shell.mjs';
export const slug = 'get-expert-help';
export const title = 'Get Help from a Tax, Accounting or Web Professional | GM Tools Hub';
export const desc = 'Need a tax return filed, books set up, zakat guidance or a small website? Send a free request and we will point you to a suitable independent professional.';
const faqs = [
 ['What happens when I send a request?', 'Your message opens in your own email or WhatsApp app, addressed to the site owner. Nothing is sent until you press Send there. The owner replies and, where it makes sense, suggests an independent professional who may contact you.'],
 ['Do I have to pay to send a request?', 'No. Sending a request is free and creates no obligation. Any professional you choose agrees their fee with you directly, before work starts.'],
 ['Do you earn money from referrals?', 'Possibly. A professional we introduce may pay a referral fee. This never changes the price you are quoted, and you are free to say no or choose someone else. We will tell you when a referral fee applies.'],
 ['Are the professionals verified?', 'We only suggest people and firms we have checked through their public business details. We cannot guarantee their work and are not a party to your agreement. Always confirm their registration, fees and scope in writing.'],
 ['Is my data safe?', 'Do not put your CNIC, bank details, passwords or one-time codes in this form. Describe your situation in general terms only. Share documents later, directly with the professional, once you have chosen them.']
];
export const ld = [faqLd(faqs)];
export const main = `
${hero('Get expert help', 'Request help', 'Get Help from a Tax, Accounting or <span class="gradient-text">Web Professional</span>', 'Tell us what you need. We will point you to a suitable independent professional, or help directly with websites and Excel. Free request, no obligation.')}
${CSS}
<section class="section"><div class="container" style="max-width:900px">
<div class="ep-note"><strong>Please read:</strong> we are not a law, tax or accounting firm and this is not professional advice. A professional we introduce is independent and may pay us a referral fee, which never changes your price. <strong>Never</strong> enter your CNIC, bank details or passwords here.</div>
<div class="ep-card" style="margin-top:18px"><h2>Your request</h2>
<form id="ex-form" novalidate>
<div class="ep-row"><label>What do you need help with?<select id="ex-topic"><option>Income tax return filing</option><option>Bookkeeping and accounting</option><option>Salary and payroll setup</option><option>Zakat or Islamic finance question</option><option>Small business website or SEO</option><option>Excel dashboard or template</option><option>Something else</option></select></label><label>Your city or country<input id="ex-city" maxlength="60" placeholder="e.g. Lahore, Pakistan"></label></div>
<label class="small" for="ex-text" style="font-weight:600">Describe your situation in general terms (no ID numbers or bank details)</label>
<textarea id="ex-text" rows="5" maxlength="900" style="width:100%" placeholder="For example: salaried employee, one employer, need help filing for this tax year."></textarea>
<div class="ep-row" style="margin-top:12px"><button class="btn btn-primary" type="submit" data-way="wa">Send on WhatsApp</button><button class="btn btn-ghost" type="submit" data-way="mail">Send by email</button></div>
<p class="small muted" id="ex-msg" role="status" aria-live="polite">Your own WhatsApp or email app opens with a ready message. Nothing is sent until you press Send there.</p></form></div>
<h2>What we can do</h2>
<ul><li><strong>Tax and accounting:</strong> point you to an independent tax filer or accountant. Use the free <a href="../tools/pakistan-salary-tax-calculator/">salary tax calculator</a> first to see roughly what to expect.</li><li><strong>Websites and SEO:</strong> small business sites, Google Maps listing cleanup, technical SEO and AI-search readiness. See <a href="../services/">Hire me</a>.</li><li><strong>Excel and reporting:</strong> custom dashboards, attendance and payroll sheets. See <a href="../solutions/">business solutions</a>.</li></ul>
<h2>Frequently asked questions</h2>${faqHtml(faqs)}
</div></section>
<script>document.addEventListener('DOMContentLoaded',function(){
var f=document.getElementById('ex-form'),m=document.getElementById('ex-msg');
var way='wa';f.querySelectorAll('button[type=submit]').forEach(function(b){b.addEventListener('click',function(){way=b.getAttribute('data-way')})});
f.addEventListener('submit',function(ev){ev.preventDefault();var t=document.getElementById('ex-text').value.trim();
 if(t.length<10){m.textContent='Please describe what you need in a sentence or two.';m.className='small ep-bad';return}
 if(/\\b\\d{5}-?\\d{7}-?\\d\\b|\\b\\d{13}\\b|password|otp|iban|pk\\d{2}[a-z]{4}/i.test(t)){m.textContent='Please remove ID numbers, bank details or passwords and describe your situation in general terms.';m.className='small ep-bad';return}
 var body='Hello, I would like help with: '+document.getElementById('ex-topic').value+'.\\nLocation: '+(document.getElementById('ex-city').value||'-')+'\\n\\n'+t+'\\n\\n(Sent from gmtoolshub.com/get-expert-help/)';
 if(window.GM_track)window.GM_track('enquiry_click',{page:location.pathname,topic:document.getElementById('ex-topic').value});
 if(way==='mail')location.href='mailto:asmarkniazi@gmail.com?subject='+encodeURIComponent('Expert help request')+'&body='+encodeURIComponent(body);
 else window.open('https://wa.me/923158935101?text='+encodeURIComponent(body),'_blank','noopener');
 m.textContent='Your app should open with the message ready. Press Send there.';m.className='small ep-ok'})});</script>
`;

