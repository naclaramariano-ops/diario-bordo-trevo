-- Diário de Bordo Trevo Enterprise - MIGRATION V5.1
-- Correção para edição de usuários e cadastro/edição de turnos.

-- Garante estrutura de usuários usada pela aba Admin.
alter table usuarios add column if not exists usuario text;
alter table usuarios add column if not exists senha_hash text;
alter table usuarios add column if not exists setor text;
alter table usuarios add column if not exists cargo text;
alter table usuarios add column if not exists perfil text;
alter table usuarios add column if not exists ativo boolean not null default true;
alter table usuarios add column if not exists trocar_senha boolean not null default true;
alter table usuarios add column if not exists atualizado_em timestamptz;

-- Remove checks antigos e padroniza perfis da aplicação.
alter table usuarios drop constraint if exists usuarios_perfil_check;
do $$
begin
  if exists (select 1 from pg_type where typname = 'perfil_usuario') then
    begin
      alter table usuarios alter column perfil type text using perfil::text;
    exception when others then
      null;
    end;

    drop type if exists perfil_usuario cascade;
  end if;
end $$;

alter table usuarios add constraint usuarios_perfil_check
check (perfil in ('administrador','usuario'));

-- Garante unicidade do login.
create unique index if not exists usuarios_usuario_unique on usuarios(lower(usuario));

-- Garante estrutura de turnos.
create table if not exists turnos(
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  inicio text not null default '00:00',
  fim text not null default '00:00',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz
);
create unique index if not exists turnos_nome_unique on turnos(lower(nome));

insert into turnos(nome,inicio,fim,ativo)
values
('1º Turno','06:00','14:00',true),
('2º Turno','14:00','22:00',true),
('3º Turno','22:00','06:00',true)
on conflict do nothing;

-- Garante logs.
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

-- RLS e policies permissivas para a fase atual do app.
alter table usuarios enable row level security;
alter table turnos enable row level security;
alter table audit_logs enable row level security;

drop policy if exists usuarios_read on usuarios;
drop policy if exists usuarios_write on usuarios;
drop policy if exists usuarios_all on usuarios;
create policy usuarios_all on usuarios for all using (true) with check (true);

drop policy if exists turnos_all on turnos;
create policy turnos_all on turnos for all using (true) with check (true);

drop policy if exists audit_all on audit_logs;
create policy audit_all on audit_logs for all using (true) with check (true);
