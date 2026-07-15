# Roteiro de apresentação — TCC

> Roteiro pensado pra gravação em vídeo. Tom de conversa, sem muito juridiquês.

---

## Abertura (30s)

Esse projeto é o sistema de inscrições da **Amecomex** — a Associação de Mulheres Especialistas em Comércio Exterior. Hoje elas usam um formulário do Google Forms pra captar cadastros, e o problema é que tudo cai numa planilha solta, sem controle, sem busca, sem jeito fácil de editar.

A ideia aqui é simples: substituir o Google Forms por uma aplicação web própria, com uma página pública pra qualquer pessoa se inscrever e uma área administrativa pra gerenciar tudo isso — criar, editar, excluir e buscar inscrições.

---

## Tecnologias (40s)

O backend é em **Node.js puro com JavaScript** — sem TypeScript, sem framework gigante, só o **Express** pra cuidar das rotas e o **express-session** pro login.

Pra falar com o banco eu uso o **Prisma**, que é um ORM — basicamente um tradutor entre objetos JavaScript e tabelas SQL. O banco em si é **SQLite**, que é um banco em arquivo, super leve, perfeito pra esse tamanho de projeto. Se um dia precisar escalar, é só trocar pra PostgreSQL mexendo numa linha do schema.

O frontend é **HTML, CSS e JavaScript puro**, sem React, sem build, sem nada. O visual segue os tokens de design do **shadcn/ui**, que é um sistema bem clean e moderno.

Pra completar, uso a API pública do **ViaCEP** pra autocompletar endereço quando a pessoa digita o CEP, e o **bcrypt** pra guardar a senha do admin com hash.

---

## Estrutura do banco (1min)

O banco tem só **duas tabelas**, e elas **não têm relação direta entre si** — eu já adianto isso porque é uma decisão consciente.

### Tabela `Inscricao`

É onde mora cada cadastro. Os campos são basicamente os mesmos do formulário antigo, divididos em três blocos:

- **Dados pessoais**: nome completo, como prefere ser chamada, data de nascimento, e-mail, celular, RG e CPF.
- **Endereço**: aqui eu separei CEP, logradouro, número, complemento, bairro, cidade e estado. A pessoa só precisa digitar CEP e número — o resto o ViaCEP preenche automaticamente.
- **Consentimentos**: três checkboxes — LGPD, declaração de ser maior de 18 anos, e autorização de uso de imagem. Os dois primeiros são obrigatórios; o terceiro é opcional.

Além disso a tabela tem `createdAt` e `updatedAt`, que o Prisma preenche sozinho — quando a inscrição foi criada e quando foi atualizada pela última vez. Isso aparece no painel admin pra dar rastreabilidade.

### Tabela `Admin`

Bem mais simples: id, username, hash da senha e data de criação. Serve só pra autorizar quem pode mexer no painel.

### Por que não tem foreign key entre as duas?

Porque o admin não é "dono" de nenhuma inscrição — ele só opera sobre elas. Não preciso saber qual admin editou cada cadastro. Se um dia isso for requisito, adiciono um campo `editadoPorId` e pronto.

---

## Endpoints (1min30)

A API tem três grupos de rotas.

### Rotas públicas

Só uma: `POST /api/inscricoes`. É a rota que o formulário público chama quando alguém clica em "Enviar inscrição". Ela valida tudo (campos obrigatórios, formato de e-mail, UF válida, consentimentos marcados) e grava no banco. Se der erro, devolve a lista de problemas pro frontend mostrar.

### Rotas de autenticação

- `POST /api/auth/login` — recebe usuário e senha, compara com o hash do banco usando bcrypt e cria a sessão.
- `POST /api/auth/logout` — destrói a sessão.
- `GET /api/auth/me` — diz se o usuário está logado. O frontend usa isso pra saber se deve mostrar a tela do admin ou redirecionar pro login.

### Rotas do admin (todas protegidas)

São as operações de CRUD:

- `GET /api/admin/inscricoes` — lista todas, com busca opcional por nome, e-mail, CPF ou cidade.
- `GET /api/admin/inscricoes/:id` — pega uma específica pra editar.
- `POST /api/admin/inscricoes` — cria manualmente (caso a pessoa não consiga preencher sozinha).
- `PUT /api/admin/inscricoes/:id` — edita.
- `DELETE /api/admin/inscricoes/:id` — exclui.

Tudo isso passa por um middleware chamado `requireAuth`, que barra quem não tiver sessão válida.

Um detalhe interessante: quando o admin atualiza um cadastro, os campos de consentimento **não são tocados**. Isso porque o consentimento foi dado pela pessoa que se inscreveu — não faz sentido o admin marcar ou desmarcar isso depois. Então o painel admin nem mostra essas checkboxes.

---

## Arquitetura em camadas (30s)

Eu separei o backend em três camadas:

1. **Rotas** (`server.js`) — só recebem o request e devolvem o response, são bem fininhas.
2. **Services** — onde mora a regra de negócio: validação, sanitização, tratamento de erros.
3. **Repositories** — só conversam com o Prisma. Se um dia eu trocar o ORM, é só essa camada que muda.

Cada camada conhece só a camada de baixo. É a separação clássica que facilita manutenção e teste.

---

## Fechamento (15s)

Resumindo: é um sistema web simples mas completo, com formulário público, área admin com login, CRUD, busca, máscaras nos campos brasileiros, autocomplete de endereço por CEP e uma estrutura de código pensada pra ser fácil de manter e expandir.

Obrigado!

---

## Pontos pra reforçar se sobrar tempo

- O design responsivo funciona bem no celular — testei na mesma rede WiFi.
- A página de "obrigado" depois do envio melhora a experiência do usuário (sem ficar olhando pra um alerta genérico).
- O botão de envio fica desabilitado enquanto os consentimentos obrigatórios não forem marcados — é uma forma de respeitar a LGPD na própria interface.
