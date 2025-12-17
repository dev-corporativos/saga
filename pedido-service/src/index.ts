import { initializeDatabase } from "./database"
import { initializeRabbitMQ } from "./messaging/rabbitmq"
import express, { Express } from "express"
import { config } from "./config"
import { start } from "node:repl"
import { getChannel, getConnection } from "./messaging/rabbitmq"

const app: Express = express()
app.use(express.json())

const channel = await getChannel()
const connection = await getConnection()

const startServer = async () => {
  try {
    await initializeDatabase()
    await initializeRabbitMQ()

    app.listen(config.service.port, () => {
      console.log(`[Pedido Service] Servidor rodando na porta ${config.service.port}`)
    })
  } catch (error) {
    console.error('Erro ao iniciar o serviço:', error)
    process.exit(1)
  }
}

startServer()

process.on('SIGINT', async () => {
  console.log('[Pedido Service] Encerrando o serviço...')
  if (channel) await channel.close()
  if (connection) await connection.close()
  process.exit(0)
})