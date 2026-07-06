-- Diário de Bordo Trevo Enterprise - MIGRATION V5.3
-- Correção definitiva do login V5: perfis, senha da Ana, RLS e função opcional.

alter table usuarios add column if not exists usuario text;
alter table usuarios add column if not exists senha_hash text;
alter table usuarios add column if not exists setor text;
alter table usuarios add column if not exists cargo text;
alter table usuarios add column if not exists perfil text;
alter table usuarios add column if not exists ativo boolean not null default true;
alter table usuarios add column if not exists trocar_senha boolean not null default true;
alter table usuarios add column if not exists atualizado_em timestamptz;

alter table usuarios drop constraint if exists usuarios_perfil_check;
alter table usuarios add constraint usuarios_perfil_check
check (perfil in ('administrador','usuario'));

create unique index if not exists usuarios_usuario_unique on usuarios(lower(usuario));

alter table usuarios enable row level security;
drop policy if exists usuarios_read on usuarios;
drop policy if exists usuarios_write on usuarios;
drop policy if exists usuarios_all on usuarios;
create policy usuarios_all on usuarios for all using (true) with check (true);

-- Garante a usuária administradora com senha admin123 em SHA-256.
insert into usuarios(nome,usuario,senha_hash,setor,cargo,perfil,ativo,trocar_senha,atualizado_em)
values (
  'Ana Peliteiro',
  'ana.peliteiro',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'Operações',
  'Administradora Geral',
  'administrador',
  true,
  false,
  now()
)
on conflict (lower(usuario)) do update set
  nome = excluded.nome,
  senha_hash = excluded.senha_hash,
  setor = excluded.setor,
  cargo = excluded.cargo,
  perfil = excluded.perfil,
  ativo = true,
  trocar_senha = false,
  atualizado_em = now();

-- Função opcional mantida compatível para versões antigas do app.
drop function if exists login_usuario(text,text);
create or replace function login_usuario(p_usuario text,p_senha_hash text)
returns table(id uuid,nome text,usuario text,setor text,cargo text,perfil text,ativo boolean,trocar_senha boolean)
language sql security definer as $$
  select id,nome,usuario,setor,cargo,perfil,ativo,trocar_senha
  from usuarios
  where lower(usuario)=lower(p_usuario) and senha_hash=p_senha_hash and ativo=true
  limit 1;
$$;
