// GM Embed phase 1: static compatibility audit of every tool. Output: products/gm-embed/compatibility-report.md and .json
// A tool is only a CANDIDATE here; it becomes a listed widget only after it passes the live embed test (build/embed-test.mjs).
import fs from 'fs'; import vm from 'vm'; import path from 'path';
const root = 'D:/GM_Claude/';
const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(root + 'assets/js/tools-data.js', 'utf8'), ctx);
const tools = ctx.window.TOOLS_DATA;
const existing = fs.readdirSync(root + 'embed', { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
const rows = [];
for (const t of tools) {
  const f = root + 'assets/js/tools/' + t.slug + '.js'; const exists = fs.existsSync(f); const js = exists ? fs.readFileSync(f, 'utf8') : '';
  const flags = [];
  if (!exists) flags.push('no-tool-script');
  if (/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/.test(js)) flags.push('network');
  if (/https?:\/\/(?!gmtoolshub\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(js.replace(/https?:\/\/www\.w3\.org[^'"]*/g, ''))) flags.push('external-url');
  if (/type=.?file|FileReader|showOpenFilePicker|input\[type=file\]|accept=/.test(js)) flags.push('file-input');
  if (/loadScript|importScripts|new Worker|assets\/vendor|\/vendor\//.test(js)) flags.push('loads-libraries');
  if (/getUserMedia|mediaDevices|geolocation|Notification\.|speechSynthesis|SpeechRecognition/.test(js)) flags.push('device-api');
  if (/navigator\.clipboard/.test(js)) flags.push('clipboard');
  if (/localStorage|sessionStorage|indexedDB/.test(js)) flags.push('storage');
  if (/window\.open|location\.href|location\.assign/.test(js)) flags.push('navigation');
  if (/document\.body|data-root|getElementById\((?!['"]tool-root)/.test(js)) flags.push('page-dependent');
  let verdict;
  if (existing.includes(t.slug)) verdict = 'EMBED ROUTE EXISTS (needs live test)';
  else if (flags.some(x => ['no-tool-script', 'device-api', 'network', 'external-url', 'loads-libraries', 'file-input', 'navigation'].includes(x))) verdict = 'NOT SUITABLE YET';
  else verdict = 'CANDIDATE';
  rows.push({ slug: t.slug, name: t.name, cat: t.cat, bytes: js.length, flags, verdict, url: 'https://gmtoolshub.com/tools/' + t.slug + '/' });
}
fs.mkdirSync(root + 'products/gm-embed', { recursive: true });
fs.writeFileSync(root + 'products/gm-embed/compatibility.json', JSON.stringify(rows, null, 1));
const by = v => rows.filter(r => r.verdict === v);
let md = '# GM Embed: tool compatibility report (static analysis, ' + new Date().toISOString().slice(0, 10) + ')\n\n';
md += 'Tools analysed: ' + rows.length + '. Embed routes already in the repository: ' + existing.join(', ') + '.\n\n';
md += 'Method: each tool script was scanned for network calls, external URLs, file inputs, loaded libraries, device APIs, clipboard, storage and navigation. A tool is listed as a widget only after passing the live embed test; this report is the pre-test screen.\n\n';
md += 'Counts: ' + ['EMBED ROUTE EXISTS (needs live test)', 'CANDIDATE', 'NOT SUITABLE YET'].map(v => v + ' = ' + by(v).length).join(', ') + '\n\n';
for (const v of ['EMBED ROUTE EXISTS (needs live test)', 'CANDIDATE', 'NOT SUITABLE YET']) {
  md += '## ' + v + ' (' + by(v).length + ')\n\n| Tool | Category | Script KB | Flags |\n|---|---|---|---|\n';
  for (const r of by(v)) md += '| ' + r.name + ' (`' + r.slug + '`) | ' + r.cat + ' | ' + (r.bytes / 1024).toFixed(1) + ' | ' + (r.flags.join(', ') || 'none') + ' |\n';
  md += '\n';
}
md += 'Flag meanings: network = makes web requests (privacy and CSP review needed); external-url = references another domain; file-input = handles files (needs iframe permissions and size limits); loads-libraries = loads extra scripts or workers; device-api = camera, microphone, location, speech or notifications; clipboard = needs allow=clipboard-write on the iframe; storage = uses browser storage (partitioned inside third-party iframes); navigation = may navigate or open windows; page-dependent = reads page elements outside the tool root.\n';
fs.writeFileSync(root + 'products/gm-embed/compatibility-report.md', md);
console.log(rows.length, 'tools |', ['EMBED ROUTE EXISTS (needs live test)', 'CANDIDATE', 'NOT SUITABLE YET'].map(v => by(v).length).join(' / '));
console.log('candidates:', by('CANDIDATE').map(r => r.slug + '[' + r.flags.join(',') + ']').join('  '));
