# V6.1.3 — Correção Hoje/Histórico + Validação

- Corrige salvamento da passagem para exibir imediatamente nas abas Hoje e Histórico.
- Corrige `setor_id` inválido para evitar falha no Supabase.
- Mescla dados locais pendentes com dados online, garantindo exibição mesmo antes da sincronização completa.
- Melhora validação: ao finalizar, se houver campo pendente em outra máquina, o app troca para a máquina correta e posiciona no campo faltante.
- Build testado localmente com sucesso antes da entrega.

Não exige SQL novo se a V5 Foundation/V5.4 já foi aplicada.
