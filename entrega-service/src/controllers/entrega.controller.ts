import express, { Express, Request, Response } from "express";
import { getEntregaByPedidoId } from "../services/entrega.service";

export const app: Express = express();
app.use(express.json());

app.get("/entregas/:pedidoId", async (req: Request, res: Response) => {
  try {
    const { pedidoId } = req.params;
    const entrega = await getEntregaByPedidoId(pedidoId);

    if (!entrega) {
      return res.status(400).json({ error: '[Entrega Service] Entrega não encontrada.' })
    }
  } catch (error) {
    console.error("[Entrega Service] Erro ao obter entrega:", error);
    res.status(500).json({ error: "[Entrega Service] Erro interno do servidor." });
  }
});