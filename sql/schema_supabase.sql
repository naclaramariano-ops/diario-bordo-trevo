-- Diário de Bordo Trevo — Supabase schema V1+V2+V3
-- Execute em um projeto novo do Supabase.
create extension if not exists pgcrypto;

-- Limpeza segura para ambiente novo/teste.
drop table if exists public.diario_maquinas cascade;
drop table if exists public.diarios cascade;
drop table if exists public.maquinas cascade;
drop table if exists public.setores cascade;
drop table if exists public.usuarios cascade;

create table public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  senha_hash text not null,
  setor text not null,
  cargo text not null,
  perfil text not null check (perfil in ('administrador','usuario')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  tipo text not null default 'envase',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.maquinas (
  id uuid primary key default gen_random_uuid(),
  setor_id uuid not null references public.setores(id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique(setor_id,nome)
);

create table public.diarios (
  id uuid primary key,
  data date not null,
  turno text not null,
  setor_id uuid references public.setores(id),
  setor_nome text not null,
  lider_id uuid references public.usuarios(id),
  lider_nome text not null,
  observacoes_gerais text not null,
  created_by uuid,
  sync_status text default 'sincronizado',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.diario_maquinas (
  id uuid primary key,
  diario_id uuid not null references public.diarios(id) on delete cascade,
  maquina_id uuid references public.maquinas(id),
  maquina_nome text not null,
  status_final text not null,
  sku_produzindo text not null,
  proximo_sku text not null,
  perdas_embalagem text not null,
  conferencia_paradas text not null,
  vencimento_cip text not null,
  limpeza_maquina_area text not null,
  faltas text not null,
  analise_sensorial text not null,
  informacoes_datador text not null,
  embalagem_selagem text not null,
  preenchimento_cep_peso text not null,
  inspecao_cop_plil text not null,
  organizacao_descartes text not null,
  organizacao_limpeza_maquina text not null,
  observacao_acao text not null,
  created_at timestamptz not null default now()
);

insert into public.setores (id,nome,tipo,ativo) values
('11111111-1111-1111-1111-111111111111','Envase 1','envase',true),
('22222222-2222-2222-2222-222222222222','Envase 2','envase',true),
('33333333-3333-3333-3333-333333333333','Processo','processo',true);

insert into public.maquinas (setor_id,nome,ativo) values
('11111111-1111-1111-1111-111111111111','BRASKOP 1',true),
('11111111-1111-1111-1111-111111111111','BRASKOP 2',true),
('11111111-1111-1111-1111-111111111111','BRASKOP 3',true),
('11111111-1111-1111-1111-111111111111','DMAX 6',true),
('11111111-1111-1111-1111-111111111111','SERAC 1',true),
('11111111-1111-1111-1111-111111111111','SERAC 2',true),
('22222222-2222-2222-2222-222222222222','DMAX 1',true),
('22222222-2222-2222-2222-222222222222','DMAX 2',true),
('22222222-2222-2222-2222-222222222222','DMAX 3',true),
('22222222-2222-2222-2222-222222222222','DMAX 4',true),
('22222222-2222-2222-2222-222222222222','GUALAPACK',true),
('22222222-2222-2222-2222-222222222222','UHT',true),
('33333333-3333-3333-3333-333333333333','Pasteurização',true),
('33333333-3333-3333-3333-333333333333','Fermentação',true),
('33333333-3333-3333-3333-333333333333','Tanques',true);

insert into public.usuarios (nome,email,senha_hash,setor,cargo,perfil,ativo) values
('Ana Peliteiro','ana.peliteiro@trevolacteos.com.br','240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9','Administrativo','Administrador','administrador',true)
on conflict (email) do update set
  nome=excluded.nome,
  senha_hash=excluded.senha_hash,
  setor=excluded.setor,
  cargo=excluded.cargo,
  perfil=excluded.perfil,
  ativo=true;


