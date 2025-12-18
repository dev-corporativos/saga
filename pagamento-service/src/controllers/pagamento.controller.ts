import express, { Express, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { createPagamento, getAllPagamentos } from "../services/pagamento.service";
import { publishEvent } from "../events/pagamento.consumer";

export const app: Express = express();
app.use(express.json());

interface PagamentoCreatedEvent {
  pagamentoId: string;
  pedidoId: string;
  valor: number;
  metodo: string;
  timestamp: string;
}

app.post("/pagamentos", async (req: Request, res: Response) => {
  try {
    const { pedido_id, valor, metodo } = req.body;

    if (!pedido_id || !valor || !metodo) {
      return res.status(400).json({ error: "[Pagamento Service] Campos obrigatórios faltando." });
    }

    const pagamentoId = uuidv4();

    const pagamento = await createPagamento({
      id: pagamentoId,
      pedido_id: pedido_id,
      valor: valor,
      metodo: "CARTAO_CREDITO",
      status: "PENDENTE",
    });

    const pagamentoCreatedEvent: PagamentoCreatedEvent = {
      pagamentoId,
      pedidoId: pedido_id,
      valor,
      metodo,
      timestamp: new Date().toISOString(),
    };

    await publishEvent({
      type: "PagamentoCriado",
      ...pagamentoCreatedEvent,
    });

    res.status(201).json({
      pagamentoId,
      status: pagamento.status,
      message: "[Pagamento Service] Pagamento criado com sucesso.",
    });
  } catch (error) {
    console.error("[Pagamento Service] Erro ao criar pagamento:", error);
    res.status(500).json({ error: "[Pagamento Service] Erro interno do servidor." });
  }
});

app.get("/pagamentos", async (req: Request, res: Response) => {
  try {
    const pagamentos = await getAllPagamentos();
    res.json(pagamentos);
  } catch (error) {
    console.error("[Pagamento Service] Erro ao obter pagamentos:", error);
    res.status(500).json({ error: "[Pagamento Service] Erro interno do servidor." });
  }
});
