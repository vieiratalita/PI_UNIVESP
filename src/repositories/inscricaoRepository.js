const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listar({ busca } = {}) {
  const where = busca
    ? {
        OR: [
          { nomeCompleto: { contains: busca } },
          { email: { contains: busca } },
          { cpf: { contains: busca } },
          { cidade: { contains: busca } },
        ],
      }
    : {};
  return prisma.inscricao.findMany({ where, orderBy: { createdAt: 'desc' } });
}

async function buscarPorId(id) {
  return prisma.inscricao.findUnique({ where: { id } });
}

async function criar(dados) {
  return prisma.inscricao.create({ data: dados });
}

async function atualizar(id, dados) {
  return prisma.inscricao.update({ where: { id }, data: dados });
}

async function remover(id) {
  return prisma.inscricao.delete({ where: { id } });
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
