# V6.7.7 — Histórico, edição rastreável e identidade visual

## Alterações

- Histórico agora possui somente as visões **Semana** e **Mês**.
- Lançamentos podem ser editados pelo próprio autor; administradores mantêm acesso administrativo geral.
- Usuários sem permissão visualizam os dados em modo somente leitura.
- Toda edição registra **última atualização por** e **data/hora**.
- O formulário +Novo é preenchido com os dados do lançamento selecionado durante a edição.
- Logo oficial aplicado no login, cabeçalho, menu do perfil, tela de erro, PWA e favicon do navegador.
- Cache do Service Worker atualizado para a nova versão.

## Banco de dados

Não exige nova migration. Utiliza os campos de auditoria já existentes em `diarios`.
