-- ============================================================
-- DIÁRIO DE BORDO TREVO — V6.7.10 CONSOLIDADA
-- Migração não destrutiva.
-- Não apaga usuários, passagens, setores, máquinas ou turnos.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. AJUSTES DE ESTRUTURA
-- ============================================================

alter table if exists public.usuarios
  add column if not exists atualizado_em timestamptz default now();

alter table if exists public.setores
  add column if not exists atualizado_em timestamptz;

alter table if exists public.maquinas
  add column if not exists codigo text;

alter table if exists public.maquinas
  add column if not exists ordem integer not null default 0;

alter table if exists public.maquinas
  add column if not exists atualizado_em timestamptz;

alter table if exists public.turnos
  add column if not exists atualizado_em timestamptz;

alter table if exists public.diarios
  add column if not exists atualizado_em timestamptz;

alter table if exists public.diarios
  add column if not exists editado boolean not null default false;

alter table if exists public.diarios
  add column if not exists ultima_edicao_por text;

alter table if exists public.diarios
  add column if not exists ultima_edicao_em timestamptz;

-- Atualiza campos antigos que eventualmente estejam nulos.
update public.usuarios
set atualizado_em = coalesce(atualizado_em, criado_em, now())
where atualizado_em is null;

update public.setores
set atualizado_em = coalesce(atualizado_em, criado_em, now())
where atualizado_em is null;

update public.maquinas
set atualizado_em = coalesce(atualizado_em, criado_em, now())
where atualizado_em is null;

update public.turnos
set atualizado_em = coalesce(atualizado_em, criado_em, now())
where atualizado_em is null;

update public.diarios
set atualizado_em = coalesce(atualizado_em, criado_em, now())
where atualizado_em is null;

-- ============================================================
-- 2. GARANTIR OS TURNOS PADRÃO
-- ============================================================

insert into public.turnos (
  nome,
  inicio,
  fim,
  ativo,
  criado_em,
  atualizado_em
)
values
  ('1º Turno', '06:00', '14:00', true, now(), now()),
  ('2º Turno', '14:00', '22:00', true, now(), now()),
  ('3º Turno', '22:00', '06:00', true, now(), now())
on conflict (nome) do update
set
  inicio = excluded.inicio,
  fim = excluded.fim,
  atualizado_em = now();

-- ============================================================
-- 3. CORRIGIR AS MÁQUINAS DO ENVASE 2
-- UHT deixa de ser usado como máquina.
-- Passam a existir TBA 1 e TBA 2.
-- ============================================================

do $$
declare
  v_setor_envase_2 uuid;
  v_uht_id uuid;
  v_tba_1_id uuid;
begin
  select s.id
  into v_setor_envase_2
  from public.setores s
  where lower(trim(s.nome)) = lower('Envase 2')
  limit 1;

  if v_setor_envase_2 is not null then

    select m.id
    into v_uht_id
    from public.maquinas m
    where m.setor_id = v_setor_envase_2
      and lower(trim(m.nome)) = lower('UHT')
    limit 1;

    select m.id
    into v_tba_1_id
    from public.maquinas m
    where m.setor_id = v_setor_envase_2
      and lower(trim(m.nome)) = lower('TBA 1')
    limit 1;

    -- Se existe UHT e ainda não existe TBA 1, converte UHT em TBA 1.
    if v_uht_id is not null and v_tba_1_id is null then
      update public.maquinas
      set
        nome = 'TBA 1',
        codigo = coalesce(nullif(codigo, ''), 'TBA1'),
        ordem = 6,
        ativo = true,
        atualizado_em = now()
      where id = v_uht_id;

    -- Se UHT e TBA 1 já existem, apenas inativa UHT para evitar duplicidade.
    elsif v_uht_id is not null and v_tba_1_id is not null then
      update public.maquinas
      set
        ativo = false,
        atualizado_em = now()
      where id = v_uht_id;
    end if;

    -- Garante TBA 1.
    if not exists (
      select 1
      from public.maquinas m
      where m.setor_id = v_setor_envase_2
        and lower(trim(m.nome)) = lower('TBA 1')
    ) then
      insert into public.maquinas (
        id,
        setor_id,
        nome,
        codigo,
        ordem,
        ativo,
        criado_em,
        atualizado_em
      )
      values (
        gen_random_uuid(),
        v_setor_envase_2,
        'TBA 1',
        'TBA1',
        6,
        true,
        now(),
        now()
      );
    end if;

    -- Garante TBA 2.
    if not exists (
      select 1
      from public.maquinas m
      where m.setor_id = v_setor_envase_2
        and lower(trim(m.nome)) = lower('TBA 2')
    ) then
      insert into public.maquinas (
        id,
        setor_id,
        nome,
        codigo,
        ordem,
        ativo,
        criado_em,
        atualizado_em
      )
      values (
        gen_random_uuid(),
        v_setor_envase_2,
        'TBA 2',
        'TBA2',
        7,
        true,
        now(),
        now()
      );
    end if;

    -- Padroniza ordem e status das TBAs.
    update public.maquinas
    set
      codigo = 'TBA1',
      ordem = 6,
      ativo = true,
      atualizado_em = now()
    where setor_id = v_setor_envase_2
      and lower(trim(nome)) = lower('TBA 1');

    update public.maquinas
    set
      codigo = 'TBA2',
      ordem = 7,
      ativo = true,
      atualizado_em = now()
    where setor_id = v_setor_envase_2
      and lower(trim(nome)) = lower('TBA 2');

  end if;
end
$$;

-- ============================================================
-- 4. ÍNDICES PARA CONSULTAS E HISTÓRICO
-- ============================================================

create index if not exists idx_usuarios_nome
  on public.usuarios (lower(nome));

create index if not exists idx_usuarios_usuario
  on public.usuarios (lower(usuario));

create index if not exists idx_usuarios_ativo
  on public.usuarios (ativo);

create index if not exists idx_maquinas_setor_ativo
  on public.maquinas (setor_id, ativo);

create index if not exists idx_turnos_ativo
  on public.turnos (ativo);

create index if not exists idx_diarios_data_turno
  on public.diarios (data, turno);

create index if not exists idx_diarios_criado_por
  on public.diarios (criado_por);

create index if not exists idx_diarios_atualizado_em
  on public.diarios (atualizado_em desc);

-- ============================================================
-- 5. FUNÇÃO DE LOGIN
-- Compatível com usuário sem domínio de e-mail.
-- O perfil é retornado como texto, independentemente de a coluna
-- ser text ou enum no banco atual.
-- ============================================================

drop function if exists public.login_usuario(text, text);

create function public.login_usuario(
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
  trocar_senha boolean
)
language sql
security definer
set search_path = public
as $$
  select
    u.id,
    u.nome,
    u.usuario,
    u.setor,
    u.cargo,
    u.perfil::text,
    u.ativo,
    u.trocar_senha
  from public.usuarios u
  where lower(trim(u.usuario)) = lower(trim(p_usuario))
    and u.senha_hash = p_senha_hash
    and u.ativo is true
  limit 1;
$$;

revoke all
on function public.login_usuario(text, text)
from public;

grant execute
on function public.login_usuario(text, text)
to anon, authenticated;

-- ============================================================
-- 6. RLS E POLÍTICAS NECESSÁRIAS PARA A V6.7.10
-- Mantém compatibilidade com a arquitetura já usada na V6.7.6.
-- ============================================================

alter table public.usuarios enable row level security;
alter table public.setores enable row level security;
alter table public.maquinas enable row level security;
alter table public.turnos enable row level security;
alter table public.diarios enable row level security;

drop policy if exists usuarios_read on public.usuarios;
drop policy if exists usuarios_write on public.usuarios;
drop policy if exists usuarios_all on public.usuarios;

create policy usuarios_all
on public.usuarios
for all
to public
using (true)
with check (true);

drop policy if exists setores_all on public.setores;

create policy setores_all
on public.setores
for all
to public
using (true)
with check (true);

drop policy if exists maquinas_all on public.maquinas;

create policy maquinas_all
on public.maquinas
for all
to public
using (true)
with check (true);

drop policy if exists turnos_all on public.turnos;

create policy turnos_all
on public.turnos
for all
to public
using (true)
with check (true);

drop policy if exists diarios_all on public.diarios;

create policy diarios_all
on public.diarios
for all
to public
using (true)
with check (true);

-- ============================================================
-- 7. PERMISSÕES DAS TABELAS PARA O APLICATIVO
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
on public.usuarios
to anon, authenticated;

grant select, insert, update, delete
on public.setores
to anon, authenticated;

grant select, insert, update, delete
on public.maquinas
to anon, authenticated;

grant select, insert, update, delete
on public.turnos
to anon, authenticated;

grant select, insert, update, delete
on public.diarios
to anon, authenticated;

-- ============================================================
-- 8. RECARREGAR O CACHE DA API DO SUPABASE
-- ============================================================

notify pgrst, 'reload schema';