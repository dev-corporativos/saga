import { getChannel } from "../messaging/rabbitmq"
import { updatePedidoStatus } from "../services/pedido.service"

export const listenToPagamentoEvents = async (): Promise<void> => {
  await getChannel().consume('pedido.compensation', async (msg: any) => {
    if (!msg) return

    try {
      const event = JSON.parse(msg.content.toString())

      if (event.type === 'PagamentoCancelado' || event.type === 'PagamentoConcluido') {
        console.log('[Pedido Service] Evento de pagamento recebido:', event)

        if (event.type === 'PagamentoCancelado') {
          await updatePedidoStatus(event.pedidoId, 'CANCELADO')
          console.log(`[Pedido Service] Pedido ${event.pedidoId} cancelado devido a falha no pagamento.`)

          await publishEvent({
            type: 'PedidoCancelado',
            pedidoId: event.pedidoId,
            status: event.status,
            timestamp: new Date().toISOString(),
          })
        } else if (event.type === 'PagamentoConcluido' && event.status === 'CONCLUIDO') {
          await updatePedidoStatus(event.pedidoId, 'ENVIADO')
          console.log(`[Pedido Service] Pedido ${event.pedidoId} atualizado para ENVIADO.`)
        }
      }

      getChannel().ack(msg)
    } catch (error) {
      console.error('[Pedido Service] Erro ao processar evento de pagamento:', error)
      getChannel().nack(msg, false, true)
    }
  })
}

export const listenToEntregaEvents = async (): Promise<void> => {
  await getChannel().consume('pedido.events', async (msg: any) => {
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

      getChannel().ack(msg)
    } catch (error) {
      console.error('[Pedido Service] Erro ao processar evento de entrega:', error)
      getChannel().nack(msg, false, true)
    }
  })
}

export const publishEvent = async (event: any): Promise<void> => {
  try {
    getChannel().publish(
      'saga.events',
      '',
      Buffer.from(JSON.stringify(event)),
    )
    console.log('[Pedido Service] Evento publicado:', event)
  } catch (error) {
    console.error('[Pedido Service] Erro ao publicar evento:', error)
  }
}
