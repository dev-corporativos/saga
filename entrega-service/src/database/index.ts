import { Pool } from 'pg'
import { config } from '../config'

export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
})

export const initializeDatabase = async (): Promise<void> => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS entrega (
        id VARCHAR(36) PRIMARY KEY,
        pedido_id VARCHAR(36) NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_entrega_status ON entrega(status);
      CREATE INDEX IF NOT EXISTS idx_entrega_pedido ON entrega(pedido_id);
    `)

    console.log('Banco de dados do Entrega Service inicializado.')
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados do Entrega Service:', error)
    throw error
  }
}