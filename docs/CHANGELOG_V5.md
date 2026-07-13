# Diário de Bordo Trevo — V5 Admin Enterprise

## Atualizar GitHub
SIM.

## Atualizar Supabase
SIM, se você ainda não possui a tabela `turnos` e os novos campos de máquinas.

Arquivo:
`supabase/MIGRATION_V5_ADMIN.sql`

## O que entrou na V5
- Aba Admin aparece somente para perfil `administrador`.
- Administração organizada em abas: Usuários, Setores, Máquinas, Turnos, Logs e Configurações.
- Usuários: cadastrar, editar, ativar/inativar, resetar senha e excluir.
- Setores: cadastrar, editar, ativar/inativar e excluir.
- Máquinas: cadastrar, editar, trocar setor, código/TAG, ordem, ativar/inativar e excluir.
- Turnos: cadastrar, editar, ativar/inativar e excluir.
- Logs administrativos com filtro por entidade e busca inteligente.
- Filtros inteligentes por texto, perfil, setor e status.
