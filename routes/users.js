// Users API. A basic id+name list is available to editors (for owner
// dropdowns); full user management is admin-only.

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

function publicUser(row) {
  return {
    id: row.id, email: row.email, name: row.name, role: row.role,
    department: row.department, job_title: row.job_title,
    is_active: !!row.is_active, created_at: row.created_at
  };
}

// GET /api/users?basic=1
//   basic=1  -> id + name only (editor+), for the "owner" dropdown
//   default  -> full list (admin only)
router.get('/', requireRole('editor'), (req, res) => {
  if (req.query.basic === '1') {
    const people = db.prepare('SELECT id, name, role FROM users WHERE is_active = 1 ORDER BY name').all();
    return res.json({ users: people });
  }
  if (req.session.role !== 'admin') return res.status(403).json({ error: 'Insufficient permissions' });
  const users = db.prepare('SELECT * FROM users ORDER BY name').all().map(publicUser);
  res.json({ users });
});

// POST /api/users — create (admin).
router.post('/', requireRole('admin'), (req, res) => {
  const b = req.body || {};
  const email = String(b.email || '').trim();
  const name = String(b.name || '').trim();
  const password = String(b.password || '');
  const role = ['admin', 'editor', 'viewer'].includes(b.role) ? b.role : 'viewer';
  if (!email || !name || password.length < 8) {
    return res.status(400).json({ error: 'Name, email and a password of 8+ characters are required' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'A user with that email already exists' });
  const info = db.prepare(`
    INSERT INTO users (email, password_hash, name, role, department, job_title)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(email, bcrypt.hashSync(password, 10), name, role,
    String(b.department || '').trim() || null, String(b.job_title || '').trim() || null);
  res.status(201).json({ id: info.lastInsertRowid });
});

// PUT /api/users/:id — update details/role/active + optional password (admin).
router.put('/:id', requireRole('admin'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const b = req.body || {};
  const name = String(b.name || user.name).trim();
  const role = ['admin', 'editor', 'viewer'].includes(b.role) ? b.role : user.role;
  const isActive = b.is_active === false || b.is_active === 0 ? 0 : 1;

  // Guard: never remove the last active admin.
  if ((user.role === 'admin') && (role !== 'admin' || !isActive)) {
    const otherAdmins = db.prepare(
      "SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND is_active = 1 AND id != ?"
    ).get(user.id).n;
    if (otherAdmins === 0) return res.status(400).json({ error: 'Cannot demote or disable the last admin' });
  }

  db.prepare(`
    UPDATE users SET name = ?, role = ?, department = ?, job_title = ?, is_active = ? WHERE id = ?
  `).run(name, role, String(b.department || '').trim() || null,
    String(b.job_title || '').trim() || null, isActive, user.id);

  if (b.password) {
    if (String(b.password).length < 8) return res.status(400).json({ error: 'Password must be 8+ characters' });
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(b.password, 10), user.id);
  }
  res.json({ id: user.id });
});

// DELETE /api/users/:id — delete (admin). Cannot delete self or the last admin.
router.delete('/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  if (id === req.session.userId) return res.status(400).json({ error: 'You cannot delete your own account' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') {
    const otherAdmins = db.prepare(
      "SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND is_active = 1 AND id != ?"
    ).get(id).n;
    if (otherAdmins === 0) return res.status(400).json({ error: 'Cannot delete the last admin' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
