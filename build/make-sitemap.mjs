// Regenerates sitemap.xml and sitemap-pages.xml from the pages that are really indexable:
// no noindex, a canonical that points to the page itself, and not a redirect stub.
import fs from 'fs'; import path from 'path'; import { execSync } from 'child_process';
const root = 'D:/GM_Claude'; const BASE = 'https://gmtoolshub.com'; const TODAY = '2026-11-20';
const old = {}; for (const m of fs.readFileSync(root + '/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)) old[m[1]] = m[2];
const changed = new Set(execSync('git status --porcelain', { cwd: root, encoding: 'utf8' }).split('\n').map(l => l.slice(3).trim().replace(/^"|"$/g, '')).filter(Boolean));
const urls = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); const rel = path.relative(root, p).replace(/\\/g, '/'); if (/^(\.git|\.github|products|node_modules|backend|embed|scripts|build|assets|data)(\/|$)/.test(rel)) continue; if (e.isDirectory()) walk(p); else if (e.name === 'index.html') {
  const h = fs.readFileSync(p, 'utf8'); if (/noindex/i.test(h) || /http-equiv=["']refresh/i.test(h)) continue;
  const canon = (h.match(/rel=["']canonical["'][^>]*href=["']([^"']+)/i) || [])[1]; const dir = rel === 'index.html' ? '' : rel.replace(/index\.html$/, '');
  const url = BASE + '/' + dir; if (canon !== url) { console.log('skip (canonical differs):', rel, canon); continue; }
  const lm = (changed.has(rel) || !old[url]) ? TODAY : old[url]; urls.push([url, lm]); } } })(root);
urls.sort((a, b) => a[0].localeCompare(b[0]));
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(([u, l]) => '<url><loc>' + u + '</loc><lastmod>' + l + '</lastmod></url>').join('\n') + '\n</urlset>\n';
fs.writeFileSync(root + '/sitemap.xml', xml); fs.writeFileSync(root + '/sitemap-pages.xml', xml);
console.log('sitemap urls:', urls.length, '| was', Object.keys(old).length);
