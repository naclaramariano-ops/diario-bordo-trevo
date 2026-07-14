-- Diário de Bordo Trevo V6.7.10 consolidada
-- Migração NÃO destrutiva. Não apaga usuários nem passagens existentes.
create extension if not exists pgcrypto;

alter table if exists public.usuarios add column if not exists atualizado_em timestamptz default now();
alter table if exists public.diarios add column if not exists atualizado_em timestamptz;
alter table if exists public.diarios add column if not exists editado boolean not null default false;
alter table if exists public.diarios add column if not exists ultima_edicao_por text;
alter table if exists public.diarios add column if not exists ultima_edicao_em timestamptz;

-- Garante máquinas corretas no Envase 2: TBA 1 e TBA 2, sem usar UHT como máquina.
do $$
declare v_setor uuid;
begin
  select id into v_setor from public.setores where lower(nome)=lower('Envase 2') limit 1;
  if v_setor is not null then
    if exists(select 1 from public.maquinas where setor_id=v_setor and lower(nome)=lower('UHT'))
       and not exists(select 1 from public.maquinas where setor_id=v_setor and lower(nome)=lower('TBA 1')) then
      update public.maquinas set nome='TBA 1', atualizado_em=now() where setor_id=v_setor and lower(nome)=lower('UHT');
    end if;
    if not exists(select 1 from public.maquinas where setor_id=v_setor and lower(nome)=lower('TBA 1')) then
      insert into public.maquinas(id,setor_id,nome,codigo,ordem,ativo,criado_em,atualizado_em)
      values(gen_random_uuid(),v_setor,'TBA 1','',6,true,now(),now());
    end if;
    if not exists(select 1 from public.maquinas where setor_id=v_setor and lower(nome)=lower('TBA 2')) then
      insert into public.maquinas(id,setor_id,nome,codigo,ordem,ativo,criado_em,atualizado_em)
      values(gen_random_uuid(),v_setor,'TBA 2','',7,true,now(),now());
    end if;
  end if;
end $$;

-- Índices para leitura simultânea e histórico.
create index if not exists idx_usuarios_nome on public.usuarios(lower(nome));
create index if not exists idx_usuarios_usuario on public.usuarios(lower(usuario));
create index if not exists idx_diarios_data_turno on public.diarios(data,turno);
create index if not exists idx_diarios_criado_por on public.diarios(criado_por);
create index if not exists idx_diarios_atualizado_em on public.diarios(atualizado_em desc);

-- Mantém a função de login compatível com usuário sem domínio.
create or replace function public.login_usuario(p_usuario text,p_senha_hash text)
returns table(id uuid,nome text,usuario text,setor text,cargo text,perfil perfil_usuario,ativo boolean,trocar_senha boolean)
language sql security definer set search_path=public as $$
  select u.id,u.nome,u.usuario,u.setor,u.cargo,u.perfil,u.ativo,u.trocar_senha
  from public.usuarios u
  where lower(trim(u.usuario))=lower(trim(p_usuario)) and u.senha_hash=p_senha_hash and u.ativo=true
  limit 1;
$$;

grant execute on function public.login_usuario(text,text) to anon, authenticated;
