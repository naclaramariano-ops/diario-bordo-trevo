# Diário de Bordo Trevo — Enterprise Sprint 1+2 UI/Admin V3

Base React + Vite + TypeScript para Cloudflare Pages + Supabase + PWA.

## Atualizações desta versão

- Texto da abertura alterado para: **Operação conectada e rastreável.**
- Administração evoluída com opção de **editar usuários**.
- Administração evoluída com opção de **editar setores**.
- Administração evoluída com opção de **editar máquinas**.
- Usuários: editar nome, usuário, setor, cargo, perfil e status.
- Setores: editar nome, tipo/grupo e status.
- Máquinas: editar nome, setor vinculado e status.
- UI/UX ajustada para celular e desktop, com cards administrativos mais claros.

## Publicação

1. Copie todo o conteúdo desta pasta para a raiz do repositório `diario-bordo-trevo`.
2. Faça commit no GitHub Desktop.
3. Clique em **Push origin**.
4. Aguarde o Cloudflare Pages publicar.

## Cloudflare Pages

- Framework: React/Vite ou Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

## Variáveis

Configurar no Cloudflare Pages:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Login inicial

Usuário: `ana.peliteiro`  
Senha: `admin123`
