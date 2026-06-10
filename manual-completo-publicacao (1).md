# Manual completo — Colocando sua plataforma no ar (do zero ao login funcionando)

Tempo total estimado: 45 a 60 minutos, fazendo com calma.
Custo: R$ 0. Você vai precisar apenas de um computador com navegador.

Você vai criar 3 contas, nesta ordem: **Supabase** (banco de dados e login),
**GitHub** (onde o código fica guardado) e **Vercel** (que publica o site).
Siga na ordem — cada parte depende da anterior.

---

## PARTE 0 — Preparação (5 min)

1. Baixe o arquivo **plataforma-agencia-v2.zip** que o Claude te entregou.
2. Clique com o botão direito nele > **Extrair tudo** (Windows) ou dê dois
   cliques (Mac). Vai aparecer uma pasta chamada `plataforma-agencia-v2`.
3. Deixe essa pasta aberta — você vai editar 1 arquivo dela na Parte 2 e
   enviar tudo para o GitHub na Parte 3.

---

## PARTE 1 — Supabase: criar o banco de dados (15 min)

### 1.1 Criar a conta e o projeto
1. Acesse **https://supabase.com** e clique em **Start your project**.
2. Crie a conta (recomendo "Continue with GitHub" se já tiver, ou use e-mail).
3. No painel, clique em **New project**.
4. Preencha:
   - **Name:** plataforma-agencia
   - **Database Password:** crie uma senha forte e ANOTE em local seguro
     (você quase nunca vai usá-la, mas não dá para recuperar fácil).
   - **Region:** South America (São Paulo)
5. Clique em **Create new project** e aguarde 1 a 2 minutos até o painel carregar.

### 1.2 Criar as tabelas e regras de segurança
1. No menu lateral esquerdo, clique no ícone **SQL Editor**.
2. Clique em **New query** (ou no "+").
3. No seu computador, abra o arquivo **supabase-setup.sql** (está dentro da
   pasta que você extraiu) com o Bloco de Notas. Selecione TUDO (Ctrl+A),
   copie (Ctrl+C).
4. Cole no editor do Supabase (Ctrl+V) e clique no botão **Run** (canto
   inferior direito do editor).
5. Deve aparecer **"Success. No rows returned"**. Se aparecer erro, não
   prossiga: copie a mensagem de erro e mande para o Claude.

### 1.3 Copiar a URL e a chave do projeto
1. No menu lateral, clique na **engrenagem (Project Settings)** > **API**.
2. Você vai ver dois valores. Deixe essa aba aberta:
   - **Project URL** — algo como `https://abcdefgh.supabase.co`
   - **anon public** (em "Project API keys") — um código longo começando com `eyJ...`
3. Esses dois valores vão para dentro do código na Parte 2.

> A chave "anon public" PODE ficar no código do site — ela foi feita para
> isso. A segurança real vem das regras que o SQL criou. NUNCA use a outra
> chave, "service_role", no site.

### 1.4 Criar o SEU usuário (o da agência)
1. Menu lateral > **Authentication** > **Users**.
2. Clique em **Add user** > **Create new user**.
3. Preencha seu e-mail e uma senha (essa será a senha que você usa para
   entrar na plataforma). Marque a opção **Auto Confirm User**. Crie.
4. Agora menu lateral > **Table Editor** > tabela **profiles**.
5. Vai existir uma linha com o seu e-mail. Clique nela para editar e mude a
   coluna **role** de `cliente` para `agencia` (tudo minúsculo). Salve.

Pronto, o banco está vivo. Agora vamos conectar o aplicativo a ele.

---

## PARTE 2 — Conectar o código ao banco (5 min)

1. Na pasta extraída no seu computador, entre na subpasta **src**.
2. Clique com o botão direito no arquivo **supabase.js** > **Abrir com** >
   **Bloco de Notas** (Windows) ou **TextEdit** (Mac).
3. Você vai ver duas linhas assim:
   ```
   export const SUPABASE_URL = "COLE_AQUI_A_URL_DO_SEU_PROJETO";
   export const SUPABASE_ANON_KEY = "COLE_AQUI_A_CHAVE_ANON_PUBLIC";
   ```
4. Substitua o texto entre aspas pelos valores copiados na Parte 1.3:
   - Em SUPABASE_URL, cole a **Project URL**.
   - Em SUPABASE_ANON_KEY, cole a chave **anon public** inteira.
   - MANTENHA as aspas. Exemplo de como fica:
   ```
   export const SUPABASE_URL = "https://abcdefgh.supabase.co";
   export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIs...";
   ```
5. Salve o arquivo (Ctrl+S) e feche.

---

## PARTE 3 — GitHub: guardar o código (10 min)

1. Acesse **https://github.com** e clique em **Sign up**. Crie a conta
   (e-mail, senha, nome de usuário) e confirme o código que chega no e-mail.
2. Depois de logado, clique no botão **+** no canto superior direito >
   **New repository**.
3. Preencha:
   - **Repository name:** plataforma-agencia
   - Deixe marcado **Public**.
   - NÃO marque nenhuma opção extra (sem README).
4. Clique em **Create repository**.
5. Na página que abre, clique no link azul **uploading an existing file**.
6. Abra a pasta extraída no computador e selecione TODO o conteúdo de
   DENTRO dela: os arquivos soltos (package.json, index.html, vite.config.js
   etc.) E as pastas **src** e **public** inteiras. Arraste tudo para a área
   de upload do GitHub.
   - Importante: arraste o CONTEÚDO da pasta, não a pasta-mãe em si.
   - Confira na lista de upload se aparecem `src/App.jsx`, `src/supabase.js`,
     `src/main.jsx` e os arquivos da pasta `public`.
7. Role para baixo e clique em **Commit changes**. Aguarde o envio terminar.

---

## PARTE 4 — Vercel: publicar o site (10 min)

1. Acesse **https://vercel.com** e clique em **Sign up**.
2. Escolha o plano **Hobby** (gratuito) e clique em **Continue with GitHub**.
   Autorize a conexão quando o GitHub perguntar.
3. No painel da Vercel, clique em **Add New...** > **Project**.
4. Vai aparecer a lista dos seus repositórios. Ache **plataforma-agencia** e
   clique em **Import**.
   - Se a lista estiver vazia, clique em "Adjust GitHub App Permissions" e
     dê acesso ao repositório.
5. Na tela de configuração, NÃO mude nada — a Vercel detecta sozinha que é
   um projeto Vite. Clique em **Deploy**.
6. Aguarde 1 a 2 minutos. Quando aparecer os parabéns com a miniatura do
   site, clique nela (ou em **Continue to Dashboard** > **Visit**).
7. Você ganhou um endereço tipo **plataforma-agencia.vercel.app** — esse é
   o link oficial da sua plataforma. Salve nos favoritos.

### 4.1 Primeiro teste
1. Abra o link. Deve aparecer a tela de login da plataforma.
2. Entre com o e-mail e a senha que você criou na Parte 1.4.
3. Você deve cair na Visão geral, vazia, como **agência**.
4. No card **Clientes**, cadastre seu primeiro cliente real (ex: Café Aurora).
5. Crie um projeto, um evento, uma campanha. Abra o mesmo link no celular,
   faça login e confira: tudo sincronizado.

Se em vez do login aparecer a tela "Falta um passo de configuração", o
arquivo supabase.js não foi editado ou não subiu — refaça as Partes 2 e 3.

---

## PARTE 5 — Criar o acesso de cada cliente (5 min por cliente)

Para cada cliente que vai acessar a plataforma:

1. **Primeiro na plataforma:** confira que o cliente está cadastrado no card
   Clientes da Visão geral, e anote o nome EXATAMENTE como está escrito
   (maiúsculas e acentos importam — "Café Aurora" é diferente de "cafe aurora").
2. **No Supabase:** Authentication > Users > **Add user** > Create new user.
   - E-mail do cliente + uma senha provisória. Marque **Auto Confirm User**.
3. **Ainda no Supabase:** Table Editor > **profiles** > edite a linha do
   e-mail do cliente:
   - **role** = `cliente` (já vem assim, não mexa)
   - **client_name** = o nome anotado no passo 1, idêntico.
4. Envie para o cliente: o link da plataforma + e-mail + senha provisória.
5. Teste você mesmo antes: entre com o login do cliente e confira que ele
   vê só os projetos/eventos dele e que a aba Captação não existe.

---

## PARTE 6 — Instalar como app no celular (2 min)

- **Android (Chrome):** abra o link > menu de 3 pontinhos > **Instalar app**
  (ou "Adicionar à tela inicial").
- **iPhone (Safari):** abra o link > botão de **compartilhar** (quadrado com
  seta) > **Adicionar à Tela de Início**.

O ícone roxo "sa" aparece na tela e abre em tela cheia, como app. Ensine
esse passo aos clientes também.

---

## ROTINA — Como atualizar a plataforma daqui pra frente

1. Peça a melhoria ao Claude ("quero adicionar campo de orçamento nos
   eventos", por exemplo). Ele te entrega os arquivos atualizados.
2. No GitHub: abra o repositório > **Add file** > **Upload files** > arraste
   os arquivos novos por cima > **Commit changes**.
3. A Vercel percebe a mudança e publica sozinha em 1 a 2 minutos. Nada a
   fazer na Vercel nem no Supabase (a menos que a melhoria envolva tabela
   nova — aí o Claude te entrega também o SQL para rodar).

---

## PROBLEMAS COMUNS

| Sintoma | Causa provável | Solução |
|---|---|---|
| Tela "Falta um passo de configuração" | supabase.js sem a URL/chave | Refaça Parte 2 e suba o arquivo de novo (Parte 3, só o supabase.js) |
| "E-mail ou senha incorretos" | Usuário não foi criado ou sem Auto Confirm | Supabase > Authentication: confira se o usuário existe e está "Confirmed" |
| Você entra mas vê tudo vazio e sem abas da agência | Seu profile ainda está como `cliente` | Table Editor > profiles > mude role para `agencia` |
| Cliente entra e não vê nada | `client_name` no profile não bate com o nome cadastrado | Corrija o client_name para ficar idêntico (acento e maiúscula) |
| Deploy falhou na Vercel (erro vermelho) | Algum arquivo não subiu ou subiu em pasta errada | Confira no GitHub se existe `src/App.jsx`, `src/main.jsx`, `src/supabase.js`, `package.json` e `index.html` na raiz. Copie o log de erro e mande para o Claude |
| Site abre em branco | Erro de digitação ao editar supabase.js (aspas apagadas) | Reabra o arquivo, confira que as aspas e os ponto-e-vírgula continuam lá |

Qualquer erro diferente desses: tire um print ou copie a mensagem e mande
para o Claude no chat — quase tudo se resolve em uma resposta.
