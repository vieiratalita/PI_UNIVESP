function maskCPF(v) {
  v = (v || '').replace(/\D/g, '').slice(0, 11);
  if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  if (v.length > 3) return v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  return v;
}

function maskRG(v) {
  v = (v || '').replace(/[^\dXx]/g, '').toUpperCase().slice(0, 10);
  if (v.length > 8) return v.replace(/(\d{2})(\d{3})(\d{3})([\dX]+)/, '$1.$2.$3-$4');
  if (v.length > 5) return v.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
  if (v.length > 2) return v.replace(/(\d{2})(\d+)/, '$1.$2');
  return v;
}

function maskTelefone(v) {
  v = (v || '').replace(/\D/g, '').slice(0, 11);
  if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (v.length > 6)  return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  if (v.length > 2)  return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  if (v.length > 0)  return v.replace(/(\d{0,2})/, '($1');
  return v;
}

function maskCEP(v) {
  v = (v || '').replace(/\D/g, '').slice(0, 8);
  if (v.length > 5) return v.replace(/(\d{5})(\d{1,3})/, '$1-$2');
  return v;
}

const MASCARAS = {
  cpf: maskCPF,
  rg: maskRG,
  celular: maskTelefone,
  cep: maskCEP,
};

function attachMasks(root) {
  for (const [name, fn] of Object.entries(MASCARAS)) {
    const el = root.querySelector(`[name="${name}"]`);
    if (!el) continue;
    const formatar = () => {
      const formatted = fn(el.value);
      if (el.value !== formatted) {
        el.value = formatted;
        try { el.setSelectionRange(formatted.length, formatted.length); } catch {}
      }
    };
    el.addEventListener('input', formatar);
    el.addEventListener('blur', formatar);
    if (el.value) el.value = fn(el.value);
  }
}

function formatarValoresExistentes(root) {
  for (const [name, fn] of Object.entries(MASCARAS)) {
    const el = root.querySelector(`[name="${name}"]`);
    if (el && el.value) el.value = fn(el.value);
  }
}

async function buscarCep(cep, form) {
  const digits = (cep || '').replace(/\D/g, '');
  if (digits.length !== 8) return;
  const cepInput = form.elements.cep;
  if (cepInput) cepInput.dataset.loading = '1';
  try {
    const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!r.ok) return;
    const data = await r.json();
    if (data.erro) return;
    if (form.elements.logradouro) form.elements.logradouro.value = data.logradouro || '';
    if (form.elements.bairro)     form.elements.bairro.value     = data.bairro     || '';
    if (form.elements.cidade)     form.elements.cidade.value     = data.localidade || '';
    if (form.elements.estado && data.uf) form.elements.estado.value = data.uf;
    const numeroEl = form.elements.numero;
    if (numeroEl && !numeroEl.value) numeroEl.focus();
  } catch {
    /* falha silenciosa: usuário pode digitar manualmente */
  } finally {
    if (cepInput) delete cepInput.dataset.loading;
  }
}

function attachCepLookup(form) {
  const cepEl = form.elements.cep;
  if (!cepEl) return;
  const handler = () => buscarCep(cepEl.value, form);
  cepEl.addEventListener('blur', handler);
  cepEl.addEventListener('input', () => {
    if ((cepEl.value || '').replace(/\D/g, '').length === 8) handler();
  });
}
