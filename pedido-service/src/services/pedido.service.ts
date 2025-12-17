import { pool } from "../database";

export interface Pedido {
  id: string;
  produto: string;
  quantidade: number;
  valor: number;
  status: 'PENDENTE' | 'ENVIADO' | 'ENTREGUE' | 'CANCELADO';
  created_at: Date;
  updated_at: Date;
}

export const createPedido = async (pedido: Omit<Pedido, 'created_at' | 'updated_at'>): Promise<Pedido> => {
  const query = `
    INSERT INTO pedido (id, produto, quantidade, valor, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `

  const result = await pool.query(query, [
    pedido.id,
    pedido.produto,
    pedido.quantidade,
    pedido.valor,
    pedido.status,
  ])

  return mapDbPedido(result.rows[0])
}

export const updatePedidoStatus = async (pedidoId: string, status: string): Promise<Pedido | null> => {
  const query = `
    UPDATE pedido
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `

  const result = await pool.query(query, [status, pedidoId])

  if (result.rows.length === 0) {
    return null
  }

  return mapDbPedido(result.rows[0])
}

export const getAllPedidos = async (): Promise<Pedido[]> => {
  const query = `SELECT * FROM pedido ORDER BY created_at DESC;`
  const result = await pool.query(query)
  return result.rows.map(mapDbPedido)
}

const mapDbPedido = (dbPedido: any): Pedido => ({
  id: dbPedido.id,
  produto: dbPedido.produto,
  quantidade: dbPedido.quantidade,
  valor: parseFloat(dbPedido.valor),
  status: dbPedido.status,
  created_at: new Date(dbPedido.created_at),
  updated_at: new Date(dbPedido.updated_at),
})