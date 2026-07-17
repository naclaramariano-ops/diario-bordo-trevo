# Diário de Bordo Trevo — Enterprise V11

Build validado em 17/07/2026.

## Evolução aplicada
- Um único registro oficial por Data + Turno + Envase.
- Novo lançamento não sobrescreve passagem já finalizada.
- Registro existente é apresentado para edição somente ao autor ou administrador.
- Outros usuários mantêm acesso de leitura pelas abas Hoje e Histórico.
- Proteção transacional no Supabase contra gravações simultâneas.
- Conflitos offline são preservados no cache e no registro de conflitos, sem sobrescrever o servidor.

## Implantação obrigatória
Executar no SQL Editor do Supabase:

`supabase/MIGRATION_ENTERPRISE_V11_REGISTRO_UNICO.sql`

## Build
- `npm ci --no-audit --no-fund`
- `npm run build`
- TypeScript aprovado
- 1.667 módulos processados
- `dist` gerado sem erros
