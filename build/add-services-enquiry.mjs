// Adds the enquiry form and plain service terms to /services/, and the copyright concerns section to the Terms. Safe to re-run.
import fs from 'fs';
const root = 'D:/GM_Claude/';
const read = f => fs.readFileSync(root + f, 'utf8'), write = (f, s) => fs.writeFileSync(root + f, s, 'utf8');

let s = read('services/index.html');
s = s.replace(/<!-- enquiry:start -->[\s\S]*?<!-- enquiry:end -->\n?/, '').replace(/<!-- enquiry-js --><script[^>]*><\/script>\n?/, '').replace(/<!-- enquiry-link --><a[^>]*>[^<]*<\/a>/, '');
const options = ['Excel dashboards and reports', 'KPI scorecards and sales targets', 'Data cleaning and analysis', 'HR and payroll spreadsheet setup', 'Inventory tracking workbook', 'Management presentation', 'Resume or LinkedIn help', 'Sales operations consulting', 'Custom website calculator', 'Business website', 'One-to-one consultation', 'Something else'];
const field = (id, label, attrs) => `<label for="${id}">${label}<input id="${id}" ${attrs}></label>`;
const block = `<!-- enquiry:start --><style>.enq{max-width:760px}.enq-grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}.enq label{display:block;font-weight:600;font-size:.93rem}.enq input,.enq select,.enq textarea{display:block;width:100%;margin-top:6px;font:inherit;padding:11px 13px;border-radius:12px;border:1.5px solid var(--border-strong);background:var(--surface);color:var(--text)}.enq input:focus-visible,.enq select:focus-visible,.enq textarea:focus-visible{outline:3px solid var(--accent);outline-offset:1px}.enq [aria-invalid=true]{border-color:#b91c1c}</style>
<section class="section" id="enquiry" style="scroll-margin-top:90px"><div class="container enq"><div class="section-head"><h2>Send your project requirements</h2><p>Fill in the form and your own WhatsApp or email app opens with the message ready. This website does not receive or store what you type. Do not include passwords, ID numbers or confidential company data.</p></div>
<form id="enq-form" class="card" novalidate><div class="enq-grid"><label for="enq-service">Service<select id="enq-service">${options.map(o => `<option>${o}</option>`).join('')}</select></label>${field('enq-name', 'Your name or business', 'maxlength="80" autocomplete="name" required')}</div>
<label for="enq-need" style="margin:14px 0">What do you need?<textarea id="enq-need" rows="5" maxlength="900" required placeholder="For example: a monthly sales dashboard from our Excel export, for 12 territories."></textarea></label>
<div class="enq-grid">${field('enq-deadline', 'Deadline (optional)', 'maxlength="60"')}${field('enq-budget', 'Budget range (optional)', 'maxlength="60"')}${field('enq-place', 'Country or city (optional)', 'maxlength="60"')}</div>
<div class="btn-row" style="margin-top:16px"><button class="btn btn-primary" type="submit" data-way="wa">Send on WhatsApp</button><button class="btn btn-ghost" type="submit" data-way="mail">Send by email</button></div>
<p class="small" id="enq-msg" role="status" aria-live="polite" style="margin:10px 0 0"></p><noscript><p>The form needs JavaScript. Email gmkn16@yahoo.com instead.</p></noscript></form>
<h3 style="margin-top:28px">Service terms in brief</h3><ul><li>Sending an enquiry does not create an order or a charge.</li><li>You receive the scope, price and timeline before any work starts. Work begins after you accept.</li><li>The payment method is confirmed with you when you accept the quote.</li><li>You review the work before final delivery, and the changes agreed in the quote are included.</li><li>No search ranking, traffic, sales or other business result is promised.</li></ul><p class="small muted">See also the <a href="../terms-and-conditions/">Terms &amp; Conditions</a>, <a href="../refund-policy/">Refund Policy</a> and <a href="../privacy-policy/">Privacy Policy</a>.</p></div></section><!-- enquiry:end -->
`;
const at = '<section class="section" style="padding-top:0"><div class="container prose">';
if (!s.includes(at)) throw new Error('services marker missing');
s = s.replace(at, () => block + at);
s = s.replace('<a class="btn btn-primary" href="#services">See services</a>', '<a class="btn btn-primary" href="#services">See services</a><!-- enquiry-link --><a class="btn btn-ghost" href="#enquiry">Send requirements</a>');
s = s.replace('</body>', '<!-- enquiry-js --><script src="../assets/js/enquiry-form.js?v=00000000" defer></script>\n</body>');
write('services/index.html', s);

let t = read('terms-and-conditions/index.html');
t = t.replace(/<!-- copyright:start -->[\s\S]*?<!-- copyright:end -->\n?/, '');
const copy = `<!-- copyright:start --><h2 id="copyright">Copyright concerns</h2>
<p>If you believe something on this site uses your work without permission, send a message through the <a href="../contact/">contact page</a> with:</p>
<ul><li>your name and how to reach you;</li><li>the address of the page on this site;</li><li>what the original work is and where it can be seen;</li><li>a statement that you own the work or are authorised to act for the owner, and that the information you give is accurate.</li></ul>
<p>The material will be reviewed. Where the concern appears valid, it will be removed, replaced or properly credited. If your own material was removed and you think that was a mistake, reply with your reasons.</p><!-- copyright:end -->
`;
const next = '<h2>Third-party services and advertising</h2>';
if (!t.includes(next)) throw new Error('terms marker missing');
t = t.replace(next, () => copy + next);
const before = t.match(/Last updated:?[^<]{0,40}(<[^>]+>)*[^<]{0,40}/);
console.log('terms date line was:', before && before[0]);
write('terms-and-conditions/index.html', t);
console.log('services form and copyright section added');
