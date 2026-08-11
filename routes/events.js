// "Next Off" events API — the countdown strip.

const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/events?scope=all
// Public view shows active, upcoming events; scope=all (editor+) shows everything.
router.get('/', (req, res) => {
  const wantAll = req.query.scope === 'all';
  const role = req.session && req.session.role;
  if (wantAll && !(role === 'editor' || role === 'admin')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  const sql = wantAll
    ? 'SELECT * FROM events ORDER BY starts_at'
    : "SELECT * FROM events WHERE is_active = 1 AND starts_at >= datetime('now') ORDER BY starts_at LIMIT 4";
  const events = db.prepare(sql).all().map((e) => { e.is_active = !!e.is_active; return e; });
  res.json({ events });
});

function normalise(req) {
  const b = req.body || {};
  return {
    label: String(b.label || '').trim(),
    title: String(b.title || '').trim(),
    location: String(b.location || '').trim() || null,
    starts_at: String(b.starts_at || '').trim(),
    is_active: b.is_active === false || b.is_active === 0 ? 0 : 1
  };
}

router.post('/', requireRole('editor'), (req, res) => {
  const d = normalise(req);
  if (!d.label || !d.title || !d.starts_at) {
    return res.status(400).json({ error: 'Label, title and start time are required' });
  }
  const info = db.prepare(`
    INSERT INTO events (label, title, location, starts_at, is_active)
    VALUES (@label, @title, @location, @starts_at, @is_active)
  `).run(d);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/:id', requireRole('editor'), (req, res) => {
  const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });
  const d = normalise(req);
  if (!d.label || !d.title || !d.starts_at) {
    return res.status(400).json({ error: 'Label, title and start time are required' });
  }
  db.prepare(`
    UPDATE events SET label=@label, title=@title, location=@location,
      starts_at=@starts_at, is_active=@is_active WHERE id=@id
  `).run({ ...d, id: req.params.id });
  res.json({ id: Number(req.params.id) });
});

router.delete('/:id', requireRole('editor'), (req, res) => {
  const info = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Event not found' });
  res.json({ ok: true });
});

module.exports = router;
