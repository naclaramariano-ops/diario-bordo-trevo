-- Diário de Bordo Trevo V6.8 — Rascunhos privados e controle de posse
-- Migração não destrutiva: não apaga usuários nem passagens.

alter table if exists public.diarios
  add column if not exists finalizada_em timestamptz;

alter table if exists public.diarios
  add column if not exists finalizada_por text;

create index if not exists idx_diarios_status_data_turno_area
  on public.diarios (status, data, turno, setor_nome);

create index if not exists idx_diarios_responsavel_status
  on public.diarios (criado_por, status, atualizado_em desc);

notify pgrst, 'reload schema';
