import { pool } from "../database";

export interface Entrega {
  id: string;
  pedidoId: string;
  status: 'PENDENTE' | 'ENTREGUE' | 'CANCELADO';
  created_at: Date;
  updated_at: Date;
}

export const createEntrega = async (entrega: Omit<Entrega, 'created_at' | 'updated_at'>): Promise<Entrega> => {
  const query = `
    INSERT INTO entrega (id, pedido_id, status)
    VALUES ($1, $2, $3)
    RETURNING *;
  `

  const result = await pool.query(query, [
    entrega.id,
    entrega.pedidoId,
    entrega.status,
  ])

  return mapDbEntrega(result.rows[0])
}

export const updateEntregaStatus = async (entregaId: string, status: string): Promise<Entrega | null> => {
  const query = `
    UPDATE entrega
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `

  const result = await pool.query(query, [status, entregaId])

  if (result.rows.length === 0) {
    return null
  }

  return mapDbEntrega(result.rows[0])
}

export const getEntregaByPedidoId = async (pedidoId: string): Promise<Entrega | null> => {
  const query = 'SELECT * FROM entrega WHERE pedido_id = $1;';
  const result = await pool.query(query, [pedidoId]);

  if (result.rows.length === 0) {
    return null;
  }

  return mapDbEntrega(result.rows[0]);
}

const mapDbEntrega = (dbEntrega: any): Entrega => ({
  id: dbEntrega.id,
  pedidoId: dbEntrega.pedido_id,
  status: dbEntrega.status,
  created_at: new Date(dbEntrega.created_at),
  updated_at: new Date(dbEntrega.updated_at),
})