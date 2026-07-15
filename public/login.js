const form = document.getElementById('form-login');
const msg = document.getElementById('msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.innerHTML = '';
  const fd = new FormData(form);
  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: fd.get('username'),
        password: fd.get('password'),
      }),
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      msg.innerHTML = `<div class="alert error">${body.error || 'Erro de login'}</div>`;
      return;
    }
    window.location.href = '/admin';
  } catch {
    msg.innerHTML = `<div class="alert error">Falha de conexão.</div>`;
  }
});
