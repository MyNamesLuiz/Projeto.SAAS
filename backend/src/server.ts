import Fastify from 'fastify'
import cors from '@fastify/cors'
import './database/database.js'
import { osRoutes } from './routes/os.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';

const app = Fastify({ logger: true })

app.register(cors, { origin: '*' })
await app.register(osRoutes, { prefix: '/os' });
await app.register(dashboardRoutes, { prefix: '/dashboard' })
app.get('/health', async () => {
  return { status: 'ok', project: 'APEX AUTOBODY' }
})

// await app.ready()
// console.log('🚀 Servidor rodando em http://localhost:3333')
// console.log(app.printRoutes()) // Imprime as rotas para verificação

// try {
//   await app.listen({ port: 3333, host: '0.0.0.0' });
// } catch (err) {
//   app.log.error(err);
//   process.exit(1);
// }

await app.listen({ port: 3333 }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  app.log.info(app.printRoutes());
})