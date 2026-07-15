const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function buscarPorUsername(username) {
  return prisma.admin.findUnique({ where: { username } });
}

async function criar({ username, passwordHash }) {
  return prisma.admin.create({ data: { username, passwordHash } });
}

module.exports = { buscarPorUsername, criar };
