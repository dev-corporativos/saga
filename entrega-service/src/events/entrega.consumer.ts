import { getChannel } from "../messaging/rabbitmq";
import { updateEntregaStatus, createEntrega } from "../services/entrega.service";
import { v4 as uuidv4 } from "uuid";

const pedidosProcessados = new Set<string>();
export const listenToPedidoEvents = async (): Promise<void> => {
    await getChannel().consume("entrega.events", async (msg: any) => {
        if (!msg) return;

        try {
            const event = JSON.parse(msg.content.toString());
            if(event.type === "PagamentoRealizado"){
                console.log("[Entrega Service] Evento recebido:", event);

                if(pedidosProcessados.has(event.pedidoId)){
                    console.log(`[Entrega Service] Pedido ${event.pedidoId} já processado, ignorando.`);getChannel().ack(msg);return;
                }
                
                pedidosProcessados.add(event.pedidoId);
                const entregaId = uuidv4();

                await createEntrega({
                id: entregaId,
                pedido_id: event.pedidoId,
                status: "PENDENTE",
                })

                const sucessoEntrega = Math.random() > 0.1;
                if (sucessoEntrega){
                    // Simular envio do pedido
                    console.log(`[Entrega Service] Enviando pedido`);
                    await new Promise(resolve => setTimeout(resolve, 500)); // Simular envio de email
                    // Atualizar status da entrega
                    await updateEntregaStatus(entregaId, 'ENVIADA');

                    // Simular pedido entregue
                    console.log(`[Entrega Service] Pedido sendo entregue`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    // Atualizar status da entrega
                    await updateEntregaStatus(entregaId, 'ENTREGUE');
                    console.log(`[Entrega Service] Pedido entregue ${event.pedidoId}`);
                    // Publicar evento de entrega
                    await publishEvent({
                        type: "PedidoEntregue",
                        entregaId,
                        pedidoId: event.pedidoId,
                        status: "ENTREGUE",
                        timestamp: new Date().toISOString(),
                    });
                }
                else{
                    await updateEntregaStatus(entregaId, "CANCELADA")
                    console.log(`[Entrega Service] Entrega ${entregaId} cancelada do pedido ${event.pedidoId}.`);

                    await publishEvent({
                        type: "EntregaCancelada",
                        entregaId,
                        pedidoId: event.pedidoId,
                        status: "CANCELADA",
                        timestamp: new Date().toISOString(),
                    });
                }
            }
            getChannel().ack(msg);
        } catch (error) {
            console.error("[Entrega Service] Erro ao publicar evento:", error);
        }
    })
}

export const publishEvent = async (event: any): Promise<void> => {
  try {
    getChannel().publish("saga.events", "", Buffer.from(JSON.stringify(event)));
    console.log("[Entrega Service] Evento publicado:", event);
  } catch (error) {
    console.error("[Entrega Service] Erro ao publicar evento:", error);
  }
};