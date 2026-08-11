// Notice Board posts API — the "blog" at the heart of the intranet.

const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');
const { slugify, uniqueSlug, cleanBody } = require('../lib/helpers');
const { upload } = require('../lib/upload');

const router = express.Router();

const POST_SELECT = `
  SELECT p.*,
         author.name AS author_name,
         owner.name  AS owner_name,
         c.name      AS category_name
  FROM posts p
  LEFT JOIN users author ON author.id = p.author_id
  LEFT JOIN users owner  ON owner.id  = p.owner_id
  LEFT JOIN categories c ON c.slug    = p.category_slug
`;

function attachImages(post) {
  if (!post) return post;
  post.images = db
    .prepare('SELECT id, file_path, caption, sort_order FROM post_images WHERE post_id = ? ORDER BY sort_order, id')
    .all(post.id);
  post.pinned = !!post.pinned;
  return post;
}

function canEdit(req) {
  const role = req.session && req.session.role;
  return role === 'editor' || role === 'admin';
}

// GET /api/posts?category=&q=&scope=all
// Public list is published-only; scope=all (drafts included) requires editor+.
router.get('/', (req, res) => {
  const { category, q, scope } = req.query;
  const wantAll = scope === 'all';
  if (wantAll && !canEdit(req)) return res.status(403).json({ error: 'Insufficient permissions' });

  const where = [];
  const params = [];
  if (!wantAll) where.push("p.status = 'published'");
  if (category && category !== 'all') { where.push('p.category_slug = ?'); params.push(category); }
  if (q) {
    where.push('(p.title LIKE ? OR p.summary LIKE ? OR p.body LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  const sql = `${POST_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY p.pinned DESC,
             COALESCE(p.published_at, p.created_at) DESC`;
  const rows = db.prepare(sql).all(...params).map((r) => { r.pinned = !!r.pinned; return r; });
  res.json({ posts: rows });
});

// GET /api/posts/id/:id — full record for the CMS editor (editor+).
router.get('/id/:id', requireRole('editor'), (req, res) => {
  const post = db.prepare(`${POST_SELECT} WHERE p.id = ?`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json({ post: attachImages(post) });
});

// GET /api/posts/:slug — single published post (drafts require editor+).
router.get('/:slug', (req, res) => {
  const post = db.prepare(`${POST_SELECT} WHERE p.slug = ?`).get(req.params.slug);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.status !== 'published' && !canEdit(req)) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json({ post: attachImages(post) });
});

function normalisePost(req) {
  const b = req.body || {};
  const status = b.status === 'published' ? 'published' : 'draft';
  return {
    title: String(b.title || '').trim(),
    category_slug: String(b.category_slug || 'announcements'),
    summary: String(b.summary || '').trim(),
    body: cleanBody(b.body),
    external_url: (b.external_url || '').trim() || null,
    external_label: (b.external_label || '').trim() || null,
    status,
    pinned: b.pinned ? 1 : 0,
    owner_id: b.owner_id ? Number(b.owner_id) : null,
    review_date: (b.review_date || '').trim() || null
  };
}

// POST /api/posts — create (editor+).
router.post('/', requireRole('editor'), (req, res) => {
  const data = normalisePost(req);
  if (!data.title) return res.status(400).json({ error: 'Title is required' });
  const slug = uniqueSlug(db, slugify(data.title));
  const publishedAt = data.status === 'published' ? new Date().toISOString() : null;
  const info = db.prepare(`
    INSERT INTO posts (title, slug, category_slug, summary, body, external_url, external_label,
                       status, pinned, author_id, owner_id, review_date, published_at)
    VALUES (@title, @slug, @category_slug, @summary, @body, @external_url, @external_label,
            @status, @pinned, @author_id, @owner_id, @review_date, @published_at)
  `).run({ ...data, slug, author_id: req.session.userId, published_at: publishedAt });
  res.status(201).json({ id: info.lastInsertRowid, slug });
});

// PUT /api/posts/:id — update (editor+).
router.put('/:id', requireRole('editor'), (req, res) => {
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });
  const data = normalisePost(req);
  if (!data.title) return res.status(400).json({ error: 'Title is required' });

  // Keep the slug stable unless the title changed; then re-slug uniquely.
  let slug = existing.slug;
  if (data.title !== existing.title) slug = uniqueSlug(db, slugify(data.title), existing.id);

  // Set published_at the first time a post becomes published.
  let publishedAt = existing.published_at;
  if (data.status === 'published' && !existing.published_at) publishedAt = new Date().toISOString();
  if (data.status === 'draft') publishedAt = null;

  db.prepare(`
    UPDATE posts SET
      title=@title, slug=@slug, category_slug=@category_slug, summary=@summary, body=@body,
      external_url=@external_url, external_label=@external_label, status=@status, pinned=@pinned,
      owner_id=@owner_id, review_date=@review_date, published_at=@published_at,
      updated_at=datetime('now')
    WHERE id=@id
  `).run({ ...data, slug, published_at: publishedAt, id: existing.id });
  res.json({ id: existing.id, slug });
});

// DELETE /api/posts/:id — delete (editor+). Images cascade.
router.delete('/:id', requireRole('editor'), (req, res) => {
  const info = db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Post not found' });
  res.json({ ok: true });
});

// POST /api/posts/:id/images — attach photos (editor+).
router.post('/:id/images', requireRole('editor'), upload.array('photos', 12), (req, res) => {
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const maxRow = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM post_images WHERE post_id = ?').get(post.id);
  let order = maxRow.m;
  const insert = db.prepare('INSERT INTO post_images (post_id, file_path, caption, sort_order) VALUES (?, ?, ?, ?)');
  const added = [];
  db.transaction(() => {
    for (const f of req.files || []) {
      order += 1;
      const filePath = `/uploads/${f.filename}`;
      const info = insert.run(post.id, filePath, '', order);
      added.push({ id: info.lastInsertRowid, file_path: filePath });
    }
  })();
  res.status(201).json({ images: added });
});

// DELETE /api/posts/:id/images/:imageId — remove a photo (editor+).
router.delete('/:id/images/:imageId', requireRole('editor'), (req, res) => {
  const info = db.prepare('DELETE FROM post_images WHERE id = ? AND post_id = ?')
    .run(req.params.imageId, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Image not found' });
  res.json({ ok: true });
});

module.exports = router;
