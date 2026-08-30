# Amecomex — Sistema de Inscrições

Sistema web para recebimento e administração de inscrições da **Associação de Mulheres Especialistas em Comércio Exterior (Amecomex)**.

A aplicação oferece um formulário público de inscrição e uma área administrativa autenticada para buscar, criar, consultar, editar e excluir registros.

## Funcionalidades

### Área pública

- formulário de inscrição com dados pessoais, endereço e consentimentos;
- máscaras para CPF, RG, telefone e CEP;
- consulta automática de endereço pelo ViaCEP;
- validação de campos com mensagens acessíveis;
- página de confirmação após o envio.

### Área administrativa

- autenticação por usuário e senha;
- listagem e busca de inscrições;
- criação e edição em diálogo modal;
- exclusão com confirmação;
- exibição das datas de criação e atualização;
- encerramento da sessão administrativa.

### Acessibilidade

- navegação completa por teclado;
- labels associados aos campos;
- foco visível;
- erros relacionados aos respectivos controles;
- mensagens de erro, sucesso e carregamento anunciadas por leitores de tela;
- diálogo administrativo baseado no elemento nativo `<dialog>`;
- estrutura semântica e suporte a reflow em telas estreitas.

## Tecnologias

- **Node.js** e **Express** no servidor;
- **HTML, CSS e JavaScript nativos** no frontend;
- **Prisma ORM** para acesso a dados;
- **SQLite** como banco de dados;
- **express-session** para sessões administrativas;
- **bcryptjs** para hash e comparação de senhas;
- **ViaCEP** para preenchimento assistido do endereço.

## Requisitos

- Node.js 20 ou superior recomendado;
- npm;
- acesso à internet somente para baixar as dependências, carregar a fonte Inter e consultar o ViaCEP.

Confira as versões instaladas:

```bash
node --version
npm --version
```

## Início rápido

### 1. Instale as dependências

Com o repositório clonado, acesse a pasta do projeto:

```bash
cd PI_UNIVESP
npm ci
```

`npm ci` instala exatamente as versões registradas em `package-lock.json`. Durante desenvolvimento, `npm install` também pode ser utilizado quando for necessário atualizar o lockfile.

### 2. Crie o arquivo `.env`

Crie um arquivo chamado `.env` na raiz do projeto:

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="substitua-por-um-segredo-longo-e-aleatorio"
PORT=3000
ADMIN_USER="admin"
ADMIN_PASS="troque-esta-senha"
```

O projeto carrega esse arquivo diretamente em `server.js` e `prisma/seed.js`; não é necessário instalar o pacote `dotenv`.

Variáveis disponíveis:

| Variável | Obrigatória | Padrão | Finalidade |
|---|---:|---|---|
| `DATABASE_URL` | Sim | — | Endereço do banco utilizado pelo Prisma. |
| `SESSION_SECRET` | Recomendada | `change-me` | Assina o cookie da sessão administrativa. Deve ser alterada fora do desenvolvimento local. |
| `PORT` | Não | `3000` | Porta HTTP do servidor. |
| `ADMIN_USER` | Não | `admin` | Usuário criado pelo script de seed. |
| `ADMIN_PASS` | Não | `admin123` | Senha do usuário criado pelo script de seed. |

> Não versione o arquivo `.env`. Ele já está listado no `.gitignore`.

### 3. Gere o cliente Prisma

```bash
npm run db:generate
```

### 4. Crie ou atualize o banco SQLite

```bash
npm run db:push
```

Com a configuração indicada, o arquivo do banco será criado em `prisma/dev.db` e permanecerá fora do Git.

### 5. Crie o usuário administrativo inicial

```bash
npm run seed
```

O usuário e a senha são lidos de `ADMIN_USER` e `ADMIN_PASS`. Caso essas variáveis não estejam definidas, serão usados `admin` e `admin123`.

O seed não substitui um usuário que já existe. Alterar `ADMIN_PASS` depois da primeira execução não modifica automaticamente a senha armazenada.

### 6. Inicie o sistema

Modo normal:

```bash
npm start
```

Modo de desenvolvimento, reiniciando o servidor quando os arquivos JavaScript mudarem:

```bash
npm run dev
```

Quando o servidor estiver pronto, o terminal exibirá:

```text
Servidor rodando em http://localhost:3000
```

## Endereços da aplicação

Considerando a porta padrão `3000`:

| Área | Endereço |
|---|---|
| Formulário público | <http://localhost:3000/> |
| Login administrativo | <http://localhost:3000/login.html> |
| Administração | <http://localhost:3000/admin> |
| Confirmação de inscrição | <http://localhost:3000/obrigado.html> |

O caminho `/admin` verifica a sessão e redireciona para o login quando necessário.

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm start` | Executa o servidor com Node.js. |
| `npm run dev` | Executa o servidor com `node --watch`. |
| `npm run db:generate` | Gera o Prisma Client a partir do schema. |
| `npm run db:push` | Sincroniza o schema com o banco configurado. |
| `npm run seed` | Cria o usuário administrativo inicial. |

O projeto ainda não possui scripts automatizados de teste ou lint.

## Estrutura do projeto

```text
PI_UNIVESP/
├── prisma/
│   ├── schema.prisma             # Modelos Inscricao e Admin
│   └── seed.js                   # Criação do administrador inicial
├── public/
│   ├── index.html                # Formulário público
│   ├── form.js                   # Validação e envio da inscrição
│   ├── masks.js                  # Máscaras e consulta de CEP
│   ├── login.html                # Página de autenticação
│   ├── login.js                  # Fluxo de login
│   ├── admin.html                # Interface administrativa
│   ├── admin.js                  # Busca e CRUD administrativo
│   ├── obrigado.html             # Confirmação de envio
│   └── styles.css                # Estilos compartilhados
├── src/
│   ├── repositories/             # Acesso ao banco com Prisma
│   └── services/                 # Regras e validações da aplicação
├── server.js                     # Express, sessões, rotas e arquivos estáticos
├── package.json                  # Dependências e scripts
├── DOCUMENTACAO.md               # Documentação técnica detalhada
└── APRESENTACAO.md                # Material de apoio para apresentação
```

## Arquitetura

O fluxo principal segue estas camadas:

```text
Navegador
   ↓ HTTP/JSON
Rotas Express — server.js
   ↓
Services — validações e regras de aplicação
   ↓
Repositories — operações de persistência
   ↓
Prisma Client
   ↓
SQLite
```

O frontend é multipágina e não depende de framework ou etapa de build. O Express serve diretamente os arquivos da pasta `public`.

## Banco de dados

O schema contém dois modelos:

- `Inscricao`: dados pessoais, endereço, consentimentos e timestamps;
- `Admin`: usuário, hash da senha e data de criação.

Para recriar o banco local, pare o servidor, remova manualmente `prisma/dev.db` e execute novamente:

```bash
npm run db:push
npm run seed
```

> A recriação apaga todas as inscrições locais. Faça backup do arquivo antes se houver dados importantes.

## API

### Inscrição pública

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/inscricoes` | Valida e cria uma inscrição pública. |

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/login` | Autentica o administrador e cria a sessão. |
| `POST` | `/api/auth/logout` | Encerra a sessão atual. |
| `GET` | `/api/auth/me` | Retorna o estado da sessão. |

### Administração

As rotas abaixo exigem uma sessão autenticada:

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/admin/inscricoes` | Lista inscrições; aceita busca pelo parâmetro `q`. |
| `GET` | `/api/admin/inscricoes/:id` | Retorna uma inscrição. |
| `POST` | `/api/admin/inscricoes` | Cria uma inscrição pela administração. |
| `PUT` | `/api/admin/inscricoes/:id` | Atualiza uma inscrição. |
| `DELETE` | `/api/admin/inscricoes/:id` | Exclui uma inscrição. |

## Verificações manuais recomendadas

Depois de uma alteração, confira pelo menos:

1. preenchimento e envio do formulário público;
2. mensagens exibidas para campos inválidos;
3. consulta de CEP e possibilidade de preenchimento manual;
4. login e logout administrativo;
5. busca, criação, edição e exclusão de inscrições;
6. navegação somente com Tab, Shift+Tab, Enter, Espaço e Escape;
7. diálogo administrativo e retorno do foco ao fechá-lo;
8. layout em tela pequena e com zoom de 200%;
9. console do navegador e terminal do servidor.

Para verificar a sintaxe dos scripts sem instalar ferramentas adicionais:

```bash
node --check public/form.js
node --check public/login.js
node --check public/admin.js
node --check public/masks.js
```

## Solução de problemas

### `Cannot find module 'express'`

As dependências ainda não foram instaladas ou a pasta `node_modules` está incompleta:

```bash
npm ci
```

### Prisma informa que `DATABASE_URL` não está definida

Confirme que o arquivo `.env` está na raiz do projeto e contém:

```env
DATABASE_URL="file:./dev.db"
```

### Prisma informa que uma tabela não existe

Sincronize o schema e execute o seed:

```bash
npm run db:push
npm run seed
```

### Erro `EPERM` ao gerar o Prisma Client no Windows

O servidor pode estar usando o arquivo do mecanismo Prisma. Pare `npm start` ou `npm run dev` com `Ctrl+C` e execute novamente:

```bash
npm run db:generate
```

### O login padrão não funciona

- confirme se `npm run seed` foi executado;
- use as credenciais definidas no `.env` no momento do seed;
- lembre que executar o seed novamente não altera a senha de um usuário já existente.

### A porta já está em uso

Defina outra porta no `.env`:

```env
PORT=3001
```

Depois, acesse <http://localhost:3001/>.

### O endereço não é preenchido pelo CEP

A consulta depende do serviço externo ViaCEP. Verifique a conexão e, se o serviço estiver indisponível, preencha os campos de endereço manualmente.

## Considerações para produção

Antes de publicar o sistema:

- defina um `SESSION_SECRET` longo e aleatório;
- use uma senha administrativa forte e não mantenha os valores padrão;
- configure HTTPS e cookies seguros;
- substitua o armazenamento padrão em memória do `express-session` por um store persistente;
- avalie um banco de dados apropriado ao ambiente e uma estratégia de backup;
- restrinja acesso ao banco e às variáveis de ambiente;
- configure logs, monitoramento e tratamento de indisponibilidade;
- revise proteção contra abuso, rate limiting e políticas de retenção de dados;
- realize testes com leitores de tela e zoom real de navegador.

## Documentação adicional

- [`DOCUMENTACAO.md`](DOCUMENTACAO.md): arquitetura e detalhes técnicos;
- [`APRESENTACAO.md`](APRESENTACAO.md): material de apresentação do projeto;
- [`LICENSE`](LICENSE): licença do repositório.
