const form = document.getElementById('form-inscricao');
const msg = document.getElementById('msg');
const btn = document.getElementById('btn-enviar');

attachMasks(form);
attachCepLookup(form);

const chkLgpd = document.getElementById('aceiteLgpd');
const chkIdade = document.getElementById('aceiteMaiorIdade');

function atualizarBotaoEnvio() {
  btn.disabled = !(chkLgpd.checked && chkIdade.checked);
}

chkLgpd.addEventListener('change', atualizarBotaoEnvio);
chkIdade.addEventListener('change', atualizarBotaoEnvio);
atualizarBotaoEnvio();

function mostrarMsg(tipo, texto) {
  msg.innerHTML = `<div class="alert ${tipo}">${texto}</div>`;
  msg.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.innerHTML = '';
  btn.disabled = true;
  btn.textContent = 'Enviando…';

  const fd = new FormData(form);
  const payload = {
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
    aceiteLgpd: fd.get('aceiteLgpd') === 'on',
    aceiteMaiorIdade: fd.get('aceiteMaiorIdade') === 'on',
    aceiteImagem: fd.get('aceiteImagem') === 'on',
  };

  try {
    const r = await fetch('/api/inscricoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) {
      const erros = body.erros || [body.error || 'Erro ao enviar.'];
      mostrarMsg('error', erros.join('<br>'));
    } else {
      window.location.href = '/obrigado.html';
      return;
    }
  } catch (err) {
    mostrarMsg('error', 'Falha de conexão. Tente novamente.');
  } finally {
    btn.textContent = 'Enviar inscrição';
    atualizarBotaoEnvio();
  }
});
