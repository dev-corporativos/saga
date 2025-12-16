import { Pool } from 'pg'
import { config } from '../config'
import { Pagamento } from '../services/pagamento.service'

export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
})

export const initializeDatabase = async (): Promise<void> => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pagamentos (
        id VARCHAR(36) PRIMARY KEY,
        pedido_id VARCHAR(36) NOT NULL UNIQUE,
        valor INT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
      CREATE INDEX IF NOT EXISTS idx_pagamentos_pedidos ON pagamentos(pedido_id);
    `)
    console.log('Banco de dados de Pagamento Service inicializado.')
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error)
    throw error
  }
}