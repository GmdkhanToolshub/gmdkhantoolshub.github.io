// GM Tools Hub payments API (Cloudflare Worker + D1 + R2). No secrets in this file: set them with `wrangler secret put` (see ../README.md).
// What is real here: orders with server-side pricing, coupons, bank-transfer instructions from admin settings, receipt upload, manual approval,
// admin accounts with roles, CSRF, audit log, CSV export, signed-webhook endpoint with idempotency. What is NOT here: a specific card or wallet
// provider (needs your merchant account), see README "Gateway and wallet".
const enc = new TextEncoder();
const VERSION = '0.1.0';
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const rand = (n = 24) => b64u(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const now = () => new Date().toISOString();
function same(a, b) { a = String(a); b = String(b); if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
async function hmacHex(secret, body) { const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return hex(await crypto.subtle.sign('HMAC', k, enc.encode(body))); }
async function pbkdf2(pw, salt) { const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']); return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, k, 256)); }
class HttpError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
const bad = (code, msg, status = 400) => new HttpError(status, code, msg);

const SETTING_KEYS = { bank_name: 80, account_title: 80, account_number: 40, iban: 40, branch: 80, wallet_details: 200, support_email: 120, order_expiry_hours: 6, enabled_methods: 80 };
const SECURE_HEADERS = { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'", 'Strict-Transport-Security': 'max-age=31536000' };
const origins = env => String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
function corsHeaders(req, env) { const o = req.headers.get('Origin'); const h = { Vary: 'Origin' }; if (o && origins(env).includes(o)) { h['Access-Control-Allow-Origin'] = o; h['Access-Control-Allow-Credentials'] = 'true'; h['Access-Control-Allow-Headers'] = 'Content-Type, X-Order-Token, X-CSRF-Token'; h['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'; h['Access-Control-Max-Age'] = '600'; } return h; }
function out(data, status, req, env, extra = {}) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...SECURE_HEADERS, ...corsHeaders(req, env), ...extra } }); }

async function json(req, max = 16384) { const t = await req.text(); if (t.length > max) throw bad('too_large', 'Request body is too large.', 413); try { const o = JSON.parse(t || '{}'); if (!o || typeof o !== 'object' || Array.isArray(o)) throw 0; return o; } catch (e) { throw bad('bad_json', 'Send a JSON object.'); } }
const str = (v, min, max, field) => { v = typeof v === 'string' ? v.trim() : ''; if (v.length < min || v.length > max) throw bad('invalid_' + field, 'Please check ' + field.replace('_', ' ') + '.'); return v; };
const optStr = (v, max, field) => { v = typeof v === 'string' ? v.trim() : ''; if (v.length > max) throw bad('invalid_' + field, 'Please check ' + field + '.'); return v; };
const intIn = (v, lo, hi, field) => { const n = Number(v); if (!Number.isInteger(n) || n < lo || n > hi) throw bad('invalid_' + field, 'Please check ' + field.replace('_', ' ') + '.'); return n; };

async function rateLimit(env, req, name, limit, windowSec = 60) {
  const ip = req.headers.get('CF-Connecting-IP') || 'local', w = Math.floor(Date.now() / (windowSec * 1000));
  const r = await env.DB.prepare('INSERT INTO rate_limits(key,window_start,count) VALUES(?,?,1) ON CONFLICT(key,window_start) DO UPDATE SET count=count+1 RETURNING count').bind(name + ':' + ip, w).first();
  if (Math.random() < 0.02) await env.DB.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(w - 120).run();
  if (r && r.count > limit) throw bad('rate_limited', 'Too many requests. Please wait a minute and try again.', 429);
}
async function setting(env, key, dflt = '') { const r = await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind(key).first(); return r ? r.value : dflt; }
async function allSettings(env) { const rs = await env.DB.prepare('SELECT key,value FROM settings').all(); const o = {}; for (const r of rs.results) o[r.key] = r.value; return o; }
async function audit(env, adminId, action, entity, entityId, detail) { await env.DB.prepare('INSERT INTO audit_log(at,admin_id,action,entity,entity_id,detail) VALUES(?,?,?,?,?,?)').bind(now(), adminId || null, action, entity, entityId || null, detail ? String(detail).slice(0, 500) : null).run(); }
function enabledMethods(s, env) { let m = []; try { m = JSON.parse(s.enabled_methods || '["bank_transfer"]'); } catch (e) { m = ['bank_transfer']; } return m.filter(x => x === 'bank_transfer' || (x === 'card' && env.GATEWAY_API_KEY) || (x === 'wallet' && env.WALLET_API_KEY)); }
const bankReady = s => !!(s.bank_name && s.account_title && (s.account_number || s.iban));
function bankInstructions(s) { return { bank_name: s.bank_name, account_title: s.account_title, account_number: s.account_number || '', iban: s.iban || '', branch: s.branch || '', wallet_details: s.wallet_details || '', support_email: s.support_email || '' }; }
function addPeriod(iso, kind, days = 0) { const d = new Date(iso); if (days) d.setUTCDate(d.getUTCDate() + days); else if (kind === 'monthly') d.setUTCMonth(d.getUTCMonth() + 1); else if (kind === 'annual') d.setUTCFullYear(d.getUTCFullYear() + 1); else return null; return d.toISOString(); }
const REF_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newRef() { const b = crypto.getRandomValues(new Uint8Array(8)); return 'GM-' + [...b].map(x => REF_CHARS[x % REF_CHARS.length]).join(''); }

async function priceFor(env, product, code) {
  const list = product.price_minor; let discount = 0, couponCode = null;
  if (code) {
    code = String(code).trim().toUpperCase();
    if (!/^[A-Z0-9_-]{2,30}$/.test(code)) throw bad('invalid_coupon', 'That code is not valid.');
    const c = await env.DB.prepare('SELECT * FROM coupons WHERE code=?').bind(code).first(); const t = now();
    if (!c || !c.active || (c.valid_from && t < c.valid_from) || (c.valid_until && t > c.valid_until) || (c.max_uses != null && c.used_count >= c.max_uses) || (c.applies_to && c.applies_to !== product.id)) throw bad('invalid_coupon', 'That code is not valid for this product.');
    discount = c.percent_off ? Math.floor(list * c.percent_off / 100) : Math.min(c.amount_off_minor || 0, list); couponCode = code;
  }
  let total = Math.max(0, list - discount); const recurring = product.kind === 'one_time' ? 0 : product.price_minor;
  const trial = product.kind !== 'one_time' && product.trial_days > 0; if (trial) total = 0;
  return { list, discount, total, recurring, trial, couponCode };
}
const publicOrder = (o, pays, s, withInstr) => ({ ref: o.ref, status: o.status, product: o.product_name, kind: o.kind, currency: o.currency, list_minor: o.list_minor, discount_minor: o.discount_minor, total_minor: o.total_minor, recurring_minor: o.recurring_minor, trial_days: o.trial_days, coupon: o.coupon_code, method: o.method, created_at: o.created_at, expires_at: o.expires_at, paid_at: o.paid_at, renews_at: o.renews_at, refunded_minor: o.refunded_minor, payments: (pays || []).map(p => ({ status: p.status, txn_reference: p.txn_reference, created_at: p.created_at, note: p.status === 'rejected' ? p.decision_note : null })), instructions: withInstr && o.method === 'bank_transfer' && ['pending_payment', 'awaiting_verification'].includes(o.status) ? bankInstructions(s) : null });
async function expireIfNeeded(env, o) { if (o && o.status === 'pending_payment' && o.expires_at < now()) { await env.DB.prepare("UPDATE orders SET status='expired' WHERE id=? AND status='pending_payment'").bind(o.id).run(); o.status = 'expired'; } return o; }
async function loadOrderByToken(env, req, ref) {
  if (!/^GM-[A-Z0-9]{8}$/.test(ref)) throw bad('not_found', 'Order not found.', 404);
  const tok = req.headers.get('X-Order-Token') || ''; const o = await env.DB.prepare('SELECT * FROM orders WHERE ref=?').bind(ref).first();
  if (!o || !tok || !same(await sha256(tok), o.token_hash)) throw bad('not_found', 'Order not found.', 404);
  return expireIfNeeded(env, o);
}
function notify(ctx, env, to, subject, text) { if (!env.RESEND_API_KEY || !env.MAIL_FROM || !to) return; ctx.waitUntil(fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, text }) }).catch(() => { })); }
const money = (m, c) => c + ' ' + (m / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------- public handlers
async function createOrder(req, env, ctx) {
  await rateLimit(env, req, 'order', 10); const b = await json(req); const s = await allSettings(env);
  const name = str(b.name, 2, 80, 'name'), email = str(b.email, 5, 120, 'email'); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw bad('invalid_email', 'Please enter a valid email address.');
  const phone = optStr(b.phone, 20, 'phone'); if (phone && !/^[0-9+\-\s()]{6,20}$/.test(phone)) throw bad('invalid_phone', 'Please check the phone number.');
  if (b.accept_terms !== true) throw bad('terms_required', 'Please accept the terms and refund policy to continue.');
  const method = str(b.method, 3, 20, 'method'); if (!enabledMethods(s, env).includes(method)) throw bad('method_unavailable', 'That payment method is not available yet.', 503);
  const p = await env.DB.prepare('SELECT * FROM products WHERE id=? AND active=1').bind(str(b.product_id, 1, 60, 'product')).first(); if (!p) throw bad('product_not_found', 'That product is not available.', 404);
  const price = await priceFor(env, p, b.coupon);
  if (p.kind !== 'one_time' && b.accept_recurring !== true) throw bad('recurring_consent_required', 'Please confirm you understand how this plan renews.');
  if (method === 'bank_transfer' && price.total > 0 && !bankReady(s)) throw bad('payment_details_not_configured', 'Bank details have not been set up yet. Please contact support.', 503);
  const t = now(), expiresH = Math.min(168, Math.max(1, parseInt(s.order_expiry_hours || '48', 10) || 48)), id = rand(12), ref = newRef(), token = rand(24);
  const free = price.total === 0, status = free ? 'paid' : 'pending_payment', paidAt = free ? t : null;
  const renews = free ? addPeriod(t, p.kind, price.trial ? p.trial_days : 0) : null;
  const expires = new Date(Date.now() + expiresH * 3600000).toISOString();
  await env.DB.prepare('INSERT INTO orders(id,ref,token_hash,product_id,product_name,kind,currency,list_minor,discount_minor,total_minor,recurring_minor,trial_days,coupon_code,customer_name,customer_email,customer_phone,method,status,created_at,expires_at,paid_at,renews_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id, ref, await sha256(token), p.id, p.name, p.kind, p.currency, price.list, price.discount, price.total, price.recurring, price.trial ? p.trial_days : 0, price.couponCode, name, email.toLowerCase(), phone, free ? 'free' : method, status, t, expires, paidAt, renews).run();
  if (free && price.couponCode) await env.DB.prepare('UPDATE coupons SET used_count=used_count+1 WHERE code=?').bind(price.couponCode).run();
  await audit(env, null, 'order.create', 'order', ref, p.id + ' ' + money(price.total, p.currency));
  const o = await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first();
  notify(ctx, env, email, 'Your GM Tools Hub order ' + ref, 'Order ' + ref + ' for ' + p.name + '. Total: ' + money(price.total, p.currency) + '. Track it on the status page you were shown.');
  return { order: publicOrder(o, [], s, true), token };
}
async function uploadReceipt(req, env, ref) {
  await rateLimit(env, req, 'receipt', 8); const o = await loadOrderByToken(env, req, ref);
  if (o.method !== 'bank_transfer') throw bad('wrong_method', 'This order does not use bank transfer.', 409);
  if (!['pending_payment', 'awaiting_verification'].includes(o.status)) throw bad('order_closed', 'This order can no longer accept a receipt (status: ' + o.status + ').', 409);
  const n = await env.DB.prepare("SELECT COUNT(*) c FROM payments WHERE order_id=? AND status IN ('submitted','rejected')").bind(o.id).first(); if (n.c >= 5) throw bad('too_many_receipts', 'Too many receipts submitted for this order. Please contact support.', 429);
  let form; try { form = await req.formData(); } catch (e) { throw bad('bad_form', 'Send the receipt as a form upload.'); }
  const file = form.get('file'); if (!file || typeof file === 'string' || !file.size) throw bad('file_required', 'Please choose a receipt file.');
  if (file.size > 3000000) throw bad('file_too_large', 'The receipt must be 3 MB or smaller.', 413);
  const buf = new Uint8Array(await file.arrayBuffer()); let mime = null;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) mime = 'image/jpeg'; else if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) mime = 'image/png'; else if (String.fromCharCode(...buf.slice(0, 4)) === 'RIFF' && String.fromCharCode(...buf.slice(8, 12)) === 'WEBP') mime = 'image/webp'; else if (String.fromCharCode(...buf.slice(0, 5)) === '%PDF-') mime = 'application/pdf';
  if (!mime) throw bad('file_type', 'Only JPG, PNG, WEBP or PDF receipts are accepted.', 415);
  const txn = optStr(form.get('txn_reference'), 64, 'txn_reference'); if (txn && !/^[A-Za-z0-9 _/.:-]{3,64}$/.test(txn)) throw bad('invalid_txn_reference', 'The transaction reference has unusual characters.');
  if (!txn) throw bad('txn_required', 'Please enter the transaction or reference number from your bank.');
  const payer = optStr(form.get('payer_name'), 80, 'payer_name'); const key = 'receipts/' + o.id + '/' + rand(12);
  await env.RECEIPTS.put(key, buf, { httpMetadata: { contentType: mime } });
  const pid = rand(12); await env.DB.batch([
    env.DB.prepare("INSERT INTO payments(id,order_id,method,provider,amount_minor,currency,status,txn_reference,payer_name,receipt_key,receipt_mime,receipt_size,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(pid, o.id, 'bank_transfer', 'manual', o.total_minor, o.currency, 'submitted', txn, payer, key, mime, buf.length, now()),
    env.DB.prepare("UPDATE orders SET status='awaiting_verification' WHERE id=? AND status IN ('pending_payment','awaiting_verification')").bind(o.id)]);
  await audit(env, null, 'receipt.upload', 'order', o.ref, mime + ' ' + buf.length);
  const fresh = await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(o.id).first(), pays = await env.DB.prepare('SELECT * FROM payments WHERE order_id=? ORDER BY created_at').bind(o.id).all();
  return { order: publicOrder(fresh, pays.results, await allSettings(env), true), message: 'Receipt received. Your order is NOT paid until we verify the payment.' };
}
async function webhook(req, env) {
  const secret = env.GATEWAY_WEBHOOK_SECRET; if (!secret) throw bad('not_configured', 'No payment gateway is configured on this server.', 503);
  const raw = await req.text(); if (raw.length > 20000) throw bad('too_large', 'Body too large.', 413);
  const sig = (req.headers.get('X-Signature') || '').toLowerCase(); if (!sig || !same(sig, await hmacHex(secret, raw))) throw bad('bad_signature', 'Signature check failed.', 401);
  let e; try { e = JSON.parse(raw); } catch (x) { throw bad('bad_json', 'Invalid JSON.'); }
  const eventId = String(e.event_id || ''), type = String(e.type || ''), ref = String(e.order_ref || ''), prov = String(env.GATEWAY_NAME || 'gateway').slice(0, 30);
  if (!/^[A-Za-z0-9_.:-]{3,80}$/.test(eventId) || !['payment.succeeded', 'payment.failed'].includes(type)) throw bad('bad_event', 'Unsupported event.');
  const ins = await env.DB.prepare('INSERT OR IGNORE INTO webhook_events(provider,event_id,received_at,outcome) VALUES(?,?,?,?)').bind(prov, eventId, now(), 'received').run();
  if (!ins.meta.changes) return { ok: true, duplicate: true };
  const done = async (outcome) => { await env.DB.prepare('UPDATE webhook_events SET outcome=? WHERE provider=? AND event_id=?').bind(outcome, prov, eventId).run(); await audit(env, null, 'webhook.' + type, 'order', ref, outcome); return { ok: true, outcome }; };
  const o = await env.DB.prepare('SELECT * FROM orders WHERE ref=?').bind(ref).first(); if (!o) return done('unknown_order');
  const providerRef = String(e.provider_ref || eventId).slice(0, 80);
  if (type === 'payment.failed') { await env.DB.prepare("INSERT OR IGNORE INTO payments(id,order_id,method,provider,provider_ref,amount_minor,currency,status,created_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(rand(12), o.id, o.method, prov, providerRef, o.total_minor, o.currency, 'failed', now()).run(); return done('failed_recorded'); }
  if (o.status === 'paid') return done('already_paid');
  if (!Number.isInteger(e.amount_minor) || e.amount_minor !== o.total_minor || String(e.currency || '') !== o.currency) { await env.DB.prepare("INSERT OR IGNORE INTO payments(id,order_id,method,provider,provider_ref,amount_minor,currency,status,decision_note,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(rand(12), o.id, o.method, prov, providerRef, Number(e.amount_minor) || 0, String(e.currency || '').slice(0, 5), 'failed', 'Amount or currency did not match the order total', now()).run(); return done('amount_mismatch'); }
  const t = now(); await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO payments(id,order_id,method,provider,provider_ref,amount_minor,currency,status,decided_at,decided_by,decision_note,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").bind(rand(12), o.id, o.method, prov, providerRef, o.total_minor, o.currency, 'approved', t, 'gateway', 'Confirmed by signed gateway webhook', t),
    env.DB.prepare("UPDATE orders SET status='paid', paid_at=?, renews_at=? WHERE id=? AND status<>'paid'").bind(t, addPeriod(t, o.kind), o.id),
    ...(o.coupon_code ? [env.DB.prepare('UPDATE coupons SET used_count=used_count+1 WHERE code=?').bind(o.coupon_code)] : [])]);
  return done('paid');
}

// ---------- admin
function cookieOf(req, name) { const c = req.headers.get('Cookie') || ''; for (const part of c.split(';')) { const [k, ...v] = part.trim().split('='); if (k === name) return v.join('='); } return ''; }
async function adminOf(req, env, mutating) {
  const tok = cookieOf(req, 'gm_admin'); if (!tok) throw bad('unauthorized', 'Please sign in.', 401);
  const r = await env.DB.prepare('SELECT s.csrf, s.expires_at, a.id, a.email, a.role FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=?').bind(await sha256(tok)).first();
  if (!r || r.expires_at < now()) throw bad('unauthorized', 'Your session has expired. Please sign in.', 401);
  if (mutating) { const o = req.headers.get('Origin'); if (o && !origins(env).includes(o)) throw bad('forbidden_origin', 'Request origin not allowed.', 403); if (!same(req.headers.get('X-CSRF-Token') || '', r.csrf)) throw bad('csrf', 'Security check failed. Reload the page and try again.', 403); }
  return r;
}
const need = (a, roles) => { if (!roles.includes(a.role)) throw bad('forbidden', 'Your role cannot do this.', 403); };
const sessionCookie = (env, tok, maxAge) => 'gm_admin=' + tok + '; Path=/; HttpOnly; Secure; SameSite=' + (env.COOKIE_SAMESITE || 'Strict') + '; Max-Age=' + maxAge;
async function adminLogin(req, env) {
  await rateLimit(env, req, 'login', 8); const b = await json(req); const email = str(b.email, 5, 120, 'email').toLowerCase(), pw = str(b.password, 1, 200, 'password');
  const a = await env.DB.prepare('SELECT * FROM admins WHERE email=?').bind(email).first();
  if (a && a.locked_until && a.locked_until > now()) throw bad('locked', 'Too many failed attempts. Try again later.', 429);
  const okPw = a ? same(await pbkdf2(pw, a.salt), a.pass_hash) : (await pbkdf2(pw, 'x'), false);
  if (!a || !okPw) { if (a) { const f = a.failed_logins + 1; await env.DB.prepare('UPDATE admins SET failed_logins=?, locked_until=? WHERE id=?').bind(f >= 5 ? 0 : f, f >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null, a.id).run(); await audit(env, a.id, 'login.failed', 'admin', a.id, ''); } throw bad('bad_login', 'Email or password is incorrect.', 401); }
  const tok = rand(32), csrf = rand(16); await env.DB.batch([env.DB.prepare('UPDATE admins SET failed_logins=0, locked_until=NULL WHERE id=?').bind(a.id), env.DB.prepare('INSERT INTO sessions(token_hash,admin_id,csrf,created_at,expires_at) VALUES(?,?,?,?,?)').bind(await sha256(tok), a.id, csrf, now(), new Date(Date.now() + 8 * 3600000).toISOString()), env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now())]);
  await audit(env, a.id, 'login', 'admin', a.id, '');
  return [{ ok: true, email: a.email, role: a.role, csrf }, 200, { 'Set-Cookie': sessionCookie(env, tok, 8 * 3600) }];
}
async function adminSetup(req, env) {
  await rateLimit(env, req, 'setup', 5); const b = await json(req); const n = await env.DB.prepare('SELECT COUNT(*) c FROM admins').first();
  if (n.c > 0 || !env.ADMIN_SETUP_TOKEN || !same(String(b.token || ''), env.ADMIN_SETUP_TOKEN)) throw bad('forbidden', 'Setup is not available.', 403);
  const email = str(b.email, 5, 120, 'email').toLowerCase(), pw = str(b.password, 12, 200, 'password'); const salt = rand(16), id = rand(12);
  await env.DB.prepare('INSERT INTO admins(id,email,pass_hash,salt,role,created_at) VALUES(?,?,?,?,?,?)').bind(id, email, await pbkdf2(pw, salt), salt, 'owner', now()).run(); await audit(env, id, 'admin.setup', 'admin', id, 'first owner created');
  return { ok: true };
}
const ORDER_COLS = 'id,ref,product_id,product_name,kind,currency,list_minor,discount_minor,total_minor,recurring_minor,trial_days,coupon_code,customer_name,customer_email,customer_phone,method,status,created_at,expires_at,paid_at,renews_at,refunded_minor';
async function dayBounds() { const off = 5 * 3600000, t = Date.now(), dayMs = 86400000, dayStart = Math.floor((t + off) / dayMs) * dayMs - off; const d = new Date(t + off); const monthStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - off; return [new Date(dayStart).toISOString(), new Date(monthStart).toISOString()]; }
async function dashboard(env) {
  const [dayStart, monthStart] = await dayBounds(); const sum = async (since) => (await env.DB.prepare("SELECT COALESCE(SUM(total_minor),0) s, COALESCE(SUM(refunded_minor),0) r, COUNT(*) c FROM orders WHERE paid_at IS NOT NULL AND paid_at >= ? AND total_minor > 0").bind(since).first());
  const all = await sum('0000'), today = await sum(dayStart), month = await sum(monthStart), st = await env.DB.prepare('SELECT status, COUNT(*) c FROM orders GROUP BY status').all(), pay = await env.DB.prepare('SELECT status, COUNT(*) c FROM payments GROUP BY status').all();
  const byStatus = {}; for (const r of st.results) byStatus[r.status] = r.c; const byPay = {}; for (const r of pay.results) byPay[r.status] = r.c;
  return { currency: 'PKR', revenue_total_minor: all.s - all.r, revenue_today_minor: today.s - today.r, revenue_month_minor: month.s - month.r, gross_total_minor: all.s, refunded_total_minor: all.r, orders_by_status: byStatus, payments_by_status: byPay, note: 'Revenue counts paid orders with an amount, minus recorded refunds. Today and month use Pakistan time (UTC+5).' };
}
const esc = s => String(s).replace(/[%_\\]/g, m => '\\' + m);
async function listOrders(env, url) {
  const q = (url.searchParams.get('q') || '').trim().slice(0, 60), status = url.searchParams.get('status') || '', method = url.searchParams.get('method') || '', page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1); const where = [], binds = [];
  if (status) { where.push('status=?'); binds.push(status); } if (method) { where.push('method=?'); binds.push(method); }
  if (q) { where.push("(ref LIKE ? ESCAPE '\\' OR customer_email LIKE ? ESCAPE '\\' OR customer_name LIKE ? ESCAPE '\\' OR customer_phone LIKE ? ESCAPE '\\' OR id IN (SELECT order_id FROM payments WHERE txn_reference LIKE ? ESCAPE '\\'))"); const l = '%' + esc(q) + '%'; binds.push(l, l, l, l, l); }
  const w = where.length ? ' WHERE ' + where.join(' AND ') : ''; const tot = await env.DB.prepare('SELECT COUNT(*) c FROM orders' + w).bind(...binds).first();
  const rs = await env.DB.prepare('SELECT ' + ORDER_COLS + ' FROM orders' + w + ' ORDER BY created_at DESC LIMIT 25 OFFSET ?').bind(...binds, (page - 1) * 25).all(); return { orders: rs.results, total: tot.c, page };
}
async function decide(req, env, adminRow, paymentId, approve) {
  need(adminRow, ['owner', 'finance']); const b = await json(req); const note = optStr(b.note, 300, 'note');
  const p = await env.DB.prepare('SELECT * FROM payments WHERE id=?').bind(paymentId).first(); if (!p) throw bad('not_found', 'Payment not found.', 404); if (p.status !== 'submitted') throw bad('already_decided', 'This payment was already decided.', 409);
  const o = await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(p.order_id).first(), t = now();
  if (approve) {
    const got = intIn(b.amount_received_minor, 1, 1000000000, 'amount_received');
    if (got !== o.total_minor) throw bad('amount_mismatch', 'Amount received (' + money(got, o.currency) + ') does not match the order total (' + money(o.total_minor, o.currency) + '). Reject this receipt with a note, or arrange a top-up or refund.', 409);
    const r = await env.DB.prepare("UPDATE payments SET status='approved', decided_at=?, decided_by=?, decision_note=? WHERE id=? AND status='submitted'").bind(t, adminRow.email, note, p.id).run(); if (!r.meta.changes) throw bad('already_decided', 'This payment was already decided.', 409);
    await env.DB.batch([env.DB.prepare("UPDATE orders SET status='paid', paid_at=?, renews_at=? WHERE id=? AND status IN ('awaiting_verification','pending_payment','expired','rejected')").bind(t, addPeriod(t, o.kind), o.id), ...(o.coupon_code ? [env.DB.prepare('UPDATE coupons SET used_count=used_count+1 WHERE code=?').bind(o.coupon_code)] : [])]);
  } else {
    const r = await env.DB.prepare("UPDATE payments SET status='rejected', decided_at=?, decided_by=?, decision_note=? WHERE id=? AND status='submitted'").bind(t, adminRow.email, note || 'Receipt could not be verified', p.id).run(); if (!r.meta.changes) throw bad('already_decided', 'This payment was already decided.', 409);
    const left = await env.DB.prepare("SELECT COUNT(*) c FROM payments WHERE order_id=? AND status='submitted'").bind(o.id).first();
    if (!left.c) await env.DB.prepare("UPDATE orders SET status=? WHERE id=? AND status='awaiting_verification'").bind(b.final === true ? 'rejected' : (o.expires_at > t ? 'pending_payment' : 'expired'), o.id).run();
  }
  await audit(env, adminRow.id, approve ? 'payment.approve' : 'payment.reject', 'payment', p.id, o.ref + ' ' + note); return { ok: true };
}
async function refund(req, env, adminRow, orderId) {
  need(adminRow, ['owner']); const b = await json(req); const o = await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(orderId).first(); if (!o) throw bad('not_found', 'Order not found.', 404);
  if (!['paid', 'partially_refunded'].includes(o.status)) throw bad('not_refundable', 'Only paid orders can be refunded.', 409);
  const amt = intIn(b.amount_minor, 1, o.total_minor, 'amount'); if (o.refunded_minor + amt > o.total_minor) throw bad('refund_too_large', 'Refund is more than the remaining amount.', 409); const note = optStr(b.note, 300, 'note');
  const total = o.refunded_minor + amt, st = total === o.total_minor ? 'refunded' : 'partially_refunded';
  await env.DB.batch([env.DB.prepare('UPDATE orders SET refunded_minor=?, status=? WHERE id=?').bind(total, st, o.id), env.DB.prepare("INSERT INTO payments(id,order_id,method,provider,amount_minor,currency,status,decided_at,decided_by,decision_note,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(rand(12), o.id, o.method, 'manual', amt, o.currency, 'refunded', now(), adminRow.email, note || 'Refund recorded', now())]);
  await audit(env, adminRow.id, 'order.refund', 'order', o.ref, money(amt, o.currency) + ' ' + note); return { ok: true, status: st };
}
const csvCell = v => { let s = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
async function exportCsv(env, url) {
  const from = (url.searchParams.get('from') || '').slice(0, 10), to = (url.searchParams.get('to') || '').slice(0, 10); const where = [], binds = [];
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) { where.push('o.created_at >= ?'); binds.push(from); } if (/^\d{4}-\d{2}-\d{2}$/.test(to)) { where.push('o.created_at < ?'); binds.push(to + 'T99'); }
  const rs = await env.DB.prepare("SELECT o.ref,o.created_at,o.status,o.product_name,o.kind,o.currency,o.list_minor,o.discount_minor,o.total_minor,o.refunded_minor,o.coupon_code,o.method,o.customer_name,o.customer_email,o.customer_phone,o.paid_at,(SELECT GROUP_CONCAT(txn_reference, ' | ') FROM payments p WHERE p.order_id=o.id AND txn_reference IS NOT NULL) txn FROM orders o" + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY o.created_at DESC LIMIT 5000').bind(...binds).all();
  const head = ['order_ref', 'created_at_utc', 'status', 'product', 'plan', 'currency', 'list_price', 'discount', 'total', 'refunded', 'coupon', 'method', 'customer_name', 'customer_email', 'customer_phone', 'paid_at_utc', 'transaction_references'];
  const lines = [head.join(',')]; for (const r of rs.results) lines.push([r.ref, r.created_at, r.status, r.product_name, r.kind, r.currency, r.list_minor / 100, r.discount_minor / 100, r.total_minor / 100, r.refunded_minor / 100, r.coupon_code, r.method, r.customer_name, r.customer_email, r.customer_phone, r.paid_at, r.txn].map(csvCell).join(','));
  return lines.join('\r\n');
}

async function route(req, env, ctx) {
  const url = new URL(req.url), path = url.pathname.replace(/\/+$/, '') || '/', m = req.method; let x;
  if (path === '/api/health' && m === 'GET') return { ok: true, version: VERSION };
  if (path === '/api/config' && m === 'GET') { const s = await allSettings(env); return { methods: enabledMethods(s, env), support_email: s.support_email || '', bank_configured: bankReady(s), order_expiry_hours: parseInt(s.order_expiry_hours || '48', 10), currency: 'PKR' }; }
  if (path === '/api/products' && m === 'GET') { const rs = await env.DB.prepare('SELECT id,name,description,kind,currency,price_minor,trial_days FROM products WHERE active=1 ORDER BY name').all(); return { products: rs.results }; }
  if (path === '/api/coupons/validate' && m === 'POST') { await rateLimit(env, req, 'coupon', 20); const b = await json(req); const p = await env.DB.prepare('SELECT * FROM products WHERE id=? AND active=1').bind(str(b.product_id, 1, 60, 'product')).first(); if (!p) throw bad('product_not_found', 'That product is not available.', 404); const pr = await priceFor(env, p, b.code); return { ok: true, list_minor: pr.list, discount_minor: pr.discount, total_minor: pr.total, recurring_minor: pr.recurring, trial: pr.trial }; }
  if (path === '/api/orders' && m === 'POST') return [await createOrder(req, env, ctx), 201];
  if ((x = path.match(/^\/api\/orders\/(GM-[A-Z0-9]{8})$/)) && m === 'GET') { await rateLimit(env, req, 'orderget', 60); const o = await loadOrderByToken(env, req, x[1]); const pays = await env.DB.prepare('SELECT * FROM payments WHERE order_id=? ORDER BY created_at').bind(o.id).all(); return { order: publicOrder(o, pays.results, await allSettings(env), true) }; }
  if ((x = path.match(/^\/api\/orders\/(GM-[A-Z0-9]{8})\/receipt$/)) && m === 'POST') return uploadReceipt(req, env, x[1]);
  if ((x = path.match(/^\/api\/orders\/(GM-[A-Z0-9]{8})\/cancel$/)) && m === 'POST') { const o = await loadOrderByToken(env, req, x[1]); if (o.status !== 'pending_payment') throw bad('not_cancellable', 'Only unpaid orders can be cancelled.', 409); await env.DB.prepare("UPDATE orders SET status='cancelled' WHERE id=? AND status='pending_payment'").bind(o.id).run(); await audit(env, null, 'order.cancel', 'order', o.ref, 'by customer'); return { ok: true }; }
  if (path === '/api/webhooks/gateway' && m === 'POST') return webhook(req, env);
  if (path === '/api/admin/setup' && m === 'POST') return adminSetup(req, env);
  if (path === '/api/admin/login' && m === 'POST') return adminLogin(req, env);
  if (path.startsWith('/api/admin/')) {
    const mut = m !== 'GET' && m !== 'HEAD'; const a = await adminOf(req, env, mut && path !== '/api/admin/logout' ? true : mut);
    if (path === '/api/admin/logout' && m === 'POST') { await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(cookieOf(req, 'gm_admin'))).run(); await audit(env, a.id, 'logout', 'admin', a.id, ''); return [{ ok: true }, 200, { 'Set-Cookie': sessionCookie(env, '', 0) }]; }
    if (path === '/api/admin/me' && m === 'GET') return { email: a.email, role: a.role, csrf: a.csrf };
    if (path === '/api/admin/dashboard' && m === 'GET') return dashboard(env);
    if (path === '/api/admin/orders' && m === 'GET') return listOrders(env, url);
    if ((x = path.match(/^\/api\/admin\/orders\/([A-Za-z0-9_-]{6,40})$/)) && m === 'GET') { const o = await env.DB.prepare('SELECT ' + ORDER_COLS + ' FROM orders WHERE id=? OR ref=?').bind(x[1], x[1]).first(); if (!o) throw bad('not_found', 'Order not found.', 404); const ps = await env.DB.prepare('SELECT id,order_id,method,provider,provider_ref,amount_minor,currency,status,txn_reference,payer_name,receipt_mime,receipt_size,created_at,decided_at,decided_by,decision_note, (receipt_key IS NOT NULL) has_receipt FROM payments WHERE order_id=? ORDER BY created_at').bind(o.id).all(); return { order: o, payments: ps.results }; }
    if ((x = path.match(/^\/api\/admin\/receipt\/([A-Za-z0-9_-]{6,40})$/)) && m === 'GET') { const p = await env.DB.prepare('SELECT receipt_key, receipt_mime FROM payments WHERE id=?').bind(x[1]).first(); if (!p || !p.receipt_key) throw bad('not_found', 'No receipt.', 404); const obj = await env.RECEIPTS.get(p.receipt_key); if (!obj) throw bad('not_found', 'Receipt file missing.', 404); await audit(env, a.id, 'receipt.view', 'payment', x[1], ''); return new Response(obj.body, { headers: { 'Content-Type': p.receipt_mime, ...SECURE_HEADERS, 'Content-Security-Policy': "default-src 'none'; sandbox", 'Content-Disposition': 'inline', ...corsHeaders(req, env) } }); }
    if ((x = path.match(/^\/api\/admin\/payments\/([A-Za-z0-9_-]{6,40})\/(approve|reject)$/)) && m === 'POST') return decide(req, env, a, x[1], x[2] === 'approve');
    if ((x = path.match(/^\/api\/admin\/orders\/([A-Za-z0-9_-]{6,40})\/refund$/)) && m === 'POST') return refund(req, env, a, x[1]);
    if (path === '/api/admin/export.csv' && m === 'GET') { need(a, ['owner', 'finance']); await audit(env, a.id, 'export.csv', 'orders', null, ''); return new Response(await exportCsv(env, url), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="gm-orders.csv"', ...SECURE_HEADERS, ...corsHeaders(req, env) } }); }
    if (path === '/api/admin/settings' && m === 'GET') { need(a, ['owner']); return { settings: await allSettings(env), max_lengths: SETTING_KEYS }; }
    if (path === '/api/admin/settings' && m === 'PUT') { need(a, ['owner']); const b = await json(req); const changed = []; for (const k of Object.keys(b)) { if (!(k in SETTING_KEYS)) throw bad('unknown_setting', 'Unknown setting: ' + k); let v = typeof b[k] === 'string' ? b[k].trim() : (k === 'enabled_methods' ? JSON.stringify(b[k]) : String(b[k])); if (v.length > SETTING_KEYS[k]) throw bad('too_long', k + ' is too long.'); if (k === 'order_expiry_hours' && !(parseInt(v, 10) >= 1 && parseInt(v, 10) <= 168)) throw bad('invalid_expiry', 'Expiry must be 1 to 168 hours.'); if (k === 'enabled_methods') { let arr; try { arr = JSON.parse(v); } catch (e) { arr = null; } if (!Array.isArray(arr) || arr.some(z => !['bank_transfer', 'card', 'wallet'].includes(z))) throw bad('invalid_methods', 'Methods must be bank_transfer, card or wallet.'); if (arr.includes('card') && !env.GATEWAY_API_KEY) throw bad('gateway_missing', 'Card cannot be enabled: no gateway credentials are configured on the server.'); if (arr.includes('wallet') && !env.WALLET_API_KEY) throw bad('wallet_missing', 'Wallet cannot be enabled: no wallet merchant credentials are configured on the server.'); } if (k === 'support_email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) throw bad('invalid_email', 'Support email looks wrong.'); await env.DB.prepare('INSERT INTO settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at').bind(k, v, now()).run(); changed.push(k); } await audit(env, a.id, 'settings.update', 'settings', null, changed.join(',')); return { ok: true, changed }; }
    if (path === '/api/admin/products' && m === 'GET') { const rs = await env.DB.prepare('SELECT * FROM products ORDER BY name').all(); return { products: rs.results }; }
    if (path === '/api/admin/products' && m === 'POST') { need(a, ['owner']); const b = await json(req); const id = str(b.id, 2, 60, 'id'); if (!/^[a-z0-9-]+$/.test(id)) throw bad('invalid_id', 'Use lowercase letters, numbers and hyphens.'); const kind = str(b.kind, 3, 12, 'kind'); if (!['one_time', 'monthly', 'annual'].includes(kind)) throw bad('invalid_kind', 'Kind must be one_time, monthly or annual.'); await env.DB.prepare("INSERT INTO products(id,name,description,kind,currency,price_minor,trial_days,active,created_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, kind=excluded.kind, price_minor=excluded.price_minor, trial_days=excluded.trial_days, active=excluded.active").bind(id, str(b.name, 2, 120, 'name'), optStr(b.description, 400, 'description'), kind, 'PKR', intIn(b.price_minor, 0, 100000000, 'price'), intIn(b.trial_days || 0, 0, 90, 'trial_days'), b.active === false ? 0 : 1, now()).run(); await audit(env, a.id, 'product.upsert', 'product', id, ''); return { ok: true }; }
    if (path === '/api/admin/coupons' && m === 'GET') { const rs = await env.DB.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all(); return { coupons: rs.results }; }
    if (path === '/api/admin/coupons' && m === 'POST') { need(a, ['owner']); const b = await json(req); const code = str(b.code, 2, 30, 'code').toUpperCase(); if (!/^[A-Z0-9_-]+$/.test(code)) throw bad('invalid_code', 'Use letters, numbers, hyphens or underscores.'); const pct = b.percent_off ? intIn(b.percent_off, 1, 100, 'percent_off') : null, amt = b.amount_off_minor ? intIn(b.amount_off_minor, 1, 100000000, 'amount_off') : null; if ((pct == null) === (amt == null)) throw bad('invalid_discount', 'Set either a percentage or a fixed amount.'); await env.DB.prepare('INSERT INTO coupons(code,percent_off,amount_off_minor,applies_to,valid_from,valid_until,max_uses,active,created_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(code) DO UPDATE SET percent_off=excluded.percent_off, amount_off_minor=excluded.amount_off_minor, applies_to=excluded.applies_to, valid_from=excluded.valid_from, valid_until=excluded.valid_until, max_uses=excluded.max_uses, active=excluded.active').bind(code, pct, amt, optStr(b.applies_to, 60, 'applies_to') || null, optStr(b.valid_from, 30, 'valid_from') || null, optStr(b.valid_until, 30, 'valid_until') || null, b.max_uses ? intIn(b.max_uses, 1, 1000000, 'max_uses') : null, b.active === false ? 0 : 1, now()).run(); await audit(env, a.id, 'coupon.upsert', 'coupon', code, ''); return { ok: true }; }
    if (path === '/api/admin/audit' && m === 'GET') { need(a, ['owner', 'finance']); const rs = await env.DB.prepare('SELECT at, admin_id, action, entity, entity_id, detail FROM audit_log ORDER BY id DESC LIMIT 100').all(); return { entries: rs.results }; }
  }
  throw bad('not_found', 'Not found.', 404);
}

export default {
  async fetch(req, env, ctx) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...SECURE_HEADERS, ...corsHeaders(req, env) } });
    try {
      const r = await route(req, env, ctx);
      if (r instanceof Response) return r;
      if (Array.isArray(r)) return out(r[0], r[1] || 200, req, env, r[2] || {});
      return out(r, 200, req, env);
    } catch (e) {
      if (e instanceof HttpError) return out({ error: { code: e.code, message: e.message } }, e.status, req, env);
      console.error('payments error', e && e.stack || e);
      return out({ error: { code: 'server_error', message: 'Something went wrong. Please try again.' } }, 500, req, env);
    }
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(env.DB.prepare("UPDATE orders SET status='expired' WHERE status='pending_payment' AND expires_at < ?").bind(now()).run()); }
};
