// ─── Tipos: Ordens de Serviço ─────────────────────────────────────────────────
// Espelha os tipos do backend (backend/src/@types/os.types.ts).
// Importe daqui em todos os arquivos do frontend.

export type OSStatus =
  | 'orcamento'
  | 'aprovacao'
  | 'funilaria'
  | 'pintura'
  | 'acabamento'
  | 'pronto'
  | 'entregue'

// Mapeamento dos status do novo backend (Projeto.SAAS) para os IDs do Kanban
// Backend usa: 'Orcamento' | 'Aguardando Aprovacao' | 'Em Funilaria' |
//              'Em Pintura' | 'Acabamento' | 'Pronto para Entrega' | 'Entregue'
export const STATUS_MAP: Record<string, OSStatus> = {
  'Orcamento':            'orcamento',
  'Aguardando Aprovacao': 'aprovacao',
  'Em Funilaria':         'funilaria',
  'Em Pintura':           'pintura',
  'Acabamento':           'acabamento',
  'Pronto para Entrega':  'pronto',
  'Entregue':             'entregue',
}

export const STATUS_MAP_REVERSE: Record<OSStatus, string> = {
  orcamento:  'Orcamento',
  aprovacao:  'Aguardando Aprovacao',
  funilaria:  'Em Funilaria',
  pintura:    'Em Pintura',
  acabamento: 'Acabamento',
  pronto:     'Pronto para Entrega',
  entregue:   'Entregue',
}

// ─── Coluna do Kanban ─────────────────────────────────────────────────────────

export interface KanbanColumn {
  id: OSStatus
  label: string
  color: string
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'orcamento',  label: 'Orçamento',        color: 'rgba(82,88,117,0.6)'   },
  { id: 'aprovacao',  label: 'Ag. Aprovação',     color: 'rgba(255,61,90,0.45)' },
  { id: 'funilaria',  label: 'Em Funilaria',      color: 'rgba(77,159,255,0.45)' },
  { id: 'pintura',    label: 'Em Pintura',        color: 'rgba(0,229,212,0.45)'  },
  { id: 'acabamento', label: 'Acabamento',        color: 'rgba(191,128,255,0.45)'},
  { id: 'pronto',     label: 'Pronto p/ Entrega', color: 'rgba(0,229,160,0.45)'  },
  { id: 'entregue',   label: 'Entregue',          color: 'rgba(42,47,66,0.8)'    },
]

// ─── Interfaces de Domínio ────────────────────────────────────────────────────

export interface OS {
  id: number
  cliente_nome: string
  cliente_telefone: string
  veiculo_placa: string
  veiculo_modelo: string
  veiculo_ano: number
  descricao_servico: string
  valor_estimado: number | null
  valor_final: number | null
  status: string         // Status no formato do backend (ex: 'Orcamento', 'Em Funilaria')
  data_entrada: string
  prazo_estimado: string | null
  updated_at: string
  dias_na_etapa: number
  alerta_parada: boolean
  prazo_vencido: boolean
}

export interface HistoricoOS {
  id: number
  os_id: number
  status_anterior: string | null
  status_novo: string
  criado_em: string
}

export interface DashboardMetrics {
  os_abertas: number
  os_concluidas_mes: number
  receita_mes: number
  os_prazo_vencido: number
  os_paradas: number
}

// ─── Request Bodies ───────────────────────────────────────────────────────────

export interface CreateOSBody {
  cliente_nome: string
  cliente_telefone: string
  veiculo_placa: string
  veiculo_modelo: string
  veiculo_ano: number
  descricao_servico: string
  valor_estimado?: number
  prazo_estimado?: string
}

export interface UpdateOSBody {
  cliente_nome?: string
  cliente_telefone?: string
  veiculo_placa?: string
  veiculo_modelo?: string
  veiculo_ano?: number
  descricao_servico?: string
  valor_estimado?: number
  valor_final?: number
  status?: string
  prazo_estimado?: string
}
