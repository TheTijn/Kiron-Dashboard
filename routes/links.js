// Quick Links API — the curated shortcuts grid.

const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

const LINK_SELECT = `
  SELECT l.*, u.name AS owner_name
  FROM quick_links l
  LEFT JOIN users u ON u.id = l.owner_id
`;

// GET /api/links?scope=all
router.get('/', (req, res) => {
  const wantAll = req.query.scope === 'all';
  const role = req.session && req.session.role;
  if (wantAll && !(role === 'editor' || role === 'admin')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  const sql = `${LINK_SELECT} ${wantAll ? '' : 'WHERE l.is_active = 1'} ORDER BY l.sort_order, l.id`;
  const links = db.prepare(sql).all().map((l) => { l.is_active = !!l.is_active; return l; });
  res.json({ links });
});

function normalise(req) {
  const b = req.body || {};
  return {
    title: String(b.title || '').trim(),
    subtitle: String(b.subtitle || '').trim() || null,
    url: String(b.url || '').trim(),
    icon: String(b.icon || '').trim() || null,
    category: String(b.category || '').trim() || null,
    sort_order: Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 0,
    owner_id: b.owner_id ? Number(b.owner_id) : null,
    review_date: (b.review_date || '').trim() || null,
    is_active: b.is_active === false || b.is_active === 0 ? 0 : 1
  };
}

router.post('/', requireRole('editor'), (req, res) => {
  const d = normalise(req);
  if (!d.title || !d.url) return res.status(400).json({ error: 'Title and URL are required' });
  const info = db.prepare(`
    INSERT INTO quick_links (title, subtitle, url, icon, category, sort_order, owner_id, review_date, is_active)
    VALUES (@title, @subtitle, @url, @icon, @category, @sort_order, @owner_id, @review_date, @is_active)
  `).run(d);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/:id', requireRole('editor'), (req, res) => {
  const existing = db.prepare('SELECT id FROM quick_links WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Link not found' });
  const d = normalise(req);
  if (!d.title || !d.url) return res.status(400).json({ error: 'Title and URL are required' });
  db.prepare(`
    UPDATE quick_links SET title=@title, subtitle=@subtitle, url=@url, icon=@icon,
      category=@category, sort_order=@sort_order, owner_id=@owner_id,
      review_date=@review_date, is_active=@is_active
    WHERE id=@id
  `).run({ ...d, id: req.params.id });
  res.json({ id: Number(req.params.id) });
});

router.delete('/:id', requireRole('editor'), (req, res) => {
  const info = db.prepare('DELETE FROM quick_links WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Link not found' });
  res.json({ ok: true });
});

module.exports = router;
