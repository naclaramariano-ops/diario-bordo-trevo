# Diário de Bordo Trevo — Enterprise V10.2

Atualização cirúrgica do módulo de recuperação de senha.

## Arquivos atualizados

- `supabase/functions/request-password-reset/index.ts`
- `supabase/functions/confirm-password-reset/index.ts`
- `supabase/config.toml`

## Implantação no Supabase

1. Abra `Edge Functions > request-password-reset > Code`.
2. Substitua todo o conteúdo pelo arquivo correspondente deste pacote.
3. Clique em **Deploy function** e mantenha **Verify JWT desligado**.
4. Repita em `confirm-password-reset`.
5. Confirme os secrets `GMAIL_RELAY_URL` e `GMAIL_RELAY_SECRET`.

Não é necessário rodar novamente a migration SQL. Nenhuma regra operacional do aplicativo foi alterada.
