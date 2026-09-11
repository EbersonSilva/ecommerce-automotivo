import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import customerRoutes from './routes/customerRoutes.js'
import { query } from './database/db.js'
import addressRoutes from './routes/addressRoutes.js'

// Carrega variáveis do arquivo .env
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares essenciais
app.use(cors()) // Permite que o frontend React acesse este backend
app.use(express.json()) // Habilita o Express a receber dados no formato JSON (req.body)

// ROTA DE STATUS DA API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    message: '🚀 Backend do E-commerce Automotivo está online!',
    timestamp: new Date().toISOString()
  })
})

// ROTA DE TESTE DE CONEXÃO COM O POSTGRESQL
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as "serverTime", current_database() as "databaseName"')
    res.json({
      status: 'success',
      message: '✅ Conexão com o banco PostgreSQL está funcionando perfeitamente!',
      data: result.rows[0]
    })
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: '❌ Falha ao conectar ao banco de dados PostgreSQL.',
      error: error.message
    })
  }
})

// REGISTRO DOS MÓDULOS DE ROTAS
app.use('/api/clientes', customerRoutes)
app.use('/api/clientes/:clienteId/enderecos', addressRoutes)
// INICIALIZAÇÃO DO SERVIDOR
app.listen(PORT, () => {
  console.log(`=======================================================`)
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
  console.log(`🔗 Teste do Banco:   http://localhost:${PORT}/api/db-test`)
  console.log(`👥 Rota de Clientes: http://localhost:${PORT}/api/clientes`)
  console.log(`=======================================================`)
})
