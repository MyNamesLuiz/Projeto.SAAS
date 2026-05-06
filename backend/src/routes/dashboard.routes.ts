import type { FastifyInstance } from 'fastify';
import { getDashboard } from '../controllers/dashboard.controller.js';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard', getDashboard);
}
