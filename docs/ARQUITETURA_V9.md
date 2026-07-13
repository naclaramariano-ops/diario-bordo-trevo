# Arquitetura V9

```text
src/
├── core/                         # configuração de ambiente
├── infrastructure/supabase/     # cliente único do Supabase
├── modules/
│   ├── auth/                     # login, sessão e logout
│   └── admin/                    # usuários corporativos
├── services/
│   ├── api.ts                    # setores, máquinas, turnos, diários e sync
│   └── localDb.ts                # cache e fila offline
├── data/                         # SKUs por máquina
├── types/                        # contratos TypeScript
├── utils/                        # segurança e utilitários
├── main.tsx                      # composição visual atual
└── styles.css                    # interface responsiva
```

## Princípios

1. Supabase é a fonte oficial dos cadastros corporativos.
2. Não existe sucesso falso: gravações administrativas só são confirmadas após resposta do servidor.
3. Falha online não vira lista vazia silenciosamente.
4. Cache local é substituído pela fotografia mais recente recebida do Supabase.
5. Offline é permitido para passagem de turno; cadastros mestres exigem internet.
6. Login usa RPC segura quando instalada e possui compatibilidade de implantação inicial.
