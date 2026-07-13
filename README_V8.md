# Diário de Bordo Trevo V8 Enterprise

## Instalação
1. Execute `supabase/V8_ENTERPRISE_SETUP.sql` no SQL Editor.
2. Mantenha no Cloudflare:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Build command: `pnpm run build` ou `npm run build`.
4. Output: `dist`.

## Primeiro acesso após migração
O login existente continua com o mesmo usuário e senha. A V8 gera uma sessão corporativa no primeiro login.
