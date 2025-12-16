import { v4 as uuidv4 } from "uuid"
import { pool } from "../database"
import { getChannel } from "../messaging/rabbitmq"

export interface Pagamento {
  id: string
  pedido_id: string
  valor: number
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  created_at: Date
  updated_at: Date
}

export const createPagamento = async (pagamento: Omit<Pagamento, 'id' | 'created_at' | 'updated_at'>): Promise<Pagamento> => {
  const id = uuidv4()

  const query = `
    INSERT INTO pagamentos (id, pedido_id, valor, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const result = await pool.query(query, [
    id,
    pagamento.pedido_id,
    pagamento.valor,
    'PENDING',
  ]);

  getChannel().publish(
    'saga.events',
    '',
    Buffer.from(
      JSON.stringify({
        event: 'PagamentoCreated',
        data: {
          id,
          pedido_id: pagamento.pedido_id,
          valor: pagamento.valor,
          status: 'PENDING',
          timestamp: new Date().toISOString(),
        },
      })
    )
  )

  console.log(`PagamentoCreated event published for pedido ID: ${id}`)

  return mapDbPagamento(result.rows[0]);
}

export async function cancelPagamento(pagamentoId: string) {
  await pool.query(
    'UPDATE pagamentos SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    ['CANCELLED', pagamentoId]
  )
}

const mapDbPagamento = (dbPagamento: any): Pagamento => ({
  id: dbPagamento.id,
  pedido_id: dbPagamento.pedido_id,
  valor: dbPagamento.valor,
  status: dbPagamento.status,
  created_at: new Date(dbPagamento.created_at),
  updated_at: new Date(dbPagamento.updated_at),
})