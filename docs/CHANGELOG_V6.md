# V6 — Passagem de Turno integrada à V5 Foundation

Esta versão mantém a estrutura validada da V5 Enterprise Foundation e adiciona a Passagem de Turno como funcionalidade real dentro da aba **Novo**.

## Mantido da V5
- Login por usuário.
- Menu DB.
- Hoje.
- Histórico.
- Admin.
- PWA.
- IndexedDB com versionamento.
- Sincronização resiliente.
- Estrutura modular React/Vite.

## Adicionado na V6
- Envase 1 e Envase 2 por máquinas.
- Processo por áreas: Mistura, Fermentação, Resfriamento, Pulmão/Espera e Transferência para Envase.
- PCP conforme/não conforme com campos condicionais.
- SKU atual, programado, produzido e próximos SKUs.
- Nova sequência quando não segue PCP.
- CIP com cálculo automático do próximo CIP em 48 horas.
- Justificativa obrigatória para CIP vencido.
- Pessoas/trocas/avisos.
- Observações gerais do turno.
- Exibição no Hoje por turno.
- Histórico com busca e filtros por dia/semana/mês.

## Banco
Não exige migration nova. Os dados da V6 são salvos na tabela existente `diarios` como payload estruturado no campo `resumo`.
