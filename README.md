# Diário de Bordo Trevo — V5.4 Fix Admin Save

Correções desta versão:

- Corrigido erro ao editar usuário sem alterar senha (`senha_hash` nulo).
- Novos usuários recebem senha provisória padrão `123456` e ficam com `trocar_senha = true`.
- Corrigido cadastro de turnos quando o nome já existe: o app passa a atualizar o turno existente ao invés de quebrar por chave duplicada.
- Incluída migration V5.4 para ajustar defaults, RLS e duplicidade de turnos.

## Atualização

1. Rode no Supabase:

`supabase/MIGRATION_V5_4_FIX_ADMIN_SAVE.sql`

2. Substitua os arquivos no GitHub.
3. Faça commit e push.
4. Aguarde o Cloudflare publicar.
5. Atualize o navegador com Ctrl+F5.

Login admin:

- Usuário: `ana.peliteiro`
- Senha: `admin123`

Senha provisória para novos usuários:

- `123456`
