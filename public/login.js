// Login form handler.
(function () {
  const form = document.getElementById('login-form');
  const errBox = document.getElementById('error');
  const submit = document.getElementById('submit');

  // If a "next" destination was passed, honour it after login (default: /).
  const params = new URLSearchParams(location.search);
  const next = params.get('next') || '/';

  function showError(msg) {
    errBox.textContent = msg;
    errBox.classList.add('show');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.classList.remove('show');
    submit.disabled = true;
    const original = submit.textContent;
    submit.textContent = 'Signing in…';
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('email').value.trim(),
          password: document.getElementById('password').value
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(data.error || 'Sign in failed. Please try again.');
        submit.disabled = false;
        submit.textContent = original;
        return;
      }
      location.href = next.startsWith('/') ? next : '/';
    } catch (err) {
      showError('Network error. Please try again.');
      submit.disabled = false;
      submit.textContent = original;
    }
  });
})();
