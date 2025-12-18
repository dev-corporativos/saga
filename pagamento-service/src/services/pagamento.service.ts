import { pool } from "../database";

export interface Pagamento {
  id: string;
  pedidoId: string;
  valor: number;
  status: "PENDENTE" | "CONCLUIDO" | "CANCELADO";
  created_at: Date;
  updated_at: Date;
}

export const createPagamento = async (
  pagamento: Omit<Pagamento, "created_at" | "updated_at">
): Promise<Pagamento> => {
  const query = `
    INSERT INTO pagamento (id, pedido_id, valor, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const result = await pool.query(query, [
    pagamento.id,
    pagamento.pedidoId,
    pagamento.valor,
    pagamento.status,
  ]);

  return mapDbPagamento(result.rows[0]);
};

export const updatePagamentoStatus = async (
  pagamentoId: string,
  status: string
): Promise<Pagamento | null> => {
  const query = `
    UPDATE pagamento
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `;

  const result = await pool.query(query, [status, pagamentoId]);

  if (result.rows.length === 0) {
    return null;
  }

  return mapDbPagamento(result.rows[0]);
};

export const getPagamentosByPedidoId = async (pedidoId: string): Promise<Pagamento | null> => {
  const query = 'SELECT * FROM pagamento WHERE pedido_id = $1;';
  const result = await pool.query(query, [pedidoId]);

  if (result.rows.length === 0) {
    return null;
  }

  return mapDbPagamento(result.rows[0]);
}

const mapDbPagamento = (dbPagamento: any): Pagamento => ({
  id: dbPagamento.id,
  pedidoId: dbPagamento.pedido_id,
  valor: parseFloat(dbPagamento.valor),
  status: dbPagamento.status,
  created_at: new Date(dbPagamento.created_at),
  updated_at: new Date(dbPagamento.updated_at),
});
