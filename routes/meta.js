// Categories and global search.

const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/categories — Notice Board tabs.
router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT slug, name, sort_order FROM categories ORDER BY sort_order, name').all();
  res.json({ categories });
});

// GET /api/search?q=  — searches posts, quick links and people (the top-bar search).
router.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ posts: [], links: [], people: [] });
  const like = `%${q}%`;

  const posts = db.prepare(`
    SELECT title, slug, category_slug, summary
    FROM posts
    WHERE status = 'published' AND (title LIKE ? OR summary LIKE ? OR body LIKE ?)
    ORDER BY COALESCE(published_at, created_at) DESC LIMIT 8
  `).all(like, like, like);

  const links = db.prepare(`
    SELECT title, subtitle, url FROM quick_links
    WHERE is_active = 1 AND (title LIKE ? OR subtitle LIKE ? OR category LIKE ?)
    ORDER BY sort_order LIMIT 8
  `).all(like, like, like);

  const people = db.prepare(`
    SELECT name, department, job_title FROM users
    WHERE is_active = 1 AND (name LIKE ? OR department LIKE ? OR job_title LIKE ?)
    ORDER BY name LIMIT 8
  `).all(like, like, like);

  res.json({ posts, links, people });
});

module.exports = router;
