# Diário de Bordo Trevo Enterprise — V5.3 Correção Login/Admin

## O que corrige
- Login `ana.peliteiro` + `admin123` corrigido.
- Login não depende mais da RPC `login_usuario` para funcionar.
- Perfil aceito: `administrador` e `usuario`.
- Mantém a V5 Admin com usuários, setores, máquinas, turnos, logs e configurações.

## Atualização obrigatória
1. Rode no Supabase: `supabase/MIGRATION_V5_3_FIX_LOGIN.sql`
2. Substitua os arquivos do repositório por esta versão.
3. GitHub Desktop: Commit > Push origin.
4. Aguarde Cloudflare publicar.
5. No navegador: Ctrl + F5.

## Login
Usuário: ana.peliteiro
Senha: admin123
