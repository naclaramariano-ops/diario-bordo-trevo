# Enterprise V10.2 — Build verificado

Base: ZIP funcional enviado pelo usuário.

Alteração restrita ao módulo de recuperação de senha:

- request-password-reset integrado ao Apps Script/Gmail;
- confirm-password-reset revisado;
- JWT desativado somente para as duas Edge Functions em `supabase/config.toml`;
- nenhuma regra operacional do aplicativo alterada.

Validação executada:

```text
npm ci --no-audit --no-fund --prefer-offline
npm run build
```

Resultado:

- TypeScript aprovado;
- 1.667 módulos processados;
- Vite compilado;
- pasta `dist` gerada sem erros.
