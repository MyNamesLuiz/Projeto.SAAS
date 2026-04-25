// Status do Kanban — ordem exata das colunas
export type StatusOS =
  | 'Orcamento'
  | 'Aguardando Aprovacao'
  | 'Em Funilaria'
  | 'Em Pintura'
  | 'Acabamento'
  | 'Pronto para Entrega'
  | 'Entregue';

export const STATUS_ORDER: StatusOS[] = [
  'Orcamento',
  'Aguardando Aprovacao',
  'Em Funilaria',
  'Em Pintura',
  'Acabamento',
  'Pronto para Entrega',
  'Entregue',
];

// Ordem de Serviço completa (retorno da API)
export interface OS {
  id: number;
  cliente_nome: string;
  cliente_telefone: string;
  veiculo_placa: string;
  veiculo_modelo: string;
  veiculo_ano: number;
  descricao_servico: string;
  valor_estimado: number | null;
  valor_final: number | null;
  status: StatusOS;
  prazo_estimado: string | null; // ISO date string YYYY-MM-DD
  data_entrada: string;          // ISO datetime string
  updated_at: string;            // ISO datetime string
  // Campos calculados pelo backend
  dias_na_etapa: number;
  alerta_parada: boolean;        // true se dias_na_etapa > 3
  prazo_vencido: boolean;        // true se prazo_estimado < hoje e status != Entregue
}

// Body para criação de OS (POST /os)
export interface CreateOSBody {
  cliente_nome: string;
  cliente_telefone: string;
  veiculo_placa: string;
  veiculo_modelo: string;
  veiculo_ano: number;
  descricao_servico: string;
  valor_estimado?: number | null;
  valor_final?: number | null;
  prazo_estimado?: string | null;
}

// Body para atualização de OS (PATCH /os/:id)
export interface UpdateOSBody {
  cliente_nome?: string;
  cliente_telefone?: string;
  veiculo_placa?: string;
  veiculo_modelo?: string;
  veiculo_ano?: number;
  descricao_servico?: string;
  valor_estimado?: number | null;
  valor_final?: number | null;
  status?: StatusOS;
  prazo_estimado?: string | null;
}

// Registro de histórico de movimentação
export interface HistoricoOS {
  id: number;
  os_id: number;
  status_anterior: StatusOS | null;
  status_novo: StatusOS;
  criado_em: string; // ISO datetime string
}

// Métricas do Dashboard
export interface DashboardMetrics {
  os_abertas: number;
  os_concluidas_mes: number;
  receita_mes: number;
  os_prazo_vencido: number;
  os_paradas: number; // OSs com alerta_parada = true
}
