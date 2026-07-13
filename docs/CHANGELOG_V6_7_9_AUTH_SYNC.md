# V6.7.9 — Autenticação e sincronização corporativa

- Supabase passa a ser a fonte oficial da lista de usuários quando online.
- Cache local de usuários é substituído integralmente pela fotografia do servidor.
- Login usa função RPC segura e não expõe `senha_hash` na consulta do navegador.
- Inclui migration `MIGRATION_V6_7_9_AUTH_SYNC.sql`.
- Atualiza cache do Service Worker.
