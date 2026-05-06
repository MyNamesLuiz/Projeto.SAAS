import type { FastifyRequest, FastifyReply } from 'fastify';
import { createUser, loginUser } from '../services/auth.service.js';

export async function register(
  req: FastifyRequest<{ Body: { email: string; nome: string; password: string } }>,
  reply: FastifyReply
) {
  const { email, nome, password } = req.body;
  if (!email || !nome || !password) {
    return reply.status(400).send({ success: false, message: 'Campos obrigatórios: email, nome, password', data: null });
  }
  if (password.length < 6) {
    return reply.status(400).send({ success: false, message: 'Senha deve ter mínimo 6 caracteres', data: null });
  }
  try {
    const user = createUser(email, nome, password);
    return reply.status(201).send({ success: true, message: 'Usuário criado com sucesso', data: user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao criar usuário';
    if (msg.includes('UNIQUE')) {
      return reply.status(409).send({ success: false, message: 'E-mail já cadastrado', data: null });
    }
    return reply.status(500).send({ success: false, message: msg, data: null });
  }
}

export async function login(
  req: FastifyRequest<{ Body: { email: string; password: string } }>,
  reply: FastifyReply
) {
  const { email, password } = req.body;
  if (!email || !password) {
    return reply.status(400).send({ success: false, message: 'E-mail e senha são obrigatórios', data: null });
  }
  const result = loginUser(email, password);
  if (!result) {
    return reply.status(401).send({ success: false, message: 'Credenciais inválidas', data: null });
  }
  return reply.send({ success: true, message: 'Login realizado com sucesso', data: result });
}

export async function me(req: FastifyRequest, reply: FastifyReply) {
  // @ts-ignore — user injected by auth middleware
  return reply.send({ success: true, message: 'OK', data: req.user });
}
