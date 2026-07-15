const bcrypt = require('bcryptjs');
const adminRepo = require('../repositories/adminRepository');

class AuthError extends Error {
  constructor(msg = 'Credenciais inválidas') {
    super(msg);
    this.status = 401;
  }
}

async function autenticar(username, password) {
  if (!username || !password) throw new AuthError();
  const admin = await adminRepo.buscarPorUsername(username);
  if (!admin) throw new AuthError();
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) throw new AuthError();
  return { id: admin.id, username: admin.username };
}

module.exports = { autenticar, AuthError };
