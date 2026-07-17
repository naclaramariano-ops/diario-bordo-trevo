# Diário de Bordo Trevo — Enterprise V11.1

Base preservada: Enterprise V10.5.

Correção única:
- abrir a aba +Novo não gera bloqueio por passagem já finalizada;
- datas retroativas continuam disponíveis;
- a verificação ocorre somente quando o usuário tenta preencher o primeiro campo de uma máquina;
- se Data + Turno + Envase já estiver finalizado, o novo lançamento é bloqueado sem sobrescrever o anterior;
- a proteção também existe no Supabase e na sincronização offline.

Nenhuma outra regra operacional foi alterada.
