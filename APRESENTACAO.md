# Roteiro de apresentação — Sistema de Inscrições Amecomex

> Roteiro para uma apresentação ou gravação de aproximadamente 8 minutos. O texto foi escrito para fala natural: use as ideias principais, sem precisar ler palavra por palavra.

---

## 1. Abertura — 30 segundos

“Este projeto é um sistema de inscrições desenvolvido para a Amecomex, a Associação de Mulheres Especialistas em Comércio Exterior.

O objetivo foi substituir um processo baseado em formulário e planilha por uma aplicação própria, com uma página pública para receber inscrições e uma área administrativa para buscar, criar, editar e excluir registros.

Além das funcionalidades, o sistema foi revisado para funcionar por teclado, comunicar corretamente os campos e erros aos leitores de tela e continuar utilizável com zoom ou em telas pequenas.”

**Frase-chave:** “É uma aplicação simples para o público usar e organizada para a associação administrar.”

---

## 2. Problema e solução — 40 segundos

“No processo anterior, os dados ficavam concentrados em uma planilha, o que dificultava busca, edição controlada e manutenção do histórico.

A solução separa as duas necessidades principais:

- a pessoa interessada preenche o formulário público;
- o backend valida e salva os dados;
- a equipe autenticada acessa o painel administrativo;
- no painel, é possível pesquisar e executar as operações de CRUD.”

```text
Formulário público
        ↓
API Express
        ↓
Services e validações
        ↓
Prisma
        ↓
SQLite
        ↑
Painel administrativo autenticado
```

**Frase-chave:** “O sistema centraliza o cadastro e o gerenciamento no mesmo fluxo.”

---

## 3. Tecnologias e arquitetura — 55 segundos

“O backend utiliza Node.js com Express. A sessão de login é controlada pelo `express-session`, e as senhas são armazenadas como hash usando `bcryptjs`.

Para persistência, o projeto usa Prisma ORM e SQLite. O SQLite é adequado ao desenvolvimento e ao porte atual porque funciona em um único arquivo. Uma futura migração para outro banco é facilitada pelo Prisma, mas ainda exigiria configuração, geração de migrações e validação dos dados.

O frontend usa HTML, CSS e JavaScript nativos, sem framework e sem etapa de build. Isso reduz a complexidade e permite aproveitar diretamente os elementos semânticos do navegador.

O backend foi separado em rotas, services e repositories.”

```text
Rotas Express
     ↓
Services — regras e validações
     ↓
Repositories — persistência
     ↓
Prisma → SQLite
```

**Frase-chave:** “Cada camada tem uma responsabilidade clara e conhece apenas a camada seguinte.”

---

## 4. Banco de dados — 50 segundos

“O banco possui duas tabelas independentes.”

### `Inscricao`

- dados pessoais: nome, nome preferido, nascimento, e-mail, celular, RG e CPF;
- endereço: CEP, logradouro, número, complemento, bairro, cidade e estado;
- consentimentos: LGPD, maioridade e uso de imagem;
- datas automáticas de criação e atualização.

“O consentimento de LGPD e a declaração de maioridade são obrigatórios no formulário público. O consentimento de imagem é opcional.

Quando o administrador edita uma inscrição, os consentimentos originais não são alterados, porque pertencem à decisão da pessoa inscrita.”

### `Admin`

- username único;
- hash da senha;
- data de criação.

“Não existe foreign key entre Admin e Inscricao porque, no requisito atual, o administrador opera os registros, mas não é proprietário deles. Caso seja necessário auditar quem realizou cada alteração, uma relação poderá ser adicionada futuramente.”

**Frase-chave:** “As tabelas são independentes porque autenticação e inscrição têm responsabilidades diferentes.”

---

## 5. API e regras de negócio — 55 segundos

“A API é dividida em três grupos.”

### Público

- `POST /api/inscricoes`: valida os dados, exige os consentimentos obrigatórios e cria a inscrição.

### Autenticação

- `POST /api/auth/login`: valida usuário e senha e cria a sessão;
- `POST /api/auth/logout`: encerra a sessão;
- `GET /api/auth/me`: informa se existe uma sessão válida.

### Administração

- `GET /api/admin/inscricoes`: lista e pesquisa por nome, e-mail, CPF ou cidade;
- `GET /api/admin/inscricoes/:id`: consulta um registro;
- `POST /api/admin/inscricoes`: cria um registro pelo painel;
- `PUT /api/admin/inscricoes/:id`: atualiza;
- `DELETE /api/admin/inscricoes/:id`: exclui.

“As rotas administrativas passam pelo middleware `requireAuth`. As validações ficam no service, enquanto o repository contém somente as operações do Prisma.”

**Frase-chave:** “A rota recebe, o service decide e o repository persiste.”

---

## 6. Formulário e integração com CEP — 40 segundos

“O formulário aplica máscaras de CPF, RG, celular e CEP enquanto a pessoa digita.

Quando o CEP possui oito dígitos, o frontend consulta o ViaCEP e tenta preencher logradouro, bairro, cidade e estado. O sistema informa se está consultando, se encontrou o endereço ou se houve falha.

Se o serviço estiver indisponível ou o CEP não existir, o preenchimento manual continua permitido. A consulta também não desloca o foco inesperadamente.”

**Frase-chave:** “O ViaCEP ajuda no preenchimento, mas nunca impede que a pessoa complete o endereço manualmente.”

---

## 7. Acessibilidade — 1 minuto e 30 segundos

“A implementação de acessibilidade preservou a stack e ficou concentrada no frontend. Foi usada a seguinte prioridade: primeiro HTML nativo, depois CSS, JavaScript e ARIA somente para estados dinâmicos.”

### Campos e formulários

“Todos os campos possuem labels associados. Assim, o texto visível também se torna o nome anunciado pelo leitor de tela. Os campos obrigatórios usam o atributo `required`, e os consentimentos estão agrupados com `fieldset` e `legend`.”

### Erros

“Quando o envio falha, cada mensagem é colocada perto do respectivo campo. O controle recebe `aria-invalid`, a mensagem é ligada por `aria-describedby` e o foco vai para o primeiro erro.

O botão de envio permanece alcançável. Isso permite que usuários de teclado tentem enviar e recebam uma explicação, em vez de encontrar um botão desabilitado sem saber o motivo.”

### Mensagens dinâmicas

“Erros usam `role="alert"`. Sucesso, carregamento, quantidade de resultados e consulta de CEP usam `role="status"`. Dessa forma, mudanças importantes são anunciadas sem obrigar a pessoa a procurar visualmente na página.”

### Diálogo administrativo

“O modal foi substituído pelo elemento nativo `<dialog>`. Ao abrir, o foco vai para o primeiro campo; a navegação permanece no diálogo; Escape fecha; e o foco retorna ao botão que abriu.”

### Tabela e apresentação visual

“A busca recebeu label acessível. A tabela possui caption, cabeçalhos de linha e coluna e nomes específicos para ações repetidas, como ‘Editar inscrição de Maria’.

O foco recebeu um contorno sólido, as cores de erro e textos secundários foram ajustadas para contraste, e campos e botões podem crescer com o texto. A interface também respeita a preferência de movimento reduzido.”

**Frase-chave:** “A acessibilidade foi corrigida na estrutura real da interface, sem overlay e sem biblioteca adicional.”

---

## 8. Demonstração prática — 1 minuto

### 0–10 segundos: navegação por teclado

1. Abra o formulário público.
2. Pressione Tab.
3. Mostre o link “Ir para o conteúdo principal”.

**Fala:** “O usuário pode ignorar o cabeçalho e chegar diretamente ao formulário.”

### 10–25 segundos: labels e foco

1. Continue com Tab pelos campos.
2. Mostre o contorno de foco.
3. Clique no texto de um label para focar o campo correspondente.

**Fala:** “Cada campo tem nome acessível e indicação clara da posição do teclado.”

### 25–40 segundos: validação

1. Tente enviar o formulário vazio.
2. Mostre o foco em Nome Completo.
3. Mostre a mensagem específica ligada ao campo.

**Fala:** “O sistema identifica todos os problemas e leva o foco ao primeiro erro.”

### 40–60 segundos: diálogo administrativo

1. Acesse a administração e abra “Nova inscrição”.
2. Navegue com Tab.
3. Pressione Escape.
4. Mostre o foco retornando ao botão “Nova inscrição”.

**Fala:** “O diálogo funciona por teclado, fecha com Escape e devolve o usuário ao ponto de origem.”

---

## 9. Validação realizada — 30 segundos

“A implementação foi verificada com análise sintática dos scripts, inspeção de labels e controles, árvore de acessibilidade do navegador, navegação por teclado e testes dos fluxos de login e CRUD.

Também foram testados foco após erros, comportamento do diálogo, busca administrativa, contraste, console do navegador e reflow em viewport estreita.

Como complemento, ainda é recomendada uma rodada manual com NVDA, VoiceOver ou outro leitor de tela e zoom real de 200% em diferentes navegadores.”

**Frase-chave:** “A validação combina verificações técnicas com testes manuais de interação.”

---

## 10. Limitações e próximos passos — 35 segundos

“O sistema atual atende ao ambiente acadêmico e ao desenvolvimento local, mas há pontos importantes antes de uma publicação em produção:

- não existe envio automático de e-mail; a página de agradecimento é apenas uma confirmação visual;
- o armazenamento padrão de sessões é em memória e deve ser substituído por um store persistente;
- SQLite exige estratégia de backup e avaliação de concorrência;
- CPF e RG são formatados, mas o CPF ainda não é validado pelo algoritmo de dígitos;
- ainda não há testes automatizados nem recuperação de senha;
- HTTPS, rate limiting, logs e política de retenção de dados precisam ser configurados para produção.”

**Frase-chave:** “O protótipo está funcional, e os próximos passos estão claramente separados das funcionalidades já entregues.”

---

## 11. Fechamento — 20 segundos

“Resumindo, o projeto entrega um formulário público, autenticação administrativa, busca e CRUD completos, validação no backend, integração com ViaCEP e uma interface revisada para teclado, leitores de tela, contraste e reflow.

A solução mantém uma arquitetura simples, separada em camadas e preparada para evoluções futuras sem substituir as tecnologias existentes.

Obrigado.”

---

## Respostas rápidas para perguntas prováveis

### “O sistema envia e-mail depois da inscrição?”

Não. A inscrição é salva no banco e a página de agradecimento é exibida, mas ainda não existe integração SMTP ou serviço transacional.

### “Por que não usar React ou outro framework?”

Porque os requisitos atuais são atendidos por HTML, CSS e JavaScript nativos, evitando build e dependências desnecessárias.

### “Por que o backend não é NestJS?”

O projeto já possuía Express com separação entre services e repositories, e não havia necessidade funcional para migrar a arquitetura.

### “Por que usar `<dialog>`?”

Porque o elemento nativo já fornece semântica modal, isolamento do fundo e comportamento de foco com menos código manual.

### “Por que o botão de envio não começa desabilitado?”

Porque um botão desabilitado não recebe foco nem explica o que falta; o botão acessível permite tentar o envio e receber mensagens específicas.

### “O que acontece se o ViaCEP falhar?”

Uma mensagem informa a falha e todos os campos de endereço continuam disponíveis para preenchimento manual.

### “Como são configurados usuário e senha?”

As variáveis `ADMIN_USER` e `ADMIN_PASS` são lidas pelo seed; a senha é armazenada somente como hash bcrypt.

### “O seed troca a senha se eu alterar o `.env`?”

Não. O seed cria o usuário somente quando ele ainda não existe.

### “Por que SQLite?”

É simples e suficiente para desenvolvimento e demonstração; produção exige avaliar volume, concorrência, backup e possível migração.

### “O sistema já está em conformidade total com a LGPD?”

O sistema registra consentimentos e preserva os aceites, mas conformidade com a LGPD também depende de políticas, base legal, segurança, retenção e processos organizacionais.

### “Quais critérios de acessibilidade foram trabalhados?”

Principalmente semântica e relações, contraste, reflow, operação por teclado, foco visível, identificação de erros, labels e mensagens de status, conforme WCAG 2.2.

---

## Checklist antes de gravar

- confirmar que o `.env` existe e não será mostrado no vídeo;
- executar `npm start` e abrir o formulário público;
- confirmar o login administrativo;
- deixar o banco com um ou dois registros sintéticos para demonstrar busca e tabela;
- fechar terminais ou abas que exibam credenciais e dados pessoais;
- testar Tab, Shift+Tab e Escape antes da gravação;
- usar dados fictícios durante a demonstração;
- confirmar que o ViaCEP está respondendo ou preparar a explicação do preenchimento manual;
- não afirmar que o sistema envia e-mail;
- encerrar removendo os registros sintéticos, se necessário.
