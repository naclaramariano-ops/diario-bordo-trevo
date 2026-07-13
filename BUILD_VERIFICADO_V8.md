# Build verificado — V8 Enterprise

Validação executada em instalação limpa:

```bash
npm ci --no-audit --no-fund
npm run build
```

Resultado:
- TypeScript: aprovado
- Vite: aprovado
- `dist/`: gerado corretamente

O ZIP não contém `node_modules` nem `dist`.
