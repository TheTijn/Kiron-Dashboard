// Authentication routes: login, logout, and "who am I".

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    department: row.department,
    job_title: row.job_title,
    avatar_path: row.avatar_path
  };
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(String(email).trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }
  // Rotate the session on login to avoid fixation.
  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Session error' });
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.name = user.name;
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
    res.json({ user: publicUser(user), csrfToken: req.session.csrfToken });
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('kiron.sid');
    res.json({ ok: true });
  });
});

// GET /api/auth/me — current user + CSRF token (used to bootstrap the client)
router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    return req.session.destroy(() => res.status(401).json({ error: 'Not authenticated' }));
  }
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  res.json({ user: publicUser(user), csrfToken: req.session.csrfToken });
});

module.exports = router;
