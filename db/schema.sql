-- Run this in your Neon SQL editor to set up the DeepDive database

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE experience_level AS ENUM ('beginner', 'intermediate', 'advanced');

CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  full_name        TEXT NOT NULL,
  experience_level experience_level NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ─── Friendships ──────────────────────────────────────────────────────────────

CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE IF NOT EXISTS friendships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       friendship_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_friend CHECK (requester_id <> addressee_id)
);

-- Expression-based unique index: prevents (A→B) and (B→A) from both existing
CREATE UNIQUE INDEX IF NOT EXISTS idx_friendships_unique_pair
  ON friendships (LEAST(requester_id::text, addressee_id::text), GREATEST(requester_id::text, addressee_id::text));

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status    ON friendships(status);
