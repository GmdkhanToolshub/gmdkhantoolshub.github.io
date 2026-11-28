-- Free + Premium membership: accounts, email verification, owner approval, permissions and private Premium content.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('unverified','pending','approved','rejected','suspended','revoked')),
  plan TEXT CHECK (plan IS NULL OR plan IN ('lifetime','monthly','annual','custom')),
  access_expires_at TEXT,
  created_at TEXT NOT NULL,
  email_verified_at TEXT,
  decided_at TEXT,
  decided_by TEXT,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status, created_at);

CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  csrf TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);

-- single-use email links; only a hash of each link token is stored
CREATE TABLE IF NOT EXISTS user_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('verify','reset')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

-- registration and sign-in history (no IP addresses are stored)
CREATE TABLE IF NOT EXISTS user_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  at TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT
);
CREATE INDEX IF NOT EXISTS idx_user_events_user ON user_events(user_id, id);

-- what is free, premium or admin-only. The owner changes tiers in the admin console.
-- enforcement: 'server' = content or data only the server gives to approved members; 'page' = the page hides a working area
-- that runs in the visitor's browser (stops normal use, but is not strong protection).
CREATE TABLE IF NOT EXISTS features (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free','premium','admin')),
  enforcement TEXT NOT NULL CHECK (enforcement IN ('page','server')),
  sort INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
INSERT OR IGNORE INTO features(id,name,path,tier,enforcement,sort,updated_at) VALUES
 ('bi-studio','BI Studio: steps 2 to 6','/bi-studio/','premium','page',10,'2026-11-28T00:00:00.000Z'),
 ('calculator-lab','Business Calculator Lab: calculators','/business-calculators/','premium','page',20,'2026-11-28T00:00:00.000Z'),
 ('cloud-sync','Cloud backup of My Workspace and Planner','/premium/','premium','server',30,'2026-11-28T00:00:00.000Z'),
 ('report-packs','Premium report packs','/premium/','premium','server',40,'2026-11-28T00:00:00.000Z'),
 ('downloads','Future Premium downloads','/premium/','premium','server',50,'2026-11-28T00:00:00.000Z');

-- private Premium files or links, kept on the server and never in the public website
CREATE TABLE IF NOT EXISTS premium_content (
  id TEXT PRIMARY KEY,
  feature_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- cloud backup of a member's own browser data
CREATE TABLE IF NOT EXISTS user_data (
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);
