# Build verificado — V6.8.2

Base: V6.7.10.1 funcional + gestão de múltiplos rascunhos.

Validação executada em ambiente limpo:

```bash
npm ci --no-audit --no-fund
npm run build
```

Resultado esperado/validado:
- TypeScript sem erros;
- Vite compilado;
- pasta `dist` gerada;
- 1.657 módulos processados.

## Regra de posse
A combinação única da passagem é:

`Data + Turno + Área`

Somente essa combinação é bloqueada quando já está em preenchimento por outro usuário.
