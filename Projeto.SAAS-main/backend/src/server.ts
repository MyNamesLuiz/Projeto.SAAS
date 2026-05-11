import Fastify from 'fastify'
import cors from '@fastify/cors'
import './database/database.js'
import { osRoutes } from './routes/os.routes.js'
import { dashboardRoutes } from './routes/dashboard.routes.js'
import { authRoutes } from './routes/auth.routes.js'

const app = Fastify({ logger: true })

app.register(cors, { origin: '*' })

await app.register(authRoutes, { prefix: '/api' })
await app.register(osRoutes, { prefix: '/api/os' })
await app.register(dashboardRoutes, { prefix: '/api/dashboard' })

app.get('/health', async () => {
  return { status: 'ok', project: 'APEX AUTOBODY' }
})

const PORT = Number(process.env.PORT) || 3333

try {
  await app.listen({ port: PORT, host: '0.0.0.0' })
  app.log.info(app.printRoutes())
} catch (err) {
  app.log.error(err)
  process.exit(1)
}