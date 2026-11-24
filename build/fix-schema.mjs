// Replaces WebApplication structured data with WebPage on tool and calculator pages.
// Why: Google's software-app rich result requires a genuine aggregateRating or review. GM Tools Hub has no real
// ratings and must not invent them, so the pages are described honestly as free web pages instead.
// Safe to re-run. If real user ratings are ever collected, restore SoftwareApplication with the real aggregateRating.
import fs from 'fs'; import path from 'path';
const root = 'D:/GM_Claude'; let pages = 0, blocks = 0, bad = 0;
const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); const rel = path.relative(root, p).replace(/\\/g, '/'); if (/^(\.git|\.github|products|node_modules|backend|embed|scripts|build|data|assets)(\/|$)/.test(rel)) continue; if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) fix(p); } };
function fix(p) {
  let h = fs.readFileSync(p, 'utf8'); let changed = false;
  h = h.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (m, body) => {
    let j; try { j = JSON.parse(body); } catch (e) { return m; }
    const types = [].concat(j['@type'] || []);
    if (!types.includes('WebApplication') && !types.includes('SoftwareApplication')) return m;
    const w = { '@context': 'https://schema.org', '@type': 'WebPage', name: j.name, url: j.url, description: j.description };
    if (j.inLanguage) w.inLanguage = j.inLanguage;
    w.isAccessibleForFree = true;
    if (j.author) w.author = j.author;
    w.isPartOf = { '@type': 'WebSite', name: 'GM Tools Hub', url: 'https://gmtoolshub.com/' };
    if (JSON.stringify(w).length < 80) { bad++; return m; }
    blocks++; changed = true; return '<script type="application/ld+json">' + JSON.stringify(w) + '</script>';
  });
  if (changed) { fs.writeFileSync(p, h, 'utf8'); pages++; }
}
walk(root);
console.log('pages changed', pages, '| blocks replaced', blocks, '| skipped', bad);
