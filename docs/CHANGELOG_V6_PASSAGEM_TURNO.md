# Diário de Bordo Trevo — V6 Enterprise Passagem de Turno

## O que entrou na V6

Esta versão mantém a fundação validada da V5 Enterprise Foundation e acrescenta a primeira versão real da rotina de passagem de turno.

## Mantido da V5

- Login por usuário, sem domínio de e-mail.
- Perfil administrador e perfil usuário.
- Aba Admin restrita ao perfil administrador.
- Cadastro/edição de usuários, setores, máquinas e turnos.
- PWA offline.
- IndexedDB com migração automática.
- Fila de sincronização.
- Cloudflare Pages + Supabase.
- Menu no logo DB.
- Tema escuro.
- Sincronizar agora.

## Novo na V6

### Envase 1 e Envase 2

- Preenchimento por máquina.
- Máquinas puxadas do cadastro administrativo, com fallback para as máquinas padrão.
- Pergunta: seguiu conforme programação PCP?
- Se SIM:
  - SKU rodando.
  - Programado do SKU.
  - Produzido até o momento.
  - Próximos SKUs.
- Se NÃO:
  - Motivo de não seguir PCP.
  - SKU rodando no momento.
  - O que estava programado.
  - Quanto produziu/tirou.
  - Como ficou a nova sequência.

### CIP

- Campo de último CIP.
- Cálculo automático do próximo CIP em 48 horas.
- Se CIP estiver dentro do prazo, segue normalmente.
- Se CIP estiver vencido, justificativa obrigatória.
- Regra aplicada tanto para Envase quanto Processo.

### Processo

- Processo não foi tratado como máquina de envase.
- Tela separada por áreas:
  - Mistura.
  - Fermentação.
  - Resfriamento.
  - Pulmão / Espera.
  - Transferência para Envase.
- Preenchimento por tanque/linha.
- Produto no tanque.
- Tempo de fermentação quando aplicável.
- Status do tanque.
- Se já foi envasado.
- Quantidade envasada quando aplicável.
- CIP com mesma regra de 48 horas.
- Observação do tanque.

### Pessoas / Trocas / Avisos

- Campo para formalizar trocas, combinados e avisos entre líderes.

### Observações gerais do turno

- Campo final para resumo objetivo do turno.

## Banco de dados

Esta versão usa a tabela `diarios` já existente para registrar a passagem V6 em formato estruturado no campo `resumo`.

Não é necessário rodar nova migration se a V5 Enterprise Foundation já estiver aplicada.

## Publicação

1. Substituir os arquivos no repositório GitHub.
2. Fazer Commit.
3. Fazer Push origin.
4. Aguardar Cloudflare Pages publicar.
5. Abrir o aplicativo e pressionar Ctrl + F5 uma vez.
