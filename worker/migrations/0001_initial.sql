CREATE TABLE pastes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'text',
  drawing TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  delete_token_hash TEXT NOT NULL
);

CREATE INDEX idx_pastes_expires_at ON pastes (expires_at);

CREATE TABLE rate_limits (
  ip_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_hash, window_start)
);

CREATE INDEX idx_rate_limits_window_start ON rate_limits (window_start);
