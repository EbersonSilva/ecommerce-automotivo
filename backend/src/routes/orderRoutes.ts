import { Router } from 'express'
import {
  createOrder,
  getOrdersByCustomer,
  getAllOrders,
  getOrderById,
  updateOrderStatus
} from '../controllers/orderController.js'

const router = Router()

/**
 * ==============================================================================
 * ROTAS DE PEDIDOS (Módulo de Criação e Consulta de Pedidos - DRS_LES_1_2026)
 * ==============================================================================
 */

// 1. Criar novo pedido
router.post('/pedidos', createOrder)

// 2. Listar pedidos de um cliente específico
router.get('/clientes/:clienteId/pedidos', getOrdersByCustomer)

// 3. Listar todos os pedidos (Admin)
router.get('/pedidos', getAllOrders)

// 4. Detalhes de um pedido
router.get('/pedidos/:id', getOrderById)

// 5. Atualizar status de um pedido
router.patch('/pedidos/:id/status', updateOrderStatus)

export default router
