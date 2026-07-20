# Diário de Bordo Trevo — Enterprise V11.2 Hardening

## Escopo
- Preserva integralmente o fluxo aprovado da aba +Novo.
- Mantém a validação somente após o primeiro preenchimento real de uma máquina.
- Impede duplicidade por Data + Turno + Envase no banco.
- Adiciona histórico imutável de revisões de passagens.
- Adiciona controle de versão otimista para evitar sobrescrita concorrente.
- Registra conflitos de sincronização offline no aparelho e no Supabase.
- Rascunhos offline passam pela mesma reserva transacional usada online.

## Implantação
Execute uma vez no SQL Editor:

`supabase/MIGRATION_ENTERPRISE_V11_2_HARDENING.sql`

Depois publique normalmente no GitHub/Cloudflare Pages.
