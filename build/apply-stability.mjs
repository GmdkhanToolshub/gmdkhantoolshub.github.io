// Layout stability: loads the announcement bar before the header is drawn, draws the home Hadith bar before the
// page below it, and reserves space on the ayah page. Safe to re-run. Run build/bump.py afterwards.
import fs from 'fs'; import path from 'path';
const root = 'D:/GM_Claude';
let added = 0;
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name), rel = path.relative(root, p).replace(/\\/g, '/'); if (/^(\.git|\.github|\.claude|products|node_modules|backend|build|scripts|assets|data|embed|kids|updates)(\/|$)/.test(rel)) continue; if (e.isDirectory()) { walk(p); continue; } if (!e.name.endsWith('.html')) continue;
  let h = fs.readFileSync(p, 'utf8');
  if (h.includes('js/announce.js') || !/assets\/js\/(core|premium)\.js/.test(h)) continue;
  const m = h.match(/<header class="site-header/); if (!m) continue;
  const pre = (h.match(/href="((?:\.\.\/)+|\.\/|\/)assets\/css\/premium\.css/) || [])[1]; if (pre === undefined) continue;
  h = h.slice(0, m.index) + '<script src="' + pre + 'assets/js/announce.js?v=00000000"></script>\n' + h.slice(m.index);
  fs.writeFileSync(p, h, 'utf8'); added++;
} })(root);
console.log('announcement script added to', added, 'pages');

// home: the Hadith bar is built right after the header, before anything below it is painted
let home = fs.readFileSync(root + '/index.html', 'utf8');
const tag = home.match(/<script src="\.\/assets\/js\/hadith\.js[^"]*" defer><\/script>\n?/);
if (tag) {
  home = home.replace(tag[0], '');
  const at = home.indexOf('</header>'); if (at < 0) throw new Error('header end not found');
  home = home.slice(0, at + 9) + '\n' + tag[0].replace(' defer', '').trim() + home.slice(at + 9);
  fs.writeFileSync(root + '/index.html', home, 'utf8'); console.log('home Hadith script moved under the header');
}

// ayah page: the player has its place from the start, and the card holds the screen while the passage loads
let a = fs.readFileSync(root + '/daily-ayah/index.html', 'utf8');
a = a.replace('aria-label="Arabic recitation player" hidden>', 'aria-label="Arabic recitation player">');
fs.writeFileSync(root + '/daily-ayah/index.html', a, 'utf8');
const cssFile = root + '/assets/quran/daily-ayah.css'; let c = fs.readFileSync(cssFile, 'utf8');
if (!c.includes('while the passage loads')) { c = c.trimEnd() + '\n/* while the passage loads the card fills the screen, so nothing visible jumps when the text arrives */\n.qa-card[aria-busy="true"]{min-height:100vh}\n.qa-page:has(.qa-card[aria-busy="true"]) :is(.qa-nav,.qa-source){display:none}\n'; fs.writeFileSync(cssFile, c, 'utf8'); console.log('ayah page space reserved'); }
