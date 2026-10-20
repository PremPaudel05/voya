CREATE TABLE microsoft_logins (
  state_hash TEXT PRIMARY KEY,
  challenge TEXT NOT NULL,
  nonce_hash TEXT NOT NULL,
  origin TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX microsoft_logins_expiry ON microsoft_logins(expires_at);
