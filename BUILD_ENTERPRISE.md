# Diário de Bordo Trevo — V6.7.2 Enterprise Build Stable

## Sistema de build

Este pacote usa **pnpm 9.15.4** com `pnpm-lock.yaml` travado para evitar o erro interno do npm no Cloudflare Pages (`Exit handler never called!`).

## Cloudflare Pages

- Framework preset: React (Vite)
- Build command: `pnpm run build`
- Build output directory: `dist`
- Root directory: vazio

O Cloudflare detecta automaticamente o `pnpm-lock.yaml` e instala as dependências com pnpm.

## Validação executada

- instalação limpa com `pnpm install --frozen-lockfile`
- TypeScript com `tsc --noEmit`
- produção com `vite build`
