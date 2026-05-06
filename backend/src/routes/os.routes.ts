import type { FastifyInstance } from 'fastify';
import {
  listOS,
  getOS,
  postOS,
  patchOS,
  removeOS,
  getHistorico,
} from '../controllers/os.controller.js';

export async function osRoutes(app: FastifyInstance) {
  // Listar todas as OSs (com busca opcional via ?q=)
  app.get('/os', listOS);

  // Buscar uma OS por ID
  app.get('/os/:id', getOS);

  // Criar nova OS
  app.post('/os', postOS);

  // Atualizar OS (inclui mudança de status via drag & drop)
  app.patch('/os/:id', patchOS);

  // Deletar OS
  app.delete('/os/:id', removeOS);

  // Histórico de movimentações de uma OS
  app.get('/os/:id/historico', getHistorico);
}
