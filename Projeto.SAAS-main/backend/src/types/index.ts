// Status do Kanban — valores em minúsculo, alinhados com frontend e banco
export type StatusOS =
  | 'orcamento'
  | 'aprovacao'
  | 'funilaria'
  | 'pintura'
  | 'acabamento'
  | 'pronto'
  | 'entregue'

export const STATUS_ORDER: StatusOS[] = [
  'orcamento',
  'aprovacao',
  'funilaria',
  'pintura',
  'acabamento',
  'pronto',
  'entregue',
]

export interface UserPayload {
  id:    number
  email: string
  nome:  string
  role:  'admin' | 'user'
}

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
  prazo_estimado:    string | null
  data_entrada:      string
  updated_at:        string
  dias_na_etapa:     number
  alerta_parada:     boolean
  prazo_vencido:     boolean
}

export interface CreateOSBody {
  cliente_nome:      string
  cliente_telefone:  string
  veiculo_placa:     string
  veiculo_modelo:    string
  veiculo_ano:       number
  descricao_servico: string
  valor_estimado?:   number | null
  valor_final?:      number | null
  prazo_estimado?:   string | null
}

export interface UpdateOSBody {
  cliente_nome?:      string
  cliente_telefone?:  string
  veiculo_placa?:     string
  veiculo_modelo?:    string
  veiculo_ano?:       number
  descricao_servico?: string
  valor_estimado?:    number | null
  valor_final?:       number | null
  status?:            string
  prazo_estimado?:    string | null
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