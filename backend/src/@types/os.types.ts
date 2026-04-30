// Tipos do módulo de Ordens de Serviço (OS)

export type StatusOS = 
    | 'ORCAMENTO'
    | 'AGUARDANDO_APROVACAO'
    | 'APROVADA'
    | 'FUNILARIA'
    | 'PINTURA'
    | 'ACABAMENTO'
    | 'PRONTO'
    | 'ENTREGUE'
    | 'CANCELADA';

export interface OS {
    id: string;
    cliente_nome: string;
    cliente_telefone: string;
    veiculo_placa: string;
    veiculo_modelo: string;
    veiculo_ano: number;
    descricao: string;
    valorEstimado: number;
    valorFinal?: number;
    status: StatusOS;
    dataEntrada: Date;
    prazoEstimado: Date | null;
    createdAt: Date;
    updatedAt: Date;
    parada?: boolean;
}

export interface OSHistorico {
    id: string
    osId: string
    statusAnterior: StatusOS
    statusNovo: StatusOS
    dataAlteracao: Date
}