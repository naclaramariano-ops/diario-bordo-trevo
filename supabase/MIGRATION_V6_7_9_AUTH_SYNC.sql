-- Diário de Bordo Trevo V6.7.9
-- Corrige autenticação sem expor senha_hash e padroniza leitura corporativa de usuários.

begin;

grant usage on schema public to anon, authenticated;

-- A tela administrativa lê somente campos seguros.
grant select (
  id, nome, usuario, setor, cargo, perfil, ativo, trocar_senha, criado_em, atualizado_em
) on public.usuarios to anon, authenticated;

create or replace function public.autenticar_usuario_app(
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
  atualizado_em timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    u.id, u.nome, u.usuario, u.setor, u.cargo, u.perfil, u.ativo,
    coalesce(u.trocar_senha, false), u.criado_em, u.atualizado_em
  from public.usuarios u
  where lower(u.usuario) = lower(trim(p_usuario))
    and u.senha_hash = p_senha_hash
    and u.ativo = true
  limit 1;
$$;

revoke all on function public.autenticar_usuario_app(text,text) from public;
grant execute on function public.autenticar_usuario_app(text,text) to anon, authenticated;

commit;
