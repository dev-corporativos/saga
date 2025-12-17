import express, { Express, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { createPedido, getAllPedidos } from '../services/pedido.service'
import { publishEvent } from '../events/pedido.consumer'

const app: Express = express()
app.use(express.json())

interface PedidoCreatedEvent {
  pedidoId: string,
  produto: string,
  quantidade: number,
  valor: number,
  timestamp: string,
}

app.post('/pedidos', async (req: Request, res: Response) => {
  try {
    const { produto, quantidade, valor } = req.body

    if (!produto || !quantidade || !valor) {
      return res.status(400).json({ error: '[Pedido Service] Campos obrigatórios faltando.' })
    }

    const pedidoId = uuidv4()

    const pedido = await createPedido({
      id: pedidoId,
      produto: produto,
      quantidade: quantidade,
      valor: valor,
      status: 'PENDENTE',
    })

    const pedidoCreatedEvent: PedidoCreatedEvent = {
      pedidoId,
      produto,
      quantidade,
      valor,
      timestamp: new Date().toISOString(),
    }

    await publishEvent({
      type: 'PedidoCriado',
      ...pedidoCreatedEvent,
    })

    res.status(201).json({
      pedidoId,
      status: pedido.status,
      message: '[Pedido Service] Pedido criado com sucesso.',
    })
  } catch (error) {
    console.error('[Pedido Service] Erro ao criar pedido:', error)
    res.status(500).json({ error: '[Pedido Service] Erro interno do servidor.' })
  }
})

app.get('/pedidos', async (req: Request, res: Response) => {
  try {
    const pedidos = await getAllPedidos()
    res.json(pedidos)
  } catch (error) {
    console.error('[Pedido Service] Erro ao obter pedidos:', error)
    res.status(500).json({ error: '[Pedido Service] Erro interno do servidor.' })
  }
})