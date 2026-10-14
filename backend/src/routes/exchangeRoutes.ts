import { Router } from 'express'
import {
  createExchange,
  getAllExchanges,
  getExchangesByCustomer,
  updateExchangeStatus
} from '../controllers/exchangeController.js'

const router = Router({ mergeParams: true })

// 1. Listar todas as trocas (Admin)
router.get('/', getAllExchanges)

// 2. Criar solicitação de troca
router.post('/', createExchange)

// 3. Listar trocas de um cliente específico
router.get('/cliente/:clienteId', getExchangesByCustomer)

// 4. Atualizar status de uma troca (Aprovar, Despachar, Receber, Processar)
router.patch('/:id/status', updateExchangeStatus)

export default router
