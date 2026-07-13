-- Diário de Bordo Trevo Enterprise - MIGRATION V5.4
-- Correção de senha padrão para novos usuários, RLS e turnos duplicados.

alter table usuarios alter column senha_hash set default '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';

update usuarios
set senha_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    trocar_senha = true,
    atualizado_em = now()
where senha_hash is null;

update usuarios
set senha_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    ativo = true,
    perfil = 'administrador',
    trocar_senha = false,
    atualizado_em = now()
where usuario = 'ana.peliteiro';

alter table usuarios enable row level security;
drop policy if exists usuarios_all on usuarios;
create policy usuarios_all on usuarios for all using (true) with check (true);

alter table turnos enable row level security;
drop policy if exists turnos_all on turnos;
create policy turnos_all on turnos for all using (true) with check (true);

-- Remove duplicados por nome, mantendo o primeiro criado.
with duplicados as (
  select id, row_number() over (partition by lower(nome) order by criado_em asc, id asc) as rn
  from turnos
)
delete from turnos t
using duplicados d
where t.id = d.id and d.rn > 1;

create unique index if not exists turnos_nome_unique on turnos(lower(nome));
