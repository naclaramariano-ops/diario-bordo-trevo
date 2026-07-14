-- Diário de Bordo Trevo V6.8.2
-- Controle de passagem por Data + Turno + Área.
-- Não apaga usuários nem passagens finalizadas.

alter table if exists public.diarios
  add column if not exists finalizada_em timestamptz;

alter table if exists public.diarios
  add column if not exists finalizada_por text;

-- Se existirem duplicidades antigas em andamento para a mesma combinação,
-- preserva a mais recente e encerra as demais como substituídas.
with ranked as (
  select id,
         row_number() over (
           partition by data, turno, lower(coalesce(setor_nome,''))
           order by coalesce(atualizado_em, criado_em) desc, id desc
         ) as rn
  from public.diarios
  where lower(coalesce(status,'')) = 'em preenchimento'
)
update public.diarios d
set status = 'Rascunho substituído',
    atualizado_em = now()
from ranked r
where d.id = r.id
  and r.rn > 1;

create unique index if not exists ux_diarios_em_preenchimento_data_turno_area
  on public.diarios (data, turno, lower(coalesce(setor_nome,'')))
  where lower(coalesce(status,'')) = 'em preenchimento';

create index if not exists idx_diarios_responsavel_status_atualizacao
  on public.diarios (criado_por, status, atualizado_em desc);

create index if not exists idx_diarios_data_turno_area_status
  on public.diarios (data, turno, setor_nome, status);

notify pgrst, 'reload schema';
