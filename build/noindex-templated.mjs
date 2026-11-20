// Sets noindex,follow on the templated leaf pages (convert, salary-tax, electricity, loan-emi) that share much of their
// text with sibling pages. The hub page of each family (the folder's own index.html) stays indexable. Safe to re-run.
// To undo: node build/noindex-templated.mjs --undo
import fs from 'fs'; import path from 'path';
const root = 'D:/GM_Claude/'; const undo = process.argv.includes('--undo');
const FAMILIES = ['convert', 'salary-tax', 'electricity', 'loan-emi'];
let n = 0, skipped = 0;
for (const fam of FAMILIES) {
  for (const e of fs.readdirSync(root + fam, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const f = root + fam + '/' + e.name + '/index.html'; if (!fs.existsSync(f)) continue;
    let h = fs.readFileSync(f, 'utf8'); const o = h;
    if (/http-equiv=["']refresh/i.test(h)) { skipped++; continue; }
    if (undo) h = h.replace(/<meta name="robots" content="noindex, follow">/, '<meta name="robots" content="index, follow, max-image-preview:large">');
    else if (/<meta name="robots"[^>]*>/i.test(h)) h = h.replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="noindex, follow">');
    else h = h.replace(/<\/title>/i, '</title><meta name="robots" content="noindex, follow">');
    if (h !== o) { fs.writeFileSync(f, h, 'utf8'); n++; }
  }
}
console.log((undo ? 'restored ' : 'noindexed ') + n + ' pages, skipped ' + skipped);
