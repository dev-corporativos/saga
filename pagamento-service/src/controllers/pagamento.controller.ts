import express, { Express, Request, Response } from "express";
import { getPagamentosByPedidoId } from "../services/pagamento.service";

export const app: Express = express();
app.use(express.json());

app.get("/pagamentos/:pedidoId", async (req: Request, res: Response) => {
  try {
    const { pedidoId } = req.params;
    const pagamento = await getPagamentosByPedidoId(pedidoId);

    if (!pagamento) {
      return res.status(400).json({ error: '[Pagamento Service] Pagamento não encontrado.' })
    }
  } catch (error) {
    console.error("[Pagamento Service] Erro ao obter pagamento:", error);
    res.status(500).json({ error: "[Pagamento Service] Erro interno do servidor." });
  }
});
