# Diário de Bordo Trevo — V6 Enterprise Passagem de Turno

Base: V5 Enterprise Foundation mantida.

Esta entrega adiciona a rotina real de Passagem de Turno, sem remover as abas e funcionalidades já validadas.

## Incluído

- Envase 1 e Envase 2 por máquina.
- Processo por área e tanque.
- PCP conforme / não conforme com campos condicionais.
- Programado, produzido, SKU atual e próximos SKUs.
- CIP com cálculo automático de 48 horas.
- Justificativa obrigatória quando CIP está vencido.
- Pessoas / trocas / avisos.
- Observações gerais do turno.
- Histórico exibindo resumo amigável da passagem V6.

## Supabase

Não precisa rodar SQL novo se a V5 Enterprise Foundation já foi aplicada.

## Atualização

1. Substitua os arquivos no GitHub.
2. Commit.
3. Push origin.
4. Aguarde o Cloudflare Pages publicar.
5. Pressione Ctrl + F5 uma vez no navegador.
