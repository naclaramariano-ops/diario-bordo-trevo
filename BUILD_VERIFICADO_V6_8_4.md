# V6.8.4 — Correções de rascunho, CIP e responsividade

## Alterações
- A simples abertura da aba Novo não cria mais uma passagem em andamento.
- O rascunho passa a existir apenas após a primeira interação em um campo de máquina.
- Cancelamento remove o rascunho da fonte online, cache local e atualiza a tela Hoje.
- Correção da reversão do último CIP ao alternar respostas Sim/Não.
- Correção de largura dos campos de data/hora de CIP em celulares.
- Ações Anterior / Salvar e próxima deixam de ficar sobrepostas ao conteúdo no mobile.

## Build
Executado com sucesso:

```bash
npm run build
```

Resultado: TypeScript aprovado e bundle Vite gerado em `dist/`.
