// Records every AdSense-related item so a redesign can prove none of them changed.
//   node build/adsense-fingerprint.mjs save <file>    |    node build/adsense-fingerprint.mjs check <file>
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const R = 'D:/GM_Claude';
const hash = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const norm = s => s.replace(/\r\n/g, '\n');
const out = {};
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name), rel = path.relative(R, p).replace(/\\/g, '/');
    if (/^(\.git|\.claude|products|node_modules|backend)(\/|$)/.test(rel)) continue;
    if (e.isDirectory()) { walk(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    const h = norm(fs.readFileSync(p, 'utf8'));
    const parts = [
      ...(h.match(/<!-- adsense:start -->[\s\S]*?<!-- adsense:end -->/g) || []),
      ...(h.match(/<meta[^>]+google-adsense[^>]*>/g) || []),
      ...(h.match(/<script[^>]*(?:adsbygoogle|googlesyndication)[^>]*>(?:[\s\S]*?<\/script>)?/g) || []),
      ...(h.match(/<ins[^>]*adsbygoogle[\s\S]*?<\/ins>/g) || []),
      ...(h.match(/<aside class="ad-slot[^>]*>[\s\S]*?<\/aside>|<div class="ad-slot[^>]*>[\s\S]*?<\/div>/g) || []),
      ...(h.match(/ca-pub-\d+|pub-\d{10,}/g) || [])
    ];
    if (parts.length) out['page:' + rel] = parts.length + ':' + hash(parts.join('\n'));
  }
})(R);
out['ads.txt'] = hash(norm(fs.readFileSync(R + '/ads.txt', 'utf8')));
out['config.js (publisher id and slots)'] = hash(norm(fs.readFileSync(R + '/assets/js/config.js', 'utf8')));
// the ad code inside the shared script
const main = norm(fs.readFileSync(R + '/assets/js/main.js', 'utf8'));
const from = main.indexOf('function slotId('), to = main.indexOf('function closeBanner(');
if (from < 0 || to < 0) throw new Error('ad code in main.js not found');
out['main.js ad functions'] = hash(main.slice(from, to));
out['main.js ad consent banner'] = hash(main.slice(to, main.indexOf('var needsConsent')));
const [mode, file] = process.argv.slice(2);
if (mode === 'save') { fs.writeFileSync(file, JSON.stringify(out, null, 1)); console.log('saved', Object.keys(out).length, 'items'); }
else {
  const old = JSON.parse(fs.readFileSync(file, 'utf8')), keys = new Set([...Object.keys(old), ...Object.keys(out)]);
  const diff = [...keys].filter(k => old[k] !== out[k]);
  console.log('AdSense items compared:', keys.size, '| changed:', diff.length, diff.slice(0, 20).join(', '));
  process.exit(diff.length ? 1 : 0);
}
