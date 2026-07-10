# Cloudflare Pages — configuração obrigatória

Esta versão fixa o Node.js em 20.18.1 para evitar o erro do npm 10.9.2 no Node 22:
`npm error Exit handler never called!`

Configuração do projeto:
- Framework preset: React (Vite)
- Build command: npm run build
- Build output directory: dist
- Root directory: vazio

Antes de novo deploy, no Cloudflare:
1. Settings > Build > Build cache > Clear cache.
2. Settings > Variables and Secrets: crie NODE_VERSION = 20.18.1 (Production e Preview).
3. Dispare um novo commit/push.

Os arquivos `.node-version` e `.nvmrc` já fixam o Node 20.18.1 no repositório.
