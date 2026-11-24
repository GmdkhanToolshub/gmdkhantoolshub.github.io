// Redirect stubs: give each a unique title, a description and noindex so they never count as thin pages.
import fs from 'fs'; import path from 'path';
const root = 'D:/GM_Claude';
const stubs = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); const rel = path.relative(root, p).replace(/\\/g, '/'); if (/^(\.git|products|node_modules|backend|embed)/.test(rel)) continue; if (e.isDirectory()) walk(p); else if (e.name === 'index.html') { const h = fs.readFileSync(p, 'utf8'); if (/http-equiv=["']refresh/i.test(h) && h.length < 1500) stubs.push(rel); } } })(root);
let n = 0;
for (const rel of stubs) {
  const f = path.join(root, rel); let h = fs.readFileSync(f, 'utf8');
  const target = (h.match(/rel=["']canonical["'][^>]*href=["']https:\/\/gmtoolshub\.com([^"']*)/i) || [])[1] || '/';
  const name = target.split('/').filter(Boolean).pop() || 'home';
  const nice = name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const title = 'Moved: ' + nice + ' | GM Tools Hub';
  const desc = 'This old address now redirects to the ' + nice + ' page on GM Tools Hub. Follow the link to continue.';
  h = h.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + title + '</title>');
  if (!/name=["']description["']/i.test(h)) h = h.replace(/<\/title>/i, '</title><meta name="description" content="' + desc + '">');
  if (!/noindex/i.test(h)) h = h.replace(/<\/title>/i, '</title><meta name="robots" content="noindex, follow">');
  fs.writeFileSync(f, h, 'utf8'); n++;
}
console.log('stubs fixed', n);
