// Keeps shown facts in step with the real data and adds the home page's checker band.
// Safe to re-run (run after make-premium-v2, make-phase1, make-posts or make-cornerstone).
// It never touches advertising code; build/adsense-fingerprint.mjs proves that before publishing.
import fs from 'fs'; import vm from 'vm';
const R = 'D:/GM_Claude/';
const changed = new Set();
const read = f => fs.readFileSync(R + f, 'utf8');
const write = (f, s) => { if (read(f) !== s) { fs.writeFileSync(R + f, s, 'utf8'); changed.add(f); } };
const need = (cond, what) => { if (!cond) throw new Error(what); };

const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(read('assets/js/tools-data.js'), ctx);
const TOOLS = ctx.window.TOOLS_DATA; need(Array.isArray(TOOLS) && TOOLS.length > 50, 'tool list not found');
const perCat = {}; for (const t of TOOLS) perCat[t.cat] = (perCat[t.cat] || 0) + 1;

// 1. Tools page: the number on each category filter
let chips = 0;
write('tools/index.html', read('tools/index.html').replace(/(data-cat="([^"]+)"[^>]*>[^<]*<span class="ft-count">)\d+(<\/span>)/g, (m, a, cat, b) => {
  const name = cat.replace(/&amp;/g, '&'); const n = name === 'All' ? TOOLS.length : perCat[name];
  need(n, 'unknown tool category on /tools/: ' + name); chips++; return a + n + b;
}));
need(chips === Object.keys(perCat).length + 1, 'expected a filter for every category, found ' + chips);

// 2. Article cards (home and blog): show the reading time the article itself shows
const minutes = slug => { const f = 'blog/' + slug + '/index.html'; return fs.existsSync(R + f) ? (read(f).match(/<span>(\d+) min read<\/span>/) || [])[1] : null; };
let cards = 0;
for (const f of ['index.html', 'blog/index.html']) {
  write(f, read(f).replace(/(<article class="card hover post-card"[^>]*>(?:(?!<\/article>)[\s\S])*?href="(?:\.\/|\.\.\/)blog\/([a-z0-9-]+)\/"(?:(?!<\/article>)[\s\S])*?)\d+ min read/g, (m, head, slug) => { const n = minutes(slug); if (!n) return m; cards++; return head + n + ' min read'; }));
}
need(cards >= 40, 'article cards not found');

let home = read('index.html');

// 3. Home: a band for the free Spreadsheet Checker, just before the done-for-you services
need(fs.existsSync(R + 'spreadsheet-checker/index.html'), 'checker page missing');
const band = `<!-- checker-band:start --><section class="section" aria-labelledby="gm-check-title"><div class="container"><div class="gm-check"><div><span class="v2-eyebrow">Free spreadsheet check</span><h2 id="gm-check-title">Check your sales sheet before you trust its totals</h2><p>Choose an Excel or CSV file and see which rows to look at first. The file is read in your browser and is not uploaded. It follows fixed rules, not AI, and a flag means “look at this”, not “this is wrong”.</p><div class="btn-row"><a class="btn btn-primary" href="./spreadsheet-checker/">Check a spreadsheet free</a><a class="btn btn-ghost" href="./services/#excel">Get help cleaning it</a></div></div><ul><li>Possible repeated rows and missing values</li><li>Line totals that do not equal quantity × rate</li><li>Mixed date styles and numbers saved as text</li><li>One name written in different ways</li></ul></div></div></section><!-- checker-band:end -->\n`;
// the hero introduction names what is really here
need(/<p class="v2-sub">[\s\S]*?<\/p>/.test(home), 'hero introduction not found');
home = home.replace(/<p class="v2-sub">[\s\S]*?<\/p>/, () => '<p class="v2-sub">' + TOOLS.length + ' free tools for PDFs, money, careers and everyday work, with Excel templates and practical business guides. Free tools need no account.</p>');
if (/<!-- checker-band:start -->[\s\S]*?<!-- checker-band:end -->\n?/.test(home)) home = home.replace(/<!-- checker-band:start -->[\s\S]*?<!-- checker-band:end -->\n?/, () => band);
else { const at = home.indexOf('<!-- v2:business:start -->'); need(at > 0, 'business solutions section not found'); home = home.slice(0, at) + band + home.slice(at); }
write('index.html', home);

// 4. Essential pages: add only facts that were missing
const once = (f, anchorRe, html, marker) => { let h = read(f); if (h.includes(marker)) return; need(anchorRe.test(h), 'anchor not found in ' + f); write(f, h.replace(anchorRe, m => m + html)); };
once('privacy-policy/index.html', /<h2[^>]*>Information handled by the tools<\/h2>/,
  '\n<p id="checker-privacy">The <a href="../spreadsheet-checker/">Spreadsheet Checker</a> reads the file you choose inside your browser. The file and its results are not uploaded, and that page loads no advertising or analytics scripts.</p>', 'id="checker-privacy"');

// 5. Long single-column pages: an "On this page" menu, made from the page's own headings, fills the empty side
const DOC_PAGES = ['academy/css-basics', 'academy/git-and-github-pages', 'academy/html-basics', 'academy/javascript-basics', 'academy/javascript-dom', 'academy/prompt-writing-for-work', 'cookie-policy', 'disclaimer', 'gm-embed/docs', 'membership', 'privacy-policy', 'reasoning-test', 'solutions', 'solutions/gulf', 'solutions/north-america-australia', 'solutions/uk-europe', 'terms-and-conditions', 'tools'];
const text = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
let menus = 0; const skipped = [];
for (const dir of DOC_PAGES) {
  const f = dir + '/index.html'; let h = read(f);
  if (h.includes('<div class="gm-doc')) { menus++; continue; }
  // the .prose block that sits directly in a plain .container; find its closing tag by counting <div>s
  const open = /<div class="container">(?:(?!<div class="container)[\s\S])*?(<div class="prose"[^>]*>)/.exec(h);
  if (!open) { skipped.push(dir + ' (already centred)'); continue; } /* a narrowed, centred container has no empty side */
  const start = open.index + open[0].length - open[1].length;
  const re = /<(\/?)div\b[^>]*>/g; re.lastIndex = start; let depth = 0, end = -1, m;
  while ((m = re.exec(h))) { depth += m[1] ? -1 : 1; if (!depth) { end = re.lastIndex; break; } }
  need(end > 0, 'text block not closed: ' + f);
  let block = h.slice(start, end);
  const levels = (block.match(/<h2[\s>]/g) || []).length >= 3 ? '2' : '23';
  const used = new Set([...h.matchAll(/\sid="([^"]+)"/g)].map(x => x[1])); const items = [];
  block = block.replace(new RegExp('<h([' + levels + '])([^>]*)>([\\s\\S]*?)</h\\1>', 'g'), (all, n, attrs, inner) => {
    let id = (attrs.match(/\sid="([^"]+)"/) || [])[1];
    if (!id) { const base = text(inner).toLowerCase().replace(/&[a-z#0-9]+;/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'section'; id = base; for (let k = 2; used.has(id); k++) id = base + '-' + k; used.add(id); attrs += ' id="' + id + '"'; }
    items.push('<li><a href="#' + id + '">' + text(inner) + '</a></li>'); return '<h' + n + attrs + '>' + inner + '</h' + n + '>';
  });
  if (items.length < 3) { skipped.push(dir + ' (' + items.length + ' headings)'); continue; }
  const top = /margin-top:48px/.test(open[1]) ? ' gm-doc-gap' : '';
  if (top) block = block.replace(/ style="margin-top:48px"/, '');
  h = h.slice(0, start) + '<div class="gm-doc' + top + '">' + block + '<nav class="gm-toc" aria-label="On this page"><p>On this page</p><ul>' + items.join('') + '</ul></nav></div>' + h.slice(end);
  write(f, h); menus++;
}
console.log('page menus', menus, skipped.length ? '| skipped: ' + skipped.join(', ') : '');

console.log('tools', TOOLS.length, '| category filters', chips, '| article cards checked', cards, '| files changed', changed.size, [...changed].join(' '));
