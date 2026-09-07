import pkg from 'pg'
import dotenv from 'dotenv'

// Carrega as variáveis definidas no arquivo .env (DB_HOST, DB_USER, etc.)
dotenv.config()

const { Pool } = pkg

/**
 * CONFIGURAÇÃO DO POOL DE CONEXÕES DO POSTGRESQL:
 * 
 * O 'Pool' gerencia várias conexões com o banco de dados de forma automática.
 * Em vez de abrir e fechar uma conexão a cada requisição (o que seria muito lento),
 * o Pool reaproveita conexões abertas, tornando a aplicação muito mais rápida e eficiente.
 */
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ecommerce',
})

/**
 * Evento acionado quando uma nova conexão é criada com sucesso no PostgreSQL
 */
pool.on('connect', () => {
  console.log('📦 [PostgreSQL] Conexão bem-sucedida com o banco de dados!')
})

/**
 * Evento acionado caso ocorra algum erro inesperado em uma conexão ociosa
 */
pool.on('error', (err) => {
  console.error('❌ [PostgreSQL] Erro inesperado na conexão:', err)
})

/**
 * Função utilitária para executar queries SQL parametrizadas de forma segura.
 * As queries parametrizadas ($1, $2, etc.) protegem a aplicação contra ataques de SQL Injection.
 */
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params)
}
