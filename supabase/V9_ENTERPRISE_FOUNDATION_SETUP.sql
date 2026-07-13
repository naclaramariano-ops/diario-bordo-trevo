-- Diário de Bordo Trevo — V9 Enterprise Foundation
-- Seguro para executar mais de uma vez. Não exclui usuários nem dados existentes.

create or replace function public.autenticar_usuario_app_v9(
  p_usuario text,
  p_senha_hash text
)
returns table(
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
  where lower(trim(u.usuario)) = lower(trim(p_usuario))
    and u.senha_hash = p_senha_hash
    and u.ativo = true
  limit 1;
$$;

revoke all on function public.autenticar_usuario_app_v9(text,text) from public;
grant execute on function public.autenticar_usuario_app_v9(text,text) to anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.usuarios to anon, authenticated;
grant select, insert, update, delete on public.setores to anon, authenticated;
grant select, insert, update, delete on public.maquinas to anon, authenticated;
grant select, insert, update, delete on public.turnos to anon, authenticated;
grant select, insert, update, delete on public.diarios to anon, authenticated;
grant select, insert on public.audit_logs to anon, authenticated;

create index if not exists idx_usuarios_usuario_lower on public.usuarios (lower(usuario));
create index if not exists idx_diarios_data_turno on public.diarios (data, turno);
create index if not exists idx_diarios_criado_por on public.diarios (criado_por);
