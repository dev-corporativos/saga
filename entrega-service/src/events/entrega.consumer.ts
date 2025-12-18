import { getChannel } from "../messaging/rabbitmq"
import { updateEntregaStatus } from "../services/entrega.service"

export const listenToPagamentoEvents = async (): Promise<void> => {
  await getChannel().consume('entrega.compensation', async (msg: any) => {
    if (!msg) return

    try {
      const event = JSON.parse(msg.content.toString())

      if (event.type === 'PagamentoCancelado' || event.type === 'PagamentoConcluido') {
        console.log('[Entrega Service] Evento de pagamento recebido:', event)

        if (event.type === 'PagamentoCancelado') {
          await updateEntregaStatus(event.entregaId, 'CANCELADO')
          console.log(`[Entrega Service] Entrega ${event.entregaId} cancelada devido a falha no pagamento.`)

          await publishEvent({
            type: 'EntregaCancelada',
            entregaId: event.entregaId,
            timestamp: new Date().toISOString(),
          })
        } else if (event.type === 'PagamentoConcluido' && event.status === 'CONCLUIDO') {
          await updateEntregaStatus(event.entregaId, 'ENVIADO')
          console.log(`[Entrega Service] Entrega ${event.entregaId} atualizada para ENVIADO.`)
        }
      }

      getChannel().ack(msg)
    } catch (error) {
      console.error('[Entrega Service] Erro ao processar evento de pagamento:', error)
      getChannel().nack(msg, false, true)
    }
  })
}

export const listenToEntregaEvents = async (): Promise<void> => {
  await getChannel().consume('entrega.events', async (msg: any) => {
    if (!msg) return

    try {
      const event = JSON.parse(msg.content.toString())

      if (event.type === 'EntregaConcluida') {
        console.log('[Entrega Service] Evento de entrega concluída:', event)

        if (event.status === 'ENTREGUE') {
          await updateEntregaStatus(event.entregaId, 'ENTREGUE')
          console.log(`[Entrega Service] Entrega ${event.entregaId} atualizada para ENTREGUE.`)
        }
      }

      getChannel().ack(msg)
    } catch (error) {
      console.error('[Entrega Service] Erro ao processar evento de entrega:', error)
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