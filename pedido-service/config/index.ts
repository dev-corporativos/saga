import dotenv from 'dotenv';

dotenv.config();

export const config = {
  service: {
    name: process.env.SERVICE_NAME || 'pedido-service',
    port: parseInt(process.env.SERVICE_PORT || '3001', 10),
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'pedidouser',
    password: process.env.DB_PASSWORD || 'pedidopass',
    database: process.env.DB_NAME || 'pedidodb',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  },
};
