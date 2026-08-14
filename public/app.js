/*
  The Board — client logic.
  Bootstraps the signed-in user, then renders the Next Off strip, the Notice
  Board (with category tabs + post modal), Quick Links, and global search.
  All data comes from the guarded /api endpoints.
*/
(function () {
  'use strict';

  const state = { user: null, categories: [], activeCat: 'all', posts: [], events: [] };
  const $ = (id) => document.getElementById(id);

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }
  function toast(msg, isError) {
    const t = $('toast');
    t.textContent = msg; t.className = isError ? 'show error' : 'show';
    setTimeout(() => { t.className = ''; }, 2600);
  }
  async function api(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname); throw new Error('unauth'); }
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
    return res.json();
  }
  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  // ---------- bootstrap ----------
  async function boot() {
    let me;
    try { me = await api('/api/auth/me'); }
    catch (e) { return; } // redirected to login
    state.user = me.user;
    csrfToken = me.csrfToken;
    renderUser();
    startClock();
    await Promise.all([loadCategories(), loadLinks()]);
    await loadPosts();
    wireSearch();
  }

  function renderUser() {
    const u = state.user;
    $('user-avatar').textContent = initials(u.name);
    $('user-name').textContent = u.name;
    $('user-role').textContent = u.role;
    if (u.role === 'editor' || u.role === 'admin') $('cms-link').hidden = false;
  }

  // ---------- clock (SAST) ----------
  function startClock() {
    const el = $('clock-time');
    const tick = () => {
      el.textContent = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit'
      });
    };
    tick(); setInterval(tick, 15000);
  }

  // ---------- categories / tabs ----------
  async function loadCategories() {
    const { categories } = await api('/api/categories');
    state.categories = categories;
    const tabs = $('tabs');
    const mk = (slug, name, active) =>
      `<button class="tab${active ? ' active' : ''}" data-cat="${esc(slug)}"><span>${esc(name)}</span></button>`;
    tabs.innerHTML = mk('all', 'All', true) + categories.map((c) => mk(c.slug, c.name, false)).join('');
    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab'); if (!btn) return;
      state.activeCat = btn.dataset.cat;
      tabs.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === btn));
      loadPosts();
    });
  }

  // ---------- posts ----------
  async function loadPosts() {
    const list = $('post-list');
    list.innerHTML = '<div class="empty"><span class="spinner"></span></div>';
    const cat = state.activeCat === 'all' ? '' : `?category=${encodeURIComponent(state.activeCat)}`;
    const { posts } = await api('/api/posts' + cat);
    state.posts = posts;
    $('post-count').textContent = posts.length + (posts.length === 1 ? ' post' : ' posts');
    if (!posts.length) { list.innerHTML = '<div class="empty">No posts here yet.</div>'; return; }
    list.innerHTML = posts.map(renderPostRow).join('');
    list.querySelectorAll('.post').forEach((el) => {
      el.addEventListener('click', () => openPost(el.dataset.slug));
    });
  }

  function renderPostRow(p) {
    const pid = (p.category_slug || 'post').slice(0, 3).toUpperCase() + '-' + String(p.id).padStart(3, '0');
    const thumb = p.images && p.images[0]
      ? `<img class="post-thumb" src="${esc(p.images[0].file_path)}" alt="" loading="lazy">` : '';
    const pin = p.pinned ? '<span class="chip">Pinned</span>' : '';
    return `
      <article class="post" data-slug="${esc(p.slug)}">
        <div class="post-aside">
          <span class="pid">${esc(pid)}</span><br>${esc(fmtDate(p.published_at || p.created_at))}
        </div>
        <div>
          ${thumb}
          <h3 class="post-title">${esc(p.title)}</h3>
          <p class="post-summary">${esc(p.summary || '')}</p>
          <div class="post-meta">
            ${p.owner_name ? esc(p.owner_name) : (p.author_name ? esc(p.author_name) : 'Kiron')}
            <span class="sep">·</span>${esc(p.category_name || '')}
            ${pin ? '<span class="sep">·</span>' + pin : ''}
          </div>
        </div>
      </article>`;
  }

  // Fetch full post (with body + gallery) then show the modal.
  async function openPost(slug) {
    try {
      const { post } = await api('/api/posts/' + encodeURIComponent(slug));
      const gallery = (post.images || []).length
        ? `<div class="modal-gallery">${post.images.map((im) =>
            `<img src="${esc(im.file_path)}" alt="${esc(im.caption || '')}">`).join('')}</div>` : '';
      const external = post.external_url
        ? `<a class="modal-external" href="${esc(post.external_url)}" target="_blank" rel="noopener noreferrer">
             ${esc(post.external_label || 'Open link')} ↗</a>` : '';
      $('post-modal-body').innerHTML = `
        <span class="chip">${esc(post.category_name || 'Announcement')}</span>
        <h1>${esc(post.title)}</h1>
        <div class="modal-meta">
          ${esc(post.author_name || 'Kiron')}<span class="sep">·</span>
          ${esc(fmtDate(post.published_at || post.created_at))}
          ${post.pinned ? '<span class="sep">·</span><span class="chip">Pinned</span>' : ''}
        </div>
        ${gallery}
        <div class="modal-content">${post.body || '<p>' + esc(post.summary || '') + '</p>'}</div>
        ${external}
        ${post.owner_name ? `<div class="modal-owner">Owner: <strong>${esc(post.owner_name)}</strong>${
            post.review_date ? ' · Review by ' + esc(post.review_date) : ''}</div>` : ''}
      `;
      $('post-modal').hidden = false;
    } catch (e) { toast(e.message || 'Could not open post', true); }
  }
  function closeModal() { $('post-modal').hidden = true; }

  // ---------- quick links ----------
  async function loadLinks() {
    const { links } = await api('/api/links');
    $('link-grid').innerHTML = links.map((l) => `
      <a class="link-card" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
        <div class="link-ico">${esc(l.icon || '🔗')}</div>
        <div class="link-title">${esc(l.title)}</div>
        <div class="link-sub">${esc(l.subtitle || '')}</div>
      </a>`).join('') || '<div class="empty">No links yet.</div>';
  }

  // ---------- search ----------
  function wireSearch() {
    const input = $('search-input');
    const box = $('search-results');
    let timer = null;

    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
      if (e.key === 'Escape') { box.hidden = true; input.blur(); closeModal(); }
    });

    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length < 2) { box.hidden = true; return; }
      timer = setTimeout(async () => {
        try {
          const r = await api('/api/search?q=' + encodeURIComponent(q));
          renderSearch(r, q);
        } catch (_) { /* ignore */ }
      }, 200);
    });

    document.addEventListener('click', (e) => {
      if (!$('search').contains(e.target)) box.hidden = true;
    });

    function renderSearch(r, q) {
      const groups = [];
      if (r.posts.length) {
        groups.push(group('Announcements', r.posts.map((p) =>
          `<a class="search-item" data-slug="${esc(p.slug)}"><span class="t">${esc(p.title)}</span><span class="s">${esc(p.summary || '')}</span></a>`).join('')));
      }
      if (r.links.length) {
        groups.push(group('Quick Links', r.links.map((l) =>
          `<a class="search-item" href="${esc(l.url)}" target="_blank" rel="noopener"><span class="t">${esc(l.title)}</span><span class="s">${esc(l.subtitle || l.url)}</span></a>`).join('')));
      }
      if (r.people.length) {
        groups.push(group('People', r.people.map((p) =>
          `<div class="search-item"><span class="t">${esc(p.name)}</span><span class="s">${esc([p.job_title, p.department].filter(Boolean).join(' · '))}</span></div>`).join('')));
      }
      box.innerHTML = groups.length ? groups.join('')
        : `<div class="empty">No matches for “${esc(q)}”.</div>`;
      box.hidden = false;
      box.querySelectorAll('.search-item[data-slug]').forEach((el) =>
        el.addEventListener('click', () => { box.hidden = true; input.value = ''; openPost(el.dataset.slug); }));
    }
    function group(label, items) {
      return `<div class="search-group"><div class="search-group-label eyebrow">${esc(label)}</div>${items}</div>`;
    }
  }

  // ---------- user menu & modal wiring ----------
  function wireChrome() {
    $('user-btn').addEventListener('click', () => {
      const dd = $('user-dropdown'); dd.hidden = !dd.hidden;
    });
    document.addEventListener('click', (e) => {
      if (!$('usermenu').contains(e.target)) $('user-dropdown').hidden = true;
    });
    $('logout-btn').addEventListener('click', async () => {
      await fetch('/api/auth/logout', { method: 'POST', headers: csrfHeader() });
      location.href = '/login';
    });
    $('post-modal-close').addEventListener('click', closeModal);
    $('post-modal').addEventListener('click', (e) => { if (e.target === $('post-modal')) closeModal(); });
  }

  // Logout is a POST, so it needs the CSRF token (captured in boot() from /me).
  let csrfToken = null;
  function csrfHeader() { return csrfToken ? { 'X-CSRF-Token': csrfToken } : {}; }

  document.addEventListener('DOMContentLoaded', () => {
    wireChrome();
    boot();
  });
})();
