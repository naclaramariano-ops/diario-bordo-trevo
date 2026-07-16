# Diário de Bordo Trevo — Enterprise V10.1

## Entrega

Esta versão adiciona:

1. Posse atômica da passagem por `Data + Turno + Área` no Supabase.
2. Atualização automática do bloqueio entre aparelhos/logins.
3. Campo de e-mail no cadastro e edição de usuários.
4. `Esqueci minha senha` no login, com código de 6 dígitos enviado por e-mail.

## Implantação obrigatória no Supabase

### 1. Banco

Execute no SQL Editor:

`supabase/MIGRATION_ENTERPRISE_V10_1_POSSE_EMAIL_RESET.sql`

Depois, cadastre/edite os usuários no Admin e informe um e-mail válido.

### 2. Edge Functions

As funções estão em:

- `supabase/functions/request-password-reset`
- `supabase/functions/confirm-password-reset`

Faça o deploy das duas funções no projeto Supabase.

### 3. Segredos das funções

Configure:

- `RESEND_API_KEY`: chave da conta de envio de e-mail.
- `PASSWORD_RESET_FROM_EMAIL`: remetente autorizado, por exemplo `Diário de Bordo <diario@seudominio.com>`.

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são disponibilizados pelo ambiente das Edge Functions do Supabase.

Sem o provedor de e-mail configurado, o restante do aplicativo funciona normalmente, mas o botão de recuperação informará que o serviço ainda não está configurado.

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: vazio
- Node: `20.18.1`

## Regra de posse

A primeira alteração real em uma máquina tenta reservar a combinação no servidor. Somente um responsável pode manter uma passagem `Em preenchimento` para a mesma `Data + Turno + Área`. Outros usuários veem quem está preenchendo e não conseguem editar a combinação ocupada.
