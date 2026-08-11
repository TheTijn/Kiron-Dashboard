// Kiron Intranet "The Board" — Express application.
// Serves the public Board, the CMS, uploaded media, and the JSON API,
// with session auth and role gating. Keeps the Hostinger PORT convention.

const path = require('path');
const express = require('express');
const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);

const db = require('./db');
const { requireAuth, requireRole, csrfProtection } = require('./middleware/auth');
const { UPLOAD_DIR } = require('./lib/upload');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const linkRoutes = require('./routes/links');
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const metaRoutes = require('./routes/meta');

let port = process.env.PORT || 3000;
const isProduction = !!process.env.PORT;

const PUBLIC_DIR = path.join(__dirname, 'public');
const app = express();

app.disable('x-powered-by');
if (isProduction) app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// --- Sessions (persisted in SQLite so they survive restarts) ---
app.use(session({
  store: new SqliteStore({ client: db, expired: { clear: true, intervalMs: 900000 } }),
  name: 'kiron.sid',
  secret: process.env.SESSION_SECRET || 'kiron-board-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8 // 8 hours
  }
}));

// Uploaded media (stored outside PUBLIC_DIR).
app.use('/uploads', express.static(UPLOAD_DIR, { index: false }));

// --- API ---
const api = express.Router();
api.use('/auth', authRoutes);                 // login/logout are intentionally open
api.use(requireAuth);                          // everything below requires a session
api.use(csrfProtection);                       // and a valid CSRF token on writes
api.use('/', metaRoutes);                      // /api/categories, /api/search
api.use('/posts', postRoutes);
api.use('/links', linkRoutes);
api.use('/events', eventRoutes);
api.use('/users', userRoutes);
app.use('/api', api);

// Multer / body errors return clean JSON rather than an HTML stack trace.
app.use('/api', (err, req, res, next) => {
  console.error('API error:', err.message);
  res.status(err.status || 400).json({ error: err.message || 'Request failed' });
});

// --- HTML entry points (auth-gated) ---
const sendPage = (file) => (req, res) => res.sendFile(path.join(PUBLIC_DIR, file));

app.get('/login', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'login.html')));
app.get('/', requireAuth, sendPage('index.html'));

// CMS pages. Editors and admins reach the content tools; user management is admin-only.
app.get(['/admin', '/admin/'], requireAuth, requireRole('editor'), sendPage('admin/index.html'));
app.get('/admin/posts', requireAuth, requireRole('editor'), sendPage('admin/post-editor.html'));
app.get('/admin/links', requireAuth, requireRole('editor'), sendPage('admin/links.html'));
app.get('/admin/events', requireAuth, requireRole('editor'), sendPage('admin/events.html'));
app.get('/admin/users', requireAuth, requireRole('admin'), sendPage('admin/users.html'));

// Never serve raw .html files directly (pages are delivered via the guarded
// routes above); this keeps auth on the entry points from being bypassed.
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.toLowerCase().endsWith('.html')) {
    return res.redirect('/');
  }
  next();
});

// Static client assets (CSS, JS, SVGs) — scoped to PUBLIC_DIR only.
app.use(express.static(PUBLIC_DIR, { index: false, redirect: false }));

// 404
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

function startServer() {
  app.listen(port, () => {
    console.log('==================================================');
    console.log('Kiron Intranet "The Board" running');
    console.log(`Environment: ${isProduction ? 'Production (Hostinger)' : 'Development'}`);
    console.log(`Local URL:   http://localhost:${port}`);
    console.log('==================================================');
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (isProduction) {
        console.error(`CRITICAL: Port ${port} already in use in production!`);
        process.exit(1);
      }
      console.log(`Port ${port} in use locally, trying ${port + 1}...`);
      port += 1;
      startServer();
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
