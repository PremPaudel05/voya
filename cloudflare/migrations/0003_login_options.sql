CREATE TABLE email_logins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  origin TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL
);
CREATE INDEX email_logins_expiry ON email_logins(expires_at);
CREATE TABLE oauth_logins (
  state_hash TEXT PRIMARY KEY,
  challenge TEXT NOT NULL,
  origin TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX oauth_logins_expiry ON oauth_logins(expires_at);
