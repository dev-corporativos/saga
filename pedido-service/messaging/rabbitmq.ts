import * as amqp from 'amqplib'
import { config } from '../config'
import { listenToPagamentoEvents, listenToEntregaEvents } from '../events/pedido.consumer'

let channel: any
let connection: any

export const initializeRabbitMQ = async (): Promise<void> => {
  try {
    connection = await amqp.connect(config.rabbitmq.url)
    const ch = await connection.createChannel()
    channel = ch as unknown as amqp.Channel

    await channel.assertExchange('saga.events', 'fanout', { durable: true })

    await channel.assertQueue('pedido.events', { durable: true })
    await channel.assertQueue('pedido.compensation', { durable: true })

    await channel.bindQueue('pedido.events', 'saga.events', '')
    await channel.bindQueue('pedido.compensation', 'saga.events', '')

    console.log('[Pedido Service] RabbitMQ conectado.')

    listenToPagamentoEvents()
    listenToEntregaEvents()
  } catch (error) {
    console.error('[Pedido Service] Erro ao conectar ao RabbitMQ:', error)
    throw error
  }
}

export const getChannel = async (): Promise<amqp.Channel> => {
  if (!channel) {
    throw new Error('[Pedido Service] RabbitMQ não inicializado.')
  }
  return channel
}

export const getConnection = async (): Promise<amqp.Channel> => {
  if (!connection) {
    throw new Error('[Pedido Service] RabbitMQ não inicializado.')
  }
  return connection
}