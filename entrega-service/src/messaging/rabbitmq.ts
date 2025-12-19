import * as amqp from 'amqplib'
import { config } from '../config'
import { listenToPagamentoEvents } from '../events/entrega.consumer'

let channel: any
let connection: any

export const initializeRabbitMQ = async (): Promise<void> => {
  try {
    connection = await amqp.connect(config.rabbitmq.url)
    channel = await connection.createChannel()

    await channel.assertExchange('saga.events', 'fanout', { durable: true })

    await channel.assertQueue('entrega.events', { durable: true })

    await channel.bindQueue('entrega.events', 'saga.events', '')

    console.log('[Entrega Service] RabbitMQ conectado.')

    listenToPagamentoEvents()
  } catch (error) {
    console.error('[Entrega Service] Erro ao conectar ao RabbitMQ:', error)
    setTimeout(initializeRabbitMQ, 5000)
    throw error
  }
}

export const getChannel = (): amqp.Channel => {
  if (!channel) {
    throw new Error('[Entrega Service] RabbitMQ não inicializado.')
  }
  return channel
}

export const getConnection = (): amqp.Channel => {
  if (!connection) {
    throw new Error('[Entrega Service] RabbitMQ não inicializado.')
  }
  return connection
}