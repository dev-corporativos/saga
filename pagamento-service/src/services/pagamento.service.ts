import { pool } from "../database";

export interface Pagamento {
  id: string;
  pedido_id: string;
  valor: number;
  metodo: string;
  status: "PENDENTE" | "COMPLETADO" | "CANCELADO";
  created_at: Date;
  updated_at: Date;
}

export const createPagamento = async (
  pagamento: Omit<Pagamento, "created_at" | "updated_at">
): Promise<Pagamento> => {
  const query = `
    INSERT INTO pagamento (id, pedido_id, valor, metodo, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const result = await pool.query(query, [
    pagamento.id,
    pagamento.pedido_id,
    pagamento.valor,
    pagamento.metodo,
    "PENDENTE",
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

export const getAllPagamentos = async (): Promise<Pagamento[]> => {
  const query = `SELECT * FROM pagamento ORDER BY created_at DESC;`;
  const result = await pool.query(query);
  return result.rows.map(mapDbPagamento);
};

export async function cancelPagamento(pagamentoId: string) {
  await pool.query(
    "UPDATE pagamento SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    ["CANCELLED", pagamentoId]
  );
}

const mapDbPagamento = (dbPagamento: any): Pagamento => ({
  id: dbPagamento.id,
  pedido_id: dbPagamento.pedido_id,
  valor: parseFloat(dbPagamento.valor),
  metodo: dbPagamento.metodo,
  status: dbPagamento.status,
  created_at: new Date(dbPagamento.created_at),
  updated_at: new Date(dbPagamento.updated_at),
});
