# V6.7.3 — Runtime Safe

Causa confirmada da tela branca: o cliente Supabase era criado com URL/chave
vazias quando as variáveis do Cloudflare não chegavam ao build. O SDK lançava
uma exceção antes de o React renderizar a tela.

Correções:
- inicialização segura do Supabase;
- interface abre em modo local mesmo sem variáveis;
- aviso claro no login em vez de tela branca;
- Error Boundary para diagnóstico de qualquer falha futura;
- Service Worker com nova versão de cache;
- nenhuma regra funcional da V6.7.2 foi removida.
