// Shared helper: builds a new indexable page using the site's own header/footer/head from gold-rate/index.html.
// Used by build/make-earning-pages.mjs. Keeps one source of truth for navigation, footer, consent and analytics scripts.
import fs from 'fs';
export const ROOT = 'D:/GM_Claude/';
const base = fs.readFileSync(ROOT + 'gold-rate/index.html', 'utf8');
const mi = base.indexOf('<main id="main">'), me = base.indexOf('</main>');
const PRE = base.slice(0, mi + '<main id="main">'.length), POST0 = base.slice(me);
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function buildPage({ slug, title, desc, ld = [], main, extraHead = '', robots = 'index, follow, max-image-preview:large', depth = 1 }) {
  const url = 'https://gmtoolshub.com/' + slug + '/';
  let pre = PRE; const deep = s => depth === 2 ? s.replace(/((?:href|src|data-root)=")\.\.\//g, '$1../../') : s; pre = deep(pre).replace(/frame-src https:;/, "frame-src 'self' https:;");
  const t = esc(title), d = esc(desc);
  // The shell page's own "current" menu item must not carry over; mark the new page's item if the menu has one.
  pre = pre.replace(/<ul class="nav-links" id="nav-links">[\s\S]*?<\/ul><\/nav>/, n => n.replace(/ aria-current="page"/g, '').replace(new RegExp('(<a class="nav-link" href="(?:\\.\\./)+' + slug + '/")'), '$1 aria-current="page"'));
  pre = pre.replace(/<title>[\s\S]*?<\/title>/, '<title>' + t + '</title>')
    .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + d + '">')
    .replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + url + '">')
    .replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="' + robots + '">')
    .replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + t + '">')
    .replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + d + '">')
    .replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="' + url + '">')
    .replace(/<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="' + t + '">')
    .replace(/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="' + d + '">')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gmtoolshub.com/' }, { '@type': 'ListItem', position: 2, name: title.split(' | ')[0].slice(0, 60) }] };
  const page = { '@context': 'https://schema.org', '@type': 'WebPage', name: title.replace(' | GM Tools Hub', ''), url, description: desc, inLanguage: 'en', isPartOf: { '@type': 'WebSite', name: 'GM Tools Hub', url: 'https://gmtoolshub.com/' }, author: { '@type': 'Person', name: 'Gmd Khan Niazi' } };
  const all = [crumbs, page, ...ld].map(o => '<script type="application/ld+json">' + JSON.stringify(o) + '</script>').join('\n');
  pre = pre.replace('</head>', all + '\n' + extraHead + '</head>');
  const post = deep(POST0).replace(/\s*<script src="(?:\.\.\/)+assets\/js\/gold-page\.js[^>]*><\/script>/, '').replace(/%2Fservices%2F/g, '%2F' + slug.replace(/\//g, '%2F') + '%2F');
  fs.mkdirSync(ROOT + slug, { recursive: true });
  const out = pre + main + post;
  fs.writeFileSync(ROOT + slug + '/index.html', out, 'utf8');
  return out.length;
}
export const hero = (crumb, eyebrow, h1, lead) => `<section class="page-hero"><div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="../">Home</a></li><li aria-current="page">${esc(crumb)}</li></ol></nav><span class="eyebrow">${esc(eyebrow)}</span><h1>${h1}</h1><p class="lead">${esc(lead)}</p></div></section>`;
export const faqLd = faqs => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
export const faqHtml = faqs => faqs.map(([q, a]) => '<details class="faq"><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('');
export const CSS = '<style>.ep-grid{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));align-items:start}.ep-card{border:1px solid var(--border);border-radius:16px;background:var(--surface);padding:18px}.ep-card h2,.ep-card h3{margin-top:0}.ep-note{padding:14px 16px;border:1px solid var(--border-strong);border-left:4px solid var(--accent);border-radius:12px;background:var(--surface)}.ep-row{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:0 0 12px}.ep-row label{display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:.9rem}.ep-row input,.ep-row select,.ep-card textarea{font:inherit;padding:9px 11px;border-radius:10px;border:1.5px solid var(--border-strong);background:var(--surface);color:var(--text);min-width:0}.ep-wrap{overflow-x:auto}.ep-wrap table{min-width:420px}.ep-pills{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}.ep-pills li{padding:6px 12px;border:1px solid var(--border);border-radius:999px;background:var(--surface);font-size:.9rem}.ep-big{font-size:1.5rem;font-weight:800}.ep-ok{color:#15803d;font-weight:700}.ep-bad{color:#b91c1c;font-weight:700}</style>';



