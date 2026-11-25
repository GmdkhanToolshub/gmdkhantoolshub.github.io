// Points every page's "Read this page in" links at that page. Pages cloned from a template had kept the template's address.
// Safe to re-run; run it after any script that creates pages from another page.
import fs from 'fs'; import path from 'path';
const root = 'D:/GM_Claude';
let changed = 0, total = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name), rel = path.relative(root, p).replace(/\\/g, '/');
    if (/^(\.git|\.github|products|node_modules|backend|embed|scripts|build|data|assets)(\/|$)/.test(rel)) continue;
    if (e.isDirectory()) { walk(p); continue; }
    if (e.name !== 'index.html') continue;
    const h = fs.readFileSync(p, 'utf8');
    const block = h.match(/<!-- translate:start -->[\s\S]*?<!-- translate:end -->/);
    if (!block) continue;
    total++;
    const own = encodeURIComponent('https://gmtoolshub.com/' + rel.replace(/index\.html$/, ''));
    const fixed = block[0].replace(/(&amp;u=)[^"]+(")/g, (m, a, b) => a + own + b);
    if (fixed !== block[0]) { fs.writeFileSync(p, h.replace(block[0], () => fixed), 'utf8'); changed++; }
  }
})(root);
console.log('translate blocks:', total, '| corrected:', changed);
