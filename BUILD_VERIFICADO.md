# Build verificado

Versão: 6.5.1

Validações executadas antes da entrega:

- instalação limpa de dependências sem package-lock.json;
- verificação TypeScript com `tsc --noEmit`;
- build de produção com `vite build`;
- geração da pasta `dist` concluída com sucesso.

Configuração do Cloudflare Pages:

- Framework preset: React (Vite) ou Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: deixe vazio

O ZIP não contém `node_modules`, `dist` ou `package-lock.json`.
