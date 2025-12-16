import express from 'express'
import { config } from './config'
import { initializeDatabase } from './database'
import { connectRabbitMQ } from './messaging/rabbitmq'
import { createPagamentoHandler } from './controllers/pagamento.controller'
import { listenPagamentoEvents } from './events/pagamento.consumer'

const app = express()
app.use(express.json())

app.post('/pagamentos', createPagamentoHandler)

async function start() {
  await initializeDatabase()
  await connectRabbitMQ()
  await listenPagamentoEvents()

  app.listen(config.service.port, () => {
    console.log(`${config.service.name} rodando na porta ${config.service.port}`)
  })
}

start()