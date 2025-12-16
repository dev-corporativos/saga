import amqp from 'amqplib'
import { config } from '../config'

let channel: amqp.Channel

export async function connectRabbitMQ(): Promise<amqp.Channel> {
  const conn = await amqp.connect(config.rabbitmq.url)
  channel = await conn.createChannel()

  await channel.assertExchange('saga.events', 'fanout', { durable: true })

  return channel
}

export function getChannel() {
  return channel
}