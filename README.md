# Diário de Bordo Trevo — V9 Enterprise Foundation

Base React + Vite + TypeScript com Supabase como fonte oficial dos cadastros corporativos.

## Publicação no Cloudflare Pages

- Framework preset: Nenhum
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: vazio
- Production branch: `main`

Variáveis obrigatórias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `NODE_VERSION=22.16.0`

## Supabase

Execute uma vez:

`supabase/V9_ENTERPRISE_FOUNDATION_SETUP.sql`

O script não apaga os usuários nem os registros existentes.

## Regra de dados

- Usuários, setores, máquinas e turnos: Supabase é a fonte oficial.
- Cadastro administrativo exige internet e confirmação do servidor.
- IndexedDB: cache de leitura offline e fila das passagens de turno.
- Passagens podem ser registradas offline e sincronizadas quando a conexão voltar.

## Verificação executada

```bash
npm ci --no-audit --no-fund
npm run build
```

Build concluído com TypeScript e Vite sem erros.
