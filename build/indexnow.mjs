// Submits URLs to IndexNow (Bing, Yandex and others) so they can discover new or changed pages quickly.
// Usage: node build/indexnow.mjs [url ...]   (no arguments: submits every URL in sitemap.xml)
// The key file (<key>.txt) must already be live at https://gmtoolshub.com/<key>.txt. Google does not use IndexNow.
import fs from 'fs';
const root = 'D:/GM_Claude/'; const key = fs.readFileSync(root + 'build/indexnow-key.txt', 'utf8').trim();
let urls = process.argv.slice(2);
if (!urls.length) urls = [...fs.readFileSync(root + 'sitemap-pages.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const body = { host: 'gmtoolshub.com', key, keyLocation: 'https://gmtoolshub.com/' + key + '.txt', urlList: urls.slice(0, 10000) };
const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
console.log('IndexNow:', r.status, r.statusText, '(' + body.urlList.length + ' URLs). 200 or 202 means accepted for processing.');
