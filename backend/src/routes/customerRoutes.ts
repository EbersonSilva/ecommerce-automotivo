import { Router } from 'express'
import {
  getAllCustomers,
  getCustomerById,
  getCustomerByCpf,
  createCustomer,
  updateCustomer,
  updateCustomerStatus,
  // deleteCustomer
} from '../controllers/customerController.js'

const router = Router()

/**
 * ==============================================================================
 * ROTAS DA API DE CLIENTES (/api/clientes)
 * ==============================================================================
 * Cada rota mapeia um método HTTP (GET, POST, PUT, PATCH, DELETE) para
 * uma função correspondente no nosso customerController.
 */

// GET /api/clientes -> Lista todos os clientes cadastrados
router.get('/', getAllCustomers)

// GET /api/clientes/:id -> Busca os detalhes de um cliente específico pelo ID
router.get('/:id', getCustomerById)

// GET /api/clientes/cpf/:cpf -> Busca cliente pelo CPF (usado na tela de login/identificação)
router.get('/cpf/:cpf', getCustomerByCpf)

// POST /api/clientes -> Cadastra um novo cliente no banco
router.post('/', createCustomer)

// PUT /api/clientes/:id -> Atualiza todas as informações do cliente
router.put('/:id', updateCustomer)

// PATCH /api/clientes/:id/status -> Alterna status (Ativo / Inativo)
router.patch('/:id/status', updateCustomerStatus)

// DELETE /api/clientes/:id -> Exclui um cliente do banco
// router.delete('/:id', deleteCustomer)

export default router
