# APEX AUTOBODY — Sistema de Gestão de OS

Projeto full-stack unificado: **frontend APEX completo** conectado ao **backend Projeto.SAAS** (sql.js + Fastify).

## Estrutura

```
apex-final/
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── db/database.ts
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── types/index.ts
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   ├── pages/
    │   ├── hooks/
    │   ├── services/api.ts
    │   ├── store/kanbanStore.ts
    │   └── types/os.ts
    └── vite.config.ts   (proxy /api → localhost:3333)
```

## Como rodar

### Backend
```bash
cd backend && npm install && npm run dev
```

### Frontend
```bash
cd frontend && npm install && npm run dev
```

## Mapeamento de Status

| Frontend      | Backend API            |
|---------------|------------------------|
| orcamento     | Orcamento              |
| aprovacao     | Aguardando Aprovacao   |
| funilaria     | Em Funilaria           |
| pintura       | Em Pintura             |
| acabamento    | Acabamento             |
| pronto        | Pronto para Entrega    |
| entregue      | Entregue               |
