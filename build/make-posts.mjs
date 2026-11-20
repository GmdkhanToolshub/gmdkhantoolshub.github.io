// Builds the new blog articles from an existing article's page template and adds them to the blog index.
// Safe to re-run: pages are rewritten and index cards are replaced, not duplicated.
import fs from 'fs'; import path from 'path';
import A from './posts-a.mjs'; import B from './posts-b.mjs'; import C from './posts-c.mjs';
const root = 'D:/GM_Claude/'; const POSTS = [...A, ...B, ...C];
const DATE = '2026-11-20', DATE_LABEL = '20 November 2026';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tpl = fs.readFileSync(root + 'blog/compress-pdf-without-losing-quality/index.html', 'utf8');
const T_SLUG = 'compress-pdf-without-losing-quality', T_TITLE = 'How to Compress a PDF Without Losing Quality';
const T_DESC = 'Why PDFs get large, how to shrink them for email and online forms while keeping text readable, and how to do it free in your browser.';
const words = html => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').split(/\s+/).filter(Boolean).length;

// existing post info (for "Keep reading" cards) taken from the blog index
const idx = fs.readFileSync(root + 'blog/index.html', 'utf8');
const info = {};
for (const m of idx.matchAll(/<article class="card hover post-card"><span class="tag">([^<]*)<\/span><h3><a class="stretch" href="\.\.\/blog\/([^/]+)\/">([^<]*)<\/a><\/h3><p class="muted">([^<]*)<\/p><p class="small muted"[^>]*>([^<]*)<\/p><\/article>/g))
  info[m[2]] = { tag: m[1], title: m[3], desc: m[4], read: m[5] };
for (const p of POSTS) { const w = words(p.body); p.words = w; p.read = Math.max(4, Math.round(w / 200)) + ' min read'; info[p.slug] = { tag: p.eyebrow, title: esc(p.title), desc: esc(p.desc), read: p.read }; }

const card = (slug, rel) => { const i = info[slug]; if (!i) throw new Error('unknown related post ' + slug); return '<article class="card hover post-card"><span class="tag">' + i.tag + '</span><h3><a class="stretch" href="' + rel + 'blog/' + slug + '/">' + i.title + '</a></h3><p class="muted">' + i.desc + '</p><p class="small muted" style="margin:0;flex:none">' + i.read + '</p></article>'; };

let report = [];
for (const p of POSTS) {
  let h = tpl;
  h = h.split(T_TITLE).join(esc(p.title)).split(T_DESC).join(esc(p.desc)).split(T_SLUG).join(p.slug);
  h = h.split('Published 10 November 2026').join('Published ' + DATE_LABEL).split('"datePublished":"2026-11-10"').join('"datePublished":"' + DATE + '"').split('"dateModified":"2026-11-10"').join('"dateModified":"' + DATE + '"');
  h = h.split('<span class="eyebrow">Productivity</span>').join('<span class="eyebrow">' + p.eyebrow + '</span>').split('"articleSection":"Productivity"').join('"articleSection":"' + p.eyebrow + '"');
  h = h.replace(/<span>\d+ min read<\/span>/, '<span>' + p.read + '</span>');
  h = h.replace(/<article class="prose">[\s\S]*?<\/article>/, () => '<article class="prose">' + p.body.trim() + '\n</article>');
  h = h.replace(/<h2>Tools for this article<\/h2><ul class="side-links">[\s\S]*?<\/ul>/, () => '<h2>Tools for this article</h2><ul class="side-links">' + p.tools.map(t => '<li><a href="../../tools/' + t[0] + '/"><span>' + esc(t[1]) + '</span></a></li>').join('') + '</ul>');
  h = h.replace(/(<h2>Keep reading<\/h2><div class="grid grid-3">)[\s\S]*?(<\/div><aside class="ad-slot " data-ad="between")/, (m, a, b) => a + p.related.map(s => card(s, '../../')).join('') + b);
  const dir = root + 'blog/' + p.slug; fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(dir + '/index.html', h, 'utf8');
  report.push(p.slug.padEnd(52) + p.words + ' words, ' + p.read);
}
// blog index: add the new cards at the top of the list and any new topic tags
let ix = fs.readFileSync(root + 'blog/index.html', 'utf8');
for (const p of POSTS) { const re = new RegExp('<article class="card hover post-card"><span class="tag">[^<]*</span><h3><a class="stretch" href="\\.\\./blog/' + p.slug + '/">[\\s\\S]*?</article>'); ix = ix.replace(re, ''); }
const marker = '<h2 class="sr-only">All articles</h2><div class="grid grid-3">';
if (!ix.includes(marker)) throw new Error('blog index marker not found');
ix = ix.replace(marker, marker + POSTS.slice().reverse().map(p => card(p.slug, '../')).join(''));
for (const t of ['Security', 'Design', 'Property']) if (!ix.includes('<span class="tag">' + t + '</span>')) ix = ix.replace('<span class="tag">Business Intelligence</span>', '<span class="tag">' + t + '</span><span class="tag">Business Intelligence</span>');
fs.writeFileSync(root + 'blog/index.html', ix, 'utf8');
console.log(report.join('\n'));
