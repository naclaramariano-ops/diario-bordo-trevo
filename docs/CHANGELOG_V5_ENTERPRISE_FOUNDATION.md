# V5 Enterprise Foundation

Esta versão mantém a interface e as funcionalidades da V5.5, mas fortalece a fundação offline/sincronização.

## Incluído

- Migração automática do IndexedDB, sem limpar cache manualmente.
- Versionamento do banco offline.
- Criação automática das object stores faltantes.
- Store `meta` para controlar versão local.
- Store `conflicts_cache` para registrar conflitos entre offline e servidor.
- Fila `sync_queue` para operações offline de usuários, setores, máquinas, turnos, diários e logs.
- Sincronização resiliente: itens com erro continuam na fila com contador de tentativas e último erro.
- Remoção de itens da fila após sincronização bem-sucedida.
- Service Worker com cache versionado e atualização silenciosa.

## Não muda

- Login atual.
- Perfil administrador/usuário.
- Aba Admin.
- Cadastro/edição de usuários, setores, máquinas e turnos.
- Interface V5 atual.
- Estrutura do Supabase já aplicada na V5.4/V5.5.

## Supabase

Não é necessário rodar SQL novo se a V5.4 já foi aplicada.
