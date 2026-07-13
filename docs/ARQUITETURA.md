# Diário de Bordo Trevo — V8.2 Enterprise

## Fonte de dados
- Supabase: usuários, setores, máquinas, turnos, logs e passagens sincronizadas.
- IndexedDB: cache local e fila offline das passagens; nunca substitui a fonte oficial online.

## Organização
- `src/core`: configuração central.
- `src/infrastructure`: clientes externos.
- `src/modules`: regras por domínio.
- `src/services`: sincronização, API e banco local.
- `src/data`: catálogos operacionais.
- `src/types`: contratos TypeScript.

## Build
O repositório contém `package-lock.json` com URLs públicas do registro npm. O Cloudflare executa `npm clean-install` e `npm run build` normalmente.
