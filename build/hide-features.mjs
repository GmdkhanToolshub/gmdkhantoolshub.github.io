// Hides the Live jobs feed and Kids Corner from navigation, footers, home and content pages.
// The hidden pages stay on disk but get noindex. Safe to re-run.
import fs from 'fs'; import path from 'path';
const root = 'D:/GM_Claude';
const pages = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); const rel = path.relative(root, p).replace(/\\/g, '/'); if (/^(\.git|products|node_modules|backend|embed|scripts|build)/.test(rel)) continue; if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) pages.push(rel); } })(root);

// remove the smallest <section> that encloses `marker`
function removeSectionAround(h, marker) {
  let guard = 0;
  while (guard++ < 5) {
    const i = h.indexOf(marker); if (i < 0) break;
    const s = h.lastIndexOf('<section', i); const e = h.indexOf('</section>', i);
    if (s < 0 || e < 0) break;
    const inner = h.slice(s + 8, e);
    if (/<section/.test(inner)) break; // nested: do not touch
    h = h.slice(0, s) + h.slice(e + 10);
  }
  return h;
}
const stats = {};
const bump = k => stats[k] = (stats[k] || 0) + 1;
for (const rel of pages) {
  const f = path.join(root, rel); let h = fs.readFileSync(f, 'utf8'); const o = h;
  const isKids = rel.startsWith('kids/'), isJobs = rel === 'jobs/index.html';
  if (!isKids) {
    // navigation and footer links
    h = h.replace(/<li><a class="nav-link" href="[^"]*\/kids\/">Kids Corner<\/a><\/li>/g, () => (bump('nav-kids'), ''));
    h = h.replace(/<li><a href="[^"]*\/kids\/">Kids Corner<\/a><\/li>/g, () => (bump('footer-kids'), ''));
    h = h.replace(/<a class="nm-link" href="[^"]*\/jobs\/"[^>]*><b>Live jobs<\/b><span>[^<]*<\/span><\/a>/g, () => (bump('nav-jobs'), ''));
    h = h.replace(/<li><a href="[^"]*\/jobs\/">Live jobs<\/a><\/li>/g, () => (bump('footer-jobs'), ''));
  }
  if (!isJobs && !isKids) {
    if (/data-jobs=/.test(h)) { h = removeSectionAround(h, 'data-jobs='); bump('job-sections'); }
    h = h.replace(/<a class="pf-mini" href="[^"]*\/jobs\/"[\s\S]*?<\/a>/g, () => (bump('home-jobs-tile'), ''));
  }
  if (rel === 'index.html') { if (/gx-kids-tiles/.test(h)) { h = removeSectionAround(h, 'gx-kids-tiles'); bump('home-kids'); } }
  if (rel === 'about/index.html') h = h.replace(/<a class="gm-card" href="[^"]*\/kids\/">[\s\S]*?<\/a>/g, () => (bump('about-kids-card'), ''));
  if (rel === 'career-studio/index.html') h = h.replace(/<article class="card hover pf-tool"><span class="tag">Jobs<\/span>[\s\S]*?<\/article>/g, () => (bump('career-jobs-card'), ''));
  // noindex the hidden areas
  if ((isKids || isJobs) && !/name="robots" content="noindex/i.test(h)) {
    if (/<meta name="robots"[^>]*>/i.test(h)) h = h.replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="noindex, nofollow">');
    else h = h.replace(/<\/title>/i, '</title><meta name="robots" content="noindex, nofollow">');
    bump('noindexed');
  }
  if (h !== o) { fs.writeFileSync(f, h, 'utf8'); bump('files-changed'); }
}
console.log(JSON.stringify(stats, null, 1));
