# Diário de Bordo Trevo — Enterprise Sprint 1 + Sprint 2

Base nova, modular e profissional para Cloudflare Pages + Supabase + PWA offline.

## Incluído nesta entrega

### Sprint 1 — Fundação
- React + Vite + TypeScript
- Estrutura modular: components, pages, services, hooks, store, utils, types
- PWA instalável
- Service Worker
- Manifest
- IndexedDB local
- Supabase preparado
- Login por usuário, sem e-mail: `ana.peliteiro`

### Sprint 2 — Administração
- Perfis: `administrador` e `usuario`
- Cadastro de usuários com nome, usuário, setor, cargo, perfil e status
- Cadastro de setores
- Cadastro de máquinas por setor
- Usuário comum não vê a área administrativa
- Base para auditoria e rastreabilidade

## Login inicial

Usuário: `ana.peliteiro`
Senha: `admin123`

## Como publicar no Cloudflare Pages

1. Rode o SQL em `supabase/schema.sql` no Supabase.
2. Copie `.env.example` para `.env`.
3. Preencha:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Envie para GitHub.
5. No Cloudflare Pages:
   - Framework: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Configure as variáveis de ambiente também no Cloudflare Pages.

## Observação de segurança

Esta entrega já separa perfis, RLS, estrutura modular e banco online. Para endurecimento enterprise máximo, a próxima sprint deve migrar criação/alteração de senha para Supabase Edge Functions com service role protegida, evitando qualquer operação sensível diretamente pelo cliente.


