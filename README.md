# APEX AUTOBODY — Sistema de Gestão de Ordens de Serviço

> Plataforma SaaS para gestão operacional de funilarias e oficinas de pintura automotiva.

---

## Sobre o Projeto

O **APEX AUTOBODY** é um sistema interno desenvolvido para resolver o problema central de visibilidade operacional em oficinas de médio porte: **a informação fragmentada entre pessoas, turnos e aplicativos de mensagem**.

Com 40 a 60 carros por mês transitando por múltiplas etapas — funilaria, pintura, acabamento, entrega — qualquer falha de comunicação gera atrasos, retrabalho e perda de receita. O sistema centraliza o controle de Ordens de Serviço (OS), oferece um Kanban visual com as etapas reais da operação e disponibiliza métricas em tempo real para o gerente.

---

## Funcionalidades

- ** Gestão de Ordens de Serviço (CRUD completo)**  
  Criação, visualização, edição e exclusão de OSs com todos os campos relevantes: cliente, veículo, serviço, valor e prazo.

- **Kanban Visual com Drag & Drop**  
  Cards movíveis entre as etapas reais da operação via **dnd-kit**. Cada mudança de coluna persiste automaticamente na API.
  ```
  Orçamento → Aguardando Aprovação → Em Funilaria → Em Pintura → Acabamento → Pronto p/ Entrega → Entregue
  ```

- **Dashboard Operacional**  
  Métricas calculadas no backend em tempo real: OSs abertas, OSs concluídas no mês, receita total e OSs com prazo vencido.

- **Busca em Tempo Real**  
  Busca por nome do cliente, placa ou telefone com debounce no frontend.

- **Alerta de OSs Paradas**  
  Cards sem movimentação há mais de **3 dias** recebem um indicador visual de alerta — calculado pelo backend com base no campo `updatedAt`.

- ** Histórico de Movimentações**  
  Cada mudança de status gera um registro automático com data e hora, acessível na tela de detalhe da OS.

- **Autenticação**  
  Sistema de login com controle de rotas privadas.

---

##  Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Estado de servidor | TanStack Query |
| Estado global de UI | Zustand |
| Drag & Drop | dnd-kit |
| Estilo | TailwindCSS + clsx |
| Backend | Node.js + Fastify |
| Banco de dados | SQLite (desenvolvimento) / PostgreSQL (produção) |
| Deploy frontend | Vercel |
| Deploy backend | Railway ou Render |

---

## Estrutura do Projeto

```
Projeto.SAAS/
├── frontend/
│   └── src/
│       ├── components/       # Componentes reutilizáveis (Layout, Badge, Button…)
│       │   └── ui/
│       ├── pages/            # KanbanPage, DashboardPage, OSListPage, LoginPage
│       ├── services/         # api.ts — configuração e chamadas HTTP
│       ├── types/            # Tipagens TypeScript (OS, Dashboard…)
│       ├── hooks/            # useOS, useDashboard, useSearchOS, useDebounce
│       └── store/            # kanbanStore.ts (Zustand)
│
└── backend/
    └── src/
        ├── controllers/      # os.controller.ts, auth.controller.ts, dashboard.controller.ts
        ├── models/           # os.model.ts, dashboard.model.ts
        ├── routes/           # os.routes.ts, auth.routes.ts, dashboard.routes.ts
        ├── schemas/          # Validação com Zod
        ├── services/         # Regras de negócio
        ├── types/            # Tipos compartilhados
        ├── utils/            # db.ts, zodSchemas.ts
        ├── database/         # Configuração do banco
        └── server.ts         # Entrada da aplicação
```

---

## Como Rodar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- npm ou yarn

---

### Backend

```bash
# Entre na pasta do backend
cd backend

# Instale as dependências
npm install

# Inicie o servidor em modo de desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:3000` (ou a porta configurada).

---

### Frontend

```bash
# Entre na pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

---

##Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/login` | Autenticação do usuário |
| `GET` | `/os` | Lista todas as OSs (suporta `?q=` para busca) |
| `POST` | `/os` | Cria uma nova OS |
| `GET` | `/os/:id` | Detalhe de uma OS |
| `PATCH` | `/os/:id` | Atualiza dados ou status de uma OS |
| `DELETE` | `/os/:id` | Remove uma OS |
| `GET` | `/os/:id/historico` | Histórico de movimentações da OS |
| `GET` | `/dashboard` | Retorna as métricas operacionais |

---

## Fluxo Principal

```
1. Gerente abre o sistema → visualiza o Kanban com todos os carros por etapa
2. Cards com alerta 🔴 indicam OSs paradas há mais de 3 dias
3. Clica em uma OS → lê o histórico de movimentações
4. Arrasta o card para a próxima etapa → status salvo automaticamente
5. Recepcionista busca uma OS pela placa enquanto o cliente liga
6. Dashboard mostra receita do mês, OSs abertas e prazos vencidos
7. Nova OS é criada para o carro que acabou de entrar na recepção
```

---

## 🔭 Próximos Passos (Roadmap)

- [ ] Integração com WhatsApp Business API para notificar cliente na entrega
- [ ] Upload de fotos do veículo vinculadas à OS
- [ ] Relatório PDF exportável das OSs do mês
- [ ] Controle básico de peças com custo vinculado à OS
- [ ] Perfis de acesso distintos (dono vs. funcionário)
- [ ] Suporte a múltiplas filiais

---

## 📦 Scripts Disponíveis

### Backend

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia com hot-reload via tsx |
| `npm run start` | Inicia o servidor em produção |

### Frontend

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run preview` | Pré-visualiza o build localmente |
| `npm run lint` | Executa o ESLint |

---

## 👥 Squad 6

| Nome | Função |
|---|---|
| **André Luiz** | UI/UX — Líder do Projeto |
| **Rhuan Pablo** | Apoio Criativo — Coolíder |
| **Letticia Sabino** | Backend / Login Dev |
| **Thayane Gomes** | UI/UX — Dashboard |
| **Samuel Sales** | Backend — Server e API |

---

## Licença

Este projeto foi desenvolvido para fins acadêmicos e de aprendizado.
