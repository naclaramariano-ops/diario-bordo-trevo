# Correção do build Cloudflare — V6

## O que foi corrigido

O pacote anterior continha a pasta `node_modules`, que não deve ser enviada ao GitHub/Cloudflare. O Cloudflare deve instalar as dependências sozinho a partir do `package.json`.

## Como aplicar

1. Abra o repositório no Windows Explorer pelo GitHub Desktop.
2. Apague a pasta `node_modules`, se ela existir.
3. Copie os arquivos deste ZIP para a raiz do repositório.
4. Confirme que a raiz contém: `package.json`, `index.html`, `src/`, `public/`, `supabase/`, `docs/`.
5. No GitHub Desktop: Commit > Push origin.
6. Aguarde o Cloudflare publicar.

## Configuração Cloudflare Pages

- Framework preset: Vite / React (Vite)
- Build command: npm run build
- Build output directory: dist
- Root directory: /

## Supabase

Não precisa rodar SQL novo se a V5 Foundation já foi aplicada.
