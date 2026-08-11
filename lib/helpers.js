// Small shared utilities used across routes.

const sanitizeHtml = require('sanitize-html');

// Turn a title into a URL-safe slug.
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'post';
}

// Guarantee a slug is unique within the posts table by appending -2, -3, ...
function uniqueSlug(db, base, ignoreId = null) {
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const row = ignoreId
      ? db.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').get(slug, ignoreId)
      : db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug);
    if (!row) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

// Allowlist-based HTML sanitisation for post bodies written in the CMS.
// Editors are trusted staff, but we still strip scripts/handlers to be safe.
function cleanBody(html) {
  return sanitizeHtml(String(html || ''), {
    allowedTags: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li',
      'blockquote', 'h2', 'h3', 'h4', 'hr', 'code', 'pre', 'span'
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      span: ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' })
    }
  });
}

// Plain-text escape for values rendered as text (defence in depth on the client too).
function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { slugify, uniqueSlug, cleanBody, escapeHtml };
