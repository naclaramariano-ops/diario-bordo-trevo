-- Diário de Bordo Trevo — Enterprise V11.1
-- Correção cirúrgica: preserva o fluxo da aba +Novo e impede somente
-- uma nova passagem para a mesma combinação Data + Turno + Envase.

begin;

-- Preserva o registro mais recente como oficial caso já existam duplicidades antigas.
with ranked as (
  select
    id,
    row_number() over (
      partition by data, lower(trim(turno)), lower(trim(coalesce(setor_nome,'')))
      order by
        case when lower(trim(coalesce(status,''))) in ('finalizado','finalizada') then 0 else 1 end,
        coalesce(finalizada_em, atualizado_em, criado_em) desc,
        id desc
    ) as rn
  from public.diarios
  where lower(trim(coalesce(status,''))) in ('em preenchimento','finalizado','finalizada')
)
update public.diarios d
set
  status = 'Duplicado arquivado',
  atualizado_em = now(),
  ultima_edicao_por = coalesce(ultima_edicao_por,'Migração Enterprise V11.1'),
  ultima_edicao_em = now()
from ranked r
where d.id = r.id and r.rn > 1;

-- Proteção definitiva no banco para concorrência entre aparelhos e sincronização offline.
drop index if exists public.ux_diarios_unico_data_turno_area;
create unique index ux_diarios_unico_data_turno_area
  on public.diarios (
    data,
    lower(trim(turno)),
    lower(trim(coalesce(setor_nome,'')))
  )
  where lower(trim(coalesce(status,''))) in ('em preenchimento','finalizado','finalizada');

-- Mantém a posse do rascunho existente, mas impede iniciar rascunho se a combinação
-- já tiver sido finalizada. A mensagem só será exibida no aplicativo quando o usuário
-- tentar preencher o primeiro campo de uma máquina.
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
     and lower(trim(coalesce(status,''))) in ('em preenchimento','finalizado','finalizada')
   order by case when lower(trim(coalesce(status,''))) in ('finalizado','finalizada') then 0 else 1 end,
            coalesce(finalizada_em,atualizado_em,criado_em) desc
   limit 1 for update;

  if v_existing.id is not null then
    if lower(trim(coalesce(v_existing.status,''))) in ('finalizado','finalizada') then
      raise exception 'PASSAGEM_JA_FINALIZADA|%|%',v_existing.id,coalesce(v_existing.lider_nome,v_existing.finalizada_por,'Outro usuário');
    end if;
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
     and lower(trim(coalesce(status,''))) in ('em preenchimento','finalizado','finalizada')
   order by coalesce(finalizada_em,atualizado_em,criado_em) desc limit 1;
  if lower(trim(coalesce(v_existing.status,''))) in ('finalizado','finalizada') then
    raise exception 'PASSAGEM_JA_FINALIZADA|%|%',v_existing.id,coalesce(v_existing.lider_nome,v_existing.finalizada_por,'Outro usuário');
  end if;
  raise exception 'PASSAGEM_EM_USO|%|%',v_existing.id,coalesce(v_existing.lider_nome,'Outro usuário');
end;$$;

revoke all on function public.claim_diario_draft_v10_1(uuid,date,text,text,uuid,text,uuid,text,timestamptz) from public;
grant execute on function public.claim_diario_draft_v10_1(uuid,date,text,text,uuid,text,uuid,text,timestamptz) to anon,authenticated;

-- Finalização transacional: nunca sobrescreve silenciosamente outra passagem oficial.
create or replace function public.save_diario_final_v11_1(p_payload jsonb)
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
  limit 1 for update;

  if v_existing.id is not null then
    raise exception 'PASSAGEM_JA_EXISTE|%|%|%',
      v_existing.id,coalesce(v_existing.status,''),coalesce(v_existing.lider_nome,v_existing.finalizada_por,'Outro usuário');
  end if;

  insert into public.diarios (
    id,data,turno,setor_id,setor_nome,lider_id,lider_nome,status,resumo,
    criado_por,criado_em,atualizado_em,editado,ultima_edicao_por,
    ultima_edicao_em,finalizada_em,finalizada_por
  ) values (
    v_id,v_data,v_turno,nullif(p_payload->>'setor_id','')::uuid,
    nullif(p_payload->>'setor_nome',''),nullif(p_payload->>'lider_id','')::uuid,
    nullif(p_payload->>'lider_nome',''),coalesce(nullif(p_payload->>'status',''),'Finalizado'),
    coalesce(p_payload->>'resumo',''),(p_payload->>'criado_por')::uuid,
    coalesce(nullif(p_payload->>'criado_em','')::timestamptz,now()),now(),
    coalesce((p_payload->>'editado')::boolean,false),nullif(p_payload->>'ultima_edicao_por',''),
    nullif(p_payload->>'ultima_edicao_em','')::timestamptz,
    nullif(p_payload->>'finalizada_em','')::timestamptz,nullif(p_payload->>'finalizada_por','')
  )
  on conflict (id) do update set
    data=excluded.data,turno=excluded.turno,setor_id=excluded.setor_id,setor_nome=excluded.setor_nome,
    lider_id=excluded.lider_id,lider_nome=excluded.lider_nome,status=excluded.status,resumo=excluded.resumo,
    atualizado_em=now(),editado=true,ultima_edicao_por=excluded.ultima_edicao_por,
    ultima_edicao_em=coalesce(excluded.ultima_edicao_em,now()),finalizada_em=excluded.finalizada_em,
    finalizada_por=excluded.finalizada_por;

  return query select * from public.diarios where id = v_id;
exception when unique_violation then
  select * into v_existing from public.diarios
  where data=v_data and lower(trim(turno))=lower(trim(v_turno))
    and lower(trim(coalesce(setor_nome,'')))=lower(trim(v_setor_nome))
    and lower(trim(coalesce(status,''))) in ('em preenchimento','finalizado','finalizada')
  order by coalesce(finalizada_em,atualizado_em,criado_em) desc limit 1;
  raise exception 'PASSAGEM_JA_EXISTE|%|%|%',v_existing.id,coalesce(v_existing.status,''),coalesce(v_existing.lider_nome,v_existing.finalizada_por,'Outro usuário');
end;$$;

revoke all on function public.save_diario_final_v11_1(jsonb) from public;
grant execute on function public.save_diario_final_v11_1(jsonb) to anon,authenticated;

notify pgrst,'reload schema';
commit;
