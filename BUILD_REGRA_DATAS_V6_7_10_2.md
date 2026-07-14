# V6.7.10.2 — Bloqueio de datas futuras

Regras adicionadas:

- A data da passagem de turno aceita somente hoje ou datas passadas.
- Datas futuras ficam indisponíveis no calendário pelo atributo `max`.
- O Último CIP aceita somente data/hora atual ou passada.
- Data/hora futura de CIP é bloqueada também por validação de código.
- O salvamento possui validação redundante para impedir manipulação manual do HTML.
- Rascunhos antigos com data futura são ajustados para a data atual ao serem recuperados.
- CIPs futuros eventualmente existentes em registros antigos não são usados como último CIP automático.

Build validado com `npm ci` e `npm run build`.
