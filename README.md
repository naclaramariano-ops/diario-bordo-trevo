# Diário de Bordo Trevo — V5 Enterprise Foundation

Base V5 preservada, com reforço enterprise na camada offline/sincronização.

## Atualização

1. Substitua os arquivos no repositório GitHub.
2. Faça Commit.
3. Faça Push origin.
4. Aguarde o Cloudflare publicar.
5. No navegador, use Ctrl + F5 uma vez.

## Supabase

Não precisa rodar SQL novo se a V5.4 já foi aplicada.

## Entregue nesta versão

- Migração automática do IndexedDB.
- Versionamento do banco offline.
- Criação automática de novas object stores.
- Sincronização resiliente com fila.
- Registro de conflitos offline x online.
- Atualização silenciosa via Service Worker.
- Mantém o que já estava funcionando na V5.

Veja detalhes em `docs/CHANGELOG_V5_ENTERPRISE_FOUNDATION.md`.
