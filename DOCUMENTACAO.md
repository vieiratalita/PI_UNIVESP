# Amecomex — Sistema de Inscrições

Aplicação Node.js que substitui o antigo formulário Google da **Associação de Mulheres Especialistas em Comércio Exterior (AMECOMEX)**. Cadastros públicos via formulário web e gerenciamento administrativo (CRUD) protegido por login.

---

## 1. Stack

| Camada     | Tecnologia                                          |
| ---------- | --------------------------------------------------- |
| Runtime    | Node.js (CommonJS, JS puro)                         |
| Servidor   | Express 4                                           |
| ORM        | Prisma 5                                            |
| Banco      | SQLite (arquivo `prisma/dev.db`)                    |
| Sessão     | express-session (cookie HTTP-only)                  |
| Hash senha | bcryptjs                                            |
| Frontend   | HTML/CSS/JS puro (sem build), design tokens shadcn  |
| Auto-fill  | API pública ViaCEP                                  |

---

## 2. Estrutura de pastas

```
TCC/
├── prisma/
│   ├── schema.prisma          # modelos Inscricao e Admin
│   ├── seed.js                # cria o admin inicial
│   └── dev.db                 # banco SQLite (gerado)
├── public/                    # frontend estático
│   ├── index.html             # formulário público
│   ├── login.html             # login admin
│   ├── admin.html             # painel CRUD
│   ├── obrigado.html          # página de agradecimento
│   ├── styles.css             # tokens shadcn + componentes
│   ├── form.js                # lógica do formulário público
│   ├── login.js               # lógica de login
│   ├── admin.js               # lógica do painel
│   └── masks.js               # máscaras CPF/RG/tel/CEP + ViaCEP
├── src/
│   ├── repositories/          # acesso direto ao Prisma
│   │   ├── inscricaoRepository.js
│   │   └── adminRepository.js
│   └── services/              # validação e regras de negócio
│       ├── inscricaoService.js
│       └── authService.js
├── server.js                  # rotas Express + sessão
├── .env                       # DATABASE_URL, SESSION_SECRET, PORT
├── package.json
└── DOCUMENTACAO.md            # este arquivo
```

Arquitetura em três camadas: **Rotas → Services → Repositories → Prisma → SQLite**. Cada camada só conhece a camada imediatamente abaixo.

---

## 3. Banco de dados

### 3.1 Diagrama

```
┌──────────────────────────────────────┐         ┌──────────────────────┐
│            Inscricao                 │         │        Admin         │
├──────────────────────────────────────┤         ├──────────────────────┤
│ id                Int  PK auto       │         │ id            Int PK │
│ nomeCompleto      String             │         │ username      String │
│ comoPrefereChamada String             │        │ passwordHash  String │
│ dataNascimento    DateTime           │         │ createdAt     DateTime│
│ email             String             │         └──────────────────────┘
│ celular           String             │
│ rg                String             │         (Sem relação por FK:
│ cpf               String             │          o Admin apenas opera
│ cep               String             │          sobre Inscricao via
│ logradouro        String             │          autenticação de sessão)
│ numero            String             │
│ complemento       String?  ← opcional│
│ bairro            String             │
│ cidade            String             │
│ estado            String  (UF)       │
│ aceiteLgpd        Bool   @default(false) │
│ aceiteMaiorIdade  Bool   @default(false) │
│ aceiteImagem      Bool   @default(false) │
│ createdAt         DateTime @default(now())│
│ updatedAt         DateTime @updatedAt │
└──────────────────────────────────────┘
```

### 3.2 Tabela `Inscricao`

Armazena cada cadastro feito pelo formulário público (ou inserido manualmente pelo admin).

| Campo                | Tipo         | Obrigatório | Observação                                                                 |
| -------------------- | ------------ | ----------- | -------------------------------------------------------------------------- |
| `id`                 | `Int`        | sim (PK)    | Auto-incremento.                                                            |
| `nomeCompleto`       | `String`     | sim         | Nome completo da inscrita.                                                  |
| `comoPrefereChamada` | `String`     | sim         | Nome social / apelido preferido.                                            |
| `dataNascimento`     | `DateTime`   | sim         | Recebido como `YYYY-MM-DD`; convertido para `Date` no service.              |
| `email`              | `String`     | sim         | Validado por regex. **Sem `@unique`** (decisão atual permite duplicatas).   |
| `celular`            | `String`     | sim         | Armazenado já formatado `(00) 00000-0000`.                                  |
| `rg`                 | `String`     | sim         | Armazenado formatado `00.000.000-X`.                                        |
| `cpf`                | `String`     | sim         | Armazenado formatado `000.000.000-00`. **Sem `@unique`**.                   |
| `cep`                | `String`     | sim         | Formato `00000-000`. Dispara busca ViaCEP no front.                         |
| `logradouro`         | `String`     | sim         | Preenchido pelo ViaCEP (editável).                                          |
| `numero`             | `String`     | sim         | Informado pela inscrita.                                                    |
| `complemento`        | `String?`    | não         | Apto, bloco, sala etc.                                                      |
| `bairro`             | `String`     | sim         | Preenchido pelo ViaCEP (editável).                                          |
| `cidade`             | `String`     | sim         | Preenchido pelo ViaCEP (editável).                                          |
| `estado`             | `String`     | sim         | UF (2 letras), validada contra `ESTADOS_VALIDOS` (`EX` para fora do Brasil).|
| `aceiteLgpd`         | `Boolean`    | sim         | Obrigatório `true` para envio público.                                      |
| `aceiteMaiorIdade`   | `Boolean`    | sim         | Obrigatório `true` para envio público.                                      |
| `aceiteImagem`       | `Boolean`    | não         | Opcional. `false` se não marcado.                                           |
| `createdAt`          | `DateTime`   | auto        | Preenchido por `@default(now())`.                                           |
| `updatedAt`          | `DateTime`   | auto        | Atualizado a cada `update` via `@updatedAt`.                                |

### 3.3 Tabela `Admin`

Usuários com acesso ao painel.

| Campo          | Tipo       | Obrigatório | Observação                                          |
| -------------- | ---------- | ----------- | --------------------------------------------------- |
| `id`           | `Int`      | sim (PK)    | Auto-incremento.                                    |
| `username`     | `String`   | sim         | `@unique` — não pode haver dois admins iguais.      |
| `passwordHash` | `String`   | sim         | Hash bcrypt (cost 10).                              |
| `createdAt`    | `DateTime` | auto        | `@default(now())`.                                  |

### 3.4 Relação entre as tabelas

**Não há foreign key entre `Admin` e `Inscricao`.** São tabelas independentes:

- `Inscricao` guarda os cadastros do público.
- `Admin` guarda credenciais usadas para autorizar operações de CRUD sobre `Inscricao` via cookie de sessão.

Caso futuramente seja necessário rastrear *qual* admin editou cada inscrição, basta adicionar `editadoPorId Int?` em `Inscricao` referenciando `Admin.id` — mas hoje isso não é requisito.

---

## 4. Camada de rotas (`server.js`)

### 4.1 Middlewares globais

| Função / config            | O que faz                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| Carga manual de `.env`     | Lê o arquivo `.env` linha a linha sem depender de `dotenv` (zero abstração).                    |
| `express.json()`           | Parse de JSON do body, limite de 1 MB.                                                          |
| `express.urlencoded()`     | Parse de form-urlencoded.                                                                       |
| `express-session`          | Sessão em cookie HTTP-only, `sameSite: 'lax'`, expira em 8 horas.                               |
| `express.static('public')` | Serve os HTML/CSS/JS do `public/`.                                                              |

### 4.2 Helpers locais

| Helper            | Finalidade                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| `requireAuth`     | Middleware que rejeita com 401 quando `req.session.adminId` não está setado.                                        |
| `handleError`     | Tradutor de erros de service para resposta HTTP. Usa `e.status` e `e.erros` lançados pelos services; 500 no resto.  |

### 4.3 Endpoints

#### Público

| Método | Rota              | Body                                | Respostas                                                                | Função no service                  |
| ------ | ----------------- | ----------------------------------- | ------------------------------------------------------------------------ | ---------------------------------- |
| POST   | `/api/inscricoes` | Payload completo + aceites          | `201 { id }` · `400 { erros }`                                            | `inscricaoService.criarPublica`    |

Validações obrigatórias na criação pública: todos os campos textuais, `dataNascimento`, `email` válido, `estado` em `ESTADOS_VALIDOS`, `aceiteLgpd` e `aceiteMaiorIdade` ambos `true`.

#### Autenticação

| Método | Rota                  | Body                              | Respostas                                | Função no service        |
| ------ | --------------------- | --------------------------------- | ---------------------------------------- | ------------------------ |
| POST   | `/api/auth/login`     | `{ username, password }`          | `200 { ok, username }` · `401`            | `authService.autenticar` |
| POST   | `/api/auth/logout`    | —                                 | `200 { ok }` (destrói sessão)             | —                        |
| GET    | `/api/auth/me`        | —                                 | `200 { authenticated, username }` · `401` | —                        |

#### Admin CRUD (protegidas por `requireAuth`)

| Método | Rota                            | Body                | Respostas                                                  | Função no service                                |
| ------ | ------------------------------- | ------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| GET    | `/api/admin/inscricoes?q=...`   | —                   | `200 [inscricao]`                                          | `inscricaoService.listar(busca)`                 |
| GET    | `/api/admin/inscricoes/:id`     | —                   | `200 inscricao` · `404`                                    | `inscricaoService.obter(id)`                     |
| POST   | `/api/admin/inscricoes`         | Payload (sem aceites)| `201 inscricao` · `400`                                    | `inscricaoService.criarAdmin`                    |
| PUT    | `/api/admin/inscricoes/:id`     | Payload (sem aceites)| `200 inscricao` · `400` · `404`                            | `inscricaoService.atualizar`                     |
| DELETE | `/api/admin/inscricoes/:id`     | —                   | `200 { ok }` · `404`                                       | `inscricaoService.remover`                       |

Nas operações admin **não** se enviam `aceiteLgpd/aceiteMaiorIdade/aceiteImagem` no body — o service só atualiza esses campos se chegarem no payload, então o consentimento original do cliente fica preservado em updates.

#### Rotas estáticas

- `GET /admin` → redireciona para `/login.html` se não autenticado; senão serve `admin.html`.
- `GET /` → serve `public/index.html` (formulário público).
- `GET /obrigado.html` → página de confirmação após envio.

---

## 5. Camada de services

### 5.1 `inscricaoService.js`

| Função                  | Descrição                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `normalizar(data, opts)` | Sanitiza strings (`trim`+`slice`), valida formato de e-mail, valida UF, converte `dataNascimento` para `Date`. Acumula erros e lança `ValidationError` se algum existir. Inclui aceites no resultado **apenas se** estiverem presentes em `data` (preservando-os em updates do admin). |
| `criarPublica(payload)` | Valida com `exigirAceites: true`; chama `repo.criar`. Erros do Prisma são traduzidos por `tratarErroPrisma`.                                |
| `criarAdmin(payload)`   | Igual ao anterior mas com `exigirAceites: false`.                                                                                            |
| `atualizar(id, payload)`| Valida com `exigirAceites: false`; chama `repo.atualizar`.                                                                                  |
| `obter(id)`             | Busca pelo PK; lança `NotFoundError` se inexistente.                                                                                         |
| `listar(busca)`         | Lista ordenada por `createdAt desc`, com filtro `OR` (nome, e-mail, CPF, cidade).                                                            |
| `remover(id)`           | Deleta; lança `NotFoundError` se id não existir.                                                                                             |
| `tratarErroPrisma(e)`   | Traduz `P2002` em `ConflictError 409` e `P2025` em `NotFoundError 404`.                                                                      |

Classes de erro: `ValidationError(status=400)`, `ConflictError(status=409)`, `NotFoundError(status=404)`. Cada uma carrega `erros[]` ou `message`.

### 5.2 `authService.js`

| Função                          | Descrição                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `autenticar(username, password)`| Busca admin via repository; compara senha com `bcrypt.compare`; retorna `{ id, username }` ou lança `AuthError(401)`. |

---

## 6. Camada de repositories (acesso direto ao Prisma)

### 6.1 `inscricaoRepository.js`

| Função                  | Equivale a                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `listar({ busca })`     | `prisma.inscricao.findMany` com `OR` em 4 campos quando `busca` não vazia.                 |
| `buscarPorId(id)`       | `prisma.inscricao.findUnique({ where: { id } })`                                           |
| `criar(dados)`          | `prisma.inscricao.create({ data: dados })`                                                 |
| `atualizar(id, dados)`  | `prisma.inscricao.update({ where: { id }, data: dados })`                                  |
| `remover(id)`           | `prisma.inscricao.delete({ where: { id } })`                                               |

### 6.2 `adminRepository.js`

| Função                       | Equivale a                                                                  |
| ---------------------------- | --------------------------------------------------------------------------- |
| `buscarPorUsername(username)`| `prisma.admin.findUnique({ where: { username } })`                          |
| `criar({ username, hash })`  | `prisma.admin.create({ data: { username, passwordHash } })`                 |

---

## 7. Frontend

### 7.1 Páginas

| Página           | Rota             | Função                                                       |
| ---------------- | ---------------- | ------------------------------------------------------------ |
| `index.html`     | `/`              | Formulário público com todos os campos do antigo Google Form. |
| `obrigado.html`  | `/obrigado.html` | Confirmação visual após envio (redirecionada via `form.js`). |
| `login.html`     | `/login.html`    | Login admin.                                                  |
| `admin.html`     | `/admin`         | Lista + CRUD em modal.                                        |

### 7.2 Scripts

| Arquivo       | Funções principais                                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `masks.js`    | `maskCPF`, `maskRG`, `maskTelefone`, `maskCEP` — formatadores em tempo real. `attachMasks(form)`, `formatarValoresExistentes(form)`, `buscarCep`, `attachCepLookup(form)`.         |
| `form.js`     | Coleta payload, envia para `POST /api/inscricoes`, redireciona para `/obrigado.html` em sucesso. Liga/desliga o botão "Enviar" conforme os checkboxes de LGPD e maioridade.        |
| `login.js`    | Envia credenciais para `POST /api/auth/login` e redireciona para `/admin` em sucesso.                                                                                              |
| `admin.js`    | `carregarSessao`, `carregarLista`, `renderizar`, `abrirModal`, `fecharModal`, `coletarPayload`, `formatarDataHora`. Exibe `createdAt` e `updatedAt` na tabela e no header do modal.|

### 7.3 Integração ViaCEP

Em `masks.js`, `attachCepLookup(form)` ouve `blur` e `input` do campo `cep`. Quando há 8 dígitos, faz `GET https://viacep.com.br/ws/{cep}/json/` e preenche `logradouro`, `bairro`, `cidade` e `estado`. Falhas são silenciosas para não bloquear o preenchimento manual.

### 7.4 Design

CSS aplica tokens HSL no padrão **shadcn/ui** (`--background`, `--foreground`, `--primary`, `--ring`, etc.), raio padrão `0.5rem`, ring de foco com offset, modal com `backdrop-filter: blur(4px)`. Sem framework — só Inter via Google Fonts.

---

## 8. Como executar

```bash
# 1. dependências
npm install

# 2. cria o banco SQLite + Prisma Client
npx prisma db push

# 3. cria o admin inicial (usuário admin / senha admin123)
node prisma/seed.js

# 4. sobe o servidor
node server.js
```

Acesso:

- Público: `http://localhost:3000/`
- Admin: `http://localhost:3000/admin` (login em `/login.html`)
- LAN (celular na mesma WiFi): `http://<IP-do-notebook>:3000`

Variáveis em `.env`:

```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="troque-este-segredo-em-producao"
PORT=3000
```

---

## 9. Roadmap

Sugestões priorizadas para próximas iterações:

### Curto prazo (uma sessão de trabalho cada)

- **Validação de CPF no backend** com algoritmo de dígito verificador (atualmente só formata, não valida).
- **Trocar senha do admin pela UI** (rota `PUT /api/auth/password`).
- **Re-aplicar `@unique` em `email` e `cpf`** se a regra do negócio confirmar que duplicatas devem ser bloqueadas.
- **Indicador visual de loading** no campo CEP enquanto o ViaCEP responde.
- **Paginação** em `GET /api/admin/inscricoes` (`?page=&pageSize=`).

### Médio prazo

- **Exportação CSV** das inscrições filtradas (botão no admin).
- **E-mail de confirmação automático** para a inscrita após cadastro (Nodemailer + SMTP).
- **Filtros avançados**: por estado, por intervalo de datas, por status de aceite de imagem.
- **Auditoria**: adicionar `editadoPorId` em `Inscricao` referenciando `Admin.id`, registrando quem alterou.
- **Rate limiting** em `/api/inscricoes` (`express-rate-limit`) para mitigar spam.
- **Testes**: Jest + Supertest cobrindo os services e endpoints.

### Longo prazo

- **Migração SQLite → PostgreSQL** para produção (basta trocar o `provider` no `schema.prisma` e `DATABASE_URL`).
- **Deploy** com HTTPS (Nginx + Let's Encrypt, ou hospedagem PaaS).
- **Soft delete** em `Inscricao` (`deletedAt DateTime?`) para preservar histórico.
- **Recuperação de senha do admin** por e-mail.
- **Dashboard** com estatísticas (total por estado, evolução mensal).
- **Multi-admin com papéis** (super-admin x admin de leitura).

---

## 10. Decisões de arquitetura

- **Sem build do frontend**: HTML/CSS/JS puro entregue por `express.static`. Reduz fricção para um projeto pequeno.
- **Três camadas no backend**: rotas finas em `server.js`, regras em services, acesso a dados em repositories. Trocar Prisma por outro ORM exige tocar só nos repositories.
- **`.env` carregado manualmente** em `server.js` e `seed.js` para não exigir `dotenv` como dependência.
- **Senha do admin via bcrypt** com cost 10 — equilíbrio entre segurança e velocidade.
- **Aceites preservados em update**: o service só sobrescreve `aceiteLgpd/aceiteMaiorIdade/aceiteImagem` se eles vierem no payload; o admin não os envia, garantindo que o consentimento original do cliente nunca seja alterado pelo painel.
