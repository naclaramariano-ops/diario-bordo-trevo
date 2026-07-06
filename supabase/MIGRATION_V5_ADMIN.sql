-- Diário de Bordo Trevo Enterprise - MIGRATION V5 ADMIN
-- Rodar somente se você já possui o banco da versão anterior.

alter table maquinas add column if not exists codigo text;
alter table maquinas add column if not exists ordem integer not null default 0;
alter table maquinas add column if not exists atualizado_em timestamptz;

alter table setores add column if not exists atualizado_em timestamptz;

create table if not exists turnos(
  id uuid primary key default gen_random_uuid(),
  nome text unique not null,
  inicio text not null default '00:00',
  fim text not null default '00:00',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz
);

insert into turnos(nome,inicio,fim,ativo)
values
('1º Turno','06:00','14:00',true),
('2º Turno','14:00','22:00',true),
('3º Turno','22:00','06:00',true)
on conflict (nome) do nothing;

alter table turnos enable row level security;
drop policy if exists turnos_all on turnos;
create policy turnos_all on turnos for all using (true) with check (true);

-- Garante que logs estejam disponíveis para a V5.
create table if not exists audit_logs(
  id uuid primary key default gen_random_uuid(),
  entidade text not null,
  entidade_id uuid not null,
  acao text not null,
  usuario_id uuid,
  usuario_nome text,
  detalhes jsonb,
  criado_em timestamptz not null default now()
);

alter table audit_logs enable row level security;
drop policy if exists audit_all on audit_logs;
create policy audit_all on audit_logs for all using (true) with check (true);
