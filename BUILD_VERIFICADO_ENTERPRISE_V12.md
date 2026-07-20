# Diário de Bordo Trevo — Enterprise V12

## Escopo

Evolução exclusiva da experiência de sincronização, sem alteração das regras operacionais anteriores.

- Removido o botão permanente “Sincronizar agora” do menu do perfil.
- Criado status inteligente no cabeçalho: Sincronizado, Offline, Sincronizando, pendências ou falha.
- Sincronização automática ao voltar a internet e ao detectar fila pendente.
- Ação manual exibida somente quando houver pendência ou falha.
- Modal informa conexão, quantidade pendente e última sincronização.
- Registros offline continuam armazenados no IndexedDB e visíveis aos demais somente após sincronização com o Supabase.

## Validação

Executado: `npm ci --no-audit --no-fund` e `npm run build`.
