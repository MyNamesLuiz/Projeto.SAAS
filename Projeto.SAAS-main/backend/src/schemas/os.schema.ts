// Schemas do módulo de Ordens de Serviço (OS)
// Validções do ZOD

import { z } from 'zod'

export const createOSSchema = z.object({
    nomeCliente: z.string().min(2),
    telefone: z.string().min(8),
    placa: z.string().min(7).max(8),
    modelo: z.string(),
    ano: z.number().int().min(1900).max(new Date().getFullYear()),
    descricao: z.string(),
    valorEstimado: z.number(),
    prazoEntrega: z.string().transform((date) => new Date(date)),
    status: z.enum(['aberta', 'em andamento', 'concluída']),
})

export const updateOSSchema = z.object({
    nomeCliente: z.string().min(2).optional(),
    telefone: z.string().min(8).optional(),
    placa: z.string().min(7).max(8).optional(),
    modelo: z.string().optional(),
    ano: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
    descricao: z.string().optional(),
    valorEstimado: z.number().optional(),
    valorFinal: z.number().optional(),
    status: z.enum(['aberta', 'em andamento', 'concluída']).optional(),
    prazoEntrega: z
      .string()
      .optional()
      .transform((date) => (date ? new Date(date) : undefined)), // Converte a string para Date
})