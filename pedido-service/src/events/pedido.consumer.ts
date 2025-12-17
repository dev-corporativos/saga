import { getChannel } from "../messaging/rabbitmq"
import { updatePedidoStatus } from "../services/pedido.service"

const channel = getChannel()

export const listenToPagamentoEvents = async (): Promise<void> => {
  await channel.consume('pedido.compensation', async (msg: any) => {
    if (!msg) return

    try {
      const event = JSON.parse(msg.content.toString())

      if (event.type === 'PagamentoFalhado' || event.type === 'PagamentoProcessado') {
        console.log('[Pedido Service] Evento de pagamento recebido:', event)

        if (event.type === 'PagamentoFalhado') {
          await updatePedidoStatus(event.pedidoId, 'CANCELADO')
          console.log(`[Pedido Service] Pedido ${event.pedidoId} cancelado devido a falha no pagamento.`)

          await publishEvent({
            type: 'PedidoCancelado',
            pedidoId: event.pedidoId,
            timestamp: new Date().toISOString(),
          })
        } else if (event.type === 'PagamentoProcessado' && event.status === 'CONCLUIDO') {
          await updatePedidoStatus(event.pedidoId, 'ENVIADO')
          console.log(`[Pedido Service] Pedido ${event.pedidoId} atualizado para ENVIADO.`)
        }
      }

      channel.ack(msg)
    } catch (error) {
      console.error('[Pedido Service] Erro ao processar evento de pagamento:', error)
      channel.nack(msg, false, true)
    }
  })
}

export const listenToEntregaEvents = async (): Promise<void> => {
  await channel.consume('pedido.events', async (msg: any) => {
    if (!msg) return

    try {
      const event = JSON.parse(msg.content.toString())

      if (event.type === 'EntregaConcluida') {
        console.log('[Pedido Service] Evento de entrega recebido:', event)

        if (event.status === 'ENTREGUE') {
          await updatePedidoStatus(event.pedidoId, 'ENTREGUE')
          console.log(`[Pedido Service] Pedido ${event.pedidoId} atualizado para ENTREGUE.`)
        }
      }

      channel.ack(msg)
    } catch (error) {
      console.error('[Pedido Service] Erro ao processar evento de entrega:', error)
      channel.nack(msg, false, true)
    }
  })
}

export const publishEvent = async (event: any): Promise<void> => {
  try {
    channel.publish(
      'saga.events',
      '',
      Buffer.from(JSON.stringify(event)),
    )
    console.log('[Pedido Service] Evento publicado:', event)
  } catch (error) {
    console.error('[Pedido Service] Erro ao publicar evento:', error)
  }
}