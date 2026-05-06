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
  app.get('/', listOS);

  // Buscar uma OS por ID
  app.get('/:id', getOS);

  // Criar nova OS
  app.post('/', postOS);

  // Atualizar OS (inclui mudança de status via drag & drop)
  app.patch('/:id', patchOS);

  // Deletar OS
  app.delete('/:id', removeOS);

  // Histórico de movimentações de uma OS
  app.get('/:id/historico', getHistorico);
}
