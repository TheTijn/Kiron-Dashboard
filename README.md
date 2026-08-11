# Kiron Intranet — "The Board"

The single place Kiron employees go first: company **announcements**, **business
updates**, and the **quick links** people use daily — posted once, seen by everyone,
with a searchable archive. Built to the [intranet spec](#) as a clean, minimalist
site with green accents.

It has three parts:

1. **The Board** (`/`) — the public intranet: a Notice Board (the blog), a live
   "Next Off" countdown strip, and a Quick Links grid. Global search across posts,
   links and people.
2. **The CMS** (`/admin`) — a simple content manager so non-technical staff can
   publish without a developer. Posts carry a **named owner** and a **review date**;
   the dashboard flags anything overdue or unowned.
3. **The database** — SQLite, holding user accounts & posting permissions, posts and
   their photos, quick links, and events.

## Tech stack

- **Node.js + Express** — API and static hosting (keeps the existing Hostinger setup)
- **SQLite** (`better-sqlite3`) — a single-file database, easy to back up
- **express-session** (SQLite-backed) — sign-in sessions
- **bcryptjs** — password hashing · **multer** — photo uploads · **sanitize-html** — safe post bodies

No build step and no bundler — plain HTML/CSS/JS on the front end.

## Running locally

```bash
npm install
npm start          # http://localhost:3000
```

On first boot the database is created and seeded, and starter sign-in accounts are
printed to the console:

| Role   | Email                          | Password (default)   | Can do                          |
|--------|--------------------------------|----------------------|---------------------------------|
| admin  | `admin@kironinteractive.com`   | `KironBoard2026!`    | Everything + manage users       |
| editor | `editor@kironinteractive.com`  | `KironEditor2026!`   | Create / edit / publish content |
| viewer | `viewer@kironinteractive.com`  | `KironViewer2026!`   | Read published content only     |

**Change these after first login** (admins manage users under `/admin/users`).

## Configuration (environment variables)

| Variable         | Purpose                                                        | Default              |
|------------------|---------------------------------------------------------------|----------------------|
| `PORT`           | Port to listen on. Its presence also switches on "production" (secure cookies, trust proxy). | `3000` (dev) |
| `SESSION_SECRET` | Secret used to sign session cookies. **Set this in production.** | dev-only fallback  |
| `ADMIN_PASSWORD` | Overrides the seeded admin password (first boot only).        | `KironBoard2026!`    |
| `DB_PATH`        | Where the SQLite file lives.                                  | `db/kiron.sqlite`    |

## Deploying on Hostinger

1. Upload the project (or `git pull`) and run `npm install --omit=dev`.
2. Set `PORT`, `SESSION_SECRET`, and (recommended) `ADMIN_PASSWORD` in the app's
   environment. Because sessions use **secure cookies in production**, the site must
   be served over **HTTPS**.
3. Start with `npm start` (Hostinger's Node app runner).

### Data & backups

- The database is the single file at `DB_PATH` — back it up regularly.
- Uploaded photos live in `uploads/`. **This folder must persist across deploys** and
  be included in backups. Both `db/*.sqlite` and `uploads/` are git-ignored so real
  content is never committed.

## Roles & permissions

- **viewer** — read the Board.
- **editor** — create, edit and publish posts; manage quick links and events.
- **admin** — everything, plus create users and set roles.

Signing in is required to view the Board (it's internal). The last active admin can't
be demoted or deleted, so you can't lock yourself out.

## Project layout

```
server.js            Express app (static + /uploads + /api + sessions/guards)
db/
  schema.sql         Tables (users, posts, post_images, quick_links, events, categories)
  index.js           Connection, migrate-on-boot, first-run seed
routes/              auth, posts, links, events, users, meta (categories + search)
middleware/auth.js   requireAuth / requireRole / CSRF
lib/                 upload (multer), helpers (slug, sanitise)
public/              The Board (index.html, app.js, app.css) + login + admin/ CMS
uploads/             Uploaded photos (git-ignored)
```

## Not in this version

Microsoft 365 SSO, a full-text search engine, and deep Jira/Confluence integration
were left out to launch small (quick links, announcements, business updates), as the
spec advises. The schema is structured so SSO and richer search can be added later
without reworking the data model.
