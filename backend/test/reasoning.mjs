// Tests for the certified reasoning test: server-side scoring, time limit, paid certificate lifecycle and verification.
// Uses a TEST seed; the real certified key is private and never used here.
import assert from 'node:assert/strict';
import { makeEnv, call, cookieFrom } from './harness.mjs';
import { makeBank, LEVEL_SPEC_CERTIFIED } from '../../build/reasoning-gen.mjs';

const enc = new TextEncoder(), hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
async function pbkdf2(pw, salt) { const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']); return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, k, 256)); }
const results = []; const t = async (name, fn) => { try { await fn(); results.push([name, true]); console.log('  PASS', name); } catch (e) { results.push([name, false]); console.log('  FAIL', name, '\n       ', (e && e.message || e).toString().split('\n')[0]); } };
const NOW = () => new Date().toISOString();
const bank = makeBank('test-seed-only', LEVEL_SPEC_CERTIFIED);
const env = makeEnv(), envNoKeys = makeEnv(), raw = env.DB._raw;
bank.keys.forEach((k, i) => raw.prepare('INSERT INTO quiz_keys(qid,level,correct) VALUES(?,?,?)').run('c' + (i + 1), LEVEL_SPEC_CERTIFIED[i], k));
for (const [k, v] of Object.entries({ bank_name: 'TEST BANK', account_title: 'TEST', account_number: '1', support_email: 'a@b.co' })) raw.prepare("INSERT INTO settings(key,value,updated_at) VALUES(?,?,?)").run(k, v, NOW());
const salt = 'sx', pw = 'correct horse battery staple'; raw.prepare("INSERT INTO admins(id,email,pass_hash,salt,role,created_at) VALUES('o1','o@example.com',?,?,'owner',?)").run(await pbkdf2(pw, salt), salt, NOW());
const lr = await call(env, 'POST', '/api/admin/login', { json: { email: 'o@example.com', password: pw } }); const owner = { cookie: cookieFrom(lr), csrf: lr.data.csrf };
const A = (extra = {}) => ({ headers: { Cookie: owner.cookie, 'X-CSRF-Token': owner.csrf, Origin: 'https://gmtoolshub.com' }, ...(extra.json !== undefined ? { json: extra.json } : {}) });
const allRight = () => bank.keys.slice(), allWrong = () => bank.keys.map(k => (k + 1) % 8);
const start = async (e = env) => { const r = await call(e, 'POST', '/api/quiz/start', { json: { bank: 'certified' } }); return r; };
const finish = (att, answers, e = env) => call(e, 'POST', '/api/quiz/' + att.attempt_id + '/finish', { headers: { 'X-Order-Token': att.token }, json: { answers } });
const activate = (price = 99900) => raw.prepare("UPDATE products SET active=1, price_minor=? WHERE id='reasoning-certificate'").run(price);
const buy = (att, extra = {}) => call(env, 'POST', '/api/orders', { json: { product_id: 'reasoning-certificate', method: 'bank_transfer', name: 'Sara Ahmed', email: 'sara@example.com', accept_terms: true, attempt_id: att.attempt_id, attempt_token: att.token, ...extra } });

console.log('\nCertified test: scoring');
await t('test cannot start while no answer key is loaded', async () => { const r = await start(envNoKeys); assert.equal(r.status, 503); assert.equal(r.data.error.code, 'quiz_not_ready'); });
await t('start returns an attempt, a private token and the 35 minute limit', async () => { const r = await start(); assert.equal(r.status, 201); assert.equal(r.data.seconds, 2100); assert.equal(r.data.questions, 30); assert.ok(r.data.token.length > 20); });
let a1;
await t('all correct answers score 100 and "Very high"', async () => { a1 = (await start()).data; const r = await finish(a1, allRight()); assert.equal(r.status, 200); assert.equal(r.data.pct, 100); assert.equal(r.data.raw, 30); assert.equal(r.data.level, 'Very high'); });
await t('all wrong answers score 0 and "Developing"', async () => { const a = (await start()).data; const r = await finish(a, allWrong()); assert.equal(r.data.pct, 0); assert.equal(r.data.level, 'Developing'); });
await t('skipped questions count as not correct and harder puzzles weigh more', async () => { const a = (await start()).data; const ans = allRight().map((v, i) => (i < 5 ? v : null)); const r = await finish(a, ans); assert.equal(r.data.raw, 5); assert.equal(r.data.pct, Math.round(5 / (5 * 1 + 7 * 2 + 8 * 3 + 10 * 4) * 100)); const b = (await start()).data; const hard = allRight().map((v, i) => (i >= 20 ? v : null)); const r2 = await finish(b, hard); assert.ok(r2.data.pct > r.data.pct, 'ten hard puzzles outweigh five easy ones'); });
await t('an attempt cannot be submitted twice', async () => { const r = await finish(a1, allWrong()); assert.equal(r.status, 409); });
await t('wrong or missing attempt token is refused', async () => { const a = (await start()).data; const r = await call(env, 'POST', '/api/quiz/' + a.attempt_id + '/finish', { headers: { 'X-Order-Token': 'nope' }, json: { answers: allRight() } }); assert.equal(r.status, 404); const r2 = await call(env, 'POST', '/api/quiz/' + a.attempt_id + '/finish', { json: { answers: allRight() } }); assert.equal(r2.status, 404); });
await t('malformed answers are refused', async () => { const a = (await start()).data; assert.equal((await finish(a, [1, 2, 3])).status, 400); assert.equal((await finish(a, allRight().map(() => 9))).status, 400); assert.equal((await finish(a, allRight().map(() => 'x'))).status, 400); });
await t('submissions after the time limit are refused', async () => { const a = (await start()).data; raw.prepare("UPDATE quiz_attempts SET deadline_at='2020-01-01T00:00:00.000Z' WHERE id=?").run(a.attempt_id); const r = await finish(a, allRight()); assert.equal(r.status, 410); });
await t('the public question file never contains the answers', async () => { const fs = await import('node:fs'); const p = new URL('../../data/reasoning-certified.json', import.meta.url); if (!fs.existsSync(p)) return; const j = JSON.parse(fs.readFileSync(p, 'utf8')); for (const q of j.questions) { assert.equal(q.answer, undefined); assert.equal(q.correct, undefined); } assert.equal(JSON.stringify(j).includes('"answer"'), false); });

console.log('\nPaid certificate lifecycle');
await t('certificate product is inactive and cannot be bought until the owner switches it on', async () => { const att = (await start()).data; await finish(att, allRight()); const r = await buy(att); assert.equal(r.status, 404); });
activate();
await t('buying without a finished attempt is refused', async () => { const unfinished = (await start()).data; assert.equal((await buy(unfinished)).data.error.code, 'attempt_invalid'); assert.equal((await buy({ attempt_id: 'zzzzzzzzzzzz', token: 'x' })).data.error.code, 'attempt_invalid'); });
let att2, ord2, tok2, cert2;
await t('wrong attempt token is refused even for a finished attempt', async () => { att2 = (await start()).data; await finish(att2, allRight().map((v, i) => (i % 3 === 0 ? v : (v + 1) % 8))); const r = await buy({ ...att2, token: 'wrong-token' }); assert.equal(r.data.error.code, 'attempt_invalid'); });
await t('order for a finished attempt is created, priced by the server, and no certificate exists yet', async () => { const r = await buy(att2, { certificate_name: 'Sara Ahmed' }); assert.equal(r.status, 201); ord2 = r.data.order; tok2 = r.data.token; assert.equal(ord2.total_minor, 99900); assert.equal(raw.prepare('SELECT COUNT(*) c FROM certificates').get().c, 0); });
await t('a second order for the same attempt is refused while the first is open', async () => { const r = await buy(att2); assert.equal(r.status, 409); });
await t('certificate is NOT issued by a receipt upload alone', async () => { const f = new FormData(); f.append('file', new Blob([new Uint8Array([0x89, 0x50, 0x4E, 0x47, 1, 2, 3, 4, 5, 6])]), 'r.png'); f.append('txn_reference', 'CERT-TXN-1'); const r = await call(env, 'POST', '/api/orders/' + ord2.ref + '/receipt', { headers: { 'X-Order-Token': tok2 }, form: f }); assert.equal(r.status, 200); assert.equal(raw.prepare('SELECT COUNT(*) c FROM certificates').get().c, 0); });

// re-create so we hold the token (the earlier order response token)
await t('approving the verified payment issues exactly one certificate', async () => {
  const att = (await start()).data; await finish(att, allRight()); const cr = await buy(att, { certificate_name: 'Ali Raza', email: 'ali@example.com' }); assert.equal(cr.status, 201); const ref = cr.data.order.ref, tok = cr.data.token;
  const f = new FormData(); f.append('file', new Blob([new Uint8Array([0x89, 0x50, 0x4E, 0x47, 1, 2, 3, 4, 5, 6])]), 'r.png'); f.append('txn_reference', 'CERT-TXN-2'); await call(env, 'POST', '/api/orders/' + ref + '/receipt', { headers: { 'X-Order-Token': tok }, form: f });
  const d = await call(env, 'GET', '/api/admin/orders/' + ref, A()); const pid = d.data.payments[0].id;
  const ap = await call(env, 'POST', '/api/admin/payments/' + pid + '/approve', { ...A({ json: { amount_received_minor: 99900 } }) }); assert.equal(ap.status, 200);
  const s = await call(env, 'GET', '/api/orders/' + ref, { headers: { 'X-Order-Token': tok } }); assert.equal(s.data.order.status, 'paid'); cert2 = s.data.order.certificate_id; assert.match(cert2, /^GMC-[0-9A-Z]{10}$/);
  assert.equal(raw.prepare('SELECT COUNT(*) c FROM certificates WHERE attempt_id=?').get(att.attempt_id).c, 1);
});
await t('public verification returns the certificate details and valid status', async () => { const r = await call(env, 'GET', '/api/certificates/' + cert2); assert.equal(r.status, 200); assert.equal(r.data.name, 'Ali Raza'); assert.equal(r.data.pct, 100); assert.equal(r.data.valid, true); assert.match(r.data.notice, /not a clinical IQ/); assert.equal(r.data.email, undefined); });
await t('unknown or malformed certificate IDs return 404', async () => { assert.equal((await call(env, 'GET', '/api/certificates/GMC-0000000000')).status, 404); assert.equal((await call(env, 'GET', '/api/certificates/abc')).status, 404); });
await t('owner can revoke a certificate and verification then shows it invalid', async () => { const r = await call(env, 'POST', '/api/admin/certificates/' + cert2 + '/revoke', { ...A({ json: { note: 'test' } }) }); assert.equal(r.status, 200); const v = await call(env, 'GET', '/api/certificates/' + cert2); assert.equal(v.data.valid, false); assert.equal(v.data.status, 'revoked'); });
await t('webhook payment also issues a certificate (idempotently)', async () => {
  const e2 = makeEnv({ GATEWAY_WEBHOOK_SECRET: 'whsec-test' }); makeSeed(e2);
  const a = (await start(e2)).data; await finish(a, allRight(), e2); const cr = await call(e2, 'POST', '/api/orders', { json: { product_id: 'reasoning-certificate', method: 'bank_transfer', name: 'Hina', email: 'h@example.com', accept_terms: true, attempt_id: a.attempt_id, attempt_token: a.token } }); assert.equal(cr.status, 201);
  const body = JSON.stringify({ event_id: 'evt-cert-1', type: 'payment.succeeded', order_ref: cr.data.order.ref, amount_minor: 99900, currency: 'PKR', provider_ref: 'P-77' });
  const k = await crypto.subtle.importKey('raw', enc.encode('whsec-test'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); const sig = hex(await crypto.subtle.sign('HMAC', k, enc.encode(body)));
  const w = await call(e2, 'POST', '/api/webhooks/gateway', { raw: body, headers: { 'X-Signature': sig } }); assert.equal(w.data.outcome, 'paid'); await call(e2, 'POST', '/api/webhooks/gateway', { raw: body, headers: { 'X-Signature': sig } });
  assert.equal(e2.DB._raw.prepare('SELECT COUNT(*) c FROM certificates').get().c, 1);
});
function makeSeed(e) { bank.keys.forEach((k, i) => e.DB._raw.prepare('INSERT INTO quiz_keys(qid,level,correct) VALUES(?,?,?)').run('c' + (i + 1), LEVEL_SPEC_CERTIFIED[i], k)); for (const [k, v] of Object.entries({ bank_name: 'TEST BANK', account_title: 'TEST', account_number: '1' })) e.DB._raw.prepare("INSERT INTO settings(key,value,updated_at) VALUES(?,?,?)").run(k, v, NOW()); e.DB._raw.prepare("UPDATE products SET active=1, price_minor=99900 WHERE id='reasoning-certificate'").run(); }
await t('a certificate order with a 100% coupon is issued immediately and the certificate is free of charge', async () => { raw.prepare("INSERT INTO coupons(code,percent_off,active,created_at) VALUES('FREECERT',100,1,?)").run(NOW()); const a = (await start()).data; await finish(a, allRight()); const r = await buy(a, { coupon: 'FREECERT', certificate_name: 'Free User' }); assert.equal(r.data.order.status, 'paid'); assert.equal(raw.prepare('SELECT COUNT(*) c FROM certificates WHERE attempt_id=?').get(a.attempt_id).c, 1); });
await t('quiz start is rate limited per IP', async () => { let last; for (let i = 0; i < 8; i++) last = await call(env, 'POST', '/api/quiz/start', { ip: '7.7.7.7', json: {} }); assert.equal(last.status, 429); });

const failed = results.filter(r => !r[1]); console.log('\n' + (results.length - failed.length) + ' passed, ' + failed.length + ' failed of ' + results.length); process.exit(failed.length ? 1 : 0);
