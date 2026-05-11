import 'fastify'
import type { UserPayload } from './index.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserPayload
  }
}