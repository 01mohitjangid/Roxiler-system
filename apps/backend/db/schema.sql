CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(60)  NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash TEXT         NOT NULL,
  address       VARCHAR(400) NOT NULL,
  role          VARCHAR(10)  NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'owner')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stores (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(60)  NOT NULL CHECK (char_length(name) > 0),
  email      VARCHAR(255) NOT NULL UNIQUE CHECK (email = lower(email)),
  address    VARCHAR(400) NOT NULL,
  owner_id   INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ratings (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id   INTEGER  NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  score      SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, store_id)
);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_name_check;
ALTER TABLE users ADD CONSTRAINT users_name_check CHECK (char_length(name) >= 5);

CREATE INDEX IF NOT EXISTS ratings_store_id_idx ON ratings (store_id);
