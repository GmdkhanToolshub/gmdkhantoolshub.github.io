// Adds "GM Embed" to the site navigation (Business & resources dropdown) and to the footer Explore list on every page. Idempotent.
// Deliberately does not use sync_header.py, which would re-add the hidden "Live jobs" link.
import fs from 'fs'; import path from 'path';
const root = 'D:/GM_Claude/'; let n = 0, skipped = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name), rel = path.relative(root, p).replace(/\\/g, '/');
    if (/^(\.git|\.github|node_modules|products|build|scripts|assets|data|embed)(\/|$)/.test(rel)) continue;
    if (e.isDirectory()) { walk(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    let h = fs.readFileSync(p, 'utf8'); const o = h;
    const m = h.match(/<a class="nm-link" href="([^"]*)solutions\/"[^>]*><b>Business solutions<\/b>/);
    if (!m) { skipped++; continue; }
    const pre = m[1];
    if (!h.includes('href="' + pre + 'gm-embed/"><b>GM Embed</b>')) {
      h = h.replace(/(<a class="nm-link" href="[^"]*solutions\/"[^>]*><b>Business solutions<\/b><span>[^<]*<\/span><\/a>)/, '$1<a class="nm-link" href="' + pre + 'gm-embed/"><b>GM Embed</b><span>Add calculators to your own website</span></a>');
    }
    if (!h.includes('<li><a href="' + pre + 'gm-embed/">GM Embed</a></li>')) {
      h = h.replace(/(<li><a href="[^"]*solutions\/">Business solutions<\/a><\/li>)/, '$1<li><a href="' + pre + 'gm-embed/">GM Embed</a></li>');
    }
    if (h !== o) { fs.writeFileSync(p, h, 'utf8'); n++; }
  }
})(root);
console.log('pages updated:', n, '| pages without the nav block (skipped):', skipped);
