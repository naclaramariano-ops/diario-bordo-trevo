# V6.7.3 — Correção definitiva da tela branca

## Causa confirmada
O SDK do Supabase interrompia a inicialização do React quando as variáveis
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` não chegavam ao build.
O erro acontecia antes da primeira tela ser renderizada.

## Correções
- inicialização segura do Supabase;
- aplicativo abre mesmo sem variáveis, em modo local/offline;
- aviso claro no login quando o build não recebeu a configuração;
- Error Boundary para nunca mais exibir tela branca sem diagnóstico;
- cache do Service Worker versionado para a nova publicação;
- nenhuma alteração nas regras funcionais da V6.7.2.

## Cloudflare
- Build command: `pnpm run build`
- Build output: `dist`
- Root directory: vazio

As variáveis do Supabase continuam necessárias para sincronização online, mas a
falta delas não derruba mais a interface.
