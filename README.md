# Diário de Bordo Trevo — V6.1 Envase

Versão incremental integrada à base V5 Enterprise Foundation.

## O que mudou

- V6.1 aplicada somente em Envase 1 e Envase 2.
- Validade de CIP alterada para 72 horas.
- Regra adicional: se a máquina ficar parada por 4 horas ou mais, o sistema exige controle de CIP de renovação.
- Novos motivos PCP: Atraso base, Padronização e Reprocesso.
- Validação melhorada: ao salvar/finalizar com campo faltante, o aplicativo leva o usuário automaticamente para a máquina pendente.
- Lançamentos finalizados aparecem no Hoje por turno e no Histórico.
- Exibição do usuário, data e horário do lançamento.

## Como publicar

1. Substitua os arquivos no repositório GitHub.
2. Não envie `node_modules`.
3. Faça Commit e Push origin.
4. Aguarde o Cloudflare Pages publicar.
5. Atualize o aplicativo com Ctrl + F5 uma vez.

## Supabase

Não é necessário rodar SQL novo se a V5 Enterprise Foundation já foi aplicada.
