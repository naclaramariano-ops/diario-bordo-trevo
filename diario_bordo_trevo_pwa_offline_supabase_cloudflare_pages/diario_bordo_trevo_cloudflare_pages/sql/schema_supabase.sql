-- Diário de Bordo Trevo V7 | Supabase schema
-- Execute no Supabase: SQL Editor > New query > Run

create extension if not exists pgcrypto;

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  setor text not null,
  cargo text not null,
  perfil text not null default 'lider',
  ativo boolean not null default true,
  senha_demo text not null default '123456',
  criado_em timestamptz not null default now()
);

create table if not exists public.setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.maquinas (
  id uuid primary key default gen_random_uuid(),
  setor_id uuid references public.setores(id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique(setor_id,nome)
);

create table if not exists public.diarios (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  turno text not null,
  setor text not null,
  lider_id uuid references public.usuarios(id),
  lider_nome text not null,
  status_turno text not null,
  absenteismo text not null,
  seguranca text not null,
  qualidade text not null,
  producao text not null,
  manutencao text not null,
  materiais text not null,
  limpeza_organizacao text not null,
  pendencias text not null,
  prioridades_proximo_turno text not null,
  observacoes_gerais text not null,
  criado_em timestamptz not null default now()
);

create table if not exists public.diario_maquinas (
  id uuid primary key default gen_random_uuid(),
  diario_id uuid references public.diarios(id) on delete cascade,
  maquina_nome text not null,
  produto text not null,
  ordem text not null,
  status_maquina text not null,
  volume_programado text not null,
  volume_realizado text not null,
  paradas text not null,
  perdas text not null,
  observacao text not null,
  criado_em timestamptz not null default now()
);

insert into public.setores (nome, ativo) values
('Envase 1', true), ('Envase 2', true), ('Processo', true)
on conflict (nome) do nothing;

insert into public.usuarios (nome,email,setor,cargo,perfil,ativo,senha_demo) values
('Administrador','admin@trevolacteos.com.br','Administrativo','Administrador','admin',true,'admin123'),
('Líder Envase 1','lider.envase1@trevolacteos.com.br','Envase 1','Líder','lider',true,'123456'),
('Líder Envase 2','lider.envase2@trevolacteos.com.br','Envase 2','Líder','lider',true,'123456'),
('Líder Processo','lider.processo@trevolacteos.com.br','Processo','Líder','lider',true,'123456')
on conflict (email) do nothing;

insert into public.maquinas (setor_id,nome,ativo)
select s.id, m.nome, true
from public.setores s
join (values
('Envase 1','Braskop 1'),('Envase 1','Braskop 2'),('Envase 1','Braskop 3'),('Envase 1','Dmax 6'),('Envase 1','Serac 1'),('Envase 1','Serac 2'),
('Envase 2','Dmax 1'),('Envase 2','Dmax 2'),('Envase 2','Dmax 3'),('Envase 2','Dmax 4'),('Envase 2','Gualapack'),('Envase 2','UHT'),
('Processo','Pasteurização'),('Processo','Fermentação'),('Processo','Mistura'),('Processo','Tanques'),('Processo','Preparação')
) as m(setor,nome) on m.setor=s.nome
on conflict (setor_id,nome) do nothing;

alter table public.usuarios enable row level security;
alter table public.setores enable row level security;
alter table public.maquinas enable row level security;
alter table public.diarios enable row level security;
alter table public.diario_maquinas enable row level security;

-- MVP para teste com anon key. Antes de uso corporativo real, trocar para Supabase Auth + políticas por usuário/perfil.
do $$ begin create policy "mvp_all_usuarios" on public.usuarios for all using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "mvp_all_setores" on public.setores for all using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "mvp_all_maquinas" on public.maquinas for all using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "mvp_all_diarios" on public.diarios for all using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "mvp_all_diario_maquinas" on public.diario_maquinas for all using (true) with check (true); exception when duplicate_object then null; end $$;
