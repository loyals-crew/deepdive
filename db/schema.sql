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

-- ─── Dive Sites ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dive_sites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  country       TEXT NOT NULL,
  region        TEXT,
  body_of_water TEXT,
  latitude      NUMERIC(9,6),
  longitude     NUMERIC(9,6),
  visit_count   INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dive_sites_name    ON dive_sites(name);
CREATE INDEX IF NOT EXISTS idx_dive_sites_country ON dive_sites(country);
CREATE INDEX IF NOT EXISTS idx_dive_sites_visits  ON dive_sites(visit_count DESC);

-- ─── Marine Species ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marine_species (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name     TEXT NOT NULL,
  scientific_name TEXT,
  category        TEXT NOT NULL,  -- fish|shark_ray|turtle|cephalopod|crustacean|mammal|nudibranch|other
  emoji           TEXT NOT NULL DEFAULT '🐟',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_species_category ON marine_species(category);
CREATE INDEX IF NOT EXISTS idx_species_name     ON marine_species(common_name);

-- ─── Dive Logs ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dive_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                 TEXT,
  dive_site_id          UUID REFERENCES dive_sites(id),
  dive_site_name        TEXT NOT NULL,
  country               TEXT NOT NULL,
  dive_date             DATE NOT NULL,
  entry_time            TIME,
  exit_time             TIME,
  entry_type            TEXT,              -- shore|boat|other
  max_depth_m           NUMERIC(5,1),
  avg_depth_m           NUMERIC(5,1),
  duration_min          INT,
  surface_interval_min  INT,
  pressure_start_bar    INT,
  pressure_end_bar      INT,
  water_type            TEXT,              -- salt|fresh|brackish
  body_of_water         TEXT,              -- ocean|sea|lake|quarry|river|other
  air_temp_c            NUMERIC(4,1),
  water_temp_surface_c  NUMERIC(4,1),
  water_temp_bottom_c   NUMERIC(4,1),
  visibility            TEXT,              -- excellent|good|average|poor|very_poor
  visibility_m          NUMERIC(4,1),
  current               TEXT,              -- none|light|moderate|strong|very_strong
  wetsuit_type          TEXT,              -- none|shorty|3mm|5mm|7mm|semi_dry|dry_suit
  weight_kg             NUMERIC(4,1),
  weight_feeling        TEXT,              -- too_heavy|good|too_light
  gear_hood             BOOLEAN NOT NULL DEFAULT FALSE,
  gear_gloves           BOOLEAN NOT NULL DEFAULT FALSE,
  gear_boots            BOOLEAN NOT NULL DEFAULT FALSE,
  gear_torch            BOOLEAN NOT NULL DEFAULT FALSE,
  gear_camera           BOOLEAN NOT NULL DEFAULT FALSE,
  gear_computer         BOOLEAN NOT NULL DEFAULT FALSE,
  gear_scooter          BOOLEAN NOT NULL DEFAULT FALSE,
  cylinder_material     TEXT,              -- steel|aluminium|other
  cylinder_volume_l     INT,
  gas_mixture           TEXT,              -- air|nitrox32|nitrox36|nitrox40|nitrox_custom|trimix|rebreather
  gas_o2_percent        INT,
  notes                 TEXT,
  site_rating           INT CHECK (site_rating BETWEEN 1 AND 5),
  site_review           TEXT,
  shop_name             TEXT,
  shop_rating           INT CHECK (shop_rating BETWEEN 1 AND 5),
  shop_review           TEXT,
  divemaster_name       TEXT,
  divemaster_rating     INT CHECK (divemaster_rating BETWEEN 1 AND 5),
  divemaster_review     TEXT,
  privacy               TEXT NOT NULL DEFAULT 'public',  -- public|friends|private
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dive_logs_user    ON dive_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_dive_logs_date    ON dive_logs(dive_date DESC);
CREATE INDEX IF NOT EXISTS idx_dive_logs_privacy ON dive_logs(privacy);
CREATE INDEX IF NOT EXISTS idx_dive_logs_created ON dive_logs(created_at DESC);

-- ─── Animals Spotted ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dive_log_animals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dive_log_id  UUID NOT NULL REFERENCES dive_logs(id) ON DELETE CASCADE,
  species_id   UUID REFERENCES marine_species(id),
  custom_name  TEXT,
  count        INT NOT NULL DEFAULT 1,
  photo_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dla_log ON dive_log_animals(dive_log_id);

-- ─── Companions (buddy + divemaster) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dive_log_companions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dive_log_id  UUID NOT NULL REFERENCES dive_logs(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'buddy',  -- buddy|divemaster|instructor
  verified     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dlc_log ON dive_log_companions(dive_log_id);

-- ─── Likes ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dive_log_likes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dive_log_id  UUID NOT NULL REFERENCES dive_logs(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dive_log_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_dll_log  ON dive_log_likes(dive_log_id);
CREATE INDEX IF NOT EXISTS idx_dll_user ON dive_log_likes(user_id);

-- ─── Comments (replies via parent_id) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dive_log_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dive_log_id  UUID NOT NULL REFERENCES dive_logs(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES dive_log_comments(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dlcom_log    ON dive_log_comments(dive_log_id);
CREATE INDEX IF NOT EXISTS idx_dlcom_parent ON dive_log_comments(parent_id);
