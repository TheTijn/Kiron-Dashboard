// Authentication & authorisation guards, plus a light CSRF check.

const ROLE_RANK = { viewer: 1, editor: 2, admin: 3 };

// Require a signed-in user. HTML requests are redirected to /login;
// API requests get a 401 JSON response.
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  if (req.path.startsWith('/api/') || req.xhr || (req.get('accept') || '').includes('application/json')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.redirect('/login');
}

// Require at least the given role (viewer < editor < admin).
function requireRole(minRole) {
  return (req, res, next) => {
    const role = req.session && req.session.role;
    if (role && ROLE_RANK[role] >= ROLE_RANK[minRole]) return next();
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

// Simple synchroniser-token CSRF protection for mutating API calls.
// The token lives in the session and is echoed to the client by /api/auth/me;
// the client sends it back in the X-CSRF-Token header.
function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const sent = req.get('x-csrf-token');
  if (sent && req.session && sent === req.session.csrfToken) return next();
  return res.status(403).json({ error: 'Invalid CSRF token' });
}

module.exports = { requireAuth, requireRole, csrfProtection, ROLE_RANK };
