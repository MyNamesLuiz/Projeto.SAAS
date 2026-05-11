import type { FastifyRequest, FastifyReply } from 'fastify'
import { validateToken } from '../services/auth.service.js'

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ sucess: false, message: 'Token de autenticação ausente', data: null })
  }
  const token = authHeader.slice(7)
  const user = validateToken(token)
  if (!user) {
    return reply.status(401).send({ sucess: false, message: 'Token de autenticação inválido ou expirado', data: null })
  }
  req.user = user
}