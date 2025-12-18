import dotenv from 'dotenv';

dotenv.config();

export const config = {
  service: {
    name: process.env.SERVICE_NAME || 'entrega-service',
    port: parseInt(process.env.SERVICE_PORT || '3003', 10),
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434', 10),
    user: process.env.DB_USER || 'entregauser',
    password: process.env.DB_PASSWORD || 'entregapass',
    database: process.env.DB_NAME || 'entregadb',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  },
};