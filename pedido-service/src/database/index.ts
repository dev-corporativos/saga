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
      CREATE TABLE IF NOT EXISTS pedido (
        id VARCHAR(36) PRIMARY KEY,
        produto VARCHAR(150) NOT NULL,
        quantidade INT NOT NULL,
        valor DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_pedido_status ON pedido(status);
    `)

    console.log('Banco de dados do Pedido Service inicializado.')
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados do Pedido Service:', error)
    throw error
  }
}