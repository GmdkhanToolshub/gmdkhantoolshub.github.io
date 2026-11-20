// Brings Kids Corner back: navigation, footer, home section, About card, changelog entries, and makes the Kids pages indexable again.
// Run ONLY after you have decided Kids Corner should be public (for example after AdSense approval).
// Usage: node build/restore-kids.mjs [--root D:/path/to/copy] [--no-sitemap]
// Safe to re-run. Kids pages carry no ad code and must keep carrying none.
import fs from 'fs'; import path from 'path'; import { execSync } from 'child_process';
const arg = n => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const root = (arg('--root') || 'D:/GM_Claude').replace(/\\/g, '/').replace(/\/$/, '') + '/';
const snippets = JSON.parse(fs.readFileSync('D:/GM_Claude/build/kids-snippets.json', 'utf8'));
const stats = {}; const bump = k => stats[k] = (stats[k] || 0) + 1;
const pages = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); const rel = path.relative(root, p).replace(/\\/g, '/'); if (/^(\.git|\.github|products|node_modules|embed|scripts|build|data|assets)(\/|$)/.test(rel)) continue; if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) pages.push(rel); } })(root);
for (const rel of pages) {
  const f = root + rel; let h = fs.readFileSync(f, 'utf8'); const o = h;
  if (rel.startsWith('kids/')) {
    if (/name="robots" content="noindex/i.test(h)) { h = h.replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="index, follow, max-image-preview:large">'); bump('kids pages made indexable'); }
  } else {
    // navigation: put the link back before Portfolio
    const nav = h.match(/<li><a class="nav-link" href="([^"]*)portfolio\/">/);
    if (nav && !/class="nav-link" href="[^"]*kids\/">Kids Corner/.test(h)) { h = h.replace(nav[0], '<li><a class="nav-link" href="' + nav[1] + 'kids/">Kids Corner</a></li>' + nav[0]); bump('nav link'); }
    // footer: after the GM HCM entry
    const ft = h.match(/<li><a href="([^"]*)hcm\/">GM HCM[^<]*<\/a><\/li>/);
    if (ft && !/<li><a href="[^"]*kids\/">Kids Corner<\/a><\/li>/.test(h)) { h = h.replace(ft[0], ft[0] + '<li><a href="' + ft[1] + 'kids/">Kids Corner</a></li>'); bump('footer link'); }
  }
  for (const s of snippets) {
    if (s.file !== rel) continue;
    if (h.includes(s.snippet)) continue;
    const i = h.indexOf(s.before); if (i < 0) { bump('SKIPPED (anchor not found): ' + s.label); continue; }
    h = h.slice(0, i + s.before.length) + s.snippet + h.slice(i + s.before.length); bump(s.label);
  }
  if (rel === 'affiliate-disclosure/index.html') h = h.replace('We do not recommend products to children.', 'We do not recommend products to children, and Kids Corner never contains affiliate links or adverts.');
  if (rel === 'media-kit/index.html' && !h.includes('Kids Corner with 12 learning gadgets')) h = h.replace('74 free tools and gadgets, ', '74 free tools and gadgets, Kids Corner with 12 learning gadgets, ');
  if (h !== o) { fs.writeFileSync(f, h, 'utf8'); bump('files changed'); }
}
if (!process.argv.includes('--no-sitemap') && root === 'D:/GM_Claude/') { try { console.log(execSync('node build/make-sitemap.mjs', { cwd: root, encoding: 'utf8' }).trim()); } catch (e) { console.log('run build/make-sitemap.mjs manually'); } }
console.log(JSON.stringify(stats, null, 1));
