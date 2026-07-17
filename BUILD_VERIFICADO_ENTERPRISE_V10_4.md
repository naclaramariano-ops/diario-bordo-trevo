# Diário de Bordo Trevo — Enterprise V10.4

Build verificado após ajustes pontuais de interface e compilação operacional.

## Alterações

- Campos de login iniciam vazios e sem exemplos.
- Fluxo “Esqueci minha senha” sem placeholders de exemplo.
- Respostas neutras como “Sem observações.” e “Sem trocas/avisos.” são ignoradas no status, resumo e detalhamento das abas Hoje e Histórico.
- Normalização reforçada para acentos, pontuação, barras, espaços especiais e caracteres invisíveis.
- Nenhuma regra de PCP, CIP, posse da passagem, sincronização, autenticação ou banco foi alterada.

## Validação

- `tsc --noEmit` aprovado.
- `vite build` aprovado.
- Service Worker versionado para forçar atualização do PWA.
