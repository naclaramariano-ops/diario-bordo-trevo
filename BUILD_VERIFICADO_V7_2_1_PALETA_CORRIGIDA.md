# V7.2.1 — Paleta Navy TrevoFlow corrigida

Correção aplicada diretamente no Design System do aplicativo.

## Motivo
A V7.2 ainda mantinha seletores antigos em verde/teal para componentes como `opSwitch`, `quickArea`, filtros e botões selecionados. A nova camada final cobre esses componentes e aplica o navy de forma visível e consistente.

## Paleta principal
- Navy 950: `#081B2E`
- Navy 900: `#0B2945`
- Navy 800: `#123B66`
- Navy 700: `#1B4F80`
- Steel 50: `#F1F5F8`
- Verde semântico: `#2F735B`
- Mostarda semântica: `#9A6815`
- Vermelho semântico: `#A63F47`

## Validação
- `npm ci --no-audit --no-fund`
- `npm run build`
- TypeScript aprovado
- Vite: 1.659 módulos processados
- `dist` gerado com sucesso

## Cache/PWA
Service Worker atualizado para `dbt-v7-2-1-navy-trevoflow-palette-fix`.
