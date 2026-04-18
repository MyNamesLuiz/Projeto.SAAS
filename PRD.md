# PRD — Orquestrador de Fluxo: APEX AUTOBODY

> **Squad:** SQUAD 6

> **Negócio escolhido:** APEX AUTOBODY — Funilaria e Pintura

---

## 1. Quem é o Usuário?

### O Negócio

A referência concreta deste produto é a **APEX AUTOBODY** — uma funilaria e pintura de médio porte, com operação local consolidada e estrutura de equipe já estabelecida.

**O time** conta com 8 a 15 pessoas: múltiplos funileiros, pintores e preparadores organizados por especialidade, um supervisor de pátio, uma recepcionista fixa e um gerente operacional — que responde ao dono e centraliza as decisões do dia a dia. No dia a dia, o sistema será operado por **5 a 8 pessoas** com perfis e níveis de acesso distintos.

**O volume:** entre **40 e 60 carros por mês**, com serviços que vão desde reparos estéticos rápidos (martelinho de ouro, polimento) até serviços estruturais complexos com substituição de peças e repintura total.

---

### Como é a operação no dia a dia?

O fluxo de uma Ordem de Serviço (OS) na APEX é longo, não linear e altamente dependente de comunicação informal — o que gera quebras sistemáticas no processo:

- **Entrada e orçamento:** O cliente traz o carro; a recepcionista registra a entrada e o gerente ou supervisor faz a vistoria com o funileiro responsável. A precificação ainda depende muito da experiência individual de quem avalia — e é comunicada de forma informal, frequentemente pelo WhatsApp.
- **Aprovação:** O "de acordo" do cliente chega por mensagem e se perde no histórico — misturado entre conversas da recepcionista, do gerente e do próprio dono, sem centralização.
- **Execução sem rastreabilidade:** Com mais pessoas e mais carros simultâneos, as transições entre etapas (funilaria → preparação → cabine de pintura → polimento) dependem de comunicação verbal entre o supervisor e os técnicos. Sem registro formal, é impossível saber quem tocou em qual carro e quando.
- **Entrega e pós-venda:** A comunicação com o cliente ainda é feita por telefone ou WhatsApp individual. Não há histórico centralizado: quando um cliente retorna com reclamação, a oficina precisa juntar informações de diferentes pessoas para reconstruir o que foi feito.

---

### Por que o sistema é necessário?

O gargalo da APEX não é mais o dono fazendo tudo sozinho — a equipe cresceu. O problema agora é a **ausência de um sistema que conecte as partes**. Com mais pessoas, mais carros e mais etapas acontecendo em paralelo, a informação se fragmenta entre turnos, funções e aplicativos de mensagem. O gerente não enxerga o pátio completo. O supervisor não sabe o status real de cada carro sem ir pessoalmente checar. A recepcionista responde ao cliente com base no que alguém disse, não no que o sistema registra.

Com 40 a 60 carros por mês, qualquer falha de comunicação tem impacto financeiro direto e imediato.

Perguntas que o gerente não consegue responder hoje, de bate-pronto:

- Quantos carros estão na oficina agora?
- Qual carro está aguardando aprovação do cliente — e há quanto tempo?
- Qual a receita total dos últimos 30 dias?
- Quais OSs passaram de 3 dias sem nenhuma movimentação?
- O que foi feito, exatamente, no carro daquele cliente que voltou reclamando?

---

## 2. Qual é o Problema Central?

### Onde a informação se perde

| Situação | O que acontece hoje | Consequência |
|---|---|---|
| Vários carros em andamento | Anotação em papel/caderno | Funcionário não sabe o que priorizar |
| Cliente aprova orçamento pelo WhatsApp | Mensagem some no histórico | OS não avança, ninguém percebe |
| Carro pronto para pintura | Dono precisa avisar verbalmente | Retrabalho e tempo perdido |
| Cliente liga perguntando status | Dono vai fisicamente ver ou liga pro funcionário | Interrupção constante |
| Fechamento do mês | Conta no caderno, às vezes errada | Dono não sabe a receita real |

### O problema em uma frase

> **A APEX AUTOBODY cresceu operacionalmente, mas não cresceu em visibilidade — a equipe trabalha em paralelo sem um sistema que conecte as etapas, o que gera atrasos, retrabalho e perda de receita distribuída por toda a operação.**

---

## 3. O que o Sistema Faz — e o que Ele Não Faz

O sistema permite que o dono e os funcionários da APEX criem ordens de serviço, acompanhem cada carro por um Kanban visual com as etapas reais da operação, movam cards entre colunas via drag & drop, e visualizem métricas operacionais em tempo real.

### O que está fora do escopo — e por quê

| Fora do escopo | Motivo |
|---|---|
| Envio automático de mensagens (WhatsApp, SMS) | Requer integração com API paga (Twilio, Z-API). Complexidade desproporcional ao MVP. |
| Gestão de estoque de peças | Sistema paralelo com modelo de dados próprio. Candidato a versão futura. |
| Emissão de nota fiscal | Requer certificado digital e integração com SEFAZ. Fora do escopo técnico. |
| Controle de caixa e contas a pagar | Domínio contábil separado. O sistema registra receita por OS, não substitui ERP. |
| Múltiplas filiais | O MVP cobre o estabelecimento principal. Suporte a filiais é candidato natural à V2, dado o porte do negócio. |
| App mobile nativo | A interface é responsiva. Não há app para instalar. |
| Portal do cliente | O sistema é de uso interno da equipe. |

---

## 4. Funcionalidades Essenciais

> Para cada funcionalidade, a pergunta de corte foi: *"Se tirarmos isso, o sistema ainda resolve o problema principal?"*

### 4.1 Criação e gestão de Ordens de Serviço (OS)

**Campos obrigatórios:**
- Nome do cliente
- Telefone
- Placa do veículo
- Modelo e ano
- Descrição do serviço (texto livre)
- Valor estimado / Valor final
- Status atual (coluna do Kanban)
- Data de entrada
- Prazo estimado de entrega

**CRUD completo:** criar, visualizar, editar e deletar.

*Sem isso → o sistema não existe. É o core.*

---

### 4.2 Kanban Visual com as etapas reais da APEX AUTOBODY

```
Orçamento → Aguardando Aprovação → Em Funilaria → Em Pintura → Acabamento → Pronto p/ Entrega → Entregue
```

- Drag & drop entre colunas via **dnd-kit**
- Mudança de status persistida via `PATCH` na API
- Cards exibem: placa, nome do cliente, modelo e dias na etapa atual
- Indicador visual em cards parados há mais de **3 dias** na mesma etapa

*Sem isso → o problema de visibilidade não é resolvido. Eliminatório.*

---

### 4.3 Dashboard Operacional

Métricas calculadas no **backend** e consumidas via API:

- Total de OSs abertas
- Total de OSs concluídas no mês
- Receita total do mês (soma dos valores finais das OSs entregues)
- OSs com prazo vencido (data estimada < hoje e status ≠ Entregue)

*Sem isso → o dono não consegue responder "como está a operação". Eliminatório.*

---

### 4.4 Busca de OS

- Busca por: **nome do cliente**, **placa** ou **telefone**
- Executada via query params na API (`GET /os?q=ABC1234`)
- Resultado em tempo real (debounce no frontend)

*Sem isso → quando o cliente liga, o atendente não encontra o carro. Eliminatório de usabilidade.*

---

## 5. O Diferencial da Squad

### Alerta de OSs Paradas + Histórico de Movimentações

O maior problema oculto da APEX é o carro que entra na fila e fica parado sem que ninguém perceba. O cliente não reclamou ainda, o dono não olhou ainda — e quando olha, já se foram 4 dias.

---

#### 5.1 Indicador visual de OS parada

Qualquer OS sem mudança de status por **mais de 3 dias** recebe um badge de alerta (🔴 ou ícone de relógio) no card do Kanban. O backend calcula isso com base no campo `updatedAt` da OS e retorna o dado via API — o frontend não faz esse cálculo.

---

#### 5.2 Histórico de movimentações da OS

Cada mudança de status gera um registro na tabela `os_historico`. Na tela de detalhe, o usuário vê uma linha do tempo:

```
14/04 09:12 → Status alterado para "Em Funilaria"
16/04 14:30 → Status alterado para "Em Pintura"
```

Isso resolve a pergunta real que surge quando um cliente reclama de atraso: *"quando foi que esse carro mudou de etapa?"*

**Integração técnica:**
- `GET /os/:id/historico` retorna o histórico da OS
- O registro é criado automaticamente no backend sempre que `PATCH /os/:id` altera o campo `status`
- Exibido no drawer/modal de detalhe da OS

---

## 6. Divisão da Squad


---

## 7. Arquitetura e Stack

### Estrutura de pastas

```
frontend/
  src/
    components/   
    pages/        
    services/     
    types/        
    hooks/        
    store/        

backend/
  src/
    routes/       
    controllers/  
    models/       
    types/        
```

### Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React + TypeScript + Vite |
| Estado de servidor | TanStack Query |
| Estado global de UI | Zustand |
| Drag & Drop | dnd-kit |
| Estilo | TailwindCSS + clsx |
| Backend | Node.js + Fastify |
| Banco de dados | SQLite (dev) / PostgreSQL (produção) |
| Deploy frontend | Vercel |
| Deploy backend | Railway ou Render |

---

## 8. Fluxo Principal 

```
1. Gerente abre o sistema de manhã
2. Vê o Kanban com todos os carros organizados por etapa — 30 OSs ativas em andamento
3. Cinco cards estão com alerta 🔴 — OSs paradas há mais de 3 dias
4. Clica em uma OS → lê o histórico de movimentações para entender onde travou
5. Arrasta o card de "Em Funilaria" para "Em Pintura" → status salvo na API
6. Cliente liga perguntando do carro → recepcionista busca pela placa em segundos
7. Gerente abre o Dashboard → 35 OSs abertas, 22 entregues no mês, R$ 38.000 de receita
8. Recepcionista cria nova OS para o carro que acabou de entrar na recepção
```

---

## 9. Próximos Passos 

- Integração com WhatsApp Business API para notificar o cliente quando a OS mudar para "Pronto para Entrega"
- Upload de fotos do veículo vinculadas a OS
- Relatório PDF exportável com todas as OSs do mês
- Controle básico de peças (vinculação de peça à OS com custo)
- Autenticação com distinção entre perfil de dono e funcionário

---

## 10. Critérios de "Aceite"

Uma OS está pronta quando:

- [ ] Pode ser criada via formulário com todos os campos obrigatórios
- [ ] Aparece no Kanban na coluna correta
- [ ] Pode ser movida via drag & drop e o novo status persiste após reload
- [ ] Aparece nos números do dashboard
- [ ] Pode ser encontrada pela busca por placa, nome ou telefone
- [ ] Se parada há mais de 3 dias, exibe o indicador de alerta
- [ ] Cada mudança de status gera um registro no histórico acessível na tela de detalhe

---
