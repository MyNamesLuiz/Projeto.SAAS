import { z } from 'zod';

export const osSchema = z.objet({
    nomeCliente: z.string(),
    telefone: z.string(),
    placa: z.string(),
    modelo: z.string(),
    cor: z.string(),
    ano: z.number(),
    descricao: z.string(),
    valorEstimado: z.number(),
    valorFinal: z.number().optional(),
    status: z.enum([
        'ORCAMENTO',
        'AGUARDANDO_APROVACAO',
        'FUNILARIA',
        'PINTURA',
        'ACABAMENTO',
        'PRONTO',
        'ENTREGUE',
    ]),
    dataEntrada: z.string(),
    prazoEntrega: z.string(),
    observacoesInternas: z.string().optional(),
});

export const updateSchema = osSchema.partial();