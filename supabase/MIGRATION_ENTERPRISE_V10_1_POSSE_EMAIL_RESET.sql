-- Diário de Bordo Trevo — Enterprise V10.1
-- Posse atômica da passagem + recuperação segura por e-mail.
-- Não apaga usuários nem passagens existentes.

create extension if not exists pgcrypto;

alter table public.usuarios add column if not exists email text;
create unique index if not exists ux_usuarios_email_lower
  on public.usuarios (lower(trim(email)))
  where email is not null and trim(email) <> '';

create table if not exists public.password_reset_codes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  used_at timestamptz,
  requested_at timestamptz not null default now(),
  requester_ip text
);
alter table public.password_reset_codes enable row level security;
revoke all on public.password_reset_codes from public, anon, authenticated;
create index if not exists idx_password_reset_active
  on public.password_reset_codes(usuario_id,expires_at desc)
  where used_at is null;

-- Corrige eventuais duplicidades antigas antes de reforçar o índice único.
with ranked as (
  select id,row_number() over(partition by data,turno,lower(trim(coalesce(setor_nome,''))) order by coalesce(atualizado_em,criado_em) desc,id desc) rn
  from public.diarios
  where lower(trim(coalesce(status,'')))='em preenchimento'
)
update public.diarios d set status='Rascunho substituído',atualizado_em=now()
from ranked r where d.id=r.id and r.rn>1;

drop index if exists public.ux_diarios_em_preenchimento_data_turno_area;
create unique index ux_diarios_em_preenchimento_data_turno_area
  on public.diarios(data,turno,lower(trim(coalesce(setor_nome,''))))
  where lower(trim(coalesce(status,'')))='em preenchimento';

create or replace function public.claim_diario_draft_v10_1(
  p_id uuid,p_data date,p_turno text,p_setor_nome text,p_lider_id uuid,
  p_lider_nome text,p_criado_por uuid,p_resumo text,p_criado_em timestamptz
)
returns setof public.diarios
language plpgsql security definer set search_path=public
as $$
declare v_existing public.diarios%rowtype; v_key text;
begin
  v_key:=p_data::text||'|'||lower(trim(p_turno))||'|'||lower(trim(p_setor_nome));
  perform pg_advisory_xact_lock(hashtext(v_key));
  select * into v_existing from public.diarios
   where data=p_data and lower(trim(turno))=lower(trim(p_turno))
     and lower(trim(coalesce(setor_nome,'')))=lower(trim(coalesce(p_setor_nome,'')))
     and lower(trim(coalesce(status,'')))='em preenchimento'
   order by coalesce(atualizado_em,criado_em) desc limit 1 for update;
  if v_existing.id is not null then
    if v_existing.criado_por<>p_criado_por then
      raise exception 'PASSAGEM_EM_USO|%|%',v_existing.id,coalesce(v_existing.lider_nome,'Outro usuário');
    end if;
    update public.diarios set resumo=p_resumo,lider_id=p_lider_id,lider_nome=p_lider_nome,
      atualizado_em=now(),status='Em preenchimento'
      where id=v_existing.id;
    return query select * from public.diarios where id=v_existing.id;
    return;
  end if;
  insert into public.diarios(id,data,turno,setor_nome,lider_id,lider_nome,status,resumo,criado_por,criado_em,atualizado_em,editado)
  values(p_id,p_data,p_turno,p_setor_nome,p_lider_id,p_lider_nome,'Em preenchimento',p_resumo,p_criado_por,coalesce(p_criado_em,now()),now(),false);
  return query select * from public.diarios where id=p_id;
exception when unique_violation then
  select * into v_existing from public.diarios
   where data=p_data and lower(trim(turno))=lower(trim(p_turno))
     and lower(trim(coalesce(setor_nome,'')))=lower(trim(coalesce(p_setor_nome,'')))
     and lower(trim(coalesce(status,'')))='em preenchimento' limit 1;
  raise exception 'PASSAGEM_EM_USO|%|%',v_existing.id,coalesce(v_existing.lider_nome,'Outro usuário');
end;$$;
revoke all on function public.claim_diario_draft_v10_1(uuid,date,text,text,uuid,text,uuid,text,timestamptz) from public;
grant execute on function public.claim_diario_draft_v10_1(uuid,date,text,text,uuid,text,uuid,text,timestamptz) to anon,authenticated;

notify pgrst,'reload schema';
