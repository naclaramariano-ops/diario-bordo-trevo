# Diário de Bordo Trevo — V6.1.2

Correção incremental da V6.1.

## Corrigido
- Ao finalizar a passagem, o registro é salvo corretamente em `diarios_cache` e no Supabase, aparecendo na aba **Hoje** e **Histórico**.
- A aba **Hoje** atualiza automaticamente após salvar.
- Todos os campos da passagem são obrigatórios.
- Ao tentar salvar/finalizar com campo faltando, o app direciona automaticamente para a máquina e o campo exato pendente.
- Campos pendentes recebem destaque visual.

## Supabase
Não precisa rodar SQL novo se a V5 Foundation/V5.4 já foi aplicada.
