import { Request, Response } from "express"
import { createPagamento } from "../services/pagamento.service"

export async function createPagamentoHandler(req: Request, res: Response) {
  const { pedido_id, valor } = req.body

  if (!pedido_id || !valor) {
    return res.status(400).json({ error: 'Pedido ID e valor são obrigatórios.' })
  }

  const pagamento = await createPagamento({ pedido_id, valor, status: 'PENDING' })
  res.status(201).json(pagamento)
}