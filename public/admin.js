const lista = document.getElementById('lista');
const msg = document.getElementById('msg');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalMsg = document.getElementById('modal-msg');
const form = document.getElementById('form-admin');
const btnNovo = document.getElementById('btn-novo');
const btnCancelar = document.getElementById('btn-cancelar');
const btnLogout = document.getElementById('btn-logout');
const who = document.getElementById('who');
const inputBusca = document.getElementById('q');

function escapar(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function alerta(target, tipo, texto) {
  target.innerHTML = `<div class="alert ${tipo}">${texto}</div>`;
}

async function carregarSessao() {
  const r = await fetch('/api/auth/me');
  if (!r.ok) { window.location.href = '/login.html'; return; }
  const data = await r.json();
  who.textContent = data.username ? `(${data.username})` : '';
}

async function carregarLista() {
  const q = inputBusca.value.trim();
  const url = q ? `/api/admin/inscricoes?q=${encodeURIComponent(q)}` : '/api/admin/inscricoes';
  const r = await fetch(url);
  if (r.status === 401) { window.location.href = '/login.html'; return; }
  const dados = await r.json();
  renderizar(dados);
}

function renderizar(itens) {
  const badge = document.getElementById('total-badge');
  if (badge) {
    badge.innerHTML = itens.length
      ? `<span class="badge">${itens.length} ${itens.length === 1 ? 'inscrita' : 'inscritas'}</span>`
      : '';
  }
  if (!itens.length) {
    lista.innerHTML = `
      <div class="empty">
        <div class="empty-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11h-6"/></svg>
        </div>
        <div class="empty-title">Nenhuma inscrição encontrada</div>
        <p>Tente ajustar a busca ou crie uma nova inscrição.</p>
      </div>`;
    return;
  }
  const linhas = itens.map((i) => `
    <tr>
      <td class="nome">${escapar(i.nomeCompleto)}</td>
      <td class="muted-cell">${escapar(i.email)}</td>
      <td class="muted-cell">${escapar(i.celular)}</td>
      <td>${escapar(i.cidade)}/${escapar(i.estado)}</td>
      <td class="muted-cell">${formatarDataHora(i.createdAt)}</td>
      <td class="muted-cell">${formatarDataHora(i.updatedAt)}</td>
      <td class="acoes">
        <button class="ghost sm" data-edit="${i.id}">Editar</button>
        <button class="danger sm" data-del="${i.id}">Excluir</button>
      </td>
    </tr>
  `).join('');
  lista.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Nome</th><th>E-mail</th><th>Celular</th><th>Cidade/UF</th><th>Inscrita em</th><th>Atualizada em</th><th></th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;
}

function formatarDataHora(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function abrirModal(titulo, dados) {
  modalTitle.textContent = titulo;
  modalMsg.innerHTML = '';
  form.reset();
  for (const [k, v] of Object.entries(dados || {})) {
    const el = form.elements.namedItem(k);
    if (!el) continue;
    if (el.type === 'checkbox') el.checked = !!v;
    else if (el.type === 'date' && v) el.value = new Date(v).toISOString().slice(0, 10);
    else el.value = v ?? '';
  }
  formatarValoresExistentes(form);

  const ts = document.getElementById('modal-timestamps');
  if (dados && dados.id && (dados.createdAt || dados.updatedAt)) {
    ts.innerHTML = `
      <strong>Inscrita em:</strong> ${formatarDataHora(dados.createdAt)}
      &nbsp;·&nbsp;
      <strong>Atualizada em:</strong> ${formatarDataHora(dados.updatedAt)}
    `;
    ts.style.display = 'block';
  } else {
    ts.style.display = 'none';
  }

  modal.classList.add('show');
}

function fecharModal() { modal.classList.remove('show'); }

function coletarPayload() {
  const fd = new FormData(form);
  return {
    nomeCompleto: fd.get('nomeCompleto'),
    comoPrefereChamada: fd.get('comoPrefereChamada'),
    dataNascimento: fd.get('dataNascimento'),
    email: fd.get('email'),
    celular: fd.get('celular'),
    rg: fd.get('rg'),
    cpf: fd.get('cpf'),
    cep: fd.get('cep'),
    logradouro: fd.get('logradouro'),
    numero: fd.get('numero'),
    complemento: fd.get('complemento'),
    bairro: fd.get('bairro'),
    cidade: fd.get('cidade'),
    estado: fd.get('estado'),
  };
}

btnNovo.addEventListener('click', () => abrirModal('Nova inscrição', { id: '' }));
btnCancelar.addEventListener('click', fecharModal);
modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });

btnLogout.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
});

inputBusca.addEventListener('input', () => {
  clearTimeout(inputBusca._t);
  inputBusca._t = setTimeout(carregarLista, 250);
});

lista.addEventListener('click', async (e) => {
  const editId = e.target.getAttribute('data-edit');
  const delId = e.target.getAttribute('data-del');
  if (editId) {
    const r = await fetch(`/api/admin/inscricoes/${editId}`);
    if (!r.ok) { alerta(msg, 'error', 'Não foi possível carregar a inscrição.'); return; }
    const dados = await r.json();
    abrirModal('Editar inscrição', { ...dados, id: dados.id });
  }
  if (delId) {
    if (!confirm('Excluir esta inscrição?')) return;
    const r = await fetch(`/api/admin/inscricoes/${delId}`, { method: 'DELETE' });
    if (!r.ok) alerta(msg, 'error', 'Erro ao excluir.');
    else { alerta(msg, 'success', 'Inscrição excluída.'); carregarLista(); }
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  modalMsg.innerHTML = '';
  const id = form.elements.namedItem('id').value;
  const payload = coletarPayload();
  const url = id ? `/api/admin/inscricoes/${id}` : '/api/admin/inscricoes';
  const method = id ? 'PUT' : 'POST';
  try {
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) {
      const erros = body.erros || [body.error || 'Erro ao salvar.'];
      alerta(modalMsg, 'error', erros.join('<br>'));
      return;
    }
    fecharModal();
    alerta(msg, 'success', id ? 'Inscrição atualizada.' : 'Inscrição criada.');
    carregarLista();
  } catch {
    alerta(modalMsg, 'error', 'Falha de conexão.');
  }
});

attachMasks(form);
attachCepLookup(form);
carregarSessao().then(carregarLista);
