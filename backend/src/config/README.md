# APEX AUTOBODY — Backend API

API REST construída com **Fastify + TypeScript + SQLite (sql.js)**.

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Fastify 5 |
| Banco de dados | SQLite via sql.js |
| Linguagem | TypeScript |
| Executor dev | tsx (sem compilação) |

---

## Instalação

```bash
cd backend
npm install
cp .env.example .env
```

## Rodando em desenvolvimento

```bash
npm run dev
```

Servidor sobe em `http://localhost:3333`.

## Populando com dados de exemplo

```bash
npx tsx src/db/seed.ts
```

---

## Endpoints

### Health Check

```
GET /health
```

---

### Ordens de Serviço

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/os` | Lista todas as OSs |
| `GET` | `/api/os?q=<termo>` | Busca por nome, placa ou telefone |
| `GET` | `/api/os/:id` | Retorna uma OS pelo ID |
| `POST` | `/api/os` | Cria nova OS |
| `PATCH` | `/api/os/:id` | Atualiza OS (campos parciais) |
| `DELETE` | `/api/os/:id` | Remove OS |
| `GET` | `/api/os/:id/historico` | Histórico de movimentações |

---

### Dashboard

```
GET /api/dashboard
```

Retorna métricas calculadas no backend:

```json
{
  "os_abertas": 6,
  "os_concluidas_mes": 2,
  "receita_mes": 1170.00,
  "os_prazo_vencido": 1,
  "os_paradas": 2
}
```

---

## Exemplos de requisição

### Criar OS

```bash
curl -X POST http://localhost:3333/api/os \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_nome": "João Silva",
    "cliente_telefone": "31999998888",
    "veiculo_placa": "BRA2E19",
    "veiculo_modelo": "Fiat Uno",
    "veiculo_ano": 2015,
    "descricao_servico": "Funilaria porta traseira esquerda",
    "valor_estimado": 800,
    "prazo_estimado": "2026-05-05"
  }'
```

### Mover OS no Kanban (drag & drop)

```bash
curl -X PATCH http://localhost:3333/api/os/1 \
  -H "Content-Type: application/json" \
  -d '{ "status": "Em Pintura" }'
```

### Buscar por placa

```bash
curl "http://localhost:3333/api/os?q=ABC1D23"
```

---

## Status válidos (Kanban)

```
Orcamento
Aguardando Aprovacao
Em Funilaria
Em Pintura
Acabamento
Pronto para Entrega
Entregue
```

---

## Campos calculados (retornados pela API)

Cada OS retorna campos extras calculados no backend:

| Campo | Tipo | Descrição |
|---|---|---|
| `dias_na_etapa` | number | Dias desde o último `updated_at` |
| `alerta_parada` | boolean | `true` se `dias_na_etapa > 3` |
| `prazo_vencido` | boolean | `true` se `prazo_estimado < hoje` e status ≠ Entregue |

---

## Deploy (Railway / Render)

1. Configure a variável `CORS_ORIGIN` com o domínio do seu frontend
2. O arquivo `apex.db` é criado automaticamente em `/` no container
3. Script de start: `npm start`