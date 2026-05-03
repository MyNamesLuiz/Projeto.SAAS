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
  status: string; // poderia tipar melhor depois
  prazo_estimado: string | null;
  data_entrada: string;
  updated_at: string;
  dias_na_etapa: number;
  alerta_parada: boolean;
  prazo_vencido: boolean;
}
