-- Reasoning Test: private answer key, server-scored attempts, paid certificates.
ALTER TABLE products ADD COLUMN requires TEXT;

CREATE TABLE IF NOT EXISTS quiz_keys (
  qid TEXT PRIMARY KEY,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4),
  correct INTEGER NOT NULL CHECK (correct BETWEEN 0 AND 7)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  bank TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started','finished')),
  started_at TEXT NOT NULL,
  deadline_at TEXT NOT NULL,
  finished_at TEXT,
  answers TEXT,
  raw INTEGER,
  total INTEGER,
  pct INTEGER,
  level TEXT
);

CREATE TABLE IF NOT EXISTS order_links (
  order_id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL UNIQUE,
  cert_name TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id)
);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL,
  name TEXT NOT NULL,
  raw INTEGER NOT NULL,
  total INTEGER NOT NULL,
  pct INTEGER NOT NULL,
  level TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid','revoked')),
  issued_at TEXT NOT NULL,
  FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id)
);

-- The certificate product exists but is INACTIVE and priced at 0 until the owner sets a price and switches it on in the admin console.
INSERT OR IGNORE INTO products(id,name,description,kind,currency,price_minor,trial_days,active,created_at,requires)
VALUES('reasoning-certificate','GM Reasoning Test Certificate','Verifiable certificate of completion with your name, score, level, date and a public verification ID. Not a clinical IQ assessment.','one_time','PKR',0,0,0,datetime('now'),'quiz_attempt');
