import { getChannel } from "../messaging/rabbitmq"
import { cancelPagamento } from "../services/pagamento.service"

export async function listenPagamentoEvents() {
  const channel = getChannel()

  const queue = await channel.assertQueue('pagamento.events', { durable: true })
  await channel.bindQueue(queue.queue, 'saga.events', '')

  channel.consume(queue.queue, async msg => {
    if (!msg) return

    const event = JSON.parse(msg.content.toString())

    if (event.type === 'EntregaFalhou') {
      console.log('[Pagamento Service] Entrega falhou, cancelando pagamento')
      await cancelPagamento(event.pagamentoId)
    }

    channel.ack(msg)
  })
}