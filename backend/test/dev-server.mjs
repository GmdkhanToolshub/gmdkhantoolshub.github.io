// Local preview of the whole system for manual/browser testing: serves the static site AND the real Worker API (in-memory test database) on one origin.
// NOT for production. The data lives in memory and is lost when you stop it. Usage: node backend/test/dev-server.mjs  then open http://localhost:8787/checkout/?product=salary-tax-pack
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { makeEnv, worker } from './harness.mjs';

const ROOT = path.resolve(new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const PORT = 8787, ORIGIN = 'http://localhost:' + PORT;
const env = makeEnv({ ALLOWED_ORIGINS: ORIGIN, COOKIE_SAMESITE: 'Lax' });
const raw = env.DB._raw, enc = new TextEncoder(), hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
raw.exec(fs.readFileSync(new URL('../seed/products.sql', import.meta.url), 'utf8'));
raw.exec("INSERT INTO products(id,name,description,kind,currency,price_minor,trial_days,active,created_at) VALUES('embed-pro-test','GM Embed Pro (test plan)','Test subscription for the preview','monthly','PKR',500000,14,1,datetime('now'))");
raw.exec("INSERT INTO coupons(code,percent_off,active,created_at) VALUES('WELCOME10',10,1,datetime('now'))");
for (const [k, v] of Object.entries({ bank_name: 'PREVIEW BANK (test data)', account_title: 'PREVIEW ACCOUNT TITLE', account_number: '0000-TEST-0000', iban: 'PK00TEST0000000000000000', branch: 'Preview Branch', support_email: 'support@example.test', order_expiry_hours: '48' })) raw.prepare("INSERT INTO settings(key,value,updated_at) VALUES(?,?,datetime('now'))").run(k, v);
const salt = 'devsalt', k = await crypto.subtle.importKey('raw', enc.encode('ui-test-password-123'), 'PBKDF2', false, ['deriveBits']);
raw.prepare("INSERT INTO admins(id,email,pass_hash,salt,role,created_at) VALUES('dev-owner','owner@test.local',?,?, 'owner', datetime('now'))").run(hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, k, 256)), salt);

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };
http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, ORIGIN);
    if (u.pathname.startsWith('/api/')) {
      const chunks = []; for await (const c of req) chunks.push(c); const body = Buffer.concat(chunks);
      const h = {}; for (const [kk, vv] of Object.entries(req.headers)) h[kk] = vv; h['cf-connecting-ip'] = '127.0.0.1';
      const r = await worker.fetch(new Request(ORIGIN + req.url, { method: req.method, headers: h, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body }), env, { waitUntil() { } });
      const out = {}; r.headers.forEach((v, kk) => { out[kk] = v; }); const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : []; if (sc.length) out['set-cookie'] = sc;
      res.writeHead(r.status, out); res.end(Buffer.from(await r.arrayBuffer())); return;
    }
    if (u.pathname === '/assets/js/checkout-config.js') { res.writeHead(200, { 'Content-Type': TYPES['.js'] }); res.end('window.GM_PAY = { apiBase: "' + ORIGIN + '" };'); return; }
    let p = path.join(ROOT, decodeURIComponent(u.pathname)); if (!p.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
  } catch (e) { console.error(e); res.writeHead(500); res.end('error'); }
}).listen(PORT, () => console.log('Preview on ' + ORIGIN + ' (admin: owner@test.local / ui-test-password-123, test data only)'));
