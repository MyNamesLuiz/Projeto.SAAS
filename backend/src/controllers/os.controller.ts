import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  findAllOS,
  findOSById,
  createOS,
  updateOS,
  deleteOS,
  findHistoricoByOS,
} from '../models/os.model.js';
import type { CreateOSBody, UpdateOSBody } from '../types/index.js';

// GET /os?q=...
export async function listOS(
  req: FastifyRequest<{ Querystring: { q?: string } }>,
  reply: FastifyReply
) {
  const search = req.query.q;
  const data = findAllOS(search);
  return reply.send(data);
}

// GET /os/:id
export async function getOS(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const id = Number(req.params.id);
  if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

  const os = findOSById(id);
  if (!os) return reply.status(404).send({ error: 'OS não encontrada' });

  return reply.send(os);
}

// POST /os
export async function postOS(
  req: FastifyRequest<{ Body: CreateOSBody }>,
  reply: FastifyReply
) {
  const body = req.body;

  // Validação básica
  const required: (keyof CreateOSBody)[] = [
    'cliente_nome',
    'cliente_telefone',
    'veiculo_placa',
    'veiculo_modelo',
    'veiculo_ano',
    'descricao_servico',
  ];

  for (const field of required) {
    if (!body[field] && body[field] !== 0) {
      return reply.status(400).send({ error: `Campo obrigatório ausente: ${field}` });
    }
  }

  const os = createOS(body);
  return reply.status(201).send(os);
}

// PATCH /os/:id
export async function patchOS(
  req: FastifyRequest<{ Params: { id: string }; Body: UpdateOSBody }>,
  reply: FastifyReply
) {
  const id = Number(req.params.id);
  if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

  const updated = updateOS(id, req.body);
  if (!updated) return reply.status(404).send({ error: 'OS não encontrada' });

  return reply.send(updated);
}

// DELETE /os/:id
export async function removeOS(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const id = Number(req.params.id);
  if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

  const ok = deleteOS(id);
  if (!ok) return reply.status(404).send({ error: 'OS não encontrada' });

  return reply.status(204).send();
}

// GET /os/:id/historico
export async function getHistorico(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const id = Number(req.params.id);
  if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

  const os = findOSById(id);
  if (!os) return reply.status(404).send({ error: 'OS não encontrada' });

  const historico = findHistoricoByOS(id);
  return reply.send(historico);
}
