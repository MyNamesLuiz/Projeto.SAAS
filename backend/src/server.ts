import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initDB } from './db/database.js';
import { osRoutes } from './routes/os.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';

async function bootstrap() {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
    },
  });

  // CORS — aceita qualquer origem em dev; restringir em produção
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Inicializa banco
  await initDB();
  app.log.info('✅ Banco de dados inicializado');

  // Prefixo global de API
  app.register(osRoutes, { prefix: '/api' });
  app.register(dashboardRoutes, { prefix: '/api' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  const PORT = Number(process.env.PORT ?? 3333);
  const HOST = process.env.HOST ?? '0.0.0.0';

  await app.listen({ port: PORT, host: HOST });
  app.log.info(`🚀 APEX API rodando em http://${HOST}:${PORT}`);
}

bootstrap().catch((err) => {
  console.error('Erro fatal ao inicializar:', err);
  process.exit(1);
});
