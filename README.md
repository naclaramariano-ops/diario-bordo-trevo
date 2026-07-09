# Diário de Bordo Trevo — V6.1.2

Correção da V6.1 Envase integrada à V5 Enterprise Foundation.

## O que foi corrigido
- Finalizar passagem salva em **Hoje** e **Histórico**.
- Todos os campos são obrigatórios.
- Validação leva automaticamente ao campo/máquina pendente.
- Mantida a lógica de Envase 1 e Envase 2, PCP, CIP 72h e parada >= 4h.

## Atualização
1. Substitua os arquivos no repositório.
2. Apague `package-lock.json` e `node_modules` se existirem.
3. Commit > Push origin.
4. Aguarde o Cloudflare.

Não precisa rodar SQL novo.
