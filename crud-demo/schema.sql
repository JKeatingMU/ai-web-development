-- Reading List API — PostgreSQL Schema

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT         UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books (
  id         SERIAL PRIMARY KEY,
  title      TEXT         NOT NULL,
  author     TEXT         NOT NULL,
  genre      TEXT,
  status     VARCHAR(15)  NOT NULL DEFAULT 'want-to-read'
               CHECK (status IN ('want-to-read', 'reading', 'done')),
  rating     SMALLINT     CHECK (rating BETWEEN 1 AND 5),
  notes      TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
