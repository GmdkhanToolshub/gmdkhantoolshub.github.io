import fs from 'fs';
import { esc, faqLd, faqHtml, CSS } from '../page-shell.mjs';
const reg = JSON.parse(fs.readFileSync('D:/GM_Claude/embed/widgets.json', 'utf8')).widgets.filter(w => w.tested);
const SEC = [['Overview', ''], ['Explore Widgets', 'widgets/'], ['My Embeds', 'my-embeds/'], ['Embed Generator', 'generator/'], ['Documentation', 'docs/'], ['Pricing', 'pricing/'], ['Support', 'support/']];
const STYLE = CSS + '<style>.ge-nav{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 22px;padding:0;list-style:none}.ge-nav a{display:inline-block;padding:8px 14px;border:1px solid var(--border);border-radius:999px;background:var(--surface);font-weight:600;font-size:.92rem;text-decoration:none}.ge-nav a[aria-current=page]{background:#0b1b34;color:#fff;border-color:#0b1b34}.ge-hero{background:linear-gradient(135deg,#0b1b34,#0e4a63);color:#fff;border-radius:22px;padding:34px 28px;margin:0 0 24px}.ge-hero h1{color:#fff;margin:0 0 10px}.ge-hero p{color:#d6e6ef;max-width:62ch}.ge-hero .btn-ghost{color:#fff;border-color:#7fb8cc;background:rgba(255,255,255,.12)}.ep-pill-s{display:inline-block;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#0e7490;margin-bottom:6px}.ge-chip{display:inline-block;font-size:.74rem;font-weight:800;padding:3px 10px;border-radius:999px;background:#d1fae5;color:#065f46}.ge-chip.plan{background:#e0e7ff;color:#3730a3}.ge-code{width:100%;font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;padding:10px;border-radius:12px;border:1.5px solid var(--border-strong);background:var(--surface);color:var(--text);min-height:92px;resize:vertical}.ge-two{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));align-items:start}.ge-stat{padding:14px 16px;border:1px solid var(--border);border-radius:14px;background:var(--surface)}.ge-stat b{display:block;font-size:1.4rem}.ge-stat span{font-size:.78rem;color:var(--text-faint);text-transform:uppercase;letter-spacing:.06em;font-weight:700}.ge-stats{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin:0 0 18px}.ge-prototype{padding:12px 16px;border:1px dashed var(--border-strong);border-radius:12px;background:var(--surface);margin:0 0 18px}</style>';
function head(depth, current, h1, lead, extra = '') {
  const pre = depth === 1 ? './' : '../';
  const home = depth === 1 ? '../' : '../../';
  const nav = '<ul class="ge-nav" aria-label="GM Embed sections">' + SEC.map(([n, p]) => `<li><a href="${pre}${p}"${n === current ? ' aria-current="page"' : ''}>${n}</a></li>`).join('') + '</ul>';
  const crumb = depth === 1 ? '<li aria-current="page">GM Embed</li>' : `<li><a href="../">GM Embed</a></li><li aria-current="page">${esc(current)}</li>`;
  return `<section class="page-hero"><div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="${home}">Home</a></li>${crumb}</ol></nav><span class="eyebrow">GM Embed &middot; powered by GM Tools Hub</span><h1>${h1}</h1><p class="lead">${esc(lead)}</p></div></section>${STYLE}<section class="section"><div class="container" style="max-width:1040px">${nav}${extra}`;
}
const end = '</div></section>';
const CLIP = 'GM Embed is an MVP. The free widgets, generator and loader work today. Accounts, licence keys, domain registration, usage analytics, white-label and payments are not built yet and are labelled Planned.';

// ---------- 1. Overview
const ovFaq = [
 ['What is GM Embed?', 'GM Embed lets you put selected GM Tools Hub calculators on your own website. You pick a widget, adjust the look, copy a line of code and paste it into your page. The widget runs from gmtoolshub.com inside a frame on your page.'],
 ['Is GM Embed free?', 'The current widgets are free to embed on a website, with a small "GM Tools Hub" credit link that must stay visible. Paid plans (Pro and Business) are planned for white-label and business features but are not available to buy yet.'],
 ['Does the widget collect my visitors\' data?', 'The calculators work in the visitor\'s browser. What a visitor types is not sent to GM Tools Hub servers, and the widget pages do not set cookies or load analytics. Your visitors\' browsers still request the widget page from the hosting provider, as with any embedded content.'],
 ['Which widgets can I embed?', 'Only widgets that passed the embed test are listed: ' + reg.map(w => w.name).join(', ') + '. More are added only after they pass the same test.'],
 ['Can I remove the GM Tools Hub credit?', 'Not on the free plan. Removing branding is planned for the Business plan and needs a licence checked by a server, which does not exist yet. Until then, the credit link stays on every widget.'],
 ['Will it work in WordPress, Blogger, Wix or React?', 'The embed is a standard iframe or a one-line script, so it should work anywhere you can add custom HTML. It has been tested on a plain HTML page on a different domain. WordPress, Blogger and React instructions are provided but have not been tested on live sites yet.']
];
export const overview = {
  slug: 'gm-embed', depth: 1, title: 'GM Embed: Add Calculators and Tools to Your Website', desc: 'Embed professional online calculators and productivity tools into your website with GM Embed. Easy integration, responsive widgets and planned commercial licensing.', ld: [faqLd(ovFaq)],
  main: head(1, 'Overview', 'Add Professional Calculators and Business Tools to <span class="gradient-text">Your Website</span>', 'GM Embed lets accountants, schools, HR firms, agencies, bloggers and small businesses show working GM Tools Hub calculators on their own sites with one line of code.') +
`<div class="ge-hero"><h2 style="color:#fff;margin:0 0 8px">Pick a widget. Customise it. Paste one line.</h2><p>${reg.length} tested widgets are ready to embed today: salary tax, zakat, loan EMI, gold, land area, percentage, BMI, profit margin and more.</p><div class="btn-row"><a class="btn btn-primary" href="generator/">Create an embed</a><a class="btn btn-ghost" href="widgets/">Explore widgets</a></div></div>
<div class="ge-prototype"><strong>Status:</strong> ${esc(CLIP)}</div>
<h2>How it works</h2>
<div class="ge-two"><div class="ep-card"><h3>1. Choose</h3><p>Browse the tested widgets and read what each one does.</p></div><div class="ep-card"><h3>2. Customise</h3><p>Set the theme, colours, corner radius, font, header and size, with a live preview.</p></div><div class="ep-card"><h3>3. Paste</h3><p>Copy the iframe or one-line script and paste it into your page. Done.</p></div></div>
<h2>What you get today</h2>
<ul><li>${reg.length} calculators that work inside a frame on your site, tested on a page on a different domain.</li><li>Light and dark themes, your accent colour, background, rounded corners and font style.</li><li>Two ways to embed: a standard iframe, or a one-line script that also resizes the frame to fit.</li><li>Widgets that run in the visitor's browser, with no cookies or analytics of their own.</li><li>Clear documentation, including troubleshooting, security and privacy.</li></ul>
<h2>Who uses embeddable calculators</h2>
<ul><li><strong>Accountants and tax advisers:</strong> a salary tax or zakat calculator that answers common client questions on your site.</li><li><strong>HR and payroll firms:</strong> take-home pay and date calculators for staff and candidates.</li><li><strong>Schools and universities:</strong> marks, percentage and age calculators for students and parents.</li><li><strong>Finance and property sites:</strong> loan EMI and land area converters.</li><li><strong>Agencies and developers:</strong> add useful tools to client sites without building them.</li><li><strong>Bloggers:</strong> keep readers on the page with a tool that fits your topic.</li></ul>
<p class="small muted">These are example use cases. GM Embed has no customer case studies or testimonials to show yet, and none are invented.</p>
<h2>Plans</h2>
<p>The free plan works now. Pro and Business plans are planned and not yet for sale. See <a href="pricing/">Pricing</a> for what is available and what is planned.</p>
<h2>Frequently asked questions</h2>${faqHtml(ovFaq)}` + end
};

// ---------- 2. Widgets
export const widgets = {
  slug: 'gm-embed/widgets', depth: 2, title: 'GM Embed Widgets: Embeddable Calculators', desc: 'Browse tested embeddable calculators: salary tax, zakat, loan EMI, gold rates, land area, percentage, BMI and more. Search, preview and get the embed code.', ld: [],
  main: head(2, 'Explore Widgets', 'Explore <span class="gradient-text">Widgets</span>', 'Only widgets that passed the embed test are listed. Search, preview a widget, then open the generator.') +
`<div id="gm-app" data-page="library"><div class="ep-row"><label style="flex:1;min-width:220px">Search widgets<input id="gm-search" type="search" placeholder="e.g. tax, gold, loan"></label><label>Category<select id="gm-cat"><option value="">All categories</option></select></label><span class="small muted" id="gm-count" aria-live="polite"></span></div><div class="ep-grid" id="gm-grid"><p class="muted">Loading widgets…</p></div></div>
<noscript><h2>Widgets</h2><ul>${reg.map(w => `<li><strong>${esc(w.name)}</strong>: ${esc(w.description)}</li>`).join('')}</ul></noscript>
<h2 style="margin-top:28px">About compatibility</h2><p>A widget is listed only after it loads inside a frame on another domain, its inputs give results, it has no sideways scroll at 340px wide and its height message reaches the host page. Tools that handle files, use the camera, microphone or location, load extra libraries or make web requests are not listed. See <a href="../docs/#security">Security and privacy</a>.</p>` + end + '<script src="../../assets/js/gm-embed-app.js?v=00000000" defer></script>'
};

// ---------- 3. Generator
const row = (id, label, inner, extra = '') => `<div class="ep-row" id="row-${id}"${extra}><label style="min-width:200px;flex:1">${label}${inner}</label></div>`;
export const generator = {
  slug: 'gm-embed/generator', depth: 2, title: 'GM Embed Generator: Customise and Copy Embed Code', desc: 'Choose a widget, set theme, colours, radius and size, preview it live and copy the iframe or script embed code for your website.', ld: [],
  main: head(2, 'Embed Generator', 'Embed <span class="gradient-text">Generator</span>', 'Choose a widget, customise it, check the live preview and copy the code.') +
`<div id="gm-app" data-page="generator"><input type="hidden" id="g-edit">
<div class="ge-two"><div class="ep-card"><h2>1. Customise</h2>
<div class="ep-row"><label style="flex:1;min-width:220px">Widget<select id="g-widget"></select></label></div>
<div class="ep-row"><label style="flex:1;min-width:220px">Name this embed (for My Embeds)<input id="g-name" maxlength="60" placeholder="e.g. Tax calculator on my blog"></label></div>
<div class="ep-row" id="row-theme"><label>Theme<select id="g-theme"><option value="light">Light</option><option value="dark">Dark</option></select></label></div>
<div class="ep-row" id="row-accent"><label class="small" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="g-accent-on"> Custom primary colour</label><input type="color" id="g-accent" value="#0e7490" aria-label="Primary colour" style="width:48px;height:36px;padding:2px"></div>
<div class="ep-row" id="row-bg"><label>Background<select id="g-bg-mode"><option value="default">Default</option><option value="transparent">Transparent</option><option value="color">Colour</option></select></label><input type="color" id="g-bg" value="#ffffff" aria-label="Background colour" style="width:48px;height:36px;padding:2px"></div>
<div class="ep-row" id="row-radius"><label>Corner radius <span id="g-radius-v">14px</span><input type="range" id="g-radius" min="0" max="32" value="14"></label></div>
<div class="ep-row" id="row-font"><label>Font style<select id="g-font"><option value="system">System (default)</option><option value="serif">Serif</option><option value="mono">Monospace</option><option value="rounded">Rounded</option></select></label></div>
<div class="ep-row" id="row-title"><label class="small" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="g-title"> Show a header with the widget name</label></div>
<div class="ep-row" id="row-footer"><label class="small" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="g-footer" checked> Show the privacy note in the footer</label></div>
<div class="ep-row" id="row-lang" hidden><label>Language<select id="g-lang"><option value="en">English</option><option value="ur">اردو</option></select></label></div>
<div class="ep-row" id="row-show" hidden><label class="small" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="g-show-gold" checked> Gold</label><label class="small" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="g-show-silver" checked> Silver</label><label class="small" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="g-show-usd" checked> Dollar</label></div>
<div class="ep-row"><label>Maximum width (px)<input type="number" id="g-maxw" min="240" max="1200" value="760"></label><label class="small" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="g-auto" checked> Fit height automatically</label><label>Fixed height (px)<input type="number" id="g-height" min="150" max="3000" placeholder="auto" disabled></label></div>
<div class="ep-row"><label class="small" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" checked disabled> Show the GM Tools Hub credit</label><span class="small muted">Removing it needs the planned Business plan and a server-checked licence.</span></div>
<p class="small muted" id="g-tested"></p></div>
<div class="ep-card"><h2>2. Live preview</h2><iframe id="g-prev" title="Live preview" style="border:0;width:100%;min-height:240px" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads"></iframe></div></div>
<div class="ep-card" style="margin-top:18px"><h2>3. Copy your code</h2>
<h3>A. Standard iframe</h3><textarea class="ge-code" id="g-code-iframe" readonly aria-label="iframe embed code"></textarea>
<h3>B. One-line script (resizes the frame automatically)</h3><textarea class="ge-code" id="g-code-js" readonly aria-label="Script embed code" style="min-height:76px"></textarea>
<h3>C. Preview address</h3><input class="ge-code" id="g-url" readonly aria-label="Preview URL" style="min-height:0">
<div class="btn-row" style="margin-top:12px"><button class="btn btn-primary btn-sm" type="button" id="g-copy-iframe">Copy iframe</button><button class="btn btn-primary btn-sm" type="button" id="g-copy-js">Copy script</button><button class="btn btn-ghost btn-sm" type="button" id="g-copy-url">Copy address</button><button class="btn btn-ghost btn-sm" type="button" id="g-save">Save to My Embeds</button><span class="small" id="g-copy-msg" aria-live="polite"></span></div><p class="small" id="g-msg" aria-live="polite"></p>
<p class="small muted">The address in the code points to the real widget route on gmtoolshub.com. New widgets and changes appear there after the site is deployed. Need help installing it? See the <a href="../docs/">documentation</a>.</p></div></div>` + end + '<script src="../../assets/js/gm-embed-app.js?v=00000000" defer></script>'
};

// ---------- 4. My Embeds (prototype)
export const mine = {
  slug: 'gm-embed/my-embeds', depth: 2, title: 'My Embeds: GM Embed Dashboard (Prototype)', desc: 'Manage the embeds you saved in this browser. A frontend prototype: no accounts yet, no view counts, no fabricated statistics.', ld: [],
  main: head(2, 'My Embeds', 'My <span class="gradient-text">Embeds</span>', 'Embeds you saved in this browser. This dashboard is a prototype: it has no accounts or server yet.') +
`<div id="gm-app" data-page="mine"><div class="ge-prototype"><strong>Prototype:</strong> your saved embeds are stored only in this browser (on this device). Clearing site data removes them, so use Export to keep a backup. Usage figures, licences and domains need the planned server and are shown as unavailable instead of invented.</div>
<div class="ge-stats"><div class="ge-stat"><span>Widgets created</span><b id="m-created">0</b></div><div class="ge-stat"><span>Active embeds</span><b>Not tracked</b></div><div class="ge-stat"><span>Monthly views</span><b>Not available</b></div><div class="ge-stat"><span>Subscription</span><b>Free (no account)</b></div><div class="ge-stat"><span>Licence status</span><b>No licence issued</b></div><div class="ge-stat"><span>Connected domains</span><b>None</b></div></div>
<p class="small muted">Why "not tracked": counting views and checking domains requires a server that is not built yet. See <a href="../docs/#licensing">Licensing</a>. Widgets do not report visitor activity.</p>
<h2>Saved embeds</h2><div class="ep-wrap"><table><thead><tr><th>Name</th><th>Widget</th><th>Saved</th><th>Actions</th></tr></thead><tbody id="m-body"><tr><td colspan="4" class="muted">Loading…</td></tr></tbody></table></div>
<div class="btn-row" style="margin-top:12px"><a class="btn btn-primary btn-sm" href="../generator/">Create a new embed</a><button class="btn btn-ghost btn-sm" type="button" id="m-export">Export backup</button><label class="btn btn-ghost btn-sm" style="cursor:pointer">Import backup<input type="file" id="m-import" accept="application/json,.json" style="display:none"></label><span class="small" id="m-msg" aria-live="polite"></span></div></div>` + end + '<script src="../../assets/js/gm-embed-app.js?v=00000000" defer></script>'
};

// ---------- 5. Docs
const exId = 'percentage-calculator';
const iframeEx = `<iframe src="https://gmtoolshub.com/embed/${exId}/?theme=light" width="100%" height="460" loading="lazy" title="Percentage calculator by GM Tools Hub" style="border:0;max-width:760px;display:block" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads" allow="clipboard-write"></iframe>`;
const jsEx = `<div data-gm-embed="${exId}" data-theme="dark" data-accent="0e7490" data-radius="18"></div>\n<script src="https://gmtoolshub.com/embed/gm-embed.js" async></script>`;
const reactEx = `export default function GmWidget() {\n  return (\n    <iframe\n      src="https://gmtoolshub.com/embed/${exId}/?theme=light"\n      title="Percentage calculator by GM Tools Hub"\n      width="100%" height={460} loading="lazy"\n      style={{ border: 0, maxWidth: 760, display: 'block' }}\n      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads"\n    />\n  );\n}`;
const dFaq = [
 ['The widget shows a blank box.', 'Check that the address starts with https://gmtoolshub.com/embed/ and ends with the widget name, and that your site allows frames from other domains. Some page builders strip iframe tags: use their "custom HTML" or "embed" block.'],
 ['The widget is cut off or has a scroll bar.', 'Use the one-line script, which resizes the frame, or increase the height in the iframe code. Widgets with results need more height on narrow screens.'],
 ['My site blocks the script.', 'If your Content Security Policy blocks it, allow script-src and frame-src for https://gmtoolshub.com, or use the plain iframe code, which needs only frame-src.'],
 ['The colours did not change.', 'Colours must be six-digit hex values without #, for example accent=0e7490. Invalid values are ignored for safety.']
];
const pt = [['theme', 'light or dark', 'all widgets'], ['accent', 'six-digit hex colour for buttons and highlights, no #', 'calculators'], ['bg', 'six-digit hex, or transparent', 'calculators'], ['radius', 'corner radius 0 to 32 (px)', 'calculators'], ['font', 'serif, mono or rounded (system is the default)', 'calculators'], ['title', '1 shows a header with the widget name', 'calculators'], ['footer', '0 hides the privacy note (the credit link always stays)', 'calculators'], ['lang', 'ur for Urdu', 'live-rates'], ['show', 'gold, silver, usd (comma separated)', 'live-rates']];
export const docs = {
  slug: 'gm-embed/docs', depth: 2, title: 'GM Embed Documentation: Install, Customise, Secure', desc: 'How to choose a widget, generate and install embed code, customise it, plus WordPress, Blogger, React, troubleshooting, security, privacy and licensing notes.', ld: [faqLd(dFaq)],
  main: head(2, 'Documentation', 'GM Embed <span class="gradient-text">Documentation</span>', 'Everything you need to add a widget to your site, in plain steps.') +
`<div class="prose" style="max-width:860px">
<div class="ge-prototype"><strong>Test status:</strong> the iframe and one-line script were tested on a plain HTML page served from a different domain in a Chromium-based browser. WordPress, Blogger and React steps below follow how those editors normally work and have <strong>not</strong> been tested on live sites. Firefox and Safari have not been tested yet.</div>
<h2 id="choose">1. Choose a widget</h2><p>Open <a href="../widgets/">Explore Widgets</a>. Every listed widget has passed the embed test. Use Preview to try it before you embed.</p>
<h2 id="generate">2. Generate the code</h2><p>Open the <a href="../generator/">Embed Generator</a>, choose the widget, adjust the look and copy either the iframe or the script code. The preview address shows exactly what visitors will see.</p>
<h2 id="iframe">3. Install the iframe (HTML)</h2><p>Paste this where the widget should appear in your page's HTML:</p><pre><code>${esc(iframeEx)}</code></pre>
<p>The <code>sandbox</code> setting limits what the framed page can do on your site. <code>allow-same-origin</code> lets the widget use its own storage and load its own data; it does not give it access to your page.</p>
<h2 id="script">4. Or use the one-line script</h2><pre><code>${esc(jsEx)}</code></pre><p>The script creates the same sandboxed iframe and resizes it to fit. It only accepts size messages from https://gmtoolshub.com and only from the frame it created. It never reads what visitors type.</p>
<h2 id="customize">5. Customise with options</h2><div class="ep-wrap"><table><thead><tr><th>Option</th><th>Values</th><th>Works on</th></tr></thead><tbody>${pt.map(r => `<tr><td><code>${r[0]}</code></td><td>${esc(r[1])}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div><p>For the iframe, add options to the address (<code>?theme=dark&amp;accent=0e7490</code>). For the script, use <code>data-theme</code>, <code>data-accent</code> and so on.</p>
<h2 id="wordpress">WordPress</h2><ol><li>Edit the page or post and add a <strong>Custom HTML</strong> block.</li><li>Paste the iframe code and update or publish.</li><li>If the preview is blank, your host or a security plugin may strip frames: ask it to allow <code>gmtoolshub.com</code>.</li></ol><p class="small muted">Not tested on a live WordPress site yet.</p>
<h2 id="blogger">Blogger</h2><ol><li>In the post editor switch to <strong>HTML view</strong>.</li><li>Paste the iframe code where you want it, then switch back and publish.</li></ol><p class="small muted">Not tested on a live Blogger site yet.</p>
<h2 id="react">React</h2><pre><code>${esc(reactEx)}</code></pre><p class="small muted">Standard iframe in JSX. Not tested in a live React app yet.</p>
<h2 id="troubleshooting">Troubleshooting</h2>${faqHtml(dFaq)}
<h2 id="security">Security and privacy</h2>
<ul><li>Widgets are static pages on gmtoolshub.com. Calculations run in the visitor's browser. The widget code does not send what visitors type to GM Tools Hub.</li><li>Widget pages load only their stylesheet and scripts from gmtoolshub.com. They set no cookies and include no analytics or advertising scripts. A Content Security Policy limits what each widget page can load.</li><li>As with any embedded page, the visitor's browser requests the widget from the hosting provider (GitHub Pages), which sees the usual request details such as IP address. Mention this in your own privacy policy if you have one.</li><li>The only cross-window message is the widget height, sent to the host page. The loader accepts it only from https://gmtoolshub.com.</li><li><strong>Limit of the current version:</strong> free widgets are public static pages. They cannot be restricted to particular domains and the credit link cannot be enforced by a server. Those features belong to the planned licence server.</li></ul>
<h2 id="licensing">Licensing</h2><p>Free widgets may be embedded on websites with the GM Tools Hub credit link left visible. Do not claim the calculators as your own product and do not remove the credit. Pro and Business plans (white-label, multiple domains, usage statistics, API access) are planned and require a server that validates licence keys and domains. That server does not exist yet, so no paid licences are sold. See <a href="../pricing/">Pricing</a>, <a href="../support/">Support</a> and the <a href="../../disclaimer/">Disclaimer</a>. The calculators give estimates for general information, not professional advice.</p>
</div>` + end
};

// ---------- 6. Pricing
const planRows = [
 ['Embeddable widgets', 'All tested widgets', 'More widgets as they are added', 'All widgets'],
 ['Standard iframe and one-line script', 'Yes (now)', 'Planned', 'Planned'],
 ['Basic customisation (theme, colours, radius, font)', 'Yes (now)', 'Planned', 'Planned'],
 ['GM Tools Hub credit link', 'Always shown', 'Always shown', 'Can be removed (white-label)'],
 ['Advanced themes and layouts', 'No', 'Planned', 'Planned'],
 ['Usage analytics (views per widget)', 'No', 'Planned', 'Planned'],
 ['Licence key and domain registration', 'No', 'Planned', 'Planned (multiple domains)'],
 ['API access', 'No', 'No', 'Planned where available'],
 ['Priority support', 'Community and email', 'Planned', 'Planned (business support)']
];
export const pricing = {
  slug: 'gm-embed/pricing', depth: 2, title: 'GM Embed Pricing and Plans (Free, Pro, Business)', desc: 'GM Embed plans: Free is available now. Pro and Business are planned and not for sale yet. See what each plan includes and join the waiting list.', ld: [],
  main: head(2, 'Pricing', 'GM Embed <span class="gradient-text">Pricing</span>', 'Free works now. Pro and Business are planned: prices are not announced and payments are not active.') +
`<div class="ge-prototype"><strong>Nothing can be bought yet.</strong> ${esc(CLIP)} Prices will be published before any paid plan opens, with terms you can read first.</div>
<div class="ge-two"><div class="ep-card"><span class="ge-chip">Available now</span><h2>Free</h2><ul><li>All tested widgets</li><li>Standard iframe and one-line script</li><li>Basic customisation</li><li>GM Tools Hub credit visible</li><li>Fair use: no hammering the servers or reselling the widgets</li></ul><a class="btn btn-primary btn-sm" href="../generator/">Create a free embed</a></div>
<div class="ep-card"><span class="ge-chip plan">Planned</span><h2>Pro</h2><ul><li>More widgets as they are added</li><li>Advanced themes and customisation</li><li>Usage analytics</li><li>Higher usage limits</li><li>Priority support</li></ul><a class="btn btn-ghost btn-sm" href="../support/">Join the waiting list</a></div>
<div class="ep-card"><span class="ge-chip plan">Planned</span><h2>Business</h2><ul><li>White-label option</li><li>Commercial website licensing</li><li>Multiple domains</li><li>API access where available</li><li>Business support</li></ul><a class="btn btn-ghost btn-sm" href="../support/">Ask about commercial licensing</a></div></div>
<h2 style="margin-top:26px">Compare plans</h2><div class="ep-wrap"><table><thead><tr><th>Feature</th><th>Free</th><th>Pro (planned)</th><th>Business (planned)</th></tr></thead><tbody>${planRows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
<h2>Honest limits</h2><ul><li>No plan offers "unlimited" usage. Limits will be stated in numbers before launch.</li><li>Pro and Business features that need a licence check, domain list or view counts depend on a server that is still to be built.</li><li>No payment is collected. If you send an enquiry, it opens in your own email or WhatsApp app and nothing is charged.</li></ul>` + end
};

// ---------- 7. Support
const sFaq = [
 ['How quickly will I get a reply?', 'Messages go to the site owner by email or WhatsApp. There is no support-time guarantee yet. Include the page where the widget is installed so the problem can be checked.'],
 ['Can agencies get a partner arrangement?', 'Agencies and developers who want to use widgets on several client sites can ask. Any partner terms are agreed in writing first. None are advertised until they exist.'],
 ['Can I ask for a widget that is not listed?', 'Yes. Tell us which GM Tools Hub tool you want. It is added only if it passes the embed test.']
];
export const support = {
  slug: 'gm-embed/support', depth: 2, title: 'GM Embed Support, Enquiries and Waiting List', desc: 'Get help installing a GM Embed widget, ask about commercial licensing or agency use, or join the Pro and Business waiting list.', ld: [faqLd(sFaq)],
  main: head(2, 'Support', 'GM Embed <span class="gradient-text">Support</span>', 'Installation help, commercial licensing questions, agency partnerships and the Pro and Business waiting list.') +
`<div id="gm-app" data-page="support"><div class="ep-card"><h2>Send an enquiry</h2><form id="s-form" novalidate>
<div class="ep-row"><label>Enquiry type<select id="s-type"><option>Installation help</option><option>Commercial licensing enquiry</option><option>Agency partnership</option><option>Join the Pro or Business waiting list</option><option>Request a widget</option><option>Report a bug</option></select></label><label style="flex:1;min-width:220px">Your website (optional)<input id="s-site" maxlength="120" placeholder="https://"></label></div>
<label class="small" for="s-text" style="font-weight:600">Your message (no passwords, ID numbers or codes)</label><textarea id="s-text" rows="5" maxlength="900" style="width:100%" placeholder="Tell us what you need."></textarea>
<div class="ep-row" style="margin-top:12px"><button class="btn btn-primary" type="submit" data-way="wa">Send on WhatsApp</button><button class="btn btn-ghost" type="submit" data-way="mail">Send by email</button></div>
<p class="small muted" id="s-msg" role="status" aria-live="polite">Your own WhatsApp or email app opens with the message ready. Nothing is sent until you press Send there.</p></form></div>
<h2>Other ways to help yourself</h2><ul><li><a href="../docs/#troubleshooting">Troubleshooting</a> for blank boxes, cut-off widgets and blocked scripts.</li><li><a href="../docs/#security">Security and privacy</a> before you add a widget to a site with strict rules.</li><li><a href="../generator/">Embed Generator</a> to rebuild your code.</li></ul>
<h2>Frequently asked questions</h2>${faqHtml(sFaq)}</div>` + end + '<script src="../../assets/js/gm-embed-app.js?v=00000000" defer></script>'
};
export const all = [overview, widgets, mine, generator, docs, pricing, support];

