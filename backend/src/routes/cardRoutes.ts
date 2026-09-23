import { Router } from 'express'
import {
  getCardsByCustomer,
  createCard,
  setPreferredCard,
  deleteCard
} from '../controllers/cardController.js'

// mergeParams: true permite acessar o parâmetro ':clienteId' vindo do server.ts
const router = Router({ mergeParams: true })

// 1. Listar todos os cartões de um cliente específico
// GET /api/clientes/:clienteId/cartoes
router.get('/', getCardsByCustomer)

// 2. Cadastrar novo cartão para o cliente
// POST /api/clientes/:clienteId/cartoes
router.post('/', createCard)

// 3. Definir um cartão específico como preferencial (RF0027)
// PATCH /api/clientes/:clienteId/cartoes/:id/preferencial
router.patch('/:id/preferencial', setPreferredCard)

// 4. Excluir cartão do cliente
// DELETE /api/clientes/:clienteId/cartoes/:id
router.delete('/:id', deleteCard)

export default router
