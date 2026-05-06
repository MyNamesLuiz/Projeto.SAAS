# Plano de Reorganização de Pastas e Arquivos

## Análise da Estrutura Atual

### Problemas Identificados:
1. **Pastas duplicadas**: `backend/src` e `backend/API` contêm funcionalidades similares
2. **Pastas vazias**: `backend/src/services/` está vazia
3. **Estrutura inconsistente**: Padrões mistos entre as duas pastas

### Estrutura Atual:
```
backend/
├── API/                    (alternativo, pode ser removido)
│   ├── database.ts
│   ├── index.ts
│   ├── os.model.ts
│   ├── package.json
│   ├── README.md
│   ├── seed.ts
│   └── server.ts
├── src/
│   ├── controllers/        ✓ (usado)
│   ├── database.ts         ✓ (usado)
│   ├── models/           ✓ (usado)
│   ├── routes/           ✓ (usado)
│   ├── schemas/          ✓ (usado)
│   ├── services/        ✗ (vazio)
│   ├── server.ts        ✓ (usado)
│   ├── types/           ✓ (usado)
│   └── utils/            ✓ (usado)
├── database.db
├── package.json
└── tsconfig.json
```

## Plano de Reorganização

### Ações a executar:
1. ✅ Remover a pasta `backend/API/` (redundante)
2. ✅ Consolidar arquivos para `backend/src/`
3. ✅ Remover/pasta vazia `backend/src/services/`
4. ✅ Manter estrutura coerente em `backend/src/`

### Estrutura Proposta:
```
backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── os.controller.ts
│   │   └── dashboard.controller.ts
│   ├── models/
│   │   ├── os.model.ts
│   │   └── dashboard.model.ts
│   ├── routes/
│   │   ├── os.routes.ts
│   │   └── dashboard.routes.ts
│   ├── schemas/
│   │   └── os.schema.ts
│   ├── types/
│   │   └── os.types.ts
│   ├── utils/
│   │   └── db.ts
│   └── server.ts
├── database.db
├── package.json
└── tsconfig.json
```

## Status: Pendente de Aprovação
