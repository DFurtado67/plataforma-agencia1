# DOSSIÊ DO PROJETO — Plataforma "suaagência" (gestão de marketing & eventos)

> **Para o futuro Claude:** este documento contém TODO o contexto de um projeto
> construído em conversa anterior (junho/2026). Leia-o por inteiro antes de
> responder. O dono do projeto é o Diego, perfil não-técnico — ele segue
> instruções de clique em clique, não usa terminal nem instala nada localmente.
> Entregas de código devem vir como arquivos prontos para ele arrastar no GitHub
> pela interface web.

---

## 1. O que é o projeto

Plataforma web própria de gestão para a agência do Diego, que atua em duas
frentes: **marketing** (projetos, campanhas) e **eventos** (casamentos,
aniversários, corporativos). Dois tipos de usuário:

- **Agência (Diego):** vê e gerencia tudo, de todos os clientes.
- **Cliente:** entra com login próprio e vê apenas os projetos, campanhas e
  eventos dele. Pode aprovar/pedir ajuste em peças e marcar checklist de
  eventos. NUNCA vê a aba Captação (leads) nem valores de outros clientes.

**Status em 10/06/2026: NO AR e funcionando** — v2 publicada, login da agência
testado com sucesso.

## 2. Arquitetura (tudo em planos gratuitos)

| Peça | Papel | Observações |
|---|---|---|
| **GitHub** | Guarda o código (repositório `plataforma-agencia`) | Único lugar que o Diego toca para atualizar: Add file > Upload files > arrastar por cima > Commit |
| **Vercel** | Hospeda o site; link público `*.vercel.app` | Conectada ao GitHub; republica sozinha a cada commit (1–2 min). Projeto Vite auto-detectado |
| **Supabase** | Banco de dados (PostgreSQL) + autenticação | Projeto na região São Paulo. URL: `https://ssuqjjiptqdgiwawdshl.supabase.co`. Usuários são criados pelo painel (Authentication > Add user, sempre com **Auto Confirm User** marcado) |
| **Google Drive** | Arquivos pesados (artes, vídeos, contratos) | Diego já paga Google One; uso manual, fora da plataforma |

O app é **PWA**: instalável pela opção "Adicionar à tela de início" no Android
e iPhone (manifest + service worker mínimo inclusos). Decisão consciente de
NÃO publicar app nativo nas lojas (custo/burocracia desnecessários).

## 3. Decisões tomadas (e caminhos descartados)

1. Diego começou pedindo organização; evoluiu para querer plataforma própria.
2. Avaliados e descartados: Notion/Trello/Airtable (queria algo próprio),
   Google One como ferramenta de gestão (é só armazenamento), **celular em casa
   como servidor** (descartado por confiabilidade/segurança — Claude orientou
   contra e Diego aceitou), apps nativos iOS/Android (substituídos por PWA).
3. Filosofia acordada: **colocar no ar e melhorar aos poucos** ("custo-benefício
   máximo"). v1 usou localStorage (teste); v2 trocou por Supabase com login.

## 4. Stack e estrutura de arquivos do repositório

React 18 + Vite 5 + @supabase/supabase-js v2. Sem Tailwind — estilos inline.
Fonte: Sora (Google Fonts). Identidade: fundo claro #F5F5F2, sidebar escura
#1C1D24, acentos violeta #5246C9 (marketing) e rosa #B05279 (eventos).

```
plataforma-agencia/
├── index.html              (PWA meta tags, lang pt-BR)
├── package.json            (react, react-dom, @supabase/supabase-js, vite)
├── vite.config.js
├── public/
│   ├── manifest.json       (PWA)
│   ├── sw.js               (service worker mínimo, sem cache)
│   └── icon-192.png / icon-512.png  (ícone roxo "sa")
└── src/
    ├── main.jsx            (render + registro do service worker)
    ├── supabase.js         (URL e chave publicável sb_publishable_... do projeto — editado pelo Diego)
    └── App.jsx             (TODO o app em um arquivo só — decisão deliberada p/ facilitar updates por upload)
```

## 5. Funcionalidades atuais (v2)

- **Login** e-mail/senha (Supabase Auth). Sem cadastro público — usuários são
  criados no painel do Supabase. Tela "Falta um passo de configuração" aparece
  se supabase.js estiver sem URL/chave.
- **Visão geral:** cards de métricas (projetos ativos, campanhas no ar, eventos
  futuros; agência vê "Em negociação R$" do funil; cliente vê "Aguardando você"),
  bloco de aprovações pendentes (cliente tem botões Aprovar → Concluído /
  Pedir ajuste → Em edição), próximos eventos, prazos mais próximos, e card
  **Clientes** (agência cadastra clientes aqui).
- **Projetos:** kanban com status Captação → Em produção → Em edição →
  Aguardando aprovação → Concluído (setas ←/→ movem). Campos: cliente, prazo
  (tag colorida: vermelho atrasado, âmbar ≤3 dias), valor R$ (visível só na
  visão agência).
- **Campanhas:** lista com interruptor Ativa/Pausada.
- **Eventos:** calendário mensal navegável (casamentos em rosa) + lista com
  status (Orçamento → Confirmado → Em planejamento → Realizado, botão "Mudar
  status" cicla) e **checklist** expansível com barra de progresso (cliente
  também pode marcar).
- **Captação** (só agência): funil Novo lead → Contato feito → Proposta enviada
  → Negociação → Fechado, com interesse Marketing/Evento, valor R$ e subtotal
  por etapa.
- **"Ver como cliente":** a agência alterna a visualização para conferir o que
  cada cliente enxerga (filtro local; a segurança real é o RLS).
- **Responsivo:** <720px vira layout mobile com header escuro + barra de
  navegação inferior fixa.
- Mutations são otimistas (atualiza estado local + grava no Supabase);
  indicador "salvando…/sincronizado ✓" no topo.

## 6. Modelo de dados (Supabase, schema public)

Criado pelo arquivo `supabase-setup.sql` (rodado com sucesso). Tabelas:

- **profiles** (id uuid = auth.users, email, role 'agencia'|'cliente',
  client_name) — criada automaticamente por trigger ao cadastrar usuário;
  role nasce 'cliente' e é editada manualmente no Table Editor.
- **clients** (name text PK)
- **projects** (id bigint PK gerado no app via Date.now(), name, client,
  status, deadline text 'YYYY-MM-DD', value numeric)
- **campaigns** (id, name, client, active boolean)
- **events** (id, name, client, date text, type, status, checklist **jsonb**
  [{id, text, done}])
- **leads** (id, name, stage, interest, value)

**RLS (segurança):** funções helper `my_role()` e `my_client()` (security
definer). Agência: policy FOR ALL em todas as tabelas. Cliente: SELECT em
projects/campaigns/events filtrado por `client = my_client()`; UPDATE em
projects (para aprovar) e events (para checklist). **leads não tem policy de
cliente** → invisível para clientes. Cliente vincula-se pelo texto
`profiles.client_name`, que deve ser IDÊNTICO (acentos/maiúsculas) ao nome na
tabela clients.

Ponto conhecido/aceito: o campo `value` de projects é tecnicamente legível
pelo cliente via API (a UI esconde). Se Diego pedir sigilo total, mover
valores para tabela privada só-agência.

## 7. Histórico de problemas já resolvidos (não repetir diagnósticos)

1. **Chaves novas do Supabase:** o painel agora mostra `sb_publishable_...`
   (usar esta, com o ícone de copiar) e `sb_secret_...` (NUNCA no site).
2. **Login falhava com "E-mail ou senha incorretos":** essa mensagem é
   GENÉRICA no código (qualquer erro de conexão cai nela). Causa real era a
   URL colada com sufixo **`/rest/v1/`** (copiada da seção Data API). Corrigido
   editando `src/supabase.js` direto no GitHub (ícone de lápis).
3. Depois da correção ainda "dava erro": era só a **Vercel ainda publicando**
   — conferir aba Deployments (status Ready) e dar Ctrl+Shift+R antes de testar.
4. Usuário agência foi recriado durante o debug; está confirmado e com
   role='agencia' (e-mail do Diego: diegofurtado67@gmail.com).
5. Navegador do Diego traduz páginas automaticamente — em prints, código
   aparece "traduzido" (importar/exportar constante etc.); é só visual, mas
   orientar a desativar tradução ao editar código.

## 8. Rotina de atualização combinada

1. Diego pede a melhoria no chat → Claude entrega arquivo(s) atualizados
   (manter os MESMOS nomes/caminhos; preferir tudo em App.jsx).
2. Diego: GitHub > Add file > Upload files > arrasta por cima > Commit changes.
3. Vercel publica sozinha. Se a melhoria exigir mudança no banco, entregar
   também um .sql para colar no SQL Editor (sempre com `if not exists` /
   migração segura — o banco JÁ TEM dados de produção, nunca dropar tabelas).

## 9. Roadmap de ideias já citadas (não implementadas)

- Domínio próprio (~R$ 40/ano) plugado na Vercel.
- Troca de senha pelo próprio app / recuperação de senha.
- Mover valores R$ para tabela privada (sigilo total).
- Possíveis evoluções faladas ao longo da conversa: campos extras (orçamento,
  contrato), notificações, relatórios mensais, upload/links de arquivos por
  projeto (hoje é Google Drive manual), fornecedores e cronograma do dia nos
  eventos, dois funis de captação (marketing × eventos).

## 10. Como retomar este projeto num chat novo

Diego: anexe este arquivo (ou cole o conteúdo) e diga o que quer. Se for
mudança no app, peça "me entregue o App.jsx atualizado" (ou o zip completo).
Claude: respeite o schema da seção 6, os nomes de arquivo da seção 4, o nível
técnico do Diego (seção topo) e o fluxo da seção 8.
