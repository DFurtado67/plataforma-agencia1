-- =============================================================
-- PLATAFORMA DA AGÊNCIA — Script de criação do banco (Supabase)
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique RUN.
-- =============================================================

-- 1. Perfis: liga cada usuário (login) a um papel e a um cliente
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  role text not null default 'cliente',      -- 'agencia' ou 'cliente'
  client_name text                            -- qual cliente esse login enxerga
);

alter table public.profiles enable row level security;

create policy "usuario le o proprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

-- Cria o perfil automaticamente quando um usuário novo é cadastrado
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Funções auxiliares usadas nas regras de permissão
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.my_client()
returns text language sql stable security definer set search_path = public
as $$ select client_name from public.profiles where id = auth.uid() $$;

-- 2. Tabelas da plataforma
create table public.clients (
  name text primary key
);

create table public.projects (
  id bigint primary key,
  name text not null,
  client text not null,
  status text not null default 'Captação',
  deadline text default '',
  value numeric default 0
);

create table public.campaigns (
  id bigint primary key,
  name text not null,
  client text not null,
  active boolean default true
);

create table public.events (
  id bigint primary key,
  name text not null,
  client text not null,
  date text not null,
  type text default 'Outro',
  status text default 'Orçamento',
  checklist jsonb default '[]'::jsonb
);

create table public.leads (
  id bigint primary key,
  name text not null,
  stage text default 'Novo lead',
  interest text default 'Marketing',
  value numeric default 0
);

-- 3. Liga a segurança por linha (RLS) em tudo
alter table public.clients   enable row level security;
alter table public.projects  enable row level security;
alter table public.campaigns enable row level security;
alter table public.events    enable row level security;
alter table public.leads     enable row level security;

-- 4. Agência: acesso total a tudo
create policy "agencia tudo em clients"   on public.clients   for all using (public.my_role() = 'agencia') with check (public.my_role() = 'agencia');
create policy "agencia tudo em projects"  on public.projects  for all using (public.my_role() = 'agencia') with check (public.my_role() = 'agencia');
create policy "agencia tudo em campaigns" on public.campaigns for all using (public.my_role() = 'agencia') with check (public.my_role() = 'agencia');
create policy "agencia tudo em events"    on public.events    for all using (public.my_role() = 'agencia') with check (public.my_role() = 'agencia');
create policy "agencia tudo em leads"     on public.leads     for all using (public.my_role() = 'agencia') with check (public.my_role() = 'agencia');

-- 5. Cliente: enxerga e interage apenas com o que é dele
--    (a tabela leads NÃO tem regra para cliente: ele nunca vê a captação)
create policy "cliente le seus projetos"
  on public.projects for select
  using (client = public.my_client());

create policy "cliente aprova seus projetos"
  on public.projects for update
  using (client = public.my_client())
  with check (client = public.my_client());

create policy "cliente le suas campanhas"
  on public.campaigns for select
  using (client = public.my_client());

create policy "cliente le seus eventos"
  on public.events for select
  using (client = public.my_client());

create policy "cliente marca checklist dos seus eventos"
  on public.events for update
  using (client = public.my_client())
  with check (client = public.my_client());

-- Pronto! Agora siga o guia para criar seu usuário e marcar como 'agencia'.
