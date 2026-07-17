-- Diário de Bordo Trevo — Enterprise V11
-- Garante um único registro oficial por Data + Turno + Envase.
-- Preserva registros antigos: duplicados anteriores são arquivados, não apagados.

begin;

-- 1) Arquiva duplicidades antigas, mantendo como oficial o registro mais recente.
with ranked as (
  select
    id,
    row_number() over (
      partition by data, lower(trim(turno)), lower(trim(coalesce(setor_nome,'')))
      order by case when lower(trim(coalesce(status,''))) in ('finalizado','finalizada') then 0 else 1 end,
               coalesce(finalizada_em, atualizado_em, criado_em) desc, id desc
    ) as rn
  from public.diarios
  where lower(trim(coalesce(status,''))) in ('em preenchimento','finalizado','finalizada')
)
update public.diarios d
set
  status = 'Duplicado arquivado',
  atualizado_em = now(),
  ultima_edicao_por = coalesce(ultima_edicao_por,'Migração Enterprise V11'),
  ultima_edicao_em = now()
from ranked r
where d.id = r.id
  and r.rn > 1;

-- 2) Uma única passagem ativa/oficial por data, turno e envase.
drop index if exists public.ux_diarios_unico_data_turno_area;
create unique index ux_diarios_unico_data_turno_area
  on public.diarios (
    data,
    lower(trim(turno)),
    lower(trim(coalesce(setor_nome,'')))
  )
  where lower(trim(coalesce(status,''))) in ('em preenchimento','finalizado','finalizada');

-- 3) Salvamento transacional da passagem finalizada.
create or replace function public.save_diario_final_v11(p_payload jsonb)
returns setof public.diarios
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := (p_payload->>'id')::uuid;
  v_data date := (p_payload->>'data')::date;
  v_turno text := p_payload->>'turno';
  v_setor_nome text := coalesce(p_payload->>'setor_nome','');
  v_existing public.diarios%rowtype;
  v_key text;
begin
  if v_id is null or v_data is null or trim(coalesce(v_turno,'')) = '' then
    raise exception 'PAYLOAD_INVALIDO';
  end if;

  v_key := v_data::text || '|' || lower(trim(v_turno)) || '|' || lower(trim(v_setor_nome));
  perform pg_advisory_xact_lock(hashtext(v_key));

  select * into v_existing
  from public.diarios
  where data = v_data
    and lower(trim(turno)) = lower(trim(v_turno))
    and lower(trim(coalesce(setor_nome,''))) = lower(trim(v_setor_nome))
    and lower(trim(coalesce(status,''))) in ('em preenchimento','finalizado','finalizada')
    and id <> v_id
  order by coalesce(finalizada_em, atualizado_em, criado_em) desc
  limit 1
  for update;

  if v_existing.id is not null then
    raise exception 'PASSAGEM_JA_EXISTE|%|%|%',
      v_existing.id,
      coalesce(v_existing.status,''),
      coalesce(v_existing.lider_nome,v_existing.finalizada_por,'Outro usuário');
  end if;

  insert into public.diarios (
    id,data,turno,setor_id,setor_nome,lider_id,lider_nome,status,resumo,
    criado_por,criado_em,atualizado_em,editado,ultima_edicao_por,
    ultima_edicao_em,finalizada_em,finalizada_por
  ) values (
    v_id,
    v_data,
    v_turno,
    nullif(p_payload->>'setor_id','')::uuid,
    nullif(p_payload->>'setor_nome',''),
    nullif(p_payload->>'lider_id','')::uuid,
    nullif(p_payload->>'lider_nome',''),
    coalesce(nullif(p_payload->>'status',''),'Finalizado'),
    coalesce(p_payload->>'resumo',''),
    (p_payload->>'criado_por')::uuid,
    coalesce(nullif(p_payload->>'criado_em','')::timestamptz,now()),
    now(),
    coalesce((p_payload->>'editado')::boolean,false),
    nullif(p_payload->>'ultima_edicao_por',''),
    nullif(p_payload->>'ultima_edicao_em','')::timestamptz,
    nullif(p_payload->>'finalizada_em','')::timestamptz,
    nullif(p_payload->>'finalizada_por','')
  )
  on conflict (id) do update set
    data = excluded.data,
    turno = excluded.turno,
    setor_id = excluded.setor_id,
    setor_nome = excluded.setor_nome,
    lider_id = excluded.lider_id,
    lider_nome = excluded.lider_nome,
    status = excluded.status,
    resumo = excluded.resumo,
    atualizado_em = now(),
    editado = true,
    ultima_edicao_por = excluded.ultima_edicao_por,
    ultima_edicao_em = coalesce(excluded.ultima_edicao_em,now()),
    finalizada_em = excluded.finalizada_em,
    finalizada_por = excluded.finalizada_por;

  return query select * from public.diarios where id = v_id;
exception
  when unique_violation then
    select * into v_existing
    from public.diarios
    where data = v_data
      and lower(trim(turno)) = lower(trim(v_turno))
      and lower(trim(coalesce(setor_nome,''))) = lower(trim(v_setor_nome))
      and lower(trim(coalesce(status,''))) in ('em preenchimento','finalizado','finalizada')
    order by coalesce(finalizada_em, atualizado_em, criado_em) desc
    limit 1;
    raise exception 'PASSAGEM_JA_EXISTE|%|%|%',
      v_existing.id,
      coalesce(v_existing.status,''),
      coalesce(v_existing.lider_nome,v_existing.finalizada_por,'Outro usuário');
end;
$$;

revoke all on function public.save_diario_final_v11(jsonb) from public;
grant execute on function public.save_diario_final_v11(jsonb) to anon, authenticated;

notify pgrst,'reload schema';
commit;
