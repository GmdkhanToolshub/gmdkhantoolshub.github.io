// Generates llms-full.txt: a plain-text map of every indexable page (title, address, description), grouped by section.
// Regenerate with: node build/make-llms-full.mjs   (after adding pages; keep it in step with the sitemap)
import fs from 'fs'; import path from 'path';
const root = 'D:/GM_Claude/'; const pages = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name), rel = path.relative(root, p).replace(/\\/g, '/');
    if (/^(\.git|\.github|\.well-known|node_modules|products|build|scripts|assets|data|embed)(\/|$)/.test(rel)) continue;
    if (e.isDirectory()) walk(p); else if (e.name === 'index.html') {
      const h = fs.readFileSync(p, 'utf8');
      if (/name="robots" content="[^"]*noindex/i.test(h)) continue;
      const t = (h.match(/<title>([\s\S]*?)<\/title>/) || [])[1], dsc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1];
      const url = 'https://gmtoolshub.com/' + rel.replace(/index\.html$/, '');
      if (t) pages.push({ url, t: t.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/ \| GM Tools Hub$/, ''), d: (dsc || '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'"), sec: rel.split('/')[0] === 'index.html' ? 'home' : rel.split('/')[0] });
    }
  }
})(root);
const groups = {}; for (const p of pages) (groups[p.sec] = groups[p.sec] || []).push(p);
const order = Object.keys(groups).sort((a, b) => (a === 'home' ? -1 : b === 'home' ? 1 : groups[b].length - groups[a].length));
let out = '# GM Tools Hub: full page map\n> GM Tools Hub (https://gmtoolshub.com/) is an online platform providing accessible, practical and free digital tools and utilities to help users complete everyday online tasks efficiently. Operated by Gmd Khan Niazi (Ghulam Mohiuddin Khan Niazi), Lahore, Pakistan. Tools run in the browser. Rates, tax slabs and prices are estimates for general information, not professional advice.\n\nSee also the short summary at https://gmtoolshub.com/llms.txt . This file lists ' + pages.length + ' indexable pages, generated from the site files.\n';
for (const s of order) {
  out += '\n## ' + s + ' (' + groups[s].length + ')\n';
  for (const p of groups[s].sort((a, b) => a.url.localeCompare(b.url))) out += '- [' + p.t + '](' + p.url + ')' + (p.d ? ': ' + p.d : '') + '\n';
}
fs.writeFileSync(root + 'llms-full.txt', out, 'utf8'); console.log('llms-full.txt', pages.length, 'pages,', out.length, 'bytes');
