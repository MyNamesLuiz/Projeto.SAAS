import type { FastifyRequest, FastifyReply } from 'fastify';
import { getDashboardMetrics } from '../models/dashboard.model.js';

// GET /dashboard
export async function getDashboard(_req: FastifyRequest, reply: FastifyReply) {
  const metrics = getDashboardMetrics();
  return reply.send(metrics);
}
