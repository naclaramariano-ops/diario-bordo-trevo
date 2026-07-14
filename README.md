# Diário de Bordo Trevo — V6.7.6 UX Refinement

Evolução direta da base funcional V6.7.4, mantendo Hoje, Novo, Histórico, Admin, PWA, Supabase, IndexedDB e sincronização.

## Melhorias desta versão

- Programado e Produzido formatados automaticamente com ponto de milhar.
- Próximo CIP exibido em dia/mês/ano • horário.
- Correção do bloco de Observações gerais da passagem.
- Data e Turno sem sobreposição no celular.
- Botões e campos mais compactos no mobile.
- Seletor de SKU em tela própria, mantendo pesquisa e avanço automático.
- Estrutura modular preservada.

## Cloudflare Pages

- Build command: `pnpm run build`
- Build output directory: `dist`
- Root directory: vazio

## Build verificado

Executado localmente com TypeScript e Vite 5.4.11.

## V6.8.2 — múltiplas passagens em andamento

- Envase 1 e Envase 2 podem ser preenchidos simultaneamente.
- Datas e turnos diferentes são independentes.
- Um usuário pode manter vários rascunhos.
- Datas passadas são permitidas; datas futuras permanecem bloqueadas.
- O bloqueio ocorre apenas para a mesma combinação Data + Turno + Área.
- Execute `supabase/MIGRATION_V6_8_2_MULTIPLOS_RASCUNHOS.sql` uma vez.
