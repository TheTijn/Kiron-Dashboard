/*
  Kiron CMS — shared client helpers used by every admin page.
  Exposes window.Admin with: init(), api(), send(), esc(), toast(), confirmDialog().
*/
(function () {
  'use strict';

  const Admin = { user: null, csrf: null };

  Admin.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  Admin.toast = function (msg, isError) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = isError ? 'show error' : 'show';
    clearTimeout(Admin._tt);
    Admin._tt = setTimeout(() => { t.className = ''; }, 2800);
  };

  // GET JSON. Redirects to login on 401.
  Admin.api = async function (url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname + location.search); throw new Error('unauth'); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  // Mutating request (POST/PUT/DELETE) with CSRF header. `body` may be FormData or a plain object.
  Admin.send = async function (method, url, body) {
    const headers = { 'X-CSRF-Token': Admin.csrf || '' };
    let payload;
    if (body instanceof FormData) { payload = body; }
    else if (body != null) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
    const res = await fetch(url, { method, headers, body: payload });
    if (res.status === 401) { location.href = '/login'; throw new Error('unauth'); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  Admin.confirmDialog = function ({ title, message, confirmLabel = 'Delete', danger = true }) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'dialog-overlay';
      overlay.innerHTML = `
        <div class="dialog">
          <div class="dialog-head">${Admin.esc(title)}</div>
          <div class="dialog-body">${Admin.esc(message)}</div>
          <div class="dialog-foot">
            <button class="btn" data-x="cancel">Cancel</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-x="ok">${Admin.esc(confirmLabel)}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const close = (v) => { overlay.remove(); resolve(v); };
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.dataset.x === 'cancel') close(false);
        if (e.target.dataset.x === 'ok') close(true);
      });
    });
  };

  Admin.fmtDate = function (iso) {
    if (!iso) return '';
    const d = new Date(iso); if (isNaN(d)) return String(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Bootstrap: require an editor/admin session, then render the sidebar shell.
  Admin.init = async function (active) {
    let me;
    try { me = await Admin.api('/api/auth/me'); }
    catch (e) { return null; }
    if (me.user.role !== 'editor' && me.user.role !== 'admin') {
      document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">You do not have access to the CMS.</p>';
      return null;
    }
    Admin.user = me.user; Admin.csrf = me.csrfToken;
    renderSidebar(active);
    return Admin.user;
  };

  function renderSidebar(active) {
    const el = document.getElementById('sidebar');
    if (!el) return;
    const isAdmin = Admin.user.role === 'admin';
    const item = (key, href, ico, label) =>
      `<a class="nav-item${active === key ? ' active' : ''}" href="${href}"><span class="ico">${ico}</span>${label}</a>`;
    el.innerHTML = `
      <a class="brand" href="/admin">
        <span class="brand-word">KIRON<span class="brand-dot">.</span></span>
        <span class="brand-sub">CMS</span>
      </a>
      <div class="nav-label eyebrow">Content</div>
      ${item('dashboard', '/admin', '▤', 'Dashboard')}
      ${item('posts', '/admin/posts', '✎', 'New post')}
      ${item('links', '/admin/links', '🔗', 'Quick Links')}
      ${item('events', '/admin/events', '⏱', 'Next Off')}
      ${isAdmin ? `<div class="nav-label eyebrow">Admin</div>${item('users', '/admin/users', '👤', 'Users')}` : ''}
      <div class="sidebar-foot">
        <div class="who">
          <div class="n">${Admin.esc(Admin.user.name)}</div>
          <div class="r">${Admin.esc(Admin.user.role)}</div>
        </div>
        <a class="toplink" href="/" style="display:block;padding:6px 8px;">↗ View the Board</a>
        <button class="nav-item" id="admin-logout" style="width:100%;border:none;background:none;text-align:left;">
          <span class="ico">⎋</span>Sign out
        </button>
      </div>`;
    document.getElementById('admin-logout').addEventListener('click', async () => {
      await Admin.send('POST', '/api/auth/logout').catch(() => {});
      location.href = '/login';
    });
  }

  window.Admin = Admin;
})();
