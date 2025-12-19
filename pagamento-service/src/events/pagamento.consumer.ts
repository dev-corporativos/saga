import { getChannel } from "../messaging/rabbitmq";
import { updatePagamentoStatus } from "../services/pagamento.service";
import { v4 as uuidv4 } from "uuid";
import { createPagamento } from "../services/pagamento.service";

const pedidosProcessados = new Set<string>();

export const listenToPedidoEvents = async (): Promise<void> => {
  await getChannel().consume("pagamento.events", async (msg: any) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString());

      if (event.type === "PedidoCriado") {
        console.log("[Pagamento Service] Evento de pedido recebido:", event);

        if (pedidosProcessados.has(event.pedidoId)) {
          console.log(`[Pagamento Service] Pedido ${event.pedidoId} já processado, ignorando.`);
          getChannel().ack(msg);
          return;
        }

        pedidosProcessados.add(event.pedidoId);

        const pagamentoId = uuidv4();

        await createPagamento({
          id: pagamentoId,
          pedidoId: event.pedidoId,
          valor: event.valor,
          status: "PENDENTE",
        })

        // 80% de chance de sucesso no pagamento
        const sucessoPagamento = Math.random() > 0.2;

        if (sucessoPagamento) {
          await updatePagamentoStatus(pagamentoId, "CONCLUIDO");
          console.log(`[Pagamento Service] Pagamento ${pagamentoId} aprovado para o pedido ${event.pedidoId}.`);

          await publishEvent({
            type: "PagamentoConcluido",
            pagamentoId,
            pedidoId: event.pedidoId,
            status: "CONCLUIDO",
            valor: event.valor,
            timestamp: new Date().toISOString(),
          });
        } else {
          await updatePagamentoStatus(pagamentoId, "CANCELADO");
          console.log(`[Pagamento Service] Pagamento ${pagamentoId} cancelado para o pedido ${event.pedidoId}.`);

          await publishEvent({
            type: "PagamentoCancelado",
            pagamentoId,
            pedidoId: event.pedidoId,
            status: "CANCELADO",
            valor: event.valor,
            timestamp: new Date().toISOString(),
          });
        }
      }

      getChannel().ack(msg);
    } catch (error) {
      console.error("[Pagamento Service] Erro ao processar evento de pedido:", error);
      getChannel().nack(msg, false, true);
    }
  });
};

export const publishEvent = async (event: any): Promise<void> => {
  try {
    getChannel().publish("saga.events", "", Buffer.from(JSON.stringify(event)));
    console.log("[Pagamento Service] Evento publicado:", event);
  } catch (error) {
    console.error("[Pagamento Service] Erro ao publicar evento:", error);
  }
};
