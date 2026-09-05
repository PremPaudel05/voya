CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  settings TEXT NOT NULL DEFAULT '{"budget":"midrange","traveler":"couple","days":7,"styles":["culture"],"saveHistory":true}',
  created_at INTEGER NOT NULL
);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id, expires_at);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE login_nonces (nonce TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
CREATE INDEX nonces_expiry ON login_nonces(expires_at);
CREATE TABLE request_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX request_limits_expiry ON request_limits(expires_at);
CREATE TABLE search_history (
  user_id TEXT NOT NULL REFERENCES users(id),
  country_name TEXT NOT NULL,
  searched_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, country_name)
);
CREATE INDEX history_recent ON search_history(user_id, searched_at DESC);
CREATE TABLE plan_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  ip_hash TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  country_name TEXT NOT NULL,
  input TEXT NOT NULL,
  day_start INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','complete','failed')),
  result TEXT,
  hidden INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX jobs_user_day ON plan_jobs(user_id, day_start, created_at);
CREATE INDEX jobs_ip_day ON plan_jobs(ip_hash, day_start);
CREATE INDEX jobs_day ON plan_jobs(day_start);
CREATE INDEX jobs_cache ON plan_jobs(user_id, fingerprint, created_at DESC);
CREATE INDEX jobs_retention ON plan_jobs(created_at);

-- One atomic INSERT checks and reserves every quota before the AI call. No
-- read-then-increment race and no in-memory/serverless counters. Failed and
-- timed-out attempts remain charged because upstream may have used compute.
CREATE TRIGGER reserve_plan BEFORE INSERT ON plan_jobs BEGIN
  SELECT RAISE(ABORT, 'USER_DAILY_LIMIT')
    WHERE (SELECT count(*) FROM plan_jobs WHERE user_id=NEW.user_id AND day_start=NEW.day_start) >= 3;
  SELECT RAISE(ABORT, 'IP_DAILY_LIMIT')
    WHERE (SELECT count(*) FROM plan_jobs WHERE ip_hash=NEW.ip_hash AND day_start=NEW.day_start) >= 15;
  SELECT RAISE(ABORT, 'SITE_DAILY_LIMIT')
    WHERE (SELECT count(*) FROM plan_jobs WHERE day_start=NEW.day_start) >= 40;
  SELECT RAISE(ABORT, 'COOLDOWN')
    WHERE EXISTS(SELECT 1 FROM plan_jobs WHERE user_id=NEW.user_id AND created_at>NEW.created_at-60);
  SELECT RAISE(ABORT, 'PLAN_IN_PROGRESS')
    WHERE EXISTS(SELECT 1 FROM plan_jobs WHERE user_id=NEW.user_id AND status='pending' AND created_at>NEW.created_at-120);
END;
