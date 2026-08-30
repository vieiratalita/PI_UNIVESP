const form = document.getElementById('form-login');
const msg = document.getElementById('msg');
const btn = document.getElementById('btn-login');

function limparErro() {
  msg.replaceChildren();
  for (const campo of form.elements) {
    campo.removeAttribute?.('aria-invalid');
    if (campo.getAttribute?.('aria-describedby') === 'login-error') {
      campo.removeAttribute('aria-describedby');
    }
  }
}

function mostrarErro(texto) {
  msg.replaceChildren();
  const alerta = document.createElement('div');
  alerta.id = 'login-error';
  alerta.className = 'alert error';
  alerta.setAttribute('role', 'alert');
  alerta.tabIndex = -1;
  alerta.textContent = texto;
  msg.append(alerta);
  for (const nome of ['username', 'password']) {
    const campo = form.elements.namedItem(nome);
    campo.setAttribute('aria-invalid', 'true');
    campo.setAttribute('aria-describedby', 'login-error');
  }
  alerta.focus();
}

form.addEventListener('input', limparErro);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  limparErro();
  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  btn.textContent = 'Entrando…';
  form.setAttribute('aria-busy', 'true');
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
      mostrarErro(body.error || 'Erro de login');
      return;
    }
    window.location.href = '/admin';
  } catch {
    mostrarErro('Falha de conexão.');
  } finally {
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    btn.textContent = 'Entrar';
    form.removeAttribute('aria-busy');
  }
});
