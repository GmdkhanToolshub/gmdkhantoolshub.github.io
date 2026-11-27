// Fills the empty right side of each page's top section with a compact panel built from that page's OWN content:
// links to its sections (or, where that would repeat an existing menu, to related pages), a topic drawing and, on
// articles, the reading time. Static HTML, so it is readable without JavaScript. Safe to re-run.
import fs from 'fs'; import { execSync } from 'child_process';
import { art } from './hero-art.mjs';
const R = 'D:/GM_Claude/';
const files = [...new Set((execSync('git ls-files "*.html"', { cwd: R, encoding: 'utf8', maxBuffer: 1 << 24 }) + execSync('git ls-files --others --exclude-standard "*.html"', { cwd: R, encoding: 'utf8' })).split('\n').filter(f => f && !/^(backend|embed\/|products\/(ayah|excel|phase|master|social))/.test(f)))];
const SKIP = /^(checkout|admin-payments|daily-ayah|shop\/index\.html$|reasoning-test\/(certificate|certified)\/)/;
const decode = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&#x27;|&rsquo;/g, '’').replace(/&quot;/g, '"').replace(/&middot;/g, '·').replace(/&rarr;/g, '').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const short = s => { s = s.replace(/^\d+\.\s*/, ''); if (s.length <= 38) return s; const cut = s.slice(0, 37); return cut.slice(0, cut.lastIndexOf(' ') > 20 ? cut.lastIndexOf(' ') : 37).replace(/[,:;(–-]+$/, '') + '…'; };
const GENERIC = /^(more free tools|related tools|related articles|related|keep reading|references|how your data is handled|tools for this article|useful next steps|sponsored|advertisement|free tools and guides to try first|other services|share|need it changed)/i;
const strip = h => h.replace(/<!-- gmhp:(start|open|close) -->[\s\S]*?<!-- gmhp:end -->\n?/g, '');

function theme(f, h) {
  const cat = (h.match(/class="icon-chip cat-([a-z]+)"/) || [])[1];
  if (/^(solutions|portfolio|bi-studio|report-library|business-calculators|hcm|workspace|dashboard)/.test(f)) return 'chart';
  if (/^(gold-rate|silver-rate)/.test(f)) return 'gold';
  if (/^(rates|salary-tax|send-money|loan-emi|electricity|daily-rates|embed-rates|pricing|membership)/.test(f)) return 'money';
  if (/^convert/.test(f)) return 'swap';
  if (/^(blog|updates|tech-briefing|report)/.test(f)) { const e = decode((h.match(/<span class="eyebrow">([\s\S]*?)<\/span>/) || [, ''])[1]).toLowerCase(); return /excel|intelligence|sales|business|manag/.test(e) ? 'chart' : /career/.test(e) ? 'career' : /money|salary|everyday/.test(e) ? 'money' : /product|file/.test(e) ? 'doc' : 'network'; }
  if (/^(academy|developer-playground|gm-embed|rates-data|apps)/.test(f)) return 'code';
  if (/^(learn|reasoning-test|kids|growth|inspiration|interview|people-success)/.test(f)) return /interview|growth/.test(f) ? 'career' : 'learn';
  if (/^(career-studio|resume|services|get-expert)/.test(f)) return 'career';
  if (/^(shop|products|free-templates|recommendations|excel-formulas)/.test(f)) return /excel-formulas/.test(f) ? 'code' : 'shop';
  if (/^(about|contact|feedback|partners|advertise|media-kit|community|post-a-job|jobs)/.test(f)) return 'mail';
  if (/^(privacy|terms|cookie|disclaimer|refund|security|affiliate|subscription)/.test(f)) return 'shield';
  if (/^ur\//.test(f)) return 'language';
  if (/^tools\//.test(f)) { if (/pdf|word|excel/.test(f)) return 'doc'; if (/image/.test(f)) return 'image'; if (/clock|timer|stopwatch|pomodoro|alarm/.test(f)) return 'clock'; if (/urdu|hijri|number-converter/.test(f)) return 'language'; return { calculators: 'calc', utilities: 'code', career: 'career', lang: 'language', docs: 'doc', img: 'image' }[cat] || 'calc'; }
  if (/creative|assistant/.test(f)) return 'network';
  return 'network';
}

let done = 0, toc = 0, rel = 0; const skipped = {};
const note = (k, f) => (skipped[k] = skipped[k] || []).push(f);
for (const f of files) {
  let h = fs.readFileSync(R + f, 'utf8'); const original = h;
  if (!h.includes('class="site-header')) continue;
  h = strip(h);
  const m = h.match(/<section class="page-hero[^"]*"[^>]*>[\s\S]*?<\/section>/);
  const save = () => { if (h !== original) fs.writeFileSync(R + f, h, 'utf8'); };
  if (!m) { note('no top section', f); save(); continue; }
  if (SKIP.test(f) || /http-equiv="refresh"/i.test(h)) { note('private, redirect or Quran page', f); save(); continue; }
  if (/class="(tab-float|sh-show)/.test(m[0])) { note('already has side content', f); save(); continue; }
  const open = m[0].match(/^<section class="page-hero[^"]*"[^>]*><div class="container"[^>]*>/);
  const end = m[0].lastIndexOf('</div></section>');
  if (!open || end < 0 || m[0].slice(end + 16).length) { note('unusual top section', f); save(); continue; }
  const mainStart = m.index + m[0].length, mainEnd = h.indexOf('</main>', mainStart);
  let body = h.slice(mainStart, mainEnd);

  // sections of this page, skipping repeated boilerplate headings
  const items = [], ids = new Set([...h.matchAll(/\sid="([^"]+)"/g)].map(x => x[1]));
  const hasMenu = /class="gm-toc"/.test(body);
  if (!hasMenu) {
    body = body.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g, (all, attrs = '', inner) => {
      const label = decode(inner);
      if (items.length >= 6 || !label || label.length < 3 || GENERIC.test(label) || /sr-only|hidden/.test(attrs)) return all;
      let id = (attrs.match(/\sid="([^"]+)"/) || [])[1], out = all;
      if (!id) { const base = 's-' + (label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'part'); id = base; for (let i = 2; ids.has(id); i++) id = base + '-' + i; ids.add(id); out = '<h2' + attrs + ' id="' + id + '">' + inner + '</h2>'; }
      items.push(['#' + id, short(label)]);
      return out;
    });
  }
  let list = items, title = 'On this page', mode = 'toc';
  if (items.length < 3) {
    // related pages that this page already links to
    const seen = new Set(), links = [];
    const source = body.replace(/<nav class="(breadcrumb|gm-toc)"[\s\S]*?<\/nav>/g, '').replace(/<(script|aside)[\s\S]*?<\/\1>/g, '');
    for (const a of source.matchAll(/<a\b[^>]*href="((?!https?:|mailto:|tel:|#|javascript:)[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const heading = a[2].match(/<(h[23]|b|strong)[^>]*>([\s\S]*?)<\/\1>/); const label = decode(heading ? heading[2] : a[2]);
      const key = a[1].split(/[?#]/)[0];
      if (label.length < 4 || label.length > 70 || /^(read|open|view|details|more|learn more|try|order|buy|download)\b.{0,10}$/i.test(label) || /\.(xlsx|pdf|zip|csv)$/i.test(key) || seen.has(key)) continue;
      seen.add(key); links.push([a[1], short(label)]); if (links.length === 6) break;
    }
    if (links.length >= 2) { list = links; title = 'Explore next'; mode = 'related'; }
    else {
      const crumbs = [...m[0].matchAll(/<li><a href="([^"]+)">([\s\S]*?)<\/a><\/li>/g)].map(x => [x[1], decode(x[2])]);
      list = items.length ? items : crumbs.slice(-2); title = items.length ? 'On this page' : 'Go to'; mode = 'small';
    }
  }
  if (!list.length) { note('nothing meaningful to show', f); save(); continue; }
  let meta = '';
  if (/^blog\/[^/]+\/index\.html$/.test(f)) { const words = decode(body.replace(/<(script|nav|aside)[\s\S]*?<\/\1>/g, ' ').replace(/</g, ' <')).split(' ').length; meta = Math.max(2, Math.round(words / 210)) + ' min read'; }
  const panel = `<aside class="gmhp" data-art="${theme(f, h)}" aria-label="${title}"><div class="gmhp-art" aria-hidden="true">${art(theme(f, h))}</div><div class="gmhp-body"><p class="gmhp-title">${title}${meta ? '<span>' + meta + '</span>' : ''}</p><ul class="gmhp-list${list.length < 4 ? ' gmhp-one' : ''}">${list.map(([u, t]) => '<li><a href="' + u + '">' + esc(t) + '</a></li>').join('')}</ul></div></aside>`;
  const content = m[0].slice(open[0].length, end);
  const hero = open[0] + '<!-- gmhp:open --><div class="gmhp-wrap"><div class="gmhp-main"><!-- gmhp:end -->' + content + '<!-- gmhp:close --></div><!-- gmhp:end --><!-- gmhp:start -->' + panel + '</div><!-- gmhp:end -->' + m[0].slice(end);
  h = h.slice(0, m.index) + hero + body + h.slice(mainEnd);
  save(); done++; mode === 'toc' ? toc++ : rel++;
}
console.log('panels added:', done, '| section menus:', toc, '| related links:', rel);
for (const [k, v] of Object.entries(skipped)) console.log('  left unchanged (' + k + '):', v.length, v.slice(0, 4).join(' '));
