create extension if not exists pgcrypto;

drop table if exists audit_logs cascade;
drop table if exists diarios cascade;
drop table if exists maquinas cascade;
drop table if exists setores cascade;
drop table if exists usuarios cascade;

drop type if exists perfil_usuario cascade;
create type perfil_usuario as enum ('administrador','usuario');

create table usuarios(
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  usuario text unique not null,
  senha_hash text not null,
  setor text not null,
  cargo text not null,
  perfil perfil_usuario not null default 'usuario',
  ativo boolean not null default true,
  trocar_senha boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table setores(
  id uuid primary key default gen_random_uuid(),
  nome text unique not null,
  tipo text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table maquinas(
  id uuid primary key default gen_random_uuid(),
  setor_id uuid references setores(id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique(setor_id,nome)
);

create table diarios(
  id uuid primary key,
  data date not null,
  turno text not null,
  setor_id uuid references setores(id),
  setor_nome text,
  lider_id uuid,
  lider_nome text,
  status text not null default 'Aberto',
  resumo text not null,
  criado_por uuid not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz,
  editado boolean not null default false,
  ultima_edicao_por text,
  ultima_edicao_em timestamptz
);

create table audit_logs(
  id uuid primary key default gen_random_uuid(),
  entidade text not null,
  entidade_id uuid not null,
  acao text not null,
  usuario_id uuid,
  usuario_nome text,
  detalhes jsonb,
  criado_em timestamptz not null default now()
);

insert into usuarios(nome,usuario,senha_hash,setor,cargo,perfil,ativo,trocar_senha)
values('Ana Peliteiro','ana.peliteiro','240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9','Operações','Administradora Geral','administrador',true,false);

insert into setores(nome,tipo) values ('Envase 1','envase'),('Envase 2','envase'),('Processo','processo');
insert into maquinas(setor_id,nome) select id,'Braskop 1' from setores where nome='Envase 1';
insert into maquinas(setor_id,nome) select id,'Braskop 2' from setores where nome='Envase 1';
insert into maquinas(setor_id,nome) select id,'Braskop 3' from setores where nome='Envase 1';
insert into maquinas(setor_id,nome) select id,'Dmax 6' from setores where nome='Envase 1';
insert into maquinas(setor_id,nome) select id,'Serac 1' from setores where nome='Envase 1';
insert into maquinas(setor_id,nome) select id,'Serac 2' from setores where nome='Envase 1';
insert into maquinas(setor_id,nome) select id,'Dmax 1' from setores where nome='Envase 2';
insert into maquinas(setor_id,nome) select id,'Dmax 2' from setores where nome='Envase 2';
insert into maquinas(setor_id,nome) select id,'Dmax 3' from setores where nome='Envase 2';
insert into maquinas(setor_id,nome) select id,'Dmax 4' from setores where nome='Envase 2';
insert into maquinas(setor_id,nome) select id,'Gualapack' from setores where nome='Envase 2';
insert into maquinas(setor_id,nome) select id,'UHT' from setores where nome='Envase 2';

create or replace function login_usuario(p_usuario text,p_senha_hash text)
returns table(id uuid,nome text,usuario text,setor text,cargo text,perfil perfil_usuario,ativo boolean,trocar_senha boolean)
language sql security definer as $$
  select id,nome,usuario,setor,cargo,perfil,ativo,trocar_senha
  from usuarios
  where lower(usuario)=lower(p_usuario) and senha_hash=p_senha_hash and ativo=true
  limit 1;
$$;

alter table usuarios enable row level security;
alter table setores enable row level security;
alter table maquinas enable row level security;
alter table diarios enable row level security;
alter table audit_logs enable row level security;

create policy usuarios_read on usuarios for select using (true);
create policy usuarios_write on usuarios for all using (true) with check (true);
create policy setores_all on setores for all using (true) with check (true);
create policy maquinas_all on maquinas for all using (true) with check (true);
create policy diarios_all on diarios for all using (true) with check (true);
create policy audit_all on audit_logs for all using (true) with check (true);
