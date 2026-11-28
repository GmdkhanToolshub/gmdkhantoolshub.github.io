// Security and journey tests for Free + Premium membership. Runs the real Worker code against SQLite; email sending is captured.
import assert from 'node:assert/strict';
import { makeEnv, call, cookieFrom } from './harness.mjs';

const mail = [];
globalThis.fetch = async (url, o) => { if (!String(url).startsWith('https://api.resend.com/')) throw new Error('unexpected network call ' + url); mail.push(JSON.parse(o.body)); return new Response('{}', { status: 200 }); };
const ORIGIN = 'https://gmtoolshub.com';
const env = makeEnv({ RESEND_API_KEY: 'test-key', MAIL_FROM: 'GM <no-reply@example.test>', ADMIN_NOTIFY_EMAIL: 'owner@example.test', SITE_URL: ORIGIN });
const lastMail = to => [...mail].reverse().find(m => m.to[0] === to);
const tokenIn = m => (m.text.match(/#t=([A-Za-z0-9_-]+)/) || [])[1];
const post = (path, json, headers = {}) => call(env, 'POST', path, { json, headers: { Origin: ORIGIN, ...headers } });
const get = (path, headers = {}) => call(env, 'GET', path, { headers });
const sql = s => env.DB._raw.prepare(s);

let passed = 0, failed = 0;
async function test(name, fn) { try { await fn(); passed++; console.log('  PASS ' + name); } catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message.split('\n').slice(0, 3).join(' ')); } }

const EMAIL = 'ayesha@example.test', PASS = 'correct-horse-battery-9';
let admin, userCookie, userCsrf, userId;

await call(env, 'POST', '/api/admin/setup', { json: { token: 'test-setup-token-123456', email: 'owner@example.test', password: 'owner-password-123456' } });
const al = await post('/api/admin/login', { email: 'owner@example.test', password: 'owner-password-123456' });
admin = { Cookie: cookieFrom(al), 'X-CSRF-Token': al.data.csrf };
const signIn = async (email = EMAIL, password = PASS) => { const r = await post('/api/auth/login', { email, password }); if (r.status === 200) { userCookie = cookieFrom(r); userCsrf = r.data.csrf; } return r; };
const mine = () => ({ Cookie: userCookie, 'X-CSRF-Token': userCsrf });
const decide = (action, body = {}, headers = admin) => post('/api/admin/users/' + userId + '/' + action, body, headers);
const access = async () => (await get('/api/premium/access/bi-studio', { Cookie: userCookie })).status;

await test('sign up needs terms, a valid email and a strong password', async () => {
  assert.equal((await post('/api/auth/register', { name: 'Ayesha', email: EMAIL, password: PASS })).status, 400);
  assert.equal((await post('/api/auth/register', { name: 'Ayesha', email: 'nope', password: PASS, accept_terms: true })).status, 400);
  for (const password of ['short', 'aaaaaaaaaaaa', 'password12345', EMAIL]) assert.equal((await post('/api/auth/register', { name: 'Ayesha', email: EMAIL, password, accept_terms: true })).data.error.code, 'weak_password');
  assert.equal((await post('/api/auth/register', { name: 'visit http://spam.test', email: EMAIL, password: PASS, accept_terms: true })).data.error.code, 'invalid_name');
});
await test('sign up stores a salted hash, never the password, and emails a verification link but not the password', async () => {
  const r = await post('/api/auth/register', { name: 'Ayesha Khan', email: EMAIL.toUpperCase(), password: PASS, accept_terms: true });
  assert.equal(r.status, 202);
  const u = sql('SELECT * FROM users WHERE email=?').get(EMAIL); userId = u.id;
  assert.equal(u.status, 'unverified'); assert.equal(u.pass_hash.length, 64); assert.ok(u.salt.length >= 16);
  assert.ok(!JSON.stringify(u).includes(PASS));
  assert.ok(tokenIn(lastMail(EMAIL))); assert.ok(!mail.some(m => m.text.includes(PASS)));
  assert.ok(!sql('SELECT token_hash FROM user_tokens').all().some(t => t.token_hash === tokenIn(lastMail(EMAIL))), 'raw link token must not be stored');
});
await test('unverified accounts cannot sign in and the owner is not asked to approve them yet', async () => {
  assert.equal((await signIn()).data.error.code, 'email_not_verified');
  assert.ok(!lastMail('owner@example.test'));
});
await test('the owner cannot approve an unverified account', async () => {
  assert.equal((await decide('approve', { plan: 'lifetime' })).data.error.code, 'email_not_verified');
});
await test('registering an existing address gives the same reply (no account discovery)', async () => {
  const first = await post('/api/auth/register', { name: 'New Person', email: 'new@example.test', password: PASS, accept_terms: true });
  const verifyToken = tokenIn(lastMail('new@example.test'));
  await post('/api/auth/verify', { token: verifyToken, password: PASS });
  const again = await post('/api/auth/register', { name: 'Attacker', email: 'new@example.test', password: 'another-password-77', accept_terms: true });
  assert.deepEqual(again.data, first.data); assert.equal(again.status, first.status);
  assert.equal((await post('/api/auth/login', { email: 'new@example.test', password: 'another-password-77' })).status, 401, 'password must not be replaced');
  const a = await post('/api/auth/forgot', { email: 'new@example.test' }), b = await post('/api/auth/forgot', { email: 'nobody@example.test' });
  assert.deepEqual(a.data, b.data);
});
await test('verification works once, emails the owner, and the email link alone approves nothing', async () => {
  await post('/api/auth/resend', { email: EMAIL });
  const t = tokenIn(lastMail(EMAIL));
  assert.equal((await get('/api/auth/verify?token=' + t)).status, 404, 'a GET (email scanner) must do nothing');
  assert.equal((await post('/api/auth/verify', { token: t })).status, 400, 'the link alone is not enough');
  assert.equal((await post('/api/auth/verify', { token: t, password: PASS })).status, 200);
  assert.equal((await post('/api/auth/verify', { token: t, password: PASS })).status, 410);
  const note = lastMail('owner@example.test');
  assert.ok(note.text.includes(EMAIL) && note.text.includes('/admin-members/')); assert.ok(!/#t=/.test(note.text));
  assert.equal(sql('SELECT status FROM users WHERE id=?').get(userId).status, 'pending');
});
await test('someone who signs up with your address cannot take over the account', async () => {
  const victim = 'victim@example.test', mineP = 'my-own-password-123', theirs = 'attacker-password-123';
  await post('/api/auth/register', { name: 'Victim', email: victim, password: mineP, accept_terms: true });
  await post('/api/auth/register', { name: 'Victim', email: victim, password: theirs, accept_terms: true });
  const link = tokenIn(lastMail(victim));
  assert.equal((await post('/api/auth/verify', { token: link, password: mineP })).data.error.code, 'wrong_password');
  assert.equal(sql('SELECT status FROM users WHERE email=?').get(victim).status, 'unverified');
  await post('/api/auth/forgot', { email: victim });
  assert.equal((await post('/api/auth/reset', { token: tokenIn(lastMail(victim)), password: mineP })).status, 200);
  assert.equal(sql('SELECT status FROM users WHERE email=?').get(victim).status, 'pending');
  assert.equal((await post('/api/auth/login', { email: victim, password: theirs })).status, 401);
  assert.equal((await post('/api/auth/login', { email: victim, password: mineP })).data.user.premium, false);
});
await test('a pending member can sign in to see their status but gets no Premium access anywhere', async () => {
  const r = await signIn(); assert.equal(r.status, 200); assert.equal(r.data.user.premium, false); assert.equal(r.data.user.status, 'pending');
  assert.match(r.headers.get('Set-Cookie'), /HttpOnly; Secure; SameSite=/);
  assert.equal(await access(), 403);
  assert.equal((await get('/api/premium/content/report-packs', { Cookie: userCookie })).status, 403);
  assert.equal((await get('/api/premium/data/workspace', { Cookie: userCookie })).status, 403);
  assert.equal((await call(env, 'PUT', '/api/premium/data/workspace', { json: { value: { a: 1 } }, headers: { Origin: ORIGIN, ...mine() } })).status, 403);
});
await test('signed-out and forged requests are refused', async () => {
  for (const p of ['/api/auth/me', '/api/premium/access/bi-studio', '/api/premium/content/report-packs', '/api/premium/data/workspace']) assert.equal((await get(p)).status, 401, p);
  assert.equal((await get('/api/premium/access/bi-studio', { Cookie: 'gm_user=forged-token-value' })).status, 401);
});
await test('a member session cannot use the admin API, and admin actions need the CSRF token and an allowed origin', async () => {
  assert.equal((await get('/api/admin/users', { Cookie: userCookie })).status, 401);
  assert.equal((await decide('approve', { plan: 'lifetime' }, { Cookie: userCookie, 'X-CSRF-Token': userCsrf })).status, 401);
  assert.equal((await decide('approve', { plan: 'lifetime' }, { Cookie: admin.Cookie })).status, 403);
  assert.equal((await call(env, 'POST', '/api/admin/users/' + userId + '/approve', { json: { plan: 'lifetime' }, headers: { ...admin, Origin: 'https://evil.test' } })).status, 403);
});
await test('only the owner role can manage members', async () => {
  sql("UPDATE admins SET role='finance'").run();
  assert.equal((await get('/api/admin/users', admin)).status, 403);
  assert.equal((await decide('approve', { plan: 'lifetime' })).status, 403);
  sql("UPDATE admins SET role='owner'").run();
});
await test('approval needs a plan, sends an activation email and turns Premium on', async () => {
  assert.equal((await decide('approve')).data.error.code, 'invalid_plan');
  const r = await decide('approve', { plan: 'lifetime' });
  assert.equal(r.status, 200); assert.equal(r.data.user.status, 'approved'); assert.equal(r.data.user.access_expires_at, null);
  assert.match(lastMail(EMAIL).subject, /Premium access is active/); assert.ok(!lastMail(EMAIL).text.includes(PASS));
  assert.equal(await access(), 200);
  assert.equal((await decide('approve', { plan: 'lifetime' })).status, 409);
});
await test('monthly, annual and custom durations set the right end date; bad dates are refused', async () => {
  const days = u => Math.round((Date.parse(u) - Date.now()) / 86400000);
  const m = (await decide('access', { plan: 'monthly' })).data.user, y = (await decide('access', { plan: 'annual' })).data.user;
  assert.ok(days(m.access_expires_at) >= 28 && days(m.access_expires_at) <= 31); assert.ok(days(y.access_expires_at) >= 365 && days(y.access_expires_at) <= 366);
  const end = new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10);
  assert.equal((await decide('access', { plan: 'custom', ends_on: end })).data.user.access_expires_at.slice(0, 10), end);
  for (const ends_on of ['2020-01-01', '2027-02-30', 'tomorrow', '']) assert.equal((await decide('access', { plan: 'custom', ends_on })).status, 400, ends_on);
});
await test('expired access stops working immediately, with no cron needed', async () => {
  sql('UPDATE users SET access_expires_at=? WHERE id=?').run(new Date(Date.now() - 1000).toISOString(), userId);
  assert.equal(await access(), 403);
  assert.equal((await get('/api/auth/me', { Cookie: userCookie })).data.user.status, 'expired');
  await decide('access', { plan: 'lifetime' }); assert.equal(await access(), 200);
});
await test('cloud backup works for approved members, keeps users apart and rejects unknown keys, big bodies and missing CSRF', async () => {
  const put = (key, value, headers = mine()) => call(env, 'PUT', '/api/premium/data/' + key, { json: { value }, headers: { Origin: ORIGIN, ...headers } });
  assert.equal((await put('workspace', { notes: 'mine' })).status, 200);
  assert.equal((await get('/api/premium/data/workspace', { Cookie: userCookie })).data.value.notes, 'mine');
  assert.equal((await put('workspace', { notes: 'x' }, { Cookie: userCookie })).status, 403);
  assert.equal((await put('other', { a: 1 })).status, 404);
  assert.equal((await put('workspace', { big: 'x'.repeat(310000) })).status, 413);
  assert.equal(sql('SELECT COUNT(*) c FROM user_data').get().c, 1);
});
await test('suspend, reactivate and revoke take effect at once and end open sessions', async () => {
  assert.equal((await decide('suspend')).status, 200); assert.equal(await access(), 401);
  await signIn(); assert.equal(await access(), 403);
  assert.equal((await decide('reactivate')).status, 200); assert.equal(await access(), 200);
  assert.equal((await decide('revoke')).status, 200); assert.equal(await access(), 401);
  await signIn(); assert.equal(await access(), 403);
  assert.equal((await decide('reactivate')).status, 409);
  await decide('access', { plan: 'lifetime' }); assert.equal(await access(), 200);
});
await test('the owner changes Free, Premium and Admin tiers without code changes', async () => {
  const set = tier => call(env, 'PUT', '/api/admin/features/bi-studio', { json: { tier }, headers: { Origin: ORIGIN, ...admin } });
  assert.equal((await get('/api/features')).data.features.find(f => f.id === 'bi-studio').tier, 'premium');
  await decide('suspend'); await signIn(); assert.equal(await access(), 403);
  assert.equal((await set('free')).status, 200); assert.equal(await access(), 200);
  assert.equal((await set('admin')).status, 200); assert.equal(await access(), 403);
  assert.ok(!(await get('/api/features')).data.features.some(f => f.id === 'bi-studio'));
  assert.equal((await set('gold')).status, 400);
  await set('premium'); await decide('reactivate');
});
await test('private Premium content is returned only to approved members', async () => {
  assert.equal((await post('/api/admin/content/report-packs', { title: 'Test pack', body: 'secret premium body' }, admin)).status, 201);
  await signIn();
  assert.equal((await get('/api/premium/content/report-packs', { Cookie: userCookie })).data.items[0].body, 'secret premium body');
  assert.ok(!(await get('/api/features')).text.includes('secret premium body'));
  assert.ok(!(await get('/api/premium/content/report-packs')).text.includes('secret premium body'));
});
await test('forgot password: single-use link, old sessions end, old password stops working', async () => {
  await post('/api/auth/forgot', { email: EMAIL });
  const t = tokenIn(lastMail(EMAIL)); assert.match(lastMail(EMAIL).text, /\/account\/reset\/#t=/);
  assert.equal((await post('/api/auth/reset', { token: t, password: 'short' })).status, 400);
  assert.equal((await post('/api/auth/verify', { token: t, password: PASS })).status, 410, 'a reset link cannot be used to verify');
  assert.equal((await post('/api/auth/reset', { token: t, password: 'a-brand-new-pass-55' })).status, 200);
  assert.equal((await post('/api/auth/reset', { token: t, password: 'a-brand-new-pass-66' })).status, 410);
  assert.equal(await access(), 401);
  assert.equal((await signIn(EMAIL, PASS)).status, 401);
  assert.equal((await signIn(EMAIL, 'a-brand-new-pass-55')).status, 200);
});
await test('expired email links are refused', async () => {
  await post('/api/auth/forgot', { email: EMAIL });
  sql("UPDATE user_tokens SET expires_at='2020-01-01T00:00:00.000Z' WHERE used_at IS NULL").run();
  assert.equal((await post('/api/auth/reset', { token: tokenIn(lastMail(EMAIL)), password: 'a-brand-new-pass-77' })).status, 410);
});
await test('five wrong passwords lock the account, even for the right password', async () => {
  for (let i = 0; i < 5; i++) assert.equal((await signIn(EMAIL, 'wrong-password-' + i)).status, 401);
  assert.equal((await signIn(EMAIL, 'a-brand-new-pass-55')).data.error.code, 'locked');
});
await test('sign up is rate limited per address and closed when email is not configured', async () => {
  let last; for (let i = 0; i < 7; i++) last = await call(env, 'POST', '/api/auth/register', { ip: '9.9.9.9', json: { name: 'Flood', email: 'f' + i + '@example.test', password: PASS, accept_terms: true } });
  assert.equal(last.status, 429);
  const quiet = makeEnv();
  assert.equal((await call(quiet, 'POST', '/api/auth/register', { json: { name: 'Ayesha', email: EMAIL, password: PASS, accept_terms: true } })).data.error.code, 'email_not_ready');
});
await test('the owner sees users, counts and history; no hashes or secrets are returned', async () => {
  const list = await get('/api/admin/users?q=ayesha', admin); assert.equal(list.data.total, 1); assert.ok(list.data.counts.approved >= 1);
  const one = await get('/api/admin/users/' + userId, admin);
  const actions = one.data.history.map(h => h.action);
  for (const a of ['registered', 'email.verified', 'login', 'login.failed', 'admin.approve', 'admin.revoke', 'password.reset']) assert.ok(actions.includes(a), a);
  assert.ok(!/pass_hash|salt|token_hash|csrf/.test(list.text + one.text));
});
await test('rejection keeps Premium off and tells the user', async () => {
  await post('/api/auth/register', { name: 'Bilal', email: 'bilal@example.test', password: PASS, accept_terms: true });
  await post('/api/auth/verify', { token: tokenIn(lastMail('bilal@example.test')), password: PASS });
  const id = sql('SELECT id FROM users WHERE email=?').get('bilal@example.test').id;
  assert.equal((await post('/api/admin/users/' + id + '/reject', {}, admin)).data.user.status, 'rejected');
  assert.match(lastMail('bilal@example.test').text, /not approved/);
  await signIn('bilal@example.test'); assert.equal(await access(), 403);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed of ' + (passed + failed));
process.exit(failed ? 1 : 0);
