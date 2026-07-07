# Diário de Bordo Trevo — V6.1 Envase

Atualização incremental sobre a V5 Enterprise Foundation/V6 Envase, sem alterar a estrutura já validada.

## Incluído

- CIP com validade operacional de 72 horas.
- Regra de parada contínua de 4 horas ou mais:
  - solicita horário de parada;
  - solicita retorno/previsão;
  - solicita motivo;
  - exige informar se houve CIP de renovação;
  - se não houve CIP de renovação, exige justificativa.
- Novos motivos de não conformidade PCP:
  - Atraso base;
  - Padronização;
  - Reprocesso.
- Ao tentar salvar/finalizar com pendência, o sistema direciona automaticamente para a máquina/linha pendente.
- Registros finalizados aparecem na aba Hoje por turno e também no Histórico.
- Exibição de quem lançou a passagem, data e horário.

## Supabase

Não há migration obrigatória nesta versão se a V5 Foundation já está aplicada.

## Publicação

Atualizar GitHub e aguardar o Cloudflare Pages publicar automaticamente.
