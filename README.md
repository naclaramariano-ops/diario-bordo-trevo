# Diário de Bordo Trevo Enterprise — V5.1 Correção Admin

Correções desta versão:

- Corrige o botão **Salvar alterações** no cadastro/edição de usuários.
- Corrige o cadastro/edição de **turnos**.
- Adiciona mensagens de erro visíveis caso o Supabase bloqueie alguma operação.
- Mantém a área **Admin** somente para perfil `administrador`.

## Atualização necessária

1. Substitua os arquivos no repositório GitHub.
2. Faça **Commit** e **Push origin** pelo GitHub Desktop.
3. No Supabase, rode:

```text
supabase/MIGRATION_V5_1_FIX_ADMIN.sql
```

Depois atualize o app com Ctrl + F5.


## V5.2 Fix SQL
Correção de sintaxe na migration V5.1. Rode `supabase/MIGRATION_V5_2_FIX_SQL.sql` no Supabase.
