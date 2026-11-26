// Builds /spreadsheet-checker/ with the site's header and footer. Safe to re-run; run bump.py afterwards.
// This page reads visitors' files, so it carries NO ads, NO analytics and NO translate links, and its
// Content-Security-Policy blocks other sites' scripts and all script data requests. Keep it that way:
// the build stops if any of that slips back in.
import fs from 'fs';
import { buildPage, esc, faqLd, faqHtml, ROOT } from './page-shell.mjs';

const slug = 'spreadsheet-checker';
const title = 'Spreadsheet Checker for Excel and CSV | GM Tools Hub';
const desc = 'Free check of an Excel or CSV sales sheet for repeated rows, missing values, wrong totals, mixed dates and spelling variations. Your file is not uploaded.';
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-src 'none'; media-src 'none'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests";
const faqs = [
  ['Is my file uploaded?', 'No. The page reads the file in your browser and does not send it anywhere. This page carries no advertising or analytics scripts, and its security policy blocks scripts from other websites and data requests made by scripts.'],
  ['Does it use AI?', 'No. It follows fixed rules, so the same file and column choices give the same result.'],
  ['Does it fix my file?', 'No. It lists what to look at and leaves your file unchanged. You decide what is really wrong.'],
  ['Which files work?', 'Excel .xlsx and CSV files up to 5 MB, 20,000 rows and 60 columns. Old .xls files must be saved as .xlsx first. The checker was tested with CSV files and with Excel files made by Microsoft Excel and by a spreadsheet code library. Files exported from other spreadsheet programs were not tested.']
];
const opt = (id, label) => `<label class="sc-f">${label}<select id="${id}"></select></label>`;
const main = `<section class="page-hero"><div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="../">Home</a></li><li aria-current="page">Spreadsheet Checker</li></ol></nav><h1>Smart <span class="gradient-text">Spreadsheet Checker</span></h1><p class="lead">Find common problems in a sales or stock sheet before you rely on its totals. It uses fixed rules, not AI, and it does not change your file.</p></div></section>
<section class="section"><div class="container sc-wrap">
<div class="sc-card"><label class="sc-drop" id="drop" for="file"><b>Drop an Excel (.xlsx) or CSV file here, or click to choose</b><span>Up to 5 MB, 20,000 rows and 60 columns. Your file is read in your browser and is not uploaded.</span><input class="sc-sr" type="file" id="file" accept=".xlsx,.csv"></label><p class="sc-err" id="err" role="alert"></p><p class="small muted" id="status" role="status" aria-live="polite"></p><noscript><p class="sc-err">The checker needs JavaScript.</p></noscript></div>
<div class="sc-card" id="setup" hidden><h2>Check these choices</h2><div class="sc-fields">${opt('sheet', 'Sheet')}${opt('qty', 'Quantity column')}${opt('rate', 'Rate or unit price column')}${opt('total', 'Line total column')}</div><p class="small muted">The columns were picked from your headings. Change them if they are wrong.</p></div>
<div id="results" hidden>
<div class="sc-card"><h2 id="headline">Results</h2><p class="small muted" id="summary"></p><div class="sc-tiles" id="tiles"></div><ul id="notes"></ul></div>
<div class="sc-card" id="listcard"><h2>Where to look</h2><label class="sc-f sc-filter">Show<select id="filter"></select></label><div class="sc-scroll"><table><thead><tr><th>Row</th><th>Problem</th><th>Column</th><th>What is written</th><th>Why it was flagged</th></tr></thead><tbody id="list"></tbody></table></div><p class="small muted" id="more"></p><div class="btn-row"><button type="button" class="btn btn-ghost" id="download">Download this list (CSV)</button></div></div>
<div class="sc-card"><h2>Need help fixing it?</h2><p>Request a cleanup quote. The link does not send your file or these results, and no payment is taken. Please do not send private details with your first message.</p><div class="btn-row"><a class="btn btn-primary" href="../services/#enquiry" target="_blank" rel="noopener noreferrer">Request a cleanup quote</a></div></div>
</div>
<h2>What it looks for</h2><ul><li>Possible repeated rows and missing values</li><li>Line totals that do not equal quantity times rate</li><li>Mixed date styles, and numbers saved as text</li><li>One item, area or name written in different ways</li><li>Values it cannot read, plus headings, notes and empty rows inside the data</li></ul>
<h2>What it cannot do</h2><p>A flag means “look at this”, not “this is wrong”. A result with no flags does not prove the figures are correct. It does not catch every spelling difference (for example “N. Market” and “North Market”, or “center” and “centre”), wrong amounts that still multiply correctly, or missing sales. If each row has its own serial number, two copies of one sale are not seen as repeats. It checks one sheet at a time, assumes one table with one heading row, and does not check hidden sheets. It is not an audit or accounting advice.</p>
<p>To organise your data so these problems are less likely, start with <a href="../bi-studio/#data">step 1 in BI Studio</a>.</p>
<h2>Questions</h2>${faqHtml(faqs)}</div></section>
<script src="../assets/js/tools-data.js?v=00000000" defer></script>`;

const extraHead = '<link rel="stylesheet" href="../assets/css/sheet-checker.css?v=00000000">\n';
buildPage({ slug, title, desc, ld: [faqLd(faqs)], main: main.replace(/\n<script src="\.\.\/assets\/js\/tools-data[^\n]*$/, ''), extraHead, ads: false });

const file = ROOT + slug + '/index.html';
let h = fs.readFileSync(file, 'utf8');
const swap = (re, to, what) => { if (!re.test(h)) throw new Error('not found: ' + what); h = h.replace(re, to); };
swap(/<meta http-equiv="Content-Security-Policy" content="[^"]*">/, `<meta http-equiv="Content-Security-Policy" content="${CSP}">`, 'CSP');
swap(/<body /, '<body data-no-track ', 'body');
swap(/<!-- translate:start -->[\s\S]*?<!-- translate:end -->\n?/, '', 'translate block');
swap(/<li><a href="[^"]*#cookie-settings" data-open-consent>Cookie settings<\/a><\/li>/, '', 'cookie settings link');
h = h.replace(/\s*<script src="[^"]*assets\/js\/pwa\.js[^"]*"[^>]*><\/script>/g, '').replace(/<meta name="google-adsense-account"[^>]*>/g, '').replace(/<link rel="(?:preconnect|dns-prefetch)" href="https:[^>]*>\n?/g, '');
swap(/(<script src="\.\.\/assets\/js\/core\.js[^"]*" defer><\/script>)/, '$1' + ['gm-lib.js', 'sheet-checker/core.js', 'sheet-checker/read-xlsx.js', 'sheet-checker/page.js'].map(s => `<script src="../assets/js/${s}?v=00000000" defer></script>`).join(''), 'core.js tag');

const banned = h.match(/adsbygoogle|googlesyndication|googletagmanager|google-analytics|translate\.google|data-open-consent|class="ad-slot|<(?:script|img|iframe)[^>]+src="(?:https?:)?\/\/|<link[^>]+rel="(?:stylesheet|preload|preconnect)"[^>]+href="https?:/);
if (banned) throw new Error('third-party or ad code left on the checker page: ' + banned[0]);
if (!/assets\/js\/tools-data\.js/.test(h)) throw new Error('tools-data.js missing');
const ids = [...h.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dup.length) throw new Error('duplicate ids: ' + dup.join(', '));
fs.writeFileSync(file, h, 'utf8');
console.log('built /' + slug + '/', h.length, 'bytes');
