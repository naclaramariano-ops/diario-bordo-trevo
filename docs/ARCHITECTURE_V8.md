# V8 Enterprise — arquitetura de dados

## Fonte oficial
- Usuários, setores, máquinas e turnos: Supabase.
- Passagens: Supabase quando online; fila IndexedDB somente durante indisponibilidade de rede.
- IndexedDB nunca substitui silenciosamente uma consulta online que falhou.

## Módulos
- `src/core`: configuração de ambiente.
- `src/infrastructure`: clientes externos.
- `src/modules/auth`: autenticação e sessão.
- `src/modules/admin`: regras administrativas.
- `src/services`: compatibilidade e serviços de domínio existentes.
- `src/modules/offline`: reservado à evolução da fila offline.

## Segurança
A V8 usa sessão corporativa própria criada no banco. O navegador recebe um token aleatório e não lê `senha_hash` nas listagens.
