-- Kiron Intranet "The Board" — SQLite schema
-- Created automatically on first server boot (see db/index.js).

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- People who can sign in. Roles gate what they may do:
--   viewer  — read published content only
--   editor  — create / edit / publish posts and quick links
--   admin   — everything above + manage users and roles
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','editor','viewer')),
  department    TEXT,
  job_title     TEXT,
  avatar_path   TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Content categories (the Notice Board tabs). Seeded with the spec's launch set.
CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- The blog: announcements & business updates.
-- Every post carries a named owner and a review date, per the spec.
CREATE TABLE IF NOT EXISTS posts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  category_slug TEXT NOT NULL DEFAULT 'announcements' REFERENCES categories(slug),
  summary       TEXT,
  body          TEXT,                    -- sanitised HTML
  external_url  TEXT,                     -- optional "read more" link to an external system
  external_label TEXT,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  pinned        INTEGER NOT NULL DEFAULT 0,
  author_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  owner_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- the "named owner"
  review_date   TEXT,                     -- YYYY-MM-DD; flagged on the dashboard when past
  published_at  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_status   ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_slug);

-- Photos attached to a post (a simple gallery).
CREATE TABLE IF NOT EXISTS post_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  file_path  TEXT NOT NULL,              -- e.g. /uploads/abc123.jpg
  caption    TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_post_images_post ON post_images(post_id);

-- Curated shortcuts to the systems people use daily (the Quick Links grid).
CREATE TABLE IF NOT EXISTS quick_links (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  subtitle    TEXT,
  url         TEXT NOT NULL,
  icon        TEXT,                       -- short emoji/glyph shown on the card
  category    TEXT,                       -- optional grouping label
  sort_order  INTEGER NOT NULL DEFAULT 0,
  owner_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  review_date TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1
);

-- The "Next Off" countdown strip: upcoming things employees care about.
CREATE TABLE IF NOT EXISTS events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  label      TEXT NOT NULL,               -- e.g. LIVE, ALL HANDS, RELEASE, FINANCE
  title      TEXT NOT NULL,
  location   TEXT,
  starts_at  TEXT NOT NULL,               -- ISO datetime
  is_active  INTEGER NOT NULL DEFAULT 1
);
