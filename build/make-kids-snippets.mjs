// One-off: saves the exact Kids Corner pieces that hide-features*.mjs removed, taken from the last commit before they were hidden,
// so build/restore-kids.mjs can put them back precisely. Output: build/kids-snippets.json
import { execSync } from 'child_process'; import fs from 'fs';
const BASE = '4efe237e'; // last commit before Kids Corner and Live jobs were hidden
const show = f => execSync('git show ' + BASE + ':' + f, { cwd: 'D:/GM_Claude', encoding: 'utf8', maxBuffer: 1 << 26 });
const out = [];
function take(file, startRe, endTok, label, ctx = 90) { const h = show(file); const m = startRe.exec(h); if (!m) { console.log('NOT FOUND', label); return; } const s = m.index; const e = h.indexOf(endTok, s) + endTok.length; out.push({ file, label, snippet: h.slice(s, e), before: h.slice(Math.max(0, s - ctx), s) }); }
// home: the whole kids section (smallest <section> around gx-kids-tiles)
{ const h = show('index.html'); const i = h.indexOf('gx-kids-tiles'); const s = h.lastIndexOf('<section', i); const e = h.indexOf('</section>', i) + 10; out.push({ file: 'index.html', label: 'home kids section', snippet: h.slice(s, e), before: h.slice(Math.max(0, s - 90), s) }); }
take('about/index.html', /<a class="gm-card" href="[^"]*\/kids\/">/, '</a>', 'about kids card');
take('about/index.html', /<li><b>Safe for children\.<\/b>/, '</li>', 'about safe-for-children bullet');
take('advertise/index.html', /<li><b>Kids Corner stays clean\.<\/b>/, '</li>', 'advertise kids bullet');
take('404.html', / · <a href="\/kids\/">Kids Corner<\/a>/, '</a>', '404 kids link');
// updates: the three Kids Corner changelog entries
{ const h = show('updates/index.html'); let re = /<li class="upd">(?:(?!<\/li>)[\s\S])*?upd-tag">Kids Corner<\/span>[\s\S]*?<\/div><\/li>/g, m, k = 0; while ((m = re.exec(h))) { out.push({ file: 'updates/index.html', label: 'updates kids entry ' + (++k), snippet: m[0], before: h.slice(Math.max(0, m.index - 90), m.index) }); } }
fs.writeFileSync('D:/GM_Claude/build/kids-snippets.json', JSON.stringify(out, null, 1));
console.log(out.map(o => o.label + ' (' + o.snippet.length + ' chars)').join('\n'));
