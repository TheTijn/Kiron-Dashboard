// Database bootstrap: open the SQLite file, apply the schema, and seed
// starter content on first run. Exposes a single shared connection.

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'kiron.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Apply schema (idempotent — every statement is CREATE ... IF NOT EXISTS).
db.exec(fs.readFileSync(SCHEMA_PATH, 'utf-8'));

// The default admin password can be overridden with an env var before first boot.
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'KironBoard2026!';

function daysFromNow(days, hours = 9, minutes = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function isoDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (userCount > 0) return; // already seeded

  console.log('Seeding starter data (first run)...');

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, name, role, department, job_title)
    VALUES (@email, @password_hash, @name, @role, @department, @job_title)
  `);

  const users = [
    {
      email: 'admin@kironinteractive.com',
      password: DEFAULT_ADMIN_PASSWORD,
      name: 'Board Administrator',
      role: 'admin',
      department: 'Internal Comms',
      job_title: 'Intranet Owner'
    },
    {
      email: 'editor@kironinteractive.com',
      password: 'KironEditor2026!',
      name: 'Nomsa Dlamini',
      role: 'editor',
      department: 'Internal Comms',
      job_title: 'Communications Lead'
    },
    {
      email: 'viewer@kironinteractive.com',
      password: 'KironViewer2026!',
      name: 'Thandi Mokoena',
      role: 'viewer',
      department: 'Product',
      job_title: 'Product Analyst'
    }
  ];

  const userIds = {};
  const tx = db.transaction(() => {
    for (const u of users) {
      const info = insertUser.run({
        email: u.email,
        password_hash: bcrypt.hashSync(u.password, 10),
        name: u.name,
        role: u.role,
        department: u.department,
        job_title: u.job_title
      });
      userIds[u.role] = info.lastInsertRowid;
    }
  });
  tx();

  const adminId = userIds.admin;
  const editorId = userIds.editor;

  // Categories (Notice Board tabs) — the spec's launch set.
  const insertCat = db.prepare('INSERT INTO categories (slug, name, sort_order) VALUES (?, ?, ?)');
  const categories = [
    ['announcements', 'Announcements', 1],
    ['product-releases', 'Product & Releases', 2],
    ['business-updates', 'Business Updates', 3],
    ['people', 'People', 4],
    ['operations', 'Operations', 5]
  ];
  db.transaction(() => categories.forEach((c) => insertCat.run(...c)))();

  // Starter posts — a mix across categories, drawn from the spec mockup and
  // the previous hardcoded announcements.
  const insertPost = db.prepare(`
    INSERT INTO posts
      (title, slug, category_slug, summary, body, external_url, external_label,
       status, pinned, author_id, owner_id, review_date, published_at, created_at, updated_at)
    VALUES
      (@title, @slug, @category_slug, @summary, @body, @external_url, @external_label,
       @status, @pinned, @author_id, @owner_id, @review_date, @published_at, @created_at, @updated_at)
  `);

  const posts = [
    {
      title: 'Town hall moved to Thursday 14:00',
      slug: 'town-hall-moved-to-thursday',
      category_slug: 'announcements',
      summary: 'New slot so the Nairobi and Lagos teams can join live. Dial-in link is on the calendar invite and a recording goes up by Friday.',
      body: '<p>The Q3 company town hall has moved to <strong>Thursday at 14:00 SAST</strong> so colleagues in Nairobi and Lagos can join live.</p><p>The agenda is unchanged. The Microsoft Teams dial-in link is on your calendar invite, and a recording will be posted here by Friday for anyone on shift or on leave.</p>',
      external_url: '',
      external_label: '',
      pinned: 1,
      author_id: editorId,
      owner_id: editorId,
      review_offset: 60,
      published_offset: -2
    },
    {
      title: 'Virtual Football 4.2 ships to retail this week',
      slug: 'virtual-football-4-2-ships-to-retail',
      category_slug: 'product-releases',
      summary: 'New bet types, faster settlement on the terminal client, and a redesigned results screen. Support has the release notes and the rollback plan.',
      body: '<p>Virtual Football 4.2 rolls out to retail terminals this week.</p><ul><li><strong>New bet types</strong> across match and season markets.</li><li><strong>Faster settlement</strong> on the terminal client.</li><li>A <strong>redesigned results screen</strong> for clearer outcomes.</li></ul><p>Support has the full release notes and the rollback plan. Operators receive the go-live window separately.</p>',
      external_url: 'https://kiron.atlassian.net/wiki',
      external_label: 'Release notes on Confluence',
      pinned: 0,
      author_id: editorId,
      owner_id: adminId,
      review_offset: 45,
      published_offset: -7
    },
    {
      title: 'Generator test on Friday — 30 minutes without power in Building B',
      slug: 'generator-test-building-b',
      category_slug: 'operations',
      summary: 'Desks on floors 2 and 3 go dark from 09:00. Save your work and take laptops off the docks. Feeds and production are unaffected.',
      body: '<p>Facilities will run a generator test on <strong>Friday from 09:00</strong>. Desks on floors 2 and 3 of Building B will lose power for up to 30 minutes.</p><p>Please save your work and take laptops off the docks beforehand. Production systems and game feeds are on separate power and are unaffected.</p>',
      external_url: '',
      external_label: '',
      pinned: 0,
      author_id: adminId,
      owner_id: adminId,
      review_offset: 20,
      published_offset: -1
    },
    {
      title: 'H1 results: record first half across virtual sports',
      slug: 'h1-results-record-first-half',
      category_slug: 'business-updates',
      summary: 'Commercial growth in double digits, driven by virtual football and instant-win titles. Full numbers and the Q3 focus areas in plain language.',
      body: '<p>Kiron closed a record first half. Commercial growth was in double digits, led by virtual football and our instant-win portfolio, with strong momentum across African and European retail.</p><p>In plain language: more operators went live, existing operators grew, and engagement per terminal rose. Q3 focus is retail rollout depth and settlement speed. Steven will walk through the numbers at the town hall.</p>',
      external_url: '',
      external_label: '',
      pinned: 0,
      author_id: adminId,
      owner_id: adminId,
      review_offset: 90,
      published_offset: -10
    },
    {
      title: 'Welcome to our new joiners in Johannesburg and London',
      slug: 'new-joiners-jhb-london',
      category_slug: 'people',
      summary: 'Five new colleagues across game development, QA and commercial this month. Say hello on Teams and check the staff directory for their details.',
      body: '<p>A warm welcome to five colleagues joining us this month across game development, QA and commercial in Johannesburg and London.</p><p>Say hello on Teams, and find their roles and desks in the staff directory.</p>',
      external_url: '',
      external_label: '',
      pinned: 0,
      author_id: editorId,
      owner_id: editorId,
      review_offset: 30,
      published_offset: -4
    },
    {
      title: 'Draft: new leave policy — pending HR review',
      slug: 'draft-new-leave-policy',
      category_slug: 'announcements',
      summary: 'Working draft of the consolidated leave policy. Not yet published — awaiting sign-off from HR.',
      body: '<p>This is a working draft of the consolidated leave policy that will replace the version previously held in HiBob. It is not yet approved.</p>',
      external_url: '',
      external_label: '',
      status: 'draft',
      pinned: 0,
      author_id: editorId,
      owner_id: adminId,
      review_offset: -3, // already past its review date, to demonstrate the dashboard warning
      published_offset: null
    }
  ];

  const now = new Date().toISOString();
  db.transaction(() => {
    for (const p of posts) {
      insertPost.run({
        title: p.title,
        slug: p.slug,
        category_slug: p.category_slug,
        summary: p.summary,
        body: p.body,
        external_url: p.external_url || null,
        external_label: p.external_label || null,
        status: p.status || 'published',
        pinned: p.pinned || 0,
        author_id: p.author_id,
        owner_id: p.owner_id,
        review_date: p.review_offset == null ? null : isoDate(p.review_offset),
        published_at: p.published_offset == null ? null : daysFromNow(p.published_offset, 8, 30),
        created_at: now,
        updated_at: now
      });
    }
  })();

  // Quick Links — the curated shortcuts from the spec mockup.
  const insertLink = db.prepare(`
    INSERT INTO quick_links (title, subtitle, url, icon, category, sort_order, owner_id, review_date, is_active)
    VALUES (@title, @subtitle, @url, @icon, @category, @sort_order, @owner_id, @review_date, 1)
  `);
  const links = [
    ['Payslips & leave', 'ESS portal', 'https://ess.kironinteractive.com', '📄', 'HR', 1],
    ['Service desk', 'Raise a ticket', 'https://kiron.atlassian.net/servicedesk', '🛠️', 'IT', 2],
    ['Jira', 'Boards & sprints', 'https://kiron.atlassian.net', '🗂️', 'IT', 3],
    ['Confluence', 'Docs & runbooks', 'https://kiron.atlassian.net/wiki', '📚', 'IT', 4],
    ['Expense claims', 'Finance', 'https://expenses.kironinteractive.com', '💳', 'Finance', 5],
    ['Brand assets', 'Logos, decks, fonts', 'https://brand.kironinteractive.com', '⭐', 'Marketing', 6],
    ['Book a room', 'JHB office', 'https://rooms.kironinteractive.com', '📍', 'Facilities', 7],
    ['VPN & remote', 'Setup guide', 'https://vpn.kironinteractive.com', '🔐', 'IT', 8],
    ['Client status', 'Public page', 'https://status.kironinteractive.com', '📈', 'Product', 9],
    ['Staff directory', 'Find anyone', 'https://admin.microsoft.com', '👤', 'HR', 10]
  ];
  db.transaction(() => {
    for (const l of links) {
      insertLink.run({
        title: l[0], subtitle: l[1], url: l[2], icon: l[3],
        category: l[4], sort_order: l[5], owner_id: adminId, review_date: isoDate(120)
      });
    }
  })();

  // "Next Off" events for the countdown strip.
  const insertEvent = db.prepare(`
    INSERT INTO events (label, title, location, starts_at, is_active)
    VALUES (?, ?, ?, ?, 1)
  `);
  const events = [
    ['ALL HANDS', 'Company town hall', 'Auditorium + Teams', daysFromNow(3, 14, 0)],
    ['RELEASE', 'Virtual Football 4.2 go-live', 'Release window', daysFromNow(1, 22, 0)],
    ['FINANCE', 'Salaries paid', 'Payroll run', daysFromNow(6, 12, 0)],
    ['OPERATIONS', 'Generator test — Building B', 'Floors 2 & 3', daysFromNow(2, 9, 0)]
  ];
  db.transaction(() => events.forEach((e) => insertEvent.run(...e)))();

  console.log('=================================================================');
  console.log(' Seed complete. Sign in at /login with:');
  console.log(`   admin   ->  admin@kironinteractive.com   /  ${DEFAULT_ADMIN_PASSWORD}`);
  console.log('   editor  ->  editor@kironinteractive.com  /  KironEditor2026!');
  console.log('   viewer  ->  viewer@kironinteractive.com  /  KironViewer2026!');
  console.log(' Change these after first login (admin can manage users in the CMS).');
  console.log('=================================================================');
}

seed();

module.exports = db;
