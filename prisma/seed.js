const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\n]*)"?\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASS || 'admin123';

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    console.log(`Admin "${username}" já existe.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.create({ data: { username, passwordHash } });
  console.log(`Admin criado: ${username} / ${password}`);
  console.log('Troque a senha em produção.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
