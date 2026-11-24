// Test harness: runs the real Worker code (src/index.js) in Node with a SQLite-backed D1 stand-in (node:sqlite) and an in-memory R2 stand-in.
// Why: the Cloudflare local runtime (workerd) is blocked on the build machine. This exercises the real SQL and request logic, but NOT the workerd runtime or real D1/R2.
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import worker from '../src/index.js';

class Stmt {
  constructor(db, sql) { this.db = db; this.sql = sql; this.args = []; }
  bind(...a) { this.args = a.map(x => (x === undefined ? null : x)); return this; }
  async first() { const r = this.db.prepare(this.sql).get(...this.args); return r ? { ...r } : null; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.args).map(r => ({ ...r })) }; }
  async run() { const r = this.db.prepare(this.sql).run(...this.args); return { meta: { changes: Number(r.changes) } }; }
  _runSync() { const r = this.db.prepare(this.sql).run(...this.args); return { meta: { changes: Number(r.changes) } }; }
}
export function makeEnv(extra = {}) {
  const sqlite = new DatabaseSync(':memory:');
  for (const f of ['0001_init.sql', '0002_reasoning_certificates.sql']) sqlite.exec(fs.readFileSync(new URL('../migrations/' + f, import.meta.url), 'utf8'));
  const store = new Map();
  const DB = { prepare: sql => new Stmt(sqlite, sql), async batch(stmts) { sqlite.exec('BEGIN'); try { const res = []; for (const s of stmts) res.push(s._runSync()); sqlite.exec('COMMIT'); return res; } catch (e) { sqlite.exec('ROLLBACK'); throw e; } }, _raw: sqlite };
  const RECEIPTS = { async put(k, v, o) { store.set(k, { buf: Buffer.from(v), o }); }, async get(k) { const r = store.get(k); return r ? { body: new Blob([r.buf]).stream() } : null; }, _store: store };
  return { DB, RECEIPTS, ALLOWED_ORIGINS: 'https://gmtoolshub.com,http://localhost:8765', COOKIE_SAMESITE: 'Lax', ADMIN_SETUP_TOKEN: 'test-setup-token-123456', GATEWAY_NAME: 'testgw', ...extra };
}
let ipSeq = 0;
export async function call(env, method, path, { json, form, headers = {}, ip, raw } = {}) {
  const h = { 'CF-Connecting-IP': ip || '10.0.0.' + (++ipSeq % 250 + 1) + '.' + ipSeq, ...headers };
  let body;
  if (json !== undefined) { body = JSON.stringify(json); h['Content-Type'] = 'application/json'; } else if (form) body = form; else if (raw !== undefined) body = raw;
  const req = new Request('https://api.test' + path, { method, headers: h, body });
  const ctx = { waitUntil() { } };
  const res = await worker.fetch(req, env, ctx);
  const text = await res.text(); let data = null; try { data = JSON.parse(text); } catch (e) { /* not json */ }
  return { status: res.status, data, text, headers: res.headers };
}
export const cookieFrom = res => { const c = res.headers.get('Set-Cookie') || ''; return c.split(';')[0]; };
export { worker };
