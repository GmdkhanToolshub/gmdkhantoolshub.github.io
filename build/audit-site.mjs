// Full static audit of the site. Usage: node build/audit-site.mjs [--json out.json]
import fs from 'fs'; import path from 'path';
const root = 'D:/GM_Claude'; const SITE = 'https://gmtoolshub.com';
const pages = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); const rel = path.relative(root, p).replace(/\\/g, '/'); if (/^(\.git|\.github|products|node_modules|backend|embed|scripts|build|data|assets)(\/|$)/.test(rel)) continue; if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html') && !/^google/.test(e.name)) pages.push(rel); } })(root);
const exists = u => { let p = u.split('#')[0].split('?')[0]; if (!p) return true; p = decodeURIComponent(p); const f = path.join(root, p); if (fs.existsSync(f)) return fs.statSync(f).isDirectory() ? fs.existsSync(path.join(f, 'index.html')) : true; return false; };
const R = { pages: pages.length, indexable: 0, issues: {} };
const add = (k, v) => { (R.issues[k] = R.issues[k] || []).push(v); };
const ids = {};
const sm = new Set([...fs.readFileSync(root + '/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]));
for (const rel of pages) {
  const h = fs.readFileSync(path.join(root, rel), 'utf8');
  const noindex = /name=["']robots["'][^>]*noindex/i.test(h); const stub = /http-equiv=["']refresh/i.test(h);
  const urlPath = rel === 'index.html' || rel === '404.html' ? '' : rel.replace(/index\.html$/, '');
  if (rel === '404.html') continue;
  const dirOf = path.posix.dirname(rel);
  ids[rel] = new Set([...h.matchAll(/\sid=["']([^"']+)["']/g)].map(m => m[1]));
  if (noindex || stub) { if (sm.has(SITE + '/' + urlPath)) add('noindex page listed in sitemap', rel); continue; }
  R.indexable++;
  const title = (h.match(/<title>([^<]*)<\/title>/i) || [])[1]; const desc = (h.match(/<meta[^>]+name=["']description["'][^>]+content="([^"]*)"/i) || [])[1] || (h.match(/<meta[^>]+name=["']description["'][^>]+content='([^']*)'/i) || [])[1];
  if (!title) add('missing title', rel); else if (title.replace(/&[a-z#0-9]+;/g, 'x').length > 70) add('title over 70 chars', rel + ' (' + title.length + ')');
  if (!desc) add('missing meta description', rel); else if (desc.length > 170) add('description over 170', rel + ' (' + desc.length + ')'); else if (desc.length < 50) add('description under 50', rel);
  const canon = (h.match(/rel=["']canonical["'][^>]*href=["']([^"']+)/i) || [])[1]; if (canon !== SITE + '/' + urlPath) add('canonical not self', rel + ' -> ' + canon);
  if (!sm.has(SITE + '/' + urlPath)) add('indexable page missing from sitemap', rel);
  if (!/<html[^>]+lang=/i.test(h)) add('missing html lang', rel);
  if (!/name=["']viewport["']/i.test(h)) add('missing viewport', rel);
  if (!/property=["']og:title["']/i.test(h) || !/property=["']og:image["']/i.test(h)) add('missing Open Graph title/image', rel);
  if (!/name=["']twitter:card["']/i.test(h)) add('missing twitter card', rel);
  const main = (h.match(/<main[\s\S]*?<\/main>/i) || [h])[0];
  const h1 = (main.match(/<h1[\s>]/gi) || []).length; if (h1 !== 1) add('h1 count != 1', rel + ' (' + h1 + ')');
  const levels = [...main.matchAll(/<h([1-6])[\s>]/gi)].map(m => +m[1]); for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) { add('heading level skipped', rel + ' (h' + levels[i - 1] + '->h' + levels[i] + ')'); break; }
  for (const m of h.matchAll(/<img\b[^>]*>/gi)) { if (!/\salt=/i.test(m[0])) { add('image without alt', rel); break; } }
  for (const m of h.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) if (!/rel=["'][^"']*noopener/i.test(m[0])) { add('target=_blank without noopener', rel); break; }
  if (/(src|href)=["']http:\/\//i.test(h.replace(/xmlns="http:[^"]*"/g, ''))) add('http:// (mixed content) reference', rel);
  let ldBad = 0; const ldTypes = []; for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { const j = JSON.parse(m[1]); ldTypes.push(...[].concat(j['@type'] || [])); } catch (e) { ldBad++; } } if (ldBad) add('invalid JSON-LD', rel);
  if (urlPath && !ldTypes.includes('BreadcrumbList') && !/^(blog\/[^/]+\/)?$/.test('')) { if (!ldTypes.includes('BreadcrumbList')) add('no BreadcrumbList schema', rel); }
  // links
  for (const m of h.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    let u = m[1]; if (/^(https?:|mailto:|tel:|sms:|javascript:|data:|#$|whatsapp:)/i.test(u)) { if (/^https?:\/\/gmtoolshub\.com/i.test(u)) { u = u.replace(/^https?:\/\/gmtoolshub\.com/i, ''); } else continue; }
    if (u === '#' || u.startsWith('#')) continue;
    const abs = u.startsWith('/') ? u : path.posix.normalize(path.posix.join(dirOf, u)); const clean = abs.replace(/^\//, '');
    if (!exists(clean)) add('broken internal link', rel + ' -> ' + m[1]);
  }
}
// anchors
for (const rel of pages) { if (rel === '404.html') continue; const h = fs.readFileSync(path.join(root, rel), 'utf8'); const dirOf = path.posix.dirname(rel); for (const m of h.matchAll(/<a\b[^>]*href=["']([^"'#]*)#([^"']+)["']/gi)) { if (/^https?:|^mailto:/i.test(m[1])) continue; const tgt = m[1] ? path.posix.normalize(path.posix.join(dirOf, m[1])).replace(/\/$/, '') + '/index.html' : rel; const key = ids[tgt] ? tgt : (ids[tgt.replace(/\/index\.html$/, '.html')] ? tgt : null); if (key && !ids[key].has(m[2]) && !/^[!:~]/.test(m[2])) add('broken #anchor', rel + ' -> ' + m[1] + '#' + m[2]); } }
console.log('pages', R.pages, '| indexable', R.indexable, '| sitemap urls', sm.size);
for (const [k, v] of Object.entries(R.issues).sort((a, b) => b[1].length - a[1].length)) console.log(String(v.length).padStart(4), k, '|', [...new Set(v)].slice(0, 4).join('; '));
if (process.argv[2] === '--json') fs.writeFileSync(process.argv[3], JSON.stringify(R, null, 1));
