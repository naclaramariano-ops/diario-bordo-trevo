# Diário de Bordo Trevo V6.7.10 Consolidada

## Publicação
Cloudflare Pages:
- Framework preset: Nenhum
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: vazio

Variáveis:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Banco
Execute apenas uma vez: `supabase/MIGRATION_V6_7_10_CONSOLIDADA.sql`.
Não execute `schema.sql` em banco com dados, pois o arquivo original é de instalação inicial.

## Build validado
- Node 20.18.1
- `npm ci --no-audit --no-fund`
- `npm run build`
