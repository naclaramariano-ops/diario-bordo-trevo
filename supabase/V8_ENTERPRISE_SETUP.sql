-- ============================================================
-- DIÁRIO DE BORDO TREVO — V8 ENTERPRISE
-- Supabase = fonte oficial dos dados corporativos
-- IndexedDB = cache e fila offline somente das passagens
-- ============================================================

create schema if not exists extensions;

create extension if not exists pgcrypto
with schema extensions;

-- ============================================================
-- SESSÕES DO APLICATIVO
-- ============================================================

create table if not exists public.app_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  usuario_id uuid not null
    references public.usuarios(id)
    on delete cascade,
  token_hash text not null unique,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '12 hours')
);

alter table public.app_sessions enable row level security;

revoke all
on public.app_sessions
from public, anon, authenticated;

-- ============================================================
-- VALIDAR SESSÃO
-- ============================================================

create or replace function public.validar_sessao_app_v8(
  p_session_token text
)
returns table (
  usuario_id uuid,
  perfil text
)
language sql
security definer
set search_path = public, extensions
as $$
  select
    u.id,
    u.perfil
  from public.app_sessions s
  join public.usuarios u
    on u.id = s.usuario_id
  where s.token_hash = encode(
    extensions.digest(
      coalesce(p_session_token, '')::text,
      'sha256'::text
    ),
    'hex'
  )
    and s.expira_em > now()
    and u.ativo = true
  limit 1;
$$;

-- ============================================================
-- AUTENTICAR USUÁRIO
-- ============================================================

create or replace function public.autenticar_usuario_app_v8(
  p_usuario text,
  p_senha_hash text
)
returns table (
  id uuid,
  nome text,
  usuario text,
  setor text,
  cargo text,
  perfil text,
  ativo boolean,
  trocar_senha boolean,
  criado_em timestamptz,
  atualizado_em timestamptz,
  session_token text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user public.usuarios%rowtype;
  v_token text;
begin
  select u.*
  into v_user
  from public.usuarios u
  where lower(trim(u.usuario)) = lower(trim(p_usuario))
    and u.senha_hash = p_senha_hash
  limit 1;

  if v_user.id is null or v_user.ativo is not true then
    return;
  end if;

  delete from public.app_sessions
  where expira_em <= now();

  v_token := encode(
    extensions.gen_random_bytes(32),
    'hex'
  );

  insert into public.app_sessions (
    usuario_id,
    token_hash
  )
  values (
    v_user.id,
    encode(
      extensions.digest(
        v_token::text,
        'sha256'::text
      ),
      'hex'
    )
  );

  return query
  select
    v_user.id,
    v_user.nome,
    v_user.usuario,
    v_user.setor,
    v_user.cargo,
    v_user.perfil,
    v_user.ativo,
    v_user.trocar_senha,
    v_user.criado_em,
    v_user.atualizado_em,
    v_token;
end;
$$;

-- ============================================================
-- LISTAR USUÁRIOS
-- ============================================================

create or replace function public.listar_usuarios_app_v8(
  p_session_token text
)
returns table (
  id uuid,
  nome text,
  usuario text,
  setor text,
  cargo text,
  perfil text,
  ativo boolean,
  trocar_senha boolean,
  criado_em timestamptz,
  atualizado_em timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (
    select 1
    from public.validar_sessao_app_v8(p_session_token)
  ) then
    raise exception 'Sessão inválida ou expirada';
  end if;

  return query
  select
    u.id,
    u.nome,
    u.usuario,
    u.setor,
    u.cargo,
    u.perfil,
    u.ativo,
    u.trocar_senha,
    u.criado_em,
    u.atualizado_em
  from public.usuarios u
  order by u.nome;
end;
$$;

-- ============================================================
-- SALVAR USUÁRIO
-- ============================================================

create or replace function public.salvar_usuario_app_v8(
  p_session_token text,
  p_payload jsonb
)
returns table (
  id uuid,
  nome text,
  usuario text,
  setor text,
  cargo text,
  perfil text,
  ativo boolean,
  trocar_senha boolean,
  criado_em timestamptz,
  atualizado_em timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_session record;
  v_id uuid;
  v_existing public.usuarios%rowtype;
begin
  select *
  into v_session
  from public.validar_sessao_app_v8(p_session_token);

  if v_session.usuario_id is null then
    raise exception 'Sessão inválida ou expirada';
  end if;

  if nullif(p_payload->>'id', '') is not null then
    v_id := (p_payload->>'id')::uuid;
  else
    v_id := extensions.gen_random_uuid();
  end if;

  if v_session.perfil <> 'administrador'
     and v_session.usuario_id <> v_id then
    raise exception 'Sem permissão para alterar este usuário';
  end if;

  select u.*
  into v_existing
  from public.usuarios u
  where u.id = v_id;

  if v_existing.id is null then

    if nullif(p_payload->>'senha_hash', '') is null then
      raise exception 'Senha inicial obrigatória para novo usuário';
    end if;

    insert into public.usuarios (
      id,
      nome,
      usuario,
      senha_hash,
      setor,
      cargo,
      perfil,
      ativo,
      trocar_senha,
      criado_em,
      atualizado_em
    )
    values (
      v_id,
      trim(p_payload->>'nome'),
      lower(trim(p_payload->>'usuario')),
      p_payload->>'senha_hash',
      trim(p_payload->>'setor'),
      trim(p_payload->>'cargo'),
      coalesce(nullif(p_payload->>'perfil', ''), 'usuario'),
      coalesce((p_payload->>'ativo')::boolean, true),
      coalesce((p_payload->>'trocar_senha')::boolean, true),
      now(),
      now()
    );

  else

    update public.usuarios
    set
      nome = coalesce(
        nullif(trim(p_payload->>'nome'), ''),
        nome
      ),
      usuario = coalesce(
        nullif(lower(trim(p_payload->>'usuario')), ''),
        usuario
      ),
      senha_hash = coalesce(
        nullif(p_payload->>'senha_hash', ''),
        senha_hash
      ),
      setor = coalesce(
        nullif(trim(p_payload->>'setor'), ''),
        setor
      ),
      cargo = coalesce(
        nullif(trim(p_payload->>'cargo'), ''),
        cargo
      ),
      perfil = coalesce(
        nullif(p_payload->>'perfil', ''),
        perfil
      ),
      ativo = coalesce(
        (p_payload->>'ativo')::boolean,
        ativo
      ),
      trocar_senha = coalesce(
        (p_payload->>'trocar_senha')::boolean,
        trocar_senha
      ),
      atualizado_em = now()
    where public.usuarios.id = v_id;

  end if;

  return query
  select
    u.id,
    u.nome,
    u.usuario,
    u.setor,
    u.cargo,
    u.perfil,
    u.ativo,
    u.trocar_senha,
    u.criado_em,
    u.atualizado_em
  from public.usuarios u
  where u.id = v_id;
end;
$$;

-- ============================================================
-- EXCLUIR USUÁRIO
-- ============================================================

create or replace function public.excluir_usuario_app_v8(
  p_session_token text,
  p_usuario_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_session record;
begin
  select *
  into v_session
  from public.validar_sessao_app_v8(p_session_token);

  if v_session.usuario_id is null then
    raise exception 'Sessão inválida ou expirada';
  end if;

  if v_session.perfil <> 'administrador' then
    raise exception 'Apenas administradores podem excluir usuários';
  end if;

  if v_session.usuario_id = p_usuario_id then
    raise exception 'Não é permitido excluir o próprio usuário';
  end if;

  delete from public.usuarios
  where id = p_usuario_id;

  return true;
end;
$$;

-- ============================================================
-- PERMISSÕES DAS FUNÇÕES
-- ============================================================

revoke all
on function public.validar_sessao_app_v8(text)
from public, anon, authenticated;

revoke all
on function public.autenticar_usuario_app_v8(text, text)
from public, anon, authenticated;

revoke all
on function public.listar_usuarios_app_v8(text)
from public, anon, authenticated;

revoke all
on function public.salvar_usuario_app_v8(text, jsonb)
from public, anon, authenticated;

revoke all
on function public.excluir_usuario_app_v8(text, uuid)
from public, anon, authenticated;

grant execute
on function public.autenticar_usuario_app_v8(text, text)
to anon, authenticated;

grant execute
on function public.listar_usuarios_app_v8(text)
to anon, authenticated;

grant execute
on function public.salvar_usuario_app_v8(text, jsonb)
to anon, authenticated;

grant execute
on function public.excluir_usuario_app_v8(text, uuid)
to anon, authenticated;