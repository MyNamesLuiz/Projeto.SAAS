import Fastify from 'fastify'
import cors from '@fastify/cors'

const app = Fastify({ logger: true })

app.register(cors, { origin: '*' })

app.get('/health', async () => {
  return { status: 'ok', project: 'APEX AUTOBODY' }
})

app.listen({ port: 3333 }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})