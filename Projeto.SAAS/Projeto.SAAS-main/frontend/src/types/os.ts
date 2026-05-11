export type OSStatus =
  | 'orcamento'
  | 'aprovacao'
  | 'funilaria'
  | 'pintura'
  | 'acabamento'
  | 'pronto'
  | 'entregue'
 
export const STATUS_MAP: Record<string, OSStatus> = {
  // Valores simples em minúsculo — formato ideal (backend salva assim)
  'orcamento':             'orcamento',
  'aprovacao':             'aprovacao',
  'funilaria':             'funilaria',
  'pintura':               'pintura',
  'acabamento':            'acabamento',
  'pronto':                'pronto',
  'entregue':              'entregue',
  // Aliases com capitalização original (dados legados)
  'Orcamento':             'orcamento',
  'Aguardando Aprovacao':  'aprovacao',
  'Em Funilaria':          'funilaria',
  'Em Pintura':            'pintura',
  'Acabamento':            'acabamento',
  'Pronto para Entrega':   'pronto',
  'Entregue':              'entregue',
  // Aliases lowercase com espaços — gerados pelo backend ao fazer .toLowerCase()
  // nos aliases antigos acima (ex: 'Aguardando Aprovacao' → 'aguardando aprovacao')
  'aguardando aprovacao':  'aprovacao',
  'em funilaria':          'funilaria',
  'em pintura':            'pintura',
  'pronto para entrega':   'pronto',
}
 
export const STATUS_MAP_REVERSE: Record<OSStatus, string> = {
  orcamento:  'orcamento',
  aprovacao:  'aprovacao',
  funilaria:  'funilaria',
  pintura:    'pintura',
  acabamento: 'acabamento',
  pronto:     'pronto',
  entregue:   'entregue',
}
 
export interface KanbanColumn {
  id:        OSStatus
  label:     string
  color:     string
  headerBg:  string
  accent:    string
  borderTop: string
}
 
export const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'orcamento',  label: 'Orçamento',        color: '#ADB5BD', headerBg: 'rgba(173,181,189,0.08)', accent: '#ADB5BD', borderTop: '#ADB5BD' },
  { id: 'aprovacao',  label: 'Ag. Aprovação',    color: '#FFC107', headerBg: 'rgba(255,193,7,0.08)',   accent: '#FFC107', borderTop: '#FFC107' },
  { id: 'funilaria',  label: 'Em Funilaria',     color: '#3B82F6', headerBg: 'rgba(59,130,246,0.08)',  accent: '#3B82F6', borderTop: '#3B82F6' },
  { id: 'pintura',    label: 'Em Pintura',       color: '#A855F7', headerBg: 'rgba(168,85,247,0.08)',  accent: '#A855F7', borderTop: '#A855F7' },
  { id: 'acabamento', label: 'Acabamento',       color: '#FF6B00', headerBg: 'rgba(255,107,0,0.08)',   accent: '#FF6B00', borderTop: '#FF6B00' },
  { id: 'pronto',     label: 'Pronto p/ Entrega',color: '#28A745', headerBg: 'rgba(40,167,69,0.08)',   accent: '#28A745', borderTop: '#28A745' },
  { id: 'entregue',   label: 'Entregue',         color: '#6C757D', headerBg: 'rgba(108,117,125,0.08)', accent: '#6C757D', borderTop: '#6C757D' },
]
 
export interface OS {
  id:                number
  cliente_nome:      string
  cliente_telefone:  string
  veiculo_placa:     string
  veiculo_modelo:    string
  veiculo_ano:       number
  descricao_servico: string
  valor_estimado:    number | null
  valor_final:       number | null
  status:            string
  data_entrada:      string
  prazo_estimado:    string | null
  updated_at:        string
  dias_na_etapa:     number
  alerta_parada:     boolean
  prazo_vencido:     boolean
}
 
export interface HistoricoOS {
  id:              number
  os_id:           number
  status_anterior: string | null
  status_novo:     string
  criado_em:       string
}
 
export interface DashboardMetrics {
  os_abertas:        number
  os_concluidas_mes: number
  receita_mes:       number
  os_prazo_vencido:  number
  os_paradas:        number
}
 
export interface CreateOSBody {
  cliente_nome:      string
  cliente_telefone:  string
  veiculo_placa:     string
  veiculo_modelo:    string
  veiculo_ano:       number
  descricao_servico: string
  valor_estimado?:   number
  prazo_estimado?:   string
}
 
export interface UpdateOSBody {
  cliente_nome?:      string
  cliente_telefone?:  string
  veiculo_placa?:     string
  veiculo_modelo?:    string
  veiculo_ano?:       number
  descricao_servico?: string
  valor_estimado?:    number
  valor_final?:       number
  status?:            string
  prazo_estimado?:    string
}
