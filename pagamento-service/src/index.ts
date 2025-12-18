import { initializeDatabase } from "./database"
import { initializeRabbitMQ } from "./messaging/rabbitmq"
import { config } from "./config"
import { getChannel, getConnection } from "./messaging/rabbitmq"
import { app } from "./controllers/pagamento.controller"

const startServer = async () => {
  try {
    await initializeDatabase()
    await initializeRabbitMQ()

    app.listen(config.service.port, () => {
      console.log(`[Pagamento Service] Servidor rodando na porta ${config.service.port}`)
    })
  } catch (error) {
    console.error('Erro ao iniciar o serviço:', error)
    process.exit(1)
  }
}

startServer()

process.on('SIGINT', async () => {
  console.log('[Pagamento Service] Encerrando o serviço...')
  if (getChannel()) await getChannel().close()
  if (getConnection()) await getConnection().close()
  process.exit(0)
})