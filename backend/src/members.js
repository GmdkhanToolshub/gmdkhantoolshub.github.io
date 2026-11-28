// Free + Premium membership: sign up, email verification, owner approval, sessions, permissions and private Premium data.
// Every Premium decision is made here on the server. Passwords are stored only as salted PBKDF2 hashes and are never emailed.
const SESSION_DAYS = 14;
const VERIFY_HOURS = 24;
const RESET_MINUTES = 60;
const MIN_PASSWORD = 10;
const SYNC_KEYS = ['workspace'];
const SYNC_MAX = 300000;
const PLANS = ['lifetime', 'monthly', 'annual', 'custom'];

export function membership(h) {
  const { json, str, optStr, bad, rand, sha256, same, pbkdf2, now, rateLimit, audit, notify, cookieOf, origins } = h;
  const site = env => String(env.SITE_URL || 'https://gmtoolshub.com').replace(/\/+$/, '');
  const emailOf = v => { const e = str(v, 5, 120, 'email').toLowerCase(); if (!/^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/.test(e)) throw bad('invalid_email', 'Please enter a valid email address.'); return e; };
  const passwordOf = (v, email) => {
    const p = typeof v === 'string' ? v : '';
    if (p.length < MIN_PASSWORD || p.length > 200) throw bad('weak_password', 'Use a password of at least ' + MIN_PASSWORD + ' characters.');
    if (/^(.)\1+$/.test(p) || p.toLowerCase() === email || /^(password|1234567890|qwertyuiop)/i.test(p)) throw bad('weak_password', 'That password is too easy to guess.');
    return p;
  };
  // names are shown in emails to the owner, so no line breaks or links
  const nameOf = v => { const n = str(v, 2, 60, 'name').replace(/\s+/g, ' '); if (/[<>]|:\/\/|www\./i.test(n)) throw bad('invalid_name', 'Please enter your name only.'); return n; };
  const originOk = (req, env) => { const o = req.headers.get('Origin'); if (o && !origins(env).includes(o)) throw bad('forbidden_origin', 'Request origin not allowed.', 403); };
  const history = (env, userId, action, detail) => env.DB.prepare('INSERT INTO user_events(user_id,at,action,detail) VALUES(?,?,?,?)').bind(userId, now(), action, detail ? String(detail).slice(0, 200) : null).run();
  const hasAccess = u => !!(u && u.status === 'approved' && u.email_verified_at && (!u.access_expires_at || u.access_expires_at > now()));
  const publicUser = u => ({ name: u.name, email: u.email, status: u.status === 'approved' && !hasAccess(u) ? 'expired' : u.status, plan: u.plan, access_expires_at: u.access_expires_at, premium: hasAccess(u) });
  const cookie = (env, tok, maxAge) => 'gm_user=' + tok + '; Path=/; HttpOnly; Secure; SameSite=' + (env.COOKIE_SAMESITE || 'Strict') + '; Max-Age=' + maxAge;

  async function emailLink(env, ctx, user, purpose) {
    const token = rand(32), life = purpose === 'verify' ? VERIFY_HOURS * 3600000 : RESET_MINUTES * 60000;
    await env.DB.batch([
      env.DB.prepare('UPDATE user_tokens SET used_at=? WHERE user_id=? AND purpose=? AND used_at IS NULL').bind(now(), user.id, purpose),
      env.DB.prepare('INSERT INTO user_tokens(token_hash,user_id,purpose,created_at,expires_at) VALUES(?,?,?,?,?)').bind(await sha256(token), user.id, purpose, now(), new Date(Date.now() + life).toISOString())]);
    // the token sits after "#", so it is not sent to web servers or written into their logs
    const link = site(env) + '/account/' + (purpose === 'verify' ? 'verify' : 'reset') + '/#t=' + token;
    if (purpose === 'verify') notify(ctx, env, user.email, 'Verify your GM Tools Hub email', 'Hello ' + user.name + ',\n\nPlease confirm your email address:\n' + link + '\n\nThe link works once and expires in ' + VERIFY_HOURS + ' hours. After you verify, your request goes to the administrator for approval.\n\nIf you did not sign up, ignore this email.');
    else notify(ctx, env, user.email, 'Reset your GM Tools Hub password', 'Hello ' + user.name + ',\n\nSet a new password here:\n' + link + '\n\nThe link works once and expires in ' + RESET_MINUTES + ' minutes. If you did not ask for this, ignore this email; your password has not changed.');
  }

  async function useToken(env, token, purpose) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{30,60}$/.test(token)) throw bad('invalid_link', 'This link is not valid or has expired.', 410);
    const hash = await sha256(token);
    const r = await env.DB.prepare('UPDATE user_tokens SET used_at=? WHERE token_hash=? AND purpose=? AND used_at IS NULL AND expires_at > ?').bind(now(), hash, purpose, now()).run();
    if (!r.meta.changes) throw bad('invalid_link', 'This link is not valid or has expired.', 410);
    const row = await env.DB.prepare('SELECT u.* FROM user_tokens t JOIN users u ON u.id=t.user_id WHERE t.token_hash=?').bind(hash).first();
    if (!row) throw bad('invalid_link', 'This link is not valid or has expired.', 410);
    return row;
  }

  // The same reply is given whether or not the address already has an account, so nobody can find out who is registered.
  const CHECK_EMAIL = { ok: true, message: 'Check your email. If this address can be registered, we have sent you a link.' };

  async function register(req, env, ctx) {
    originOk(req, env); await rateLimit(env, req, 'register', 5, 600); const b = await json(req, 4096);
    if (!env.RESEND_API_KEY || !env.MAIL_FROM) throw bad('email_not_ready', 'Sign up is not open yet because email sending is not set up.', 503);
    const email = emailOf(b.email), name = nameOf(b.name), password = passwordOf(b.password, email);
    if (b.accept_terms !== true) throw bad('terms_required', 'Please accept the terms and privacy policy.');
    const salt = rand(16), hash = await pbkdf2(password, salt);   // hashed before the lookup so both paths take about the same time
    const existing = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
    if (existing && existing.status === 'unverified') {
      await env.DB.prepare("UPDATE users SET name=?, pass_hash=?, salt=? WHERE id=? AND status='unverified'").bind(name, hash, salt, existing.id).run();
      await emailLink(env, ctx, { ...existing, name }, 'verify');
    } else if (existing) {
      notify(ctx, env, email, 'You already have a GM Tools Hub account', 'Someone tried to sign up with this email address. You already have an account.\n\nSign in or reset your password here:\n' + site(env) + '/account/\n\nIf this was not you, you can ignore this email.');
    } else {
      const user = { id: rand(12), name, email };
      await env.DB.prepare("INSERT INTO users(id,name,email,pass_hash,salt,status,created_at) VALUES(?,?,?,?,?,'unverified',?)").bind(user.id, name, email, hash, salt, now()).run();
      await history(env, user.id, 'registered');
      await emailLink(env, ctx, user, 'verify');
    }
    return [CHECK_EMAIL, 202];
  }

  async function resend(req, env, ctx) {
    originOk(req, env); await rateLimit(env, req, 'resend', 3, 600); const b = await json(req, 2048);
    const u = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(emailOf(b.email)).first();
    if (u && u.status === 'unverified') await emailLink(env, ctx, u, 'verify');
    return [CHECK_EMAIL, 202];
  }

  async function becomePending(env, ctx, u) {
    const r = await env.DB.prepare("UPDATE users SET status='pending', email_verified_at=? WHERE id=? AND status='unverified'").bind(now(), u.id).run();
    if (!r.meta.changes) return;
    await history(env, u.id, 'email.verified');
    const lines = ['A new member verified their email and is waiting for your decision.', '', 'Name: ' + u.name, 'Email: ' + u.email, '', 'Sign in to your admin console to Approve or Reject:', site(env) + '/admin-members/', '', 'Nothing is approved by opening this email.'];
    notify(ctx, env, env.ADMIN_NOTIFY_EMAIL, 'GM Tools Hub: approval request', lines.join(String.fromCharCode(10)));
  }

  // Verification needs BOTH the emailed link and the password chosen at sign up, sent by a button press. So an email scanner changes
  // nothing, and someone who signs up with another person's address cannot get that account verified with their own password.
  async function verify(req, env, ctx) {
    originOk(req, env); await rateLimit(env, req, 'verify', 10, 600); const b = await json(req, 2048);
    const token = typeof b.token === 'string' ? b.token : '';
    const row = /^[A-Za-z0-9_-]{30,60}$/.test(token) ? await env.DB.prepare("SELECT u.* FROM user_tokens t JOIN users u ON u.id=t.user_id WHERE t.token_hash=? AND t.purpose='verify' AND t.used_at IS NULL AND t.expires_at > ?").bind(await sha256(token), now()).first() : null;
    if (!row) throw bad('invalid_link', 'This link is not valid or has expired.', 410);
    if (!same(await pbkdf2(str(b.password, 1, 200, 'password'), row.salt), row.pass_hash)) throw bad('wrong_password', 'That is not the password chosen at sign up. If you did not choose it, use "Forgot password" to set your own.', 401);
    const u = await useToken(env, token, 'verify');
    await becomePending(env, ctx, u);
    return { ok: true, message: 'Your email is verified. Your request is now waiting for approval. You will get an email when it is decided.' };
  }

  async function login(req, env) {
    originOk(req, env); await rateLimit(env, req, 'userlogin', 10); const b = await json(req, 2048);
    const email = emailOf(b.email), password = str(b.password, 1, 200, 'password');
    const u = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
    if (u && u.locked_until && u.locked_until > now()) throw bad('locked', 'Too many failed attempts. Try again in 15 minutes or reset your password.', 429);
    const good = u ? same(await pbkdf2(password, u.salt), u.pass_hash) : (await pbkdf2(password, 'x'), false);
    if (!good) {
      if (u) {
        const f = u.failed_logins + 1;
        await env.DB.prepare('UPDATE users SET failed_logins=?, locked_until=? WHERE id=?').bind(f >= 5 ? 0 : f, f >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null, u.id).run();
        await history(env, u.id, 'login.failed');
      }
      throw bad('bad_login', 'Email or password is incorrect.', 401);
    }
    if (u.status === 'unverified') throw bad('email_not_verified', 'Please verify your email first. We can send the link again.', 403);
    const token = rand(32), csrf = rand(16);
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET failed_logins=0, locked_until=NULL WHERE id=?').bind(u.id),
      env.DB.prepare('INSERT INTO user_sessions(token_hash,user_id,csrf,created_at,expires_at) VALUES(?,?,?,?,?)').bind(await sha256(token), u.id, csrf, now(), new Date(Date.now() + SESSION_DAYS * 86400000).toISOString()),
      env.DB.prepare('DELETE FROM user_sessions WHERE expires_at < ?').bind(now())]);
    await history(env, u.id, 'login');
    return [{ ok: true, user: publicUser(u), csrf }, 200, { 'Set-Cookie': cookie(env, token, SESSION_DAYS * 86400) }];
  }

  // The account is read from the database on every request, so suspending or revoking takes effect at once.
  async function userOf(req, env, mutating) {
    const tok = cookieOf(req, 'gm_user'); if (!tok) throw bad('unauthorized', 'Please sign in.', 401);
    const hash = await sha256(tok);
    const u = await env.DB.prepare('SELECT u.*, s.csrf, s.expires_at AS session_expires FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?').bind(hash).first();
    if (!u || u.session_expires < now()) throw bad('unauthorized', 'Your session has ended. Please sign in.', 401);
    if (mutating) { originOk(req, env); if (!same(req.headers.get('X-CSRF-Token') || '', u.csrf)) throw bad('csrf', 'Security check failed. Reload the page and try again.', 403); }
    u.session_hash = hash;
    return u;
  }

  async function forgot(req, env, ctx) {
    originOk(req, env); await rateLimit(env, req, 'forgot', 5, 600); const b = await json(req, 2048);
    const u = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(emailOf(b.email)).first();
    if (u) await emailLink(env, ctx, u, 'reset');
    return [{ ok: true, message: 'If that address has an account, we have sent a link to it.' }, 202];
  }

  async function reset(req, env, ctx) {
    originOk(req, env); await rateLimit(env, req, 'reset', 10, 600); const b = await json(req, 2048);
    if (typeof b.password !== 'string' || b.password.length < MIN_PASSWORD) throw bad('weak_password', 'Use a password of at least ' + MIN_PASSWORD + ' characters.');
    const u = await useToken(env, b.token, 'reset');
    const password = passwordOf(b.password, u.email), salt = rand(16);
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET pass_hash=?, salt=?, failed_logins=0, locked_until=NULL WHERE id=?').bind(await pbkdf2(password, salt), salt, u.id),
      env.DB.prepare('DELETE FROM user_sessions WHERE user_id=?').bind(u.id)]);
    await history(env, u.id, 'password.reset');
    // using a reset link proves the person controls the mailbox, so it also verifies a new account
    if (u.status === 'unverified') await becomePending(env, ctx, u);
    return { ok: true, message: 'Your password is changed. Please sign in.' };
  }

  async function featureList(env) { return (await env.DB.prepare('SELECT id,name,path,tier,enforcement FROM features ORDER BY sort,id').all()).results; }

  /** Server-side gate used by every Premium route. */
  async function requireFeature(req, env, featureId, mutating) {
    const f = await env.DB.prepare('SELECT * FROM features WHERE id=?').bind(featureId).first();
    if (!f) throw bad('not_found', 'Not found.', 404);
    const u = await userOf(req, env, mutating);
    if (f.tier === 'admin') throw bad('forbidden', 'Only the administrator can use this.', 403);
    if (f.tier === 'premium' && !hasAccess(u)) throw bad('premium_required', 'This needs an approved, active Premium account.', 403);
    return u;
  }

  async function publicRoutes(req, env, ctx, path, m) {
    let x;
    if (path === '/api/features' && m === 'GET') return { features: (await featureList(env)).filter(f => f.tier !== 'admin') };
    if (path === '/api/auth/register' && m === 'POST') return register(req, env, ctx);
    if (path === '/api/auth/resend' && m === 'POST') return resend(req, env, ctx);
    if (path === '/api/auth/verify' && m === 'POST') return verify(req, env, ctx);
    if (path === '/api/auth/login' && m === 'POST') return login(req, env);
    if (path === '/api/auth/forgot' && m === 'POST') return forgot(req, env, ctx);
    if (path === '/api/auth/reset' && m === 'POST') return reset(req, env, ctx);
    if (path === '/api/auth/me' && m === 'GET') { const u = await userOf(req, env, false); return { user: publicUser(u), csrf: u.csrf }; }
    if (path === '/api/auth/logout' && m === 'POST') { const u = await userOf(req, env, true); await env.DB.prepare('DELETE FROM user_sessions WHERE token_hash=?').bind(u.session_hash).run(); await history(env, u.id, 'logout'); return [{ ok: true }, 200, { 'Set-Cookie': cookie(env, '', 0) }]; }
    // permission check used by locked pages
    if ((x = path.match(/^\/api\/premium\/access\/([a-z0-9-]{2,40})$/)) && m === 'GET') { await requireFeature(req, env, x[1], false); return { ok: true }; }
    if ((x = path.match(/^\/api\/premium\/content\/([a-z0-9-]{2,40})$/)) && m === 'GET') { await requireFeature(req, env, x[1], false); return { items: (await env.DB.prepare('SELECT id,title,body,updated_at FROM premium_content WHERE feature_id=? ORDER BY title').bind(x[1]).all()).results }; }
    if ((x = path.match(/^\/api\/premium\/data\/([a-z-]{2,30})$/)) && (m === 'GET' || m === 'PUT')) {
      const u = await requireFeature(req, env, 'cloud-sync', m === 'PUT'), key = x[1];
      if (!SYNC_KEYS.includes(key)) throw bad('not_found', 'Not found.', 404);
      if (m === 'GET') { const row = await env.DB.prepare('SELECT value,updated_at FROM user_data WHERE user_id=? AND key=?').bind(u.id, key).first(); return { value: row ? JSON.parse(row.value) : null, updated_at: row ? row.updated_at : null }; }
      await rateLimit(env, req, 'sync', 30);
      const b = await json(req, SYNC_MAX);
      if (!b.value || typeof b.value !== 'object' || Array.isArray(b.value)) throw bad('invalid_value', 'Nothing to save.');
      const t = now();
      await env.DB.prepare('INSERT INTO user_data(user_id,key,value,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at').bind(u.id, key, JSON.stringify(b.value), t).run();
      return { ok: true, updated_at: t };
    }
    return null;
  }

  function accessEnd(plan, custom) {
    const d = new Date();
    if (plan === 'lifetime') return null;
    if (plan === 'monthly') { d.setUTCMonth(d.getUTCMonth() + 1); return d.toISOString(); }
    if (plan === 'annual') { d.setUTCFullYear(d.getUTCFullYear() + 1); return d.toISOString(); }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(custom || ''))) throw bad('invalid_date', 'Choose the date when access ends.');
    const end = new Date(custom + 'T23:59:59.000Z');
    if (isNaN(end) || end.toISOString().slice(0, 10) !== custom || end.getTime() < Date.now()) throw bad('invalid_date', 'The end date must be a real date, today or later.');
    return end.toISOString();
  }

  const USER_COLS = 'id,name,email,status,plan,access_expires_at,created_at,email_verified_at,decided_at,decided_by';
  const ACTIONS = {
    approve: { from: ['pending', 'rejected'], to: 'approved', grant: true },
    reject: { from: ['pending'], to: 'rejected' },
    suspend: { from: ['approved'], to: 'suspended' },
    reactivate: { from: ['suspended'], to: 'approved' },
    revoke: { from: ['approved', 'suspended'], to: 'revoked' },
    access: { from: ['approved', 'revoked'], to: 'approved', grant: true }
  };

  async function decideUser(req, env, ctx, adminRow, id, action) {
    const rule = ACTIONS[action], b = await json(req, 2048), note = optStr(b.note, 200, 'note');
    const u = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first();
    if (!u) throw bad('not_found', 'User not found.', 404);
    if (!u.email_verified_at) throw bad('email_not_verified', 'This user has not verified their email yet.', 409);
    if (!rule.from.includes(u.status)) throw bad('wrong_status', 'That action is not possible while the account is ' + u.status + '.', 409);
    let plan = u.plan, end = u.access_expires_at;
    if (rule.grant) { plan = String(b.plan || ''); if (!PLANS.includes(plan)) throw bad('invalid_plan', 'Choose lifetime, monthly, annual or a custom end date.'); end = accessEnd(plan, b.ends_on); }
    const r = await env.DB.prepare('UPDATE users SET status=?, plan=?, access_expires_at=?, decided_at=?, decided_by=? WHERE id=? AND status=?').bind(rule.to, plan, end, now(), adminRow.email, u.id, u.status).run();
    if (!r.meta.changes) throw bad('wrong_status', 'The account changed. Reload and try again.', 409);
    if (rule.to !== 'approved') await env.DB.prepare('DELETE FROM user_sessions WHERE user_id=?').bind(u.id).run();
    await history(env, u.id, 'admin.' + action, [plan, end, note].filter(Boolean).join(' | '));
    await audit(env, adminRow.id, 'member.' + action, 'user', u.id, note);
    const until = end ? 'until ' + end.slice(0, 10) : 'with no end date';
    if (action === 'approve') notify(ctx, env, u.email, 'Your GM Tools Hub Premium access is active', 'Hello ' + u.name + ',\n\nYour account is approved. Premium access is active ' + until + '.\n\nSign in with the password you chose:\n' + site(env) + '/account/\n\nForgot it? Use "Forgot password" on that page. We never send passwords by email.');
    if (action === 'reject') notify(ctx, env, u.email, 'Your GM Tools Hub Premium request', 'Hello ' + u.name + ',\n\nYour Premium request was not approved. All free tools stay available to you.\n\n' + (env.SUPPORT_EMAIL ? 'Questions: ' + env.SUPPORT_EMAIL : ''));
    return { ok: true, user: await env.DB.prepare('SELECT ' + USER_COLS + ' FROM users WHERE id=?').bind(u.id).first() };
  }

  /** Called only after the administrator's session has been checked. Membership management is for the owner account only. */
  async function adminRoutes(req, env, ctx, adminRow, url, path, m) {
    if (!/^\/api\/admin\/(users|features|content)(\/|$)/.test(path)) return null;
    if (adminRow.role !== 'owner') throw bad('forbidden', 'Only the owner can manage members and permissions.', 403);
    let x;
    if (path === '/api/admin/users' && m === 'GET') {
      const status = url.searchParams.get('status') || '', q = (url.searchParams.get('q') || '').trim().slice(0, 60), page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1), where = [], binds = [];
      if (status) { where.push('status=?'); binds.push(status); }
      if (q) { const like = '%' + q.replace(/[%_\\]/g, c => '\\' + c) + '%'; where.push("(email LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\')"); binds.push(like, like); }
      const w = where.length ? ' WHERE ' + where.join(' AND ') : '';
      const total = (await env.DB.prepare('SELECT COUNT(*) c FROM users' + w).bind(...binds).first()).c;
      const users = (await env.DB.prepare('SELECT ' + USER_COLS + ' FROM users' + w + ' ORDER BY created_at DESC LIMIT 25 OFFSET ?').bind(...binds, (page - 1) * 25).all()).results;
      const counts = {}; for (const r of (await env.DB.prepare('SELECT status, COUNT(*) c FROM users GROUP BY status').all()).results) counts[r.status] = r.c;
      return { users, total, page, counts };
    }
    if ((x = path.match(/^\/api\/admin\/users\/([A-Za-z0-9_-]{6,40})$/)) && m === 'GET') {
      const user = await env.DB.prepare('SELECT ' + USER_COLS + ' FROM users WHERE id=?').bind(x[1]).first();
      if (!user) throw bad('not_found', 'User not found.', 404);
      return { user, history: (await env.DB.prepare('SELECT at,action,detail FROM user_events WHERE user_id=? ORDER BY id DESC LIMIT 100').bind(x[1]).all()).results };
    }
    if ((x = path.match(/^\/api\/admin\/users\/([A-Za-z0-9_-]{6,40})\/(approve|reject|suspend|reactivate|revoke|access)$/)) && m === 'POST') return decideUser(req, env, ctx, adminRow, x[1], x[2]);
    if (path === '/api/admin/features' && m === 'GET') return { features: await featureList(env) };
    if ((x = path.match(/^\/api\/admin\/features\/([a-z0-9-]{2,40})$/)) && m === 'PUT') {
      const b = await json(req, 1024), tier = String(b.tier || '');
      if (!['free', 'premium', 'admin'].includes(tier)) throw bad('invalid_tier', 'Tier must be free, premium or admin.');
      const r = await env.DB.prepare('UPDATE features SET tier=?, updated_at=? WHERE id=?').bind(tier, now(), x[1]).run();
      if (!r.meta.changes) throw bad('not_found', 'Feature not found.', 404);
      await audit(env, adminRow.id, 'feature.tier', 'feature', x[1], tier);
      return { ok: true };
    }
    if ((x = path.match(/^\/api\/admin\/content\/([a-z0-9-]{2,40})$/))) {
      const f = await env.DB.prepare('SELECT id FROM features WHERE id=?').bind(x[1]).first();
      if (!f) throw bad('not_found', 'Feature not found.', 404);
      if (m === 'GET') return { items: (await env.DB.prepare('SELECT id,title,body,updated_at FROM premium_content WHERE feature_id=? ORDER BY title').bind(x[1]).all()).results };
      if (m === 'POST') {
        const b = await json(req, 120000), title = str(b.title, 2, 120, 'title'), body = str(b.body, 1, 100000, 'body'), id = rand(12);
        await env.DB.prepare('INSERT INTO premium_content(id,feature_id,title,body,updated_at) VALUES(?,?,?,?,?)').bind(id, x[1], title, body, now()).run();
        await audit(env, adminRow.id, 'content.add', 'feature', x[1], title);
        return [{ ok: true, id }, 201];
      }
    }
    if ((x = path.match(/^\/api\/admin\/content\/([a-z0-9-]{2,40})\/([A-Za-z0-9_-]{6,40})$/)) && m === 'DELETE') {
      const r = await env.DB.prepare('DELETE FROM premium_content WHERE id=? AND feature_id=?').bind(x[2], x[1]).run();
      if (!r.meta.changes) throw bad('not_found', 'Item not found.', 404);
      await audit(env, adminRow.id, 'content.delete', 'feature', x[1], x[2]);
      return { ok: true };
    }
    return null;
  }

  return { publicRoutes, adminRoutes };
}
