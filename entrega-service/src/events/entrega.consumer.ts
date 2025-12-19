import { getChannel } from "../messaging/rabbitmq"
import { createEntrega, updateEntregaStatus } from "../services/entrega.service"
import { v4 as uuidv4 } from 'uuid'

let pedidosProcessados = new Set<string>()

export const listenToPagamentoEvents = async (): Promise<void> => {
  await getChannel().consume('entrega.events', async (msg: any) => {
    if (!msg) return

    try {
      const event = JSON.parse(msg.content.toString())
      const eventKey = `${event.type}-${event.pedidoId}`

      if (pedidosProcessados.has(eventKey)) {
        console.log(`[Entrega Service] Evento ${eventKey} já processado, ignorando.`)
        getChannel().ack(msg)
        return
      }

      if (event.type === 'PagamentoConcluido' && event.status === 'CONCLUIDO') {
        console.log('[Entrega Service] Evento de pagamento concluído recebido:', event)
        pedidosProcessados.add(eventKey)

        const entregaId = uuidv4()

        await createEntrega({
          id: entregaId,
          pedidoId: event.pedidoId,
          status: 'PENDENTE',
        })

        console.log(`[Entrega Service] Enviando pedido ${event.pedidoId}.`)

        await updateEntregaStatus(entregaId, 'ENVIADO')
        console.log(`[Entrega Service] Entrega ${entregaId} atualizada para ENVIADO.`)

        await publishEvent({
          type: 'EntregaConcluida',
          entregaId: entregaId,
          pedidoId: event.pedidoId,
          status: 'ENTREGUE',
          timestamp: new Date().toISOString(),
        })
      } else if (event.type === 'PagamentoCancelado' && event.status === 'CANCELADO') {
        console.log('[Entrega Service] Evento de pagamento cancelado recebido:', event)
        pedidosProcessados.add(eventKey)

        const entregaId = uuidv4()

        await createEntrega({
          id: entregaId,
          pedidoId: event.pedidoId,
          status: 'PENDENTE',
        })

        console.log(`[Entrega Service] Entrega cancelada para o pedido ${event.pedidoId}.`)

        await updateEntregaStatus(entregaId, 'CANCELADO')
        console.log(`[Entrega Service] Entrega ${entregaId} atualizada para CANCELADO.`)

        await publishEvent({
          type: 'EntregaCancelada',
          entregaId: entregaId,
          pedidoId: event.pedidoId,
          status: 'CANCELADO',
          timestamp: new Date().toISOString(),
        })
      }

      getChannel().ack(msg)
    } catch (error) {
      console.error('[Entrega Service] Erro ao processar evento de pagamento:', error)
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
    console.log('[Entrega Service] Evento publicado:', event)
  } catch (error) {
    console.error('[Entrega Service] Erro ao publicar evento:', error)
  }
}