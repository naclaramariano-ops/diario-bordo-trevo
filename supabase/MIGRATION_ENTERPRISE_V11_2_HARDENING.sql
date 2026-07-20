-- Diário de Bordo Trevo — Enterprise V11.2 Hardening
-- Proteção de concorrência, histórico de revisões e conflitos de sincronização.
-- Não altera o fluxo da aba +Novo nem as regras funcionais já aprovadas.

begin;

-- 1) Controle de versão otimista por registro.
alter table public.diarios
  add column if not exists revision_no bigint not null default 1;

-- 2) Histórico imutável antes de cada alteração ou exclusão.
create table if not exists public.diario_revisions (
  id uuid primary key default gen_random_uuid(),
  diario_id uuid not null,
  revision_no bigint not null,
  action text not null check (action in ('UPDATE','DELETE')),
  snapshot jsonb not null,
  actor_id uuid null,
  actor_nome text null,
  created_at timestamptz not null default now()
);

create index if not exists ix_diario_revisions_diario
  on public.diario_revisions(diario_id, revision_no desc, created_at desc);

alter table public.diario_revisions enable row level security;
revoke all on public.diario_revisions from public, anon, authenticated;

create or replace function public.capture_diario_revision_v11_2()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.diario_revisions(
    diario_id, revision_no, action, snapshot, actor_id, actor_nome
  ) values (
    old.id,
    coalesce(old.revision_no, 1),
    tg_op,
    to_jsonb(old),
    case
      when tg_op = 'UPDATE' then new.criado_por
      else old.criado_por
    end,
    case
      when tg_op = 'UPDATE' then coalesce(new.ultima_edicao_por, new.finalizada_por, new.lider_nome)
      else coalesce(old.ultima_edicao_por, old.finalizada_por, old.lider_nome)
    end
  );

  if tg_op = 'UPDATE' then
    new.revision_no := coalesce(old.revision_no, 1) + 1;
    return new;
  end if;

  return old;
end;
$$;

drop trigger if exists trg_diarios_revision_v11_2 on public.diarios;
create trigger trg_diarios_revision_v11_2
before update or delete on public.diarios
for each row execute function public.capture_diario_revision_v11_2();

-- 3) Registro server-side de conflitos originados no modo offline.
create table if not exists public.diario_sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  diario_id uuid null,
  conflict_type text not null,
  conflict_key text null,
  local_payload jsonb not null default '{}'::jsonb,
  server_payload jsonb null,
  detected_by uuid null,
  detected_by_name text null,
  status text not null default 'Pendente',
  detected_at timestamptz not null default now(),
  resolved_at timestamptz null,
  resolved_by uuid null,
  resolution_notes text null
);

create index if not exists ix_diario_sync_conflicts_status
  on public.diario_sync_conflicts(status, detected_at desc);
create index if not exists ix_diario_sync_conflicts_diario
  on public.diario_sync_conflicts(diario_id, detected_at desc);

alter table public.diario_sync_conflicts enable row level security;
revoke all on public.diario_sync_conflicts from public, anon, authenticated;

create or replace function public.register_diario_sync_conflict_v11_2(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into public.diario_sync_conflicts(
    id, diario_id, conflict_type, conflict_key, local_payload,
    server_payload, detected_by, detected_by_name
  ) values (
    v_id,
    nullif(p_payload->>'diario_id','')::uuid,
    coalesce(nullif(p_payload->>'conflict_type',''),'desconhecido'),
    nullif(p_payload->>'conflict_key',''),
    coalesce(p_payload->'local_payload','{}'::jsonb),
    p_payload->'server_payload',
    nullif(p_payload->>'detected_by','')::uuid,
    nullif(p_payload->>'detected_by_name','')
  );
  return v_id;
end;
$$;

revoke all on function public.register_diario_sync_conflict_v11_2(jsonb) from public;
grant execute on function public.register_diario_sync_conflict_v11_2(jsonb) to anon, authenticated;

-- 4) Reserva transacional da passagem. Mantém o comportamento aprovado:
--    só é acionada após o primeiro preenchimento real de uma máquina.
create or replace function public.claim_diario_draft_v11_2(
  p_id uuid,p_data date,p_turno text,p_setor_nome text,p_lider_id uuid,
  p_lider_nome text,p_criado_por uuid,p_resumo text,p_criado_em timestamptz
)
returns setof public.diarios
language plpgsql security definer set search_path=public
as $$
declare v_existing public.diarios%rowtype; v_key text;
begin
  v_key:=p_data::text||'|'||lower(trim(p_turno))||'|'||lower(trim(coalesce(p_setor_nome,'')));
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

  insert into public.diarios(id,data,turno,setor_nome,lider_id,lider_nome,status,resumo,criado_por,criado_em,atualizado_em,editado,revision_no)
  values(p_id,p_data,p_turno,p_setor_nome,p_lider_id,p_lider_nome,'Em preenchimento',p_resumo,p_criado_por,coalesce(p_criado_em,now()),now(),false,1);
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

revoke all on function public.claim_diario_draft_v11_2(uuid,date,text,text,uuid,text,uuid,text,timestamptz) from public;
grant execute on function public.claim_diario_draft_v11_2(uuid,date,text,text,uuid,text,uuid,text,timestamptz) to anon,authenticated;

-- 5) Finalização/edição transacional com bloqueio de duplicidade e versão otimista.
create or replace function public.save_diario_final_v11_2(p_payload jsonb)
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
  v_expected_revision bigint := nullif(p_payload->>'revision_no','')::bigint;
  v_existing public.diarios%rowtype;
  v_same_id public.diarios%rowtype;
  v_key text;
begin
  if v_id is null or v_data is null or trim(coalesce(v_turno,'')) = '' then
    raise exception 'PAYLOAD_INVALIDO';
  end if;

  v_key := v_data::text || '|' || lower(trim(v_turno)) || '|' || lower(trim(v_setor_nome));
  perform pg_advisory_xact_lock(hashtext(v_key));

  select * into v_same_id from public.diarios where id=v_id for update;
  if v_same_id.id is not null and v_expected_revision is not null
     and coalesce(v_same_id.revision_no,1) <> v_expected_revision then
    raise exception 'CONFLITO_VERSAO|%|%',v_same_id.id,coalesce(v_same_id.revision_no,1);
  end if;

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
    ultima_edicao_em,finalizada_em,finalizada_por,revision_no
  ) values (
    v_id,v_data,v_turno,nullif(p_payload->>'setor_id','')::uuid,
    nullif(p_payload->>'setor_nome',''),nullif(p_payload->>'lider_id','')::uuid,
    nullif(p_payload->>'lider_nome',''),coalesce(nullif(p_payload->>'status',''),'Finalizado'),
    coalesce(p_payload->>'resumo',''),(p_payload->>'criado_por')::uuid,
    coalesce(nullif(p_payload->>'criado_em','')::timestamptz,now()),now(),
    coalesce((p_payload->>'editado')::boolean,false),nullif(p_payload->>'ultima_edicao_por',''),
    nullif(p_payload->>'ultima_edicao_em','')::timestamptz,
    nullif(p_payload->>'finalizada_em','')::timestamptz,nullif(p_payload->>'finalizada_por',''),1
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

revoke all on function public.save_diario_final_v11_2(jsonb) from public;
grant execute on function public.save_diario_final_v11_2(jsonb) to anon,authenticated;

notify pgrst,'reload schema';
commit;
