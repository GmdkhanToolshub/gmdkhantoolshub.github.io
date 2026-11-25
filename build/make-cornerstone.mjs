// Builds the cornerstone guides from an existing article's page template and adds them to the blog index. Safe to re-run.
// Drafts are built so they can be reviewed locally; do not publish until posts-cornerstone.mjs says status 'published'.
// Usage: node build/make-cornerstone.mjs ; python build/bump.py D:/GM_Claude ; node build/make-sitemap.mjs
import fs from 'fs';
import POSTS from './posts-cornerstone.mjs';
const root = 'D:/GM_Claude/';
const DATE = '2026-11-25', LABEL = '25 November 2026';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const T_SLUG = 'compress-pdf-without-losing-quality', T_TITLE = 'How to Compress a PDF Without Losing Quality', T_DESC = 'Why PDFs get large, how to shrink them for email and online forms while keeping text readable, and how to do it free in your browser.';
const tpl = fs.readFileSync(root + 'blog/' + T_SLUG + '/index.html', 'utf8');
const words = h => h.replace(/<section class="refs">[\s\S]*?<\/section>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').split(/\s+/).filter(Boolean).length;
const idx = fs.readFileSync(root + 'blog/index.html', 'utf8'), info = {};
for (const m of idx.matchAll(/<article class="card hover post-card"><span class="tag">([^<]*)<\/span><h3><a class="stretch" href="\.\.\/blog\/([^/]+)\/">([^<]*)<\/a><\/h3><p class="muted">([^<]*)<\/p><p class="small muted"[^>]*>([^<]*)<\/p><\/article>/g)) info[m[2]] = { tag: m[1], title: m[3], desc: m[4], read: m[5] };
for (const p of POSTS) { p.words = words(p.body); p.read = Math.max(4, Math.round(p.words / 200)) + ' min read'; info[p.slug] = { tag: p.eyebrow, title: esc(p.title), desc: esc(p.desc), read: p.read }; }
const card = (slug, rel) => { const i = info[slug]; if (!i) throw new Error('unknown related post ' + slug); return '<article class="card hover post-card"><span class="tag">' + i.tag + '</span><h3><a class="stretch" href="' + rel + 'blog/' + slug + '/">' + i.title + '</a></h3><p class="muted">' + i.desc + '</p><p class="small muted" style="margin:0;flex:none">' + i.read + '</p></article>'; };
const STYLE = '<style>.guide-fig{margin:22px 0}.guide-fig img{display:block;width:100%;height:auto;border:1px solid var(--border);border-radius:14px;background:#fff}.guide-fig figcaption{font-size:.88rem;color:var(--text-soft);margin-top:8px}.prose pre{white-space:pre-wrap;overflow-wrap:anywhere}.prose table{display:block;overflow-x:auto;max-width:100%}</style>\n';
for (const p of POSTS) {
  const url = 'https://gmtoolshub.com/blog/' + p.slug + '/';
  let h = tpl.split(T_TITLE).join(esc(p.title)).split(T_DESC).join(esc(p.desc)).split(T_SLUG).join(p.slug);
  h = h.replace(/Published \d{1,2} \w+ 2026(<\/span>)(<span>Updated [^<]+<\/span>)?/, 'Published ' + LABEL + '$1').replace(/"datePublished":"\d{4}-\d{2}-\d{2}"/, '"datePublished":"' + DATE + '"').replace(/"dateModified":"\d{4}-\d{2}-\d{2}"/, '"dateModified":"' + DATE + '"');
  h = h.split('<span class="eyebrow">Productivity</span>').join('<span class="eyebrow">' + p.eyebrow + '</span>').split('"articleSection":"Productivity"').join('"articleSection":"' + p.eyebrow + '"');
  h = h.replace(/<span>\d+ min read<\/span>/, '<span>' + p.read + '</span>');
  h = h.replace(/<article class="prose">[\s\S]*?<\/article>/, () => '<article class="prose">' + p.body.trim() + '\n</article>');
  h = h.replace(/<h2>Tools for this article<\/h2><ul class="side-links">[\s\S]*?<\/ul>/, () => '<h2>Tools for this article</h2><ul class="side-links">' + p.tools.map(t => '<li><a href="../../tools/' + t[0] + '/"><span>' + esc(t[1]) + '</span></a></li>').join('') + '</ul>');
  h = h.replace(/(<h2>Keep reading<\/h2><div class="grid grid-3">)[\s\S]*?(<\/div><aside class="ad-slot " data-ad="between")/, (m, a, b) => a + p.related.map(s => card(s, '../../')).join('') + b);
  h = h.replace('</head>', STYLE + '</head>');
  h = h.replace(/<!-- translate:start -->[\s\S]*?<!-- translate:end -->/, b => b.replace(/(&amp;u=)[^"]+(")/g, (m, a, q) => a + encodeURIComponent(url) + q));
  fs.mkdirSync(root + 'blog/' + p.slug, { recursive: true }); fs.writeFileSync(root + 'blog/' + p.slug + '/index.html', h, 'utf8');
  console.log(p.slug.padEnd(44), p.words, 'words,', p.read, '| FAQs', (p.body.split('<h2>Frequently asked questions</h2>')[1].split('<section class="refs">')[0].match(/<h3>/g) || []).length, '| status', p.status);
}
let ix = fs.readFileSync(root + 'blog/index.html', 'utf8');
for (const p of POSTS) ix = ix.replace(new RegExp('<article class="card hover post-card"><span class="tag">[^<]*</span><h3><a class="stretch" href="\\.\\./blog/' + p.slug + '/">[\\s\\S]*?</article>'), '');
const marker = '<h2 class="sr-only">All articles</h2><div class="grid grid-3">';
if (!ix.includes(marker)) throw new Error('blog index marker not found');
fs.writeFileSync(root + 'blog/index.html', ix.replace(marker, () => marker + POSTS.map(p => card(p.slug, '../')).join('')), 'utf8');
