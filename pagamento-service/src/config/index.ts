import dotenv from 'dotenv'

dotenv.config()

export const config = {
  service: {
    name: process.env.SERVICE_NAME || 'pagamento-service',
    port: parseInt(process.env.SERVICE_PORT || '3002', 10),
  },
  database: {
    host: process.env.DB_HOST! || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    user: process.env.DB_USER! || 'pagamentouser',
    password: process.env.DB_PASS! || 'pagamentopass',
    name: process.env.DB_NAME! || 'pagamentodb',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672',
  },
};