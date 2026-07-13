# Diário de Bordo Trevo — V8.2 Enterprise

## Publicação no Cloudflare Pages

- Framework preset: **Nenhum** ou **Vite**
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: vazio

Variáveis já usadas pelo aplicativo:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Supabase
Execute uma única vez:

`supabase/V8_2_ENTERPRISE_SETUP.sql`

O SQL é idempotente e não apaga os usuários existentes.

## Verificação executada
- instalação limpa com `npm ci --offline --no-audit --no-fund`
- `tsc --noEmit`
- `vite build`
